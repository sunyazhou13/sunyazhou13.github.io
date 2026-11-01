// 地理编码查询（Geocoder）—— 纯前端：国内走腾讯/高德 WebService（JSONP 绕 CORS），
// 国外走 OpenStreetMap Nominatim（fetch，CORS 可用）。
// key 集中配置在 _config.yml 的 api_keys.geocode，由工具页面注入 window.GEO_KEYS（不硬编码）。
const GEO_EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0
  || /\/en\//.test(location.pathname) || /-en\/?$/.test(location.pathname);
const L = (zh, en) => (GEO_EN ? en : zh);

const GEO_KEYS = Object.assign(
  { tencent: '', amap: '' },
  (typeof window !== 'undefined' && window.GEO_KEYS) || {}
);

const $ = (id) => document.getElementById(id);

// ── JSONP（国内接口用）──
function jsonp(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const cb = '__geo_cb_' + Math.random().toString(36).slice(2);
    const s = document.createElement('script');
    let done = false;
    const timer = setTimeout(() => finish(reject, new Error('timeout')), timeoutMs || 8000);
    function finish(fn, arg) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { delete window[cb]; } catch (e) { /* ignore */ }
      s.remove();
      fn(arg);
    }
    window[cb] = (d) => finish(resolve, d);
    s.onerror = () => finish(reject, new Error('load error'));
    s.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + cb;
    document.head.appendChild(s);
  });
}
// ── fetch + 超时（国外接口用）──
async function jfetch(url, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs || 10000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    return await r.json();
  } finally { clearTimeout(timer); }
}

// ── 坐标系转换（WGS-84 / GCJ-02 / BD-09）──
function outOfChina(lat, lon) { return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271; }
function wgs84ToGcj02(lat, lon) {
  const a = 6378245.0, ee = 0.00669342162296594323;
  if (outOfChina(lat, lon)) return [lat, lon];
  const tLat = (x, y) => {
    let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    r += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
    r += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3;
    r += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3;
    return r;
  };
  const tLon = (x, y) => {
    let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    r += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
    r += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3;
    r += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3;
    return r;
  };
  let dLat = tLat(lon - 105, lat - 35);
  let dLon = tLon(lon - 105, lat - 35);
  const radLat = lat / 180 * Math.PI;
  let magic = Math.sin(radLat); magic = 1 - ee * magic * magic;
  const sq = Math.sqrt(magic);
  dLat = (dLat * 180) / ((a * (1 - ee)) / (magic * sq) * Math.PI);
  dLon = (dLon * 180) / (a / sq * Math.cos(radLat) * Math.PI);
  return [lat + dLat, lon + dLon];
}
function gcj02ToWgs84(lat, lon) {
  const g = wgs84ToGcj02(lat, lon);
  return [lat - (g[0] - lat), lon - (g[1] - lon)];
}
function bd09ToGcj02(lat, lon) {
  const x = lon - 0.0065, y = lat - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * Math.PI * 3000 / 180);
  const t = Math.atan2(y, x) - 0.000003 * Math.cos(x * Math.PI * 3000 / 180);
  return [z * Math.sin(t), z * Math.cos(t)];
}
function toGcj02(lat, lon, sys) {
  if (sys === 'wgs84') return wgs84ToGcj02(lat, lon);
  if (sys === 'bd09') return bd09ToGcj02(lat, lon);
  return [lat, lon];
}
function toWgs84(lat, lon, sys) {
  if (sys === 'gcj02') return gcj02ToWgs84(lat, lon);
  if (sys === 'bd09') { const g = bd09ToGcj02(lat, lon); return gcj02ToWgs84(g[0], g[1]); }
  return [lat, lon];
}
const fx = (v) => (isFinite(v) ? Number(v).toFixed(6) : '');
const cnLevel = (lv) => {
  if (typeof lv === 'number') {
    return lv >= 11 ? L('门牌号级', 'house-number level')
      : lv >= 9 ? L('POI / 建筑物级', 'POI / building level')
        : lv >= 7 ? L('道路级', 'road level')
          : lv >= 5 ? L('区县级', 'district level')
            : L('城市 / 省级', 'city / province level');
  }
  return lv ? String(lv) : '';
};

