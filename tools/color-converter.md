---
layout: page
title: 色彩格式转换
icon: fas fa-palette
tool_css: /assets/tools/color-converter/app.css?v=202609221
---

支持 HEX / RGB / HSL / SwiftUI / UIColor / Android / CSS 等色彩格式的任意互转。粘贴任意格式的色值，自动识别类型并实时联动输出所有格式。吸管取色（调用原生 color picker）、预设色板（10 个常用颜色）、一键复制，全部在浏览器本地完成，**不会上传到任何服务器**。

<div id="cc-app">

  <div class="cc-input-area">
    <div class="cc-input-wrap">
      <div class="cc-input-row">
        <input
          type="text"
          id="cc-input"
          class="cc-text-input"
          placeholder="粘贴任意格式色值，如 #FF5733、rgb(255,87,51)、hsl(14,100%,60%)"
          autocomplete="off"
          spellcheck="false"
        >
        <button type="button" class="cc-picker-btn" id="cc-picker-btn" title="吸管取色">
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
    <span class="cc-presets-label">预设色板</span>
    <div class="cc-presets-row" id="cc-presets-row"></div>
  </div>

  <div class="cc-outputs" id="cc-outputs"></div>

  <div class="cc-error" id="cc-error" hidden>无法识别的色彩格式，请检查输入</div>

</div>

<script type="module" src="/assets/tools/color-converter/app.js?v=202609221"></script>
