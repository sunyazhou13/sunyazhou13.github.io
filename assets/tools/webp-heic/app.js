/**
 * 图片格式转换工具 — 纯前端实现，图片不上传
 *
 * 支持输入格式：PNG, JPEG, WebP, GIF, BMP, SVG, AVIF, HEIC
 * 支持输出格式：WebP, JPEG, PNG（浏览器原生编码）
 *
 * 编码依赖浏览器原生支持：
 *   - WebP 编码：Chrome / Edge / Opera
 *   - JPEG / PNG 编码：所有现代浏览器
 *   - HEIC 解码：使用 heic2any 库（约 1.4 MB，动态加载）
 *
 * 资源全部位于 /assets/tools/webp-heic/，与博客其它功能零耦合。
 * 页面结构见 /tools/webp-heic.md
 */

(function () {
  'use strict';

  var root = document.getElementById('wic-app');
  if (!root) return;

  var els = {
    engineBadge: document.getElementById('wic-engine-badge'),
    drop: document.getElementById('wic-drop'),
    input: document.getElementById('wic-input'),
    quality: document.getElementById('wic-quality'),
    qualityVal: document.getElementById('wic-q-val'),
    format: document.getElementById('wic-format'),
    maxw: document.getElementById('wic-maxw'),
    convert: document.getElementById('wic-convert'),
    zip: document.getElementById('wic-zip'),
    clear: document.getElementById('wic-clear'),
    summary: document.getElementById('wic-summary'),
    list: document.getElementById('wic-list')
  };

  var ACCEPTED = {
    'image/png': 1, 'image/jpeg': 1, 'image/webp': 1, 'image/gif': 1,
    'image/bmp': 1, 'image/svg+xml': 1, 'image/avif': 1,
    'image/heic': 1, 'image/heif': 1
  };
  var MAX_FILES = 300;

  var state = {
    items: [],
    canEncodeWebp: null,
    heic2any: null,
    running: false,
    seq: 0
  };

  /* ---------- 工具函数 ---------- */

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  }

  function isImage(file) {
    if (file.type) return !!ACCEPTED[file.type];
    return /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic|heif)$/i.test(file.name);
  }

  function isHeic(file) {
    if (file.type === 'image/heic' || file.type === 'image/heif') return true;
    return /\.(heic|heif)$/i.test(file.name);
  }

  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ---------- 编码能力探测 ---------- */

  function probeWebpEncode() {
    return new Promise(function (resolve) {
      try {
        var c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#8050a0';
        ctx.fillRect(0, 0, 64, 64);
        c.toBlob(function (blob) {
          resolve(!!(blob && blob.type === 'image/webp'));
        }, 'image/webp', 0.8);
      } catch (e) {
        resolve(false);
      }
    });
  }

  function setBadge(text, cls) {
    els.engineBadge.textContent = text;
    els.engineBadge.className = 'wic-badge' + (cls ? ' wic-badge-' + cls : '');
  }

  function renderBadge() {
    if (state.canEncodeWebp === null) {
      setBadge('正在检测编码能力…', 'loading');
      return;
    }
    var format = els.format.value;
    if (format === 'webp') {
      if (state.canEncodeWebp) {
        setBadge('WebP 编码：浏览器原生支持', 'ok');
      } else {
        setBadge('当前浏览器不支持 WebP 编码，请改用 Chrome / Edge', 'warn');
      }
    } else {
      setBadge(format.toUpperCase() + ' 编码：浏览器原生支持', 'ok');
    }
  }

  /* ---------- HEIC 解码库加载 ---------- */
  // heic2any 是 UMD 库，挂载到 window.heic2any，不能用 ES module import

  function loadHeic2Any() {
    if (state.heic2any) return Promise.resolve(state.heic2any);
    if (window.heic2any) {
      state.heic2any = window.heic2any;
      return Promise.resolve(window.heic2any);
    }
    setBadge('HEIC 解码库加载中…（约 1.4 MB，仅首次）', 'loading');
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = '/assets/tools/webp-heic/lib/heic2any.js';
      s.async = true;
      s.onload = function () {
        if (window.heic2any) {
          state.heic2any = window.heic2any;
          renderBadge();
          resolve(window.heic2any);
        } else {
          setBadge('HEIC 解码库加载异常', 'error');
          reject(new Error('heic2any 未正确挂载'));
        }
      };
      s.onerror = function () {
        setBadge('HEIC 解码库加载失败，请检查网络后重试', 'error');
        reject(new Error('无法加载 HEIC 解码库'));
      };
      document.head.appendChild(s);
    });
  }

  /* ---------- 图片解码 ---------- */

  function decodeImage(file) {
    // HEIC 文件需要特殊处理
    if (isHeic(file)) {
      return loadHeic2Any().then(function (heic2any) {
        setBadge('正在解码 HEIC…', 'loading');
        return heic2any({ blob: file, toType: 'blob' });
      }).then(function (blob) {
        renderBadge();
        // 将解码后的 blob 转为 ImageBitmap
        return createImageBitmap(blob, { imageOrientation: 'from-image' });
      });
    }

    // 其他格式使用 createImageBitmap
    return createImageBitmap(file, { imageOrientation: 'from-image' })
      .catch(function () {
        // 降级：<img> 解码（兼容旧 Safari / SVG 文件）
        return new Promise(function (resolve, reject) {
          var url = URL.createObjectURL(file);
          var img = new Image();
          img.decoding = 'async';
          img.onload = function () {
            try {
              var c = document.createElement('canvas');
              c.width = img.naturalWidth;
              c.height = img.naturalHeight;
              c.getContext('2d').drawImage(img, 0, 0);
              URL.revokeObjectURL(url);
              resolve(c);
            } catch (e) {
              URL.revokeObjectURL(url);
              reject(e);
            }
          };
          img.onerror = function () {
            URL.revokeObjectURL(url);
            reject(new Error('无法解码该图片'));
          };
          img.src = url;
        });
      });
  }

  /* ---------- 编码 ---------- */

  function encodeImage(canvas, format, quality) {
    return new Promise(function (resolve, reject) {
      var mimeType = 'image/' + format;
      var q = format === 'png' ? undefined : quality / 100;
      
      canvas.toBlob(function (blob) {
        if (blob && blob.type === mimeType) {
          resolve(blob);
        } else if (blob && format === 'png') {
          // PNG 的 mime 可能不带质量参数
          resolve(blob);
        } else {
          reject(new Error('编码失败，浏览器不支持 ' + format.toUpperCase()));
        }
      }, mimeType, q);
    });
  }

  /* ---------- 文件处理 ---------- */

  function convertItem(item, format) {
    item.status = 'running';
    item.outFormat = format;
    updateCard(item);
    
    var quality = parseInt(els.quality.value, 10);
    var maxW = parseInt(els.maxw.value, 10) || Infinity;

    return decodeImage(item.file).then(function (bmp) {
      var scale = Math.min(1, maxW / bmp.width);
      var w = Math.max(1, Math.round(bmp.width * scale));
      var h = Math.max(1, Math.round(bmp.height * scale));
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bmp, 0, 0, w, h);
      if (bmp.close) bmp.close();
      item.width = w;
      item.height = h;

      return encodeImage(canvas, format, quality);
    }).then(function (blob) {
      item.blob = blob;
      item.outSize = blob.size;
      item.status = 'done';
      updateCard(item);
    }).catch(function (err) {
      item.status = 'error';
      item.error = (err && err.message) ? err.message : '转换失败';
      updateCard(item);
    });
  }

  function assignOutNames() {
    var used = {};
    var format = els.format.value;
    state.items.forEach(function (it) {
      if (it.status === 'skipped') return;
      var base = it.name.replace(/\.[^.]+$/, '') || 'image';
      var ext = base + '.' + format;
      var candidate = ext, n = 1;
      while (used[candidate.toLowerCase()]) {
        candidate = base + '-' + (n++) + '.' + format;
      }
      used[candidate.toLowerCase()] = 1;
      it.outName = candidate;
    });
  }

  function convertAll() {
    if (state.running) return;
    var pending = state.items.filter(function (it) {
      return it.status === 'queued' || it.status === 'error';
    });
    if (!pending.length) {
      setSummary('没有待转换的图片');
      return;
    }

    var format = els.format.value;
    
    // 已经是目标格式的文件直接跳过
    state.items.forEach(function (it) {
      if (it.status === 'queued') {
        var ext = it.name.split('.').pop().toLowerCase();
        if (ext === format || (format === 'jpeg' && ext === 'jpg')) {
          it.status = 'skipped';
          updateCard(it);
        }
      }
    });
    
    pending = state.items.filter(function (it) {
      return it.status === 'queued' || it.status === 'error';
    });
    if (!pending.length) {
      updateButtons();
      return;
    }

    // WebP 编码能力检查
    if (format === 'webp' && !state.canEncodeWebp) {
      setSummary('当前浏览器不支持 WebP 编码，请改用 Chrome 或 Edge');
      return;
    }

    assignOutNames();
    pending.forEach(function (it) { updateCard(it); });

    state.running = true;
    updateButtons();

    var index = 0;
    function next() {
      if (index >= pending.length) return Promise.resolve();
      var item = pending[index++];
      return convertItem(item, format).then(next);
    }
    
    // 并行处理 3 张（浏览器原生编码性能较好）
    var workers = [];
    for (var i = 0; i < 3; i++) workers.push(next());

    Promise.all(workers).then(function () {
      state.running = false;
      updateButtons();
      updateSummary();
    });
  }

  /* ---------- 卡片渲染 ---------- */

  function statusText(it) {
    switch (it.status) {
      case 'queued': return '待转换';
      case 'running': return '转换中…';
      case 'done': return '完成';
      case 'skipped': return '已是 ' + it.outFormat.toUpperCase() + ' · 跳过';
      case 'error': return '失败：' + it.error;
    }
    return '';
  }

  function makeCard(item) {
    var li = document.createElement('li');
    li.className = 'wic-item';

    var thumb = document.createElement('img');
    thumb.className = 'wic-thumb';
    thumb.src = item.thumbUrl;
    thumb.alt = '';
    thumb.loading = 'lazy';
    li.appendChild(thumb);

    var info = document.createElement('div');
    info.className = 'wic-info';

    var name = document.createElement('div');
    name.className = 'wic-name';
    name.textContent = item.name;
    name.title = item.name;
    info.appendChild(name);

    var meta = document.createElement('div');
    meta.className = 'wic-meta';
    item._metaEl = meta;
    info.appendChild(meta);

    var side = document.createElement('div');
    side.className = 'wic-side';
    item._statusEl = document.createElement('span');
    side.appendChild(item._statusEl);

    item._dlEl = document.createElement('button');
    item._dlEl.type = 'button';
    item._dlEl.className = 'wic-btn wic-btn-sm';
    item._dlEl.textContent = '下载';
    item._dlEl.hidden = true;
    item._dlEl.addEventListener('click', function () {
      if (item.blob) saveBlob(item.blob, item.outName || 'image.' + els.format.value);
    });
    side.appendChild(item._dlEl);

    li.appendChild(info);
    li.appendChild(side);
    item.el = li;
    els.list.appendChild(li);
    updateCard(item);
  }

  function updateCard(item) {
    if (!item.el) return;
    item.el.className = 'wic-item wic-status-' + item.status;

    item._statusEl.className = 'wic-status wic-status-text-' + item.status;
    item._statusEl.textContent = statusText(item);

    var parts = [fmtBytes(item.origSize)];
    if (item.status === 'done') {
      var saved = item.origSize > 0 ? Math.round((1 - item.outSize / item.origSize) * 100) : 0;
      parts.push('→ ' + fmtBytes(item.outSize) + '（' + (saved >= 0 ? '-' : '+') + Math.abs(saved) + '%）');
      parts.push(item.width + '×' + item.height);
      parts.push(item.outFormat.toUpperCase());
      item._metaEl.classList.add('wic-meta-done');
      item._dlEl.hidden = false;
    }
    item._metaEl.textContent = parts.join(' · ');
    if (item.outName && item.status === 'done') {
      item._metaEl.title = '输出文件名：' + item.outName;
    }
  }

  function setSummary(text) {
    els.summary.hidden = false;
    els.summary.textContent = text;
  }

  function updateSummary() {
    var items = state.items;
    if (!items.length) {
      els.summary.hidden = true;
      return;
    }
    var done = items.filter(function (i) { return i.status === 'done'; });
    var failed = items.filter(function (i) { return i.status === 'error'; });
    var skipped = items.filter(function (i) { return i.status === 'skipped'; });
    if (!done.length && !failed.length) {
      els.summary.hidden = true;
      return;
    }
    var orig = 0, out = 0;
    done.forEach(function (i) {
      orig += i.origSize;
      out += i.outSize;
    });
    var savedPct = orig > 0 ? Math.round((1 - out / orig) * 100) : 0;
    var parts = ['共 ' + items.length + ' 张'];
    if (done.length) parts.push('成功 ' + done.length);
    if (failed.length) parts.push('失败 ' + failed.length);
    if (skipped.length) parts.push('跳过 ' + skipped.length);
    if (done.length) {
      parts.push(fmtBytes(orig) + ' → ' + fmtBytes(out) + '，节省 ' + Math.max(0, savedPct) + '%');
    }
    setSummary(parts.join(' · '));
  }

  function updateButtons() {
    var hasQueued = state.items.some(function (i) {
      return i.status === 'queued' || i.status === 'error';
    });
    var hasDone = state.items.some(function (i) { return i.status === 'done'; });
    els.convert.disabled = state.running || !hasQueued;
    els.zip.disabled = !hasDone;
    els.clear.disabled = state.running || !state.items.length;
    if (!state.running) updateSummary();
  }

  /* ---------- 拖拽（支持文件夹） ---------- */

  function walkEntry(entry, out) {
    if (!entry) return Promise.resolve();
    if (entry.isFile) {
      return new Promise(function (res) {
        entry.file(function (f) {
          out.push(f);
          res();
        }, res);
      });
    }
    if (entry.isDirectory) {
      var reader = entry.createReader();
      var readBatch = function () {
        return new Promise(function (res) {
          reader.readEntries(res, res);
        }).then(function (batch) {
          if (!batch || !batch.length) return Promise.resolve();
          var chain = Promise.resolve();
          batch.forEach(function (e) {
            chain = chain.then(function () { return walkEntry(e, out); });
          });
          return chain.then(readBatch);
        });
      };
      return readBatch();
    }
    return Promise.resolve();
  }

  function filesFromDataTransfer(dt) {
    var out = [];
    var entries = [];
    if (dt.items && dt.items.length) {
      for (var i = 0; i < dt.items.length; i++) {
        var getEntry = dt.items[i].webkitGetAsEntry;
        if (getEntry) {
          var e = getEntry.call(dt.items[i]);
          if (e) entries.push(e);
        }
      }
    }
    if (!entries.length) {
      return Promise.resolve(Array.prototype.slice.call(dt.files || []));
    }
    var chain = Promise.resolve();
    entries.forEach(function (e) {
      chain = chain.then(function () { return walkEntry(e, out); });
    });
    return chain.then(function () {
      return out.length ? out : Array.prototype.slice.call(dt.files || []);
    });
  }

  /* ---------- ZIP 打包下载 ---------- */

  function downloadZip() {
    var done = state.items.filter(function (i) { return i.status === 'done'; });
    if (!done.length) return;
    els.zip.disabled = true;
    els.zip.textContent = '打包中…';
    
    import('./lib/fflate.js').then(function (fflate) {
      var chain = Promise.resolve();
      var map = {};
      done.forEach(function (it) {
        chain = chain.then(function () {
          return it.blob.arrayBuffer().then(function (buf) {
            map[it.outName || 'image.' + els.format.value] = new Uint8Array(buf);
          });
        });
      });
      return chain.then(function () {
        var zipped = fflate.zipSync(map, { level: 0 });
        var d = new Date();
        var stamp = d.getFullYear() +
          ('0' + (d.getMonth() + 1)).slice(-2) +
          ('0' + d.getDate()).slice(-2) + '-' +
          ('0' + d.getHours()).slice(-2) +
          ('0' + d.getMinutes()).slice(-2) +
          ('0' + d.getSeconds()).slice(-2);
        saveBlob(new Blob([zipped], { type: 'application/zip' }), 'images-' + stamp + '.zip');
      });
    }).catch(function () {
      setSummary('ZIP 打包失败，请逐个下载');
    }).finally(function () {
      els.zip.disabled = false;
      els.zip.textContent = '打包下载 ZIP';
    });
  }

  /* ---------- 清空 ---------- */

  function clearAll() {
    state.items.forEach(function (it) {
      URL.revokeObjectURL(it.thumbUrl);
    });
    state.items = [];
    els.list.innerHTML = '';
    els.summary.hidden = true;
    updateButtons();
  }

  /* ---------- 事件绑定 ---------- */

  els.drop.addEventListener('click', function () {
    els.input.click();
  });
  els.drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      els.input.click();
    }
  });

  ['dragenter', 'dragover'].forEach(function (ev) {
    els.drop.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      els.drop.classList.add('wic-drop-active');
    });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    els.drop.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      els.drop.classList.remove('wic-drop-active');
    });
  });

  els.drop.addEventListener('drop', function (e) {
    filesFromDataTransfer(e.dataTransfer).then(function (files) {
      addFiles(files);
    });
  });

  els.input.addEventListener('change', function () {
    addFiles(Array.prototype.slice.call(els.input.files || []));
    els.input.value = '';
  });

  function addFiles(files) {
    var valid = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!isImage(f)) continue;
      if (state.items.length >= MAX_FILES) {
        setSummary('已达单批上限 ' + MAX_FILES + ' 张，请分批处理');
        break;
      }
      var item = {
        id: ++state.seq,
        file: f,
        name: f.name || ('image-' + state.seq),
        outName: '',
        outFormat: '',
        thumbUrl: URL.createObjectURL(f),
        isHeic: isHeic(f),
        status: 'queued',
        origSize: f.size,
        outSize: 0,
        width: 0,
        height: 0,
        el: null
      };
      state.items.push(item);
      makeCard(item);
      valid.push(item);
    }
    if (valid.length) {
      updateButtons();
      setSummary('已添加 ' + valid.length + ' 张，点击「开始转换」');
    }

    // HEIC 文件浏览器无法直接渲染缩略图，异步解码后用解码 blob 替换
    valid.forEach(function (item) {
      if (item.isHeic) {
        loadHeic2Any().then(function (heic2any) {
          return heic2any({ blob: item.file, toType: 'blob' });
        }).then(function (blob) {
          URL.revokeObjectURL(item.thumbUrl);
          item.thumbUrl = URL.createObjectURL(blob);
          if (item.el) {
            var thumb = item.el.querySelector('.wic-thumb');
            if (thumb) thumb.src = item.thumbUrl;
          }
        }).catch(function () {
          // 解码失败时缩略图保持为 file 的 object URL（浏览器会显示空白图标）
        });
      }
    });
  }

  els.quality.addEventListener('input', function () {
    els.qualityVal.textContent = els.quality.value;
  });

  els.format.addEventListener('change', renderBadge);
  els.convert.addEventListener('click', convertAll);
  els.zip.addEventListener('click', downloadZip);
  els.clear.addEventListener('click', clearAll);

  /* ---------- 启动 ---------- */

  renderBadge();
  probeWebpEncode().then(function (ok) {
    state.canEncodeWebp = ok;
    renderBadge();
    updateButtons();
  });
})();
