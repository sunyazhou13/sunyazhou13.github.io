// 图片元数据查看器（Image Metadata Viewer）—— 纯前端、零依赖、文件不出本机
// 元数据由 ./imgparse.js 直接从字节读取，HEIC / AVIF 等“浏览器可能解不了像素”的格式也能解析出尺寸、色彩、EXIF、ICC。
import { parseImage, parseICC, findSeq } from './imgparse.js';

// 页面是否英文版（用于文案本地化）
const IMG_EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0
  || /\/en\//.test(location.pathname) || /-en\/?$/.test(location.pathname);
const L = (zh, en) => (IMG_EN ? en : zh);

const T = {
  dropTitle: L('拖入或点击选择图片文件', 'Drop or click to select an image'),
  dropSub: L('PNG / JPG / GIF / WebP / AVIF / HEIC / TIFF / BMP … · 全程本地解析，文件不上传',
    'PNG / JPG / GIF / WebP / AVIF / HEIC / TIFF / BMP … · parsed locally, never uploaded'),
  parsing: L('正在解析…', 'Analyzing…'),
  done: L('解析完成', 'Done'),
  unknown: L('未能识别出图片元数据，请确认文件是否为支持的图片格式。',
    'No image metadata detected. Please check that the file is a supported image format.'),
  fail: L('解析出错：', 'Error: '),
  copy: L('复制当前视图', 'Copy view'),
  copied: L('已复制', 'Copied'),
  reset: L('重新选择', 'Choose another'),
  tree: L('分组表格', 'Tree'),
  json: 'JSON',
  thumb: L('缩略预览', 'Preview'),
  thumbFallback: L('该格式浏览器无法直接预览像素（如 HEIC 通常需系统解码支持），但上方元数据已完整解析。',
    'This format cannot be previewed by the browser (e.g. HEIC usually needs OS-level decoding), but the metadata above is fully parsed.'),
  exifTitle: L('相机 EXIF', 'Camera EXIF'),
  iccTitle: L('色彩管理 (ICC)', 'Color management (ICC)'),
  basicTitle: L('基本信息', 'Basic'),
  encTitle: L('编码与色彩', 'Encoding & color'),
  noteTitle: L('说明 / 合理范围', 'Notes / range'),
  geoResolving: L('反查中…', 'Resolving…'),
  geoNa: L('N/A', 'N/A'),
  geoNoKey: L('N/A（未配置地图 key）', 'N/A (no map key configured)'),
};

const $ = (id) => document.getElementById(id);

function fmtBytes(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return String(v);
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}
// EXIF 有理数可能是 number，也可能是 [分子,分母]（个别写入器用 SHORT[2]/LONG[2] 表示）——统一取标量
function ratioNum(v) {
  if (Array.isArray(v)) return v.length >= 2 ? (v[1] ? v[0] / v[1] : (v[0] || 0)) : (v[0] || 0);
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}
// 分数 / 小数统一展示：曝光时间、光圈等
function fmtRatio(v) {
  if (v == null) return '';
  const n = ratioNum(v);
  if (!isFinite(n) || n <= 0) return String(v);
  if (n >= 1) return n.toFixed(2);
  // 小于 1 常用分数表示，如 0.0125 -> 1/80
  const denom = Math.round(1 / n);
  return '1/' + denom;
}
// 简洁数值（去掉多余小数位）：光圈、焦距、ISO
function fmtNum(v) {
  if (v == null) return '';
  const n = ratioNum(v);
  if (!isFinite(n)) return String(v);
  return String(Math.round(n * 100) / 100);
}
function yn(b) { return b ? L('是', 'Yes') : L('否', 'No'); }
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
const MARK_OK = '\u2713';    // ✓
const MARK_WARN = '\u26A0';  // ⚠

// ── 字段中文化（图片专用，与 imgparse 返回的键对应）──
const ZH = {
  fileName: '文件名', fileSize: '文件大小', format: '格式', mime: 'MIME 类型',
  width: '宽度', height: '高度', aspectRatio: '宽高比',
  bitDepth: '位深', colorType: '颜色类型', hasAlpha: '透明通道',
  animated: '动画', frameCount: '帧数', codec: '编码细节',
  orientation: '方向', make: '厂商', model: '型号', dateTimeOriginal: '拍摄时间',
  iso: 'ISO', exposureTime: '曝光时间', fNumber: '光圈', focalLength: '焦距',
  gps: 'GPS 坐标', description: '描述', space: '色彩空间',
};

