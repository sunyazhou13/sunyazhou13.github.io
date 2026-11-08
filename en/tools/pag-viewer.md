---
layout: page
title: PAG Animation Viewer
icon: fas fa-video
lang: en
permalink: /tools/pag-viewer/
tool_css: /assets/tools/pag-viewer/app.css?v=202609221
---

<div id="pv-app">

<div class="pv-hint" markdown="block">
Preview PAG animation files entirely in your browser. Files are **never uploaded** — all parsing and rendering happen locally. Powered by Tencent libpag engine.
</div>

<!-- Upload area -->
<div id="pv-upload" class="pv-upload">
  <i class="fas fa-cloud-arrow-up"></i>
  <div class="pv-upload-text">Click or drag a PAG file here</div>
  <div class="pv-upload-hint">Supports .pag format. Files stay in your browser.</div>
  <input type="file" id="pv-file-input" accept=".pag" style="display:none">
</div>

<!-- Status -->
<div id="pv-status" class="pv-status"></div>

<!-- Preview -->
<div id="pv-preview-wrap" class="pv-preview-wrap">
  <div id="pv-canvas" class="pv-canvas">
    <canvas id="pv-canvas-el"></canvas>
    <span id="pv-empty" class="pv-empty">Waiting for animation…</span>
  </div>
  <div id="pv-loading" class="pv-loading" style="display:none">
    <i class="fas fa-circle-notch fa-spin"></i> Loading…
  </div>
  <div id="pv-controls" class="pv-controls" style="display:none">
    <button id="pv-play" class="pv-btn"><i class="fas fa-play"></i> Play</button>
    <button id="pv-stop" class="pv-btn"><i class="fas fa-stop"></i> Stop</button>
    <button id="pv-loop" class="pv-btn"><i class="fas fa-repeat"></i> Loop</button>
    <input type="range" id="pv-seek" class="pv-seek" min="0" max="1000" value="0" step="1">
    <span id="pv-time" class="pv-time">00:00 / 00:00</span>
    <select id="pv-speed" class="pv-btn">
      <option value="0.25">0.25x</option>
      <option value="0.5">0.5x</option>
      <option value="1" selected>1x</option>
      <option value="2">2x</option>
      <option value="4">4x</option>
    </select>
    <div class="pv-bg-select" id="pv-bg">
      <span class="pv-bg-label">Background</span>
      <div class="pv-bg-dot pv-active" data-bg="transparent" style="background:transparent;border-color:var(--pv-border-strong)" title="Transparent"></div>
      <div class="pv-bg-dot" data-bg="white" style="background:#fff" title="White"></div>
      <div class="pv-bg-dot" data-bg="black" style="background:#000" title="Black"></div>
      <div class="pv-bg-dot" data-bg="gray" style="background:#808080" title="Gray"></div>
    </div>
    <button id="pv-export" class="pv-btn pv-export"><i class="fas fa-download"></i> Export frame as PNG</button>
  </div>
</div>

<!-- Info panel -->
<div id="pv-info" class="pv-info" style="display:none">
  <div class="pv-info-title">Animation Info</div>
  <div id="pv-info-grid" class="pv-info-grid"></div>
</div>

<!-- Layer structure panel -->
<div id="pv-layers" class="pv-layers" style="display:none">
  <div class="pv-layers-header">
    <span class="pv-layers-title">Layer Structure</span>
    <span class="pv-layers-count" id="pv-layers-count"></span>
  </div>
  <div id="pv-layers-tree" class="pv-layers-tree"></div>
</div>

</div>

<script type="module">
  import { PAGInit } from 'https://cdn.jsdelivr.net/npm/libpag@4.5.85/lib/libpag.esm.js';
  window._PAGInit = PAGInit;
</script>
<script src="/assets/tools/pag-viewer/app.js?v=202609221" defer></script>
