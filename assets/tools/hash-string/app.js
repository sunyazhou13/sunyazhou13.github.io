/**
 * 字符串 Hash 工具 — 纯前端实现，输入不上传
 *
 * 支持的哈希算法：
 *   - MD5：纯 JS 实现，无外部依赖
 *   - SHA1 / SHA256 / SHA384 / SHA512：WebCrypto crypto.subtle.digest
 *
 * 统一按 UTF-8 编码（TextEncoder）计算，结果以十六进制小写展示，
 * 可切换为大写；每行结果可一键复制。
 *
 * 注意：crypto.subtle 仅在 secure context（HTTPS 或 localhost）下可用，
 * 非安全上下文会明确提示 SHA 系列不可用（MD5 仍可正常计算）。
 *
 * 资源全部位于 /assets/tools/hash-string/，与博客其它功能零耦合。
 * 页面结构见 /tools/hash-string.md
 */

(function () {
  'use strict';

  var root = document.getElementById('hsh-app');
  if (!root) return;
  /* 语言感知文案（zh / en），跟随 document.documentElement.lang */
  var LANG = (document.documentElement.lang || '').toLowerCase() === 'en' ? 'en' : 'zh';
  var I18N = {
    zh: {
      'badge-webcrypto-ok': 'MD5：纯 JS 实现 · SHA1–SHA512：WebCrypto 可用',
      'badge-webcrypto-no': '当前环境无 WebCrypto，SHA 系列不可用（需 HTTPS 或 localhost）',
      'total-pre': '总字符数：',
      'ascii-pre': '半角空格 (0x20)：',
      'full-pre': '全角空格 (U+3000)：',
      'starts-pre': '以空格开头：',
      'ends-pre': '以空格结尾：',
      'consec-pre': '包含连续空格：',
      'yes-word': '是',
      'no-word': '否',
      'unit-count': ' 个',
      'copy-btn': '复制',
      'computing': '计算中…',
      'empty-input': '请先在输入框填写字符串，再点击下方按钮生成对应哈希',
      'no-webcrypto-row': '不可用：需要 HTTPS 安全上下文（WebCrypto）',
      'compute-fail': '计算失败',
      'copied-flash': '已复制',
    },
    en: {
      'badge-webcrypto-ok': 'MD5: pure JS · SHA1–SHA512: WebCrypto available',
      'badge-webcrypto-no': 'No WebCrypto in this environment; the SHA family is unavailable (needs HTTPS or localhost)',
      'total-pre': 'Total chars: ',
      'ascii-pre': 'Half-width spaces (0x20): ',
      'full-pre': 'Full-width spaces (U+3000): ',
      'starts-pre': 'Starts with space: ',
      'ends-pre': 'Ends with space: ',
      'consec-pre': 'Has consecutive spaces: ',
      'yes-word': 'yes',
      'no-word': 'no',
      'unit-count': ' ',
      'copy-btn': 'Copy',
      'computing': 'Computing…',
      'empty-input': 'Type a string into the input box first, then click a button below to generate that hash',
      'no-webcrypto-row': 'Unavailable: requires an HTTPS secure context (WebCrypto)',
      'compute-fail': 'Computation failed',
      'copied-flash': 'Copied',
    }
  };
  function t(key) { return I18N[LANG][key] != null ? I18N[LANG][key] : key; }


  var els = {
    engineBadge: document.getElementById('hsh-engine-badge'),
    input: document.getElementById('hsh-input'),
    upper: document.getElementById('hsh-upper'),
    space: document.getElementById('hsh-space'),
    spaceList: document.getElementById('hsh-space-list'),
    results: document.getElementById('hsh-results'),
    placeholder: document.getElementById('hsh-placeholder'),
    actions: document.getElementById('hsh-actions')
  };

  var SHA_SPECS = [
    { name: 'SHA1', digest: 'SHA-1' },
    { name: 'SHA256', digest: 'SHA-256' },
    { name: 'SHA384', digest: 'SHA-384' },
    { name: 'SHA512', digest: 'SHA-512' }
  ];
  var DEBOUNCE_MS = 250;

  var state = {
    upper: false,
    timer: null
  };

  /* ---- MD5 纯 JS 实现（无外部依赖，UTF-8 编码） ---- */

  function safeAdd(x, y) {
    var lsw = (x & 0xffff) + (y & 0xffff);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function bitRotateLeft(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  function md5cmn(q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }

  function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }

  function binlMD5(x, len) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    var i, olda, oldb, oldc, oldd;
    var a = 1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d = 271733878;

    for (i = 0; i < x.length; i += 16) {
      olda = a; oldb = b; oldc = c; oldd = d;

      a = md5ff(a, b, c, d, x[i], 7, -680876936);
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

      a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

      a = md5ii(a, b, c, d, x[i], 6, -198630844);
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }

  function binl2hex(binarray) {
    var hexTab = '0123456789abcdef';
    var str = '';
    for (var i = 0; i < binarray.length * 4; i++) {
      str += hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) +
        hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xf);
    }
    return str;
  }

  function md5(str) {
    var bytes = new TextEncoder().encode(str);
    var x = [];
    var i;
    for (i = 0; i < bytes.length; i++) {
      x[i >> 2] = (x[i >> 2] || 0) | ((bytes[i] & 0xff) << ((i % 4) * 8));
    }
    return binl2hex(binlMD5(x, bytes.length * 8));
  }

  /* ---- MD5 实现结束 ---- */

  function hasWebCrypto() {
    return !!(window.crypto && window.crypto.subtle && window.crypto.subtle.digest);
  }

  function bufToHex(buf) {
    var bytes = new Uint8Array(buf);
    var out = '';
    for (var i = 0; i < bytes.length; i++) {
      out += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
    }
    return out;
  }

  function setBadge(text, cls) {
    els.engineBadge.textContent = text;
    els.engineBadge.className = 'hsh-badge' + (cls ? ' hsh-badge-' + cls : '');
  }

  function renderBadge() {
    if (hasWebCrypto()) {
      setBadge(t('badge-webcrypto-ok'), 'ok');
    } else {
      setBadge(t('badge-webcrypto-no'), 'error');
    }
  }

  /* ---------- 空格检测 ---------- */

  function analyzeSpaces(text) {
    return {
      total: text.length,
      ascii: (text.match(/ /g) || []).length,
      full: (text.match(/\u3000/g) || []).length,
      starts: /^[ \u3000]/.test(text),
      ends: /[ \u3000]$/.test(text),
      consecutive: /(?:[ \u3000]){2,}/.test(text)
    };
  }

  function renderSpaceStats(text) {
    if (!text) {
      els.space.hidden = true;
      els.spaceList.innerHTML = '';
      return;
    }
    var s = analyzeSpaces(text);
    var items = [
      t('total-pre') + s.total,
      t('ascii-pre') + s.ascii + t('unit-count'),
      t('full-pre') + s.full + t('unit-count'),
      t('starts-pre') + (s.starts ? t('yes-word') : t('no-word')),
      t('ends-pre') + (s.ends ? t('yes-word') : t('no-word')),
      t('consec-pre') + (s.consecutive ? t('yes-word') : t('no-word'))
    ];
    els.space.hidden = false;
    els.spaceList.innerHTML = items.map(function (t) {
      return '<li>' + t + '</li>';
    }).join('');
  }

  /* ---------- 结果渲染 ---------- */

  function makeRow(algo) {
    var row = document.createElement('div');
    row.className = 'hsh-row';

    var name = document.createElement('span');
    name.className = 'hsh-algo';
    name.textContent = algo;

    var code = document.createElement('code');
    code.className = 'hsh-hash';
    code.setAttribute('data-hash', '');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hsh-btn hsh-btn-copy';
    btn.textContent = t('copy-btn');
    btn.addEventListener('click', function () {
      copyFrom(btn);
    });

    row.appendChild(name);
    row.appendChild(code);
    row.appendChild(btn);
    return row;
  }

  function fillRow(row, hex) {
    var code = row.querySelector('.hsh-hash');
    var btn = row.querySelector('.hsh-btn-copy');
    if (hex === t('computing')) {
      code.textContent = t('computing');
      code.removeAttribute('data-hash');
      if (btn) btn.disabled = true;
      return;
    }
    row.classList.remove('hsh-row-error');
    code.setAttribute('data-hash', hex);
    code.textContent = state.upper ? hex.toUpperCase() : hex;
    if (btn) btn.disabled = false;
  }

  function failRow(row, msg) {
    row.classList.add('hsh-row-error');
    var code = row.querySelector('.hsh-hash');
    code.textContent = msg;
    code.removeAttribute('data-hash');
    var btn = row.querySelector('.hsh-btn-copy');
    if (btn) btn.disabled = true;
  }

  function applyCase() {
    var codes = els.results.querySelectorAll('.hsh-hash');
    for (var i = 0; i < codes.length; i++) {
      var lower = codes[i].getAttribute('data-hash');
      if (!lower) continue;
      codes[i].textContent = state.upper ? lower.toUpperCase() : lower;
    }
  }

  function showPlaceholder() {
    els.placeholder.style.display = '';
    els.results.innerHTML = '';
  }

  function handleInput() {
    renderSpaceStats(els.input.value);
    // 输入一旦变化，旧结果即失效，清空等待重新生成
    showPlaceholder();
  }

  function ensureRow(algo) {
    var rows = els.results.querySelectorAll('.hsh-row');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].firstElementChild && rows[i].firstElementChild.textContent === algo) {
        return rows[i];
      }
    }
    return null;
  }

  function generateAlgo(algo) {
    var text = els.input.value;
    if (!text) {
      els.placeholder.textContent = t('empty-input');
      els.placeholder.style.display = '';
      return;
    }
    els.placeholder.style.display = 'none';

    var row = ensureRow(algo);
    if (!row) {
      row = makeRow(algo);
      els.results.appendChild(row);
    }

    // MD5：纯 JS，同步即时返回
    if (algo === 'MD5') {
      fillRow(row, md5(text));
      return;
    }

    var spec = null;
    for (var k = 0; k < SHA_SPECS.length; k++) {
      if (SHA_SPECS[k].name === algo) {
        spec = SHA_SPECS[k];
        break;
      }
    }
    if (!spec) return;

    if (!hasWebCrypto()) {
      failRow(row, t('no-webcrypto-row'));
      return;
    }

    fillRow(row, t('computing'));
    crypto.subtle.digest(spec.digest, new TextEncoder().encode(text))
      .then(function (buf) {
        fillRow(row, bufToHex(buf));
      })
      .catch(function () {
        failRow(row, t('compute-fail'));
      });
  }

  /* ---------- 复制 ---------- */

  function copyText(text, btn) {
    function done() {
      flashCopied(btn);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        copyFallback(text);
        done();
      });
    } else {
      copyFallback(text);
      done();
    }
  }

  function copyFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      /* 忽略复制失败 */
    }
    ta.remove();
  }

  function flashCopied(btn) {
    var old = btn.textContent;
    btn.textContent = t('copied-flash');
    btn.classList.add('hsh-copied');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.textContent = old;
      btn.classList.remove('hsh-copied');
    }, 1200);
  }

  function copyFrom(btn) {
    var row = btn.parentNode;
    var code = row.querySelector('.hsh-hash');
    if (!code) return;
    var text = code.getAttribute('data-hash');
    if (!text) return;
    copyText(state.upper ? text.toUpperCase() : text, btn);
  }

  /* ---------- 事件绑定 ---------- */

  els.input.addEventListener('input', function () {
    clearTimeout(state.timer);
    state.timer = setTimeout(handleInput, DEBOUNCE_MS);
  });

  if (els.actions) {
    els.actions.addEventListener('click', function (event) {
      var btn = event.target;
      while (btn && btn !== els.actions && !(btn.getAttribute && btn.getAttribute('data-algo'))) {
        btn = btn.parentNode;
      }
      if (!btn || btn === els.actions) return;
      generateAlgo(btn.getAttribute('data-algo'));
    });
  }

  els.upper.addEventListener('change', function () {
    state.upper = els.upper.checked;
    applyCase();
  });

  /* ---------- 启动 ---------- */

  renderBadge();
})();
