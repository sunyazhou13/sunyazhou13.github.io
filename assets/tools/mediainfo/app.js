// 媒体信息查看器（MediaInfo）—— 基于官方 mediainfo.js（WASM），纯前端、文件不出本机
import mediaInfoFactory from './index.min.js';

// 页面是否英文版（用于文案本地化）
const MI_EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0
  || /\/en\//.test(location.pathname) || /-en\/?$/.test(location.pathname);
const L = (zh, en) => (MI_EN ? en : zh);

const WASM_URL = '/assets/tools/mediainfo/MediaInfoModule.wasm';

const T = {
  dropTitle: L('拖入或点击选择音视频文件', 'Drop or click to select a media file'),
  dropSub: L('MP4 / MOV / MKV / WebM / AVI / TS / MP3 / FLAC / WAV / OGG … · 全程本地解析，文件不上传',
    'MP4 / MOV / MKV / WebM / AVI / TS / MP3 / FLAC / WAV / OGG … · parsed locally, never uploaded'),
  loading: L('正在加载解析引擎（约 2.4MB WASM，仅首次）…', 'Loading analysis engine (~2.4MB WASM, first time only)…'),
  parsing: L('正在解析…', 'Analyzing…'),
  done: (n) => L(`解析完成，共 ${n} 条轨道`, `Done, ${n} track(s)`),
  unknown: L('未能识别出媒体信息，请确认文件是否为支持的音视频格式。',
    'No media info detected. Please check that the file is a supported audio/video format.'),
  fail: L('解析失败：', 'Analysis failed: '),
  copy: L('复制当前视图', 'Copy view'),
  copied: L('已复制', 'Copied'),
  reset: L('重新选择', 'Choose another'),
  tree: L('分组表格', 'Tree'),
  text: L('文本', 'Text'),
  xml: 'XML',
  json: 'JSON',
  full: L('完整', 'Full'),
  computing: L('正在计算…', 'Computing…'),
  cover: L('内嵌封面', 'Embedded cover'),
  eduTitle: L('音视频参数速查', 'Audio/video parameter reference'),
};

// 轨道类型
const TRACK_LABEL = {
  General: L('通用', 'General'),
  Video: L('视频', 'Video'),
  Audio: L('音频', 'Audio'),
  Text: L('字幕 / 文本', 'Text'),
  Image: L('图像', 'Image'),
  Menu: L('菜单', 'Menu'),
  Other: L('其它', 'Other'),
};
const TRACK_COLOR = {
  General: '#2563eb', Video: '#7c3aed', Audio: '#0d9488',
  Text: '#b45309', Image: '#db2777', Menu: '#64748b', Other: '#64748b',
};

