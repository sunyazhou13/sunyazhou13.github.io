---
layout: page
title: 图片隐私脱敏器
icon: fas fa-eye-slash
tool_css: /assets/tools/exif-stripper/app.css?v=202609221
---

<p class="hint">上传 JPEG / PNG 图片，自动解析并展示其中全部 EXIF 元数据（厂商、型号、拍摄时间、GPS 坐标等）。一键抹除全部元数据生成脱敏图片并下载，同时对比擦除前后的文件大小。全部在浏览器本地完成，图片不会上传。</p>

<div id="exif-stripper-app">

  <div class="exif-stripper-drop" id="exif-stripper-drop" tabindex="0" role="button" aria-label="选择或拖入图片">
    <input type="file" id="exif-stripper-file" accept="image/jpeg,image/jpg,image/png" hidden>
    <i class="fas fa-image"></i>
    <p class="exif-stripper-drop-title">拖入或点击选择 JPEG / PNG 图片</p>
    <p class="exif-stripper-drop-sub">先解析展示全部元数据，再一键抹除 · 支持拖拽</p>
  </div>

  <div class="exif-stripper-info" id="exif-stripper-info" hidden></div>

  <div class="exif-stripper-actions" id="exif-stripper-actions" hidden>
    <button type="button" class="exif-stripper-btn exif-stripper-btn-primary" id="exif-stripper-strip">一键抹除全部元数据</button>
    <button type="button" class="exif-stripper-btn" id="exif-stripper-download" disabled>下载脱敏图片</button>
    <button type="button" class="exif-stripper-btn" id="exif-stripper-reset">重新选择</button>
    <span class="exif-stripper-status" id="exif-stripper-status" role="status"></span>
  </div>

  <div class="exif-stripper-stats" id="exif-stripper-stats" hidden>
    <div class="exif-stripper-stat" id="exif-stripper-stat-before"></div>
    <div class="exif-stripper-stat" id="exif-stripper-stat-diff"></div>
  </div>

  <div class="exif-stripper-sec" id="exif-stripper-sec" hidden>
    <h3>元数据明细（<span id="exif-stripper-count"></span>）</h3>
    <div class="exif-stripper-table-wrap">
      <table class="exif-stripper-table">
        <thead><tr><th>分组</th><th>字段</th><th>值</th></tr></thead>
        <tbody id="exif-stripper-tbody"></tbody>
      </table>
    </div>
  </div>

</div>

<script src="/assets/tools/exif-stripper/app.js?v=202609221" defer></script>
