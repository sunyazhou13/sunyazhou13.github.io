---
layout: page
title: URL Encoder / Decoder
icon: fas fa-link
lang: en
permalink: /tools/url-encode/
tool_css: /assets/tools/url-encode/app.css?v=202609221
---
Convert text to and from percent encoding (URL encoding, `%20`, `%2F`, etc.) in both directions. Supports two modes — `encodeURIComponent` and `encodeURI` — with one-click swap between the two and one-click copy. Everything runs locally in your browser — your content is never uploaded.

<div id="ue-app">

  <div class="ue-mode-bar">
    <label class="ue-mode">
      <input type="radio" name="ue-mode" id="ue-comp" checked>
      <span>encodeURIComponent (encodes all reserved characters, for parameter values)</span>
    </label>
    <label class="ue-mode">
      <input type="radio" name="ue-mode" id="ue-uri">
      <span>encodeURI (keeps URL structure characters, for whole URLs)</span>
    </label>
  </div>

  <div class="ue-field">
    <span class="ue-field-tag" id="ue-src-tag">Input</span>
    <textarea id="ue-src" spellcheck="false" rows="5" placeholder="Type the text to encode or decode here…"></textarea>
  </div>

  <div class="ue-actions">
    <button type="button" class="ue-btn" id="ue-encode">Encode ▾ (→ %20)</button>
    <button type="button" class="ue-btn" id="ue-decode">Decode ▴ (← %20)</button>
    <button type="button" class="ue-btn" id="ue-swap">⇄ Swap (each click switches once)</button>
    <button type="button" class="ue-btn" id="ue-copy">Copy result</button>
    <button type="button" class="ue-btn" id="ue-clear">Clear</button>
  </div>

  <div class="ue-field">
    <span class="ue-field-tag" id="ue-dst-tag">Result</span>
    <textarea id="ue-dst" spellcheck="false" rows="5" readonly placeholder="Result…"></textarea>
  </div>

  <p class="ue-status" id="ue-status" role="status"></p>

</div>

<script src="/assets/tools/url-encode/app.js?v=202609221" defer></script>
