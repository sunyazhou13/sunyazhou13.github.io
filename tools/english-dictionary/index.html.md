---
layout: page
title: 英汉智能词典
icon: fas fa-book
tool_css: /assets/tools/english-dictionary/app.css
---

输入英文单词或中文，自动识别语言并翻译查词。内置 ECDICT 339 万词条本地词库，可一键下载全量缓存到浏览器离线使用。在线 API 补充详细释义与例句。查词释义主要基于本地 ECDICT 词库与在线词典；在线翻译会将词句送至第三方翻译服务（Edge / MyMemory 等），请勿输入敏感内容。

功能说明：

- **智能识别**：输入英文自动查词释义并翻译成中文，输入中文自动翻译成英文并查词——中英双向互译
- **全量词库**：339 万词条按首字母分 26 片，查词时按需下载对应分片并缓存；也可点击「下载完整词库」一次性下载全部分片到浏览器 IndexedDB，之后离线可查
- **分类标注**：标注词性（名词 / 动词 / 形容词等）、考试等级（中考 / 高考 / 四级 / 六级 / 考研 / 托福 / 雅思 / GRE）、专业领域（[医] / [计] / [化] / [法] 等）、Collins 星级、牛津 3000 核心词
- **发音**：四级策略——优先真人发音音频 → 有道词典 TTS → 百度翻译 TTS → 浏览器语音引擎兜底，全程国内可直连
- **双保险**：API 不可用时自动降级到本地词库，本地没有时 API 兜底

<div id="ed-app">

  <div class="ed-banner" id="ed-banner">
    <i class="fas fa-shield-alt"></i>
    <span>本地词库 + 在线词典双保险，离线优先；在线翻译经第三方翻译服务</span>
  </div>

  <div class="ed-download-bar">
    <button type="button" class="ed-btn-download" id="ed-download-btn">
      <i class="fas fa-cloud-download-alt"></i>
      <span>下载完整词库</span>
    </button>
    <button type="button" class="ed-btn-clear" id="ed-clear-btn" hidden>
      <i class="fas fa-broom"></i>
      <span>清除缓存</span>
    </button>
    <span class="ed-download-hint">约 235MB，下载后离线可用</span>
  </div>

  <div id="ed-download-wrap" hidden>
    <div class="ed-download-progress" id="ed-download-progress"></div>
  </div>

  <div class="ed-search-wrap">
    <input type="text" id="ed-input" class="ed-input" autocomplete="off" spellcheck="false" placeholder="输入英文单词或中文，回车查询…">
    <button type="button" class="ed-btn-search" id="ed-search">
      <i class="fas fa-search"></i>
      <span>查词</span>
    </button>
  </div>

  <div class="ed-results" id="ed-results">
    <div class="ed-placeholder" id="ed-placeholder">输入单词或中文，按回车或点击「查词」</div>
    <div class="ed-loading" id="ed-loading" hidden>正在查询</div>
    <div class="ed-content" id="ed-content" hidden></div>
  </div>

</div>

<script type="module" src="/assets/tools/english-dictionary/app.js?v=20260915"></script>
