---
layout: page
title: Markdown 中文转英文（本地 Ollama）
icon: fas fa-language
tool_css: /assets/tools/md-translator/app.css?v=3
---

把写好的中文 Markdown 文章一键翻译成英文 Markdown，**全程在你自己的电脑上跑本地大模型（Ollama + Qwen2.5），不上传任何内容到外部网络**。专为写双语博客设计：自动保留代码块、front matter、链接与图片地址，术语可锁定不译。

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css">

<div id="mdt-app">

  <div class="mdt-toolbar">
    <button type="button" class="mdt-btn mdt-btn-primary" id="mdt-translate">翻译</button>
    <span class="mdt-divider" aria-hidden="true"></span>
    <button type="button" class="mdt-btn" id="mdt-sample">填入示例</button>
    <button type="button" class="mdt-btn" id="mdt-copy">复制</button>
    <button type="button" class="mdt-btn" id="mdt-download">保存到本地</button>
    <button type="button" class="mdt-btn" id="mdt-clear">清空</button>
  </div>

  <div class="mdt-drop" id="mdt-drop">📄 拖拽 .md 文件到这里，或点击选择文件 / 直接粘贴到下方输入框</div>
  <input type="file" id="mdt-file" class="mdt-file-input" accept=".md,.markdown,.txt">

  <div class="mdt-options">
    <label class="mdt-field">
      <span>模型（Ollama）</span>
      <input type="text" id="mdt-model" class="mdt-text" value="qwen2.5:7b" spellcheck="false" autocomplete="off">
    </label>
    <label class="mdt-field">
      <span>Ollama 地址</span>
      <input type="text" id="mdt-base" class="mdt-text" value="http://localhost:11434" spellcheck="false" autocomplete="off">
    </label>
    <label class="mdt-field">
      <span>翻译风格</span>
      <select id="mdt-style" class="mdt-select">
        <option value="natural">流畅地道</option>
        <option value="tech">技术文档（术语统一）</option>
      </select>
    </label>
    <label class="mdt-field" style="flex: 1 1 280px;">
      <span>术语保护（逗号分隔，翻译时锁定不译）</span>
      <textarea id="mdt-glossary" class="mdt-glossary" placeholder="例如：KVO, KVC, Codable, GCD, SwiftUI, closure">KVO, KVC, Codable, GCD, SwiftUI, closure, Combine, Actor</textarea>
    </label>
  </div>

  <div class="mdt-grid">
    <div class="mdt-pane">
      <div class="mdt-pane-label"><span>中文 Markdown（输入）</span></div>
      <textarea id="mdt-input" class="mdt-input" placeholder="在此粘贴中文 Markdown，或拖入 / 粘贴 .md 文件…" spellcheck="false"></textarea>
    </div>
    <div class="mdt-pane">
      <div class="mdt-pane-label"><span>英文 Markdown（输出）</span></div>
      <textarea id="mdt-output" class="mdt-output" placeholder="翻译结果将显示在这里…" spellcheck="false" readonly></textarea>
    </div>
  </div>

  <div class="mdt-status" id="mdt-status"></div>
  <div class="mdt-progress" id="mdt-progress" style="display:none;">
    <div class="mdt-progress-bar-track"><div class="mdt-progress-bar-fill" id="mdt-progress-fill"></div></div>
    <div class="mdt-progress-label" id="mdt-progress-label"></div>
  </div>

  <div class="mdt-note">
    <strong>使用前准备（只需一次）：</strong><br>
    1. 安装 Ollama：<code>brew install ollama</code>（macOS 上会自动启动 serve 服务）<br>
    2. 启动服务（若未自动起来）：<code>ollama serve</code> 后台运行，提供 API 给 pull/run 调用<br>
    3. 拉取模型：<code>ollama pull qwen2.5:7b</code>（小机器用 <code>qwen2.5:3b</code>）—— pull 是客户端命令，会自动连 <code>localhost:11434</code> 下载权重到本机 <code>~/.ollama</code><br>
    <strong>顺序：必须先 serve 后 pull</strong>（因为 pull 要调用 serve 的 API；macOS 上 brew install 后 serve 通常已自启，可跳过第 2 步直接 pull）<br>
    4. 在浏览器通过 <code>jekyll serve</code> 本地地址（<code>http://127.0.0.1:4000</code>）打开本页，浏览器才能连 localhost 的 Ollama<br>
    <br>
    <strong>保护规则：</strong>front matter 只翻译 title / description；围栏代码块 <code>```</code>、行内代码、链接与图片 URL 原样保留；术语表中的词锁定不译。翻译完成后点高亮的「保存到本地」即可：Chrome / Edge 会弹**系统原生保存对话框**直接选目录写盘；Safari / Firefox 暂不支持，会落到默认下载目录（再手动移到 <code>_posts/en/</code>）。文件名自动用 front matter 里的日期 + 英文 slug。
  </div>

</div>

<script src="/assets/tools/md-translator/app.js?v=2"></script>
