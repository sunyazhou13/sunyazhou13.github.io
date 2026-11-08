---
layout: page
title: Image Metadata Viewer
icon: fas fa-info-circle
lang: en
permalink: /tools/imginfo/
tool_css: /assets/tools/imginfo/app.css
---

<p class="hint">Drop an image to parse full technical metadata locally — format, dimensions, bit depth, color type, alpha channel, animation, plus EXIF camera info and ICC color profile. Supports PNG / JPEG / GIF / WebP / AVIF / HEIC / TIFF / BMP and more, with a grouped table and JSON view, one-click copy. Everything runs in your browser, nothing is uploaded.</p>

<div id="ii-app">

  <div class="ii-drop" id="ii-drop" tabindex="0" role="button" aria-label="Select or drop an image file">
    <input type="file" id="ii-file" accept="image/*,.avif,.heic,.heif,.webp,.tif,.tiff,.bmp,.ico" hidden>
    <i class="fas fa-image"></i>
    <p class="ii-drop-title" id="ii-drop-title">Drop or click to select an image</p>
    <p class="ii-drop-sub" id="ii-drop-sub"></p>
  </div>

  <div class="ii-status" id="ii-status" role="status" hidden></div>

  <div class="ii-filebar" id="ii-filebar" hidden>
    <span class="ii-fname" id="ii-fname"></span>
    <span class="ii-fsize" id="ii-fsize"></span>
    <span class="ii-spacer"></span>
    <button type="button" class="ii-btn" id="ii-copy">Copy view</button>
    <button type="button" class="ii-btn" id="ii-reset">Choose another</button>
  </div>

  <div class="ii-thumb" id="ii-thumb" hidden>
    <img id="ii-thumb-img" alt="Preview" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
    <span class="ii-thumb-note" id="ii-thumb-note"></span>
  </div>

  <div class="ii-summary" id="ii-summary" hidden></div>

  <div class="ii-tabs" id="ii-tabs" hidden>
    <button type="button" class="ii-tab is-active" data-view="tree">Tree</button>
    <button type="button" class="ii-tab" data-view="json">JSON</button>
  </div>

  <div id="ii-view-tree"></div>
  <pre class="ii-raw" id="ii-view-json" hidden></pre>

  <div class="ii-edu">
    <h2>Supported formats and how to read them</h2>

    <h3>1. Formats supported by this tool</h3>
    <table class="ii-ref-table">
      <thead><tr><th>Format</th><th>Container / Codec</th><th>Alpha</th><th>Animation</th><th>Metadata</th></tr></thead>
      <tbody>
        <tr><td>PNG</td><td>Lossless bitmap (zlib/deflate)</td><td>Yes (RGBA)</td><td>Yes (APNG, acTL)</td><td>iTXt / tEXt / embedded ICC</td></tr>
        <tr><td>JPEG</td><td>Lossy (DCT), JFIF / EXIF</td><td>No</td><td>No</td><td>EXIF / ICC / XMP</td></tr>
        <tr><td>GIF</td><td>Palette bitmap (LZW)</td><td>1-bit (single color)</td><td>Yes (multi-frame)</td><td>Basic only, no EXIF</td></tr>
        <tr><td>WebP</td><td>VP8 / VP8L / VP8X</td><td>Yes (alpha on both)</td><td>Yes (ANMF)</td><td>EXIF / ICC / XMP</td></tr>
        <tr><td>AVIF</td><td>AV1 frame (ISOBMFF)</td><td>Yes (auxC alpha)</td><td>Yes (multi trak)</td><td>EXIF / ICC (meta boxes)</td></tr>
        <tr><td>HEIC / HEIF</td><td>HEVC frame (ISOBMFF)</td><td>Yes (auxC alpha)</td><td>Yes (multi trak)</td><td>EXIF / ICC (meta boxes)</td></tr>
        <tr><td>TIFF</td><td>Tagged bitmap (IFD)</td><td>Yes (ExtraSamples)</td><td>No</td><td>Native IFD / EXIF / ICC</td></tr>
        <tr><td>BMP</td><td>Device-independent bitmap</td><td>Yes (32-bit BGRA)</td><td>No</td><td>Essentially none</td></tr>
      </tbody>
    </table>
    <div class="ii-note">This tool reads raw bytes: format by magic number, dimensions from each format's header (PNG IHDR, GIF header, JPEG SOF, BMP header, TIFF/EXIF IFD, HEIC/AVIF <code>ispe</code> box). So even when the browser can't decode the pixels (e.g. HEIC), the full metadata is still extracted.</div>

    <h3>2. How to read an image report</h3>
    <ol>
      <li><b>Format + MIME</b> — confirm the actual format, not the extension (a .png that is really JPEG)</li>
      <li><b>Dimensions (W × H) + aspect ratio</b> — resolution and whether the original was cropped</li>
      <li><b>Bit depth + color type</b> — 8 bit vs 10/12 bit; RGB / YCbCr / grayscale / indexed, which drive gamut and file size</li>
      <li><b>Alpha channel</b> — PNG / WebP / HEIC / AVIF may carry alpha; verify before compositing</li>
      <li><b>Animation</b> — GIF / animated WebP / animated AVIF / APNG report frame counts</li>
      <li><b>EXIF</b> — camera make, model, capture time, ISO, exposure, aperture, focal length, GPS (from EXIF-bearing JPEG / PNG / WebP / TIFF / HEIC / HEIF / AVIF)</li>
      <li><b>ICC color profile</b> — sRGB / Display P3 / Adobe RGB, key to consistent cross-device display</li>
    </ol>

    <div class="ii-note">
      <b>Notes / range column:</b> each EXIF field shows its typical value range and whether the current value looks reasonable (e.g. ISO typically 50–409600, aperture typically f/1.0–f/32); values clearly outside the usual range are flagged with <code>⚠</code>. The <b>GPS row also reverse-geocodes the WGS-84 coordinates into a Chinese address</b> via a domestic map API (Tencent or Amap — set a key in <code>GEO_KEYS</code> inside <code>assets/tools/imginfo/app.js</code>; shows N/A when not configured or on failure). Note: the lookup runs in your browser, so the coordinates are sent to the chosen map provider (all other parsing stays fully local and is never uploaded).
    </div>

    <div class="ii-note">
      <b>Three common pitfalls:</b>
      ① The file extension is not trustworthy — some files are mislabeled; this tool judges by magic number.
      ② HEIC can't be decoded to pixels by most browsers, yet this tool still reads dimensions, color and EXIF.
      ③ Screenshots / web images are often re-encoded to 8-bit sRGB, dropping the original 10-bit / P3 info — the parameters reveal this immediately.
    </div>
  </div>

</div>

<script>/* key 集中配置在 _config.yml 的 api_keys.geocode，构建时注入到此（须单行，compress_html 会合并换行） */ window.II_GEO_KEYS = { tencent: '{{ site.api_keys.geocode.tencent }}', amap: '{{ site.api_keys.geocode.amap }}' };</script>
<script type="module" src="/assets/tools/imginfo/app.js?v=20260916b"></script>
