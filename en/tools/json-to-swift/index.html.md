---
layout: page
title: JSON ↔ Swift Converter
icon: fas fa-code
lang: en
permalink: /tools/json-to-swift/
tool_css: /assets/tools/json-to-swift/app.css?v=8
---

Paste JSON to generate **Swift 5.5+ Codable structs**, or paste a Swift `struct` to generate sample JSON test data. Everything runs locally in your browser — **nothing is uploaded**:

- **JSON → Swift (Codable)**: infers types automatically (String / Int / Double / Bool / arrays / nested objects), generates `CodingKeys` for snake_case conversion and supports nested structs and arrays.
- **Swift → Sample JSON**: parses `struct` property names and types to produce sensible sample values (including nested structs), handy for building Codable test fixtures.
- **Dual language output**: switch between Swift structs and Objective-C `@property` declarations.
- **Snake-case toggle**: `snake_case` ⇄ `camelCase`, automatically deciding whether `CodingKeys` are needed.
- One-click copy / clear / load sample.

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css">

<div id="js2s-app">

  <div class="js2s-banner">
    <span class="js2s-hint">JSON ⇄ Swift Codable · 100% local · nothing uploaded</span>
  </div>

  <div class="js2s-toolbar">
    <button type="button" class="js2s-btn" id="js2s-to-swift">JSON → Swift</button>
    <button type="button" class="js2s-btn" id="js2s-to-json">Swift → Sample JSON</button>
    <span class="js2s-divider" aria-hidden="true"></span>
    <button type="button" class="js2s-btn" id="js2s-sample">Load Sample</button>
    <button type="button" class="js2s-btn" id="js2s-copy">Copy</button>
    <button type="button" class="js2s-btn" id="js2s-clear">Clear</button>
  </div>

  <div class="js2s-options">
    <label class="js2s-field">
      <span>Root struct name</span>
      <input type="text" id="js2s-rootname" class="js2s-text" value="Root" spellcheck="false" autocomplete="off">
    </label>
    <label class="js2s-switch">
      <input type="checkbox" id="js2s-snake" checked>
      <span>Snake case / snake_case (generate CodingKeys)</span>
    </label>
    <div class="js2s-tabs" role="tablist">
      <button type="button" class="js2s-tab js2s-tab-active" data-lang="swift" role="tab">Swift</button>
      <button type="button" class="js2s-tab" data-lang="objc" role="tab">Objective-C</button>
    </div>
  </div>

  <div class="js2s-style">
    <span class="js2s-style-title">Code style</span>
    <label class="js2s-field"><span>JSON indent</span>
      <select id="js2s-json-indent" class="js2s-select">
        <option value="2" selected>2 spaces</option>
        <option value="4">4 spaces</option>
        <option value="tab">Tab</option>
      </select>
    </label>
    <label class="js2s-field"><span>Swift indent</span>
      <select id="js2s-swift-indent" class="js2s-select">
        <option value="2">2 spaces</option>
        <option value="4" selected>4 spaces</option>
        <option value="tab">Tab</option>
      </select>
    </label>
    <label class="js2s-field"><span>Swift kind</span>
      <select id="js2s-swift-kind" class="js2s-select">
        <option value="struct" selected>struct</option>
        <option value="class">class</option>
      </select>
    </label>
    <label class="js2s-field"><span>Optional</span>
      <select id="js2s-swift-opt" class="js2s-select">
        <option value="question" selected>? optional</option>
        <option value="force">! forced</option>
        <option value="explicit">default value</option>
      </select>
    </label>
    <button type="button" class="js2s-btn" id="js2s-format">Format</button>
  </div>

  <div class="js2s-grid">
    <div class="js2s-pane">
      <label class="js2s-label" id="js2s-input-label">Input (JSON)</label>
      <div class="js2s-input-wrap" id="js2s-input-wrap">
        <button type="button" class="js2s-code-copy" id="js2s-copy-input" title="Copy code" aria-label="Copy code">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span class="js2s-copy-tip">Copied!</span>
        </button>
        <pre class="js2s-input-pre" id="js2s-input-pre"><code id="js2s-input-code" class="hljs"></code></pre>
        <textarea id="js2s-input" class="js2s-textarea" rows="16" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" placeholder='Paste JSON or a Swift struct here...'></textarea>
      </div>
    </div>
    <div class="js2s-pane">
      <label class="js2s-label">Output</label>
      <div class="js2s-output-wrap" id="js2s-output-wrap">
        <button type="button" class="js2s-code-copy" id="js2s-copy-output" title="Copy code" aria-label="Copy code">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span class="js2s-copy-tip">Copied!</span>
        </button>
        <pre class="js2s-output-pre"><code id="js2s-output-code" class="language-swift hljs"></code></pre>
        <textarea id="js2s-output" class="js2s-textarea js2s-output" rows="16" readonly spellcheck="false" placeholder="The conversion result will appear here"></textarea>
      </div>
    </div>
  </div>

  <div class="js2s-error" id="js2s-error" hidden></div>

  <p class="js2s-note">Tip: click "JSON → Swift" to convert the JSON on the left; click "Swift → Sample JSON" to turn the Swift struct on the left into sample JSON. The Objective-C tab only applies to JSON → Swift.</p>

</div>

<script src="/assets/tools/json-to-swift/app.js?v=8"></script>
