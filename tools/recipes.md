---
layout: page
title: 工程师菜谱
icon: fas fa-utensils
tool_css: /assets/tools/recipes/app.css?v=202610258
---

<div id="rc-app">
{% include recipes-search.html %}

<p class="hint">把口播整理成能照着做的文字版。每道菜展开后<strong>顶部先告诉你三件事</strong>：总共要多久、动手要多久、有没有需要提前准备的东西（泡发、腌制、定型这类不计入总耗时，但必须提前知道）。配比一律保留原话口径（「约 5g」「适量」），没说量就是没说量，不擅自改成精确数字。<strong>制作时间线</strong>按真实烹饪节奏排，能并行的步骤会标出来；原话没给时间的会补上估算值并打 ⟡，同时注明温度、火力这些条件。</p>

<p class="hint">菜品来源：<strong>福家德老厨东北菜</strong>、<strong>爷俩好菜</strong>。想看原版做法和手法细节，直接在抖音搜索这两个账号——本站只保留文字版做法，不转存视频。内容经转写后人工整理校对，只做要点结构化，不整段搬运原话；能确证出处的菜，会在标题后标出具体账号。想加菜直接编辑 <code>_data/recipes.yml</code> 后重新构建，显示顺序就是文件里的书写顺序。</p>

{% include recipes-list.html %}
</div>

<script type="module" src="/assets/tools/recipes/app.js?v=202610258"></script>
