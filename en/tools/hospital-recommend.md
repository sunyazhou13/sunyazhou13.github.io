---
layout: page
title: Beijing Hospital Picks
icon: fas fa-hospital
lang: en
permalink: /tools/hospital-recommend/
tool_css: /assets/tools/hospital-recommend/app.css?v=202610137
---

<p class="hint">Beijing hospital recommendations grouped by specialty. Each card links to the official site and lists the address, phone, outpatient hours, emergency department, specialties, and booking methods.<br>
<span class="hr-tip"><b>Outpatient hours:</b> these are clinic opening hours, not registration or hotline hours. They are taken from each hospital's own "visit guide" page; a note such as「周六日仅上午」means the clinic opens only in the morning that day. <b>Always confirm on the hospital's official site or「北京114预约挂号」before you go</b>, especially around public holidays. Timings are in Chinese exactly as published by the hospital.</span>
<span class="hr-tip"><b>Emergency department:</b> general tertiary hospitals are almost always open 24 hours, but specialty hospitals vary a lot — some cover only certain departments around the clock (e.g. at 首儿所 the orthopaedics and dental ER closes at 22:00), and some have no ER for certain departments at all (e.g. ophthalmology and dentistry at 北京中医医院). <b>「24 小时」is only written where the hospital's own site says so</b>; the parenthetical note lists which departments are not covered.</span>
<span class="hr-tip"><b>Universal channel:</b> follow the WeChat public account「北京114预约挂号」(Beijing 114 Appointment) — it covers most municipal and Beijing-based hospitals.</span>
<span class="hr-tip"><b>If not available:</b> if a hospital isn't listed there, follow that hospital's own WeChat public account or use its official app.</span><br>
<span class="hr-tip">Phone numbers come from each hospital's official site; no guarantee is made about when they are answered.</span><br>
Edit <code>_data/hospital_recommend.yml</code> and rebuild.</p>

<div id="hr-app">
{% include hospital-recommend-list.html %}
</div>

<script type="module" src="/assets/tools/hospital-recommend/app.js?v=202610131"></script>
<script type="module" src="/assets/tools/hospital-recommend/symptom.js?v=202610133"></script>
