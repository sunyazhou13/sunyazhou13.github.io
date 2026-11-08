---
layout: page
title: 二维码
icon: fas fa-qrcode
tool_css: /assets/tools/qrcode/app.css?v=202609221
---

文本生成二维码、从图片解析二维码文本，双向互转。所有处理都在浏览器本地完成，**图片与文本不会上传到任何服务器**。

几点说明：

- 生成：输入任意文本，点击「生成二维码」，可选的纠错级别越高、二维码越耐脏/越抗遮挡（容量相应变小）
- 生成后可直接「下载 PNG」；旁边会显示二维码的版本与模块尺寸
- 解析：选择或拖入二维码图片（PNG / JPEG / WebP / GIF 等），自动识别并输出其中的文本/链接
- 解析结果可一键复制
- 粘贴的二维码图片为清晰位图时识别率最高

<div id="qrcode-app">

  <div class="qr-banner">
    <span class="qr-hint">文本生成 / 图片解析双向互转，纯本地处理，不上传</span>
  </div>

  <section class="qr-panel">
    <h2 class="qr-title">生成二维码</h2>

    <div class="qr-field">
      <label class="qr-label" for="qr-text">文本内容</label>
      <textarea id="qr-text" class="qr-input" rows="4" spellcheck="false" autocomplete="off" placeholder="输入文本或链接，如 https://www.sunyazhou.com …"></textarea>
    </div>

    <div class="qr-opt-row">
      <label class="qr-label" for="qr-ecl">纠错级别</label>
      <select id="qr-ecl" class="qr-select">
        <option value="L">L（低 7%）</option>
        <option value="M" selected>M（中 15%）</option>
        <option value="Q">Q（高 25%）</option>
        <option value="H">H（最高 30%）</option>
      </select>
      <button type="button" class="qr-btn qr-btn-primary" id="qr-generate">生成二维码</button>
      <button type="button" class="qr-btn" id="qr-download" disabled>下载 PNG</button>
    </div>

    <div class="qr-preview">
      <div class="qr-placeholder" id="qr-placeholder">输入内容后，点击「生成二维码」</div>
      <canvas id="qr-canvas" hidden></canvas>
      <div class="qr-meta" id="qr-meta"></div>
    </div>
  </section>

  <section class="qr-panel">
    <h2 class="qr-title">解析二维码</h2>

    <div class="qr-drop" id="qr-drop">
      <input type="file" id="qr-file" accept="image/*" hidden>
      <button type="button" class="qr-btn qr-btn-primary" id="qr-choose">选择图片</button>
      <span class="qr-hint">或将二维码图片拖拽到此处</span>
    </div>

    <div class="qr-decode-result" id="qr-decode-result" hidden>
      <img id="qr-dec-img" alt="上传的二维码图片" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
      <div class="qr-field">
        <label class="qr-label" for="qr-dec-text">解析结果</label>
        <textarea id="qr-dec-text" class="qr-input qr-result" rows="3" readonly spellcheck="false"></textarea>
        <div class="qr-meta-row">
          <span class="qr-meta" id="qr-dec-meta"></span>
          <button type="button" class="qr-btn qr-btn-copy" id="qr-dec-copy">复制结果</button>
        </div>
      </div>
    </div>
  </section>

  <div class="qr-error" id="qr-error" hidden></div>

</div>

<script src="/assets/tools/qrcode/lib/qrcode.js?v=202609221"></script>
<script src="/assets/tools/qrcode/lib/jsQR.js?v=202609221"></script>
<script type="module" src="/assets/tools/qrcode/app.js?v=202609221"></script>
