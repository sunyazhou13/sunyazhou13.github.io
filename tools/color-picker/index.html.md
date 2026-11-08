---
layout: page
title: 图片主色调提取
icon: fas fa-palette
tool_css: /assets/tools/color-picker/app.css?v=202609221
---

上传图片后，自动分析全部像素并提取主色调。支持三种经典色彩量化算法，颜色数量与采样精度可调，结果按占比排序输出 HEX 与 RGB 值，并生成 Swift / Objective-C / Kotlin / Java / ArkTS / Flutter 代码片段。所有处理均在浏览器本地完成，**图片不会上传到任何服务器**。

几点说明：

- 上传：选择或拖拽图片（PNG / JPEG / WebP / GIF / BMP 等），图片在本地 Canvas 渲染，超大图自动缩放至 1200px 以内
- 提取算法：
  - **K-Means 聚类**（k-means++ 初始化）— 经典聚类，色彩分布均匀
  - **中值切割**（Median Cut, Heckbert 1982）— Color Thief 同源算法，速度快
  - **直方图统计** — 3D 色彩直方图量化 + 相似色合并，适合提取离散主色
- 颜色数量：3 / 5 / 7 / 10 色可选
- 采样精度：控制像素采样步长，步长越大速度越快但精度略降
- 输出：每个颜色显示 HEX 字符串、RGB 值、占比百分比，均可一键复制
- 代码片段：自动生成 Swift / Objective-C / Kotlin / Java / ArkTS / Flutter 代码，语言标签可切换
- 算法源码：提供 Swift / Objective-C / JavaScript 三种语言的三种算法完整实现，方便学习和修改

<div id="cp-app">

  <div class="cp-banner">
    <span class="cp-hint">上传图片后选择算法提取主色调，生成多语言代码片段，纯本地处理，图片不上传</span>
  </div>

  <div class="cp-drop" id="cp-drop">
    <input type="file" id="cp-file" accept="image/*" hidden>
    <button type="button" class="cp-btn cp-btn-primary" id="cp-choose">选择图片</button>
    <span class="cp-hint">或将图片拖拽到此处</span>
  </div>

  <div class="cp-workarea" id="cp-workarea" hidden>

    <div class="cp-canvas-wrap">
      <canvas id="cp-canvas"></canvas>
      <span class="cp-img-info" id="cp-img-info"></span>
    </div>

    <div class="cp-side">

      <div class="cp-panel">
        <h2 class="cp-title">提取设置</h2>
        <div class="cp-setting">
          <label class="cp-label" for="cp-algo">提取算法</label>
          <select id="cp-algo" class="cp-select">
            <option value="kmeans" selected>K-Means 聚类</option>
            <option value="mediancut">中值切割</option>
            <option value="histogram">直方图统计</option>
          </select>
        </div>
        <div class="cp-setting">
          <label class="cp-label" for="cp-count">颜色数量</label>
          <select id="cp-count" class="cp-select">
            <option value="3">3 色</option>
            <option value="5" selected>5 色</option>
            <option value="7">7 色</option>
            <option value="10">10 色</option>
          </select>
        </div>
        <div class="cp-setting">
          <label class="cp-label" for="cp-quality">采样精度</label>
          <select id="cp-quality" class="cp-select">
            <option value="1">高（逐像素）</option>
            <option value="2" selected>中</option>
            <option value="3">低</option>
            <option value="4">极低（快速）</option>
          </select>
        </div>
        <button type="button" class="cp-btn cp-btn-primary" id="cp-extract">提取主色调</button>
      </div>

      <div class="cp-loading" id="cp-loading" hidden>正在分析像素…</div>

    </div>

    <div class="cp-panel cp-full" id="cp-palette-panel" hidden>
      <h2 class="cp-title">提取结果</h2>
      <div class="cp-palette" id="cp-palette"></div>
    </div>

    <div class="cp-panel cp-full" id="cp-code-panel" hidden>
      <h2 class="cp-title">代码片段</h2>
      <div class="cp-tabs" id="cp-tabs">
        <button type="button" class="cp-tab cp-tab-active" data-lang="swift">Swift</button>
        <button type="button" class="cp-tab" data-lang="objc">Objective-C</button>
        <button type="button" class="cp-tab" data-lang="kotlin">Kotlin</button>
        <button type="button" class="cp-tab" data-lang="java">Java</button>
        <button type="button" class="cp-tab" data-lang="arkts">ArkTS</button>
        <button type="button" class="cp-tab" data-lang="dart">Flutter/Dart</button>
      </div>
      <pre class="cp-code-block"><code id="cp-code-output"></code></pre>
      <button type="button" class="cp-btn cp-btn-copy" id="cp-copy-code">复制代码</button>
    </div>

  </div>

  <div class="cp-panel cp-full" id="cp-algo-src-panel">
    <h2 class="cp-title">算法源码</h2>
    <p class="cp-hint">三种色彩量化算法的完整实现，提供 Swift / Objective-C / JavaScript 三个版本，方便学习和移植到自己的项目。</p>
    <div class="cp-tabs" id="cp-algo-src-tabs">
      <button type="button" class="cp-tab cp-tab-active" data-algo-src="swift">Swift</button>
      <button type="button" class="cp-tab" data-algo-src="objc">Objective-C</button>
      <button type="button" class="cp-tab" data-algo-src="javascript">JavaScript</button>
    </div>
    <pre class="cp-code-block cp-code-block-tall"><code id="cp-algo-src-output"></code></pre>
    <button type="button" class="cp-btn cp-btn-copy" id="cp-copy-algo">复制源码</button>
  </div>

  <div class="cp-error" id="cp-error" hidden></div>

</div>

<script type="module" src="/assets/tools/color-picker/app.js?v=202609221"></script>