// 常见字段名中文化 —— 键名与 MediaInfoLib XML 输出一致（空格用下划线替代），未命中则显示原始英文名
const FIELD_ZH = {
  // General
  'CompleteName': '完整名称', 'FileName': '文件名', 'FileExtension': '扩展名',
  'FileSize': '文件大小', 'Duration': '时长', 'OverallBitRate': '总码率',
  'OverallBitRate_Mode': '总码率模式', 'FrameRate': '帧率', 'FrameCount': '帧数',
  'StreamSize': '流大小', 'HeaderSize': '头部大小', 'DataSize': '数据大小',
  'FooterSize': '尾部大小', 'IsStreamable': '可流式播放', 'FileSize_String': '文件大小',
  'VideoCount': '视频轨数', 'AudioCount': '音频轨数', 'TextCount': '字幕轨数',
  'Audio_Channels_Total': '音频声道总数', 'Format_Commercial': '商业名称',
  'StreamSize_Proportion': '流大小占比', 'Source_Duration': '源时长',
  'Source_StreamSize': '源流大小', 'CodecConfigurationBox': '编码配置区块',
  'CodecConfigurationBoxInfo': '编码配置区块', 'Copyright': '版权',
  'BitsPixel_Frame': '数据密度', 'Format_Url': '格式官网',
  'Format_AdditionalFeatures': '格式附加特性', 'Source_FrameCount': '源帧数',
  'Source_StreamSize_Proportion': '源流大小占比', 'colour_description_present': '色彩描述标识',
  'Encoded_Date': '编码日期', 'Tagged_Date': '标记日期', 'File_Created_Date': '文件创建日期',
  'Recorded_Date': '录制日期', 'WriteLibrary': '编码库', 'Title': '标题',
  'Performer': '表演者', 'Album': '专辑', 'Genre': '流派', 'Track': '曲目',
  'Format': '格式', 'Format_Info': '格式说明', 'Format_Profile': '格式档次',
  'Format_Level': '格式级别', 'Format_Settings': '格式设置', 'Format_Version': '格式版本',
  'CodecID': '编码器 ID', 'CodecID_Info': '编码器 ID 说明', 'CodecID_Compatible': '兼容编码 ID',
  'CommercialName': '商业名称', 'InternetMediaType': 'MIME 类型',
  'File_Creation_Date__Local_': '文件创建日期（本地）',
  // Video
  'StreamOrder': '流顺序', 'ID': '轨道 ID',
  'Format_Settings_CABAC': 'CABAC 熵编码', 'Format_Settings_RefFrames': '参考帧数',
  'Format_Settings_GOP': 'GOP 设置', 'Format_Settings_Endianness': '字节序',
  'BitRate': '码率', 'BitRate_Mode': '码率模式', 'BitRate_Nominal': '标称码率',
  'BitRate_Maximum': '最大码率', 'BitRate_Minimum': '最小码率',
  'Width': '宽度', 'Height': '高度', 'Stored_Width': '存储宽度', 'Stored_Height': '存储高度',
  'Sampled_Width': '采样宽度', 'Sampled_Height': '采样高度',
  'Cropped_Width': '裁剪宽度', 'Cropped_Height': '裁剪高度',
  'PixelAspectRatio': '像素宽高比', 'DisplayAspectRatio': '显示宽高比',
  'Original_DisplayAspectRatio': '原始显示宽高比', 'ActiveWidth': '有效宽度',
  'ActiveHeight': '有效高度', 'Rotation': '旋转', 'FrameRate_Mode': '帧率模式',
  'FrameRate_Num': '帧率分子', 'FrameRate_Den': '帧率分母',
  'FrameRate_Original': '原始帧率', 'FrameRate_Minimum': '最低帧率',
  'FrameRate_Maximum': '最高帧率', 'ColorSpace': '色彩空间',
  'ChromaSubsampling': '色度采样', 'BitDepth': '位深',
  'ScanType': '扫描方式', 'ScanOrder': '扫描顺序', 'ScanType_StoreMethod': '交错存储方式',
  'Bits_(Pixel*Frame)': '每像素位数', 'Compression_Mode': '压缩模式',
  'Encoded_Library': '编码库', 'Encoded_Library_Settings': '编码库参数',
  'Encoded_Application': '编码程序', 'Delay': '延迟', 'Delay_Source': '延迟来源',
  'Video_Delay': '视频延迟', 'Delay_Relative_To_Video': '相对视频延迟',
  'colour_range': '色彩范围', 'colour_primaries': '色域基色',
  'transfer_characteristics': '传输特性', 'matrix_coefficients': '矩阵系数',
  'HDR_Format': 'HDR 格式', 'HDR_Format_Compatibility': 'HDR 兼容性',
  'MaxCLL': '最大内容亮度', 'MaxFALL': '最大帧平均亮度',
  'MasteringDisplay_ColorPrimaries': '母版色域', 'MasteringDisplay_Luminance': '母版亮度',
  'CodecConfigurationBoxInfo': '编码配置信息',
  // Audio
  'Channel(s)': '声道数', 'Channels': '声道数', 'ChannelPositions': '声道位置',
  'ChannelLayout': '声道布局', 'SamplingRate': '采样率', 'SamplingCount': '采样总数',
  'SamplesPerFrame': '每帧样本数', 'ReplayGain_Gain': '回放增益',
  // Text
  'Caption_ServiceContent': '字幕服务内容',
  // 通用
  'Language': '语言', 'Language_String': '语言', 'Default': '默认轨', 'Forced': '强制轨',
  'Default_String': '默认轨', 'Forced_String': '强制轨', 'Original': '原始轨',
  'MuxingMode': '封装方式', 'MuxingMode_MoreInfo': '封装方式说明',
};

const $ = (id) => document.getElementById(id);

