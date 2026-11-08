---
layout: page
title: UUID / ULID 生成器
icon: fas fa-fingerprint
tool_css: /assets/tools/uuid-ulid/app.css?v=202609221
---

<p class="hint">一键生成 <strong>UUID v4</strong> 与 <strong>ULID</strong>，支持批量 1 / 10 / 100 个，可复制单个、复制全部或换一批。全部在浏览器本地随机生成（优先使用 <code>crypto.getRandomValues</code>），内容不会上传。</p>

<div id="uu-app">
  <div class="uu-controls">
    <label>类型
      <select id="uu-type">
        <option value="uuid">UUID v4</option>
        <option value="ulid">ULID</option>
      </select>
    </label>
    <label>数量
      <select id="uu-count">
        <option value="1">1 个</option>
        <option value="10" selected>10 个</option>
        <option value="100">100 个</option>
      </select>
    </label>
    <button type="button" class="uu-btn uu-btn-primary" id="uu-gen">生成</button>
    <button type="button" class="uu-btn" id="uu-more">换一批</button>
    <button type="button" class="uu-btn" id="uu-copy-all">复制全部</button>
  </div>

  <div class="uu-quick">
    <span class="uu-quick-label">快捷：</span>
    <button type="button" class="uu-btn uu-btn-sm" data-type="uuid" id="uu-quick-uuid">UUID ×1</button>
    <button type="button" class="uu-btn uu-btn-sm" data-type="ulid" id="uu-quick-ulid">ULID ×1</button>
  </div>

  <div class="uu-status" id="uu-status" role="status"></div>
  <div class="uu-list" id="uu-list"></div>
</div>

<script src="/assets/tools/uuid-ulid/app.js?v=202609221" defer></script>
