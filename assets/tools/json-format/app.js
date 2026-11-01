/**
 * JSON 工具（v4） — 纯原生，零依赖，输入不上传
 *
 * 输入 JSON 即实时树形；树中图片字符串 hover 自动预览。
 * 一键操作：格式化 / 压缩 / 按键排序 / 自动修复 / 复制 / 下载 .json
 * 容错解析：尾逗号、单引号、无引号键、注释 —— 自动修复后也能出树。
 */

(function () {
  'use strict';

  var root = document.getElementById('jf-app');
  if (!root) return;

  var LANG = (document.documentElement.lang || 'zh').toLowerCase();
  if (LANG.indexOf('en') === 0) LANG = 'en';
  var I18N = {
    'zh': {
    'img-prev-alt': '图片预览',
    'img-prev-fail': '图片加载失败',
    'jf-eof': 'JSON 提前结束：可能有未闭合的 {、[ 或 " 引号。',
    'jf-prop': '此处应是对象键名 "key": 检查是否丢了逗号、冒号或多了花括号。',
    'jf-comma': '此处应有一个逗号，但格式不对：可能是多余的逗号，或上一个值没写完整。',
    'jf-colon': '键名后应有冒号 :，却出现了别的字符。',
    'jf-token': '遇到了不该出现的字符：检查逗号、括号是否多写或漏写。',
    'jf-trailing': '解析完成后还有多余内容：检查是否多写了 } ] 或 , 逗号。',
    'jf-escape': '字符串中有非法转义：如反斜杠 \\ 后跟了非法字符。',
    'jf-unterminated': '字符串引号可能未闭合。',
    'jf-extra': 'JSON 后有多余的字符；也常见于多个 JSON 串在一起。',
    'err-line-pre': '第 ',
    'err-line-mid': ' 行，第 ',
    'err-line-post': ' 列',
    'err-locate-fail': '无法自动定位',
    'hint-pre': '提示：',
    'invalid-pre': 'JSON 无效：',
    'jf-items': ' 项',
    'img-hover': '图片链接，hover 预览',
    'node-limit-pre': '节点数超过 ',
    'node-limit-post': ' 个，树形视图会卡顿，请缩减数据后再试。',
    'nodes': ' 个节点',
    'valid-pre': '有效 JSON · ',
    'valid-mid': ' · ',
    'chars': ' 字符',
    'repaired-pre': ' · 已自动修复 ',
    'repaired-post': ' 处（可用「修复」写回标准格式）',
    'hit-pre': '命中 ',
    'alert-invalid': '当前不是有效 JSON，请先修正或使用「修复」。',
    'note-fmt': '已格式化（2 空格缩进）',
    'note-minify': '已压缩为单行',
    'note-sort': '已按键名排序',
    'alert-please-json': '请输入 JSON。',
    'note-already': '已是标准 JSON，无需修复',
    'alert-cant-repair': '无法自动修复：可能存在未闭合的引号或注释。',
    'note-repaired-pre': '已修复 ',
    'note-repaired-post': ' 处并写回标准 JSON',
    'copied': '已复制到剪贴板',
    'copy-failed': '复制失败，请手动选择复制',
    'alert-invalid-dl': '当前不是有效 JSON，无法下载。',
    'alert-no-download': '当前浏览器不支持下载。',
    'note-downloaded': '已下载 data.json',
    'alert-empty': '请先输入 JSON',
    'alert-window': '无法打开新窗口，请直接使用下方树形视图',
    'placeholder-nonode': '没有可展示的 JSON：请回到主工具页输入 JSON 后点「新窗口」。',
    'win-title': 'JSON 树形浏览',
    },
    'en': {
    'img-prev-alt': 'Image preview',
    'img-prev-fail': 'Image preview failed to load',
    'jf-eof': 'JSON ended early: there may be an unclosed {, [ or " quote.',
    'jf-prop': 'A property name "key" is expected here: check for a missing comma, colon, or an extra curly brace.',
    'jf-comma': 'A comma is expected here: there may be an extra comma, or the previous value was not written completely.',
    'jf-colon': 'A colon : is expected after the key name, another character was found.',
    'jf-token': 'Unexpected character: check whether a comma or bracket is missing or extra.',
    'jf-trailing': 'Extra content remains after parsing: check for an extra }, ] or , comma.',
    'jf-escape': 'Invalid escape in a string: e.g. a backslash \\ followed by an invalid character.',
    'jf-unterminated': 'A string quote may be unclosed.',
    'jf-extra': 'Extra characters after the JSON; this often happens when several JSON documents are concatenated.',
    'err-line-pre': 'line ',
    'err-line-mid': ', column ',
    'err-line-post': '',
    'err-locate-fail': 'Cannot auto-locate the error',
    'hint-pre': 'Tip: ',
    'invalid-pre': 'Invalid JSON: ',
    'jf-items': ' items',
    'img-hover': 'Image link, hover to preview',
    'node-limit-pre': 'Node count exceeds ',
    'node-limit-post': ', the tree view may become sluggish. Please reduce the data and try again.',
    'nodes': ' nodes',
    'valid-pre': 'Valid JSON · ',
    'valid-mid': ' · ',
    'chars': ' chars',
    'repaired-pre': ', auto-repaired ',
    'repaired-post': ' spot(s) (use "Repair" to write back standard JSON)',
    'hit-pre': 'matched ',
    'alert-invalid': 'This is not valid JSON yet. Please fix it or use "Repair".',
    'note-fmt': 'Formatted (2-space indent)',
    'note-minify': 'Minified into a single line',
    'note-sort': 'Sorted by key name',
    'alert-please-json': 'Please enter some JSON.',
    'note-already': 'Already valid JSON, no repair needed',
    'alert-cant-repair': 'Cannot auto-repair: there may be an unclosed quote or comment.',
    'note-repaired-pre': 'Repaired ',
    'note-repaired-post': ' spot(s) and wrote back standard JSON',
    'copied': 'Copied to the clipboard',
    'copy-failed': 'Copy failed, please select and copy manually',
    'alert-invalid-dl': 'This is not valid JSON, cannot download.',
    'alert-no-download': 'Download is not supported in this browser.',
    'note-downloaded': 'Downloaded data.json',
    'alert-empty': 'Please enter some JSON first',
    'alert-window': 'Cannot open a new window, please use the tree view below',
    'placeholder-nonode': 'No JSON to display: enter JSON on the main tool page, then click "New window".',
    'win-title': 'JSON Tree View',
    }
  };
  function t(key) { var v = (I18N[LANG] || {})[key]; return v != null ? v : key; }
  var isWindowMode = root.classList.contains('jf-window-mode');

  var els = {
    input: document.getElementById('jf-input'),
    sampleBtn: document.getElementById('jf-sample'),
    fmtBtn: document.getElementById('jf-fmt'),
    minifyBtn: document.getElementById('jf-minify'),
    sortBtn: document.getElementById('jf-sort'),
    repairBtn: document.getElementById('jf-repair'),
    copyBtn: document.getElementById('jf-copy'),
    downloadBtn: document.getElementById('jf-download'),
    treeWrap: document.getElementById('jf-tree-wrap'),
    tree: document.getElementById('jf-tree'),
    treeSearch: document.getElementById('jf-tree-search'),
    treeExpand: document.getElementById('jf-tree-expand'),
    treeCollapse: document.getElementById('jf-tree-collapse'),
    treeWindow: document.getElementById('jf-tree-window'),
    treeMeta: document.getElementById('jf-tree-meta'),
    error: document.getElementById('jf-error'),
    placeholder: document.getElementById('jf-placeholder'),
    status: document.getElementById('jf-status')
  };

  var state = { timer: null, repaired: false, fixed: 0 };
  var DEBOUNCE_MS = 250;
  var MAX_NODES = 3000;

  /* ---------- 通用 ---------- */

  function txt(n) { return n == null ? '' : String(n); }

  function reset() {
    if (els.treeWrap) els.treeWrap.hidden = true;
    if (els.error) els.error.hidden = true;
    if (els.placeholder) els.placeholder.hidden = false;
    if (els.status) els.status.textContent = '';
  }

  /* ---------- 容错修复（JSON repair） ----------
   * 支持：尾逗号、单引号字符串、无引号对象键、// 与 /* *​/ 注释。
   * 逐字符扫描，字符串内的特殊字符不被破坏。
   * 返回 { text, fixed }；无法修复时 fixed = -1。
   */
  function repairJSON(src) {
    var s = String(src == null ? '' : src);
    if (!s.trim()) return { text: s, fixed: -1 };

    var out = '';
    var stack = [];
    var expectingKey = true;
    var quotes = false, quoteCh = '', escaped = false;
    var fixed = 0;
    var i = 0, n = s.length;
    var FAIL = { text: src, fixed: -1 };

    function isWs(c) { return c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f'; }

    while (i < n) {
      var ch = s[i];

      if (quotes) {
        if (escaped) {
          // 单引号串内的 \\' 转成双引号串时无需转义，去掉反斜杠；其余转义原样保留
          if (ch === "'" && quoteCh === "'") { out += ch; }
          else { out += '\\' + ch; }
          escaped = false;
        }
        else if (ch === '\\') { escaped = true; }
        else if (ch === quoteCh) { out += '"'; quotes = false; }
        else { out += ch; }
        i++;
        continue;
      }

      if (isWs(ch)) { out += ch; i++; continue; }

      // 注释
      if (ch === '/') {
        if (s[i + 1] === '/') {
          while (i < n && s[i] !== '\n') i++;
          out += '\n';
          fixed++;
          continue;
        }
        if (s[i + 1] === '*') {
          var end = s.indexOf('*/', i + 2);
          if (end === -1) return FAIL;
          i = end + 2;
          out += ' ';
          fixed++;
          continue;
        }
      }

      if (ch === '"' || ch === "'") {
        quotes = true;
        quoteCh = ch;
        out += '"';
        fixed += (ch === "'" ? 1 : 0);
        i++;
        continue;
      }

      if (ch === '{') {
        stack.push('{');
        expectingKey = true;
        out += ch; i++;
        continue;
      }
      if (ch === '}') {
        stack.pop();
        expectingKey = true;
        out += ch; i++;
        continue;
      }
      if (ch === '[') {
        stack.push('[');
        expectingKey = false;
        out += ch; i++;
        continue;
      }
      if (ch === ']') {
        stack.pop();
        expectingKey = false;
        out += ch; i++;
        continue;
      }
      if (ch === ':') {
        expectingKey = false;
        out += ch; i++;
        continue;
      }
      if (ch === ',') {
        // 尾逗号：逗号后直接是 } 或 ]
        var j = i + 1;
        while (j < n && isWs(s[j])) j++;
        if (s[j] === '}' || s[j] === ']') {
          out += ' ';
          i = j;
          fixed++;
          continue;
        }
        expectingKey = stack.length && stack[stack.length - 1] === '{';
        out += ch; i++;
        continue;
      }

      // 无引号键：[A-Za-z_$][\w$-]*
      if (expectingKey && /[A-Za-z_$]/.test(ch)) {
        var k = i;
        while (k < n && /[A-Za-z0-9_$\-]/.test(s[k])) k++;
        var k2 = k;
        while (k2 < n && isWs(s[k2])) k2++;
        if (s[k2] === ':') {
          out += '"' + s.slice(i, k) + '"';
          i = k;
          expectingKey = false;
          fixed++;
          continue;
        }
      }

      // 普通值或无法识别的键起始
      expectingKey = false;
      out += ch; i++;
    }

    if (quotes) return FAIL;
    return { text: out, fixed: fixed };
  }

  /* 解析：严格失败则尝试修复 */
  function parseSmart(text) {
    try {
      return { obj: JSON.parse(text), repaired: false, fixed: 0, error: null };
    } catch (e0) { /* fallthrough */ }
    var r = repairJSON(text);
    if (r.fixed < 0) return { obj: null, repaired: false, fixed: 0, error: e0 };
    try {
      return { obj: JSON.parse(r.text), repaired: true, fixed: r.fixed, error: null };
    } catch (e1) {
      return { obj: null, repaired: false, fixed: 0, error: e1 };
    }
  }

  /* ---------- 图片 URL 识别与 hover 预览 ---------- */

  function isImageUrl(v) {
    if (typeof v !== 'string') return false;
    var t = v.trim();
    if (!t || t.length > 5000) return false;
    if (/^data:image\//i.test(t)) return true;
    var m = /^(https?:\/\/)[^\s"'<>]+$/i.exec(t);
    if (!m) return false;
    var path = t.split(/[?#]/)[0].toLowerCase();
    return /\.(png|jpe?g|gif|webp|avif|bmp|svg|ico)(\?|#|$)/.test(path);
  }

  var imgPop = null;
  function hideImgPop() {
    if (imgPop) {
      imgPop.remove();
      imgPop = null;
      document.removeEventListener('keydown', hideImgPopOnEsc);
    }
  }
  function hideImgPopOnEsc(e) { if (e.key === 'Escape') hideImgPop(); }

  function bindImgPop(el, url) {
    el.addEventListener('mouseenter', function () {
      hideImgPop();
      imgPop = document.createElement('div');
      imgPop.className = 'jf-img-pop';
      var box = document.createElement('div');
      box.className = 'jf-img-pop-box';
      var im = document.createElement('img');
      im.src = url;
      im.loading = 'lazy';
      im.alt = t('img-prev-alt');
      im.onerror = function () {
        box.classList.add('jf-img-pop-err');
        box.textContent = t('img-prev-fail');
      };
      box.appendChild(im);
      imgPop.appendChild(box);
      document.body.appendChild(imgPop);
      document.addEventListener('keydown', hideImgPopOnEsc);
      var r = el.getBoundingClientRect();
      var width = 280;
      var left = r.left + r.width + 10;
      var top = r.top;
      if (left + width + 16 > window.innerWidth) left = Math.max(8, r.left - width - 10);
      if (top + 200 > window.innerHeight) top = Math.max(8, window.innerHeight - 220);
      imgPop.style.left = left + 'px';
      imgPop.style.top = top + 'px';
    });
    el.addEventListener('mouseleave', hideImgPop);
  }

  /* ---------- 错误定位与建议 ---------- */

  function locateInfo(text, msg) {
    var m = /line (\d+) column (\d+)/i.exec(txt(msg));
    if (m) {
      var lineNo = Number(m[1]), colNo = Number(m[2]);
      var lines = text.split('\n');
      var preview = lines[Math.min(lineNo - 1, lines.length - 1)] || '';
      return { line: lineNo, col: colNo, preview: preview };
    }
    var pm = /position (\d+)/i.exec(txt(msg));
    if (!pm) return null;
    var pos = Math.min(Number(pm[1]), text.length);
    var before = text.slice(0, pos);
    var ls = before.split('\n');
    return {
      line: ls.length,
      col: ls[ls.length - 1].length + 1,
      preview: text.split('\n')[ls.length - 1] || ''
    };
  }

  function errHint(msg) {
    var m = txt(msg);
    if (/end of json input|unexpected end/i.test(m)) return t('jf-eof');
    if (/expected property name/i.test(m) || /expected (double-quoted|single-quoted) property name/i.test(m)) return t('jf-prop');
    if (/expected ','/i.test(m)) return t('jf-comma');
    if (/expected ':'/i.test(m)) return t('jf-colon');
    if (/unexpected token/i.test(m) || /unexpected (number|string)/i.test(m)) return t('jf-token');
    if (/trailing|non-whitespace/i.test(m)) return t('jf-trailing');
    if (/bad escaped|invalid escape|escape/i.test(m)) return t('jf-escape');
    if (/unterminated|missing"/i.test(m)) return t('jf-unterminated');
    if (/unexpected non-whitespace/i.test(m)) return t('jf-extra');
    return '';
  }

  function showError(e, text) {
    if (els.treeWrap) els.treeWrap.hidden = true;
    if (els.placeholder) els.placeholder.hidden = true;
    if (els.status) els.status.textContent = '';
    var info = locateInfo(text, e.message);
    var detail = document.createElement('div');
    detail.className = 'jf-err-detail';
    if (info) {
      var line = info.preview;
      var caretPad = '';
      for (var i = 0; i < Math.max(0, info.col - 1); i++) caretPad += ' ';
      var pos = document.createElement('div');
      pos.className = 'jf-err-pos';
      pos.textContent = t('err-line-pre') + info.line + t('err-line-mid') + info.col + t('err-line-post');
      detail.appendChild(pos);
      var lineEl = document.createElement('div');
      lineEl.className = 'jf-err-line';
      var code = document.createElement('code');
      code.textContent = line;
      lineEl.appendChild(code);
      detail.appendChild(lineEl);
      var caretEl = document.createElement('div');
      caretEl.className = 'jf-err-caret';
      var ccode = document.createElement('code');
      ccode.textContent = caretPad + '^';
      caretEl.appendChild(ccode);
      detail.appendChild(caretEl);
    } else {
      var pos2 = document.createElement('div');
      pos2.className = 'jf-err-pos';
      pos2.textContent = t('err-locate-fail');
      detail.appendChild(pos2);
    }
    var hint = errHint(e.message);
    if (hint) {
      var hEl = document.createElement('div');
      hEl.className = 'jf-err-hint';
      hEl.textContent = t('hint-pre') + hint;
      detail.appendChild(hEl);
    }
    if (els.error) {
      els.error.hidden = false;
      els.error.innerHTML = '';
      var tEl = document.createElement('div');
      tEl.className = 'jf-err-title';
      tEl.textContent = t('invalid-pre') + txt(e.message || e);
      els.error.appendChild(tEl);
      els.error.appendChild(detail);
    }
  }

  /* ---------- 树形视图 ---------- */

  function typeName(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v;
  }

  function scalarText(v) {
    if (v === null) return 'null';
    if (typeof v === 'string') return JSON.stringify(v);
    return String(v);
  }

  function summary(v) {
    if (Array.isArray(v)) return '[' + v.length + t('jf-items') + ']';
    return '{' + Object.keys(v).length + t('jf-items') + '}';
  }

  function buildNode(v, key, depth) {
    var wrap = document.createElement('div');
    wrap.className = 'jf-node';
    if (depth <= 1) wrap.classList.add('jf-open');
    if (key != null) wrap.dataset.key = String(key);

    var composite = v !== null && typeof v === 'object';
    var row = document.createElement('div');
    row.className = 'jf-node-row' + (composite ? '' : ' jf-node-row-leaf');

    if (composite) {
      wrap.dataset.search = (key != null ? String(key) : '') + ' ' + summary(v) + ' ' +
        Object.keys(v).filter(function (k) { return v[k] === null || typeof v[k] !== 'object'; })
          .map(function (k) { return String(k); }).join(' ');
      var tw = document.createElement('span');
      tw.className = 'jf-twisty';
      row.appendChild(tw);
      var k2 = document.createElement('span');
      k2.className = 'jf-key' + (Array.isArray(v) ? ' jf-key-idx' : '');
      k2.textContent = key != null ? JSON.stringify(String(key)) + ': ' : '';
      row.appendChild(k2);
      var sm = document.createElement('span');
      sm.className = 'jf-summary';
      sm.textContent = summary(v);
      row.appendChild(sm);
      row.setAttribute('role', 'button');
      row.addEventListener('click', function () {
        wrap.classList.toggle('jf-open');
      });
      wrap.appendChild(row);

      var ch = document.createElement('div');
      ch.className = 'jf-children';
      var ks = Object.keys(v);
      for (var i = 0; i < ks.length; i++) {
        ch.appendChild(buildNode(v[ks[i]], ks[i], depth + 1));
      }
      wrap.appendChild(ch);
    } else {
      wrap.dataset.search = (key != null ? String(key) : '') + ' ' + scalarText(v);
      var te = document.createElement('span');
      te.className = 'jf-twisty jf-twisty-empty';
      row.appendChild(te);
      if (key != null) {
        var k3 = document.createElement('span');
        k3.className = 'jf-key jf-key-idx';
        k3.textContent = JSON.stringify(String(key)) + ': ';
        row.appendChild(k3);
      }
      var vv = document.createElement('span');
      vv.className = 'jf-val jf-val-' + typeName(v);
      vv.textContent = scalarText(v);
      row.appendChild(vv);
      if (isImageUrl(v)) {
        wrap.classList.add('jf-has-img');
        vv.classList.add('jf-val-img');
        vv.title = t('img-hover');
        bindImgPop(vv, v);
      }
      wrap.appendChild(row);
    }
    return wrap;
  }

  function countNodes(v, budget) {
    var n = 0, over = false;
    (function walk(x) {
      if (x !== null && typeof x === 'object') {
        n++;
        if (n > budget) { over = true; return; }
        var ks = Object.keys(x);
        for (var i = 0; i < ks.length && !over; i++) walk(x[ks[i]]);
      }
    })(v);
    return { n: n, over: over };
  }

  function renderTree(obj, text) {
    var cnt = countNodes(obj, MAX_NODES);
    if (cnt.over) {
      showError({ message: t('node-limit-pre') + MAX_NODES + t('node-limit-post') }, text);
      return;
    }
    if (els.treeWrap) els.treeWrap.hidden = false;
    if (els.error) els.error.hidden = true;
    if (els.placeholder) els.placeholder.hidden = true;
    if (els.tree) {
      els.tree.innerHTML = '';
      els.tree.appendChild(buildNode(obj, null, 0));
    }
    if (els.treeSearch) els.treeSearch.value = '';
    if (els.treeMeta) els.treeMeta.textContent = cnt.n + t('nodes');
    if (els.status) {
      var base = t('valid-pre') + cnt.n + t('nodes') + t('valid-mid') + text.length + t('chars');
      if (state.repaired) base += t('repaired-pre') + state.fixed + t('repaired-post');
      els.status.textContent = base;
      els.status.className = 'jf-status-ok';
    }
  }

  function render() {
    if (!els.input) return;
    var text = els.input.value;
    if (!text.trim()) { reset(); return; }
    var r = parseSmart(text);
    if (r.error) {
      state.repaired = false;
      showError(r.error, text);
      return;
    }
    state.repaired = r.repaired;
    state.fixed = r.fixed;
    state.currentObj = r.obj;
    renderTree(r.obj, text);
  }

  function setInput(text) {
    if (els.input) {
      els.input.value = text;
      render();
    }
  }

  function runSearch(q) {
    if (!els.tree) return;
    q = (q || '').trim();
    var nodes = els.tree.querySelectorAll('.jf-node');
    var hit = 0;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var raw = n.dataset ? n.dataset.search : '';
      var isHit = q !== '' && raw && raw.toLowerCase().indexOf(q.toLowerCase()) !== -1;
      n.classList.toggle('jf-hl-node', isHit);
      if (isHit) {
        hit++;
        var p = n.parentElement;
        while (p && p !== els.tree) {
          if (p.classList && p.classList.contains('jf-node')) p.classList.add('jf-open');
          p = p.parentElement;
        }
      }
    }
    if (els.treeMeta) els.treeMeta.textContent = q === '' ? nodes.length + t('nodes') : t('hit-pre') + hit + ' / ' + nodes.length + t('nodes');
  }

  function expandAll() {
    if (!els.tree) return;
    var nodes = els.tree.querySelectorAll('.jf-node');
    for (var i = 0; i < nodes.length; i++) {
      var ch = nodes[i].querySelector('.jf-children');
      if (ch && ch.childNodes.length) nodes[i].classList.add('jf-open');
    }
  }

  function collapseAll() {
    if (!els.tree) return;
    var nodes = els.tree.querySelectorAll('.jf-open');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] !== els.tree.firstElementChild) nodes[i].classList.remove('jf-open');
    }
  }

  /* ---------- 一键操作 ---------- */

  function sortKeyValues(v) {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(sortKeyValues);
    var out = {};
    Object.keys(v).sort().forEach(function (k) { out[k] = sortKeyValues(v[k]); });
    return out;
  }

  function formatJson() {
    var r = parseSmart(els.input.value);
    if (r.error) { if (window.alert) window.alert(t('alert-invalid')); return; }
    setInput(JSON.stringify(r.obj, null, 2));
    note(t('note-fmt'));
  }

  function minifyJson() {
    var r = parseSmart(els.input.value);
    if (r.error) { if (window.alert) window.alert(t('alert-invalid')); return; }
    setInput(JSON.stringify(r.obj));
    note(t('note-minify'));
  }

  function sortJson() {
    var r = parseSmart(els.input.value);
    if (r.error) { if (window.alert) window.alert(t('alert-invalid')); return; }
    setInput(JSON.stringify(sortKeyValues(r.obj), null, 2));
    note(t('note-sort'));
  }

  function repairJson() {
    var text = els.input.value;
    if (!text.trim()) { if (window.alert) window.alert(t('alert-please-json')); return; }
    var p = parseSmart(text);
    if (!p.error && !p.repaired) { note(t('note-already')); return; }
    var r = repairJSON(text);
    if (r.fixed < 0) { if (window.alert) window.alert(t('alert-cant-repair')); return; }
    setInput(r.text);
    note(t('note-repaired-pre') + r.fixed + t('note-repaired-post'));
  }

  function copyJson() {
    var r = parseSmart(els.input.value);
    var out = r.error ? els.input.value : JSON.stringify(r.obj);
    function done(ok) { note(ok ? t('copied') : t('copy-failed')); }
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(out).then(function () { done(true); }, function () { done(false); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = out;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { done(document.execCommand('copy')); } catch (e) { done(false); }
      ta.remove();
    }
  }

  function downloadJson() {
    var r = parseSmart(els.input.value);
    if (r.error) { if (window.alert) window.alert(t('alert-invalid-dl')); return; }
    var out = JSON.stringify(r.repaired ? r.repairedObj : r.obj, null, 2);
    var blob;
    try {
      blob = new Blob([out], { type: 'application/json;charset=utf-8' });
    } catch (e) {
      if (window.alert) window.alert(t('alert-no-download'));
      return;
    }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 100);
    note(t('note-downloaded'));
  }

  function note(msg) {
    if (els.status) {
      els.status.textContent = msg;
      els.status.className = 'jf-status-note';
    }
  }

  /* ---------- 示例 ---------- */

  var SAMPLE = [
    '{',
    '  "site": "sunyazhou.com",',
    '  "author": "孙亚洲",',
    '  "avatar": "https://www.sunyazhou.com/assets/img/avatar.jpg",',
    '  "tags": ["ios", "swift", "jekyll"],',
    '  "meta": {',
    '    "framework": "Jekyll + Chirpy",',
    '    "lang": "zh-CN",',
    '    "online": true,',
    '    "builds": 202,',
    '    "note": null',
    '  }',
    '}'
  ].join('\n');

  function runSample() {
    setInput(SAMPLE);
    if (els.input) { els.input.selectionStart = 0; els.input.selectionEnd = 0; }
  }

  /* ---------- 事件绑定 ---------- */

  if (!isWindowMode) {
    els.input.addEventListener('input', function () {
      clearTimeout(state.timer);
      state.timer = setTimeout(render, DEBOUNCE_MS);
    });
    if (els.sampleBtn) els.sampleBtn.addEventListener('click', runSample);
    if (els.fmtBtn) els.fmtBtn.addEventListener('click', formatJson);
    if (els.minifyBtn) els.minifyBtn.addEventListener('click', minifyJson);
    if (els.sortBtn) els.sortBtn.addEventListener('click', sortJson);
    if (els.repairBtn) els.repairBtn.addEventListener('click', repairJson);
    if (els.copyBtn) els.copyBtn.addEventListener('click', copyJson);
    if (els.downloadBtn) els.downloadBtn.addEventListener('click', downloadJson);
  }

  if (els.treeSearch) els.treeSearch.addEventListener('input', function () { runSearch(els.treeSearch.value); });
  if (els.treeExpand) els.treeExpand.addEventListener('click', expandAll);
  if (els.treeCollapse) els.treeCollapse.addEventListener('click', collapseAll);
  if (els.treeWindow) {
    els.treeWindow.addEventListener('click', function () {
      var text = els.input ? els.input.value : '';
      if (!text.trim()) { if (window.alert) window.alert(t('alert-empty')); return; }
      try {
        sessionStorage.setItem('jf-tree-data', text);
        window.open('/assets/tools/json-format/tree.html', '_blank');
      } catch (e) {
        if (window.alert) window.alert(t('alert-window'));
      }
    });
  }

  /* ---------- 全屏窗口模式 ---------- */

  function bootWindow() {
    var text = '';
    try {
      text = sessionStorage.getItem('jf-tree-data') || '';
    } catch (e) { /* 隐私模式不可用 */ }
    if (!text.trim()) {
      if (els.tree) els.tree.innerHTML = '<div class="jf-placeholder">' + t('placeholder-nonode') + '</div>';
      return;
    }
    var r = parseSmart(text);
    if (r.error) {
      showError(r.error, text);
      return;
    }
    state.repaired = r.repaired;
    state.fixed = r.fixed;
    renderTree(r.obj, text);
  }

  /* ---------- 启动 ---------- */

  if (isWindowMode) {
    if (!document.title) document.title = t('win-title');
    bootWindow();
  } else {
    reset();
  }
})();
