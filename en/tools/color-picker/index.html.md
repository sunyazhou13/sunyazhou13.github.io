---
layout: page
title: Image Color Palette
icon: fas fa-palette
lang: en
permalink: /tools/color-picker/
tool_css: /assets/tools/color-picker/app.css?v=202609221
---

Upload an image to automatically analyze all pixels and extract dominant colors. Three classic color quantization algorithms are available, with adjustable color count and sampling precision. Results are sorted by proportion and shown as HEX + RGB values, with code snippets generated for Swift / Objective-C / Kotlin / Java / ArkTS / Flutter. Everything runs locally in your browser — **your image is never uploaded to any server**.

Notes:

- Upload: select or drag an image (PNG / JPEG / WebP / GIF / BMP, etc.), rendered on a local Canvas, auto-scaled to max 1200px for large images
- Extraction algorithms:
  - **K-Means clustering** (k-means++ init) — classic clustering, even color distribution
  - **Median Cut** (Heckbert 1982) — same family as Color Thief, fast
  - **Histogram** — 3D color histogram quantization + similar-color merging, great for discrete dominant colors
- Color count: 3 / 5 / 7 / 10 colors
- Sampling precision: controls pixel sampling step; larger steps are faster but slightly less precise
- Output: each color shows HEX string, RGB value, and percentage, all one-click copyable
- Code snippets: auto-generated Swift / Objective-C / Kotlin / Java / ArkTS / Flutter code, with switchable language tabs
- Algorithm source: complete implementations of all three algorithms in Swift / Objective-C / JavaScript, for learning and porting to your own projects

<div id="cp-app">

  <div class="cp-banner">
    <span class="cp-hint">Upload an image, choose an algorithm, extract dominant colors with multi-language code snippets — 100% local, nothing uploaded</span>
  </div>

  <div class="cp-drop" id="cp-drop">
    <input type="file" id="cp-file" accept="image/*" hidden>
    <button type="button" class="cp-btn cp-btn-primary" id="cp-choose">Select Image</button>
    <span class="cp-hint">or drag an image here</span>
  </div>

  <div class="cp-workarea" id="cp-workarea" hidden>

    <div class="cp-canvas-wrap">
      <canvas id="cp-canvas"></canvas>
      <span class="cp-img-info" id="cp-img-info"></span>
    </div>

    <div class="cp-side">

      <div class="cp-panel">
        <h2 class="cp-title">Extraction Settings</h2>
        <div class="cp-setting">
          <label class="cp-label" for="cp-algo">Algorithm</label>
          <select id="cp-algo" class="cp-select">
            <option value="kmeans" selected>K-Means Clustering</option>
            <option value="mediancut">Median Cut</option>
            <option value="histogram">Histogram</option>
          </select>
        </div>
        <div class="cp-setting">
          <label class="cp-label" for="cp-count">Color Count</label>
          <select id="cp-count" class="cp-select">
            <option value="3">3 colors</option>
            <option value="5" selected>5 colors</option>
            <option value="7">7 colors</option>
            <option value="10">10 colors</option>
          </select>
        </div>
        <div class="cp-setting">
          <label class="cp-label" for="cp-quality">Sampling Precision</label>
          <select id="cp-quality" class="cp-select">
            <option value="1">High (every pixel)</option>
            <option value="2" selected>Medium</option>
            <option value="3">Low</option>
            <option value="4">Very Low (fast)</option>
          </select>
        </div>
        <button type="button" class="cp-btn cp-btn-primary" id="cp-extract">Extract Colors</button>
      </div>

      <div class="cp-loading" id="cp-loading" hidden>Analyzing pixels…</div>

    </div>

    <div class="cp-panel cp-full" id="cp-palette-panel" hidden>
      <h2 class="cp-title">Extracted Palette</h2>
      <div class="cp-palette" id="cp-palette"></div>
    </div>

    <div class="cp-panel cp-full" id="cp-code-panel" hidden>
      <h2 class="cp-title">Code Snippets</h2>
      <div class="cp-tabs" id="cp-tabs">
        <button type="button" class="cp-tab cp-tab-active" data-lang="swift">Swift</button>
        <button type="button" class="cp-tab" data-lang="objc">Objective-C</button>
        <button type="button" class="cp-tab" data-lang="kotlin">Kotlin</button>
        <button type="button" class="cp-tab" data-lang="java">Java</button>
        <button type="button" class="cp-tab" data-lang="arkts">ArkTS</button>
        <button type="button" class="cp-tab" data-lang="dart">Flutter/Dart</button>
      </div>
      <pre class="cp-code-block"><code id="cp-code-output"></code></pre>
      <button type="button" class="cp-btn cp-btn-copy" id="cp-copy-code">Copy Code</button>
    </div>

  </div>

  <div class="cp-panel cp-full" id="cp-algo-src-panel">
    <h2 class="cp-title">Algorithm Source</h2>
    <p class="cp-hint">Complete implementations of all three color quantization algorithms in Swift / Objective-C / JavaScript, for learning and porting to your own projects.</p>
    <div class="cp-tabs" id="cp-algo-src-tabs">
      <button type="button" class="cp-tab cp-tab-active" data-algo-src="swift">Swift</button>
      <button type="button" class="cp-tab" data-algo-src="objc">Objective-C</button>
      <button type="button" class="cp-tab" data-algo-src="javascript">JavaScript</button>
    </div>
    <pre class="cp-code-block cp-code-block-tall"><code id="cp-algo-src-output"></code></pre>
    <button type="button" class="cp-btn cp-btn-copy" id="cp-copy-algo">Copy Source</button>
  </div>

  <div class="cp-error" id="cp-error" hidden></div>

</div>

<script type="module" src="/assets/tools/color-picker/app.js?v=202609221"></script>
