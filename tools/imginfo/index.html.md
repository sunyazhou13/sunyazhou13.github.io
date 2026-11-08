---
layout: page
title: 图片元数据查看器
icon: fas fa-info-circle
tool_css: /assets/tools/imginfo/app.css
---

<p class="hint">拖入一张图片，浏览器本地解析出完整技术参数：格式、尺寸、位深、色彩类型、透明通道、是否动画，以及 EXIF 相机信息与 ICC 色彩配置。支持 PNG / JPEG / GIF / WebP / AVIF / HEIC / TIFF / BMP 等主流与最新格式，分组表格与 JSON 双视图、一键复制。全部在本机完成，文件不会上传。</p>

<div id="ii-app">

  <div class="ii-drop" id="ii-drop" tabindex="0" role="button" aria-label="选择或拖入图片文件">
    <input type="file" id="ii-file" accept="image/*,.avif,.heic,.heif,.webp,.tif,.tiff,.bmp,.ico" hidden>
    <i class="fas fa-image"></i>
    <p class="ii-drop-title" id="ii-drop-title">拖入或点击选择图片文件</p>
    <p class="ii-drop-sub" id="ii-drop-sub"></p>
  </div>

  <div class="ii-status" id="ii-status" role="status" hidden></div>

  <div class="ii-filebar" id="ii-filebar" hidden>
    <span class="ii-fname" id="ii-fname"></span>
    <span class="ii-fsize" id="ii-fsize"></span>
    <span class="ii-spacer"></span>
    <button type="button" class="ii-btn" id="ii-copy">复制当前视图</button>
    <button type="button" class="ii-btn" id="ii-reset">重新选择</button>
  </div>

  <div class="ii-thumb" id="ii-thumb" hidden>
    <img id="ii-thumb-img" alt="缩略预览" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
    <span class="ii-thumb-note" id="ii-thumb-note"></span>
  </div>

  <div class="ii-summary" id="ii-summary" hidden></div>

  <div class="ii-tabs" id="ii-tabs" hidden>
    <button type="button" class="ii-tab is-active" data-view="tree">分组表格</button>
    <button type="button" class="ii-tab" data-view="json">JSON</button>
  </div>

  <div id="ii-view-tree"></div>
  <pre class="ii-raw" id="ii-view-json" hidden></pre>

  <div class="ii-edu">
    <h2>支持的格式与怎么读</h2>

    <h3>1. 本工具支持的格式</h3>
    <table class="ii-ref-table">
      <thead><tr><th>格式</th><th>容器 / 编码</th><th>透明</th><th>动画</th><th>元数据</th></tr></thead>
      <tbody>
        <tr><td>PNG</td><td>无损位图（zlib/deflate）</td><td>支持（RGBA）</td><td>支持（APNG，acTL）</td><td>内置 iTXt / tEXt / 可嵌 ICC</td></tr>
        <tr><td>JPEG</td><td>有损（DCT），JFIF / EXIF</td><td>不支持</td><td>不支持</td><td>EXIF / ICC / XMP</td></tr>
        <tr><td>GIF</td><td>调色板位图（LZW）</td><td>1 位（单色透明）</td><td>支持（多帧）</td><td>仅基础，无 EXIF</td></tr>
        <tr><td>WebP</td><td>VP8 / VP8L / VP8X</td><td>支持（无损 / 有损均带 alpha）</td><td>支持（ANMF）</td><td>EXIF / ICC / XMP</td></tr>
        <tr><td>AVIF</td><td>AV1 帧（ISOBMFF）</td><td>支持（auxC alpha）</td><td>支持（多 trak）</td><td>EXIF / ICC（meta 盒子）</td></tr>
        <tr><td>HEIC / HEIF</td><td>HEVC 帧（ISOBMFF）</td><td>支持（auxC alpha）</td><td>支持（多 trak）</td><td>EXIF / ICC（meta 盒子）</td></tr>
        <tr><td>TIFF</td><td>标签式位图（IFD）</td><td>支持（ExtraSamples）</td><td>不支持</td><td>原生 IFD / EXIF / ICC</td></tr>
        <tr><td>BMP</td><td>设备无关位图</td><td>支持（32 位 BGRA）</td><td>不支持</td><td>基本无</td></tr>
      </tbody>
    </table>
    <div class="ii-note">本工具直接读文件字节：格式靠魔数识别，尺寸靠各格式头部（PNG 的 IHDR、GIF 头、JPEG 的 SOF、BMP 头、TIFF/EXIF 的 IFD、HEIC/AVIF 的 <code>ispe</code> 盒子），因此即使浏览器无法解码像素（如 HEIC），也能读出完整元数据。</div>

    <h3>2. 怎么读一份图片参数</h3>
    <ol>
      <li><b>格式 + MIME</b> —— 确认是不是目标格式，有没有被错误命名（如 .png 实为 JPEG）</li>
      <li><b>尺寸（宽 × 高）+ 宽高比</b> —— 决定分辨率与原图是否裁切过</li>
      <li><b>位深 + 色彩类型</b> —— 8 bit 还是 10/12 bit；RGB / YCbCr / 灰度 / 索引色，决定色域与文件体积</li>
      <li><b>透明通道</b> —— PNG / WebP / HEIC / AVIF 可能带 alpha，嵌网页或合成前务必确认</li>
      <li><b>动画</b> —— GIF / 动态 WebP / 动态 AVIF / APNG 会标出帧数</li>
      <li><b>EXIF</b> —— 相机厂商、型号、拍摄时间、ISO、曝光、光圈、焦距、GPS 等（来自带 EXIF 的 JPEG / PNG / WebP / TIFF / HEIC / HEIF / AVIF）</li>
      <li><b>ICC 色彩配置</b> —— sRGB / Display P3 / Adobe RGB 等，跨设备显示一致性的关键</li>
    </ol>

    <div class="ii-note">
      <b>说明 / 合理范围列：</b>EXIF 每个字段右侧会标出该字段的常见取值范围与当前值是否合理（例如 ISO 常见 50–409600、光圈常见 f/1.0–f/32），明显偏离常见范围的值标 <code>⚠</code>。<b>GPS 一行还会把 WGS-84 坐标通过国内地图接口反查成中文地址</b>（腾讯 / 高德二选一，需在 <code>assets/tools/imginfo/app.js</code> 的 <code>GEO_KEYS</code> 中填入 key；未配置或查询失败时显示 N/A）。注意：反查在浏览器端发起，该坐标会发送给所选地图服务商（其余解析仍全程本地、不上传）。
    </div>

    <div class="ii-note">
      <b>三个常见坑：</b>
      ① 文件名后缀不可信——有些文件扩展名和实际编码不一致，本工具以魔数判定为准；
      ② HEIC 在多数浏览器里无法直接解码像素，但本工具仍能读出尺寸、色彩与 EXIF；
      ③ 截图 / 网络图常被重编码为 8 bit sRGB，原始相机的 10 bit / P3 信息会丢失，看参数能立刻发现。
    </div>
  </div>

</div>

<script>/* key 集中配置在 _config.yml 的 api_keys.geocode，构建时注入到此（须单行，compress_html 会合并换行） */ window.II_GEO_KEYS = { tencent: '{{ site.api_keys.geocode.tencent }}', amap: '{{ site.api_keys.geocode.amap }}' };</script>
<script type="module" src="/assets/tools/imginfo/app.js?v=20260916b"></script>
