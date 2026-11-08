---
layout: page
title: JWT 解析
icon: fas fa-user-secret
tool_css: /assets/tools/jwt-parser/app.css?v=202609221
---

<p class="hint">粘贴 JWT（JSON Web Token）自动解码 Header 与 Payload 为 JSON 树形展示，高亮 `exp` 并计算剩余有效天数 / 是否过期，内置 HMAC-SHA256 + Base64URL 纯前端签名校验，还可一键「篡改尝试」演示改动 Payload 后签名立即失效。全程本地计算，Token 不会上传。</p>

<div id="jp-app">

  <div class="jp-input-panel">
    <textarea id="jp-input" spellcheck="false" rows="4" placeholder="粘贴 eyJhbGciOi… 开头的 JWT 字符串…" aria-label="JWT 输入"></textarea>
    <div class="jp-input-actions">
      <button type="button" class="jp-btn jp-btn-primary" id="jp-parse">解析</button>
      <button type="button" class="jp-btn" id="jp-sample">载入示例</button>
      <button type="button" class="jp-btn" id="jp-clear">清空</button>
    </div>
  </div>

  <p class="jp-status" id="jp-status" role="status"></p>

  <div class="jp-cards" id="jp-cards" hidden>
    <section class="jp-card">
      <h3 class="jp-card-title">Header</h3>
      <pre class="jp-json" id="jp-header"></pre>
    </section>
    <section class="jp-card">
      <h3 class="jp-card-title">Payload <span class="jp-exp" id="jp-exp-line" hidden></span></h3>
      <pre class="jp-json" id="jp-payload"></pre>
    </section>
    <section class="jp-card jp-card-sig">
      <h3 class="jp-card-title">签名校验 <span class="jp-sig-badge" id="jp-sig-badge"></span></h3>
      <p class="jp-sig-detail" id="jp-sig-detail"></p>
      <div class="jp-tamper">
        <button type="button" class="jp-btn" id="jp-tamper">篡改尝试（模拟改 Payload）</button>
        <span class="jp-hint-text">修改任意字节后 HMAC 立即不匹配，篡改立即可被识破。</span>
      </div>
    </section>
    <section class="jp-card">
      <h3 class="jp-card-title">注入自选 Payload</h3>
      <textarea id="jp-plain" spellcheck="false" rows="3" placeholder='{"name":"Alice","admin":false}' aria-label="自定义 Payload"></textarea>
      <div class="jp-plain-actions">
        <button type="button" class="jp-btn" id="jp-sign">签名生成（HMAC-SHA256，秘钥 hs256-secret）</button>
      </div>
      <pre class="jp-json" id="jp-signed" hidden></pre>
    </section>
  </div>

</div>

<script src="/assets/tools/jwt-parser/app.js?v=202609221" defer></script>
