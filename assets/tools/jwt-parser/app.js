/**
 * JWT 解析 — 纯前端，Token 不上传
 *
 * 粘贴 JWT（header.payload.signature）：
 *   - Base64URL 解码 Header / Payload，渲染为带语法高亮的 JSON 树
 *   - 高亮 exp，计算剩余有效时间 / 是否过期
 *   - HMAC-SHA256（HS256）纯前端签名校验（crypto.subtle）
 *   - 「篡改尝试」：改动 Payload 但保留原签名，演示签名立即失效
 *   - 注入自选 Payload，用演示秘钥重新签名生成新 Token
 *
 * 类名前缀 jp-，与既有工具同构。页面结构见 /tools/jwt-parser.md
 */
(function () {
  'use strict';

  var ROOT = document.getElementById('jp-app');
  if (!ROOT) return;
  /* 语言感知文案（zh / en），跟随 document.documentElement.lang */
  var LANG = (document.documentElement.lang || '').toLowerCase() === 'en' ? 'en' : 'zh';
  var I18N = {
    zh: {
      'dur-sec': ' 秒',
      'dur-min': ' 分钟',
      'dur-h': ' 小时',
      'dur-d': ' 天',
      'dur-mon': ' 个月',
      'expired-pre': '已过期 ',
      'remain-pre': '剩余 ',
      'day-unit': ' 天',
      'jwt-format-bad-pre': 'JWT 格式错误：应包含 3 段（header.payload.signature），当前 ',
      'jwt-format-bad-post': ' 段',
      'b64-decode-fail': 'Base64URL 解码失败：',
      'sig-missing-alg': '缺少 alg',
      'sig-missing-alg-detail': 'Header 中未声明算法',
      'sig-none': '算法 none（无签名）',
      'sig-none-detail': '该 Token 声明未签名，可被任意伪造，请勿信任。',
      'sig-unsupported': '不支持的算法',
      'sig-unsupported-detail-pre': ' 不在本工具 HS256 校验范围，仅展示解码结果。',
      'sig-no-webcrypto': '环境无 WebCrypto',
      'sig-no-webcrypto-detail': '当前非 HTTPS 安全上下文，无法完成 HMAC 校验。',
      'verifying': '校验中…',
      'sig-valid': '签名有效',
      'sig-valid-detail': 'HMAC-SHA256 校验通过（演示秘钥 hs256-secret）。',
      'sig-mismatch': '签名不匹配',
      'sig-mismatch-detail': '签名段与 header.payload 不一致：Token 已被改动，或秘钥不符。',
      'sig-fail': '校验失败',
      'sig-fail-detail': '当前环境无法完成 HMAC 校验。',
      'need-paste-jwt': '请先粘贴 JWT 字符串',
      'parse-ok-pre': '解析成功 · alg=',
      'parse-ok-mid': ' · 签名段 ',
      'parse-ok-post': '…',
      'need-parse-first': '请先解析一个 JWT，再尝试篡改',
      'sig-still-valid': '签名仍然有效',
      'sig-still-valid-detail': '（同一秘钥下的未修改 Token）。',
      'tamper-mismatch-detail': '改了 Payload 但保留原签名：没有秘钥无法重新签名，服务端会一刀拒绝。',
      'tamper-note': '已模拟篡改：注入 role=admin、改期到 2000 年并保留原签名 —— 下方校验应显示「签名不匹配」。',
      'need-payload': '请先输入自定义 Payload JSON',
      'payload-not-json-pre': 'Payload 不是合法 JSON：',
      'no-webcrypto-sign': '当前环境无 WebCrypto，无法签名',
      'signed-note': '已签名生成新 Token（演示秘钥 hs256-secret），在上方输入框可复制。',
      'sign-fail-pre': '签名失败：',
      'exp-eq-pre': 'exp = ',
      'exp-eq-mid': ' · ',
      'exp-eq-post-pre': '（',
      'exp-eq-post-post': '）',
    },
    en: {
      'dur-sec': ' sec',
      'dur-min': ' min',
      'dur-h': ' h',
      'dur-d': ' days',
      'dur-mon': ' months',
      'expired-pre': 'Expired ',
      'remain-pre': 'Remaining ',
      'day-unit': ' days',
      'jwt-format-bad-pre': 'Invalid JWT format: expected 3 segments (header.payload.signature), got ',
      'jwt-format-bad-post': ' segments',
      'b64-decode-fail': 'Base64URL decode failed: ',
      'sig-missing-alg': 'Missing alg',
      'sig-missing-alg-detail': 'No algorithm declared in the header',
      'sig-none': 'Algorithm "none" (unsigned)',
      'sig-none-detail': 'This token claims to be unsigned and can be forged by anyone; do not trust it.',
      'sig-unsupported': 'Unsupported algorithm',
      'sig-unsupported-detail-pre': ' is outside this tool\'s HS256 scope; only the decoded result is shown.',
      'sig-no-webcrypto': 'No WebCrypto',
      'sig-no-webcrypto-detail': 'Not an HTTPS secure context; HMAC verification is unavailable.',
      'verifying': 'Verifying…',
      'sig-valid': 'Signature valid',
      'sig-valid-detail': 'HMAC-SHA256 verified (demo key hs256-secret).',
      'sig-mismatch': 'Signature mismatch',
      'sig-mismatch-detail': 'The signature segment does not match header.payload: the token was modified or the key is wrong.',
      'sig-fail': 'Verification failed',
      'sig-fail-detail': 'HMAC verification cannot complete in this environment.',
      'need-paste-jwt': 'Paste a JWT string first',
      'parse-ok-pre': 'Parsed · alg=',
      'parse-ok-mid': ' · signature ',
      'parse-ok-post': '…',
      'need-parse-first': 'Parse a JWT first before tampering',
      'sig-still-valid': 'Signature still valid',
      'sig-still-valid-detail': '(the unmodified token under the same key).',
      'tamper-mismatch-detail': 'Payload changed but the original signature kept: without the key it cannot be re-signed, so the server will outright reject it.',
      'tamper-note': 'Simulated tampering: injected role=admin, backdated exp to 2000, kept the original signature — the check below should show "Signature mismatch".',
      'need-payload': 'Enter a custom Payload JSON first',
      'payload-not-json-pre': 'Payload is not valid JSON: ',
      'no-webcrypto-sign': 'No WebCrypto in this environment; cannot sign',
      'signed-note': 'Signed a new token (demo key hs256-secret); copy it from the input box above.',
      'sign-fail-pre': 'Signing failed: ',
      'exp-eq-pre': 'exp = ',
      'exp-eq-mid': ' · ',
      'exp-eq-post-pre': ' (',
      'exp-eq-post-post': ')',
    }
  };
  function t(key) { return I18N[LANG][key] != null ? I18N[LANG][key] : key; }


  function $id(k) { return document.getElementById('jp-' + k); }
  var els = {
    input: $id('input'), parse: $id('parse'), sample: $id('sample'), clear: $id('clear'),
    status: $id('status'), cards: $id('cards'),
    header: $id('header'), payload: $id('payload'), expLine: $id('exp-line'),
    sigBadge: $id('sig-badge'), sigDetail: $id('sig-detail'), tamper: $id('tamper'),
    plain: $id('plain'), sign: $id('sign'), signed: $id('signed')
  };

  var SECRET = 'hs256-secret';
  var DEFAULT_HEADER = { alg: 'HS256', typ: 'JWT' };
  var SAMPLE = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3NjUwMDAwMDB9',
    'TsGbBm7F8A1e1XZ1_kBgQ_xhJZfRtqvWZLbVcCg8q2s'
  ].join('.');

  var state = { token: '' };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function note(msg, warn) { els.status.textContent = msg || ''; els.status.classList.toggle('jp-warn', !!warn); }
  function blankStatus() { els.status.textContent = ''; els.status.classList.remove('jp-warn'); }
  function hasWebCrypto() { return !!(window.crypto && window.crypto.subtle && window.crypto.subtle.digest); }

  /* ---------- Base64URL ---------- */
  function b64UrlToB64(s) { return s.replace(/-/g, '+').replace(/_/g, '/'); }
  function toBytes(str) {
    var out = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
    return out;
  }
  function b64DecodeToBytes(s) {
    var b64 = b64UrlToB64(s);
    while (b64.length % 4 !== 0) b64 += '=';
    if (typeof Buffer !== 'undefined') {
      // jsdom / Node 自测环境
      return new Uint8Array(Buffer.from(b64, 'base64'));
    }
    var bin = atob(b64);
    var raw = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) raw[i] = bin.charCodeAt(i) & 0xff;
    return raw;
  }
  function bytesToB64Url(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    var b64;
    if (typeof Buffer !== 'undefined') {
      b64 = Buffer.from(bin, 'binary').toString('base64');
    } else {
      b64 = btoa(bin);
    }
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeSegment(seg) {
    var bytes = b64DecodeToBytes(seg);
    if (typeof TextDecoder === 'function') return new TextDecoder('utf-8').decode(bytes);
    return decodeURIComponent(escape(String.fromCharCode.apply(null, bytes)));
  }

  /* ---------- JSON 高亮渲染 ---------- */
  function renderJson(v, key) {
    if (v === null) return '<span class="jp-null">null</span>';
    var t = typeof v;
    if (t === 'string') return '<span class="jp-str">"' + esc(v) + '"</span>';
    if (t === 'number') {
      if (key === 'exp') return '<span class="jp-exp-val">' + v + '</span>';
      return '<span class="jp-num">' + v + '</span>';
    }
    if (t === 'boolean') return '<span class="jp-bool">' + v + '</span>';
    var isArr = Array.isArray(v);
    var keys;
    if (isArr) { keys = []; for (var i = 0; i < v.length; i++) keys.push(i); }
    else { keys = Object.keys(v); }
    if (!keys.length) return isArr ? '<span class="jp-bracket">[ ]</span>' : '<span class="jp-bracket">{ }</span>';
    var inner = keys.map(function (k) {
      var val = renderJson(v[k], k);
      var head = isArr ? '' : '<span class="jp-key">"' + esc(String(k)) + '"</span>: ';
      return '<div class="jp-pline">' + head + val + '</div>';
    }).join('');
    return (isArr ? '<span class="jp-bracket">[</span>' : '<span class="jp-bracket">{</span>') +
      '<div class="jp-plex">' + inner + '</div>' +
      (isArr ? '<span class="jp-bracket">]</span>' : '<span class="jp-bracket">}</span>');
  }

  /* ---------- 时间 ---------- */
  function fmtDur(ms) {
    var s = Math.floor(ms / 1000);
    if (s < 60) return s + t('dur-sec');
    var m = Math.floor(s / 60);
    if (m < 60) return m + t('dur-min');
    var h = Math.floor(m / 60);
    if (h < 24) return h + t('dur-h');
    var d = Math.floor(h / 24);
    if (d < 60) return d + t('dur-d');
    return Math.floor(d / 30) + t('dur-mon');
  }
  function expInfo(expVal) {
    var expMs = expVal * 1000;
    var diff = expMs - Date.now();
    var expired = diff <= 0;
    var remain;
    if (expired) remain = t('expired-pre') + fmtDur(-diff);
    else if (diff >= 86400000) remain = t('remain-pre') + (Math.round(diff / 864000) / 10) + t('day-unit');
    else remain = t('remain-pre') + fmtDur(diff);
    return { expired: expired, remain: remain, date: new Date(expMs).toLocaleString(LANG === 'en' ? 'en-GB' : 'zh-CN') };
  }

  /* ---------- 签名 ---------- */
  function concatBytes(a, b) {
    var out = new Uint8Array(a.length + b.length);
    out.set(a, 0); out.set(b, a.length);
    return out;
  }
  function hmacSha256(keyBytes, dataBytes) {
    var algo = { name: 'HMAC', hash: 'SHA-256' };
    return crypto.subtle.importKey('raw', keyBytes, algo, false, ['sign']).then(function (k) {
      return crypto.subtle.sign(algo, k, dataBytes);
    }).then(function (sig) { return new Uint8Array(sig); });
  }
  function equalBytes(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }
  function buildToken(header, payloadText, secret) {
    var h = bytesToB64Url(new TextEncoder().encode(JSON.stringify(header)));
    var p = bytesToB64Url(new TextEncoder().encode(payloadText));
    return hmacSha256(toBytes(secret), toBytes(h + '.' + p)).then(function (sig) {
      return h + '.' + p + '.' + bytesToB64Url(sig);
    });
  }

  /* ---------- 解析与渲染 ---------- */
  function parseToken(token) {
    var parts = token.split('.');
    if (parts.length !== 3) {
      note(t('jwt-format-bad-pre') + parts.length + t('jwt-format-bad-post'));
      return null;
    }
    var header, payload;
    try {
      header = JSON.parse(decodeSegment(parts[0]));
      payload = JSON.parse(decodeSegment(parts[1]));
    } catch (e) {
      note(t('b64-decode-fail') + (e && e.message || e));
      return null;
    }
    return { header: header, payload: payload, parts: parts };
  }

  function setSig(status, type, detail) {
    els.sigBadge.textContent = status;
    els.sigBadge.className = 'jp-sig-badge jp-sig-' + type;
    els.sigDetail.textContent = detail || '';
  }

  function renderHeader(obj) { els.header.innerHTML = renderJson(obj); }

  function renderPayload(obj) {
    els.payload.innerHTML = renderJson(obj);
    if (obj && typeof obj.exp === 'number') {
      var e = expInfo(obj.exp);
      els.expLine.hidden = false;
      els.expLine.className = 'jp-exp' + (e.expired ? ' jp-expired' : '');
      els.expLine.textContent = t('exp-eq-pre') + obj.exp + t('exp-eq-mid') + e.remain + t('exp-eq-post-pre') + e.date + t('exp-eq-post-post');
    } else {
      els.expLine.hidden = true;
    }
  }

  function verifyAndRender(parsed) {
    els.cards.hidden = false;
    renderHeader(parsed.header);
    renderPayload(parsed.payload);
    var h = parsed.header;
    if (!h || !h.alg) { setSig(t('sig-missing-alg'), 'warn', t('sig-missing-alg-detail')); return; }
    if (h.alg === 'none') { setSig(t('sig-none'), 'fail', t('sig-none-detail')); return; }
    if (h.alg !== 'HS256') { setSig(t('sig-unsupported'), 'warn', h.alg + t('sig-unsupported-detail-pre')); return; }
    if (!hasWebCrypto()) { setSig(t('sig-no-webcrypto'), 'fail', t('sig-no-webcrypto-detail')); return; }
    setSig(t('verifying'), 'loading', '');
    hmacSha256(toBytes(SECRET), toBytes(parsed.parts[0] + '.' + parsed.parts[1])).then(function (sig) {
      var got = null;
      try { got = b64DecodeToBytes(parsed.parts[2]); } catch (e) { got = null; }
      if (equalBytes(sig, got)) {
        setSig(t('sig-valid'), 'ok', t('sig-valid-detail'));
      } else {
        setSig(t('sig-mismatch'), 'fail', t('sig-mismatch-detail'));
      }
    }).catch(function () {
      setSig(t('sig-fail'), 'fail', t('sig-fail-detail'));
    });
  }

  function onParse() {
    var token = els.input.value.trim();
    if (!token) { note(t('need-paste-jwt')); return; }
    var parsed = parseToken(token);
    if (!parsed) return;
    state.token = token;
    note(t('parse-ok-pre') + (parsed.header && parsed.header.alg || '?') +
      t('parse-ok-mid') + parsed.parts[2].slice(0, 12) + t('parse-ok-post'), false);
    verifyAndRender(parsed);
  }

  function onTamper() {
    if (!state.token) { note(t('need-parse-first')); return; }
    var parsed = parseToken(state.token);
    if (!parsed) return;
    var p = (parsed.payload && typeof parsed.payload === 'object' && !Array.isArray(parsed.payload))
      ? JSON.parse(JSON.stringify(parsed.payload)) : {};
    p.role = 'admin';
    if (p.admin !== undefined) p.admin = true;
    p.exp = 946684800; // 2000-01-01 00:00:00
    delete p.iss; delete p.sub; delete p.email;
    var tampered = parsed.parts[0] + '.' + bytesToB64Url(toBytes(JSON.stringify(p))) + '.' + parsed.parts[2];
    state.token = tampered;
    els.input.value = tampered;
    var tp = parseToken(tampered);
    if (!tp) return;
    els.cards.hidden = false;
    renderHeader(tp.header);
    renderPayload(tp.payload);
    setSig(t('verifying'), 'loading', '');
    hmacSha256(toBytes(SECRET), toBytes(tp.parts[0] + '.' + tp.parts[1])).then(function (sig) {
      var got = null;
      try { got = b64DecodeToBytes(tp.parts[2]); } catch (e) { got = null; }
      if (equalBytes(sig, got)) {
        setSig(t('sig-still-valid'), 'ok', t('sig-still-valid-detail'));
      } else {
        setSig(t('sig-mismatch'), 'fail', t('tamper-mismatch-detail'));
      }
    }).catch(function () { setSig(t('sig-fail'), 'fail', ''); });
    note(t('tamper-note'), true);
  }

  /* ---------- 事件绑定 ---------- */
  els.parse.addEventListener('click', onParse);
  els.sample.addEventListener('click', function () { els.input.value = SAMPLE; onParse(); });
  els.clear.addEventListener('click', function () {
    els.input.value = '';
    els.cards.hidden = true;
    els.signed.hidden = true;
    state.token = '';
    blankStatus();
  });
  els.tamper.addEventListener('click', onTamper);

  els.sign.addEventListener('click', function () {
    var txt = els.plain.value.trim();
    if (!txt) { note(t('need-payload')); return; }
    var obj;
    try { obj = JSON.parse(txt); } catch (e) { note(t('payload-not-json-pre') + (e && e.message || e)); return; }
    if (!hasWebCrypto()) { note(t('no-webcrypto-sign')); return; }
    buildToken(DEFAULT_HEADER, JSON.stringify(obj), SECRET).then(function (token) {
      els.signed.hidden = false;
      els.signed.textContent = token;
      els.input.value = token;
      state.token = token;
      var parsed = parseToken(token);
      if (parsed) verifyAndRender(parsed);
      note(t('signed-note'));
    }).catch(function (e) {
      note(t('sign-fail-pre') + (e && e.message || e));
    });
  });

  /* ---------- 初始：自动载入示例 ---------- */
  els.input.value = SAMPLE;
  onParse();
})();
