/**
 * 二维码生成 / 解析工具 — 纯前端实现，图片与文本均不上传
 *
 * 功能：
 *   - 生成：输入文本 -> 二维码 PNG 预览（可下载，可选纠错级别 L/M/Q/H）
 *   - 解析：上传/拖拽二维码图片 -> 识别并输出其中的文本/链接
 *
 * 依赖本地三方库（无 CDN，离线可用）：
 *   - qrcode@1.4.4（lib/qrcode.js）：生成二维码（UTF-8 正确，含中文/Emoji）
 *   - jsQR（lib/jsQR.js）：从图片像素识别二维码
 * 页面结构见 /tools/qrcode.md
 */

(function () {
  'use strict';

  var root = document.getElementById('qrcode-app');
  if (!root) return;

  var QR = globalThis.QRCode;   // qrcode@1.4.4，全局对象
  var JsQR = globalThis.jsQR;   // jsQR

  if (!QR || typeof QR.create !== 'function' || !JsQR || typeof JsQR !== 'function') {
    return; // 依赖库未加载时不初始化（脚本位于两个库之后）
  }

  var els = {
    text: document.getElementById('qr-text'),
    ecl: document.getElementById('qr-ecl'),
    generate: document.getElementById('qr-generate'),
    download: document.getElementById('qr-download'),
    placeholder: document.getElementById('qr-placeholder'),
    canvas: document.getElementById('qr-canvas'),
    meta: document.getElementById('qr-meta'),
    drop: document.getElementById('qr-drop'),
    file: document.getElementById('qr-file'),
    choose: document.getElementById('qr-choose'),
    result: document.getElementById('qr-decode-result'),
    decImg: document.getElementById('qr-dec-img'),
    decText: document.getElementById('qr-dec-text'),
    decMeta: document.getElementById('qr-dec-meta'),
    copy: document.getElementById('qr-dec-copy'),
    error: document.getElementById('qr-error')
  };

  var state = {
    generated: false,
    version: 0,
    canvas: null
  };

  var TARGET = 320;  // 生成边长目标像素
  var MARGIN = 4;    // 二维码四周留白模块数（quiet zone）

  /* ---------- 通用 ---------- */

  function txt(n) { return n == null ? '' : String(n); }

  function showError(msg) {
    els.error.textContent = msg;
    els.error.hidden = false;
  }

  function clearError() {
    els.error.hidden = true;
  }

  /* ---------- 生成二维码 ---------- */

  function buildCanvas(text, ecl) {
    var qr = QR.create(text, { errorCorrectionLevel: ecl.toLowerCase() });
    var count = qr.modules.size;
    var cell = Math.max(2, Math.floor(TARGET / count));
    var size = (count + MARGIN * 2) * cell;
    var version = (count - 17) / 4;

    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    // 白色底 + 黑色模块（含 quiet zone）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.modules.get(c, r)) {
          ctx.fillRect((c + MARGIN) * cell, (r + MARGIN) * cell, cell, cell);
        }
      }
    }
    return { canvas: canvas, version: version, count: count, size: size };
  }

  function runGenerate() {
    clearError();
    var text = els.text.value;
    if (!text) {
      showError('请输入要生成二维码的文本或链接');
      return;
    }
    if (text.length > 3000) {
      showError('内容过长（超过 3000 字符，将无法编码为二维码），请缩短后重试');
      return;
    }
    var ecl = els.ecl.value;
    try {
      var out = buildCanvas(text, ecl);
    } catch (e) {
      showError('内容过长，无法编码。可降低纠错级别（如 L）或缩短内容后重试');
      return;
    }
    state.generated = true;
    state.version = out.version;
    state.canvas = out.canvas;

    els.placeholder.hidden = true;
    els.canvas.hidden = false;
    els.canvas.width = out.canvas.width;
    els.canvas.height = out.canvas.height;
    els.canvas.getContext('2d').drawImage(out.canvas, 0, 0);

    els.download.disabled = false;
    els.meta.textContent = 'Version ' + out.version + ' · ' + out.count + '×' + out.count +
      ' 模块 · 输出 ' + out.size + '×' + out.size + ' px · 纠错 ' + ecl;
  }

  function downloadPng() {
    if (!state.generated || !state.canvas) return;
    var a = document.createElement('a');
    a.href = state.canvas.toDataURL('image/png');
    a.download = 'qrcode-v' + state.version + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------- 解析二维码 ---------- */

  function decodeFromFile(file) {
    clearError();
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      showError('请选择图片文件（PNG / JPEG / WebP / GIF 等）');
      return;
    }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth;
      var h = img.naturalHeight;
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx;
      try {
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
      } catch (e) {
        URL.revokeObjectURL(url);
        showError('无法读取该图片');
        return;
      }
      try {
        var id = ctx.getImageData(0, 0, w, h);
        var res = JsQR(id.data, id.width, id.height, { inversionAttempts: 'attemptBoth' });
        // objectURL 仅用于本次绘制，绘制完成后立即释放；
        // 预览图改用 canvas 导出的 dataURL，避免引用已失效的 URL
        var preview = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        if (res && res.data) {
          els.decImg.src = preview;
          els.decText.value = res.data;
          els.decMeta.textContent = w + '×' + h + ' px · ' + res.data.length + ' 字符';
          els.result.hidden = false;
        } else {
          els.result.hidden = true;
          showError('未识别出二维码。请使用包含完整、清晰的二维码图片重试');
        }
      } catch (e) {
        URL.revokeObjectURL(url);
        els.result.hidden = true;
        showError('解析失败：' + txt(e.message || e));
      }
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      showError('图片加载失败，请重试');
    };
    img.src = url;
  }

  /* ---------- 复制 ---------- */

  function copyFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* 忽略 */ }
    ta.remove();
  }

  function flashCopied(btn) {
    var old = btn.textContent;
    btn.textContent = '已复制';
    btn.classList.add('qr-copied');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.textContent = old;
      btn.classList.remove('qr-copied');
    }, 1200);
  }

  function copyResult() {
    if (!els.decText.value) return;
    function done() { flashCopied(els.copy); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(els.decText.value).then(done, function () {
        copyFallback(els.decText.value);
        done();
      });
    } else {
      copyFallback(els.decText.value);
      done();
    }
  }

  /* ---------- 拖拽 ---------- */

  function bindDrop() {
    ['dragenter', 'dragover'].forEach(function (type) {
      els.drop.addEventListener(type, function (e) {
        e.preventDefault();
        els.drop.classList.add('qr-drag');
      });
    });
    ['dragleave', 'drop'].forEach(function (type) {
      els.drop.addEventListener(type, function (e) {
        e.preventDefault();
        els.drop.classList.remove('qr-drag');
      });
    });
    els.drop.addEventListener('drop', function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) decodeFromFile(files[0]);
    });
  }

  /* ---------- 事件绑定 ---------- */

  els.generate.addEventListener('click', runGenerate);

  els.ecl.addEventListener('change', function () {
    // 已有结果时按新纠错级别重算，让切换即时生效
    if (state.generated && els.text.value) runGenerate();
  });

  els.download.addEventListener('click', downloadPng);

  els.choose.addEventListener('click', function () { els.file.click(); });
  els.file.addEventListener('change', function () {
    decodeFromFile(els.file.files && els.file.files[0]);
    els.file.value = '';
  });

  els.copy.addEventListener('click', copyResult);

  bindDrop();

  /* ---------- 启动 ---------- */

  clearError();
})();
