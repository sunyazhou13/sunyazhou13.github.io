---
layout: page
title: 多语在线翻译
icon: fas fa-language
tool_css: /assets/tools/translator/app.css
---

输入文字，选择源语言与目标语言，即可在线翻译成多国语言。与「英汉智能词典」相互独立——本工具专注**多语种自由互译**，不依赖本地词库。翻译经第三方在线服务（Edge / Bing、MyMemory 等）完成，请勿输入敏感内容。

功能说明：

- **多语互译**：内置 50+ 种语言（中 / 英 / 日 / 韩 / 法 / 德 / 西 / 俄 / 阿 / 泰 / 越 …），任意两语言之间互译
- **自动检测**：源语言选「自动检测」时，按字符类型（中日韩 / 拉丁 / 西里尔 / 阿拉伯 …）本地识别语种，无需手动选择
- **四引擎对照**：输入文本后，百度、有道、Edge、MyMemory 四路通道**同时翻译、并排展示**，随时对比各家译文；每张卡片可单独朗读 / 复制，某一路不可用时卡片状态区会说明原因，其它平台不受影响
- **用量透明**：界面实时显示百度（字符 / 月）与有道（请求 / 天）免费额度，触顶自动切回免费通道，杜绝超额扣费
- **一键操作**：语言互换、复制译文、字符计数、源 / 译文真人发音（浏览器语音引擎，中文 / 英文额外走有道 / 百度 TTS）
- **纯前端**：所有请求直接在浏览器发起，无自建后端

<div id="tr-app">

  <div class="tr-banner">
    <i class="fas fa-shield-alt"></i>
    <span>在线翻译经第三方翻译服务（Edge / MyMemory 等），纯前端直连；请勿输入敏感内容</span>
  </div>

  <div class="tr-langbar">
    <select id="tr-from" class="tr-select" aria-label="源语言"></select>
    <button type="button" id="tr-swap" class="tr-swap" title="互换语言" aria-label="互换语言">
      <i class="fas fa-exchange-alt"></i>
    </button>
    <select id="tr-to" class="tr-select" aria-label="目标语言"></select>
  </div>

  <div id="tr-usage" class="tr-usage"></div>

  <div class="tr-panel tr-source-panel">
    <div class="tr-panel-head">
      <span class="tr-langname">源文本</span>
      <span class="tr-actions">
        <button type="button" id="tr-translate" class="tr-icon-btn tr-btn-primary" title="翻译" aria-label="翻译"><i class="fas fa-language"></i></button>
        <button type="button" id="tr-speak-in" class="tr-icon-btn" title="朗读" aria-label="朗读源文本"><i class="fas fa-volume-up"></i></button>
        <button type="button" id="tr-clear" class="tr-icon-btn" title="清空" aria-label="清空"><i class="fas fa-eraser"></i></button>
      </span>
    </div>
    <textarea id="tr-input" class="tr-input" placeholder="输入要翻译的文字…" spellcheck="false"></textarea>
    <div class="tr-panel-foot">
      <span id="tr-count">0 字</span>
      <span></span>
    </div>
  </div>

  <div id="tr-results" class="tr-results">
    <section class="tr-panel" data-card="baidu">
      <div class="tr-panel-head">
        <span class="tr-langname tr-badge tr-badge-baidu">百度翻译</span>
        <span class="tr-actions">
          <button type="button" data-speak class="tr-icon-btn" title="朗读" aria-label="朗读百度译文"><i class="fas fa-volume-up"></i></button>
          <button type="button" data-copy class="tr-icon-btn" title="复制" aria-label="复制百度译文"><i class="fas fa-copy"></i></button>
        </span>
      </div>
      <div data-out class="tr-output tr-placeholder">等待翻译…</div>
      <div class="tr-panel-foot">
        <span data-status class="tr-source"></span>
        <span></span>
      </div>
    </section>
    <section class="tr-panel" data-card="youdao">
      <div class="tr-panel-head">
        <span class="tr-langname tr-badge tr-badge-youdao">有道智云</span>
        <span class="tr-actions">
          <button type="button" data-speak class="tr-icon-btn" title="朗读" aria-label="朗读有道译文"><i class="fas fa-volume-up"></i></button>
          <button type="button" data-copy class="tr-icon-btn" title="复制" aria-label="复制有道译文"><i class="fas fa-copy"></i></button>
        </span>
      </div>
      <div data-out class="tr-output tr-placeholder">等待翻译…</div>
      <div class="tr-panel-foot">
        <span data-status class="tr-source"></span>
        <span></span>
      </div>
    </section>
    <section class="tr-panel" data-card="edge">
      <div class="tr-panel-head">
        <span class="tr-langname tr-badge tr-badge-edge">Edge</span>
        <span class="tr-actions">
          <button type="button" data-speak class="tr-icon-btn" title="朗读" aria-label="朗读 Edge 译文"><i class="fas fa-volume-up"></i></button>
          <button type="button" data-copy class="tr-icon-btn" title="复制" aria-label="复制 Edge 译文"><i class="fas fa-copy"></i></button>
        </span>
      </div>
      <div data-out class="tr-output tr-placeholder">等待翻译…</div>
      <div class="tr-panel-foot">
        <span data-status class="tr-source"></span>
        <span></span>
      </div>
    </section>
    <section class="tr-panel" data-card="mymemory">
      <div class="tr-panel-head">
        <span class="tr-langname tr-badge tr-badge-mymemory">MyMemory</span>
        <span class="tr-actions">
          <button type="button" data-speak class="tr-icon-btn" title="朗读" aria-label="朗读 MyMemory 译文"><i class="fas fa-volume-up"></i></button>
          <button type="button" data-copy class="tr-icon-btn" title="复制" aria-label="复制 MyMemory 译文"><i class="fas fa-copy"></i></button>
        </span>
      </div>
      <div data-out class="tr-output tr-placeholder">等待翻译…</div>
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