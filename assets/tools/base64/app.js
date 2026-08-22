/**
 * Base64 编码 / 解码工具 — 纯前端实现，输入不上传
 *
 * 功能：
 *   - 编码：UTF-8 文本 -> Base64（RFC 4648 标准，可选 URL-safe 变体）
 *   - 解码：Base64 -> UTF-8 文本（自动忽略换行空白，支持 URL-safe 还原）
 *
 * 基于 Web API（TextEncoder / TextDecoder / btoa / atob），无外部依赖。
 * 资源全部位于 /assets/tools/base64/，页面结构见 /tools/base64.md
 */

(function () {
  'use strict';

  var root = document.getElementById('b64-app');
  if (!root) return;

  var els = {
    input: document.getElementById('b64-input'),
    encodeBtn: document.getElementById('b64-encode'),
    decodeBtn: document.getElementById('b64-decode'),
    urlSafe: document.getElementById('b64-urlsafe'),
    output: document.getElementById('b64-output'),
    result: document.getElementById('b64-result'),
    meta: document.getElementById('b64-meta'),
    copyBtn: document.getElementById('b64-copy'),
    placeholder: document.getElementById('b64-placeholder'),
    error: document.getElementById('b64-error')
  };

  var state = {
    mode: null, // 'encode' | 'decode' | null
    urlSafe: false,
    timer: null
  };
  var DEBOUNCE_MS = 250;

  function txt(n) { return n == null ? '' : String(n); }

  function setActive(btn, on) {
    btn.classList.toggle('b64-btn-active', on);
  }

  function showError(msg) {
    els.error.textContent = msg;
    els.error.hidden = false;
    els.placeholder.hidden = true;
    els.output.hidden = true;
  }

  function showOutput(text, meta) {
    els.error.hidden = true;
    els.placeholder.hidden = true;
    els.output.hidden = false;
    els.result.value = text;
    els.meta.textContent = meta;
  }

  function reset() {
    state.mode = null;
    setActive(els.encodeBtn, false);
    setActive(els.decodeBtn, false);
    els.placeholder.hidden = false;
    els.output.hidden = true;
    els.error.hidden = true;
  }

  /* ---------- Base64 实现 ---------- */

  function utf8ToBase64(text, urlSafe) {
    var bytes = new TextEncoder().encode(text);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    var b64 = btoa(bin);
    if (urlSafe) {
      b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return b64;
  }

  function base64ToUtf8(text, urlSafe) {
    var s = txt(text).replace(/\s+/g, '');
    if (!s) return '';
    if (urlSafe) {
      s = s.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4 !== 0) s += '=';
    }
    if (/[^A-Za-z0-9+/=]/.test(s) || s.length % 4 !== 0) {
      throw new Error('包含非法字符或长度不正确，不是合法的 Base64 字符串');
    }
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  /* ---------- 动作 ---------- */

  function runEncode() {
    var text = els.input.value;
    if (!text) { reset(); return; }
    state.mode = 'encode';
    var out;
    try {
      out = utf8ToBase64(text, state.urlSafe);
    } catch (e) {
      showError('编码失败：' + txt(e.message || e));
      return;
    }
    showOutput(out, '输入 ' + text.length + ' 字符 / 输出 ' + out.length + ' 字符');
  }

  function runDecode() {
    var text = els.input.value;
    if (!text) { reset(); return; }
    state.mode = 'decode';
    try {
      var out = base64ToUtf8(text, state.urlSafe);
      var bytes = new TextEncoder().encode(out);
      showOutput(out, '输入 ' + text.length + ' 字符 / 输出 ' + bytes.length + ' 字符（UTF-8 编码后字节数）');
    } catch (e) {
      var hint = state.urlSafe ? '' : '；若输入是 URL 安全（- _）格式，请勾选「URL 安全」后重试';
      showError('解码失败：' + txt(e.message || e) + hint);
    }
  }

  function runCurrent() {
    if (state.mode === 'encode') {
      runEncode();
    } else if (state.mode === 'decode') {
      runDecode();
    }
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
    } catch (e) {
      /* 忽略复制失败 */
    }
    ta.remove();
  }

  function flashCopied(btn) {
    var old = btn.textContent;
    btn.textContent = '已复制';
    btn.classList.add('b64-copied');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.textContent = old;
      btn.classList.remove('b64-copied');
    }, 1200);
  }

  function copyResult() {
    if (!els.result.value) return;
    function done() { flashCopied(els.copyBtn); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(els.result.value).then(done, function () {
        copyFallback(els.result.value);
        done();
      });
    } else {
      copyFallback(els.result.value);
      done();
    }
  }

  /* ---------- 事件绑定 ---------- */

  els.input.addEventListener('input', function () {
    clearTimeout(state.timer);
    state.timer = setTimeout(reset, DEBOUNCE_MS);
  });

  els.encodeBtn.addEventListener('click', function () {
    setActive(els.encodeBtn, true);
    setActive(els.decodeBtn, false);
    runEncode();
  });

  els.decodeBtn.addEventListener('click', function () {
    setActive(els.decodeBtn, true);
    setActive(els.encodeBtn, false);
    runDecode();
  });

  els.urlSafe.addEventListener('change', function () {
    state.urlSafe = els.urlSafe.checked;
    // 已有结果时按当前模式重算，让开关即时生效
    if ((state.mode === 'encode' || state.mode === 'decode') && !els.output.hidden) {
      runCurrent();
    }
  });

  els.copyBtn.addEventListener('click', copyResult);

  /* ---------- 启动 ---------- */

  reset();
})();
