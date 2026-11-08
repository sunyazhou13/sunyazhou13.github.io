---
layout: page
title: Engineer's Recipes
icon: fas fa-utensils
lang: en
permalink: /tools/recipes/
tool_css: /assets/tools/recipes/app.css?v=202610258
---

<div id="rc-app">
{% include recipes-search.html %}

<p class="hint">Cooking instructions turned into text you can actually cook from. Every dish opens with <strong>three things up top</strong>: how long it takes in total, how much of that is hands-on, and whether anything needs preparing ahead (soaking, marinating, chilling — not counted in the total, but you need to know before you start). Amounts keep the original wording ("about 5 g", "to taste") — if no number was given, none is invented. The <strong>timeline follows the real cooking pace</strong> with parallel steps marked; where no time was given it's estimated and flagged ⟡ together with the conditions — temperature, heat level.</p>

<p class="hint">Sources: <strong>福家德老厨东北菜</strong> (Fujiade Laochu) and <strong>爷俩好菜</strong> (Yelia Haocai) on Douyin — search those names in the app for the original videos. This page keeps only the written method; no video files are hosted here. Transcribed and hand-corrected, structured into key points rather than copied wholesale; where the source account is confirmed, it is tagged next to the dish name. To add dishes, edit <code>_data/recipes.yml</code> and rebuild — display order is simply the order in that file.</p>

{% include recipes-list.html %}
</div>

<script type="module" src="/assets/tools/recipes/app.js?v=202610258"></script>