// ── 提供商 ──
// 每个 provider: { name, crs('gcj02'|'wgs84'), reverse(lat,lon,sys), forward(addr,city) }
// 返回值统一：{ ok, json, addr?, note?, lat?, lon?, title?, level?, extra?, err? }
// 注意：reverse 接收「用户输入的原始坐标 + 其坐标系」，provider 内部自行换算到所需坐标系。
const PROVIDERS = {
  tencent: {
    name: '腾讯位置服务',
    cn: true,
    async reverse(lat, lon, sys) {
      if (!GEO_KEYS.tencent) return { ok: false, err: L('未配置 key', 'no key') };
      const ct = { wgs84: 1, gcj02: 2, bd09: 3 }[sys] || 2;
      const url = `https://apis.map.qq.com/ws/geocoder/v1/?location=${fx(lat)},${fx(lon)}`
        + `&coord_type=${ct}&get_poi=1&key=${encodeURIComponent(GEO_KEYS.tencent)}&output=jsonp`;
      const d = await jsonp(url);
      if (d && d.status === 0 && d.result) {
        const r = d.result;
        return {
          ok: true, json: d,
          addr: r.address || (r.formatted_addresses && r.formatted_addresses.recommend) || '',
          note: L('坐标（GCJ-02）', 'coords (GCJ-02)') + ': ' + fx(r.location.lat) + ', ' + fx(r.location.lng),
        };
      }
      return { ok: false, err: (d && (d.message || ('status ' + d.status))) || 'no response', json: d };
    },
    async forward(addr) {
      if (!GEO_KEYS.tencent) return { ok: false, err: L('未配置 key', 'no key') };
      const url = `https://apis.map.qq.com/ws/geocoder/v1/?address=${encodeURIComponent(addr)}`
        + `&key=${encodeURIComponent(GEO_KEYS.tencent)}&output=jsonp`;
      const d = await jsonp(url);
      if (d && d.status === 0 && d.result) {
        const r = d.result;
        return {
          ok: true, json: d, lat: r.location.lat, lon: r.location.lng, title: r.title || addr,
          level: cnLevel(r.level),
          extra: L('相似度', 'similarity') + ' ' + r.similarity + ' · ' + L('可信度', 'reliability') + ' ' + r.reliability + '/10',
        };
      }
      return { ok: false, err: (d && (d.message || ('status ' + d.status))) || 'no response', json: d };
    },
  },
  amap: {
    name: '高德开放平台',
    cn: true,
    async reverse(lat, lon, sys) {
      if (!GEO_KEYS.amap) return { ok: false, err: L('未配置 key', 'no key') };
      const g = toGcj02(lat, lon, sys); // 高德只接受 GCJ-02
      const url = `https://restapi.amap.com/v3/geocode/regeo?key=${encodeURIComponent(GEO_KEYS.amap)}`
        + `&location=${fx(g[1])},${fx(g[0])}&extensions=all`;
      const d = await jsonp(url);
      if (d && d.status === '1' && d.regeocode) {
        const rc = d.regeocode;
        const dist = Array.isArray(rc.addressComponent && rc.addressComponent.distance) ? '' : (rc.addressComponent && rc.addressComponent.distance);
        return {
          ok: true, json: d, addr: rc.formatted_address || '',
          note: L('换算为 GCJ-02', 'converted to GCJ-02') + ': ' + fx(g[0]) + ', ' + fx(g[1]) + (dist ? ' · ' + L('距最近道路', 'to nearest road') + ' ' + dist + ' m' : ''),
        };
      }
      return { ok: false, err: (d && (d.info || ('status ' + d.status))) || 'no response', json: d };
    },
    async forward(addr, city) {
      if (!GEO_KEYS.amap) return { ok: false, err: L('未配置 key', 'no key') };
      let url = `https://restapi.amap.com/v3/geocode/geo?key=${encodeURIComponent(GEO_KEYS.amap)}&address=${encodeURIComponent(addr)}`;
      if (city) url += '&city=' + encodeURIComponent(city);
      const d = await jsonp(url);
      if (d && d.status === '1' && d.geocodes && d.geocodes.length) {
        const g = d.geocodes[0];
        const p = String(g.location).split(',').map(Number);
        return { ok: true, json: d, lat: p[1], lon: p[0], title: g.formatted_address || addr, level: cnLevel(g.level), extra: g.adcode ? ('adcode ' + g.adcode) : '' };
      }
      return { ok: false, err: (d && (d.info || ('status ' + d.status))) || 'no result', json: d };
    },
  },
  osm: {
    name: 'OpenStreetMap / Nominatim（国外·免费）',
    cn: false,
    async reverse(lat, lon, sys) {
      const w = toWgs84(lat, lon, sys); // Nominatim 用 WGS-84
      const d = await jfetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + fx(w[0]) + '&lon=' + fx(w[1])
        + '&accept-language=' + (GEO_EN ? 'en' : 'zh-CN'));
      if (d && d.display_name) {
        return { ok: true, json: d, addr: d.display_name, note: L('坐标（WGS-84）', 'coords (WGS-84)') + ': ' + fx(d.lat) + ', ' + fx(d.lon) };
      }
      return { ok: false, err: (d && d.error) ? String(d.error) : 'no result', json: d };
    },
    async forward(addr) {
      const d = await jfetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' + encodeURIComponent(addr)
        + '&accept-language=' + (GEO_EN ? 'en' : 'zh-CN'));
      if (Array.isArray(d) && d.length) {
        const r = d[0];
        return { ok: true, json: d, lat: Number(r.lat), lon: Number(r.lon), title: r.display_name, level: (r.type || '') + (r.category ? ' / ' + r.category : ''), extra: r.importance ? ('importance ' + r.importance) : '' };
      }
      return { ok: false, err: 'no result', json: d };
    },
  },
};

