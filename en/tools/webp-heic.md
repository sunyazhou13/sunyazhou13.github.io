---
layout: page
title: Image Format Converter
icon: fas fa-exchange-alt
lang: en
permalink: /tools/webp-heic/
tool_css: /assets/tools/webp-heic/app.css?v=202609221
---

Convert between PNG, JPEG, WebP, GIF, BMP, SVG, AVIF, **HEIC** and more. Everything runs locally in your browser — **your images are never uploaded to any server**.

Notes:

- Batch support: drop multiple images at once, or even an entire folder
- Duplicate filenames in one batch automatically get `-1`, `-2` suffixes
- Output formats: **WebP / JPEG / PNG**, encoded natively by the browser
- Files already in the target format are skipped to avoid a second lossy round
- HEIC files need an extra decoder library (about 1.4 MB, loaded once the first time a HEIC file appears)
- WebP encoding relies on native browser support (Chrome / Edge / Opera); Safari and Firefox cannot encode WebP yet
- Higher quality slider values mean better image quality and larger files; 70–85 is usually plenty for everyday use

<div id="wic-app">

  <div class="wic-banner">
    <span class="wic-badge" id="wic-engine-badge">Detecting encoder capabilities…</span>
    <span class="wic-hint">All conversion happens in your browser — images are never uploaded</span>
  </div>

  <div class="wic-drop" id="wic-drop" tabindex="0" role="button" aria-label="Choose or drop images">
    <input type="file" id="wic-input" multiple hidden accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml,image/avif,image/heic,image/heif,.heic,.heif">
    <i class="far fa-images"></i>
    <p class="wic-drop-title">Drop images or a folder here, or click to choose files</p>
    <p class="wic-drop-sub">Supports PNG · JPEG · WebP · GIF · BMP · SVG · AVIF · HEIC, multiple selection allowed</p>
  </div>

  <div class="wic-options">
    <label>Output format
      <select id="wic-format">
        <option value="webp" selected>WebP</option>
        <option value="jpeg">JPEG</option>
        <option value="png">PNG</option>
      </select>
    </label>
    <label>Quality <output id="wic-q-val">80</output>
      <input type="range" id="wic-quality" min="10" max="100" step="1" value="80">
    </label>
    <label>Max width limit
      <select id="wic-maxw">
        <option value="0" selected>Unlimited</option>
        <option value="2560">2560px</option>
        <option value="1920">1920px</option>
        <option value="1280">1280px</option>
        <option value="960">960px</option>
      </select>
    </label>
    <div class="wic-actions">
      <button type="button" class="wic-btn wic-btn-primary" id="wic-convert" disabled>Convert</button>
      <button type="button" class="wic-btn" id="wic-zip" disabled>Download ZIP</button>
      <button type="button" class="wic-btn" id="wic-clear" disabled>Clear</button>
    </div>
  </div>

  <div class="wic-summary" id="wic-summary" hidden></div>

  <ul class="wic-list" id="wic-list"></ul>

</div>

<script type="module" src="/assets/tools/webp-heic/app.js?v=202609221"></script>
