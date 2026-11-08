---
layout: page
title: Lottie Animation Viewer
icon: fas fa-film
lang: en
permalink: /tools/lottie-viewer/
tool_css: /assets/tools/lottie-viewer/app.css?v=202609221
---

<div id="lv-app">

<div class="lv-hint" markdown="block">
Preview Lottie / dotLottie animation files entirely in your browser. Files are **never uploaded** — all parsing and rendering happen locally.
</div>

<!-- Upload area -->
<div id="lv-upload" class="lv-upload">
  <i class="fas fa-cloud-arrow-up"></i>
  <div class="lv-upload-text">Click or drag a Lottie file here</div>
  <div class="lv-upload-hint">Supports .json and .lottie formats. Files stay in your browser.</div>
  <input type="file" id="lv-file-input" accept=".json,.lottie" style="display:none">
</div>

<!-- Status -->
<div id="lv-status" class="lv-status"></div>

<!-- Preview -->
<div id="lv-preview-wrap" class="lv-preview-wrap">
  <div id="lv-canvas" class="lv-canvas">
    <span id="lv-empty" class="lv-empty">Waiting for animation…</span>
  </div>
  <div id="lv-controls" class="lv-controls" style="display:none">
    <button id="lv-play" class="lv-btn"><i class="fas fa-play"></i> Play</button>
    <button id="lv-stop" class="lv-btn"><i class="fas fa-stop"></i> Stop</button>
    <button id="lv-loop" class="lv-btn"><i class="fas fa-repeat"></i> Loop</button>
    <input type="range" id="lv-seek" class="lv-seek" min="0" max="1000" value="0" step="1">
    <span id="lv-time" class="lv-time">00:00 / 00:00</span>
    <select id="lv-speed" class="lv-btn">
      <option value="0.25">0.25x</option>
      <option value="0.5">0.5x</option>
      <option value="1" selected>1x</option>
      <option value="2">2x</option>
      <option value="4">4x</option>
    </select>
    <div class="lv-bg-select" id="lv-bg">
      <span class="lv-bg-label">Background</span>
      <div class="lv-bg-dot lv-active" data-bg="transparent" style="background:transparent;border-color:var(--lv-border-strong)" title="Transparent"></div>
      <div class="lv-bg-dot" data-bg="white" style="background:#fff" title="White"></div>
      <div class="lv-bg-dot" data-bg="black" style="background:#000" title="Black"></div>
      <div class="lv-bg-dot" data-bg="gray" style="background:#808080" title="Gray"></div>
    </div>
    <button id="lv-export" class="lv-btn lv-export"><i class="fas fa-download"></i> Export frame as PNG</button>
  </div>
</div>

<!-- Info panel -->
<div id="lv-info" class="lv-info" style="display:none">
  <div class="lv-info-title">Animation Info</div>
  <div id="lv-info-grid" class="lv-info-grid"></div>
</div>

</div>

<script src="/assets/tools/lottie-viewer/app.js?v=202609221" defer></script>
