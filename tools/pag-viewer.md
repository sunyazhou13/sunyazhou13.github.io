---
layout: page
title: PAG 动画预览器
icon: fas fa-video
tool_css: /assets/tools/pag-viewer/app.css?v=202609221
---

<div id="pv-app">

<div class="pv-hint" markdown="block">
纯前端预览 PAG 动画文件。文件**不会上传**到服务器，所有解析与渲染均在浏览器本地完成。基于腾讯 libpag 引擎。
</div>

<!-- 上传区域 -->
<div id="pv-upload" class="pv-upload">
  <i class="fas fa-cloud-arrow-up"></i>
  <div class="pv-upload-text">点击或拖拽 PAG 文件到此处</div>
  <div class="pv-upload-hint">支持 .pag 格式，文件不会上传到服务器</div>
  <input type="file" id="pv-file-input" accept=".pag" style="display:none">
</div>

<!-- 状态提示 -->
<div id="pv-status" class="pv-status"></div>

<!-- 预览区 -->
<div id="pv-preview-wrap" class="pv-preview-wrap">
  <div id="pv-canvas" class="pv-canvas">
    <canvas id="pv-canvas-el"></canvas>
    <span id="pv-empty" class="pv-empty">等待加载动画…</span>
  </div>
  <div id="pv-loading" class="pv-loading" style="display:none">
    <i class="fas fa-circle-notch fa-spin"></i> 正在加载…
  </div>
  <div id="pv-controls" class="pv-controls" style="display:none">
    <button id="pv-play" class="pv-btn"><i class="fas fa-play"></i> 播放</button>
    <button id="pv-stop" class="pv-btn"><i class="fas fa-stop"></i> 停止</button>
    <button id="pv-loop" class="pv-btn"><i class="fas fa-repeat"></i> 循环</button>
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
      <span class="pv-bg-label">背景</span>
      <div class="pv-bg-dot pv-active" data-bg="transparent" style="background:transparent;border-color:var(--pv-border-strong)" title="透明"></div>
      <div class="pv-bg-dot" data-bg="white" style="background:#fff" title="白色"></div>
      <div class="pv-bg-dot" data-bg="black" style="background:#000" title="黑色"></div>
      <div class="pv-bg-dot" data-bg="gray" style="background:#808080" title="灰色"></div>
    </div>
    <button id="pv-export" class="pv-btn pv-export"><i class="fas fa-download"></i> 导出当前帧 PNG</button>
  </div>
</div>

<!-- 信息面板 -->
<div id="pv-info" class="pv-info" style="display:none">
  <div class="pv-info-title">动画信息</div>
  <div id="pv-info-grid" class="pv-info-grid"></div>
</div>

<!-- 图层结构面板 -->
<div id="pv-layers" class="pv-layers" style="display:none">
  <div class="pv-layers-header">
    <span class="pv-layers-title">图层结构</span>
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
