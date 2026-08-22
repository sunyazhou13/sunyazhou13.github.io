/**
 * 进制转换工具 — 纯前端实现，输入不上传
 *
 * 功能：二进制 / 八进制 / 十进制 / 十六进制实时联动转换
 * 采用 BigInt 计算，支持任意位数整数与正负数，无精度上限。
 * 资源全部位于 /assets/tools/base-converter/，页面结构见 /tools/base-converter.md
 */

(function () {
  'use strict';

  var root = document.getElementById('bc-app');
  if (!root) return;

  var FIELDS = [
    { id: 'bin', base: 2, prefix: '0b', label: '二进制' },
    { id: 'oct', base: 8, prefix: '0o', label: '八进制' },
    { id: 'dec', base: 10, prefix: '', label: '十进制' },
    { id: 'hex', base: 16, prefix: '0x', label: '十六进制' }
  ];

  var els = {
    fields: {},
    copies: {},
    error: document.getElementById('bc-error')
  };

  FIELDS.forEach(function (f) {
    els.fields[f.id] = document.getElementById('bc-' + f.id);
    els.copies[f.id] = root.querySelector('[data-copy="bc-' + f.id + '"]');
  });

  var state = { timer: null };
  var DEBOUNCE_MS = 180;

  var CHARS = '0123456789abcdef';

  function txt(n) { return n == null ? '' : String(n); }

  function showError(msg) {
    els.error.hidden = !msg;
    els.error.textContent = msg || '';
  }

  /* ---------- 进制核心转换（BigInt） ---------- */

  function parseBigInt(str, f) {
    var s = txt(str).replace(/[\s_]+/g, '');
    if (!s) return { empty: true };
    var neg = false;
    var head = s.charAt(0);
    if (head === '+' || head === '-') {
      neg = head === '-';
      s = s.slice(1);
    }
    // 去掉可选前缀（0x / 0b / 0o），十六进制大小写均可
    if (f.prefix && s.slice(0, f.prefix.length).toLowerCase() === f.prefix) {
      s = s.slice(f.prefix.length);
    }
    if (!s.length) return { error: f.label + '：只有前缀，没有数字' };
    var n = 0n;
    var bigBase = BigInt(f.base);
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i).toLowerCase();
      var v = CHARS.indexOf(c);
      if (v < 0 || v >= f.base) {
        return { error: f.label + '：包含非法字符「' + c + '」' };
      }
      n = n * bigBase + BigInt(v);
    }
    return { n: neg ? -n : n };
  }

  function toBase(n, base) {
    if (n === 0n) return '0';
    var neg = n < 0n;
    if (neg) n = -n;
    var b = BigInt(base);
    var out = '';
    while (n > 0n) {
      out = CHARS.charAt(Number(n % b)) + out;
      n = n / b;
    }
    return (neg ? '-' : '') + out;
  }

  function convertFrom(fieldId) {
    var src = null;
    for (var i = 0; i < FIELDS.length; i++) {
      if (FIELDS[i].id === fieldId) { src = FIELDS[i]; break; }
    }
    var parsed = parseBigInt(els.fields[fieldId].value, src);
    if (parsed.empty) {
      // 输入为空：清空其它框与错误
      FIELDS.forEach(function (f) {
        if (f.id !== fieldId) els.fields[f.id].value = '';
      });
      showError('');
      return;
    }
    if (parsed.error) {
      showError(parsed.error);
      return;
    }
    showError('');
    FIELDS.forEach(function (f) {
      if (f.id !== fieldId) {
        els.fields[f.id].value = toBase(parsed.n, f.base);
      }
    });
  }

  /* ---------- 复制 ---------- */

  function copyFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) { /* 忽略复制失败 */ }
    ta.remove();
  }

  function flashCopied(btn) {
    var old = btn.textContent;
    btn.textContent = '已复制';
    btn.classList.add('bc-copied');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.textContent = old;
      btn.classList.remove('bc-copied');
    }, 1200);
  }

  function copyField(fieldId) {
    var value = els.fields[fieldId].value;
    if (!value) return;
    var btn = els.copies[fieldId];
    function done() { flashCopied(btn); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done, function () {
        copyFallback(value);
        done();
      });
    } else {
      copyFallback(value);
      done();
    }
  }

  /* ---------- 事件绑定 ---------- */

  FIELDS.forEach(function (f) {
    els.fields[f.id].addEventListener('input', function () {
      clearTimeout(state.timer);
      state.timer = setTimeout(function () { convertFrom(f.id); }, DEBOUNCE_MS);
    });
    els.copies[f.id].addEventListener('click', function () { copyField(f.id); });
  });

})();
