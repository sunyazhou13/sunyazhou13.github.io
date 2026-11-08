---
layout: page
title: JSON → Swift 互转
icon: fas fa-code
tool_css: /assets/tools/json-to-swift/app.css?v=8
---

输入 JSON 一键生成 **Swift 5.5+ Codable 结构体**，或反过来输入 Swift `struct` 生成示例 JSON 测试数据。全部在浏览器本地完成，**输入不上传**：

- **JSON → Swift (Codable)**：自动推断类型（String / Int / Double / Bool / 数组 / 嵌套对象），生成 `CodingKeys` 处理蛇形命名转换；支持嵌套结构与数组。
- **Swift → 示例 JSON**：解析 `struct` 的属性名与类型，生成合理的示例值（含嵌套结构体），方便给 Codable 模型造测试数据。
- **双语言输出**：Swift 结构体与 Objective-C `@property` 声明一键切换。
- **蛇形命名开关**：`snake_case` ⇄ `camelCase`，自动决定是否需要 `CodingKeys`。
- 一键复制 / 清空 / 填入示例。

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css">

<div id="js2s-app">

  <div class="js2s-banner">
    <span class="js2s-hint">JSON ⇄ Swift Codable · 纯本地处理 · 不上传</span>
  </div>

  <div class="js2s-toolbar">
    <button type="button" class="js2s-btn" id="js2s-to-swift">JSON → Swift</button>
    <button type="button" class="js2s-btn" id="js2s-to-json">Swift → 示例 JSON</button>
    <span class="js2s-divider" aria-hidden="true"></span>
    <button type="button" class="js2s-btn" id="js2s-sample">填入示例</button>
    <button type="button" class="js2s-btn" id="js2s-copy">复制</button>
    <button type="button" class="js2s-btn" id="js2s-clear">清空</button>
  </div>

  <div class="js2s-options">
    <label class="js2s-field">
      <span>根结构体名称</span>
      <input type="text" id="js2s-rootname" class="js2s-text" value="Root" spellcheck="false" autocomplete="off">
    </label>
    <label class="js2s-switch">
      <input type="checkbox" id="js2s-snake" checked>
      <span>蛇形命名 / snake_case（生成 CodingKeys）</span>
    </label>
    <div class="js2s-tabs" role="tablist">
      <button type="button" class="js2s-tab js2s-tab-active" data-lang="swift" role="tab">Swift</button>
      <button type="button" class="js2s-tab" data-lang="objc" role="tab">Objective-C</button>
    </div>
  </div>

  <div class="js2s-style">
    <span class="js2s-style-title">代码风格</span>
    <label class="js2s-field"><span>JSON 缩进</span>
      <select id="js2s-json-indent" class="js2s-select">
        <option value="2" selected>2 空格</option>
        <option value="4">4 空格</option>
        <option value="tab">Tab</option>
      </select>
    </label>
    <label class="js2s-field"><span>Swift 缩进</span>
      <select id="js2s-swift-indent" class="js2s-select">
        <option value="2">2 空格</option>
        <option value="4" selected>4 空格</option>
        <option value="tab">Tab</option>
      </select>
    </label>
    <label class="js2s-field"><span>Swift 类型</span>
      <select id="js2s-swift-kind" class="js2s-select">
        <option value="struct" selected>struct</option>
        <option value="class">class</option>
      </select>
    </label>
    <label class="js2s-field"><span>可选类型</span>
      <select id="js2s-swift-opt" class="js2s-select">
        <option value="question" selected>? 可选</option>
        <option value="force">! 强制解包</option>
        <option value="explicit">默认值</option>
      </select>
    </label>
    <button type="button" class="js2s-btn" id="js2s-format">格式化</button>
  </div>

  <div class="js2s-grid">
    <div class="js2s-pane">
      <label class="js2s-label" id="js2s-input-label">输入（JSON）</label>
      <div class="js2s-input-wrap" id="js2s-input-wrap">
        <button type="button" class="js2s-code-copy" id="js2s-copy-input" title="复制代码" aria-label="复制代码">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span class="js2s-copy-tip">已复制</span>
        </button>
        <pre class="js2s-input-pre" id="js2s-input-pre"><code id="js2s-input-code" class="hljs"></code></pre>
        <textarea id="js2s-input" class="js2s-textarea" rows="16" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" placeholder='在此粘贴 JSON 或 Swift struct...'></textarea>
      </div>
    </div>
    <div class="js2s-pane">
      <label class="js2s-label">输出</label>
      <div class="js2s-output-wrap" id="js2s-output-wrap">
        <button type="button" class="js2s-code-copy" id="js2s-copy-output" title="复制代码" aria-label="复制代码">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span class="js2s-copy-tip">已复制</span>
        </button>
        <pre class="js2s-output-pre"><code id="js2s-output-code" class="language-swift hljs"></code></pre>
        <textarea id="js2s-output" class="js2s-textarea js2s-output" rows="16" readonly spellcheck="false" placeholder="转换结果将显示在这里"></textarea>
      </div>
    </div>
  </div>

  <div class="js2s-error" id="js2s-error" hidden></div>

  <p class="js2s-note">提示：点「JSON → Swift」转换左侧 JSON；点「Swift → 示例 JSON」则可把左侧的 Swift struct 反向生成示例 JSON。Objective-C 标签仅在 JSON → Swift 时有效。</p>

</div>

<script src="/assets/tools/json-to-swift/app.js?v=8"></script>