// ── EXIF 每字段的“说明 / 合理范围”补充列 ──
function exifNote(key, e) {
  switch (key) {
    case 'make': return L('厂商字符串，无固定取值', 'Manufacturer string, no fixed range');
    case 'model': return L('型号字符串，无固定取值', 'Model string, no fixed range');
    case 'dateTimeOriginal': {
      const v = String(e.dateTimeOriginal || '');
      const ok = /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(v);
      if (!ok) return MARK_WARN + L(' 非标准 EXIF 时间格式（应为 YYYY:MM:DD HH:MM:SS）',
        ' non-standard EXIF time format (expect YYYY:MM:DD HH:MM:SS)');
      const yr = parseInt(v.slice(0, 4), 10);
      const nowY = new Date().getFullYear();
      if (yr < 1990 || yr > nowY + 1) return L('格式 ✓，但年份超出常见范围（1990–', 'Format ✓, but year looks unusual (1990–') + (nowY + 1) + '）';
      return L('标准格式 YYYY:MM:DD HH:MM:SS ', 'Standard YYYY:MM:DD HH:MM:SS ') + MARK_OK;
    }
    case 'orientation': {
      const m = {
        1: L('正常', 'normal'), 2: L('水平镜像', 'mirrored horizontally'), 3: L('旋转 180°', 'rotated 180°'),
        4: L('垂直镜像', 'mirrored vertically'), 5: L('镜像后转 90°CW', 'mirror + 90° CW'),
        6: L('顺时针 90°', '90° CW'), 7: L('镜像后转 90°CCW', 'mirror + 90° CCW'), 8: L('逆时针 90°', '90° CCW'),
      };
      const v = e.orientation;
      const inR = v >= 1 && v <= 8;
      const label = m[v] || L('未知', 'unknown');
      return L('取值 1–8（当前：', 'Range 1–8 (current: ') + label + '）' + (inR ? ' ' + MARK_OK : ' ' + MARK_WARN);
    }
    case 'iso': {
      const v = ratioNum(e.iso);
      const inR = v >= 25 && v <= 409600;
      const hint = v >= 25600 ? L('极高感光，噪点明显', 'extremely high, visible noise')
        : v >= 6400 ? L('高感光', 'high sensitivity')
          : v <= 100 ? L('低感光，画质佳', 'low ISO, best quality')
            : L('常规范围', 'typical');
      return L('常见 50–409600，', 'Typical 50–409600, ') + hint + (inR ? ' ' + MARK_OK : ' ' + MARK_WARN);
    }
    case 'exposureTime': {
      const s = ratioNum(e.exposureTime);
      const inR = s > 0 && s <= 60;
      const hint = s >= 1 ? L('长曝光', 'long exposure')
        : s <= 1 / 1000 ? L('高速快门，凝固运动', 'fast shutter, freezes motion')
          : L('常规快门', 'typical shutter');
      return L('常见 1/8000–30 s，', 'Typical 1/8000–30 s, ') + hint + (inR ? ' ' + MARK_OK : ' ' + MARK_WARN);
    }
    case 'fNumber': {
      const f = ratioNum(e.fNumber);
      const inR = f >= 0.7 && f <= 64;
      const hint = f <= 2 ? L('大光圈，背景虚化', 'wide aperture, shallow DOF')
        : f >= 11 ? L('小光圈，景深深', 'small aperture, deep DOF')
          : L('常规', 'typical');
      return L('常见 f/1.0–f/32，', 'Typical f/1.0–f/32, ') + hint + (inR ? ' ' + MARK_OK : ' ' + MARK_WARN);
    }
    case 'focalLength': {
      const mm = ratioNum(e.focalLength);
      const inR = mm > 0 && mm <= 2000;
      const hint = mm <= 8 ? L('手机主摄范围', 'phone main-camera range')
        : mm <= 35 ? L('广角', 'wide') : mm <= 85 ? L('标准 / 中焦', 'normal / medium')
          : mm <= 300 ? L('长焦', 'telephoto') : L('超长焦', 'super telephoto');
      return L('常见 4–600 mm，', 'Typical 4–600 mm, ') + hint + (inR ? ' ' + MARK_OK : ' ' + MARK_WARN);
    }
    case 'gps': return ''; // 由反编码异步填充
    default: return '';
  }
}

