---
layout: page
title: Lottie 动画预览器
icon: fas fa-film
tool_css: /assets/tools/lottie-viewer/app.css?v=202609221
---

<div id="lv-app">

<div class="lv-hint" markdown="block">
纯前端预览 Lottie / dotLottie 动画文件。文件**不会上传**到服务器，所有解析与渲染均在浏览器本地完成。
</div>

<!-- 上传区域 -->
<div id="lv-upload" class="lv-upload">
  <i class="fas fa-cloud-arrow-up"></i>
  <div class="lv-upload-text">点击或拖拽 Lottie 文件到此处</div>
  <div class="lv-upload-hint">支持 .json、.lottie 格式，文件不会上传到服务器</div>
  <input type="file" id="lv-file-input" accept=".json,.lottie" style="display:none">
</div>

<!-- 状态提示 -->
<div id="lv-status" class="lv-status"></div>

<!-- 预览区 -->
<div id="lv-preview-wrap" class="lv-preview-wrap">
  <div id="lv-canvas" class="lv-canvas">
    <span id="lv-empty" class="lv-empty">等待加载动画…</span>
  </div>
  <div id="lv-controls" class="lv-controls" style="display:none">
    <button id="lv-play" class="lv-btn"><i class="fas fa-play"></i> 播放</button>
    <button id="lv-stop" class="lv-btn"><i class="fas fa-stop"></i> 停止</button>
    <button id="lv-loop" class="lv-btn"><i class="fas fa-repeat"></i> 循环</button>
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
      <span class="lv-bg-label">背景</span>
      <div class="lv-bg-dot lv-active" data-bg="transparent" style="background:transparent;border-color:var(--lv-border-strong)" title="透明"></div>
      <div class="lv-bg-dot" data-bg="white" style="background:#fff" title="白色"></div>
      <div class="lv-bg-dot" data-bg="black" style="background:#000" title="黑色"></div>
      <div class="lv-bg-dot" data-bg="gray" style="background:#808080" title="灰色"></div>
    </div>
    <button id="lv-export" class="lv-btn lv-export"><i class="fas fa-download"></i> 导出当前帧 PNG</button>
  </div>
</div>

<!-- 信息面板 -->
<div id="lv-info" class="lv-info" style="display:none">
  <div class="lv-info-title">动画信息</div>
  <div id="lv-info-grid" class="lv-info-grid"></div>
</div>

</div>

<script src="/assets/tools/lottie-viewer/app.js?v=202609221" defer></script>
