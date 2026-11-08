---
layout: page
title: String Hash
icon: fas fa-hashtag
lang: en
permalink: /tools/hash-string/
tool_css: /assets/tools/hash-string/app.css?v=202609221
---

Enter any string and click the button below to generate **MD5 / SHA1 / SHA256 / SHA384 / SHA512** hashes. All computation happens locally in your browser — **your input is never uploaded to any server**.

Notes:

- Click to generate: click exactly the algorithm you want — only the result of the clicked algorithm is computed and shown
- **MD5** is a pure JS implementation; the SHA family uses the browser's WebCrypto (requires an HTTPS or localhost secure context)
- Everything is hashed as **UTF-8** and displayed in lowercase hex, with a one-click uppercase toggle
- Every result row can be copied with one click
- Bonus space detector: counts half-width / full-width spaces, their positions and runs, to help track down hash mismatches caused by invisible space differences

<div id="hsh-app">

  <div class="hsh-banner">
    <span class="hsh-badge" id="hsh-engine-badge">Detecting crypto capabilities…</span>
    <span class="hsh-hint">All computation happens in your browser — nothing is uploaded</span>
  </div>

  <div class="hsh-input-wrap">
    <label class="hsh-label" for="hsh-input">Input string</label>
    <textarea id="hsh-input" class="hsh-input" rows="4" spellcheck="false" autocomplete="off" placeholder="Enter any string here…"></textarea>
  </div>

  <div class="hsh-options">
    <label class="hsh-upper">
      <input type="checkbox" id="hsh-upper">
      <span>Uppercase</span>
    </label>
  </div>

  <div class="hsh-actions" id="hsh-actions" role="group" aria-label="Choose a hash algorithm">
    <button type="button" class="hsh-btn hsh-btn-algo" data-algo="MD5">MD5</button>
    <button type="button" class="hsh-btn hsh-btn-algo" data-algo="SHA1">SHA1</button>
    <button type="button" class="hsh-btn hsh-btn-algo" data-algo="SHA256">SHA256</button>
    <button type="button" class="hsh-btn hsh-btn-algo" data-algo="SHA384">SHA384</button>
    <button type="button" class="hsh-btn hsh-btn-algo" data-algo="SHA512">SHA512</button>
  </div>

  <div class="hsh-space" id="hsh-space" hidden>
    <div class="hsh-space-title">Space detection</div>
    <ul class="hsh-space-list" id="hsh-space-list"></ul>
    <p class="hsh-space-note">Spaces take part in hashing — different space schemes (half-width / full-width / count / position) produce different hashes</p>
  </div>

  <div class="hsh-results" id="hsh-results">
    <div class="hsh-placeholder" id="hsh-placeholder">Enter a string, then click a button below to generate its hash</div>
  </div>

</div>

<script type="module" src="/assets/tools/hash-string/app.js?v=202609221"></script>
