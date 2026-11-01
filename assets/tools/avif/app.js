/**
 * 图片转 AVIF 工具 — 纯前端实现，图片不上传
 *
 * 编码引擎（优先级）：
 *   1. 浏览器原生 canvas 编码（Chrome / Edge 121+，运行时探测）
 *   2. WASM libaom（jSquash 单线程版，无需 COOP/COEP，Safari / Firefox 走此路径）
 *
 * 资源全部位于 /assets/tools/avif/，与博客其它功能零耦合。
 * 页面结构见 /tools/image-to-avif.md
 */

(function () {
  'use strict';

  var root = document.getElementById('avt-app');
  if (!root) return;

  var LANG = (document.documentElement.lang || 'zh').toLowerCase();
  if (LANG.indexOf('en') === 0) LANG = 'en';
  var I18N = {
    'zh': {
    'badge-wasm-loading': 'WASM 编码引擎加载中…（约 3.5 MB，仅首次）',
    'badge-wasm-fail': 'WASM 引擎加载失败，请检查网络后重试',
    'badge-detect': '正在检测编码引擎…',
    'badge-native': '编码引擎：浏览器原生 Canvas',
    'badge-fallback': '当前浏览器不支持原生 AVIF 编码，将回退 WASM',
    'badge-wasm': '编码引擎：WASM libaom（jsquash）',
    'badge-native-ok': '编码引擎：浏览器原生 Canvas（已探测可用）',
    'badge-wasm-fallback': '编码引擎：WASM libaom（当前浏览器不支持原生 AVIF 编码）',
    'err-decode': '无法解码该图片',
    'err-webp-track': '无法解析 WebP 轨道',
    'err-native': '原生 AVIF 编码失败',
    'err-wasm-big': 'WASM AVIF 编码失败（图片可能过大）',
    'err-frames-suffix': ' 帧上限，请关闭「保留动画」改取首帧',
    'err-frames-pre': '动图帧数超过 ',
    'err-less2': '动图解码后不足 2 帧，请关闭「保留动画」改取首帧',
    'err-rgba-pre': '动图原始帧数据约 ',
    'err-rgba-suffix': ' MB，超出处理上限，请限制最大宽度或关闭「保留动画」',
    'tr-frame-pre': '转码帧 ',
    'err-anim': '动图转换失败',
    'err-convert': '转换失败',
    'sum-none': '没有待转换的图片（已是 AVIF 的文件会被跳过）',
    'st-pending': '待转换',
    'st-anim-keep': '动图 · 保留动画',
    'st-anim-first': '动图 · 仅取首帧',
    'st-running': '转换中…',
    'st-done': '完成',
    'st-skipped': '已是 AVIF · 跳过',
    'st-err-pre': '失败：',
    'btn-dl': '下载',
    'meta-frames': ' 帧动画',
    'meta-native': '原生',
    'meta-anim-first': '动图 · 仅取首帧',
    'meta-anim-keep': '动图 · 逐帧转码保留动画',
    'meta-out-pre': '输出文件名：',
    'meta-renamed': '（重名自动加序号）',
    'sum-total-pre': '共 ',
    'sum-total-suffix': ' 张',
    'sum-done-pre': '成功 ',
    'sum-fail-pre': '失败 ',
    'sum-skip-pre': '跳过 ',
    'sum-saved-pre': '，节省 ',
    'zip-busy': '打包中…',
    'zip-fail': 'ZIP 打包失败，请逐个下载',
    'zip-btn': '打包下载 ZIP',
    'sum-limit-pre': '已达单批上限 ',
    'sum-limit-fix': ' 张，请分批处理',
    'sum-added-pre': '已添加 ',
    'sum-added-fix': ' 张，点击「开始转换」',
    },
    'en': {
    'badge-wasm-loading': 'WASM encoder loading… (about 3.5 MB, once on first use)',
    'badge-wasm-fail': 'Failed to load the WASM encoder, check your network and retry',
    'badge-detect': 'Detecting encoding engine…',
    'badge-native': 'Encoder: browser-native Canvas',
    'badge-fallback': 'Native AVIF encoding is not supported by this browser, falling back to WASM',
    'badge-wasm': 'Encoder: WASM libaom (jsquash)',
    'badge-native-ok': 'Encoder: browser-native Canvas (detected available)',
    'badge-wasm-fallback': 'Encoder: WASM libaom (this browser lacks native AVIF encoding)',
    'err-decode': 'Unable to decode this image',
    'err-webp-track': 'Unable to parse the WebP track',
    'err-native': 'Native AVIF encoding failed',
    'err-wasm-big': 'WASM AVIF encoding failed (image may be too large)',
    'err-frames-suffix': ' exceeds the frame limit; disable "Keep animation" and keep the first frame instead',
    'err-frames-pre': 'Animated image exceeds ',
    'err-less2': 'Fewer than 2 frames after decoding; disable "Keep animation" and keep the first frame instead',
    'err-rgba-pre': 'Raw frame data is about ',
    'err-rgba-suffix': ' MB, beyond the processing limit — cap the max width or disable "Keep animation"',
    'tr-frame-pre': 'Transcoding frame ',
    'err-anim': 'Animated conversion failed',
    'err-convert': 'Conversion failed',
    'sum-none': 'No images to convert (files already in AVIF are skipped)',
    'st-pending': 'Pending',
    'st-anim-keep': 'Animated · keep animation',
    'st-anim-first': 'Animated · first frame only',
    'st-running': 'Converting…',
    'st-done': 'Done',
    'st-skipped': 'Already AVIF · skipped',
    'st-err-pre': 'Failed: ',
    'btn-dl': 'Download',
    'meta-frames': ' frames · animated',
    'meta-native': 'native',
    'meta-anim-first': 'Animated · first frame only',
    'meta-anim-keep': 'Animated · per-frame transcode keeps animation',
    'meta-out-pre': 'Output file: ',
    'meta-renamed': ' (auto-renamed with a number)',
    'sum-total-pre': 'Total ',
    'sum-total-suffix': ' images',
    'sum-done-pre': 'Done ',
    'sum-fail-pre': 'Failed ',
    'sum-skip-pre': 'Skipped ',
    'sum-saved-pre': ', saved ',
    'zip-busy': 'Packing…',
    'zip-fail': 'ZIP packing failed, download one by one',
    'zip-btn': 'Download ZIP',
    'sum-limit-pre': 'Reached the per-batch limit of ',
    'sum-limit-fix': ' images; split them into batches',
    'sum-added-pre': 'Added ',
    'sum-added-fix': ' images. Click "Start converting"',
    }
  };
  function t(key) { var v = (I18N[LANG] || {})[key]; return v != null ? v : key; }

  var els = {
    engineBadge: document.getElementById('avt-engine-badge'),
    drop: document.getElementById('avt-drop'),
    input: document.getElementById('avt-input'),
    quality: document.getElementById('avt-quality'),
    qualityVal: document.getElementById('avt-q-val'),
    engine: document.getElementById('avt-engine'),
    speed: document.getElementById('avt-speed'),
    maxw: document.getElementById('avt-maxw'),
    keepanim: document.getElementById('avt-keepanim'),
    convert: document.getElementById('avt-convert'),
    zip: document.getElementById('avt-zip'),
    clear: document.getElementById('avt-clear'),
    summary: document.getElementById('avt-summary'),
    list: document.getElementById('avt-list')
  };

  var ACCEPTED = {
    'image/png': 1, 'image/jpeg': 1, 'image/webp': 1, 'image/gif': 1,
    'image/bmp': 1, 'image/svg+xml': 1, 'image/avif': 1
  };
  var MAX_FILES = 300;
  var MAX_ANIM_BYTES = 400 * 1048576; // 动图逐帧 RGBA 总量上限（内存保护）
  var MAX_ANIM_FRAMES = 500;          // 单个动图最大帧数

  function keepAnim() {
    return !els.keepanim || els.keepanim.checked;
  }

  var state = {
    items: [],
    nativeAvif: null,   // null = 检测中, true/false = 探测结果
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
    return /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(file.name);
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

  /* ---------- 引擎探测与加载 ---------- */

  function probeNativeAvif() {
    return new Promise(function (resolve) {
      try {
        var c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#8050a0';
        ctx.fillRect(0, 0, 64, 64);
        c.toBlob(function (blob) {
          resolve(!!(blob && blob.type === 'image/avif'));
        }, 'image/avif', 0.8);
      } catch (e) {
        resolve(false);
      }
    });
  }

  var wasmModulePromise = null;

  function getWasmModule() {
    if (!wasmModulePromise) {
      setBadge(t('badge-wasm-loading'), 'loading');
      wasmModulePromise = import('./lib/avif_enc.js').then(function (m) {
        return m.default({ noInitialRun: true });
      });
      wasmModulePromise.then(function () { renderBadge(); }, function () {
        setBadge(t('badge-wasm-fail'), 'error');
      });
    }
    return wasmModulePromise;
  }

  function setBadge(text, cls) {
    els.engineBadge.textContent = text;
    els.engineBadge.className = 'avt-badge' + (cls ? ' avt-badge-' + cls : '');
  }

  function renderBadge() {
    if (state.nativeAvif === null) {
      setBadge(t('badge-detect'), 'loading');
      return;
    }
    var mode = els.engine.value;
    if (mode === 'native') {
      setBadge(state.nativeAvif ? t('badge-native') : t('badge-fallback'), state.nativeAvif ? 'ok' : 'warn');
    } else if (mode === 'wasm') {
      setBadge(t('badge-wasm'), 'ok');
    } else {
      setBadge(state.nativeAvif
        ? t('badge-native-ok')
        : t('badge-wasm-fallback'),
        state.nativeAvif ? 'ok' : 'warn');
    }
  }

  function resolveEngine() {
    var mode = els.engine.value;
    if (mode === 'native') return state.nativeAvif ? 'native' : 'wasm';
    if (mode === 'wasm') return 'wasm';
    return state.nativeAvif ? 'native' : 'wasm';
  }

  /* ---------- 动图检测（GIF / WebP） ---------- */

  function isAnimatedGif(u8) {
    if (u8.length < 14) return false;
    var p = 13; // header(6) + logical screen descriptor(7)
    var packed = u8[10];
    if (packed & 0x80) p += 3 * (2 << (packed & 7)); // global color table
    var images = 0;
    while (p < u8.length) {
      var b = u8[p];
      if (b === 0x3b) break; // trailer
      if (b === 0x21) { // extension
        p += 2;
        while (p < u8.length && u8[p] !== 0) p += u8[p] + 1;
        p++;
      } else if (b === 0x2c) { // image descriptor
        images++;
        if (images > 1) return true;
        var lp = u8[p + 9];
        p += 10;
        if (lp & 0x80) p += 3 * (2 << (lp & 7));
        p++; // LZW min code size
        while (p < u8.length && u8[p] !== 0) p += u8[p] + 1;
        p++;
      } else {
        break;
      }
    }
    return false;
  }

  function tag(u8, off) {
    return String.fromCharCode(u8[off], u8[off + 1], u8[off + 2], u8[off + 3]);
  }

  function isAnimatedWebp(u8) {
    if (u8.length < 16 || tag(u8, 0) !== 'RIFF' || tag(u8, 8) !== 'WEBP') return false;
    var p = 12;
    while (p + 8 <= u8.length) {
      var name = tag(u8, p);
      var size = u8[p + 4] | (u8[p + 5] << 8) | (u8[p + 6] << 16) | (u8[p + 7] << 24);
      if (name === 'VP8X') return (u8[p + 8] & 0x02) !== 0; // ANIM flag
      if (name === 'ANIM') return true;
      if (name === 'VP8 ' || name === 'VP8L') return false;
      p += 8 + size + (size & 1);
    }
    return false;
  }

  function detectAnimated(file) {
    var isGif = file.type === 'image/gif' || /\.gif$/i.test(file.name);
    var isWebp = file.type === 'image/webp' || /\.webp$/i.test(file.name);
    if (!isGif && !isWebp) return Promise.resolve(false);
    return file.slice(0, 1048576).arrayBuffer().then(function (buf) {
      var u8 = new Uint8Array(buf);
      try {
        return isGif ? isAnimatedGif(u8) : isAnimatedWebp(u8);
      } catch (e) {
        return false;
      }
    }).catch(function () { return false; });
  }

  /* ---------- 解码 ---------- */

  function decodeImage(file) {
    // createImageBitmap 走浏览器原生解码（支持硬件加速），并自动处理 EXIF 方向
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
            reject(new Error(t('err-decode')));
          };
          img.src = url;
        });
      });
  }

  /* ---------- 动图逐帧解码（GIF 自研解码器 / WebP 走 ImageDecoder） ---------- */

  function decodeGifFrames(file) {
    return file.arrayBuffer().then(function (buf) {
      return import('./anim.js').then(function (anim) {
        var frames = [];
        var info = anim.decodeGif(new Uint8Array(buf), function (f) {
          frames.push(f);
        });
        return {
          frames: frames,
          frameCount: info.frameCount,
          width: info.width,
          height: info.height
        };
      });
    });
  }

  function decodeWebpFrames(file) {
    if (typeof ImageDecoder === 'undefined') {
      return Promise.reject(new Error('NO_IMAGE_DECODER'));
    }
    return file.arrayBuffer().then(function (buf) {
      var dec = new ImageDecoder({ data: buf, type: 'image/webp' });
      return dec.tracks.ready.then(function () {
        var track = dec.tracks.selectedTrack;
        if (!track) throw new Error(t('err-webp-track'));
        var n = Math.min(track.frameCount, MAX_ANIM_FRAMES);
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        var frames = [];
        var w = 0, h = 0;
        function one(i) {
          return dec.decode({ frameIndex: i }).then(function (res) {
            var vf = res.image;
            if (i === 0) {
              w = vf.displayWidth; h = vf.displayHeight;
              canvas.width = w; canvas.height = h;
            }
            ctx.drawImage(vf, 0, 0);
            var durMs = Math.round(vf.duration / 1000); // µs → ms
            vf.close();
            frames.push({
              rgba: new Uint8Array(ctx.getImageData(0, 0, w, h).data),
              delayMs: durMs > 0 ? durMs : 100,
              index: i
            });
          });
        }
        var chain = Promise.resolve();
        for (var k = 0; k < n; k++) {
          (function (idx) {
            chain = chain.then(function () { return one(idx); });
          })(k);
        }
        return chain.then(function () {
          dec.close();
          return { frames: frames, frameCount: track.frameCount, width: w, height: h };
        });
      });
    });
  }

  /* ---------- 编码 ---------- */

  function encodeNative(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob && blob.type === 'image/avif') resolve(blob);
        else reject(new Error(t('err-native')));
      }, 'image/avif', quality / 100);
    });
  }

  var WASM_DEFAULTS = {
    // subsample 是 Squoosh 系 embind 自有枚举（勿信 jSquash 文档的 "0|1"），
    // 实测（av1C seq_profile 裁决）：0=NONE 坏流（全灰）、1=YUV420、2=YUV422、
    // 3=YUV444、4=YUV400（灰度）。jSquash 官方 lossless 包装即取 subsample=3。
    // 线条类图 420（ss=1）色度减半是糊的根源：q80 仅 ~24dB；444（ss=3）同参数
    // 达 52dB 且体积反而更小（照片类 +3% 体积持平质量）。Pillow+Chrome 双解码验证。
    quality: 60, qualityAlpha: -1, denoiseLevel: 0,
    tileColsLog2: 0, tileRowsLog2: 0, speed: 8,
    subsample: 3, chromaDeltaQ: false, sharpness: 0,
    tune: 0, enableSharpYUV: true, bitDepth: 8
  };

  function encodeWasm(imageData, quality, speed) {
    return getWasmModule().then(function (mod) {
      var opts = Object.assign({}, WASM_DEFAULTS, { quality: quality, speed: speed });
      var out = mod.encode(new Uint8Array(imageData.data.buffer),
        imageData.width, imageData.height, opts);
      if (!out) throw new Error(t('err-wasm-big'));
      return new Blob([out], { type: 'image/avif' });
    });
  }

  /* ---------- 动图转换（逐帧 AVIF 编码 → 抽取 AV1 裸流 → HEIF 序列封装） ---------- */

  function convertAnimated(item, engine) {
    // 动图质量下限 80：q60 的帧 PSNR 仅 ~35dB，逐帧瑕疵在动画里会帧间闪烁放大；
    // 滑杆高于 80 时尊重用户设置。实测 q60→q80 约 +4dB（照片类）。
    var quality = Math.max(parseInt(els.quality.value, 10), 80);
    var speed = parseInt(els.speed.value, 10);
    var maxW = parseInt(els.maxw.value, 10) || Infinity;
    var isGif = item.file.type === 'image/gif' || /\.gif$/i.test(item.name);
    item.engine = engine;
    item.animQuality = quality; // 卡片展示实际生效的质量（可能与滑杆不同）

    var decodeP = isGif ? decodeGifFrames(item.file) : decodeWebpFrames(item.file);

    return decodeP.then(function (decoded) {
      var frames = decoded.frames;
      if (!frames.length || decoded.frameCount > MAX_ANIM_FRAMES) {
        throw new Error(t('err-frames-pre') + MAX_ANIM_FRAMES + t('err-frames-suffix'));
      }
      if (frames.length < 2) {
        throw new Error(t('err-less2'));
      }
      var totalRGBA = decoded.width * decoded.height * 4 * frames.length;
      if (totalRGBA > MAX_ANIM_BYTES) {
        throw new Error(t('err-rgba-pre') + Math.round(totalRGBA / 1048576) + t('err-rgba-suffix'));
      }

      var scale = Math.min(1, maxW / decoded.width);
      var w = Math.max(1, Math.round(decoded.width * scale));
      var h = Math.max(1, Math.round(decoded.height * scale));
      item.width = w; item.height = h;
      item.frameCount = frames.length;

      return import('./anim.js').then(function (anim) {
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        var tc = null, tcCtx = null; // 缩放用的临时画布
        if (scale < 1) {
          tc = document.createElement('canvas');
          tc.width = decoded.width; tc.height = decoded.height;
          tcCtx = tc.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }

        var header = null; // 取第一帧解析出的 av1C / pixi / colr
        var samples = [];
        var i = 0;

        function step() {
          if (i >= frames.length) return Promise.resolve();
          var f = frames[i++];
          item.progressText = t('tr-frame-pre') + i + '/' + frames.length + '…';
          updateCard(item);

          var encodeP;
          if (scale === 1) {
            ctx.putImageData(new ImageData(new Uint8ClampedArray(f.rgba), w, h), 0, 0);
          } else {
            tcCtx.putImageData(new ImageData(new Uint8ClampedArray(f.rgba), decoded.width, decoded.height), 0, 0);
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(tc, 0, 0, w, h);
          }
          if (engine === 'native') {
            encodeP = encodeNative(canvas, quality).then(function (b) { return b.arrayBuffer(); });
          } else {
            encodeP = encodeWasm(ctx.getImageData(0, 0, w, h), quality, speed)
              .then(function (b) { return b.arrayBuffer(); });
          }
          return encodeP.then(function (ab) {
            var parsed = anim.parseAvifStill(new Uint8Array(ab));
            if (!header) header = parsed;
            samples.push({ data: parsed.av1, durationMs: f.delayMs });
            return step();
          });
        }

        return step().then(function () {
          var out = anim.muxAnimatedAvif({
            width: w, height: h,
            av1C: header.av1C,
            pixi: header.pixi,
            colr: header.colr,
            frames: samples
          });
          return new Blob([out], { type: 'image/avif' });
        });
      });
    });
  }

  /* ---------- 文件列表 ---------- */

  function convertItem(item, engine) {
    item.status = 'running';
    item.progressText = '';
    item.animFallback = false;
    item.frameCount = 0;
    item.engine = engine;
    updateCard(item);
    var quality = parseInt(els.quality.value, 10);
    var speed = parseInt(els.speed.value, 10);
    var maxW = parseInt(els.maxw.value, 10) || Infinity;

    // 动图 + 「保留动画」开启：走逐帧转码路径
    if (item.animated && keepAnim()) {
      var isGif = item.file.type === 'image/gif' || /\.gif$/i.test(item.name);
      if (isGif || typeof ImageDecoder !== 'undefined') {
        item.animMode = true;
        return convertAnimated(item, engine).then(function (blob) {
          item.blob = blob;
          item.outSize = blob.size;
          item.status = 'done';
          item.progressText = '';
          updateCard(item);
        }).catch(function (err) {
          item.status = 'error';
          item.progressText = '';
          item.error = (err && err.message) ? err.message : t('err-anim');
          updateCard(item);
        });
      }
      // 动图 WebP 且浏览器无 ImageDecoder（Safari / Firefox）：降级取首帧
      item.animFallback = true;
    }

    return decodeImage(item.file).then(function (bmp) {
      var scale = Math.min(1, maxW / bmp.width);
      var w = Math.max(1, Math.round(bmp.width * scale));
      var h = Math.max(1, Math.round(bmp.height * scale));
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d', { willReadFrequently: engine === 'wasm' });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bmp, 0, 0, w, h);
      if (bmp.close) bmp.close();
      item.width = w; item.height = h;

      if (engine === 'native') return encodeNative(canvas, quality);
      return encodeWasm(ctx.getImageData(0, 0, w, h), quality, speed);
    }).then(function (blob) {
      item.blob = blob;
      item.outSize = blob.size;
      item.status = 'done';
      updateCard(item);
    }).catch(function (err) {
      item.status = 'error';
      item.error = (err && err.message) ? err.message : t('err-convert');
      updateCard(item);
    });
  }

  function assignOutNames() {
    var used = {};
    state.items.forEach(function (it) {
      if (it.status === 'skipped') return;
      var base = it.name.replace(/\.[^.]+$/, '') || 'image';
      var ext = /\.avif$/i.test(base) ? base : base + '.avif';
      var candidate = ext, n = 1;
      while (used[candidate.toLowerCase()]) {
        candidate = base + '-' + (n++) + '.avif';
      }
      used[candidate.toLowerCase()] = 1;
      it.outName = candidate;
    });
  }

  function convertAll() {
    if (state.running) return;
    var pending = state.items.filter(function (it) { return it.status === 'queued' || it.status === 'error'; });
    if (!pending.length) { setSummary(t('sum-none')); return; }

    // AVIF 输入直接标记跳过，避免二次有损压缩
    state.items.forEach(function (it) {
      if (it.status === 'queued' && (it.file.type === 'image/avif' || /\.avif$/i.test(it.name))) {
        it.status = 'skipped';
        updateCard(it);
      }
    });
    pending = state.items.filter(function (it) { return it.status === 'queued' || it.status === 'error'; });
    if (!pending.length) { updateButtons(); return; }

    assignOutNames();
    pending.forEach(function (it) { updateCard(it); });

    var engine = resolveEngine();
    var limit = engine === 'wasm' ? 1 : 3; // WASM 单实例内存重，严格串行
    state.running = true;
    updateButtons();

    var index = 0;
    function next() {
      if (index >= pending.length) return Promise.resolve();
      var item = pending[index++];
      return convertItem(item, engine).then(next);
    }
    var workers = [];
    for (var i = 0; i < limit; i++) workers.push(next());

    Promise.all(workers).then(function () {
      state.running = false;
      updateButtons();
      updateSummary();
    });
  }

  /* ---------- 卡片渲染 ---------- */

  function statusText(it) {
    switch (it.status) {
      case 'queued':
        if (!it.animated) return t('st-pending');
        return (keepAnim() && !it.animFallback) ? t('st-anim-keep') : t('st-anim-first');
      case 'running': return it.progressText || t('st-running');
      case 'done': return t('st-done');
      case 'skipped': return t('st-skipped');
      case 'error': return t('st-err-pre') + it.error;
    }
    return '';
  }

  function makeCard(item) {
    var li = document.createElement('li');
    li.className = 'avt-item';

    var thumb = document.createElement('img');
    thumb.className = 'avt-thumb';
    thumb.src = item.thumbUrl;
    thumb.alt = '';
    thumb.loading = 'lazy';
    li.appendChild(thumb);

    var info = document.createElement('div');
    info.className = 'avt-info';

    var name = document.createElement('div');
    name.className = 'avt-name';
    name.textContent = item.name;
    name.title = item.name;
    info.appendChild(name);

    var meta = document.createElement('div');
    meta.className = 'avt-meta';
    item._metaEl = meta;
    info.appendChild(meta);

    var side = document.createElement('div');
    side.className = 'avt-side';
    item._statusEl = document.createElement('span');
    side.appendChild(item._statusEl);

    item._dlEl = document.createElement('button');
    item._dlEl.type = 'button';
    item._dlEl.className = 'avt-btn avt-btn-sm';
    item._dlEl.textContent = t('btn-dl');
    item._dlEl.hidden = true;
    item._dlEl.addEventListener('click', function () {
      if (item.blob) saveBlob(item.blob, item.outName || 'image.avif');
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
    item.el.className = 'avt-item avt-status-' + item.status;

    item._statusEl.className = 'avt-status avt-status-text-' + item.status;
    item._statusEl.textContent = statusText(item);

    var parts = [fmtBytes(item.origSize)];
    if (item.status === 'done') {
      var saved = item.origSize > 0 ? Math.round((1 - item.outSize / item.origSize) * 100) : 0;
      parts.push('→ ' + fmtBytes(item.outSize) + '（' + (saved >= 0 ? '-' : '+') + Math.abs(saved) + '%）');
      parts.push(item.width + '×' + item.height);
      if (item.frameCount && item.frameCount > 1) {
        parts.push(item.frameCount + t('meta-frames') + (item.animQuality ? ' · q' + item.animQuality : ''));
      }
      parts.push(item.engine === 'native' ? t('meta-native') : 'WASM');
      item._metaEl.classList.add('avt-meta-done');
      item._dlEl.hidden = false;
    } else if (item.status === 'skipped') {
      // no extra info
    } else if (item.animated && item.status === 'queued') {
      parts.push(item.animFallback || !keepAnim() ? t('meta-anim-first') : t('meta-anim-keep'));
    }
    item._metaEl.textContent = parts.join(' · ');
    if (item.outName && item.status === 'done') {
      item._metaEl.title = t('meta-out-pre') + item.outName + (item.outName !== item.name.replace(/\.[^.]+$/, '') + '.avif' ? t('meta-renamed') : '');
    }
  }

  function setSummary(text) {
    els.summary.hidden = false;
    els.summary.textContent = text;
  }

  function updateSummary() {
    var items = state.items;
    if (!items.length) { els.summary.hidden = true; return; }
    var done = items.filter(function (i) { return i.status === 'done'; });
    var failed = items.filter(function (i) { return i.status === 'error'; });
    var skipped = items.filter(function (i) { return i.status === 'skipped'; });
    if (!done.length && !failed.length) { els.summary.hidden = true; return; }
    var orig = 0, out = 0;
    done.forEach(function (i) { orig += i.origSize; out += i.outSize; });
    var savedPct = orig > 0 ? Math.round((1 - out / orig) * 100) : 0;
    var parts = [t('sum-total-pre') + items.length + t('sum-total-suffix')];
    if (done.length) parts.push(t('sum-done-pre') + done.length);
    if (failed.length) parts.push(t('sum-fail-pre') + failed.length);
    if (skipped.length) parts.push(t('sum-skip-pre') + skipped.length);
    if (done.length) parts.push(fmtBytes(orig) + ' → ' + fmtBytes(out) + t('sum-saved-pre') + Math.max(0, savedPct) + '%');
    setSummary(parts.join(' · '));
  }

  function updateButtons() {
    var hasQueued = state.items.some(function (i) { return i.status === 'queued' || i.status === 'error'; });
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
      return new Promise(function (res) { entry.file(function (f) { out.push(f); res(); }, res); });
    }
    if (entry.isDirectory) {
      var reader = entry.createReader();
      var readBatch = function () {
        return new Promise(function (res) { reader.readEntries(res, res); }).then(function (batch) {
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
    if (!entries.length) return Promise.resolve(Array.prototype.slice.call(dt.files || []));
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
    els.zip.textContent = t('zip-busy');
    import('./lib/fflate.js').then(function (fflate) {
      var chain = Promise.resolve();
      var map = {};
      done.forEach(function (it) {
        chain = chain.then(function () {
          return it.blob.arrayBuffer().then(function (buf) {
            map[it.outName || 'image.avif'] = new Uint8Array(buf);
          });
        });
      });
      return chain.then(function () {
        var zipped = fflate.zipSync(map, { level: 0 }); // AVIF 已压缩，level 0 最快
        var d = new Date();
        var stamp = d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + ('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2) + ('0' + d.getSeconds()).slice(-2);
        saveBlob(new Blob([zipped], { type: 'application/zip' }), 'avif-' + stamp + '.zip');
      });
    }).catch(function () {
      setSummary(t('zip-fail'));
    }).finally(function () {
      els.zip.disabled = false;
      els.zip.textContent = t('zip-btn');
    });
  }

  /* ---------- 清空 ---------- */

  function clearAll() {
    state.items.forEach(function (it) { URL.revokeObjectURL(it.thumbUrl); });
    state.items = [];
    els.list.innerHTML = '';
    els.summary.hidden = true;
    updateButtons();
  }

  /* ---------- 事件绑定 ---------- */

  els.drop.addEventListener('click', function () { els.input.click(); });
  els.drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.input.click(); }
  });

  ['dragenter', 'dragover'].forEach(function (ev) {
    els.drop.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      els.drop.classList.add('avt-drop-active');
    });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    els.drop.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      els.drop.classList.remove('avt-drop-active');
    });
  });

  els.drop.addEventListener('drop', function (e) {
    filesFromDataTransfer(e.dataTransfer).then(function (files) {
      addFilesFixed(files);
    });
  });

  els.input.addEventListener('change', function () {
    addFilesFixed(Array.prototype.slice.call(els.input.files || []));
    els.input.value = '';
  });

  // 添加文件：构建卡片 + 逐个绑定动图检测结果（闭包显式捕获 item）
  function addFilesFixed(files) {
    var valid = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!isImage(f)) continue;
      if (state.items.length >= MAX_FILES) {
        setSummary(t('sum-limit-pre') + MAX_FILES + t('sum-limit-fix'));
        break;
      }
      var item = {
        id: ++state.seq,
        file: f,
        name: f.name || ('image-' + state.seq),
        outName: '',
        thumbUrl: URL.createObjectURL(f),
        status: 'queued',
        animated: false,
        engine: '',
        origSize: f.size,
        outSize: 0,
        width: 0, height: 0,
        el: null
      };
      state.items.push(item);
      makeCard(item);
      valid.push(item);
    }
    if (valid.length) {
      updateButtons();
      setSummary(t('sum-added-pre') + valid.length + t('sum-added-fix'));
      valid.forEach(function (item) {
        detectAnimated(item.file).then(function (isAnim) {
          item.animated = isAnim;
          if (item.status === 'queued') updateCard(item);
        });
      });
    }
  }

  els.quality.addEventListener('input', function () {
    els.qualityVal.textContent = els.quality.value;
  });

  els.engine.addEventListener('change', renderBadge);
  if (els.keepanim) {
    els.keepanim.addEventListener('change', function () {
      state.items.forEach(function (it) {
        if (it.status === 'queued') updateCard(it);
      });
    });
  }
  els.convert.addEventListener('click', convertAll);
  els.zip.addEventListener('click', downloadZip);
  els.clear.addEventListener('click', clearAll);

  /* ---------- 启动 ---------- */

  renderBadge();
  probeNativeAvif().then(function (ok) {
    state.nativeAvif = ok;
    renderBadge();
    updateButtons();
  });
})();
