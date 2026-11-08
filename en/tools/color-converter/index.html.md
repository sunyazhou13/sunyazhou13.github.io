---
layout: page
title: Color Format Converter
icon: fas fa-palette
lang: en
permalink: /tools/color-converter/
tool_css: /assets/tools/color-converter/app.css?v=202609221
---

Convert between HEX / RGB / HSL / SwiftUI / UIColor / Android / CSS color formats instantly. Paste any format and get all formats at once. Eyedropper picker (native color picker), preset swatches (10 common colors), one-click copy — all processed locally in your browser, **nothing uploaded**.

<div id="cc-app">

  <div class="cc-input-area">
    <div class="cc-input-wrap">
      <div class="cc-input-row">
        <input
          type="text"
          id="cc-input"
          class="cc-text-input"
          placeholder="Paste any color format, e.g. #FF5733, rgb(255,87,51), hsl(14,100%,60%)"
          autocomplete="off"
          spellcheck="false"
        >
        <button type="button" class="cc-picker-btn" id="cc-picker-btn" title="Eyedropper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 0 0-7.35 16.76L2 22l3.24-2.65A10 10 0 0 0 12 2Z"/>
            <path d="m18 6 4 4"/>
            <path d="m22 10-2.5-2.5"/>
          </svg>
        </button>
        <input type="color" id="cc-color-native" value="#FF5733">
      </div>
      <div class="cc-preview-bar" id="cc-preview-bar">
        <span class="cc-preview-swatch" id="cc-preview-swatch"></span>
        <span class="cc-preview-label" id="cc-preview-label">#FF5733</span>
      </div>
    </div>
  </div>

  <div class="cc-presets">
    <span class="cc-presets-label">Presets</span>
    <div class="cc-presets-row" id="cc-presets-row"></div>
  </div>

  <div class="cc-outputs" id="cc-outputs"></div>

  <div class="cc-error" id="cc-error" hidden>Unrecognized color format. Please check your input.</div>

</div>

<script type="module" src="/assets/tools/color-converter/app.js?v=202609221"></script>
