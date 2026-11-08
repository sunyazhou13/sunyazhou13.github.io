---
layout: page
title: 进制转换
icon: fas fa-calculator
tool_css: /assets/tools/base-converter/app.css?v=4
---

二进制、八进制、十进制、十六进制四进制**实时联动**转换：在任意一个输入框中输入数字，其余进制自动更新。所有计算都在浏览器本地完成，**输入不会上传到任何服务器**。

几点说明：

- 实时联动：在任一进制输入框中输入，其它三个进制自动转换
- 支持任意位数的整数（BigInt 计算），支持正负数
- 可粘贴带前缀写法：十六进制 `0x`、二进制 `0b`、八进制 `0o`（不带头直接输入也可以）
- 每个输入框可一键复制结果
- 非法输入（如二进制里出现 `2`）会明确提示原因

<div id="bc-app">

  <div class="bc-banner">
    <span class="bc-hint">四进制实时联动，纯本地计算，输入不会上传</span>
  </div>

  <div class="bc-grid">

    <div class="bc-field">
      <label class="bc-label" for="bc-bin"><span class="bc-dot bc-dot-red"></span>二进制 <span class="bc-sub">Bin</span></label>
      <div class="bc-row">
        <input type="text" id="bc-bin" class="bc-input" placeholder="二进制，如 1010" spellcheck="false" autocomplete="off">
        <button type="button" class="bc-btn bc-btn-copy" data-copy="bc-bin" title="复制二进制结果">复制</button>
      </div>
    </div>

    <div class="bc-field">
      <label class="bc-label" for="bc-oct"><span class="bc-dot bc-dot-orange"></span>八进制 <span class="bc-sub">Oct</span></label>
      <div class="bc-row">
        <input type="text" id="bc-oct" class="bc-input" placeholder="八进制，如 12" spellcheck="false" autocomplete="off">
        <button type="button" class="bc-btn bc-btn-copy" data-copy="bc-oct" title="复制八进制结果">复制</button>
      </div>
    </div>

    <div class="bc-field">
      <label class="bc-label" for="bc-dec"><span class="bc-dot bc-dot-green"></span>十进制 <span class="bc-sub">Dec</span></label>
      <div class="bc-row">
        <input type="text" id="bc-dec" class="bc-input" placeholder="十进制，如 10" spellcheck="false" autocomplete="off">
        <button type="button" class="bc-btn bc-btn-copy" data-copy="bc-dec" title="复制十进制结果">复制</button>
      </div>
    </div>

    <div class="bc-field">
      <label class="bc-label" for="bc-hex"><span class="bc-dot bc-dot-blue"></span>十六进制 <span class="bc-sub">Hex</span></label>
      <div class="bc-row">
        <input type="text" id="bc-hex" class="bc-input" placeholder="十六进制，如 a" spellcheck="false" autocomplete="off">
        <button type="button" class="bc-btn bc-btn-copy" data-copy="bc-hex" title="复制十六进制结果">复制</button>
      </div>
    </div>

  </div>

  <div class="bc-error" id="bc-error" hidden></div>

</div>

<script type="module" src="/assets/tools/base-converter/app.js?v=202609221"></script>
