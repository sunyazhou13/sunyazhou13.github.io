---
layout: page
title: Image to AVIF
icon: fas fa-image
lang: en
permalink: /tools/image-to-avif/
tool_css: /assets/tools/avif/app.css?v=202609221
---

Batch-convert PNG, JPEG, WebP, GIF, BMP and SVG to AVIF. **Animated images (GIF / animated WebP) are transcoded frame by frame and keep their animation**. All conversion runs locally in your browser — **your images are never uploaded to any server**.

**Encoding engine**: decoding uses the browser's native pipeline (createImageBitmap, hardware-accelerated where available); encoding uses WASM libaom (the jsquash port from Squoosh). On startup the tool live-probes whether the browser supports native AVIF encoding (`canvas.toBlob('image/avif')`) — as of 2026 no major browser, Chrome included, has shipped this capability, but the probe is kept so the tool upgrades seamlessly the day browsers support it. First use downloads an encoder of roughly 3.5 MB.

Notes:

- Batch support: drop multiple images at once, or even an entire folder
- Duplicate filenames in one batch (e.g. two `photo.png` from different folders) automatically get `-1`, `-2` suffixes
- Animated images (GIF / animated WebP) are transcoded frame by frame into animated AVIF by default; the card shows frame count and progress. If you don't need animation, uncheck "Keep animation" to take only the first frame
- The quality floor for animated transcoding is **80** (a higher slider value wins) — artifacts from low-quality per-frame compression get amplified during playback; the card shows the quality value actually used
- Files that are already AVIF are skipped to avoid a second lossy round
- Higher quality slider values mean better image quality and larger files; 50–70 is usually plenty for blog images
- WASM encoding being slow is normal (AVIF encoding is inherently heavy); for large batches, process in chunks. All browsers use this WASM path today
- Animated transcoding time scales linearly with frame count (each frame is a full AVIF encode); a GIF with a few dozen frames taking a minute or two is normal. Per-image limits: 500 frames max, raw frame data up to about 400 MB

<div id="avt-app">

  <div class="avt-banner">
    <span class="avt-badge" id="avt-engine-badge">Detecting encoder…</span>
    <span class="avt-hint">All conversion happens in your browser — images are never uploaded</span>
  </div>

  <div class="avt-drop" id="avt-drop" tabindex="0" role="button" aria-label="Choose or drop images">
    <input type="file" id="avt-input" multiple hidden accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml,image/avif">
    <i class="far fa-images"></i>
    <p class="avt-drop-title">Drop images or a folder here, or click to choose files</p>
    <p class="avt-drop-sub">Supports PNG · JPEG · WebP · GIF · BMP · SVG · AVIF, multiple selection allowed</p>
  </div>

  <div class="avt-options">
    <label>Quality <output id="avt-q-val">60</output>
      <input type="range" id="avt-quality" min="10" max="100" step="1" value="60">
    </label>
    <label>Encoder
      <select id="avt-engine">
        <option value="auto" selected>Auto (native first)</option>
        <option value="native">Native Canvas only</option>
        <option value="wasm">WASM only</option>
      </select>
    </label>
    <label>Compression speed
      <select id="avt-speed">
        <option value="9">Fast</option>
        <option value="8" selected>Balanced</option>
        <option value="6">Max compression</option>
      </select>
    </label>
    <label>Max width limit
      <select id="avt-maxw">
        <option value="0" selected>Unlimited</option>
        <option value="2560">2560px</option>
        <option value="1920">1920px</option>
        <option value="1280">1280px</option>
        <option value="960">960px</option>
      </select>
    </label>
    <label class="avt-check">Keep animation (GIF / animated WebP)
      <input type="checkbox" id="avt-keepanim" checked>
    </label>
    <div class="avt-actions">
      <button type="button" class="avt-btn avt-btn-primary" id="avt-convert" disabled>Convert</button>
      <button type="button" class="avt-btn" id="avt-zip" disabled>Download ZIP</button>
      <button type="button" class="avt-btn" id="avt-clear" disabled>Clear</button>
    </div>
  </div>

  <div class="avt-summary" id="avt-summary" hidden></div>

  <ul class="avt-list" id="avt-list"></ul>

</div>

<script type="module" src="/assets/tools/avif/app.js?v=202609221"></script>
