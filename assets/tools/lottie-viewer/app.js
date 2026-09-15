/**
 * Lottie 动画预览器 — 纯前端，文件不上传
 *
 * 支持 .json 和 .lottie 动画文件的预览与调试：
 *   - 拖拽 / 点击上传 Lottie JSON 或 dotLottie 格式动画
 *   - 播放控制：播放 / 暂停 / 停止 / 进度拖拽
 *   - 速度控制：0.25x / 0.5x / 1x / 2x / 4x
 *   - 循环模式切换
 *   - 背景色切换（透明 / 白 / 黑 / 灰）
 *   - 动画信息展示（尺寸、时长、帧数、帧率、版本、图层数）
 *   - 导出当前帧为 PNG
 *
 * 依赖 lottie-web（CDN 加载），类名前缀 lv-，与既有工具同构。
 * 页面结构见 /tools/lottie-viewer.md
 */
(function () {
  'use strict';

  var ROOT = document.getElementById('lv-app');
  if (!ROOT) return;

  /* 语言感知文案（zh / en），跟随 document.documentElement.lang */
  var LANG = (document.documentElement.lang || '').toLowerCase() === 'en' ? 'en' : 'zh';
  var I18N = {
    zh: {
      'upload-title': '点击或拖拽 Lottie 文件到此处',
      'upload-hint': '支持 .json、.lottie 格式，文件不会上传到服务器',
      'empty': '等待加载动画…',
      'play': '播放',
      'pause': '暂停',
      'stop': '停止',
      'loop': '循环',
      'speed': '速度',
      'bg': '背景',
      'export-png': '导出当前帧 PNG',
      'info-title': '动画信息',
      'name': '名称',
      'size': '文件大小',
      'duration': '时长',
      'frames': '总帧数',
      'framerate': '帧率',
      'version': 'Lottie 版本',
      'layers': '图层数',
      'renderer': '渲染器',
      'status-loading': '加载中…',
      'status-loaded': '加载成功',
      'status-error': '加载失败：',
      'status-nofile': '请先选择 Lottie 文件',
      'status-exported': '已导出 PNG',
      'status-export-fail': '导出失败：',
      'status-unsupported': '不支持的文件类型：',
      'progress-label': '进度',
      'transparent': '透明',
    },
    en: {
      'upload-title': 'Click or drag a Lottie file here',
      'upload-hint': 'Supports .json and .lottie formats. Files stay in your browser.',
      'empty': 'Waiting for animation…',
      'play': 'Play',
      'pause': 'Pause',
      'stop': 'Stop',
      'loop': 'Loop',
      'speed': 'Speed',
      'bg': 'Background',
      'export-png': 'Export frame as PNG',
      'info-title': 'Animation Info',
      'name': 'Name',
      'size': 'File Size',
      'duration': 'Duration',
      'frames': 'Total Frames',
      'framerate': 'Frame Rate',
      'version': 'Lottie Version',
      'layers': 'Layers',
      'renderer': 'Renderer',
      'status-loading': 'Loading…',
      'status-loaded': 'Loaded successfully',
      'status-error': 'Load failed: ',
      'status-nofile': 'Please select a Lottie file first',
      'status-exported': 'PNG exported',
      'status-export-fail': 'Export failed: ',
      'status-unsupported': 'Unsupported file type: ',
      'progress-label': 'Progress',
      'transparent': 'Transparent',
    }
  };

  var T = function (key) { return (I18N[LANG] && I18N[LANG][key]) || key; };

  /* DOM 引用 */
  var $upload = document.getElementById('lv-upload');
  var $fileInput = document.getElementById('lv-file-input');
  var $previewWrap = document.getElementById('lv-preview-wrap');
  var $canvas = document.getElementById('lv-canvas');
  var $empty = document.getElementById('lv-empty');
  var $controls = document.getElementById('lv-controls');
  var $playBtn = document.getElementById('lv-play');
  var $stopBtn = document.getElementById('lv-stop');
  var $loopBtn = document.getElementById('lv-loop');
  var $seek = document.getElementById('lv-seek');
  var $time = document.getElementById('lv-time');
  var $speedSelect = document.getElementById('lv-speed');
  var $bgSelect = document.getElementById('lv-bg');
  var $exportBtn = document.getElementById('lv-export');
  var $status = document.getElementById('lv-status');
  var $info = document.getElementById('lv-info');
  var $infoGrid = document.getElementById('lv-info-grid');

  /* 状态 */
  var anim = null;
  var fileName = '';
  var fileSize = 0;
  var isPlaying = false;
  var isLooping = true;
  var speed = 1;
  var currentBg = 'transparent';
  var rendererType = 'canvas';
  var lottieLib = null;

  /* 工具函数 */
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function setStatus(msg, isError) {
    if (!$status) return;
    $status.textContent = msg;
    $status.classList.toggle('lv-err', !!isError);
  }

  function loadLottieLib(callback) {
    if (typeof lottie !== 'undefined') {
      lottieLib = lottie;
      callback();
      return;
    }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js';
    script.onload = function () {
      lottieLib = lottie;
      callback();
    };
    script.onerror = function () {
      setStatus(T('status-error') + 'lottie-web CDN load failed', true);
    };
    document.head.appendChild(script);
  }

  /* 加载动画文件 */
  function handleFile(file) {
    if (!file) return;
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext !== 'json' && ext !== 'lottie' && ext !== 'txt') {
      setStatus(T('status-error') + T('status-unsupported') + '.' + ext, true);
      return;
    }
    fileName = file.name;
    fileSize = file.size;
    setStatus(T('status-loading'));

    var reader = new FileReader();
    reader.onload = function (e) {
      var text = e.target.result;
      if (ext === 'lottie') {
        /* dotLottie 格式是 zip 压缩包，内含 JSON */
        loadDotLottie(text, file);
      } else {
        try {
          var data = JSON.parse(text);
          loadAnimationData(data);
        } catch (err) {
          setStatus(T('status-error') + err.message, true);
        }
      }
    };
    reader.onerror = function () {
      setStatus(T('status-error') + 'File read error', true);
    };
    reader.readAsText(file);
  }

  /* dotLottie 解析（zip 格式，需 JSZip 或手动解压） */
  function loadDotLottie(text, file) {
    /* dotLottie 是 ZIP 文件，需要用二进制方式读取 */
    var reader = new FileReader();
    reader.onload = function (e) {
      var arrayBuffer = e.target.result;
      /* 使用 fetch + Response 来解压 ZIP 不现实，这里用 pako 或 JSZip */
      /* 尝试用浏览器原生 DecompressionStream（不适用于 zip） */
      /* 回退方案：通过 <script> 动态加载 JSZip */
      if (typeof JSZip === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.onload = function () {
          extractDotLottie(arrayBuffer);
        };
        script.onerror = function () {
          setStatus(T('status-error') + 'JSZip CDN load failed', true);
        };
        document.head.appendChild(script);
      } else {
        extractDotLottie(arrayBuffer);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /* dotLottie ZIP 结构扫描 */
  function scanDotLottie(zip) {
    return new Promise(function (resolve, reject) {
      var candidates = [];
      zip.forEach(function (path, entry) {
        if (entry.dir) return;
        var lower = path.toLowerCase();
        /* animations/ 目录下 .json 优先 */
        if (lower.endsWith('.json') && (lower.indexOf('animations/') >= 0 || lower.indexOf('animation/') >= 0)) {
          candidates.push({ entry: entry, path: path, score: 10 });
        }
        /* 根目录 .json 次之 */
        else if (lower.endsWith('.json') && path.indexOf('/') < 0) {
          candidates.push({ entry: entry, path: path, score: 5 });
        }
        /* 其它目录的 .json */
        else if (lower.endsWith('.json')) {
          candidates.push({ entry: entry, path: path, score: 1 });
        }
      });
      /* manifest.json 不参与动画候选 */
      candidates = candidates.filter(function (c) {
        return c.path.toLowerCase() !== 'manifest.json';
      });
      /* 按 score 降序 */
      candidates.sort(function (a, b) { return b.score - a.score; });
      resolve(candidates);
    });
  }

  function extractDotLottie(arrayBuffer) {
    JSZip.loadAsync(arrayBuffer).then(function (zip) {
      scanDotLottie(zip).then(function (candidates) {
        if (candidates.length === 0) {
          /* 列出 ZIP 内文件帮助诊断 */
          var files = [];
          zip.forEach(function (p) { files.push(p); });
          setStatus(T('status-error') + 'ZIP 内未找到 .json 文件。文件列表：' + files.slice(0, 8).join(', ') + (files.length > 8 ? '…' : ''), true);
          return;
        }
        /* 先读 manifest，然后按 manifest 指引找动画 */
        var manifest = zip.file('manifest.json');
        if (manifest) {
          manifest.async('text').then(function (text) {
            try {
              var m = JSON.parse(text);
              if (m.animations && m.animations.length > 0) {
                /* 按 manifest 中顺序尝试 */
                var found = false;
                var tryNext = function (idx) {
                  if (idx >= m.animations.length) {
                    /* manifest 指引都失败，fallback 到候选列表第一个 */
                    loadCandidate(candidates[0]);
                    return;
                  }
                  var a = m.animations[idx];
                  var id = a && (a.id || a.file || '');
                  if (!id) { tryNext(idx + 1); return; }
                  var guesses = [
                    'animations/' + id + '.json',
                    'animation/' + id + '.json',
                    id + '.json',
                    id,
                    'animations/' + id,
                    'animation/' + id
                  ];
                  var matched = null;
                  for (var i = 0; i < guesses.length; i++) {
                    var f = zip.file(guesses[i]);
                    if (f) { matched = f; break; }
                  }
                  if (matched) {
                    matched.async('text').then(function (jsonText) {
                      try { loadAnimationData(JSON.parse(jsonText)); }
                      catch (err) { tryNext(idx + 1); }
                    });
                  } else {
                    tryNext(idx + 1);
                  }
                };
                tryNext(0);
              } else {
                loadCandidate(candidates[0]);
              }
            } catch (e) {
              loadCandidate(candidates[0]);
            }
          }).catch(function () {
            loadCandidate(candidates[0]);
          });
        } else {
          loadCandidate(candidates[0]);
        }

        function loadCandidate(cand) {
          if (!cand) {
            setStatus(T('status-error') + 'No animation JSON found in .lottie', true);
            return;
          }
          cand.entry.async('text').then(function (jsonText) {
            try {
              loadAnimationData(JSON.parse(jsonText));
            } catch (err) {
              setStatus(T('status-error') + err.message, true);
            }
          });
        }
      });
    }).catch(function (err) {
      setStatus(T('status-error') + err.message, true);
    });
  }

  /* 加载动画数据并渲染 */
  function loadAnimationData(data) {
    /* 销毁旧动画 */
    if (anim) {
      anim.destroy();
      anim = null;
    }

    /* 清空画布 */
    $canvas.innerHTML = '';
    if ($empty) $empty.style.display = 'none';
    if ($controls) $controls.style.display = 'flex';
    if ($info) $info.style.display = 'block';

    rendererType = 'canvas';
    anim = lottieLib.loadAnimation({
      container: $canvas,
      renderer: 'canvas',
      loop: isLooping,
      autoplay: true,
      animationData: data
    });

    isPlaying = true;
    updatePlayButton();

    anim.addEventListener('DOMLoaded', function () {
      setStatus(T('status-loaded'));
      updateInfo(data);
    });

    anim.addEventListener('enterFrame', function (e) {
      var current = e.currentTime;
      var total = anim.totalFrames;
      if ($seek) {
        $seek.value = (current / total) * 1000;
      }
      if ($time) {
        var dur = anim.getDuration();
        var cur = current / anim.frameRate;
        $time.textContent = formatTime(cur) + ' / ' + formatTime(dur);
      }
    });

    anim.addEventListener('complete', function () {
      if (!isLooping) {
        isPlaying = false;
        updatePlayButton();
      }
    });

    anim.addEventListener('data_failed', function (err) {
      setStatus(T('status-error') + (err && err.message ? err.message : 'data error'), true);
    });
  }

  function updateInfo(data) {
    if (!$infoGrid) return;
    var html = '';
    html += infoRow(T('name'), fileName || (data.nm || '-'));
    html += infoRow(T('size'), formatBytes(fileSize));
    html += infoRow(T('duration'), formatTime(anim.getDuration()));
    html += infoRow(T('frames'), anim.totalFrames);
    html += infoRow(T('framerate'), anim.frameRate + ' fps');
    html += infoRow(T('version'), data.v || '-');
    html += infoRow(T('layers'), countLayers(data));
    html += infoRow(T('renderer'), rendererType);
    $infoGrid.innerHTML = html;
  }

  function infoRow(label, value) {
    return '<div class="lv-info-item"><span class="lv-info-label">' + label +
           '</span><span class="lv-info-value">' + escapeHtml(String(value)) + '</span></div>';
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
  }

  function countLayers(data) {
    if (!data.layers) return 0;
    var count = data.layers.length;
    /* 递归计算嵌套图层 */
    function walk(layers) {
      if (!layers) return;
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].layers) {
          count += layers[i].layers.length;
          walk(layers[i].layers);
        }
      }
    }
    walk(data.layers);
    return count;
  }

  /* 播放控制 */
  function play() {
    if (!anim) { setStatus(T('status-nofile'), true); return; }
    anim.play();
    isPlaying = true;
    updatePlayButton();
  }

  function pause() {
    if (!anim) return;
    anim.pause();
    isPlaying = false;
    updatePlayButton();
  }

  function togglePlay() {
    if (isPlaying) pause(); else play();
  }

  function stop() {
    if (!anim) return;
    anim.stop();
    isPlaying = false;
    updatePlayButton();
    if ($seek) $seek.value = 0;
    if ($time) $time.textContent = '00:00 / ' + formatTime(anim.getDuration());
  }

  function updatePlayButton() {
    if (!$playBtn) return;
    var icon = isPlaying ? 'fa-pause' : 'fa-play';
    var text = isPlaying ? T('pause') : T('play');
    $playBtn.innerHTML = '<i class="fas ' + icon + '"></i> ' + text;
  }

  function seek(value) {
    if (!anim) return;
    var frame = (value / 1000) * anim.totalFrames;
    anim.goToAndStop(frame, true);
    isPlaying = false;
    updatePlayButton();
  }

  function setSpeed(s) {
    speed = s;
    if (anim) anim.setSpeed(s);
  }

  function toggleLoop() {
    isLooping = !isLooping;
    if ($loopBtn) $loopBtn.classList.toggle('lv-active', isLooping);
    if (anim) {
      anim.loop = isLooping;
      if (isLooping && !isPlaying) play();
    }
  }

  /* 背景色切换 */
  function setBg(color) {
    currentBg = color;
    var bg;
    switch (color) {
      case 'transparent': bg = 'transparent'; break;
      case 'white': bg = '#ffffff'; break;
      case 'black': bg = '#000000'; break;
      case 'gray': bg = '#808080'; break;
      default: bg = 'transparent';
    }
    $previewWrap.style.background = bg;
    /* 更新选中态 */
    var dots = document.querySelectorAll('.lv-bg-dot');
    dots.forEach(function (dot) {
      dot.classList.toggle('lv-active', dot.getAttribute('data-bg') === color);
    });
  }

  /* 导出 PNG */
  function exportPng() {
    if (!anim) { setStatus(T('status-nofile'), true); return; }
    try {
      /* lottie-web canvas 渲染器可以直接获取 canvas */
      var canvasEl = $canvas.querySelector('canvas');
      if (!canvasEl) {
        /* SVG 渲染器需要不同处理 */
        setStatus(T('status-export-fail') + 'canvas not found', true);
        return;
      }
      var dataUrl = canvasEl.toDataURL('image/png');
      var link = document.createElement('a');
      link.download = (fileName || 'lottie-frame') + '.png';
      link.href = dataUrl;
      link.click();
      setStatus(T('status-exported'));
    } catch (err) {
      setStatus(T('status-export-fail') + err.message, true);
    }
  }

  /* 拖拽上传 */
  if ($upload) {
    $upload.addEventListener('click', function () {
      if ($fileInput) $fileInput.click();
    });
    $upload.addEventListener('dragover', function (e) {
      e.preventDefault();
      $upload.classList.add('lv-dragover');
    });
    $upload.addEventListener('dragleave', function () {
      $upload.classList.remove('lv-dragover');
    });
    $upload.addEventListener('drop', function (e) {
      e.preventDefault();
      $upload.classList.remove('lv-dragover');
      var file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  }

  if ($fileInput) {
    $fileInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (file) handleFile(file);
    });
  }

  /* 控制按钮 */
  if ($playBtn) $playBtn.addEventListener('click', togglePlay);
  if ($stopBtn) $stopBtn.addEventListener('click', stop);
  if ($loopBtn) {
    $loopBtn.classList.add('lv-active');
    $loopBtn.addEventListener('click', toggleLoop);
  }
  if ($seek) {
    $seek.addEventListener('input', function (e) {
      seek(parseFloat(e.target.value));
    });
  }
  if ($speedSelect) {
    $speedSelect.addEventListener('change', function (e) {
      setSpeed(parseFloat(e.target.value));
    });
  }
  if ($exportBtn) $exportBtn.addEventListener('click', exportPng);

  /* 背景色圆点 */
  var bgDots = document.querySelectorAll('.lv-bg-dot');
  bgDots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      setBg(dot.getAttribute('data-bg'));
    });
  });

  /* 初始化 */
  loadLottieLib(function () {
    /* 库加载完成，待用户上传文件 */
  });

})();
