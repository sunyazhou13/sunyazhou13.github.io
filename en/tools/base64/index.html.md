---
layout: page
title: Base64 Encode / Decode
icon: fas fa-code
lang: en
permalink: /tools/base64/
tool_css: /assets/tools/base64/app.css?v=202609221
---

Enter any text for **Base64 encoding / decoding**. Everything runs locally in your browser — **your input is never uploaded to any server**.

Notes:

- Click to run: after typing your input, click "Encode" or "Decode" — only the action you click is executed and shown
- Encode: converts UTF-8 text into a Base64 string (RFC 4648 standard)
- Decode: converts Base64 back to UTF-8 text, automatically ignoring line breaks and whitespace in the input
- **URL safe**: when checked, uses the Base64URL variant (`-` `_` instead of `+` `/`, `=` omitted), suitable for URLs and file names; decoding also expects this format
- When decoding fails (illegal characters, wrong length, non-UTF-8 content), the exact reason is shown
- Results can be copied with one click

<div id="b64-app">

  <div class="b64-banner">
    <span class="b64-hint">Encode and decode entirely in your browser — nothing is uploaded</span>
  </div>

  <div class="b64-input-wrap">
    <label class="b64-label" for="b64-input">Input</label>
    <textarea id="b64-input" class="b64-input" rows="4" spellcheck="false" autocomplete="off" placeholder="Enter text to encode or decode…"></textarea>
  </div>

  <div class="b64-options">
    <label class="b64-urlsafe">
      <input type="checkbox" id="b64-urlsafe">
      <span>URL safe (Base64URL: uses <code>-</code> <code>_</code> and omits <code>=</code>)</span>
    </label>
  </div>

  <div class="b64-actions" id="b64-actions" role="group" aria-label="Encode or decode">
    <button type="button" class="b64-btn b64-btn-primary" id="b64-encode">Encode</button>
    <button type="button" class="b64-btn b64-btn-primary" id="b64-decode">Decode</button>
  </div>

  <div class="b64-results" id="b64-results">
    <div class="b64-placeholder" id="b64-placeholder">Enter something, then click "Encode" or "Decode" to see the result</div>

    <div class="b64-output" id="b64-output" hidden>
      <label class="b64-label" for="b64-result">Result</label>
      <textarea id="b64-result" class="b64-input b64-result" rows="4" readonly spellcheck="false"></textarea>
      <div class="b64-meta-row">
        <span class="b64-meta" id="b64-meta"></span>
        <button type="button" class="b64-btn b64-btn-copy" id="b64-copy">Copy result</button>
      </div>
    </div>

    <div class="b64-error" id="b64-error" hidden></div>
  </div>

</div>

<script type="module" src="/assets/tools/base64/app.js?v=202609221"></script>
