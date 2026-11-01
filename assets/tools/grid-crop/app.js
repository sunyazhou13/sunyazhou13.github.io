/**
 * 九宫格切图 — 纯前端，图片不上传
 *
 * 功能：一键把图片切成 3×3 共 9 张；「主体锚点保护」自动把切割网格中心
 * 对准主体（优先人脸检测，回退中心区域显著性分析），避免人物被拦腰切断；
 * 可平移/微调网格；预览 9 格后打包下载（纯 JS 打包 ZIP，无外部依赖）。
 *
 * 类名前缀 gc-，与既有工具同构。
 * 页面结构见 /tools/grid-crop.md
 */
(function () {
  'use strict';

  var ROOT = document.getElementById('gc-app');
  if (!ROOT) return;

  function $id(k) { return document.getElementById('gc-' + k); }
  var els = {
    drop: $id('drop'), input: $id('input'), panel: $id('panel'), canvas: $id('canvas'),
    anchor: $id('anchor'), offsetX: $id('offset-x'), offsetXVal: $id('offset-x-val'),
    offsetY: $id('offset-y'), offsetYVal: $id('offset-y-val'), reset: $id('reset'),
    preview: $id('preview'), download: $id('download'), grid: $id('grid'),
    note: $id('note'), modeTag: $id('mode-tag')
  };

  var COLS = 3, ROWS = 3;
  var state = {
    img: null, width: 0, height: 0, fileName: '', baseName: 'grid',
    offsetX: 0, offsetY: 0, anchorOn: false, cells: []
  };
  var canvasCtx = els.canvas.getContext('2d');

  var LANG = (document.documentElement.lang || 'zh').toLowerCase();
  LANG = (LANG.indexOf('en') !== -1) ? 'en' : 'zh';
  var I18N = {
    zh: {
      'gc-even': '全图等分',
      'gc-detecting': '锚点检测中…',
      'gc-anchor': '锚点保护（网格中心对准主体 / 人脸）',
      'gc-anchor-fail': '全图等分（未能检测到主体）',
      'gc-manual': '全图等分（手动微调）',
      'gc-restore-note': '已恢复全图等分，如需更新预览请再次点击「预览 9 格」',
      'gc-adjusted-note': '网格已调整，如需更新预览请再次点击「预览 9 格」',
      'gc-preview-done': '已生成 9 张，可打包下载全部小图',
      'gc-dl-loading': '打包中…',
      'gc-dl-ready': '打包下载 9 张',
      'gc-dl-note-pre': '已下载 ',
      'gc-dl-note-suf': '（9 张 PNG）',
      'gc-pick-img': '请选择图片文件（PNG / JPEG / WebP / GIF 等）',
      'gc-load-note-suf': '· 可勾选「主体锚点保护」或拖动滑杆微调网格，然后点击「预览 9 格」',
      'gc-img-fail': '图片加载失败，请重试其他图片',
      'gc-no-file': '未读取到文件',
      'gc-reset': '网格已重置'
    },
    en: {
      'gc-even': 'Split evenly',
      'gc-detecting': 'Detecting anchor…',
      'gc-anchor': 'Anchor protection (grid center aligned on subject / face)',
      'gc-anchor-fail': 'Split evenly (no subject detected)',
      'gc-manual': 'Split evenly (manual adjustment)',
      'gc-restore-note': 'Back to even split. Click "Preview 9 tiles" again to refresh the preview',
      'gc-adjusted-note': 'Grid adjusted. Click "Preview 9 tiles" again to refresh the preview',
      'gc-preview-done': '9 tiles generated — download them all below',
      'gc-dl-loading': 'Packing…',
      'gc-dl-ready': 'Download 9 tiles',
      'gc-dl-note-pre': 'Downloaded ',
      'gc-dl-note-suf': ' (9 PNG tiles)',
      'gc-pick-img': 'Please choose an image file (PNG / JPEG / WebP / GIF, etc.)',
      'gc-load-note-suf': '· check "Subject anchor protection" or drag the sliders to fine-tune the grid, then click "Preview 9 tiles"',
      'gc-img-fail': 'Failed to load the image, please try another one',
      'gc-no-file': 'No file read',
      'gc-reset': 'Grid reset'
    }
  };
  function t(key) { var v = (I18N[LANG] || {})[key]; return v != null ? v : key; }


  function note(msg) { els.note.textContent = msg || ''; }

  /* ---------- 主体锚点检测 ---------- */

  // 优先 Shape Detection API 人脸检测（Chrome 实验特性）
  function detectFaces() {
    var Ctor = window.FaceDetector;
    if (!Ctor) return Promise.resolve(null);
    try {
      var detector = new Ctor();
      return Promise.resolve(detector.detect(els.canvas)).then(function (faces) {
        if (!faces || !faces.length) return null;
        var best = null, area = -1;
        faces.forEach(function (f) {
          var b = f.boundingBox || f;
          var a = (b.width || 0) * (b.height || 0);
          if (a > area) { area = a; best = b; }
        });
        if (!best) return null;
        return { x: best.x + best.width / 2, y: best.y + best.height / 2 };
      }).catch(function () { return null; });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  // 回退：中心区域梯度能量分析，能量最高处视为主体
  function centerAnchor() {
    var S = 240;
    var sw = S, sh = Math.max(1, Math.round(S * state.height / state.width));
    var c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    var cx = c.getContext('2d');
    cx.drawImage(state.img, 0, 0, sw, sh);
    var d = cx.getImageData(0, 0, sw, sh).data;
    var b = 6;
    var bx = Math.floor(sw / b), by = Math.floor(sh / b);
    var bestX = sw / 2, bestY = sh / 2, bestE = -1;
    var gy, gx, yy, xx;
    for (gy = 0; gy < by; gy++) {
      for (gx = 0; gx < bx; gx++) {
        var e = 0;
        for (yy = 0; yy < b; yy++) {
          var row = ((gy * b + yy) * sw + gx * b) * 4;
          for (xx = 0; xx < b - 1; xx++) {
            var i = row + xx * 4;
            var l0 = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
            var l1 = d[i + 4] * 0.299 + d[i + 5] * 0.587 + d[i + 6] * 0.114;
            e += Math.abs(l0 - l1);
          }
        }
        if (e > bestE) { bestE = e; bestX = (gx + 0.5) * b; bestY = (gy + 0.5) * b; }
      }
    }
    return { x: bestX / sw * state.width, y: bestY / sh * state.height };
  }

  function computeAnchor() {
    return detectFaces().then(function (f) {
      if (f) return f;
      return centerAnchor();
    });
  }

  /* ---------- 网格 ---------- */

  function cellW() { return state.width / COLS; }
  function cellH() { return state.height / ROWS; }

  function clampOffset() {
    var maxX = Math.floor(cellW() - 1);
    var maxY = Math.floor(cellH() - 1);
    state.offsetX = Math.max(-maxX, Math.min(maxX, Math.round(state.offsetX)));
    state.offsetY = Math.max(-maxY, Math.min(maxY, Math.round(state.offsetY)));
    els.offsetX.value = state.offsetX;
    els.offsetY.value = state.offsetY;
    els.offsetXVal.textContent = state.offsetX;
    els.offsetYVal.textContent = state.offsetY;
  }

  function render() {
    if (!state.img) return;
    var W = state.width, H = state.height;
    els.canvas.width = W;
    els.canvas.height = H;
    canvasCtx.clearRect(0, 0, W, H);
    canvasCtx.drawImage(state.img, 0, 0, W, H);

    var cw = cellW(), ch = cellH();
    var x1 = cw + state.offsetX, x2 = cw * 2 + state.offsetX;
    var y1 = ch + state.offsetY, y2 = ch * 2 + state.offsetY;

    canvasCtx.strokeStyle = 'rgba(231, 76, 60, 0.9)';
    canvasCtx.lineWidth = Math.max(1, Math.round(W / 600));
    canvasCtx.setLineDash([8, 6]);
    canvasCtx.beginPath();
    canvasCtx.moveTo(x1, 0); canvasCtx.lineTo(x1, H);
    canvasCtx.moveTo(x2, 0); canvasCtx.lineTo(x2, H);
    canvasCtx.moveTo(0, y1); canvasCtx.lineTo(W, y1);
    canvasCtx.moveTo(0, y2); canvasCtx.lineTo(W, y2);
    canvasCtx.stroke();
    canvasCtx.setLineDash([]);

    if (state.anchorOn) {
      var cx = W / 2 + state.offsetX, cy = H / 2 + state.offsetY;
      canvasCtx.strokeStyle = 'rgba(47, 111, 222, 0.95)';
      canvasCtx.lineWidth = Math.max(2, Math.round(W / 300));
      canvasCtx.beginPath();
      canvasCtx.arc(cx, cy, Math.max(6, W / 60), 0, Math.PI * 2);
      canvasCtx.moveTo(cx - 14, cy); canvasCtx.lineTo(cx + 14, cy);
      canvasCtx.moveTo(cx, cy - 14); canvasCtx.lineTo(cx, cy + 14);
      canvasCtx.stroke();
    }
  }

  function applyAnchor() {
    state.anchorOn = els.anchor.checked;
    if (!state.anchorOn) {
      state.offsetX = 0; state.offsetY = 0;
      els.offsetX.value = 0; els.offsetY.value = 0;
      els.offsetXVal.textContent = '0'; els.offsetYVal.textContent = '0';
      els.modeTag.textContent = t('gc-even');
      render();
      if (els.grid.hidden === false && state.cells.length) note(t('gc-restore-note'));
      return;
    }
    els.modeTag.textContent = t('gc-detecting');
    computeAnchor().then(function (a) {
      if (!state.anchorOn) return;
      state.offsetX = Math.round(a.x - state.width / 2);
      state.offsetY = Math.round(a.y - state.height / 2);
      clampOffset();
      els.modeTag.textContent = t('gc-anchor');
      render();
      if (els.grid.hidden === false) note(t('gc-adjusted-note'));
    }).catch(function () {
      els.modeTag.textContent = t('gc-anchor-fail');
    });
  }

  /* ---------- 切图与预览 ---------- */

  function cutCells() {
    var W = state.width, H = state.height;
    var cw = cellW(), ch = cellH();
    var cells = [];
    var r, c;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        var sx = Math.round(c * cw + state.offsetX);
        var sy = Math.round(r * ch + state.offsetY);
        sx = Math.max(0, Math.min(W - 1, sx));
        sy = Math.max(0, Math.min(H - 1, sy));
        var w = Math.min(Math.round(cw), W - sx);
        var h = Math.min(Math.round(ch), H - sy);
        var cell = document.createElement('canvas');
        cell.width = w; cell.height = h;
        cell.getContext('2d').drawImage(state.img, sx, sy, w, h, 0, 0, w, h);
        cells.push({ name: (r + 1) + '-' + (c + 1), canvas: cell });
      }
    }
    return cells;
  }

  function renderPreview() {
    if (!state.img) return;
    state.cells = cutCells();
    els.grid.hidden = false;
    els.grid.innerHTML = '';
    state.cells.forEach(function (cell) {
      var box = document.createElement('figure');
      box.className = 'gc-cell';
      var img = document.createElement('img');
      img.src = cell.canvas.toDataURL('image/png');
      img.alt = '';
      var cap = document.createElement('figcaption');
      cap.textContent = cell.name;
      box.appendChild(img);
      box.appendChild(cap);
      els.grid.appendChild(box);
    });
    els.download.disabled = false;
    note(t('gc-preview-done'));
  }

  /* ---------- 纯 JS ZIP 打包（STORE，无压缩，无外部依赖） ---------- */

  var CRC_TABLE = (function () {
    var t = new Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(u8) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ u8[i]) & 0xFF];
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function buildZip(files) {
    var encoder = new TextEncoder();
    var chunks = [];
    var centrals = [];
    var offset = 0;
    files.forEach(function (f) {
      var nameBytes = encoder.encode(f.name);
      var flags = 0;
      for (var i = 0; i < nameBytes.length; i++) { if (nameBytes[i] > 127) { flags = 0x0800; break; } }
      var crc = crc32(f.data);
      var size = f.data.length;
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true);
      lh.setUint16(4, 20, true);
      lh.setUint16(6, flags, true);
      lh.setUint16(8, 0, true);
      lh.setUint16(10, 0, true);
      lh.setUint16(12, 0, true);
      lh.setUint32(14, crc, true);
      lh.setUint32(18, size, true);
      lh.setUint32(22, size, true);
      lh.setUint16(26, nameBytes.length, true);
      lh.setUint16(28, 0, true);
      chunks.push(new Uint8Array(lh.buffer, 0, 30));
      chunks.push(nameBytes);
      chunks.push(f.data);
      centrals.push({ name: nameBytes, size: size, offset: offset, crc: crc, flags: flags });
      offset += 30 + nameBytes.length + size;
    });
    var cdStart = offset;
    centrals.forEach(function (e, i) {
      var cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true);
      cd.setUint16(4, 20, true);
      cd.setUint16(6, 20, true);
      cd.setUint16(8, e.flags, true);
      cd.setUint16(10, 0, true);
      cd.setUint16(12, 0, true);
      cd.setUint16(14, 0, true);
      cd.setUint32(16, e.crc, true);
      cd.setUint32(20, e.size, true);
      cd.setUint32(24, e.size, true);
      cd.setUint16(28, e.name.length, true);
      cd.setUint16(30, 0, true);
      cd.setUint16(32, 0, true);
      cd.setUint16(34, 0, true);
      cd.setUint16(36, 0, true);
      cd.setUint32(38, 0, true);
      cd.setUint32(42, e.offset, true);
      chunks.push(new Uint8Array(cd.buffer, 0, 46));
      chunks.push(e.name);
      offset += 46 + e.name.length;
    });
    var cdSize = offset - cdStart;
    var eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true);
    eocd.setUint16(4, 0, true);
    eocd.setUint16(6, 0, true);
    eocd.setUint16(8, files.length, true);
    eocd.setUint16(10, files.length, true);
    eocd.setUint32(12, cdSize, true);
    eocd.setUint32(16, cdStart, true);
    eocd.setUint16(20, 0, true);
    chunks.push(new Uint8Array(eocd.buffer, 0, 22));

    var total = 0;
    chunks.forEach(function (c) { total += c.length; });
    var out = new Uint8Array(total);
    var p = 0;
    chunks.forEach(function (c) { out.set(c, p); p += c.length; });
    return out;
  }

  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  els.download.addEventListener('click', function () {
    if (!state.cells.length) return;
    els.download.disabled = true;
    els.download.textContent = t('gc-dl-loading');
    var files = [];
    var chain = Promise.resolve();
    state.cells.forEach(function (cell) {
      chain = chain.then(function () {
        return new Promise(function (resolve) {
          cell.canvas.toBlob(function (b) { resolve(b); }, 'image/png');
        });
      }).then(function (b) {
        if (!b) return;
        return b.arrayBuffer().then(function (buf) {
          files.push({ name: state.baseName + '-' + cell.name + '.png', data: new Uint8Array(buf) });
        });
      });
    });
    chain.then(function () {
      var zip = buildZip(files);
      saveBlob(new Blob([zip], { type: 'application/zip' }), state.baseName + '-9grid.zip');
      els.download.disabled = false;
      els.download.textContent = t('gc-dl-ready');
      note(t('gc-dl-note-pre') + state.baseName + '-9grid.zip' + t('gc-dl-note-suf'));
    });
  });

  /* ---------- 文件加载 ---------- */

  function loadFile(file) {
    if (!file || !/^image\//.test(file.type)) { note(t('gc-pick-img')); return; }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      state.img = img;
      state.width = img.naturalWidth;
      state.height = img.naturalHeight;
      state.fileName = file.name;
      state.baseName = (file.name.replace(/\.[^.]+$/, '') || 'grid');
      state.offsetX = 0; state.offsetY = 0; state.anchorOn = false;
      els.anchor.checked = false;
      els.modeTag.textContent = t('gc-even');
      els.panel.hidden = false;
      els.grid.hidden = true;
      els.grid.innerHTML = '';
      els.download.disabled = true;
      note(state.width + ' × ' + state.height + ' ' + t('gc-load-note-suf'));
      URL.revokeObjectURL(url);
      render();
    };
    img.onerror = function () { URL.revokeObjectURL(url); note(t('gc-img-fail')); };
    img.src = url;
  }

  /* ---------- 事件绑定 ---------- */

  els.drop.addEventListener('click', function () { els.input.click(); });
  els.drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.input.click(); }
  });
  ['dragenter', 'dragover'].forEach(function (ev) {
    els.drop.addEventListener(ev, function (e) {
      e.preventDefault(); e.stopPropagation();
      els.drop.classList.add('gc-drop-active');
    });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    els.drop.addEventListener(ev, function (e) {
      e.preventDefault(); e.stopPropagation();
      els.drop.classList.remove('gc-drop-active');
    });
  });
  els.drop.addEventListener('drop', function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadFile(f); else note(t('gc-no-file'));
  });
  els.input.addEventListener('change', function () {
    loadFile(els.input.files && els.input.files[0]);
    els.input.value = '';
  });

  els.anchor.addEventListener('change', applyAnchor);

  els.offsetX.addEventListener('input', function () {
    state.offsetX = parseInt(els.offsetX.value, 10) || 0;
    state.anchorOn = false; els.anchor.checked = false;
    els.modeTag.textContent = t('gc-manual');
    clampOffset();
    render();
  });
  els.offsetY.addEventListener('input', function () {
    state.offsetY = parseInt(els.offsetY.value, 10) || 0;
    state.anchorOn = false; els.anchor.checked = false;
    els.modeTag.textContent = t('gc-manual');
    clampOffset();
    render();
  });

  els.reset.addEventListener('click', function () {
    state.offsetX = 0; state.offsetY = 0;
    els.offsetX.value = 0; els.offsetY.value = 0;
    els.offsetXVal.textContent = '0'; els.offsetYVal.textContent = '0';
    state.anchorOn = false; els.anchor.checked = false;
    els.modeTag.textContent = t('gc-even');
    els.grid.hidden = true; els.grid.innerHTML = '';
    els.download.disabled = true;
    render();
    note(t('gc-reset'));
  });

  els.preview.addEventListener('click', renderPreview);
})();