// ── 工具 ──
function fmtBytes(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return String(v);
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}
// 码率原始值为 b/s，按 MediaInfo 习惯格式化为 kb/s / Mb/s
function fmtBitrate(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return String(v);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' Gb/s';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' Mb/s';
  if (n >= 1000) return (n >= 1e5 ? Math.round(n / 1000) : (n / 1000).toFixed(1)) + ' kb/s';
  return Math.round(n) + ' b/s';
}
// 注意：mediainfo.js 的 object 输出中 Duration 单位是「秒」（实测 3 秒的文件返回 3，而非 3000）
function fmtDuration(v) {
  if (v == null) return '';
  const s0 = String(v).trim();
  if (!/^\d+(\.\d+)?$/.test(s0)) return s0;
  const t = parseFloat(s0);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = Math.floor(t % 60);
  const ms = Math.round((t - Math.floor(t)) * 1000);
  const p = [];
  if (h) p.push(h + L(' 小时', ' h'));
  if (m) p.push(m + L(' 分', ' min'));
  if (sec) p.push(sec + L(' 秒', ' s'));
  if (!h && !m && !sec) p.push(ms + ' ms');
  else if (ms) p.push(ms + ' ms');
  return p.join('');
}
function trackType(t) { return t['@type'] || t.type || 'Other'; }
function getTracks(result) {
  if (!result) return [];
  if (Array.isArray(result.media && result.media.track)) return result.media.track;
  if (Array.isArray(result.track)) return result.track;
  if (Array.isArray(result.media)) return result.media;
  if (Array.isArray(result)) return result;
  return [];
}
// 内部 / 记账类字段：树视图与文本视图隐藏，只有「完整」视图才展示
// 展示优先级：靠前的先显示，让 General 从「格式/时长/码率」开始，贴近桌面版 MediaInfo 的阅读顺序
const FIELD_ORDER = ['Format', 'Format_Info', 'Format_Profile', 'Format_Level', 'Format_Settings',
  'Format_Settings_CABAC', 'Format_Settings_RefFrames', 'CodecID', 'CodecID_Info', 'CodecID_Compatible',
  'CommercialName', 'CompleteName', 'FileName', 'FileExtension', 'FileSize', 'Duration', 'OverallBitRate',
  'BitRate', 'BitRate_Mode', 'FrameRate', 'FrameRate_Mode', 'Width', 'Height', 'Sampled_Width',
  'Sampled_Height', 'DisplayAspectRatio', 'PixelAspectRatio', 'Rotation', 'ColorSpace', 'ChromaSubsampling',
  'BitDepth', 'ScanType', 'ScanOrder', 'Bits_(Pixel*Frame)', 'Channel(s)', 'Channels', 'ChannelLayout',
  'SamplingRate', 'Compression_Mode', 'StreamSize', 'Language', 'Default', 'Forced', 'Title',
  'Encoded_Date', 'Tagged_Date', 'Encoded_Library', 'Encoded_Application', 'Delay', 'Video_Delay',
  'StreamOrder', 'ID', 'HDR_Format', 'colour_primaries', 'transfer_characteristics', 'matrix_coefficients',
  'colour_range', 'FrameCount', 'SamplingCount', 'SamplesPerFrame', 'IsStreamable', 'HeaderSize',
  'DataSize', 'FooterSize', 'InternetMediaType', 'MuxingMode'];
