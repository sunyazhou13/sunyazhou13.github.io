/**
 * XML 工具 — 输入即树形浏览 / 格式化 / 压缩成一行 / 一键复制 / 下载 .xml
 * 完全浏览器本地解析（DOMParser），输入不上传。类名前缀 xv-，与既有工具同构。
 */
(function () {
  'use strict';

  var ROOT = document.getElementById('xv-app');
  if (!ROOT) return;
  /* 语言感知文案（zh / en），跟随 document.documentElement.lang */
  var LANG = (document.documentElement.lang || '').toLowerCase() === 'en' ? 'en' : 'zh';
  var I18N = {
    zh: {
      'sample-comment': '站点配置示例',
      'sample-cdata': '支持 < 与 & 等特殊字符原样展示',
      'xml-parse-fail': 'XML 解析失败',
      'colon': '：',
      'line-pre': '（第 ',
      'line-post': ' 行）',
      'xml-no-root': 'XML 缺少根元素',
      'xml-parse-exc-pre': 'XML 解析异常：',
      'comment-title': '注释',
      'unit-el': ' 个元素',
      'asut': '输入即树形',
      'fmt-ok': '已格式化',
      'minify-ok': '已压缩为单行',
      'copied': '已复制到剪贴板',
      'copy-fail': '复制失败，请手动复制',
      'downloaded': '已下载 data.xml',
      'win-cannot-open': '无法在窗口打开',
      'win-blocked': '浏览器拦截了新窗口，请允许弹窗',
      'win-title': 'XML 树形浏览',
      'win-bar-hint': 'XML 树形浏览（新窗口）',
      'win-close': '关闭',
    },
    en: {
      'sample-comment': 'example site configuration',
      'sample-cdata': 'Supports literal display of < and & etc. special characters',
      'xml-parse-fail': 'XML parse failed',
      'colon': ':',
      'line-pre': ' (line ',
      'line-post': ')',
      'xml-no-root': 'XML is missing a root element',
      'xml-parse-exc-pre': 'XML parse exception: ',
      'comment-title': 'comment',
      'unit-el': ' elements',
      'asut': 'tree as you type',
      'fmt-ok': 'Formatted',
      'minify-ok': 'Minified to a single line',
      'copied': 'Copied to clipboard',
      'copy-fail': 'Copy failed; copy manually',
      'downloaded': 'Downloaded data.xml',
      'win-cannot-open': 'Cannot open in a window',
      'win-blocked': 'The browser blocked the new window; please allow pop-ups',
      'win-title': 'XML tree viewer',
      'win-bar-hint': 'XML tree viewer (new window)',
      'win-close': 'Close',
    }
  };
  function t(key) { return I18N[LANG][key] != null ? I18N[LANG][key] : key; }


  function $id(k) { return document.getElementById('xv-' + k); }
  var els = {
    input: $id('input'), status: $id('status'), treeWrap: $id('tree-wrap'),
    tree: $id('tree'), error: $id('error'), placeholder: $id('placeholder'),
    meta: $id('tree-meta'), search: $id('tree-search'),
    sample: $id('sample'), fmt: $id('fmt'), minify: $id('minify'),
    copy: $id('copy'), download: $id('download'),
    expand: $id('tree-expand'), collapse: $id('tree-collapse'), win: $id('tree-window')
  };

  var SAMPLE =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!-- ' + t('sample-comment') + ' -->\n' +
    '<site name="Sun Yazhou" version="1.0">\n' +
    '  <author>\n' +
    '    <name>Sun Yazhou</name>\n' +
    '    <email>me@sunyazhou.com</email>\n' +
    '    <avatar>https://www.sunyazhou.com/assets/img/avatar.jpg</avatar>\n' +
    '    <tags>\n' +
    '      <tag>Swift</tag>\n' +
    '      <tag>iOS</tag>\n' +
    '      <tag>macOS</tag>\n' +
    '    </tags>\n' +
    '  </author>\n' +
    '  <settings>\n' +
    '    <gzip enabled="true"/>\n' +
    '    <rss path="/feed.xml"/>\n' +
    '  </settings>\n' +
    '  <notes><![CDATA[' + t('sample-cdata') + ']]></notes>\n' +
    '</site>';

  var state = { text: '', search: '' };

  /* ---------- 基础工具 ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(s) {
    return esc(s).replace(/"/g, '&quot;');
  }
  function isBlankText(n) { return n.nodeType === 3 && !n.data.trim(); }
  function realChildren(n) {
    return Array.prototype.filter.call(n.childNodes, function (c) { return !isBlankText(c); });
  }
  function isImgUrl(s) {
    return /^https?:\/\/.*\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?.*)?$/i.test(String(s).trim());
  }
  function note(msg) {
    els.status.textContent = (state.note || '') + msg;
    els.status.removeAttribute('aria-hidden');
  }
  function blankStatus() { els.status.setAttribute('aria-hidden', 'true'); els.status.textContent = ''; state.note = ''; }

  /* ---------- 解析 ---------- */
  function parse(text) {
    var raw = (text == null ? '' : String(text)).replace(/^\uFEFF/, '');
    if (!raw.trim()) return { ok: false, empty: true, error: '' };
    try {
      var doc = new DOMParser().parseFromString(raw, 'application/xml');
      var perr = doc.getElementsByTagName('parsererror');
      if (perr.length) {
        var rawErr = perr[0].textContent || '';
        var m = rawErr.match(/line\s+(\d+)/i);
        var ln = m ? m[1] : '';
        var brief = rawErr.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3).join(' ');
        return { ok: false, error: t('xml-parse-fail') + (ln ? t('line-pre') + ln + t('line-post') : '') + t('colon') + brief };
      }
      if (!doc.documentElement) return { ok: false, error: t('xml-no-root') };
      return { ok: true, doc: doc };
    } catch (e) {
      return { ok: false, error: t('xml-parse-exc-pre') + (e && e.message || e) };
    }
  }

  /* ---------- 序列化：格式化(缩进) / 压缩(单行) ---------- */
  function indent(n) { return new Array(n + 1).join('  '); }

  function fmtChildren(node, depth, lines) {
    Array.prototype.forEach.call(node.childNodes, function (c) {
      fmtNode(c, depth, lines);
    });
  }

  function fmtNode(n, depth, lines) {
    if (isBlankText(n)) return;
    var ind = indent(depth);
    if (n.nodeType === 1) { // element
      var name = n.tagName;
      var attrs = '';
      Array.prototype.forEach.call(n.attributes, function (a) {
        attrs += ' ' + a.name + '="' + escAttr(a.value) + '"';
      });
      var kids = realChildren(n);
      if (kids.length === 0) {
        lines.push(ind + '<' + name + attrs + '/>');
      } else if (kids.length === 1 && kids[0].nodeType === 3 && !kids[0].data.match(/\n/)) {
        lines.push(ind + '<' + name + attrs + '>' + esc(kids[0].data.trim()) + '</' + name + '>');
      } else {
        lines.push(ind + '<' + name + attrs + '>');
        fmtChildren(n, depth + 1, lines);
        lines.push(ind + '</' + name + '>');
      }
    } else if (n.nodeType === 3) { // text
      var t = n.data.trim();
      if (t) lines.push(ind + esc(t));
    } else if (n.nodeType === 8) { // comment
      lines.push(ind + '<!--' + n.data + '-->');
    } else if (n.nodeType === 4) { // CDATA
      lines.push(ind + '<![CDATA[' + n.data + ']]>');
    } else if (n.nodeType === 7) { // PI
      lines.push(ind + '<?' + n.nodeName + ' ' + (n.data || '').trim() + '?>');
    } else if (n.nodeType === 10) { // doctype
      lines.push(ind + '<!DOCTYPE ' + n.name + '>');
    }
  }

  function formatXml(text) {
    var p = parse(text);
    if (!p.ok) return { ok: false, out: text };
    var lines = [];
    Array.prototype.forEach.call(p.doc.childNodes, function (c) { fmtNode(c, 0, lines); });
    return { ok: true, out: lines.join('\n') };
  }

  function stripBlank(node) {
    var toRemove = [];
    Array.prototype.forEach.call(node.childNodes, function (c) {
      if (c.nodeType === 3 && !c.data.trim()) toRemove.push(c);
      else if (c.nodeType === 1) stripBlank(c);
    });
    Array.prototype.forEach.call(toRemove, function (t) { t.parentNode.removeChild(t); });
  }

  function minifyXml(text) {
    var p = parse(text);
    if (!p.ok) return { ok: false, out: text };
    var decl = (text || '').match(/^\s*<\?xml[^?]*\?>/);
    var d = p.doc;
    // 移除缩进/空行等纯空白文本节点，才能真正压成一行（DOM 序列化保留空白）
    stripBlank(d.documentElement);
    var s = new XMLSerializer().serializeToString(d);
    return { ok: true, out: (decl ? decl[0] + '\n' : '') + s };
  }

  /* ---------- 树形渲染 ---------- */
  function imgStyle(u) {
    return ' style="--xv-img:url(&quot;' + escAttr(u) + '&quot;)"';
  }

  function attrHtml(a) {
    var v = String(a.value);
    if (isImgUrl(v)) {
      return '<span class="xv-attr xv-img"' + imgStyle(v) + '><span class="xv-attr-k">' + esc(a.name) +
        '</span>=<span class="xv-attr-v">"' + esc(v) + '"</span></span>';
    }
    return '<span class="xv-attr"><span class="xv-attr-k">' + esc(a.name) +
      '</span>=<span class="xv-attr-v">"' + esc(v) + '"</span></span>';
  }

  function textSpan(t) {
    var txt = t.trim();
    if (isImgUrl(txt)) {
      return '<span class="xv-text xv-img"' + imgStyle(txt) + '>"' + esc(txt) + '"</span>';
    }
    return '<span class="xv-text">"' + esc(txt) + '"</span>';
  }

  function searchBlob(el) {
    var parts = [el.tagName];
    Array.prototype.forEach.call(el.attributes, function (a) { parts.push(a.name + ':' + a.value); });
    Array.prototype.forEach.call(el.childNodes, function (c) {
      if (c.nodeType === 3 && c.data.trim()) parts.push(c.data);
    });
    return parts.join(' ').toLowerCase();
  }

  function nodeHtml(n, depth) {
    if (isBlankText(n)) return '';
    if (n.nodeType === 3) {
      var t = n.data.trim();
      if (!t) return '';
      return '<div class="xv-row xv-row-text" data-s="' + esc(t.toLowerCase()) + '"><span class="xv-arrow xv-arrow-none"></span>' + textSpan(t) + '</div>';
    }
    if (n.nodeType === 8) {
      return '<div class="xv-row xv-row-comment" data-s="' + esc(n.data.toLowerCase()) + '" title="' + t('comment-title') + '"><span class="xv-arrow xv-arrow-none"></span><span class="xv-comment">&lt;!--' + esc(n.data) + '--&gt;</span></div>';
    }
    if (n.nodeType === 4) {
      return '<div class="xv-row xv-row-cdata" data-s="' + esc(n.data.toLowerCase()) + '"><span class="xv-arrow xv-arrow-none"></span><span class="xv-cdata">&lt;![CDATA[' + esc(n.data) + ']]&gt;</span></div>';
    }
    if (n.nodeType === 7) {
      return '<div class="xv-row xv-row-pi" data-s="' + esc((n.nodeName + ' ' + n.data).toLowerCase()) + '"><span class="xv-arrow xv-arrow-none"></span><span class="xv-tag">&lt;?' + esc(n.nodeName) + ' ' + esc(n.data || '') + '?&gt;</span></div>';
    }
    if (n.nodeType === 10) {
      return '<div class="xv-row xv-row-doctype" data-s="' + esc('doctype ' + n.name) + '"><span class="xv-arrow xv-arrow-none"></span><span class="xv-comment">&lt;!DOCTYPE ' + esc(n.name) + '&gt;</span></div>';
    }
    if (n.nodeType !== 1) return '';
    // element
    var name = n.tagName;
    var attrs = '';
    Array.prototype.forEach.call(n.attributes, function (a) { attrs += attrHtml(a); });
    var open = '<span class="xv-tag xv-tag-open">&lt;' + esc(name) + '</span>' + attrs + '<span class="xv-tag">&gt;</span>';
    var kids = realChildren(n);
    if (kids.length === 0) {
      return '<div class="xv-row xv-el" data-s="' + esc(searchBlob(n)) + '" data-name="' + esc(name) + '"><span class="xv-arrow xv-arrow-none"></span>' + open + '<span class="xv-tag">/&gt;</span></div>';
    }
    if (kids.length === 1 && kids[0].nodeType === 3 && !kids[0].data.match(/\n/)) {
      return '<div class="xv-row xv-el" data-s="' + esc(searchBlob(n)) + '" data-name="' + esc(name) + '"><span class="xv-arrow xv-arrow-none"></span>' + open + textSpan(kids[0].data) + '<span class="xv-tag">&lt;/' + esc(name) + '&gt;</span></div>';
    }
    var inner = '';
    Array.prototype.forEach.call(kids, function (c) { inner += nodeHtml(c, depth + 1); });
    var collapsed = depth >= 4 ? ' xv-collapsed' : '';
    return '<div class="xv-wrap' + collapsed + '">' +
      '<div class="xv-row xv-el" data-s="' + esc(searchBlob(n)) + '" data-name="' + esc(name) + '"><span class="xv-arrow"></span>' + open + '</div>' +
      '<div class="xv-nest">' + inner + '</div>' +
      '<div class="xv-row xv-close"><span class="xv-arrow xv-arrow-none"></span><span class="xv-tag">&lt;/' + esc(name) + '&gt;</span></div>' +
      '</div>';
  }

  function buildTree(doc) {
    els.tree.innerHTML = '';
    var h = '';
    Array.prototype.forEach.call(doc.childNodes, function (c) { h += nodeHtml(c, 0); });
    els.tree.innerHTML = h;
    var elCount = els.tree.querySelectorAll('.xv-el').length;
    var hrs = els.tree.querySelectorAll('.xv-close').length + els.tree.querySelectorAll('.xv-row-text').length +
      els.tree.querySelectorAll('.xv-row-comment').length + els.tree.querySelectorAll('.xv-row-cdata').length +
      els.tree.querySelectorAll('.xv-row-pi').length;
    els.meta.textContent = elCount + t('unit-el');
    blankStatus();
    var p = parse(els.input.value);
    if (p.ok) note(elCount + t('unit-el') + ' · ' + t('asut'));
  }

  function render(text) {
    var p = parse(text);
    els.placeholder.hidden = !(p.empty);
    els.error.hidden = true;
    if (p.empty) { els.treeWrap.hidden = true; blankStatus(); return; }
    if (!p.ok) {
      els.treeWrap.hidden = true;
      els.error.hidden = false;
      els.error.innerHTML = '';
      var tt = document.createElement('div'); tt.className = 'xv-err-title'; tt.textContent = t('xml-parse-fail');
      var td = document.createElement('div'); td.className = 'xv-err-detail'; td.textContent = p.error.replace(t('xml-parse-fail'), '').replace(/^：/, '');
      els.error.appendChild(tt); els.error.appendChild(td);
      blankStatus(); note(p.error);
      return;
    }
    state.text = els.input.value;
    els.treeWrap.hidden = false;
    buildTree(p.doc);
  }

  /* ---------- 折叠交互 ---------- */
  function toggleWrap(w) { w.classList.toggle('xv-collapsed'); }

  els.tree.addEventListener('click', function (e) {
    var t = e.target;
    var row = t && t.closest ? t.closest('.xv-el') : null;
    if (row) {
      var el = t.closest('.xv-arrow');
      var wrap = row.parentNode;
      if (wrap && wrap.classList.contains('xv-wrap') && el && el.classList.contains('xv-arrow')) {
        toggleWrap(wrap);
      }
    }
  });

  function setAllCollapsed(collapsed) {
    Array.prototype.forEach.call(els.tree.querySelectorAll('.xv-wrap'), function (w) {
      if (collapsed) w.classList.add('xv-collapsed'); else w.classList.remove('xv-collapsed');
    });
  }

  /* ---------- 搜索 ---------- */
  var searchTimer = null;
  els.search.addEventListener('input', function () {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      var q = (els.search.value || '').trim().toLowerCase();
      state.search = q;
      if (!q) {
        Array.prototype.forEach.call(els.tree.querySelectorAll('.xv-hit, .xv-hit-ancestor'), function (n) {
          n.classList.remove('xv-hit'); n.classList.remove('xv-hit-ancestor');
        });
        return;
      }
      Array.prototype.forEach.call(els.tree.querySelectorAll('.xv-el, .xv-row-text, .xv-row-comment, .xv-row-cdata, .xv-row-pi'), function (r) {
        var s = (r.getAttribute('data-s') || '');
        var hit = s.indexOf(q) >= 0;
        r.classList.toggle('xv-hit', hit && !r.classList.contains('xv-el'));
        if (hit && r.classList.contains('xv-el')) r.classList.add('xv-hit');
      });
      // 展开命中元素的祖先
      Array.prototype.forEach.call(els.tree.querySelectorAll('.xv-hit'), function (h) {
        var p = h.parentNode;
        while (p && p !== els.tree) {
          if (p.classList && p.classList.contains('xv-wrap')) p.classList.remove('xv-collapsed');
          p = p.parentNode;
        }
      });
      var first = els.tree.querySelector('.xv-hit');
      if (first && first.scrollIntoView) first.scrollIntoView({ block: 'nearest' });
    }, 200);
  });

  /* ---------- 工具按钮 ---------- */
  els.sample.addEventListener('click', function () {
    els.input.value = SAMPLE;
    render(SAMPLE);
    els.input.focus();
  });

  els.fmt.addEventListener('click', function () {
    var r = formatXml(els.input.value);
    if (!r.ok) { note(r.out); return; }
    if (state.search) { els.search.value = ''; state.search = ''; }
    els.input.value = r.out;
    render(r.out);
    note(t('fmt-ok'));
  });

  els.minify.addEventListener('click', function () {
    var r = minifyXml(els.input.value);
    if (!r.ok) { note(r.out); return; }
    if (state.search) { els.search.value = ''; state.search = ''; }
    els.input.value = r.out;
    render(r.out);
    note(t('minify-ok'));
  });

  els.copy.addEventListener('click', function () {
    var out = els.input.value;
    function done(ok) { note(ok ? t('copied') : t('copy-fail')); }
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(out).then(function () { done(true); }, function () { done(false); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = out; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var okk = false;
      try { okk = document.execCommand('copy'); } catch (e) { okk = false; }
      document.body.removeChild(ta);
      done(okk);
    }
  });

  els.download.addEventListener('click', function () {
    var blob = new Blob([els.input.value], { type: 'application/xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'data.xml';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    note(t('downloaded'));
  });

  els.expand.addEventListener('click', function () { setAllCollapsed(false); });
  els.collapse.addEventListener('click', function () { setAllCollapsed(true); });

  els.win.addEventListener('click', function () {
    var p = parse(els.input.value);
    if (!p.ok) { note(p.error || t('win-cannot-open')); return; }
    var w = window.open('', '_blank', 'noopener');
    if (!w) { note(t('win-blocked')); return; }
    var h = '';
    Array.prototype.forEach.call(p.doc.childNodes, function (c) { h += nodeHtml(c, 0); });
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + t('win-title') + '</title>' +
      '<meta name="robots" content="noindex">' +
      '<link rel="stylesheet" href="/assets/tools/xml-viewer/app.css">' +
      '</head><body><div id="xv-app" class="xv-window-mode"><div class="xv-win-bar">' +
      '<span class="xv-hint">' + t('win-bar-hint') + '</span>' +
      '<button type="button" class="xv-btn" onclick="window.close()">' + t('win-close') + '</button></div>' +
      '<div class="xv-tree" id="xv-tree">' + h + '</div></div></body></html>');
    w.document.close();
  });

  /* ---------- 输入实时渲染（防抖 250ms） ---------- */
  var inputTimer = null;
  els.input.addEventListener('input', function () {
    if (inputTimer) clearTimeout(inputTimer);
    inputTimer = setTimeout(function () { render(els.input.value); }, 250);
  });

  // 初始
  els.input.value = SAMPLE;
  render(SAMPLE);
})();
