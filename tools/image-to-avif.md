---
layout: page
title: 图片转 AVIF
icon: fas fa-image
tool_css: /assets/tools/avif/app.css?v=202609221
---

把 PNG、JPEG、WebP、GIF、BMP、SVG 批量转成 AVIF，**动图（GIF / 动画 WebP）会逐帧转码保留动画**。所有转换都在你的浏览器里本地完成，**图片不会上传到任何服务器**。

**编码引擎**：解码走浏览器原生管线（createImageBitmap，可享硬件加速），编码使用 WASM libaom（来自 Squoosh 的 jsquash 移植）。工具启动时会实时探测浏览器是否支持原生 AVIF 编码（`canvas.toBlob('image/avif')`）——截至 2026 年，包括 Chrome 在内的所有主流浏览器都还没开放这个能力，探测逻辑保留是为了浏览器将来支持时自动无缝升级。首次使用需要下载约 3.5 MB 的编码器。

几点说明：

- 支持批量：可以一次拖入多张图片，甚至直接拖入整个文件夹
- 同一批里文件重名（比如两个不同目录的 `photo.png`）会自动加 `-1`、`-2` 序号后缀
- 动图（GIF / 动画 WebP）默认逐帧转码保留为动画 AVIF，卡片上会显示帧数与进度；不需要动画时可以取消勾选「保留动画」，只取第一帧
- 动图转码的质量下限为 **80**（高于滑杆时以滑杆为准）——低质量逐帧压缩的瑕疵在动画播放中会被放大，卡片上会标注实际使用的质量值
- 已经是 AVIF 的文件会直接跳过，避免二次有损压缩
- 质量滑杆数值越高画质越好、体积越大，一般 50–70 就够博客配图用
- WASM 编码较慢属于正常现象（AVIF 编码本身就重），大批量建议分批处理；当前所有浏览器走的都是这条 WASM 路径
- 动图逐帧转码的耗时和帧数成正比（每帧都是一次完整的 AVIF 编码），几十帧的 GIF 等一两分钟属于正常；单个动图上限 500 帧、原始帧数据上限约 400 MB

<div id="avt-app">

  <div class="avt-banner">
    <span class="avt-badge" id="avt-engine-badge">正在检测编码引擎…</span>
    <span class="avt-hint">所有转换都在本机浏览器完成，图片不会上传</span>
  </div>

  <div class="avt-drop" id="avt-drop" tabindex="0" role="button" aria-label="选择或拖入图片">
    <input type="file" id="avt-input" multiple hidden accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml,image/avif">
    <i class="far fa-images"></i>
    <p class="avt-drop-title">拖入图片或文件夹，或点击选择文件</p>
    <p class="avt-drop-sub">支持 PNG · JPEG · WebP · GIF · BMP · SVG · AVIF，可多选</p>
  </div>

  <div class="avt-options">
    <label>质量 <output id="avt-q-val">60</output>
      <input type="range" id="avt-quality" min="10" max="100" step="1" value="60">
    </label>
    <label>编码引擎
      <select id="avt-engine">
        <option value="auto" selected>自动（优先原生）</option>
        <option value="native">仅原生 Canvas</option>
        <option value="wasm">仅 WASM</option>
      </select>
    </label>
    <label>压缩速度
      <select id="avt-speed">
        <option value="9">快</option>
        <option value="8" selected>均衡</option>
        <option value="6">极致压缩</option>
      </select>
    </label>
    <label>限制最大宽度
      <select id="avt-maxw">
        <option value="0" selected>不限</option>
        <option value="2560">2560px</option>
        <option value="1920">1920px</option>
        <option value="1280">1280px</option>
        <option value="960">960px</option>
      </select>
    </label>
    <label class="avt-check">保留动画（GIF / 动图 WebP）
      <input type="checkbox" id="avt-keepanim" checked>
    </label>
    <div class="avt-actions">
      <button type="button" class="avt-btn avt-btn-primary" id="avt-convert" disabled>开始转换</button>
      <button type="button" class="avt-btn" id="avt-zip" disabled>打包下载 ZIP</button>
      <button type="button" class="avt-btn" id="avt-clear" disabled>清空</button>
    </div>
  </div>

  <div class="avt-summary" id="avt-summary" hidden></div>

  <ul class="avt-list" id="avt-list"></ul>

</div>

<script type="module" src="/assets/tools/avif/app.js?v=202609221"></script>
