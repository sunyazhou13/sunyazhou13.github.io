---
layout: page
title: 地理编码查询
icon: fas fa-location-dot
tool_css: /assets/tools/geocoder/app.css
---

<p class="hint">在浏览器里做地理编码与逆地理编码查询：<b>输入经纬度</b>得到结构化中文地址，<b>输入地址</b>得到精确经纬度，并给出接口返回的<b>完整原始 JSON</b>。可选腾讯地图 / 高德地图（国内）或 OpenStreetMap（国外），支持 WGS-84 / GCJ-02 / BD-09 三种坐标系互转。查询由浏览器直接发起，不经过本站服务器。</p>

<div id="geo-app">

  <div class="geo-topbar">
    <label id="geo-lbl-prov" for="geo-prov">提供商</label>
    <select id="geo-prov">
      <option value="tencent">腾讯地图（国内）</option>
      <option value="amap">高德地图（国内）</option>
      <option value="both">腾讯 + 高德（对比）</option>
      <option value="osm">OpenStreetMap（国外·免费）</option>
    </select>
  </div>

  <div class="geo-modes">
    <button type="button" class="geo-mode is-active" data-mode="reverse" id="geo-tab-rev">坐标 → 地址（逆编码）</button>
    <button type="button" class="geo-mode" data-mode="forward" id="geo-tab-fwd">地址 → 坐标（正编码）</button>
  </div>

  <div class="geo-form" id="geo-reverse">
    <label class="geo-field"><span id="geo-lbl-lat">纬度 (lat)</span>
      <input type="text" id="geo-lat" inputmode="decimal" placeholder="39.908722"></label>
    <label class="geo-field"><span id="geo-lbl-lon">经度 (lon)</span>
      <input type="text" id="geo-lon" inputmode="decimal" placeholder="116.397499"></label>
    <label class="geo-field"><span id="geo-lbl-sys">输入坐标系</span>
      <select id="geo-sys">
        <option value="gcj02">GCJ-02（高德 / 腾讯 / 国内地图）</option>
        <option value="wgs84">WGS-84（GPS / EXIF）</option>
        <option value="bd09">BD-09（百度地图）</option>
      </select></label>
    <button type="button" class="geo-btn" id="geo-go-rev">查询</button>
  </div>

  <div class="geo-form" id="geo-forward" hidden>
    <label class="geo-field"><span id="geo-lbl-addr">地址</span>
      <input type="text" id="geo-addr" placeholder="北京市东城区天安门"></label>
    <label class="geo-field"><span id="geo-lbl-city">城市（可选，提高精度）</span>
      <input type="text" id="geo-city" placeholder="北京"></label>
    <button type="button" class="geo-btn" id="geo-go-fwd">查询</button>
  </div>

  <div id="geo-status" hidden></div>
  <div class="geo-results" id="geo-results"></div>

  <div class="geo-edu">
    <h2>怎么用 / 为什么会有偏差</h2>

    <h3>1. 两个方向</h3>
    <ol>
      <li><b>逆地理编码（坐标 → 地址）</b> —— 输入纬度/经度，得到省市区、街道、POI 等结构化地址，以及完整原始 JSON。</li>
      <li><b>正地理编码（地址 → 坐标）</b> —— 输入文字地址，得到经纬度。同时给出<b>匹配级别</b>与可信度（如腾讯的 similarity / reliability），级别越高越精确。</li>
    </ol>

    <h3>2. 三套坐标系（最容易踩的坑）</h3>
    <table class="geo-ref">
      <thead><tr><th>坐标系</th><th>来源</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>WGS-84</td><td>GPS、手机照片 EXIF、OpenStreetMap</td><td>国际标准</td></tr>
        <tr><td>GCJ-02</td><td>高德、腾讯、国内绝大多数地图</td><td>国测局加密坐标，与 WGS-84 在国内相差约 100–700 米</td></tr>
        <tr><td>BD-09</td><td>百度地图</td><td>在 GCJ-02 基础上再次偏移</td></tr>
      </tbody>
    </table>
    <div class="geo-note">本工具会自动换算：选好「输入坐标系」即可，别把 GPS 的 WGS-84 坐标直接当 GCJ-02 去查，否则可能偏到隔壁街区。正编码结果国内接口返回 GCJ-02，会额外标出对应的 GPS(WGS-84)。</div>

    <h3>3. 提供商与适用地区</h3>
    <table class="geo-ref">
      <thead><tr><th>提供商</th><th>适用</th><th>备注</th></tr></thead>
      <tbody>
        <tr><td>腾讯 / 高德</td><td>中国大陆</td><td>国内数据最全、POI 最细；需在 <code>_config.yml</code> 配 key</td></tr>
        <tr><td>OpenStreetMap</td><td>国外（中国大陆覆盖一般）</td><td>免费、<b>无需 key</b>、支持浏览器直连</td></tr>
      </tbody>
    </table>

    <h3>4. 免费额度（个人开发者）</h3>
    <ul>
      <li>腾讯位置服务：逆地址解析约 6000 次/日；超额仅限流报错，<b>不自动扣费</b>。</li>
      <li>高德开放平台：基础 LBS 服务（含地理/逆地理编码）约 15 万次/月；超额仅报错，<b>不自动扣费</b>。</li>
      <li>OpenStreetMap：免费，请遵守其使用政策（约 1 次/秒、勿批量抓取）。</li>
    </ul>
  </div>

</div>

<script>/* key 集中配置在 _config.yml 的 api_keys.geocode（须单行，compress_html 会合并换行） */ window.GEO_KEYS = { tencent: '{{ site.api_keys.geocode.tencent }}', amap: '{{ site.api_keys.geocode.amap }}' };</script>
<script type="module" src="/assets/tools/geocoder/app.js?v=20260916"></script>
