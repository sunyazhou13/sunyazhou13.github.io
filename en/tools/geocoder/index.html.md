---
layout: page
title: Geocoding Lookup
icon: fas fa-location-dot
lang: en
permalink: /tools/geocoder/
tool_css: /assets/tools/geocoder/app.css
---

<p class="hint">Geocode and reverse-geocode right in your browser: <b>enter coordinates</b> to get a structured address, or <b>enter an address</b> to get precise coordinates — always with the <b>full raw JSON</b> returned by the API. Choose Tencent / Amap (China) or OpenStreetMap (overseas), and convert between WGS-84 / GCJ-02 / BD-09. Requests go straight from your browser; nothing is routed through this site.</p>

<div id="geo-app">

  <div class="geo-topbar">
    <label id="geo-lbl-prov" for="geo-prov">Provider</label>
    <select id="geo-prov">
      <option value="tencent">Tencent Maps (China)</option>
      <option value="amap">Amap (China)</option>
      <option value="both">Tencent + Amap (compare)</option>
      <option value="osm">OpenStreetMap (overseas, free)</option>
    </select>
  </div>

  <div class="geo-modes">
    <button type="button" class="geo-mode is-active" data-mode="reverse" id="geo-tab-rev">Coordinates → Address (reverse)</button>
    <button type="button" class="geo-mode" data-mode="forward" id="geo-tab-fwd">Address → Coordinates (forward)</button>
  </div>

  <div class="geo-form" id="geo-reverse">
    <label class="geo-field"><span id="geo-lbl-lat">Latitude (lat)</span>
      <input type="text" id="geo-lat" inputmode="decimal" placeholder="39.908722"></label>
    <label class="geo-field"><span id="geo-lbl-lon">Longitude (lon)</span>
      <input type="text" id="geo-lon" inputmode="decimal" placeholder="116.397499"></label>
    <label class="geo-field"><span id="geo-lbl-sys">Input CRS</span>
      <select id="geo-sys">
        <option value="gcj02">GCJ-02 (Amap / Tencent / China maps)</option>
        <option value="wgs84">WGS-84 (GPS / EXIF)</option>
        <option value="bd09">BD-09 (Baidu Maps)</option>
      </select></label>
    <button type="button" class="geo-btn" id="geo-go-rev">Query</button>
  </div>

  <div class="geo-form" id="geo-forward" hidden>
    <label class="geo-field"><span id="geo-lbl-addr">Address</span>
      <input type="text" id="geo-addr" placeholder="Tiananmen, Beijing"></label>
    <label class="geo-field"><span id="geo-lbl-city">City (optional, improves accuracy)</span>
      <input type="text" id="geo-city" placeholder="Beijing"></label>
    <button type="button" class="geo-btn" id="geo-go-fwd">Query</button>
  </div>

  <div id="geo-status" hidden></div>
  <div class="geo-results" id="geo-results"></div>

  <div class="geo-edu">
    <h2>How to use / why offsets happen</h2>

    <h3>1. Two directions</h3>
    <ol>
      <li><b>Reverse geocoding (coordinates → address)</b> — enter lat/lon to get a structured address (province/city/district/street/POI) plus the full raw JSON.</li>
      <li><b>Forward geocoding (address → coordinates)</b> — enter a text address to get coordinates, along with the <b>match level</b> and confidence (e.g. Tencent's similarity / reliability). Higher level = more precise.</li>
    </ol>

    <h3>2. Three coordinate systems (the classic pitfall)</h3>
    <table class="geo-ref">
      <thead><tr><th>CRS</th><th>Where it comes from</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td>WGS-84</td><td>GPS, EXIF in photos, OpenStreetMap</td><td>International standard</td></tr>
        <tr><td>GCJ-02</td><td>Amap, Tencent, most Chinese maps</td><td>Encrypted/offset coordinate; differs from WGS-84 by ~100–700 m in China</td></tr>
        <tr><td>BD-09</td><td>Baidu Maps</td><td>Further offset applied on top of GCJ-02</td></tr>
      </tbody>
    </table>
    <div class="geo-note">This tool converts for you: just pick the correct <b>input CRS</b>. Don't feed WGS-84 GPS coordinates as if they were GCJ-02, or you may land a block away. Forward results from Chinese providers come back as GCJ-02, and the matching GPS (WGS-84) is shown too.</div>

    <h3>3. Providers &amp; coverage</h3>
    <table class="geo-ref">
      <thead><tr><th>Provider</th><th>Best for</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td>Tencent / Amap</td><td>Chinese mainland</td><td>Most complete China data &amp; POIs; key required in <code>_config.yml</code></td></tr>
        <tr><td>OpenStreetMap</td><td>Overseas (China coverage is limited)</td><td>Free, <b>no key needed</b>, CORS-enabled for direct browser use</td></tr>
      </tbody>
    </table>

    <h3>4. Free tiers (individual developers)</h3>
    <ul>
      <li>Tencent LBS: reverse geocoding ~6,000 calls/day; over-quota just rate-limits, <b>no auto-charge</b>.</li>
      <li>Amap: basic LBS (incl. geocoding/reverse) ~150,000 calls/month; over-quota only errors, <b>no auto-charge</b>.</li>
      <li>OpenStreetMap: free — please respect its usage policy (~1 request/sec, no bulk scraping).</li>
    </ul>
  </div>

</div>

<script>/* key 集中配置在 _config.yml 的 api_keys.geocode（须单行，compress_html 会合并换行） */ window.GEO_KEYS = { tencent: '{{ site.api_keys.geocode.tencent }}', amap: '{{ site.api_keys.geocode.amap }}' };</script>
<script type="module" src="/assets/tools/geocoder/app.js?v=20260916"></script>
