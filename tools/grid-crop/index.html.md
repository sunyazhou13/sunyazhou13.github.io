---
layout: page
title: 九宫格切图
icon: fas fa-th-large
tool_css: /assets/tools/grid-crop/app.css?v=202609221
---

<p class="hint">上传图片一键切成 3×3 共 9 张，支持「主体锚点保护」自动调整切割网格，避免人物或主体被拦腰切断；可平移微调网格、预览 9 格效果后打包下载全部小图，全部在浏览器本地完成，图片不会上传。</p>

<div id="gc-app">

  <div class="gc-drop" id="gc-drop" tabindex="0" role="button" aria-label="选择或拖入图片">
    <input type="file" id="gc-input" accept="image/*" hidden>
    <i class="far fa-image"></i>
    <p class="gc-drop-title">拖入图片或点击选择</p>
    <p class="gc-drop-sub">PNG · JPEG · WebP · GIF 等浏览器可显示的图片</p>
  </div>

  <div class="gc-panel" id="gc-panel" hidden>
    <div class="gc-canvas-wrap">
      <canvas id="gc-canvas"></canvas>
      <span class="gc-canvas-tag" id="gc-mode-tag">全图等分</span>
    </div>

    <div class="gc-options">
      <label class="gc-check">
        <input type="checkbox" id="gc-anchor">
        <span>主体锚点保护（自动把切割中心对准主体 / 人脸）</span>
      </label>
      <label class="gc-slider">网格横向微调（像素）
        <input type="range" id="gc-offset-x" min="-500" max="500" step="1" value="0">
        <output id="gc-offset-x-val">0</output>
      </label>
      <label class="gc-slider">网格纵向微调（像素）
        <input type="range" id="gc-offset-y" min="-500" max="500" step="1" value="0">
        <output id="gc-offset-y-val">0</output>
      </label>
      <div class="gc-actions">
        <button type="button" class="gc-btn" id="gc-reset">重置网格</button>
        <button type="button" class="gc-btn gc-btn-primary" id="gc-preview">预览 9 格</button>
        <button type="button" class="gc-btn" id="gc-download" disabled>打包下载 9 张</button>
      </div>
    </div>

    <p class="gc-note" id="gc-note"></p>

    <div class="gc-grid" id="gc-grid" hidden></div>
  </div>

</div>

<script src="/assets/tools/grid-crop/app.js?v=202609221" defer></script>
