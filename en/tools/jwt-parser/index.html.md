---
layout: page
title: JWT Decoder
icon: fas fa-user-secret
lang: en
permalink: /tools/jwt-parser/
tool_css: /assets/tools/jwt-parser/app.css?v=202609221
---
Paste a JWT (JSON Web Token) and its Header and Payload are decoded into a JSON tree automatically, with `exp` highlighted and remaining validity days / expiry status calculated. Includes a pure front-end HMAC-SHA256 + Base64URL signature verification, plus a one-click "tamper attempt" that demonstrates how a modified Payload instantly invalidates the signature. Everything runs locally — your token is never uploaded.

<div id="jp-app">

  <div class="jp-input-panel">
    <textarea id="jp-input" spellcheck="false" rows="4" placeholder="Paste a JWT string starting with eyJhbGciOi…" aria-label="JWT input"></textarea>
    <div class="jp-input-actions">
      <button type="button" class="jp-btn jp-btn-primary" id="jp-parse">Parse</button>
      <button type="button" class="jp-btn" id="jp-sample">Load sample</button>
      <button type="button" class="jp-btn" id="jp-clear">Clear</button>
    </div>
  </div>

  <p class="jp-status" id="jp-status" role="status"></p>

  <div class="jp-cards" id="jp-cards" hidden>
    <section class="jp-card">
      <h3 class="jp-card-title">Header</h3>
      <pre class="jp-json" id="jp-header"></pre>
    </section>
    <section class="jp-card">
      <h3 class="jp-card-title">Payload <span class="jp-exp" id="jp-exp-line" hidden></span></h3>
      <pre class="jp-json" id="jp-payload"></pre>
    </section>
    <section class="jp-card jp-card-sig">
      <h3 class="jp-card-title">Signature check <span class="jp-sig-badge" id="jp-sig-badge"></span></h3>
      <p class="jp-sig-detail" id="jp-sig-detail"></p>
      <div class="jp-tamper">
        <button type="button" class="jp-btn" id="jp-tamper">Tamper attempt (simulate a modified Payload)</button>
        <span class="jp-hint-text">Any byte change makes the HMAC mismatch immediately, so tampering is detected at once.</span>
      </div>
    </section>
    <section class="jp-card">
      <h3 class="jp-card-title">Inject custom Payload</h3>
      <textarea id="jp-plain" spellcheck="false" rows="3" placeholder='{"name":"Alice","admin":false}' aria-label="Custom payload"></textarea>
      <div class="jp-plain-actions">
        <button type="button" class="jp-btn" id="jp-sign">Sign (HMAC-SHA256, key hs256-secret)</button>
      </div>
      <pre class="jp-json" id="jp-signed" hidden></pre>
    </section>
  </div>

</div>

<script src="/assets/tools/jwt-parser/app.js?v=202609221" defer></script>
