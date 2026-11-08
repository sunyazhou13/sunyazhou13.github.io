---
layout: page
title: QR Code
icon: fas fa-qrcode
lang: en
permalink: /tools/qrcode/
tool_css: /assets/tools/qrcode/app.css?v=202609221
---

Generate QR codes from text and parse text back from QR images — both directions. Everything runs locally in your browser — **your images and text are never uploaded to any server**.

Notes:

- Generate: enter any text and click "Generate"; a higher error-correction level makes the code more tolerant to dirt and occlusion (at the cost of capacity)
- After generating, you can "Download PNG" directly; the code's version and module size are shown alongside
- Parse: choose or drop a QR code image (PNG / JPEG / WebP / GIF etc.) and the embedded text or link is recognized automatically
- Parse results can be copied with one click
- Pasted QR images that are crisp bitmaps give the best recognition rate

<div id="qrcode-app">

  <div class="qr-banner">
    <span class="qr-hint">Generate from text / parse from image, both ways — local only, nothing uploaded</span>
  </div>

  <section class="qr-panel">
    <h2 class="qr-title">Generate QR Code</h2>

    <div class="qr-field">
      <label class="qr-label" for="qr-text">Text</label>
      <textarea id="qr-text" class="qr-input" rows="4" spellcheck="false" autocomplete="off" placeholder="Enter text or a link, e.g. https://www.sunyazhou.com …"></textarea>
    </div>

    <div class="qr-opt-row">
      <label class="qr-label" for="qr-ecl">Error correction</label>
      <select id="qr-ecl" class="qr-select">
        <option value="L">L (low 7%)</option>
        <option value="M" selected>M (medium 15%)</option>
        <option value="Q">Q (quartile 25%)</option>
        <option value="H">H (highest 30%)</option>
      </select>
      <button type="button" class="qr-btn qr-btn-primary" id="qr-generate">Generate QR Code</button>
      <button type="button" class="qr-btn" id="qr-download" disabled>Download PNG</button>
    </div>

    <div class="qr-preview">
      <div class="qr-placeholder" id="qr-placeholder">Enter content above, then click "Generate QR Code"</div>
      <canvas id="qr-canvas" hidden></canvas>
      <div class="qr-meta" id="qr-meta"></div>
    </div>
  </section>

  <section class="qr-panel">
    <h2 class="qr-title">Parse QR Code</h2>

    <div class="qr-drop" id="qr-drop">
      <input type="file" id="qr-file" accept="image/*" hidden>
      <button type="button" class="qr-btn qr-btn-primary" id="qr-choose">Choose image</button>
      <span class="qr-hint">or drop a QR code image here</span>
    </div>

    <div class="qr-decode-result" id="qr-decode-result" hidden>
      <img id="qr-dec-img" alt="Uploaded QR code image" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
      <div class="qr-field">
        <label class="qr-label" for="qr-dec-text">Parsed result</label>
        <textarea id="qr-dec-text" class="qr-input qr-result" rows="3" readonly spellcheck="false"></textarea>
        <div class="qr-meta-row">
          <span class="qr-meta" id="qr-dec-meta"></span>
          <button type="button" class="qr-btn qr-btn-copy" id="qr-dec-copy">Copy result</button>
        </div>
      </div>
    </div>
  </section>

  <div class="qr-error" id="qr-error" hidden></div>

</div>

<script src="/assets/tools/qrcode/lib/qrcode.js?v=202609221"></script>
<script src="/assets/tools/qrcode/lib/jsQR.js?v=202609221"></script>
<script type="module" src="/assets/tools/qrcode/app.js?v=202609221"></script>
