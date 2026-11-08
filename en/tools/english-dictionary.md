---
layout: page
title: English-Chinese Smart Dictionary
icon: fas fa-book
lang: en
permalink: /tools/english-dictionary/
tool_css: /assets/tools/english-dictionary/app.css
---

Enter an English word or Chinese text — the tool auto-detects the language and looks it up. A built-in local dictionary with 3.4M entries can be fully downloaded and cached in the browser for offline use. Online APIs enrich with detailed definitions and examples. Definitions are mainly based on the local ECDICT dictionary and online dictionaries; online translation sends your text to third-party translation services (Edge / MyMemory, etc.). Do not enter sensitive content.

Features:

- **Smart detection**: English input triggers word lookup; Chinese input is translated to English and then looked up
- **Full dictionary**: 3.4M entries sharded by first letter. Download on-demand per shard, or click "Download Full Dictionary" to cache all 26 shards in IndexedDB for offline use
- **Annotations**: Part of speech (noun / verb / adj. etc.), exam levels (CET-4 / CET-6 / TOEFL / IELTS / GRE), professional fields ([Medical] / [Computing] / [Chemistry] / [Law] etc.), Collins star rating, Oxford 3000 core words
- **Pronunciation**: Four-tier strategy — real human audio first → Youdao dictionary TTS → Baidu Translate TTS → browser speech engine fallback
- **Dual safety net**: When the API is unavailable, falls back to the local dictionary; when the local dictionary lacks an entry, the API fills the gap

<div id="ed-app">

  <div class="ed-banner" id="ed-banner">
    <i class="fas fa-shield-alt"></i>
    <span>Local dictionary + online dictionaries — offline first; online translation goes through third-party services</span>
  </div>

  <div class="ed-download-bar">
    <button type="button" class="ed-btn-download" id="ed-download-btn">
      <i class="fas fa-cloud-download-alt"></i>
      <span>Download Full Dictionary</span>
    </button>
    <button type="button" class="ed-btn-clear" id="ed-clear-btn" hidden>
      <i class="fas fa-broom"></i>
      <span>Clear Cache</span>
    </button>
    <span class="ed-download-hint">~235MB, enables offline lookup</span>
  </div>

  <div id="ed-download-wrap" hidden>
    <div class="ed-download-progress" id="ed-download-progress"></div>
  </div>

  <div class="ed-search-wrap">
    <input type="text" id="ed-input" class="ed-input" autocomplete="off" spellcheck="false" placeholder="Enter an English word or Chinese text, then press Enter…">
    <button type="button" class="ed-btn-search" id="ed-search">
      <i class="fas fa-search"></i>
      <span>Look up</span>
    </button>
  </div>

  <div class="ed-results" id="ed-results">
    <div class="ed-placeholder" id="ed-placeholder">Enter a word or Chinese text, then press Enter or click "Look up"</div>
    <div class="ed-loading" id="ed-loading" hidden>Looking up</div>
    <div class="ed-content" id="ed-content" hidden></div>
  </div>

</div>

<script type="module" src="/assets/tools/english-dictionary/app.js?v=20260915"></script>
