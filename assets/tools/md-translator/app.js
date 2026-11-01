/**
 * Markdown 中文 → 英文 本地翻译工具
 * 纯前端 + 本地 Ollama（localhost:11434），不上传任何内容到外部网络。
 * 保护策略：front matter / 围栏代码块 / 行内代码 / 链接 URL / 图片 URL / 术语词表
 * 全部用占位符替换，译完原样还原，避免模型破坏 Markdown 结构。
 */
(function () {
  'use strict';

  // ---------- DOM ----------
  var $ = function (id) { return document.getElementById(id); };
  var input = $('mdt-input');
  var output = $('mdt-output');
  var statusEl = $('mdt-status');
  var modelEl = $('mdt-model');
  var baseEl = $('mdt-base');
  var glossaryEl = $('mdt-glossary');
  var styleEl = $('mdt-style');

  var state = {
    translating: false,
    outputText: ''
  };

  // ---------- 状态提示 ----------
  function setStatus(msg, type) {
    statusEl.textContent = msg || '';
    statusEl.className = 'mdt-status' + (type ? ' mdt-status-' + type : '');
  }

  // ---------- 占位符保护 ----------
  // 把需要保护的内容替换成 [[KIND_n]] 占位符，返回 { text, store }
  function protect(text) {
    var store = [];
    function stash(kind, value) {
      var idx = store.length;
      store.push(value);
      return '[[' + kind + '_' + idx + ']]';
    }

    // 1) 围栏代码块 ```lang\n...\n```  或 ~~~
    text = text.replace(/([`~]{3,})([^\n`~]*)\n([\s\S]*?)\n?\1/g, function (_, fence, lang, code) {
      return stash('CODE', fence + (lang || '') + '\n' + code + '\n' + fence);
    });

    // 2) 行内代码 `code`
    text = text.replace(/`([^`\n]+)`/g, function (_, code) {
      return stash('INLINE', '`' + code + '`');
    });

    // 3) 图片 ![alt](url "title") —— alt 保留可译，url 与 title 锁死
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, alt, url, title) {
      return '![' + alt + '](' + stash('URL', url) + (title ? ' "' + title + '"' : '') + ')';
    });

    // 4) 链接 [text](url "title") —— text 可译，url 与 title 锁死
    //    (?<!) 负向后顾排除图片前缀 "!["，避免把图片里的 [alt](url) 误当成链接嵌套占位
    text = text.replace(/(?<!!)\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, txt, url, title) {
      return '[' + txt + '](' + stash('URL', url) + (title ? ' "' + title + '"' : '') + ')';
    });

    return { text: text, store: store };
  }

  // 还原占位符
  function restore(text, store) {
    return text.replace(/\[\[([A-Z]+)_(\d+)\]\]/g, function (_, kind, n) {
      var v = store[parseInt(n, 10)];
      return v === undefined ? ('[[' + kind + '_' + n + ']]') : v;
    });
  }

  // 术语保护：用占位符临时替换术语词，译完还原（避免被翻译）
  function protectTerms(text, terms) {
    if (!terms.length) return { text: text, map: [] };
    var map = [];
    terms.forEach(function (term) {
      if (!term) return;
      // 大小写不敏感，整词匹配
      var re = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      text = text.replace(re, function (m) {
        var idx = map.length;
        map.push(m);
        return '[[' + 'TERM' + '_' + idx + ']]';
      });
    });
    return { text: text, map: map };
  }

  function restoreTerms(text, map) {
    if (!map.length) return text;
    return text.replace(/\[\[TERM_(\d+)\]\]/g, function (_, n) {
      return map[parseInt(n, 10)] || ('[[TERM_' + n + ']]');
    });
  }

  // ---------- front matter 处理 ----------
  function splitFrontMatter(md) {
    var m = md.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) return { fm: '', body: md };
    return { fm: m[0], body: md.slice(m[0].length) };
  }

  // 翻译 front matter 中的 title / description（其余键原样）
  function translateFrontMatter(fmBlock, translate) {
    if (!fmBlock) return Promise.resolve(fmBlock);
    // 仅抽取 title / description 行进行翻译
    var lines = fmBlock.split('\n');
    var jobs = [];
    lines.forEach(function (line, i) {
      var mm = line.match(/^(title|description):\s?(.*)$/);
      if (mm) {
        var key = mm[1];
        var val = mm[2].replace(/^["']|["']$/g, '');
        if (val && /[一-龥]/.test(val)) {
          jobs.push({ i: i, key: key, val: val });
        }
      }
    });
    if (!jobs.length) return Promise.resolve(fmBlock);
    return Promise.all(jobs.map(function (j) {
      return translate(j.val, true).then(function (en) {
        // 保持原引号风格
        var quoted = /^["']/.test(lines[j.i]) ? ('"' + en + '"') : en;
        lines[j.i] = j.key + ': ' + quoted;
      });
    })).then(function () {
      return lines.join('\n');
    });
  }

  // ---------- Ollama 调用 ----------
  function buildSystemPrompt(style) {
    var base = 'You are a professional Simplified-Chinese to English translator for technical blog posts (iOS / Swift development). ' +
      'Translate only the natural-language text. STRICTLY preserve the following unchanged:\n' +
      '1) All Markdown syntax (#, *, -, >, |, [], (), etc.)\n' +
      '2) Every placeholder token exactly as-is: [[CODE_n]], [[INLINE_n]], [[URL_n]], [[TERM_n]]\n' +
      '3) Code identifiers, API names, framework names, and proper nouns inside code\n' +
      'Output valid English Markdown only. Do NOT add explanations, do NOT change heading levels, do NOT translate code block contents. ';
    if (style === 'tech') {
      return base + 'Use consistent technical-documentation phrasing; keep terminology uniform across the text.';
    }
    return base + 'Prefer fluent, natural English phrasing while staying faithful to the original meaning.';
  }

  function callOllama(text, isFm) {
    var base = (baseEl.value || 'http://localhost:11434').replace(/\/+$/, '');
    var model = modelEl.value || 'qwen2.5:7b';
    var sys = buildSystemPrompt(styleEl.value);
    var userText = isFm
      ? ('Translate this blog metadata value into English. Return only the translated text, no quotes, no extra words:\n' + text)
      : text;
    return fetch(base + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        stream: false,
        options: { temperature: isFm ? 0.1 : 0.3 },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: userText }
        ]
      })
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error('Ollama 返回 ' + r.status + ': ' + t.slice(0, 200));
        });
      }
      return r.json();
    }).then(function (data) {
      var c = (data && data.message && data.message.content) || '';
      // 去掉模型可能加的代码围栏
      c = c.replace(/^```(?:markdown)?\n?/i, '').replace(/```\n?$/i, '');
      return c.trim();
    });
  }

  // 带超时的 fetch 包装
  function callOllamaSafe(text, isFm) {
    var timeoutMs = 120000;
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; reject(new Error('请求超时（' + (timeoutMs / 1000) + 's），请检查 Ollama 是否运行或换用更小模型')); }
      }, timeoutMs);
      callOllama(text, isFm).then(function (v) {
        if (!done) { done = true; clearTimeout(timer); resolve(v); }
      }, function (e) {
        if (!done) { done = true; clearTimeout(timer); reject(e); }
      });
    });
  }

  // 探测 Ollama 是否在线
  function pingOllama() {
    var base = (baseEl.value || 'http://localhost:11434').replace(/\/+$/, '');
    return fetch(base + '/api/tags', { method: 'GET' }).then(function (r) {
      return r.ok;
    }).catch(function () { return false; });
  }

  // ---------- 进度条更新 ----------
  // total = 总段数（不含空/无中文的跳过的），done = 已完成段数
  function updateProgress(done, total) {
    var pct = total > 0 ? Math.round((done / total) * 100) : 0;
    var barEl = document.getElementById('mdt-progress-fill');
    var lblEl = document.getElementById('mdt-progress-label');
    if (barEl) barEl.style.width = pct + '%';
    if (lblEl) lblEl.textContent = '翻译第 ' + done + '/' + total + ' 段';
  }

  // ---------- 分块翻译正文 ----------
  // 按空行分段，每段独立翻译（保留行内标记）。
  function translateBody(body, terms) {
    var blocks = body.split(/\n{2,}/);
    var results = new Array(blocks.length);
    // 统计实际需要翻的段数（用于进度条分母）
    var realTotal = 0;
    blocks.forEach(function (b) {
      if (b.trim() && /[一-龥]/.test(b)) realTotal++;
    });
    var done = 0;
    var idx = 0;

    function step() {
      if (idx >= blocks.length) {
        return Promise.resolve();
      }
      // 并发 3 段
      var batch = [];
      while (idx < blocks.length && batch.length < 3) {
        batch.push(idx);
        idx++;
      }
      return Promise.all(batch.map(function (i) {
        var raw = blocks[i];
        var isEmpty = !raw.trim();
        var isSkip = !isEmpty && !/[一-龥]/.test(raw);
        if (isEmpty || isSkip) { results[i] = raw; return Promise.resolve(); }
        var prot = protect(raw);
        var termProt = protectTerms(prot.text, terms);
        return callOllamaSafe(termProt.text, false).then(function (en) {
          var back = restoreTerms(en, termProt.map);
          back = restore(back, prot.store);
          results[i] = back;
          done++;
          updateProgress(done, realTotal);
        }).catch(function (e) {
          throw e;
        });
      })).then(function () {
        return step();
      });
    }
    return step().then(function () {
      return results.join('\n\n');
    });
  }

  // ---------- 主流程 ----------
  function runTranslate() {
    if (state.translating) return;
    var src = input.value;
    if (!src.trim()) { setStatus('请输入或粘贴中文 Markdown', 'err'); return; }

    state.translating = true;
    setStatus('正在连接本地 Ollama…');
    $('mdt-translate').disabled = true;
    $('mdt-download').classList.remove('mdt-btn-highlight');

    pingOllama().then(function (online) {
      if (!online) {
        throw new Error('无法连接 Ollama（' + (baseEl.value || 'http://localhost:11434') + '）。\n请先：\n1) 终端运行 ollama serve\n2) ollama pull ' + (modelEl.value || 'qwen2.5:7b'));
      }
      var progEl = document.getElementById('mdt-progress');
      if (progEl) progEl.style.display = 'flex';
      updateProgress(0, 1);
      setStatus('Ollama 已连接，开始翻译…');
      var fm = splitFrontMatter(src);
      var terms = glossaryEl.value.split(/[,，\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
      return translateFrontMatter(fm.fm, function (t, isFm) { return callOllamaSafe(t, true); }).then(function (newFm) {
        return translateBody(fm.body, terms).then(function (newBody) {
          return (newFm || '') + newBody;
        });
      });
    }).then(function (out) {
      state.outputText = out;
      output.value = out;
      $('mdt-download').classList.add('mdt-btn-highlight');
      var progEl = document.getElementById('mdt-progress');
      if (progEl) progEl.style.display = 'none';
      setStatus('翻译完成 ✓ 已生成英文 Markdown — 点「保存到本地」保存到 _posts/en/', 'ok');
    }).catch(function (e) {
      var progEl = document.getElementById('mdt-progress');
      if (progEl) progEl.style.display = 'none';
      setStatus('翻译失败：' + (e && e.message ? e.message : e), 'err');
    }).then(function () {
      state.translating = false;
      $('mdt-translate').disabled = false;
    });
  }

  // ---------- 复制 / 下载 / 清空 / 示例 ----------
  function copyOutput() {
    if (!output.value) { setStatus('没有可复制的内容', 'err'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {
        setStatus('已复制到剪贴板 ✓', 'ok');
      }, function () { fallbackCopy(); });
    } else { fallbackCopy(); }
  }
  function fallbackCopy() {
    output.select();
    try { document.execCommand('copy'); setStatus('已复制到剪贴板 ✓', 'ok'); }
    catch (e) { setStatus('复制失败，请手动选择', 'err'); }
  }

  // 保存到本地：优先用 File System Access API 弹原生保存对话框可选位置（Chrome / Edge / Opera 86+），
  // Safari / Firefox 不支持时降级为 <a download>，文件落到默认下载目录。
  function downloadOutput() {
    if (!output.value) { setStatus('没有可保存的内容', 'err'); return; }
    // 默认文件名（从 front matter 推断 date + slug）
    var fname = 'translated-en.md';
    var dm = output.value.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
    var tm = output.value.match(/title:\s*"?([^"\n]+)"?/);
    if (dm && tm) {
      var slug = tm[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
      fname = dm[1] + '-' + (slug || 'post') + '.md';
    }
    var content = output.value;
    var dlBtn = $('mdt-download');

    // 优先：File System Access API（弹系统原生保存对话框，可选任意位置 / 改名 / 覆盖）
    if (window.showSaveFilePicker) {
      window.showSaveFilePicker({
        suggestedName: fname,
        types: [{
          description: 'Markdown file',
          accept: { 'text/markdown': ['.md', '.markdown'] }
        }]
      }).then(function (handle) {
        return handle.createWritable().then(function (ws) {
          return ws.write(content).then(function () {
            return ws.close();
          }).then(function () {
            return handle;
          });
        });
      }).then(function (handle) {
        dlBtn.classList.remove('mdt-btn-highlight');
        setStatus('已保存为 ' + handle.name + '（可放博客 _posts/en/）', 'ok');
      }).catch(function (e) {
        if (e && e.name === 'AbortError') {
          setStatus('已取消保存');
        } else {
          console.warn('showSaveFilePicker 失败，降级为下载', e);
          fallbackDownload();
        }
      });
      return;
    }

    // 降级：Safari / Firefox 用 <a download> 触发下载到默认目录
    fallbackDownload();

    function fallbackDownload() {
      var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 100);
      dlBtn.classList.remove('mdt-btn-highlight');
      setStatus('已下载 ' + fname + '（当前浏览器不支持选位置，请在下载目录里移动到 _posts/en/）', 'ok');
    }
  }

  function clearAll() {
    input.value = '';
    output.value = '';
    state.outputText = '';
    $('mdt-download').classList.remove('mdt-btn-highlight');
    setStatus('');
  }

  function fillSample() {
    input.value = SAMPLE_MD;
    setStatus('已填入示例，点击「翻译」试试');
  }

  // ---------- 拖拽 / 粘贴文件 ----------
  function handleFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      input.value = e.target.result;
      setStatus('已读取 ' + file.name);
    };
    reader.readAsText(file);
  }

  // ---------- 绑定 ----------
  function bind() {
    $('mdt-translate').addEventListener('click', runTranslate);
    $('mdt-copy').addEventListener('click', copyOutput);
    $('mdt-download').addEventListener('click', downloadOutput);
    $('mdt-clear').addEventListener('click', clearAll);
    $('mdt-sample').addEventListener('click', fillSample);

    var drop = $('mdt-drop');
    ['dragover', 'dragenter'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('mdt-drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('mdt-drag'); });
    });
    drop.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });
    // 点击拖拽区触发文件选择
    drop.addEventListener('click', function () { $('mdt-file').click(); });
    $('mdt-file').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    });
    // 粘贴文件
    input.addEventListener('paste', function (e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') { handleFile(items[i].getAsFile()); e.preventDefault(); return; }
      }
    });
  }

  var SAMPLE_MD = [
    '---',
    'layout: post',
    'title: 用 Swift 聊聊闭包与逃逸闭包',
    'date: 2026-08-27',
    'categories: [iOS]',
    'tags: [Swift, 闭包]',
    '---',
    '',
    '# 闭包是什么',
    '',
    '闭包是 Swift 中一段可以捕获上下文变量的自包含代码块。它和函数很像，但更轻量。日常开发中我们大量使用尾随闭包来简化回调代码。',
    '',
    '```swift',
    'let names = ["Anna", "Alex", "Brian"]',
    'let sorted = names.sorted { $0 < $1 }',
    '```',
    '',
    '> 提示：当闭包作为函数参数、且在函数返回之后才被调用时，它就是一个逃逸闭包（@escaping）。',
    '',
    '## 捕获列表与循环引用',
    '',
    '在类中使用闭包要小心循环引用，通常通过 `[weak self]` 或 `[unowned self]` 打破。更多细节可以参考 [苹果的官方文档](https://developer.apple.com/documentation/swift/closures)。'
  ].join('\n');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