// ── GPS 反编码（国内地图，浏览器端 JSONP 绕 CORS；EXIF 坐标为 WGS-84）──
// key 集中配置在 _config.yml 的 api_keys.geocode，由工具页面注入 window.II_GEO_KEYS（见 tools/imginfo.md）。
// 留空则该列显示 N/A。腾讯 coord_type=1 直接吃 WGS-84；高德要求 GCJ-02，故先把 WGS-84 转为 GCJ-02。
const GEO_KEYS = Object.assign(
  { tencent: '', amap: '' },
  (typeof window !== 'undefined' && window.II_GEO_KEYS) || {}
);

function jsonp(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const cb = '__ii_geo_' + Math.random().toString(36).slice(2);
    const s = document.createElement('script');
    let done = false;
    const timer = setTimeout(() => finish(reject, new Error('timeout')), timeoutMs || 6000);
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

// WGS-84 → GCJ-02（国测局加密坐标，高德/腾讯所在体系）
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

async function reverseGeocode(lat, lon) {
  if (GEO_KEYS.tencent) {
    try {
      const url = `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat.toFixed(6)},${lon.toFixed(6)}`
        + `&coord_type=1&key=${encodeURIComponent(GEO_KEYS.tencent)}&output=jsonp`;
      const d = await jsonp(url);
      if (d && d.status === 0 && d.result) {
        const r = d.result;
        const rec = r.formatted_addresses && (r.formatted_addresses.recommend || r.formatted_addresses.rough);
        const addr = rec || r.address;
        if (addr) return addr;
      }
    } catch (e) { /* ignore */ }
  }
  if (GEO_KEYS.amap) {
    try {
      const g = wgs84ToGcj02(lat, lon);
      const url = `https://restapi.amap.com/v3/geocode/regeo?key=${encodeURIComponent(GEO_KEYS.amap)}`
        + `&location=${g[1].toFixed(6)},${g[0].toFixed(6)}`;
      const d = await jsonp(url);
      if (d && d.status === '1' && d.regeocode && d.regeocode.formatted_address) {
        return d.regeocode.formatted_address;
      }
    } catch (e) { /* ignore */ }
  }
  return null;
}

function fillGeoNote(lat, lon) {
  const cell = document.querySelector('#ii-view-tree .ii-note-geo');
  if (!cell) return;
  if (!GEO_KEYS.tencent && !GEO_KEYS.amap) { cell.textContent = T.geoNoKey; return; }
  cell.textContent = T.geoResolving;
  reverseGeocode(lat, lon)
    .then((addr) => { cell.textContent = addr || T.geoNa; })
    .catch(() => { cell.textContent = T.geoNa; });
}

let current = null;     // { file, result }
let view = 'tree';
let thumbUrl = null;

function setStatus(msg, kind) {
  const el = $('ii-status');
  el.textContent = msg || '';
  el.className = 'ii-status' + (kind ? ' ii-' + kind : '');
  el.hidden = !msg;
}

// ── 渲染 ──
function renderSummary(r) {
  const box = $('ii-summary');
  box.innerHTML = '';
  const cards = [];
  cards.push([L('格式', 'Format'), r.format || r.formatKey]);
  if (r.width && r.height) cards.push([L('尺寸', 'Dimensions'), `${r.width}×${r.height}`]);
  cards.push([L('文件大小', 'File size'), fmtBytes(r.fileSize)]);
  if (r.aspectRatio) cards.push([L('宽高比', 'Aspect ratio'), r.aspectRatio]);
  if (r.bitDepth) cards.push([L('位深', 'Bit depth'), r.bitDepth + ' bit']);
  if (r.colorType) cards.push([L('颜色类型', 'Color type'), r.colorType]);
  cards.push([L('透明通道', 'Alpha'), yn(r.hasAlpha)]);
  if (r.animated) cards.push([L('动画', 'Animated'), L('是 · ' + (r.frameCount || '?') + ' 帧', 'Yes · ' + (r.frameCount || '?') + ' frames')]);

  for (const [k, val] of cards) {
    const d = document.createElement('div');
    d.className = 'ii-card';
    const kk = document.createElement('div');
    kk.className = 'ii-card-k';
    kk.textContent = k;
    const vv = document.createElement('div');
    vv.className = 'ii-card-v';
    vv.textContent = val;
    d.appendChild(kk);
    d.appendChild(vv);
    box.appendChild(d);
  }
  box.hidden = cards.length === 0;
}

// 一组「键值」行；传入 noteLabel 时额外渲染第三列（说明/合理范围），行可写为 [key, value, note, noteClass]
function buildSection(parent, title, rows, noteLabel) {
  const sec = document.createElement('div');
  sec.className = 'ii-group';
  const head = document.createElement('div');
  head.className = 'ii-group-head';
  head.textContent = title;
  sec.appendChild(head);

  const threeCol = !!noteLabel;
  const table = document.createElement('table');
  table.className = 'ii-table' + (threeCol ? ' ii-table-3' : '');
  if (threeCol) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    for (const [cls, label] of [['ii-k', ''], ['ii-v', ''], ['ii-note-col', noteLabel]]) {
      const th = document.createElement('th');
      th.className = cls;
      th.textContent = label;
      tr.appendChild(th);
    }
    thead.appendChild(tr);
    table.appendChild(thead);
  }
  const tb = document.createElement('tbody');
  let any = false;
  for (const row of rows) {
    const k = row[0], v = row[1], note = row[2], noteCls = row[3];
    if (v === undefined || v === null || String(v).trim() === '') continue;
    any = true;
    const tr = document.createElement('tr');
    const kc = document.createElement('td');
    kc.className = 'ii-k';
    kc.textContent = IMG_EN ? k : (ZH[k] || k);
    const vc = document.createElement('td');
    vc.className = 'ii-v';
    vc.textContent = String(v);
    tr.appendChild(kc);
    tr.appendChild(vc);
    if (threeCol) {
      const nc = document.createElement('td');
      nc.className = 'ii-note-col' + (noteCls ? ' ' + noteCls : '');
      nc.textContent = note || '';
      tr.appendChild(nc);
    }
    tb.appendChild(tr);
  }
  table.appendChild(tb);
  sec.appendChild(table);
  if (any) parent.appendChild(sec);
}

