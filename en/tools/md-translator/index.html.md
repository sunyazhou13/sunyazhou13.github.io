---
layout: page
title: Markdown CN → EN (Local Ollama)
icon: fas fa-language
lang: en
permalink: /tools/md-translator/
tool_css: /assets/tools/md-translator/app.css?v=3
---

Translate your Chinese Markdown post into English Markdown **entirely on your own machine with a local model (Ollama + Qwen2.5) — nothing is uploaded to any external server**. Built for bilingual blogging: code blocks, front matter, links and image URLs are preserved automatically, and glossary terms can be locked from translation.

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css">

<div id="mdt-app">

  <div class="mdt-toolbar">
    <button type="button" class="mdt-btn mdt-btn-primary" id="mdt-translate">Translate</button>
    <span class="mdt-divider" aria-hidden="true"></span>
    <button type="button" class="mdt-btn" id="mdt-sample">Load Sample</button>
    <button type="button" class="mdt-btn" id="mdt-copy">Copy</button>
    <button type="button" class="mdt-btn" id="mdt-download">Save Locally</button>
    <button type="button" class="mdt-btn" id="mdt-clear">Clear</button>
  </div>

  <div class="mdt-drop" id="mdt-drop">📄 Drop a .md file here, or click to choose / paste into the input below</div>
  <input type="file" id="mdt-file" class="mdt-file-input" accept=".md,.markdown,.txt">

  <div class="mdt-options">
    <label class="mdt-field">
      <span>Model (Ollama)</span>
      <input type="text" id="mdt-model" class="mdt-text" value="qwen2.5:7b" spellcheck="false" autocomplete="off">
    </label>
    <label class="mdt-field">
      <span>Ollama URL</span>
      <input type="text" id="mdt-base" class="mdt-text" value="http://localhost:11434" spellcheck="false" autocomplete="off">
    </label>
    <label class="mdt-field">
      <span>Style</span>
      <select id="mdt-style" class="mdt-select">
        <option value="natural">Fluent & natural</option>
        <option value="tech">Technical (consistent terms)</option>
      </select>
    </label>
    <label class="mdt-field" style="flex: 1 1 280px;">
      <span>Locked glossary (comma-separated, never translated)</span>
      <textarea id="mdt-glossary" class="mdt-glossary" placeholder="e.g. KVO, KVC, Codable, GCD, SwiftUI, closure">KVO, KVC, Codable, GCD, SwiftUI, closure, Combine, Actor</textarea>
    </label>
  </div>

  <div class="mdt-grid">
    <div class="mdt-pane">
      <div class="mdt-pane-label"><span>Chinese Markdown (input)</span></div>
      <textarea id="mdt-input" class="mdt-input" placeholder="Paste Chinese Markdown here, or drop / paste a .md file…" spellcheck="false"></textarea>
    </div>
    <div class="mdt-pane">
      <div class="mdt-pane-label"><span>English Markdown (output)</span></div>
      <textarea id="mdt-output" class="mdt-output" placeholder="Translation will appear here…" spellcheck="false" readonly></textarea>
    </div>
  </div>

  <div class="mdt-status" id="mdt-status"></div>
  <div class="mdt-progress" id="mdt-progress" style="display:none;">
    <div class="mdt-progress-bar-track"><div class="mdt-progress-bar-fill" id="mdt-progress-fill"></div></div>
    <div class="mdt-progress-label" id="mdt-progress-label"></div>
  </div>

  <div class="mdt-note">
    <strong>One-time setup:</strong><br>
    1. Install Ollama: <code>brew install ollama</code> (on macOS it auto-starts the serve service)<br>
    2. Start the service if it didn't auto-start: <code>ollama serve</code> in the background — it provides the API that pull/run call<br>
    3. Pull a model: <code>ollama pull qwen2.5:7b</code> (or <code>qwen2.5:3b</code> on smaller machines) — <code>pull</code> is a client command that connects to <code>localhost:11434</code> and downloads weights to <code>~/.ollama</code><br>
    <strong>Order: serve first, then pull</strong> (pull calls serve's API; on macOS, brew install usually auto-starts serve so you can skip step 2 and pull directly)<br>
    4. Open this page via your <code>jekyll serve</code> local address (<code>http://127.0.0.1:4000</code>) so the browser can reach localhost's Ollama<br>
    <br>
    <strong>What is preserved:</strong> only <code>title</code> / <code>description</code> in front matter are translated; fenced code blocks <code>```</code>, inline code, and link/image URLs stay intact; glossary terms are locked. When translation finishes, click the highlighted "Save Locally" — Chrome / Edge will pop the **native system save dialog** so you can pick any folder and write the file directly; Safari / Firefox fall back to the default download folder (then move it to <code>_posts/en/</code>). The file is auto-named with the date + English slug from the front matter.
  </div>

</div>

<script src="/assets/tools/md-translator/app.js?v=2"></script>
