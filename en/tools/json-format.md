---
layout: page
title: JSON Tools
icon: fas fa-file-code
lang: en
permalink: /tools/json-format/
tool_css: /assets/tools/json-format/app.css?v=202609221
---

Everyday JSON operations, all in your browser — **nothing is uploaded**:

- **Tree viewer**: a collapsible tree is built as you type; if a string is an image link (like `https://...png`), hover shows a preview; search-to-locate, expand-all / collapse-all, and a fullscreen new-window view are supported.
- **Format / Minify**: pretty-print with 2-space indent, or squeeze into a single line.
- **Sort by key**: recursively reorder objects alphabetically by key name.
- **Auto-repair**: lenient parsing of trailing commas, single quotes, unquoted keys, `//` and `/* */` comments and other non-standard syntax — one click writes back standard JSON.
- **Copy / Download**: standard JSON copied to the clipboard or downloaded as `data.json` with one click.

<div id="jf-app">

  <div class="jf-banner">
    <span class="jf-hint">Tree as you type · image hover preview · auto-repair · local only, nothing uploaded</span>
  </div>

  <div class="jf-tools">
    <button type="button" class="jf-btn" id="jf-sample">Load sample</button>
    <span class="jf-tools-divider" aria-hidden="true"></span>
    <button type="button" class="jf-btn" id="jf-fmt">Format</button>
    <button type="button" class="jf-btn" id="jf-minify">Minify</button>
    <button type="button" class="jf-btn" id="jf-sort">Sort by key</button>
    <button type="button" class="jf-btn jf-btn-accent" id="jf-repair">Auto-repair</button>
    <span class="jf-tools-divider" aria-hidden="true"></span>
    <button type="button" class="jf-btn" id="jf-copy">Copy</button>
    <button type="button" class="jf-btn" id="jf-download">Download .json</button>
  </div>

  <textarea id="jf-input" class="jf-input" rows="8" spellcheck="false" autocomplete="off" placeholder='{"host":"sunyazhou.com","avatar":"https://www.sunyazhou.com/assets/img/avatar.jpg"}'></textarea>

  <div class="jf-status" id="jf-status" aria-hidden="true"></div>

  <div class="jf-tree-wrap" id="jf-tree-wrap" hidden>
    <div class="jf-tree-toolbar">
      <input type="search" id="jf-tree-search" class="jf-tree-search" placeholder="Search nodes (key or value)" spellcheck="false" autocomplete="off">
      <span class="jf-tree-meta" id="jf-tree-meta"></span>
      <span class="jf-toolbar-spacer"></span>
      <button type="button" class="jf-btn" id="jf-tree-expand">Expand all</button>
      <button type="button" class="jf-btn" id="jf-tree-collapse">Collapse all</button>
      <button type="button" class="jf-btn jf-btn-window" id="jf-tree-window" title="Browse the tree in a fullscreen new window, free from the sidebar of this page">New window</button>
    </div>
    <div class="jf-tree" id="jf-tree" aria-live="polite"></div>
  </div>

  <div class="jf-error" id="jf-error" hidden></div>
  <div class="jf-placeholder" id="jf-placeholder">Enter JSON above and the tree is built automatically</div>

</div>

<script src="/assets/tools/json-format/app.js?v=202609221"></script>
