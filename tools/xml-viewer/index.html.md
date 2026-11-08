---
layout: page
title: XML 工具
icon: fas fa-code-branch
tool_css: /assets/tools/xml-viewer/app.css?v=202609221
---

<p class="hint">粘贴任意 XML / RSS / SML 片段，即可获得结构树浏览；支持格式化、压缩成一行、一键复制与下载，全部在浏览器本地完成，内容不会上传。</p>

<div id="xv-app">
  <textarea id="xv-input" spellcheck="false" aria-label="XML 输入"></textarea>

  <div class="xv-bar">
    <button type="button" class="xv-btn xv-btn-ghost" id="xv-sample" aria-label="载入示例">示例</button>
    <button type="button" class="xv-btn" id="xv-fmt">格式化</button>
    <button type="button" class="xv-btn" id="xv-minify">压缩为一行</button>
    <button type="button" class="xv-btn" id="xv-copy">复制</button>
    <button type="button" class="xv-btn" id="xv-download">下载 .xml</button>
    <button type="button" class="xv-btn" id="xv-tree-window">新窗口浏览</button>
    <span class="xv-status" id="xv-status" role="status" aria-hidden="true"></span>
  </div>

  <div class="xv-error" id="xv-error" hidden></div>

  <div class="xv-placeholder" id="xv-placeholder">
    <p>还没有 XML 内容。</p>
    <p>点击「示例」载入一段演示，或在上方粘贴你的 XML。</p>
  </div>

  <div class="xv-tree-wrap" id="xv-tree-wrap" hidden>
    <div class="xv-tree-head">
      <span class="xv-meta" id="xv-tree-meta"></span>
      <input type="search" class="xv-tree-search" id="xv-tree-search" placeholder="搜索节点…" aria-label="搜索节点">
      <button type="button" class="xv-btn" id="xv-tree-expand">全部展开</button>
      <button type="button" class="xv-btn" id="xv-tree-collapse">折叠深层</button>
    </div>
    <div class="xv-tree" id="xv-tree" role="tree"></div>
  </div>
</div>

<script src="/assets/tools/xml-viewer/app.js?v=202609221" defer></script>
