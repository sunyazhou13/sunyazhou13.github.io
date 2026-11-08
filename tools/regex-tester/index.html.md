---
layout: page
title: 正则表达式测试器
icon: fas fa-terminal
tool_css: /assets/tools/regex-tester/app.css?v=202609221
---

<p class="hint">输入正则表达式与测试文本，实时高亮所有匹配项，展示每个匹配与捕获分组的文本、位置、耗时，并对疑似灾难性回溯的嵌套量词写法给出警示。全部在浏览器本地计算，内容不会上传。</p>

<div id="rt-app">
  <div class="rt-field">
    <label for="rt-pattern">正则表达式</label>
    <input type="text" id="rt-pattern" class="rt-pattern" spellcheck="false" autocomplete="off" placeholder="例如 (\w+)@(\w+)\.(\w+) 或 /pattern/gi">
  </div>

  <div class="rt-flags">
    <label><input type="checkbox" value="g" checked> g 全局</label>
    <label><input type="checkbox" value="i"> i 忽略大小写</label>
    <label><input type="checkbox" value="m"> m 多行</label>
    <label><input type="checkbox" value="s"> s 点匹配换行</label>
    <label><input type="checkbox" value="u"> u Unicode</label>
    <label><input type="checkbox" value="y"> y sticky</label>
  </div>

  <div class="rt-field">
    <label for="rt-text">测试文本</label>
    <textarea id="rt-text" class="rt-textarea" rows="8" spellcheck="false" placeholder="在这里粘贴测试文本…"></textarea>
  </div>

  <div class="rt-status" id="rt-status" role="status"></div>
  <div class="rt-warn" id="rt-warn" hidden></div>
  <div class="rt-meta" id="rt-meta"></div>
  <div class="rt-output" id="rt-output"></div>
  <div class="rt-groups" id="rt-groups"></div>
</div>

<script src="/assets/tools/regex-tester/app.js?v=202609221" defer></script>