function renderTree(r) {
  const box = $('ii-view-tree');
  box.innerHTML = '';

  // 基本信息
  buildSection(box, T.basicTitle, [
    ['fileName', r.fileName],
    ['fileSize', fmtBytes(r.fileSize)],
    ['format', r.format],
    ['mime', r.mime],
    ['width', r.width],
    ['height', r.height],
    ['aspectRatio', r.aspectRatio],
  ]);

  // 编码与色彩
  const encRows = [
    ['bitDepth', r.bitDepth],
    ['colorType', r.colorType],
    ['hasAlpha', yn(r.hasAlpha)],
    ['animated', r.animated ? L('是', 'Yes') : L('否', 'No')],
  ];
  if (r.animated) encRows.push(['frameCount', r.frameCount]);
  buildSection(box, T.encTitle, encRows);

  // 相机 EXIF（三列：字段 / 值 / 说明与合理范围；GPS 行的第三列做反编码）
  if (r.exif) {
    const e = r.exif;
    const exifRows = [
      ['make', e.make, exifNote('make', e)],
      ['model', e.model, exifNote('model', e)],
      ['dateTimeOriginal', e.dateTimeOriginal, exifNote('dateTimeOriginal', e)],
      ['orientation', e.orientation, exifNote('orientation', e)],
      ['iso', e.iso != null ? fmtNum(e.iso) : undefined, exifNote('iso', e)],
      ['exposureTime', e.exposureTime != null ? fmtRatio(e.exposureTime) : undefined, exifNote('exposureTime', e)],
      ['fNumber', e.fNumber != null ? 'f/' + fmtNum(e.fNumber) : undefined, exifNote('fNumber', e)],
      ['focalLength', e.focalLength != null ? fmtNum(e.focalLength) + ' mm' : undefined, exifNote('focalLength', e)],
    ];
    if (e.gps) {
      exifRows.push(['gps', `${e.gps.lat.toFixed(6)}, ${e.gps.lon.toFixed(6)} (${e.gps.latRef}${e.gps.lonRef})`,
        '', 'ii-note-geo']);
    }
    buildSection(box, T.exifTitle, exifRows, T.noteTitle);
    if (e.gps) fillGeoNote(e.gps.lat, e.gps.lon);
  }

  // 色彩管理 (ICC)
  if (r.icc) {
    const c = r.icc;
    buildSection(box, T.iccTitle, [
      ['description', c.description],
      ['space', c.space],
    ]);
  }
}

