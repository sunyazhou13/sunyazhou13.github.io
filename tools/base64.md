---
layout: page
title: Base64 编码解码
icon: fas fa-code
tool_css: /assets/tools/base64/app.css?v=202609221
---

输入任意文本，即可做 **Base64 编码 / 解码**，所有处理都在浏览器本地完成，**输入不会上传到任何服务器**。

几点说明：

- 点击生成：输入内容后，点击「编码」或「解码」，只有被你点击的操作才会执行并展示结果
- 编码：将 UTF-8 文本编码为 Base64 字符串（RFC 4648 标准）
- 解码：将 Base64 还原为 UTF-8 文本，自动忽略其中的换行与空白
- **URL 安全**：勾选后使用 Base64URL 变体（`-` `_` 替代 `+` `/` 并省略 `=`），适合放进 URL 或文件名；解码时也按此格式还原
- 解码失败时（非法字符、长度错误、非 UTF-8 内容）会明确提示原因
- 结果可直接一键复制

<div id="b64-app">

  <div class="b64-banner">
    <span class="b64-hint">编码解码都在本机浏览器完成，输入不会上传</span>
  </div>

  <div class="b64-input-wrap">
    <label class="b64-label" for="b64-input">输入内容</label>
    <textarea id="b64-input" class="b64-input" rows="4" spellcheck="false" autocomplete="off" placeholder="输入要编码或解码的文本…"></textarea>
  </div>

  <div class="b64-options">
    <label class="b64-urlsafe">
      <input type="checkbox" id="b64-urlsafe">
      <span>URL 安全（Base64URL：使用 <code>-</code> <code>_</code> 并省略 <code>=</code>）</span>
    </label>
  </div>

  <div class="b64-actions" id="b64-actions" role="group" aria-label="执行编码或解码">
    <button type="button" class="b64-btn b64-btn-primary" id="b64-encode">编码</button>
    <button type="button" class="b64-btn b64-btn-primary" id="b64-decode">解码</button>
  </div>

  <div class="b64-results" id="b64-results">
    <div class="b64-placeholder" id="b64-placeholder">输入内容后，点击「编码」或「解码」查看结果</div>

    <div class="b64-output" id="b64-output" hidden>
      <label class="b64-label" for="b64-result">结果</label>
      <textarea id="b64-result" class="b64-input b64-result" rows="4" readonly spellcheck="false"></textarea>
      <div class="b64-meta-row">
        <span class="b64-meta" id="b64-meta"></span>
        <button type="button" class="b64-btn b64-btn-copy" id="b64-copy">复制结果</button>
      </div>
    </div>

    <div class="b64-error" id="b64-error" hidden></div>
  </div>

</div>

<script type="module" src="/assets/tools/base64/app.js?v=202609221"></script>
