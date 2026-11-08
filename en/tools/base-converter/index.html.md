---
layout: page
title: Number Base Converter
icon: fas fa-calculator
lang: en
permalink: /tools/base-converter/
tool_css: /assets/tools/base-converter/app.css?v=202609221
---

Real-time linked conversion between **binary, octal, decimal and hexadecimal**: type a number into any input field and the other bases update automatically. All computation happens locally in your browser — **your input is never uploaded to any server**.

Notes:

- Live linking: type in any base field and the other three convert automatically
- Integers of any length are supported (BigInt arithmetic), including negative numbers
- Paste with prefixes: hexadecimal `0x`, binary `0b`, octal `0o` (plain input without prefix also works)
- Every field has one-click copy
- Invalid input (e.g. a `2` in binary) shows an explicit reason

<div id="bc-app">

  <div class="bc-banner">
    <span class="bc-hint">Four linked bases, computed locally — nothing is uploaded</span>
  </div>

  <div class="bc-grid">

    <div class="bc-field">
      <label class="bc-label" for="bc-bin"><span class="bc-dot bc-dot-red"></span>Binary <span class="bc-sub">Bin</span></label>
      <div class="bc-row">
        <input type="text" id="bc-bin" class="bc-input" placeholder="Binary, e.g. 1010" spellcheck="false" autocomplete="off">
        <button type="button" class="bc-btn bc-btn-copy" data-copy="bc-bin" title="Copy binary result">Copy</button>
      </div>
    </div>

    <div class="bc-field">
      <label class="bc-label" for="bc-oct"><span class="bc-dot bc-dot-orange"></span>Octal <span class="bc-sub">Oct</span></label>
      <div class="bc-row">
        <input type="text" id="bc-oct" class="bc-input" placeholder="Octal, e.g. 12" spellcheck="false" autocomplete="off">
        <button type="button" class="bc-btn bc-btn-copy" data-copy="bc-oct" title="Copy octal result">Copy</button>
      </div>
    </div>

    <div class="bc-field">
      <label class="bc-label" for="bc-dec"><span class="bc-dot bc-dot-green"></span>Decimal <span class="bc-sub">Dec</span></label>
      <div class="bc-row">
        <input type="text" id="bc-dec" class="bc-input" placeholder="Decimal, e.g. 10" spellcheck="false" autocomplete="off">
        <button type="button" class="bc-btn bc-btn-copy" data-copy="bc-dec" title="Copy decimal result">Copy</button>
      </div>
    </div>

    <div class="bc-field">
      <label class="bc-label" for="bc-hex"><span class="bc-dot bc-dot-blue"></span>Hexadecimal <span class="bc-sub">Hex</span></label>
      <div class="bc-row">
        <input type="text" id="bc-hex" class="bc-input" placeholder="Hexadecimal, e.g. a" spellcheck="false" autocomplete="off">
        <button type="button" class="bc-btn bc-btn-copy" data-copy="bc-hex" title="Copy hexadecimal result">Copy</button>
      </div>
    </div>

  </div>

  <div class="bc-error" id="bc-error" hidden></div>

</div>

<script type="module" src="/assets/tools/base-converter/app.js?v=202609221"></script>
