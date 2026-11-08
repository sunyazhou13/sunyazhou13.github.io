---
layout: page
title: Timestamp Converter
icon: fas fa-clock
lang: en
permalink: /tools/timestamp/
tool_css: /assets/tools/timestamp/app.css?v=202609221
---

Real-time clock with millisecond precision, Unix timestamp ↔ date conversion with auto-detection of seconds / milliseconds / microseconds / Apple Double formats, plus relative time display. Multi-timezone clock, quick presets, history, RFC 2822 output, and Swift / Objective-C API examples. All processing is local in your browser.

Notes:

- **Real-time clock**: refreshes every 50ms, showing local time, UTC, ISO 8601, RFC 2822, and Unix seconds / milliseconds / microseconds / Apple Double
- **Multi-timezone**: shows local and UTC by default; search or pick from 100+ city timezones grouped by region (Chinese, English and IANA names supported), or click "Locate my timezone" to auto-detect your location (falls back to the device timezone if permission is denied) — all done locally in your browser
- **Quick presets**: one-click fill for "Now", "1 day ago", "Start of month", "Unix Epoch (0)", "Year 2038 Bug"
- **Timestamp → Date**: auto-detects format (10-digit seconds / 13-digit milliseconds / 16-digit microseconds / Apple Double), outputs local time, UTC, ISO 8601, RFC 2822, relative time
- **Date → Timestamp**: pick date and time (optional milliseconds), outputs Unix seconds / milliseconds / microseconds / Apple Double / ISO 8601 / RFC 2822
- **History**: auto-saves recent conversions, click to re-fill
- **Code examples**: Swift and Objective-C APIs for getting timestamps, converting timestamps to Date, formatting strings, ISO8601

<div id="ts-app">

  <!-- Real-time clock -->
  <div class="ts-clock">
    <div class="ts-clock-main">
      <div class="ts-clock-date" id="ts-now-date"></div>
      <div>
        <span class="ts-clock-time" id="ts-now-time">--:--:--</span><span class="ts-clock-ms" id="ts-now-ms"></span>
      </div>
      <div class="ts-clock-row">
        <div class="ts-clock-ts-item"><span class="ts-clock-ts-label">sec</span><code class="ts-clock-ts-val" id="ts-now-ts"></code></div>
        <div class="ts-clock-ts-item"><span class="ts-clock-ts-label">ms</span><code class="ts-clock-ts-val" id="ts-now-ts-ms"></code></div>
        <div class="ts-clock-ts-item"><span class="ts-clock-ts-label">μs</span><code class="ts-clock-ts-val" id="ts-now-ts-us"></code></div>
        <div class="ts-clock-ts-item"><span class="ts-clock-ts-label">Apple</span><code class="ts-clock-ts-val" id="ts-now-ts-apple"></code></div>
      </div>
      <code class="ts-clock-iso" id="ts-now-iso"></code>
      <code class="ts-clock-iso" id="ts-now-rfc"></code>
      <button type="button" class="ts-btn ts-btn-copy ts-clock-copy" id="ts-copy-now">Copy Apple Timestamp</button>
    </div>
<div class="ts-tz-section">
      <div class="ts-tz-header">
        <span>Timezones</span>
        <select class="ts-tz-select" id="ts-add-tz">
          <option value="" disabled selected>Add timezone…</option>
        </select>
        <button type="button" class="ts-btn ts-btn-sm ts-btn-locate" id="ts-locate">Locate my timezone</button>
      </div>
      <div class="ts-tz-search-row">
        <input type="text" class="ts-tz-search" id="ts-tz-search" placeholder="Search city or timezone…" spellcheck="false" autocomplete="off">
        <button type="button" class="ts-btn ts-btn-sm" id="ts-tz-add-btn">Add</button>
      </div>
      <div class="ts-tz-list">
        <div class="ts-tz-item" data-tz="Local"><span class="ts-tz-name">Local</span><code class="ts-tz-val" id="ts-tz-local">--</code></div>
        <div class="ts-tz-item" data-tz="UTC"><span class="ts-tz-name">UTC</span><code class="ts-tz-val" id="ts-tz-utc">--</code></div>
        <div id="ts-tz-custom"></div>
      </div>
    </div>
  </div>

  <!-- Quick presets -->
  <div class="ts-presets" id="ts-presets">
    <button type="button" class="ts-preset-btn" data-preset="now">Now</button>
    <button type="button" class="ts-preset-btn" data-preset="1d">1 day ago</button>
    <button type="button" class="ts-preset-btn" data-preset="bom">Start of month</button>
    <button type="button" class="ts-preset-btn" data-preset="epoch">Unix Epoch (0)</button>
    <button type="button" class="ts-preset-btn" data-preset="2038">Year 2038 Bug</button>
  </div>

  <!-- Timestamp → Date -->
  <div class="ts-panel">
    <h2 class="ts-title">Timestamp → Date</h2>
    <p class="ts-hint">Enter a timestamp (auto-detect: seconds / milliseconds / microseconds / Apple Double like <code>1692800123.456</code>)</p>
    <div class="ts-row">
      <input type="text" class="ts-input" id="ts-input" placeholder="1692800123.456 or 1692800123 or 1692800123456 or 1692800123456000" spellcheck="false" autocomplete="off">
      <button type="button" class="ts-btn ts-btn-primary" id="ts-convert">Convert</button>
    </div>
    <div class="ts-result" id="ts-result"></div>
  </div>

  <!-- Date → Timestamp -->
  <div class="ts-panel">
    <h2 class="ts-title">Date → Timestamp</h2>
    <div class="ts-row">
      <label class="ts-label" for="ts-date-input">Date</label>
      <input type="date" class="ts-date-input" id="ts-date-input">
      <label class="ts-label" for="ts-time-input">Time</label>
      <input type="time" class="ts-date-input" id="ts-time-input" step="1" value="00:00:00">
      <label class="ts-label" for="ts-ms-input">ms</label>
      <input type="number" class="ts-date-input" id="ts-ms-input" min="0" max="999" value="0" style="width:5rem">
      <button type="button" class="ts-btn ts-btn-primary" id="ts-date-convert">Convert</button>
    </div>
    <div class="ts-result" id="ts-date-result"></div>
  </div>

  <!-- History -->
  <div class="ts-history" id="ts-history">
    <div class="ts-history-header">
      <span class="ts-history-title">History</span>
      <button type="button" class="ts-btn ts-btn-sm" id="ts-history-clear">Clear</button>
    </div>
    <div class="ts-history-list" id="ts-history-list">
      <div class="ts-history-empty">No conversion history yet</div>
    </div>
  </div>

  <!-- Code examples -->
  <div class="ts-panel">
    <h2 class="ts-title">API Examples</h2>
    <div class="ts-tabs" id="ts-code-tabs">
      <button type="button" class="ts-tab ts-tab-active" data-lang="swift">Swift</button>
      <button type="button" class="ts-tab" data-lang="objc">Objective-C</button>
    </div>
    <pre class="ts-code-block"><code id="ts-code-output"></code></pre>
    <button type="button" class="ts-btn ts-btn-copy" id="ts-copy-code">Copy Code</button>
  </div>

  <div class="ts-error" id="ts-error" hidden></div>

</div>

<script type="module" src="/assets/tools/timestamp/app.js?v=202609221"></script>