function renderRaw() {
  $('ii-view-json').textContent = JSON.stringify(current.result, null, 2);
}

function renderThumb(file, r) {
  const wrap = $('ii-thumb');
  const img = $('ii-thumb-img');
  const note = $('ii-thumb-note');
  note.hidden = true;
  // 释放上一张
  if (thumbUrl) { URL.revokeObjectURL(thumbUrl); thumbUrl = null; }
  // 浏览器能直接解码的格式才尝试预览
  img.style.display = 'none';
  // 先尝试；出错则回退到说明
  thumbUrl = URL.createObjectURL(file);
  img.onload = () => { img.style.display = ''; note.hidden = true; };
  img.onerror = () => {
    img.style.display = 'none';
    note.hidden = false;
    if (thumbUrl) { URL.revokeObjectURL(thumbUrl); thumbUrl = null; }
  };
  img.src = thumbUrl;
  wrap.hidden = false;
}

function showView(v) {
  view = v;
  for (const b of document.querySelectorAll('#ii-tabs .ii-tab')) {
    b.classList.toggle('is-active', b.dataset.view === v);
  }
  $('ii-view-tree').hidden = (v !== 'tree');
  $('ii-view-json').hidden = (v !== 'json');
}

// ── 主流程 ──
async function analyze(file) {
  setStatus(T.parsing);
  current = null;
  $('ii-filebar').hidden = false;
  $('ii-fname').textContent = file.name;
  $('ii-fsize').textContent = fmtBytes(file.size);
  $('ii-summary').hidden = true;
  $('ii-thumb').hidden = true;
  $('ii-tabs').hidden = true;
  $('ii-view-tree').innerHTML = '';
  $('ii-view-json').textContent = '';

  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const result = parseImage(bytes, file.name);
    current = { file, result };
    // PNG 的 ICC（iCCP 块）是压缩的，需 inflate 后再解析色彩配置
    if (result.formatKey === 'png' && !result.icc) {
      try {
        const icc = await extractPngIcc(bytes);
        if (icc) result.icc = icc;
      } catch (e) { /* ignore */ }
    }
    if (result.formatKey === 'unknown') { setStatus(T.unknown, 'err'); return; }
    if (result._error) { setStatus(T.fail + result._error, 'warn'); }
    renderSummary(result);
    renderThumb(file, result);
    renderTree(result);
    renderRaw();
    $('ii-tabs').hidden = false;
    showView('tree');
    setStatus(T.done + (result._error ? '' : ''), result._error ? 'warn' : 'ok');
    if (result._error) setStatus(T.done + '（部分字段解析异常已跳过）', 'warn');
  } catch (e) {
    setStatus(T.fail + (e && e.message ? e.message : e), 'err');
  }
}

function reset() {
  if (thumbUrl) { URL.revokeObjectURL(thumbUrl); thumbUrl = null; }
  current = null;
  $('ii-file').value = '';
  $('ii-filebar').hidden = true;
  $('ii-summary').hidden = true;
  $('ii-thumb').hidden = true;
  $('ii-tabs').hidden = true;
  $('ii-view-tree').innerHTML = '';
  $('ii-view-json').textContent = '';
  setStatus('');
}

function bind() {
  const drop = $('ii-drop');
  const input = $('ii-file');
  drop.addEventListener('click', () => input.click());
  drop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', () => { if (input.files && input.files[0]) analyze(input.files[0]); });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault(); drop.classList.add('ii-drop-active');
  }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('ii-drop-active')));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) analyze(f);
  });
  ['dragover', 'drop'].forEach((ev) => window.addEventListener(ev, (e) => e.preventDefault()));

  $('ii-reset').addEventListener('click', reset);
  $('ii-copy').addEventListener('click', () => {
    if (!current) return;
    let text = '';
    if (view === 'tree') text = toText(current.result);
    else text = $('ii-view-' + view).textContent;
    navigator.clipboard?.writeText(text).then(() => {
      const b = $('ii-copy');
      b.textContent = T.copied;
      setTimeout(() => { b.textContent = T.copy; }, 1200);
    }).catch(() => {});
  });
  for (const b of document.querySelectorAll('#ii-tabs .ii-tab')) {
    b.addEventListener('click', () => showView(b.dataset.view));
  }
  // 本地化文案
  $('ii-drop-title').textContent = T.dropTitle;
  $('ii-drop-sub').textContent = T.dropSub;
  $('ii-copy').textContent = T.copy;
  $('ii-reset').textContent = T.reset;
  $('ii-thumb-note').textContent = T.thumbFallback;
  for (const b of document.querySelectorAll('#ii-tabs .ii-tab')) {
    const map = { tree: T.tree, json: T.json };
    b.textContent = map[b.dataset.view];
  }
}

