/**
 * UUID / ULID 生成 — 纯前端本地生成，不上传
 *
 *   - UUID v4：随机版本（crypto.getRandomValues，弱回退 Math.random）
 *   - ULID：48 位时间戳（Crockford Base32 前 10 位）+ 80 位随机（后 16 位），
 *     时间有序、26 字符。
 *   - 支持复制单个 / 复制全部 / 换一批，快捷生成单条。
 *
 * 类名前缀 uu-，与既有工具同构。页面结构见 /tools/uuid-ulid.md
 */
(function () {
  'use strict';

  var ROOT = document.getElementById('uu-app');
  if (!ROOT) return;
  /* 语言感知文案（zh / en），跟随 document.documentElement.lang */
  var LANG = (document.documentElement.lang || '').toLowerCase() === 'en' ? 'en' : 'zh';
  var I18N = {
    zh: {
      'copy-word': '复制',
      'generated-pre': '已生成 ',
      'generated-mid': ' 个 ',
      'copied-word': '已复制',
      'copy-fail-word': '复制失败',
      'nothing-yet': '还没有可复制的内容，请先生成',
    },
    en: {
      'copy-word': 'Copy',
      'generated-pre': 'Generated ',
      'generated-mid': ' ',
      'copied-word': 'Copied',
      'copy-fail-word': 'Copy failed',
      'nothing-yet': 'Nothing to copy yet — generate some first',
    }
  };
  function t(key) { return I18N[LANG][key] != null ? I18N[LANG][key] : key; }



  function $id
(k) { return document.getElementById('uu-' + k); }
  var els = {
    type: $id('type'), count: $id('count'),
    gen: $id('gen'), more: $id('more'), copyAll: $id('copy-all'),
    quickUuid: $id('quick-uuid'), quickUlid: $id('quick-ulid'),
    status: $id('status'), list: $id('list')
  };

  var CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var state = { list: [] };

  var RAND_STRONG = typeof crypto !== 'undefined' && !!crypto.getRandomValues;

  function note(msg) { els.status.textContent = msg || ''; }
  function blankStatus() { els.status.textContent = ''; }
  function randomBytes(n) {
    var b = new Uint8Array(n);
    if (RAND_STRONG) crypto.getRandomValues(b);
    else for (var i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
    return b;
  }

  /* ---------- UUID v4 ---------- */
  function uuidV4() {
    var bytes = randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    var h = [];
    for (var i = 0; i < 16; i++) h.push((bytes[i] < 16 ? '0' : '') + bytes[i].toString(16));
    return h[0] + h[1] + h[2] + h[3] + '-' + h[4] + h[5] + '-' + h[6] + h[7] + '-' +
      h[8] + h[9] + '-' + h[10] + h[11] + h[12] + h[13] + h[14] + h[15];
  }

  /* ---------- ULID ---------- */
  function encodeTime(now) {
    var mod = Math.max(0, now);
    var arr = [];
    while (mod > 0) { arr.unshift(mod % 32); mod = Math.floor(mod / 32); }
    while (arr.length < 10) arr.unshift(0);
    var str = '';
    for (var i = 0; i < arr.length; i++) str += CROCKFORD.charAt(arr[i]);
    return str;
  }
  function encodeRandom(bytes) {
    // 80 位随机 → 16 个 Crockford Base32 字符
    var bits = [];
    for (var i = 0; i < bytes.length; i++) {
      for (var b = 7; b >= 0; b--) bits.push((bytes[i] >> b) & 1);
    }
    var str = '';
    for (var c = 0; c < 16; c++) {
      var v = 0;
      for (var k = 0; k < 5; k++) v = (v << 1) | bits[c * 5 + k];
      str += CROCKFORD.charAt(v);
    }
    return str;
  }
  function ulid() {
    return encodeTime(Date.now()) + encodeRandom(randomBytes(10));
  }

  /* ---------- 渲染 ---------- */
  function renderList(list) {
    els.list.innerHTML = '';
    list.forEach(function (v, idx) {
      var row = document.createElement('div');
      row.className = 'uu-row';

      var num = document.createElement('span');
      num.className = 'uu-idx';
      num.textContent = String(idx + 1);

      var code = document.createElement('code');
      code.className = 'uu-val';
      code.textContent = v;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'uu-btn uu-btn-sm';
      btn.textContent = t('copy-word');
      btn.addEventListener('click', function () { copyText(v, btn); });

      row.appendChild(num);
      row.appendChild(code);
      row.appendChild(btn);
      els.list.appendChild(row);
    });
  }

  function generate(type, n) {
    var list = [];
    for (var i = 0; i < n; i++) {
      list.push(type === 'ulid' ? ulid() : uuidV4());
    }
    state.list = list;
    renderList(list);
    note(t('generated-pre') + n + t('generated-mid') + (type === 'ulid' ? 'ULID' : 'UUID v4'));
  }

  /* ---------- 复制 ---------- */
  function copyText(text, btn) {
    function done(ok) {
      var old = btn.textContent;
      btn.textContent = ok ? t('copied-word') : t('copy-fail-word');
      btn.classList.add('uu-copied');
      clearTimeout(btn._t);
      btn._t = setTimeout(function () {
        btn.textContent = old;
        btn.classList.remove('uu-copied');
      }, 1200);
    }
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
  }

  /* ---------- 事件绑定 ---------- */
  function currentParams() {
    return {
      type: els.type.value,
      n: parseInt(els.count.value, 10) || 10
    };
  }

  els.gen.addEventListener('click', function () {
    var p = currentParams();
    generate(p.type, p.n);
  });
  els.more.addEventListener('click', function () {
    var p = currentParams();
    generate(p.type, p.n);
  });
  els.copyAll.addEventListener('click', function () {
    if (!state.list.length) { note(t('nothing-yet')); return; }
    var text = state.list.join('\n') + '\n';
    copyText(text, els.copyAll);
  });
  els.quickUuid.addEventListener('click', function () { generate('uuid', 1); });
  els.quickUlid.addEventListener('click', function () { generate('ulid', 1); });

  /* ---------- 初始：默认生成一批 UUID ---------- */
  generate('uuid', 10);
})();