const INTERNAL_KEY = /^(Count|StreamCount|StreamKind|StreamKindID|StreamKindPos|StreamIdentifier|VideoCount|AudioCount|TextCount|OtherCount|ImageCount|MenuCount)$|_List$|_Source$|^CodecID_Url$|^Format_Extensions$/;
function entries(t, fullMode) {
  const out = [];
  for (const k of Object.keys(t)) {
    if (k === 'extra' || k === '@type' || k === 'type') continue;
    if (/_String\d*$/.test(k)) continue;              // *_String 变体不单独成行，只作展示值
    if (!fullMode && INTERNAL_KEY.test(k)) continue;  // 非完整模式隐藏内部标签
    const v = t[k];
    if (v === null || v === undefined || String(v).trim() === '') continue;
    out.push([k, v]);
  }
  // 按优先级排序（未列出的字段保持原有相对顺序，sort 稳定）
  out.sort((a, b) => {
    const ia = FIELD_ORDER.indexOf(a[0]);
    const ib = FIELD_ORDER.indexOf(b[0]);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return out;
}
function fieldLabel(k) {
  if (!MI_EN) return FIELD_ZH[k] || FIELD_ZH[k.trim()] || k;
  return k;
}
const BITRATE_KEYS = ['OverallBitRate', 'BitRate', 'BitRate_Nominal', 'BitRate_Maximum',
  'BitRate_Minimum', 'BitRate_Original', 'Source_BitRate'];
// 优先用 MediaInfo 自带的 *_String 人类可读值（"44.7 KiB"、"3 s 0 ms"、"122 kb/s"、"25.000 FPS"）
function displayValue(t, k, v) {
  const str = t[k + '_String'];
  if (str != null && String(str).trim() !== '') return String(str);
  if (k === 'FileSize' || k === 'StreamSize') return fmtBytes(v);
  if (BITRATE_KEYS.includes(k)) return fmtBitrate(v);
  if (k === 'Duration') return fmtDuration(v);
  return String(v);
}

// ── 视图序列化（全部由单一 object 结果派生，不再创建额外 WASM 实例）──
// Object 的键是 MediaInfo 内部名（OverallBitRate / FileSize），转成人类可读的英文标签
function humanKey(k) {
  return k.replace(/_/g, ' ').replace(/([a-z0-9)])([A-Z])/g, '$1 $2');
}
function labelOf(k) {
  if (!MI_EN) return FIELD_ZH[k] || k;
  return humanKey(k);
}
function toText(tracks, fullMode) {
  const out = [];
  for (const t of tracks) {
    out.push(trackType(t));
    for (const [k, v] of entries(t, fullMode)) {
      const name = labelOf(k);
      const pad = ' '.repeat(Math.max(1, 41 - name.length));
      out.push(name + pad + ': ' + displayValue(t, k, v));
    }
    out.push('');
  }
  return out.join('\n');
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function toXML(tracks, name) {
  let x = '<?xml version="1.0" encoding="UTF-8"?>\n';
  x += '<MediaInfo xmlns="https://mediaarea.net/mediainfo" version="25.10">\n';
  x += '<creatingLibrary version="0.3.7" url="https://mediaarea.net/MediaInfo">mediainfo.js</creatingLibrary>\n';
  x += '<media ref="' + esc(name || '') + '">\n';
  for (const t of tracks) {
    x += '<track type="' + esc(trackType(t)) + '">\n';
    for (const [k, v] of entries(t, false)) {
      x += '  <' + esc(k) + '>' + esc(String(v)) + '</' + esc(k) + '>\n';
    }
    x += '</track>\n';
  }
  x += '</media>\n</MediaInfo>';
  return x;
}

function findCover(tracks) {
  for (const t of tracks) {
    const ex = t.extra;
    if (ex && typeof ex.coverData === 'string' && ex.coverData.length > 200) return ex.coverData;
    for (const k of Object.keys(t)) {
      const v = t[k];
      if (/cover/i.test(k) && typeof v === 'string' && v.length > 200) return v;
    }
  }
  return null;
}

// ── 状态与解析引擎 ──
// 只创建「一个」WASM 实例：full 模式一次拿到全部字段 + 各字段的 *_String 人类可读变体，
// 各视图都由这一份数据派生。绝不按视图创建多实例——实测多实例会吃爆内存被系统 kill。
let miPromise = null;
let current = null; // { file, result, tracks }
let view = 'tree';

function getMI() {
  if (!miPromise) {
    miPromise = mediaInfoFactory({
      format: 'object',
      full: true,      // 取全部内部标签（对应 MediaInfo 高级模式），*_String 变体用于人类可读展示
      coverData: true,
      locateFile: (p) => (typeof p === 'string' && p.endsWith('.wasm') ? WASM_URL : p),
    });
  }
  return miPromise;
}
function readChunkFor(file) {
  return (chunkSize, offset) => file.slice(offset, offset + chunkSize).arrayBuffer()
    .then((buf) => new Uint8Array(buf));
}

function setStatus(msg, kind) {
  const el = $('mi-status');
  el.textContent = msg || '';
  el.className = 'mi-status' + (kind ? ' mi-' + kind : '');
  el.hidden = !msg;
}

// ── 渲染 ──
function renderSummary(tracks, fileSize) {
  const box = $('mi-summary');
  const g = tracks.find((t) => trackType(t) === 'General') || {};
  const v = tracks.find((t) => trackType(t) === 'Video');
  const a = tracks.find((t) => trackType(t) === 'Audio');
  const cards = [];
  if (g.Format) cards.push([L('容器格式', 'Container'), g.Format]);
  if (g.Duration) cards.push([L('时长', 'Duration'), g.Duration_String || fmtDuration(g.Duration)]);
  // MediaInfo 在 buffer 模式下可能省略 FileSize / OverallBitRate，缺失时由 File 对象补算
  if (g.OverallBitRate) {
    cards.push([L('总码率', 'Overall bit rate'), g.OverallBitRate_String || fmtBitrate(g.OverallBitRate)]);
  } else {
    const dur = parseFloat(g.Duration);
    if (fileSize && dur > 0) {
      const bps = (fileSize * 8) / dur;
      cards.push([L('总码率', 'Overall bit rate'),
        bps >= 1e6 ? (bps / 1e6).toFixed(2) + ' Mb/s' : Math.round(bps / 1000) + ' kb/s']);
    }
  }
  if (g.FileSize) cards.push([L('文件大小', 'File size'), g.FileSize_String || fmtBytes(g.FileSize)]);
  else if (fileSize) cards.push([L('文件大小', 'File size'), fmtBytes(fileSize)]);
  if (v) {
    const res = v.Width && v.Height ? `${v.Width}×${v.Height}` : '';
    cards.push([L('视频', 'Video'), [v.Format, res].filter(Boolean).join(' · ')]);
  }
  if (a) {
    const ch = a['Channel(s)'] || a.Channels || '';
    cards.push([L('音频', 'Audio'), [a.Format, ch ? ch + L(' 声道', ' ch') : ''].filter(Boolean).join(' · ')]);
  }
  box.innerHTML = '';
  for (const [k, val] of cards) {
    const d = document.createElement('div');
    d.className = 'mi-card';
    const kk = document.createElement('div');
    kk.className = 'mi-card-k';
    kk.textContent = k;
    const vv = document.createElement('div');
    vv.className = 'mi-card-v';
    vv.textContent = val;
    d.appendChild(kk);
    d.appendChild(vv);
    box.appendChild(d);
  }
  box.hidden = cards.length === 0;
}

function renderTree(tracks) {
  const box = $('mi-view-tree');
  box.innerHTML = '';
  // 按轨道类型分组，同类型多条则依次编号
  const groups = [];
  for (const t of tracks) {
    const type = trackType(t);
    let g = groups.find((x) => x.type === type);
    if (!g) { g = { type, items: [] }; groups.push(g); }
    g.items.push(t);
  }
  for (const g of groups) {
    const sec = document.createElement('div');
    sec.className = 'mi-group';
    const head = document.createElement('div');
    head.className = 'mi-group-head';
    const dot = document.createElement('span');
    dot.className = 'mi-dot';
    dot.style.background = TRACK_COLOR[g.type] || '#64748b';
    head.appendChild(dot);
    const label = document.createElement('span');
    const base = TRACK_LABEL[g.type] || g.type;
    label.textContent = g.items.length > 1
      ? `${base} ×${g.items.length}` : base;
    head.appendChild(label);
    sec.appendChild(head);

    const table = document.createElement('table');
    table.className = 'mi-table';
    const tb = document.createElement('tbody');
    g.items.forEach((t, idx) => {
      if (g.items.length > 1) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 2;
        td.className = 'mi-k';
        td.textContent = `${base} #${idx + 1}`;
        td.style.background = 'var(--mi-bg-soft)';
        tr.appendChild(td);
        tb.appendChild(tr);
      }
      for (const [k, v] of entries(t, false)) {
        const tr = document.createElement('tr');
        const kc = document.createElement('td');
        kc.className = 'mi-k';
        kc.textContent = fieldLabel(k);
        const vc = document.createElement('td');
        vc.className = 'mi-v';
        vc.textContent = displayValue(t, k, v);
        tr.appendChild(kc);
        tr.appendChild(vc);
        tb.appendChild(tr);
      }
    });
    table.appendChild(tb);
    sec.appendChild(table);
    box.appendChild(sec);
  }
}

function renderRaw(tracks, name) {
  $('mi-view-text').textContent = toText(tracks, false);
  $('mi-view-full').textContent = toText(tracks, true);
  $('mi-view-xml').textContent = toXML(tracks, name);
  $('mi-view-json').textContent = JSON.stringify(current.result, null, 2);
}

function renderCover(tracks) {
  const box = $('mi-cover-box');
  const data = findCover(tracks);
  if (!data) { box.hidden = true; return; }
  box.hidden = false;
  const img = $('mi-cover-img');
  img.src = /^data:/.test(data) ? data : 'data:image/jpeg;base64,' + data.replace(/\s+/g, '');
  img.alt = T.cover;
}

function showView(v) {
  view = v;
  for (const b of document.querySelectorAll('#mi-tabs .mi-tab')) {
    b.classList.toggle('is-active', b.dataset.view === v);
  }
  for (const id of ['tree', 'text', 'xml', 'json', 'full']) {
    $('mi-view-' + id).hidden = (id !== v);
  }
}

// ── 主流程 ──
async function analyze(file) {
  setStatus(T.loading);
  current = null;
  $('mi-filebar').hidden = false;
  $('mi-fname').textContent = file.name;
  $('mi-fsize').textContent = fmtBytes(file.size);
  $('mi-summary').hidden = true;
  $('mi-tabs').hidden = true;
  $('mi-cover-box').hidden = true;
  $('mi-view-tree').innerHTML = '';
  for (const id of ['tree', 'text', 'xml', 'json', 'full']) $('mi-view-' + id).hidden = true;

  try {
    const engine = await getMI();
    setStatus(T.parsing);
    const result = await engine.analyzeData(() => file.size, readChunkFor(file));
    const tracks = getTracks(result);
    if (!tracks.length) { setStatus(T.unknown, 'err'); return; }
    current = { file, result, tracks };
    renderSummary(tracks, file.size);
    renderTree(tracks);
    renderRaw(tracks, file.name);
    renderCover(tracks);
    $('mi-tabs').hidden = false;
    showView(view);
    setStatus(T.done(tracks.length), 'ok');
  } catch (e) {
    setStatus(T.fail + (e && e.message ? e.message : e), 'err');
  }
}

function reset() {
  current = null;
  $('mi-file').value = '';
  $('mi-filebar').hidden = true;
  $('mi-summary').hidden = true;
  $('mi-tabs').hidden = true;
  $('mi-cover-box').hidden = true;
  $('mi-view-tree').innerHTML = '';
  for (const id of ['tree', 'text', 'xml', 'json', 'full']) $('mi-view-' + id).hidden = true;
  setStatus('');
}

function bind() {
  const drop = $('mi-drop');
  const input = $('mi-file');
  drop.addEventListener('click', () => input.click());
  drop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', () => { if (input.files && input.files[0]) analyze(input.files[0]); });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault(); drop.classList.add('mi-drop-active');
  }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('mi-drop-active')));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) analyze(f);
  });
  // 阻止整页被拖入时浏览器默认打开文件
  ['dragover', 'drop'].forEach((ev) => window.addEventListener(ev, (e) => e.preventDefault()));

  $('mi-reset').addEventListener('click', reset);
  $('mi-copy').addEventListener('click', () => {
    if (!current) return;
    let text = '';
    if (view === 'tree') text = toText(current.tracks);
    else text = $('mi-view-' + view).textContent;
    navigator.clipboard?.writeText(text).then(() => {
      const b = $('mi-copy');
      b.textContent = T.copied;
      setTimeout(() => { b.textContent = T.copy; }, 1200);
    }).catch(() => {});
  });
  for (const b of document.querySelectorAll('#mi-tabs .mi-tab')) {
    b.addEventListener('click', () => showView(b.dataset.view));
  }
  // 本地化拖拽区文案
  $('mi-drop-title').textContent = T.dropTitle;
  $('mi-drop-sub').textContent = T.dropSub;
  $('mi-copy').textContent = T.copy;
  $('mi-reset').textContent = T.reset;
  for (const b of document.querySelectorAll('#mi-tabs .mi-tab')) {
    const map = { tree: T.tree, text: T.text, xml: T.xml, json: T.json, full: T.full };
    b.textContent = map[b.dataset.view];
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
else bind();
