---
layout: page
title: 字符串 Hash
icon: fas fa-hashtag
tool_css: /assets/tools/hash-string/app.css?v=202609221
---

输入任意字符串后，点击下方对应按钮生成 **MD5 / SHA1 / SHA256 / SHA384 / SHA512** 哈希，所有计算都在浏览器本地完成，**输入不会上传到任何服务器**。

几点说明：

- 点击生成：想算哪个就点哪个，只有被点击算法的结果才会被计算并展示
- **MD5** 为纯 JS 实现，SHA 系列使用浏览器 WebCrypto（需 HTTPS 或 localhost 安全上下文）
- 统一按 **UTF-8** 编码计算，结果以十六进制小写展示，可一键切换为大写
- 每个结果行均可一键复制
- 附带空格检测：统计半角 / 全角空格、位置与连续性，帮助排查因空格差异导致的哈希不一致

<div id="hsh-app">

  <div class="hsh-banner">
    <span class="hsh-badge" id="hsh-engine-badge">正在检测加密能力…</span>
    <span class="hsh-hint">所有计算都在本机浏览器完成，输入不会上传</span>
  </div>

  <div class="hsh-input-wrap">
    <label class="hsh-label" for="hsh-input">输入字符串</label>
    <textarea id="hsh-input" class="hsh-input" rows="4" spellcheck="false" autocomplete="off" placeholder="在这里输入任意字符串…"></textarea>
  </div>

  <div class="hsh-options">
    <label class="hsh-upper">
      <input type="checkbox" id="hsh-upper">
      <span>显示大写</span>
    </label>
  </div>

  <div class="hsh-actions" id="hsh-actions" role="group" aria-label="选择哈希算法">
    <button type="button" class="hsh-btn hsh-btn-algo" data-algo="MD5">MD5</button>
    <button type="button" class="hsh-btn hsh-btn-algo" data-algo="SHA1">SHA1</button>
    <button type="button" class="hsh-btn hsh-btn-algo" data-algo="SHA256">SHA256</button>
    <button type="button" class="hsh-btn hsh-btn-algo" data-algo="SHA384">SHA384</button>
    <button type="button" class="hsh-btn hsh-btn-algo" data-algo="SHA512">SHA512</button>
  </div>

  <div class="hsh-space" id="hsh-space" hidden>
    <div class="hsh-space-title">空格检测</div>
    <ul class="hsh-space-list" id="hsh-space-list"></ul>
    <p class="hsh-space-note">空格会参与哈希计算，不同空格方案（半角 / 全角 / 数量 / 位置）计算结果不同</p>
  </div>

  <div class="hsh-results" id="hsh-results">
    <div class="hsh-placeholder" id="hsh-placeholder">输入字符串后，点击下方按钮生成对应哈希</div>
  </div>

</div>

<script type="module" src="/assets/tools/hash-string/app.js?v=202609221"></script>
