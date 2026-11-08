---
layout: page
title: 北京医院推荐
icon: fas fa-hospital
tool_css: /assets/tools/hospital-recommend/app.css?v=202610137
---

<p class="hint">按专攻方向整理的北京医院推荐：每家医院卡片含官网、地址、电话、门诊时间、急诊、擅长方向与挂号方式。<br>
<span class="hr-tip"><b>门诊时间：</b>指门诊开诊时段，不是挂号 / 热线时间。口径取自官网「就诊须知 / 门诊须知」，标了「周六日仅上午」「周六上午开诊」的就是当天只有半天。<b>实际门诊时间请以医院官网或「北京114预约挂号」为准</b>，节假日前尤其要再确认。</span>
<span class="hr-tip"><b>急诊：</b>综合三甲基本 24 小时，专科医院差别很大 —— 有的是部分科室才 24 小时（如首儿所骨科 / 口腔科急诊只到 22:00），有的科室干脆没有急诊（如北京中医医院眼科、口腔科）。<b>写「24 小时」的都是官网明确写了的</b>，括注里说明了哪些科室不覆盖。</span>
<span class="hr-tip"><b>挂号通用渠道：</b>微信搜索并关注「北京114预约挂号」公众号，大部分市属 / 驻京医院都可在此预约。</span>
<span class="hr-tip"><b>不通用时：</b>若该医院在「北京114预约挂号」里不可用，直接关注该医院自己的微信公众号，或下载其官方 App 预约。</span><br>
<span class="hr-tip">电话均取自医院官网，只标出号码、不保证接听时段。</span><br>
清单在 <code>_data/hospital_recommend.yml</code> 里手动维护，改完重新构建即生效。</p>

<div id="hr-app">
{% include hospital-recommend-list.html %}
</div>

<script type="module" src="/assets/tools/hospital-recommend/app.js?v=202610131"></script>
<script type="module" src="/assets/tools/hospital-recommend/symptom.js?v=202610133"></script>
