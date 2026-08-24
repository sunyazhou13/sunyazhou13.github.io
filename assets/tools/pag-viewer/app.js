/**
 * PAG 动画预览器 — 纯前端，文件不上传
 *
 * 支持 .pag 动画文件的预览与调试：
 *   - 拖拽 / 点击上传 PAG 文件
 *   - 播放控制：播放 / 暂停 / 停止 / 进度拖拽
 *   - 速度控制：0.25x / 0.5x / 1x / 2x / 4x
 *   - 循环模式切换
 *   - 背景色切换（透明 / 白 / 黑 / 灰）
 *   - 动画信息展示（尺寸、时长、帧数、帧率、图层数等）
 *   - 导出当前帧为 PNG
 *
 * 依赖 libpag（CDN 加载 WASM），类名前缀 pv-，与既有工具同构。
 * 页面结构见 /tools/pag-viewer.md
 */
(function () {
  'use strict';

  var ROOT = document.getElementById('pv-app');
  if (!ROOT) return;

  /* 语言感知文案（zh / en），跟随 document.documentElement.lang */
  var LANG = (document.documentElement.lang || '').toLowerCase() === 'en' ? 'en' : 'zh';
  var I18N = {
    zh: {
      'upload-title': '点击或拖拽 PAG 文件到此处',
      'upload-hint': '支持 .pag 格式，文件不会上传到服务器',
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
      'width': '宽度',
      'height': '高度',
      'taglevel': 'PAG 标签等级',
      'status-loading': '加载中…',
      'status-loaded': '加载成功',
      'status-error': '加载失败：',
      'status-nofile': '请先选择 PAG 文件',
      'status-exported': '已导出 PNG',
      'status-export-fail': '导出失败：',
      'status-unsupported': '不支持的文件类型：',
      'status-init': '正在初始化 PAG 引擎…',
      'status-init-fail': 'PAG 引擎初始化失败',
      'progress-label': '进度',
      'transparent': '透明',
    },
    en: {
      'upload-title': 'Click or drag a PAG file here',
      'upload-hint': 'Supports .pag format. Files stay in your browser.',
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
      'width': 'Width',
      'height': 'Height',
      'taglevel': 'PAG Tag Level',
      'status-loading': 'Loading…',
      'status-loaded': 'Loaded successfully',
      'status-error': 'Load failed: ',
      'status-nofile': 'Please select a PAG file first',
      'status-exported': 'PNG exported',
      'status-export-fail': 'Export failed: ',
      'status-unsupported': 'Unsupported file type: ',
      'status-init': 'Initializing PAG engine…',
      'status-init-fail': 'PAG engine initialization failed',
      'progress-label': 'Progress',
      'transparent': 'Transparent',
    }
  };

  var T = function (key) { return (I18N[LANG] && I18N[LANG][key]) || key; };

  /* DOM 引用 */
  var $upload = document.getElementById('pv-upload');
  var $fileInput = document.getElementById('pv-file-input');
  var $previewWrap = document.getElementById('pv-preview-wrap');
  var $canvas = document.getElementById('pv-canvas');
  var $canvasEl = document.getElementById('pv-canvas-el');
  var $empty = document.getElementById('pv-empty');
  var $loading = document.getElementById('pv-loading');
  var $controls = document.getElementById('pv-controls');
  var $playBtn = document.getElementById('pv-play');
  var $stopBtn = document.getElementById('pv-stop');
  var $loopBtn = document.getElementById('pv-loop');
  var $seek = document.getElementById('pv-seek');
  var $time = document.getElementById('pv-time');
  var $speedSelect = document.getElementById('pv-speed');
  var $bgSelect = document.getElementById('pv-bg');
  var $exportBtn = document.getElementById('pv-export');
  var $status = document.getElementById('pv-status');
  var $info = document.getElementById('pv-info');
  var $infoGrid = document.getElementById('pv-info-grid');

  /* 状态 */
  var pagModule = null;
  var pagFile = null;
  var pagView = null;
  var fileName = '';
  var fileSize = 0;
  var isPlaying = false;
  var isLooping = true;
  var speed = 1;
  var currentBg = 'transparent';
  var isReady = false;

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
    $status.classList.toggle('pv-err', !!isError);
  }

  function showLoading(show) {
    if ($loading) $loading.style.display = show ? 'flex' : 'none';
  }

  /* libpag CDN 配置 — ESM 版本，通过页面内 <script type="module"> 预加载 */
  var PAG_CDN_BASE = 'https://cdn.jsdelivr.net/npm/libpag@4.5.85/lib/';

  /* 初始化 PAG 模块 — 页面 module script 会把 PAGInit 挂到 window._PAGInit */
  function initPAG(callback) {
    if (isReady) { callback(); return; }
    setStatus(T('status-init'));

    if (window._PAGInit) {
      doInitPAG(window._PAGInit, callback);
      return;
    }

    /* module script 可能还在加载，轮询等待 */
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (window._PAGInit) {
        clearInterval(timer);
        doInitPAG(window._PAGInit, callback);
      } else if (attempts > 100) { /* 10 秒超时 */
        clearInterval(timer);
        setStatus(T('status-init-fail') + ': libpag module load timeout', true);
      }
    }, 100);
  }

  function doInitPAG(PAGInitFn, callback) {
    try {
      PAGInitFn({ locateFile: function (file) { return PAG_CDN_BASE + file; } })
        .then(function (module) {
          pagModule = module;
          isReady = true;
          callback();
        })
        .catch(function (err) {
          setStatus(T('status-init-fail') + ': ' + (err.message || err), true);
        });
    } catch (err) {
      setStatus(T('status-init-fail') + ': ' + (err.message || err), true);
    }
  }

  /* 加载 PAG 文件 */
  function handleFile(file) {
    if (!file) return;
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext !== 'pag') {
      setStatus(T('status-error') + T('status-unsupported') + '.' + ext, true);
      return;
    }
    fileName = file.name;
    fileSize = file.size;
    setStatus(T('status-loading'));
    showLoading(true);

    initPAG(function () {
      var reader = new FileReader();
      reader.onload = function (e) {
        var arrayBuffer = e.target.result;
        loadPAGFile(arrayBuffer);
      };
      reader.onerror = function () {
        setStatus(T('status-error') + 'File read error', true);
        showLoading(false);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function loadPAGFile(arrayBuffer) {
    if (!pagModule) {
      setStatus(T('status-init-fail'), true);
      showLoading(false);
      return;
    }

    try {
      /* 先销毁旧的 */
      if (pagView) {
        pagView.destroy();
        pagView = null;
      }
      if (pagFile) {
        pagFile.destroy();
        pagFile = null;
      }
    } catch (e) { /* ignore */ }

    pagModule.PAGFile.load(arrayBuffer).then(function (file) {
      pagFile = file;
      setupCanvas();
      createPAGView();
    }).catch(function (err) {
      setStatus(T('status-error') + (err.message || err), true);
      showLoading(false);
    });
  }

  function setupCanvas() {
    var w = pagFile.width();
    var h = pagFile.height();
    /* 设置 canvas 尺寸，保持宽高比 */
    var maxW = $canvas.clientWidth;
    var maxH = $canvas.clientHeight;
    var scale = Math.min(maxW / w, maxH / h, 1);
    $canvasEl.width = w * scale;
    $canvasEl.height = h * scale;
    $canvasEl.style.width = (w * scale) + 'px';
    $canvasEl.style.height = (h * scale) + 'px';
  }

  function createPAGView() {
    pagModule.PAGView.init(pagFile, $canvasEl).then(function (view) {
      pagView = view;
      pagView.setRepeatCount(isLooping ? 0 : 1);
      pagView.play();
      isPlaying = true;
      updatePlayButton();

      if ($empty) $empty.style.display = 'none';
      if ($controls) $controls.style.display = 'flex';
      if ($info) $info.style.display = 'block';
      showLoading(false);
      setStatus(T('status-loaded'));
      updateInfo();

      /* 监听播放进度 */
      var progressTimer = setInterval(function () {
        if (!pagView || !pagFile) {
          clearInterval(progressTimer);
          return;
        }
        var progress = pagView.getProgress();
        if ($seek) $seek.value = progress * 1000;
        var durSec = getDurationSec();
        var cur = progress * durSec;
        if ($time) $time.textContent = formatTime(cur) + ' / ' + formatTime(durSec);
        if (progress >= 1 && !isLooping) {
          isPlaying = false;
          updatePlayButton();
          clearInterval(progressTimer);
        }
      }, 50);
    }).catch(function (err) {
      setStatus(T('status-error') + (err.message || err), true);
      showLoading(false);
    });
  }

  /* libpag duration() 返回微秒；numFrames = duration_us / 1_000_000 * frameRate */
  function getDurationSec() {
    return pagFile ? pagFile.duration() / 1_000_000 : 0;
  }

  function getNumFrames() {
    if (!pagFile) return 0;
    return Math.round(getDurationSec() * pagFile.frameRate());
  }

  function updateInfo() {
    if (!$infoGrid || !pagFile) return;
    var durSec = getDurationSec();
    var fr = pagFile.frameRate();
    var html = '';
    html += infoRow(T('name'), fileName || '-');
    html += infoRow(T('size'), formatBytes(fileSize));
    html += infoRow(T('duration'), formatTime(durSec));
    html += infoRow(T('frames'), getNumFrames());
    html += infoRow(T('framerate'), fr.toFixed(2) + ' fps');
    html += infoRow(T('width'), pagFile.width() + ' px');
    html += infoRow(T('height'), pagFile.height() + ' px');
    html += infoRow(T('taglevel'), pagFile.tagLevel());
    $infoGrid.innerHTML = html;
  }

  function infoRow(label, value) {
    return '<div class="pv-info-item"><span class="pv-info-label">' + label +
           '</span><span class="pv-info-value">' + escapeHtml(String(value)) + '</span></div>';
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
  }

  /* 播放控制 */
  function play() {
    if (!pagView) { setStatus(T('status-nofile'), true); return; }
    pagView.play();
    isPlaying = true;
    updatePlayButton();
  }

  function pause() {
    if (!pagView) return;
    pagView.pause();
    isPlaying = false;
    updatePlayButton();
  }

  function togglePlay() {
    if (isPlaying) pause(); else play();
  }

  function stop() {
    if (!pagView) return;
    pagView.stop();
    isPlaying = false;
    updatePlayButton();
    if ($seek) $seek.value = 0;
    if ($time && pagFile) $time.textContent = '00:00 / ' + formatTime(getDurationSec());
  }

  function updatePlayButton() {
    if (!$playBtn) return;
    var icon = isPlaying ? 'fa-pause' : 'fa-play';
    var text = isPlaying ? T('pause') : T('play');
    $playBtn.innerHTML = '<i class="fas ' + icon + '"></i> ' + text;
  }

  function seek(value) {
    if (!pagView) return;
    var progress = value / 1000;
    pagView.setProgress(progress);
    isPlaying = false;
    updatePlayButton();
  }

  function setSpeed(s) {
    speed = s;
    if (pagView) pagView.setSpeed(s);
  }

  function toggleLoop() {
    isLooping = !isLooping;
    if ($loopBtn) $loopBtn.classList.toggle('pv-active', isLooping);
    if (pagView) pagView.setRepeatCount(isLooping ? 0 : 1);
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
    var dots = document.querySelectorAll('.pv-bg-dot');
    dots.forEach(function (dot) {
      dot.classList.toggle('pv-active', dot.getAttribute('data-bg') === color);
    });
  }

  /* 导出 PNG */
  function exportPng() {
    if (!pagView || !$canvasEl) { setStatus(T('status-nofile'), true); return; }
    try {
      var dataUrl = $canvasEl.toDataURL('image/png');
      var link = document.createElement('a');
      link.download = (fileName || 'pag-frame') + '.png';
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
      $upload.classList.add('pv-dragover');
    });
    $upload.addEventListener('dragleave', function () {
      $upload.classList.remove('pv-dragover');
    });
    $upload.addEventListener('drop', function (e) {
      e.preventDefault();
      $upload.classList.remove('pv-dragover');
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
    $loopBtn.classList.add('pv-active');
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
  var bgDots = document.querySelectorAll('.pv-bg-dot');
  bgDots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      setBg(dot.getAttribute('data-bg'));
    });
  });

})();
