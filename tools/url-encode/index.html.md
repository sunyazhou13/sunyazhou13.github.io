---
layout: page
title: URL 编码解码
icon: fas fa-link
tool_css: /assets/tools/url-encode/app.css?v=202609221
---

<p class="hint">文本与 `%20`、`%2F` 等百分号编码（URL 编码）双向互转，支持 `encodeURIComponent` 与 `encodeURI` 两种模式，双向转换一键互换、一键复制，全部在浏览器本地完成，内容不会上传。</p>

<div id="ue-app">

  <div class="ue-mode-bar">
    <label class="ue-mode">
      <input type="radio" name="ue-mode" id="ue-comp" checked>
      <span>encodeURIComponent（编码所有保留字符，用于参数值）</span>
    </label>
    <label class="ue-mode">
      <input type="radio" name="ue-mode" id="ue-uri">
      <span>encodeURI（保留完整 URL 结构字符，用于整个 URL）</span>
    </label>
  </div>

  <div class="ue-field">
    <span class="ue-field-tag" id="ue-src-tag">输入</span>
    <textarea id="ue-src" spellcheck="false" rows="5" placeholder="在此输入要编码或解码的文本…"></textarea>
  </div>

  <div class="ue-actions">
    <button type="button" class="ue-btn" id="ue-encode">编码 ▾（→ %20）</button>
    <button type="button" class="ue-btn" id="ue-decode">解码 ▴（← %20）</button>
    <button type="button" class="ue-btn" id="ue-swap">⇄ 双向转换（每次点击切换一次）</button>
    <button type="button" class="ue-btn" id="ue-copy">复制结果</button>
    <button type="button" class="ue-btn" id="ue-clear">清空</button>
  </div>

  <div class="ue-field">
    <span class="ue-field-tag" id="ue-dst-tag">结果</span>
    <textarea id="ue-dst" spellcheck="false" rows="5" readonly placeholder="结果输出…"></textarea>
  </div>

  <p class="ue-status" id="ue-status" role="status"></p>

</div>

<script src="/assets/tools/url-encode/app.js?v=202609221" defer></script>
