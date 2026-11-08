---
layout: page
title: JSON 工具
icon: fas fa-file-code
tool_css: /assets/tools/json-format/app.css?v=202609221
---

支持 JSON 的常用操作，全部在浏览器本地完成，**输入不上传**：

- **树形浏览**：输入即生成可折叠树，字符串若是图片链接（如 `https://...png`）hover 自动预览；支持搜索定位、全部展开 / 折叠、全屏新窗口浏览。
- **格式化 / 压缩**：2 空格缩进排版，或压缩为单行。
- **按键排序**：递归按键名字母序重排对象。
- **自动修复**：宽容解析尾逗号、单引号、无引号键、`//` 与 `/* */` 注释等非标准写法，一键写回标准 JSON。
- **复制 / 下载**：标准 JSON 一键复制剪贴板或下载为 `data.json`。

<div id="jf-app">

  <div class="jf-banner">
    <span class="jf-hint">输入即树形 · 图片 hover 预览 · 可自动修复 · 纯本地不上传</span>
  </div>

  <div class="jf-tools">
    <button type="button" class="jf-btn" id="jf-sample">填入示例</button>
    <span class="jf-tools-divider" aria-hidden="true"></span>
    <button type="button" class="jf-btn" id="jf-fmt">格式化</button>
    <button type="button" class="jf-btn" id="jf-minify">压缩成一行</button>
    <button type="button" class="jf-btn" id="jf-sort">按键排序</button>
    <button type="button" class="jf-btn jf-btn-accent" id="jf-repair">自动修复</button>
    <span class="jf-tools-divider" aria-hidden="true"></span>
    <button type="button" class="jf-btn" id="jf-copy">复制</button>
    <button type="button" class="jf-btn" id="jf-download">下载 .json</button>
  </div>

  <textarea id="jf-input" class="jf-input" rows="8" spellcheck="false" autocomplete="off" placeholder='{"host":"sunyazhou.com","avatar":"https://www.sunyazhou.com/assets/img/avatar.jpg"}'></textarea>

  <div class="jf-status" id="jf-status" aria-hidden="true"></div>

  <div class="jf-tree-wrap" id="jf-tree-wrap" hidden>
    <div class="jf-tree-toolbar">
      <input type="search" id="jf-tree-search" class="jf-tree-search" placeholder="搜索节点（键或值）" spellcheck="false" autocomplete="off">
      <span class="jf-tree-meta" id="jf-tree-meta"></span>
      <span class="jf-toolbar-spacer"></span>
      <button type="button" class="jf-btn" id="jf-tree-expand">全部展开</button>
      <button type="button" class="jf-btn" id="jf-tree-collapse">全部折叠</button>
      <button type="button" class="jf-btn jf-btn-window" id="jf-tree-window" title="在全屏新窗口浏览树形，不受本页侧边栏限制">新窗口</button>
    </div>
    <div class="jf-tree" id="jf-tree" aria-live="polite"></div>
  </div>

  <div class="jf-error" id="jf-error" hidden></div>
  <div class="jf-placeholder" id="jf-placeholder">在上方输入 JSON，树形结构会自动生成</div>

</div>

<script src="/assets/tools/json-format/app.js?v=202609221"></script>