// PNG 的 ICC 存于 iCCP 块，经 zlib 压缩；浏览器解码需 inflate。
// 标准 ICC：'acsp' 位于头部偏移 4（偏移 0 为 profile 字节长度），两种起点都尝试。
async function inflateBytes(bytes) {
  const ds = new DecompressionStream('deflate');
  const w = ds.writable.getWriter();
  w.write(bytes); w.close();
  const ab = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(ab);
}
async function extractPngIcc(bytes) {
  const i = findSeq(bytes, [0x69, 0x43, 0x43, 0x50]); // 'iCCP'
  if (i < 0) return null;
  const len = (bytes[i - 4] << 24 | bytes[i - 3] << 16 | bytes[i - 2] << 8 | bytes[i - 1]) >>> 0;
  let p = i + 4; // 跳过 'iCCP'
  while (p < bytes.length && bytes[p] !== 0) p++; // 跳过 profile 名
  p++; // 跳过 NUL
  p++; // 跳过压缩方法字节（0）
  const end = i + 4 + len;
  const comp = bytes.subarray(p, end);
  try {
    const raw = await inflateBytes(comp);
    const a = findSeq(raw, [0x61, 0x63, 0x73, 0x70]); // 'acsp'
    if (a < 0) return null;
    return parseICC(raw, a - 4) || parseICC(raw, a) || null;
  } catch (e) { return null; }
}

// 分组表格的纯文本序列化（用于复制）
function toText(r) {
  const lines = [];
  const sec = (title, rows) => {
    lines.push('[' + title + ']');
    for (const row of rows) {
      const k = row[0], v = row[1], note = row[2];
      if (v === undefined || v === null || String(v).trim() === '') continue;
      const name = IMG_EN ? k : (ZH[k] || k);
      lines.push('  ' + name + ': ' + String(v) + (note ? '  —  ' + String(note) : ''));
    }
    lines.push('');
  };
  sec(T.basicTitle, [
    ['fileName', r.fileName], ['fileSize', fmtBytes(r.fileSize)], ['format', r.format],
    ['mime', r.mime], ['width', r.width], ['height', r.height], ['aspectRatio', r.aspectRatio],
  ]);
  const enc = [['bitDepth', r.bitDepth], ['colorType', r.colorType], ['hasAlpha', yn(r.hasAlpha)],
    ['animated', r.animated ? L('是', 'Yes') : L('否', 'No')]];
  if (r.animated) enc.push(['frameCount', r.frameCount]);
  sec(T.encTitle, enc);
  if (r.exif) {
    const e = r.exif;
    const ex = [
      ['make', e.make, exifNote('make', e)],
      ['model', e.model, exifNote('model', e)],
      ['dateTimeOriginal', e.dateTimeOriginal, exifNote('dateTimeOriginal', e)],
      ['orientation', e.orientation, exifNote('orientation', e)],
      ['iso', e.iso != null ? fmtNum(e.iso) : undefined, exifNote('iso', e)],
      ['exposureTime', e.exposureTime != null ? fmtRatio(e.exposureTime) : undefined, exifNote('exposureTime', e)],
      ['fNumber', e.fNumber != null ? 'f/' + fmtNum(e.fNumber) : undefined, exifNote('fNumber', e)],
      ['focalLength', e.focalLength != null ? fmtNum(e.focalLength) + ' mm' : undefined, exifNote('focalLength', e)],
    ];
    if (e.gps) {
      const gc = document.querySelector('#ii-view-tree .ii-note-geo');
      ex.push(['gps', `${e.gps.lat.toFixed(6)}, ${e.gps.lon.toFixed(6)} (${e.gps.latRef}${e.gps.lonRef})`, gc ? gc.textContent : '']);
    }
    sec(T.exifTitle, ex);
  }
  if (r.icc) sec(T.iccTitle, [['description', r.icc.description], ['space', r.icc.space]]);
  return lines.join('\n');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
else bind();