// ── 渲染 ──
function provCard(prov, res) {
  const card = document.createElement('section');
  card.className = 'geo-card';
  card.dataset.prov = prov.key || '';
  const head = document.createElement('div');
  head.className = 'geo-card-head';
  head.innerHTML = '<span class="geo-prov">' + prov.name + '</span>'
    + '<span class="geo-badge ' + (res.ok ? 'is-ok' : 'is-err') + '">' + (res.ok ? L('成功', 'OK') : L('失败', 'Failed')) + '</span>';
  card.appendChild(head);

  const body = document.createElement('div');
  body.className = 'geo-card-body';
  if (res.ok) {
    if (res.addr !== undefined) {
      body.insertAdjacentHTML('beforeend', '<p class="geo-addr"></p>');
      body.lastChild.textContent = res.addr;
      if (res.note) { body.insertAdjacentHTML('beforeend', '<p class="geo-sub"></p>'); body.lastChild.textContent = res.note; }
    } else {
      body.insertAdjacentHTML('beforeend', '<p class="geo-coords"></p>');
      body.lastChild.textContent = fx(res.lat) + ', ' + fx(res.lon);
      const cn = prov.cn; // 国内=GCJ-02，国外=WGS-84
      const alt = cn ? gcj02ToWgs84(res.lat, res.lon) : wgs84ToGcj02(res.lat, res.lon);
      const altLabel = cn ? L('GPS(WGS-84)', 'GPS (WGS-84)') : L('GCJ-02（国内）', 'GCJ-02 (China)');
      body.insertAdjacentHTML('beforeend', '<p class="geo-sub"></p>');
      body.lastChild.textContent = (res.title ? res.title + ' · ' : '')
        + L('匹配级别', 'match level') + ': ' + (res.level || '-')
        + (res.extra ? ' · ' + res.extra : '')
        + ' ｜ ' + altLabel + ': ' + fx(alt[0]) + ', ' + fx(alt[1]);
    }
  } else {
    body.insertAdjacentHTML('beforeend', '<p class="geo-err"></p>');
    body.lastChild.textContent = res.err || 'error';
  }
  card.appendChild(body);

  if (res.json !== undefined) {
    const wrap = document.createElement('div');
    wrap.className = 'geo-json-wrap';
    const bar = document.createElement('div');
    bar.className = 'geo-json-bar';
    const ttl = document.createElement('span');
    ttl.className = 'geo-json-title';
    ttl.textContent = L('接口原始返回（JSON）', 'Raw API response (JSON)');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'geo-copy';
    btn.textContent = L('复制 JSON', 'Copy JSON');
    btn.addEventListener('click', () => {
      const txt = JSON.stringify(res.json, null, 2);
      navigator.clipboard?.writeText(txt).then(() => {
        btn.textContent = L('已复制', 'Copied');
        setTimeout(() => { btn.textContent = L('复制 JSON', 'Copy JSON'); }, 1200);
      }).catch(() => {});
    });
    bar.appendChild(ttl);
    bar.appendChild(btn);
    wrap.appendChild(bar);
    const pre = document.createElement('pre');
    pre.className = 'geo-json';
    pre.textContent = JSON.stringify(res.json, null, 2);
    wrap.appendChild(pre);
    card.appendChild(wrap);
  }
  return card;
}

let busy = false;
function setBusy(b) {
  busy = b;
  for (const el of document.querySelectorAll('#geo-app .geo-btn')) el.disabled = b;
  const st = $('geo-status');
  st.hidden = !b;
  if (b) st.textContent = L('查询中…', 'Querying…');
}
function statusMsg(msg) { const st = $('geo-status'); st.hidden = !msg; st.textContent = msg || ''; }

function selectedProviders() {
  const v = $('geo-prov').value;
  if (v === 'both') return [PROVIDERS.tencent, PROVIDERS.amap];
  return [PROVIDERS[v]];
}

