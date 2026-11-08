---
layout: page
title: 时间戳转换
icon: fas fa-clock
tool_css: /assets/tools/timestamp/app.css?v=202609221
---

实时显示当前日期时间（精确到毫秒），支持 Unix 时间戳与日期互转，自动识别秒 / 毫秒 / 微秒 / Apple Double 格式，显示相对时间。提供多时区时钟、快捷预设、历史记录、RFC 2822 输出。提供 Swift / Objective-C 获取时间戳的 API 示例。所有计算均在浏览器本地完成。

几点说明：

- **实时时钟**：每 50ms 刷新，显示本地时间、UTC、ISO 8601、RFC 2822，以及 Unix 秒 / 毫秒 / 微秒 / Apple Double
- **多时区**：默认显示本地时间和 UTC；可搜索 / 按洲选择 100+ 城市时区（支持中文、英文与 IANA 时区名），或点「定位我的时区」自动检测所在位置（授权失败时回退设备时区），全部在浏览器本地完成
- **快捷预设**：一键填入「当前时间」「一天前」「本月月初」「Unix 纪元 (0)」「2038 年问题」
- **时间戳 → 日期**：自动识别格式（10 位秒 / 13 位毫秒 / 16 位微秒 / Apple Double），输出本地时间、UTC、ISO 8601、RFC 2822、相对时间
- **日期 → 时间戳**：选择日期时间（可选毫秒），输出 Unix 秒 / 毫秒 / 微秒 / Apple Double / ISO 8601 / RFC 2822
- **历史记录**：自动保存最近转换，点击可快速回填
- **代码示例**：Swift 和 Objective-C 获取时间戳、时间戳转 Date、格式化字符串、ISO8601 等常用 API

<div id="ts-app">

  <!-- 实时时钟 -->
  <div class="ts-clock">
    <div class="ts-clock-main">
      <div class="ts-clock-date" id="ts-now-date"></div>
      <div>
        <span class="ts-clock-time" id="ts-now-time">--:--:--</span><span class="ts-clock-ms" id="ts-now-ms"></span>
      </div>
      <div class="ts-clock-row">
        <div class="ts-clock-ts-item"><span class="ts-clock-ts-label">秒</span><code class="ts-clock-ts-val" id="ts-now-ts"></code></div>
        <div class="ts-clock-ts-item"><span class="ts-clock-ts-label">毫秒</span><code class="ts-clock-ts-val" id="ts-now-ts-ms"></code></div>
        <div class="ts-clock-ts-item"><span class="ts-clock-ts-label">微秒</span><code class="ts-clock-ts-val" id="ts-now-ts-us"></code></div>
        <div class="ts-clock-ts-item"><span class="ts-clock-ts-label">Apple</span><code class="ts-clock-ts-val" id="ts-now-ts-apple"></code></div>
      </div>
      <code class="ts-clock-iso" id="ts-now-iso"></code>
      <code class="ts-clock-iso" id="ts-now-rfc"></code>
      <button type="button" class="ts-btn ts-btn-copy ts-clock-copy" id="ts-copy-now">复制 Apple 时间戳</button>
    </div>
    <div class="ts-tz-section">
      <div class="ts-tz-header">
        <span>多时区</span>
        <select class="ts-tz-select" id="ts-add-tz">
          <option value="" disabled selected>添加时区…</option>
        </select>
        <button type="button" class="ts-btn ts-btn-sm ts-btn-locate" id="ts-locate">定位我的时区</button>
      </div>
      <div class="ts-tz-search-row">
        <input type="text" class="ts-tz-search" id="ts-tz-search" placeholder="搜索城市或时区…" spellcheck="false" autocomplete="off">
        <button type="button" class="ts-btn ts-btn-sm" id="ts-tz-add-btn">添加</button>
      </div>
      <div class="ts-tz-list">
        <div class="ts-tz-item" data-tz="Local"><span class="ts-tz-name">本地</span><code class="ts-tz-val" id="ts-tz-local">--</code></div>
        <div class="ts-tz-item" data-tz="UTC"><span class="ts-tz-name">UTC</span><code class="ts-tz-val" id="ts-tz-utc">--</code></div>
        <div id="ts-tz-custom"></div>
      </div>
    </div>
  </div>

  <!-- 快捷预设 -->
  <div class="ts-presets" id="ts-presets">
    <button type="button" class="ts-preset-btn" data-preset="now">当前时间</button>
    <button type="button" class="ts-preset-btn" data-preset="1d">一天前</button>
    <button type="button" class="ts-preset-btn" data-preset="bom">本月月初</button>
    <button type="button" class="ts-preset-btn" data-preset="epoch">Unix 纪元 (0)</button>
    <button type="button" class="ts-preset-btn" data-preset="2038">2038 年问题</button>
  </div>

  <!-- 时间戳 → 日期 -->
  <div class="ts-panel">
    <h2 class="ts-title">时间戳 → 日期</h2>
    <p class="ts-hint">输入时间戳（自动识别秒 / 毫秒 / 微秒 / Apple Double 如 <code>1692800123.456</code>）</p>
    <div class="ts-row">
      <input type="text" class="ts-input" id="ts-input" placeholder="1692800123.456 或 1692800123 或 1692800123456 或 1692800123456000" spellcheck="false" autocomplete="off">
      <button type="button" class="ts-btn ts-btn-primary" id="ts-convert">转换</button>
    </div>
    <div class="ts-result" id="ts-result"></div>
  </div>

  <!-- 日期 → 时间戳 -->
  <div class="ts-panel">
    <h2 class="ts-title">日期 → 时间戳</h2>
    <div class="ts-row">
      <label class="ts-label" for="ts-date-input">日期</label>
      <input type="date" class="ts-date-input" id="ts-date-input">
      <label class="ts-label" for="ts-time-input">时间</label>
      <input type="time" class="ts-date-input" id="ts-time-input" step="1" value="00:00:00">
      <label class="ts-label" for="ts-ms-input">毫秒</label>
      <input type="number" class="ts-date-input" id="ts-ms-input" min="0" max="999" value="0" style="width:5rem">
      <button type="button" class="ts-btn ts-btn-primary" id="ts-date-convert">转换</button>
    </div>
    <div class="ts-result" id="ts-date-result"></div>
  </div>

  <!-- 历史记录 -->
  <div class="ts-history" id="ts-history">
    <div class="ts-history-header">
      <span class="ts-history-title">历史记录</span>
      <button type="button" class="ts-btn ts-btn-sm" id="ts-history-clear">清空</button>
    </div>
    <div class="ts-history-list" id="ts-history-list">
      <div class="ts-history-empty">暂无转换记录</div>
    </div>
  </div>

  <!-- 代码片段 -->
  <div class="ts-panel">
    <h2 class="ts-title">API 示例</h2>
    <div class="ts-tabs" id="ts-code-tabs">
      <button type="button" class="ts-tab ts-tab-active" data-lang="swift">Swift</button>
      <button type="button" class="ts-tab" data-lang="objc">Objective-C</button>
    </div>
    <pre class="ts-code-block"><code id="ts-code-output"></code></pre>
    <button type="button" class="ts-btn ts-btn-copy" id="ts-copy-code">复制代码</button>
  </div>

  <div class="ts-error" id="ts-error" hidden></div>

</div>

<script type="module" src="/assets/tools/timestamp/app.js?v=202609221"></script>
