---
layout: page
title: 图片格式转换
icon: fas fa-exchange-alt
tool_css: /assets/tools/webp-heic/app.css?v=202609221
---

PNG、JPEG、WebP、GIF、BMP、SVG、AVIF、**HEIC** 等格式互相转换，所有处理在浏览器本地完成，**图片不会上传到任何服务器**。

几点说明：

- 支持批量拖入多张图片，也可以直接拖入整个文件夹
- 同一批里文件重名会自动加 `-1`、`-2` 序号后缀
- 输出格式可选 **WebP / JPEG / PNG**，浏览器原生编码
- 已是目标格式的文件会自动跳过，避免二次有损压缩
- HEIC 文件需要额外的解码库（约 1.4 MB，仅首次使用 HEIC 时加载一次）
- WebP 编码依赖浏览器原生支持（Chrome / Edge / Opera），Safari 和 Firefox 暂不支持 WebP 编码
- 质量滑杆数值越高画质越好、体积越大，一般 70–85 就够日常使用

<div id="wic-app">

  <div class="wic-banner">
    <span class="wic-badge" id="wic-engine-badge">正在检测编码能力…</span>
    <span class="wic-hint">所有转换都在本机浏览器完成，图片不会上传</span>
  </div>

  <div class="wic-drop" id="wic-drop" tabindex="0" role="button" aria-label="选择或拖入图片">
    <input type="file" id="wic-input" multiple hidden accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml,image/avif,image/heic,image/heif,.heic,.heif">
    <i class="far fa-images"></i>
    <p class="wic-drop-title">拖入图片或文件夹，或点击选择文件</p>
    <p class="wic-drop-sub">支持 PNG · JPEG · WebP · GIF · BMP · SVG · AVIF · HEIC，可多选</p>
  </div>

  <div class="wic-options">
    <label>输出格式
      <select id="wic-format">
        <option value="webp" selected>WebP</option>
        <option value="jpeg">JPEG</option>
        <option value="png">PNG</option>
      </select>
    </label>
    <label>质量 <output id="wic-q-val">80</output>
      <input type="range" id="wic-quality" min="10" max="100" step="1" value="80">
    </label>
    <label>限制最大宽度
      <select id="wic-maxw">
        <option value="0" selected>不限</option>
        <option value="2560">2560px</option>
        <option value="1920">1920px</option>
        <option value="1280">1280px</option>
        <option value="960">960px</option>
      </select>
    </label>
    <div class="wic-actions">
      <button type="button" class="wic-btn wic-btn-primary" id="wic-convert" disabled>开始转换</button>
      <button type="button" class="wic-btn" id="wic-zip" disabled>打包下载 ZIP</button>
      <button type="button" class="wic-btn" id="wic-clear" disabled>清空</button>
    </div>
  </div>

  <div class="wic-summary" id="wic-summary" hidden></div>

  <ul class="wic-list" id="wic-list"></ul>

</div>

<script type="module" src="/assets/tools/webp-heic/app.js?v=202609221"></script>