async function runReverse() {
  if (busy) return;
  const lat = parseFloat($('geo-lat').value);
  const lon = parseFloat($('geo-lon').value);
  const sys = $('geo-sys').value;
  $('geo-results').innerHTML = '';
  if (!isFinite(lat) || !isFinite(lon)) { statusMsg(L('请输入有效的纬度 / 经度', 'Enter a valid latitude / longitude')); return; }
  setBusy(true);
  try {
    const outs = await Promise.all(selectedProviders().map((p) =>
      p.reverse(lat, lon, sys).catch((e) => ({ ok: false, err: String((e && e.message) || e) }))));
    const box = $('geo-results');
    selectedProviders().forEach((p, i) => box.appendChild(provCard(Object.assign({ key: Object.keys(PROVIDERS).find((k) => PROVIDERS[k] === p) }, p), outs[i])));
  } finally { setBusy(false); }
}

async function runForward() {
  if (busy) return;
  const addr = $('geo-addr').value.trim();
  const city = $('geo-city').value.trim();
  $('geo-results').innerHTML = '';
  if (!addr) { statusMsg(L('请输入地址', 'Enter an address')); return; }
  setBusy(true);
  try {
    const provs = selectedProviders();
    const outs = await Promise.all(provs.map((p) =>
      p.forward(addr, city).catch((e) => ({ ok: false, err: String((e && e.message) || e) }))));
    const box = $('geo-results');
    provs.forEach((p, i) => box.appendChild(provCard(Object.assign({ key: Object.keys(PROVIDERS).find((k) => PROVIDERS[k] === p) }, p), outs[i])));
  } finally { setBusy(false); }
}

function showMode(m) {
  for (const b of document.querySelectorAll('#geo-app .geo-mode')) b.classList.toggle('is-active', b.dataset.mode === m);
  $('geo-reverse').hidden = m !== 'reverse';
  $('geo-forward').hidden = m !== 'forward';
  $('geo-results').innerHTML = '';
  statusMsg('');
}

function bind() {
  for (const b of document.querySelectorAll('#geo-app .geo-mode')) b.addEventListener('click', () => showMode(b.dataset.mode));
  $('geo-go-rev').addEventListener('click', runReverse);
  $('geo-go-fwd').addEventListener('click', runForward);
  $('geo-prov').addEventListener('change', () => { $('geo-results').innerHTML = ''; statusMsg(''); });
  for (const id of ['geo-lat', 'geo-lon']) $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') runReverse(); });
  for (const id of ['geo-addr', 'geo-city']) $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') runForward(); });

  const map = {
    'geo-lbl-prov': L('提供商', 'Provider'),
    'geo-tab-rev': L('坐标 → 地址（逆编码）', 'Coordinates → Address (reverse)'),
    'geo-tab-fwd': L('地址 → 坐标（正编码）', 'Address → Coordinates (forward)'),
    'geo-go-rev': L('查询', 'Query'), 'geo-go-fwd': L('查询', 'Query'),
    'geo-lbl-lat': L('纬度 (lat)', 'Latitude (lat)'), 'geo-lbl-lon': L('经度 (lon)', 'Longitude (lon)'),
    'geo-lbl-sys': L('输入坐标系', 'Input CRS'),
    'geo-lbl-addr': L('地址', 'Address'),
    'geo-lbl-city': L('城市（可选，提高精度）', 'City (optional, improves accuracy)'),
  };
  for (const id in map) { const el = $(id); if (el) el.textContent = map[id]; }

  const prov = $('geo-prov');
  const opts = {
    tencent: L('腾讯地图（国内）', 'Tencent Maps (China)'),
    amap: L('高德地图（国内）', 'Amap (China)'),
    both: L('腾讯 + 高德（对比）', 'Tencent + Amap (compare)'),
    osm: L('OpenStreetMap（国外·免费）', 'OpenStreetMap (overseas, free)'),
  };
  [...prov.options].forEach((o) => { if (opts[o.value]) o.textContent = opts[o.value]; });

  const sysSel = $('geo-sys');
  if (sysSel) {
    sysSel.options[0].textContent = 'GCJ-02（' + L('高德 / 腾讯 / 国内地图', 'Amap / Tencent / China maps') + '）';
    sysSel.options[1].textContent = 'WGS-84（' + L('GPS / EXIF', 'GPS / EXIF') + '）';
    sysSel.options[2].textContent = 'BD-09（' + L('百度地图', 'Baidu Maps') + '）';
  }
  if (!GEO_KEYS.tencent && !GEO_KEYS.amap) {
    statusMsg(L('未配置地图 key，请在 _config.yml 的 api_keys.geocode 中填写（腾讯 / 高德；OpenStreetMap 无需 key）。',
      'No map key configured. Fill api_keys.geocode in _config.yml (Tencent / Amap; OpenStreetMap needs no key).'));
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
else bind();
