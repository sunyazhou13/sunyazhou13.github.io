---
layout: page
title: Online Translator
icon: fas fa-language
lang: en
permalink: /tools/translator/
tool_css: /assets/tools/translator/app.css
---

Type text, pick a source and target language, and translate online between dozens of languages. This tool is **independent from the English-Chinese Dictionary** — it focuses on free multi-language translation and does not rely on a local dictionary. Translations are produced by third-party online services (Edge / Bing, MyMemory, etc.); do not enter sensitive content.

Features:

- **Multi-language**: 50+ languages built in (Chinese / English / Japanese / Korean / French / German / Spanish / Russian / Arabic / Thai / Vietnamese …), translate between any two
- **Auto-detect**: when the source is set to "Auto-detect", the script type (CJK / Latin / Cyrillic / Arabic …) is detected locally — no manual selection needed
- **4-engine side-by-side**: Baidu, Youdao, Edge and MyMemory translate **simultaneously and display side by side**, so you can compare them at a glance; each card has its own speak / copy buttons, and if one engine is unavailable the card shows why — the others are unaffected
- **Usage visible**: Baidu (chars / month) and Youdao (requests / day) free quotas are shown live; when exhausted it auto-switches to the free channels, so you never overpay
- **One-click**: swap languages, copy result, character count, text-to-speech for source / result (browser speech engine; Chinese / English additionally use Youdao / Baidu TTS)
- **Pure frontend**: all requests are made directly from the browser, no self-hosted backend

<div id="tr-app">

  <div class="tr-banner">
    <i class="fas fa-shield-alt"></i>
    <span>Online translation goes through third-party services (Edge / MyMemory, etc.), pure frontend; do not enter sensitive content</span>
  </div>

  <div class="tr-langbar">
    <select id="tr-from" class="tr-select" aria-label="Source language"></select>
    <button type="button" id="tr-swap" class="tr-swap" title="Swap languages" aria-label="Swap languages">
      <i class="fas fa-exchange-alt"></i>
    </button>
    <select id="tr-to" class="tr-select" aria-label="Target language"></select>
  </div>

  <div id="tr-usage" class="tr-usage"></div>

  <div class="tr-panel tr-source-panel">
    <div class="tr-panel-head">
      <span class="tr-langname">Source</span>
      <span class="tr-actions">
        <button type="button" id="tr-translate" class="tr-icon-btn tr-btn-primary" title="Translate" aria-label="Translate"><i class="fas fa-language"></i></button>
        <button type="button" id="tr-speak-in" class="tr-icon-btn" title="Speak" aria-label="Speak source"><i class="fas fa-volume-up"></i></button>
        <button type="button" id="tr-clear" class="tr-icon-btn" title="Clear" aria-label="Clear"><i class="fas fa-eraser"></i></button>
      </span>
    </div>
    <textarea id="tr-input" class="tr-input" placeholder="Type text to translate…" spellcheck="false"></textarea>
    <div class="tr-panel-foot">
      <span id="tr-count">0 chars</span>
      <span></span>
    </div>
  </div>

  <div id="tr-results" class="tr-results">
    <section class="tr-panel" data-card="baidu">
      <div class="tr-panel-head">
        <span class="tr-langname tr-badge tr-badge-baidu">Baidu Translate</span>
        <span class="tr-actions">
          <button type="button" data-speak class="tr-icon-btn" title="Speak" aria-label="Speak Baidu translation"><i class="fas fa-volume-up"></i></button>
          <button type="button" data-copy class="tr-icon-btn" title="Copy" aria-label="Copy Baidu translation"><i class="fas fa-copy"></i></button>
        </span>
      </div>
      <div data-out class="tr-output tr-placeholder">Waiting…</div>
      <div class="tr-panel-foot">
        <span data-status class="tr-source"></span>
        <span></span>
      </div>
    </section>
    <section class="tr-panel" data-card="youdao">
      <div class="tr-panel-head">
        <span class="tr-langname tr-badge tr-badge-youdao">Youdao</span>
        <span class="tr-actions">
          <button type="button" data-speak class="tr-icon-btn" title="Speak" aria-label="Speak Youdao translation"><i class="fas fa-volume-up"></i></button>
          <button type="button" data-copy class="tr-icon-btn" title="Copy" aria-label="Copy Youdao translation"><i class="fas fa-copy"></i></button>
        </span>
      </div>
      <div data-out class="tr-output tr-placeholder">Waiting…</div>
      <div class="tr-panel-foot">
        <span data-status class="tr-source"></span>
        <span></span>
      </div>
    </section>
    <section class="tr-panel" data-card="edge">
      <div class="tr-panel-head">
        <span class="tr-langname tr-badge tr-badge-edge">Edge</span>
        <span class="tr-actions">
          <button type="button" data-speak class="tr-icon-btn" title="Speak" aria-label="Speak Edge translation"><i class="fas fa-volume-up"></i></button>
          <button type="button" data-copy class="tr-icon-btn" title="Copy" aria-label="Copy Edge translation"><i class="fas fa-copy"></i></button>
        </span>
      </div>
      <div data-out class="tr-output tr-placeholder">Waiting…</div>
      <div class="tr-panel-foot">
        <span data-status class="tr-source"></span>
        <span></span>
      </div>
    </section>
    <section class="tr-panel" data-card="mymemory">
      <div class="tr-panel-head">
        <span class="tr-langname tr-badge tr-badge-mymemory">MyMemory</span>
        <span class="tr-actions">
          <button type="button" data-speak class="tr-icon-btn" title="Speak" aria-label="Speak MyMemory translation"><i class="fas fa-volume-up"></i></button>
          <button type="button" data-copy class="tr-icon-btn" title="Copy" aria-label="Copy MyMemory translation"><i class="fas fa-copy"></i></button>
        </span>
      </div>
      <div data-out class="tr-output tr-placeholder">Waiting…</div>
      <div class="tr-panel-foot">
        <span data-status class="tr-source"></span>
        <span></span>
      </div>
    </section>
  </div>

  <div id="tr-detect" class="tr-detect"></div>

  <div id="tr-error" class="tr-error"></div>

</div>

<script>/* key 集中配置在 _config.yml 的 api_keys.translate，构建时注入到此（须单行，compress_html 会合并换行） */ window.TR_KEYS = { baidu_app_id: '{{ site.api_keys.translate.baidu_app_id }}', baidu_key: '{{ site.api_keys.translate.baidu_key }}', youdao_app_key: '{{ site.api_keys.translate.youdao_app_key }}', youdao_key: '{{ site.api_keys.translate.youdao_key }}' };</script>
<script type="module" src="/assets/tools/translator/app.js?v=20260916u"></script>
