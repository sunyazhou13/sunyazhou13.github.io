// 音频元数据查看器（Audio Meta）—— 纯前端、零依赖、文件不出本机
// 字节解析见 ./audioparse.js；本文件只负责渲染与交互。
import { parseAudio } from './audioparse.js';

const AM_EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0
  || /\/en\//.test(location.pathname) || /-en\/?$/.test(location.pathname);
const L = (zh, en) => (AM_EN ? en : zh);

const T = {
  dropTitle: L('拖入或点击选择音频文件', 'Drop or click to select an audio file'),
  dropSub: L('FLAC / ALAC / APE / WAV / AIFF / MP3 / AAC / M4A / WMA / OGG / OPUS / DSF / DFF / DXD / AC-3 / DTS / M3U … · 全程本地解析，文件不上传',
    'FLAC / ALAC / APE / WAV / AIFF / MP3 / AAC / M4A / WMA / OGG / OPUS / DSF / DFF / DXD / AC-3 / DTS / M3U … · parsed locally, never uploaded'),
  parsing: L('正在解析…', 'Analyzing…'),
  done: L('解析完成', 'Done'),
  unknown: L('未能识别该文件，可能是未支持的音频容器。', 'Unrecognized file — possibly an unsupported audio container.'),
  fail: L('解析出错：', 'Error: '),
  copy: L('复制全部', 'Copy all'), copied: L('已复制', 'Copied'),
  reset: L('重新选择', 'Choose another'),
  techTitle: L('技术参数', 'Technical'),
  tagTitle: L('元数据标签', 'Metadata tags'),
  rawTagsTitle: L('其他标签（原始键值）', 'Other tags (raw key/value)'),
  playlistTitle: L('播放列表条目', 'Playlist entries'),
  rawTitle: L('原始解析结果（JSON）', 'Raw result (JSON)'),
  colField: L('项目', 'Field'), colValue: L('值', 'Value'), colNote: L('说明 / 合理性', 'Notes / validity'),
  noCover: L('无内嵌封面', 'No embedded cover'),
  na: 'N/A',
  coverAlt: L('专辑封面', 'Album cover'),
  coverOf: L('内嵌图片', 'Embedded images'),
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OKM = '\u2713', WARNM = '\u26A0';

function fmtBytes(v) {
  const n = Number(v);
  if (!isFinite(n)) return String(v);
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(2) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}
function fmtDur(sec) {
  if (!isFinite(sec) || sec <= 0) return '';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  const base = (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0');
  return ms ? base + '.' + String(ms).padStart(3, '0') : base;
}
function fmtSampleRate(sr) {
  if (!sr) return '';
  if (sr >= 1000000) return (sr / 1000000).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + ' MHz';
  if (sr >= 1000) return (sr / 1000).toFixed(sr % 1000 ? 1 : 0) + ' kHz';
  return sr + ' Hz';
}

// ── 字段名 ──
const FIELD = {
  format: ['格式', 'Format'], container: ['容器', 'Container'], codec: ['音频编码', 'Audio codec'], codecId: ['编码标识', 'Codec ID'],
  lossless: ['无损', 'Lossless'], sampleRate: ['采样率', 'Sample rate'], bitDepth: ['位深', 'Bit depth'],
  channels: ['声道数', 'Channels'], channelLayout: ['声道布局', 'Channel layout'], channelMode: ['声道模式', 'Channel mode'],
  channelType: ['声道类型', 'Channel type'], channelIds: ['声道标识', 'Channel IDs'],
  bitrate: ['码率', 'Bitrate'], bitrateMode: ['码率模式', 'Bitrate mode'], bitrateAvg: ['平均码率', 'Average bitrate'],
  bitrateMax: ['最大码率', 'Max bitrate'], bitrateNominal: ['标称码率', 'Nominal bitrate'],
  duration: ['时长', 'Duration'], totalSamples: ['样本总数', 'Total samples'], totalFrames: ['帧/块总数', 'Total frames'],
  frameCount: ['帧数', 'Frame count'], frameSize: ['帧字节数', 'Frame size'], blockSize: ['块字节数', 'Block size'],
  samplesPerBlock: ['每块样本数', 'Samples per block'],
  md5: ['流校验 MD5', 'Stream MD5'], fileMD5: ['容器 MD5', 'Container MD5'],
  compression: ['压缩级别', 'Compression level'], apeVersion: ['APE 版本', 'APE version'], formatVersion: ['格式版本', 'Format version'],
  encoder: ['写入器 / 编码器', 'Writing lib / encoder'], granulePos: ['末页 granule', 'Last granule'],
  preSkip: ['前置跳过', 'Pre-skip'], inputSampleRate: ['输入采样率', 'Input sample rate'],
  audioObjectType: ['AAC 对象类型', 'AAC object type'], objectType: ['对象类型', 'Object type'], bsid: ['bsid', 'bsid'],
  validBits: ['有效位深', 'Valid bits'], channelMask: ['声道掩码', 'Channel mask'],
  dataSize: ['音频数据字节数', 'Audio data bytes'], fileSize: ['容器记录的文件大小', 'File size (in container)'],
  objectCount: ['对象数', 'Object count'], timescale: ['时间基', 'Timescale'],
  entryCount: ['条目数', 'Entry count'], totalDuration: ['列表总时长', 'Total duration'], isStream: ['流式列表', 'Streaming playlist'],
  playlistType: ['列表类型', 'Playlist type'], note: ['备注', 'Note'],
};
function flabel(k) { const f = FIELD[k]; return f ? (AM_EN ? f[1] : f[0]) : k; }

// ── 技术字段展示顺序 ──
const TECH_ORDER = ['format', 'container', 'codec', 'codecId', 'lossless', 'duration', 'sampleRate', 'bitDepth', 'channels',
  'channelLayout', 'channelMode', 'channelType', 'channelIds', 'bitrate', 'bitrateMode', 'bitrateAvg', 'bitrateMax', 'bitrateNominal',
  'totalSamples', 'totalFrames', 'frameCount', 'frameSize', 'blockSize', 'samplesPerBlock', 'md5', 'fileMD5',
  'compression', 'apeVersion', 'formatVersion', 'encoder', 'audioObjectType', 'objectType', 'bsid', 'validBits', 'channelMask',
  'dataSize', 'fileSize', 'objectCount', 'timescale', 'granulePos', 'preSkip', 'inputSampleRate',
  'entryCount', 'totalDuration', 'isStream', 'playlistType', 'note'];

// 常见采样率（用于「是否合理」判断）
const COMMON_SR = new Set([8000, 11025, 16000, 22050, 32000, 44100, 48000, 88200, 96000, 176400, 192000, 352800, 384000, 705600, 768000, 2822400, 5644800, 11289600, 1536000, 3072000, 6144000, 12000000]);
const LOSSY = /MPEG|AAC|Vorbis|Opus|WMA|AC-3/i;

// ── 每行的「说明 / 合理性」 ──
function techNote(k, r) {
  const t = r.tech || {}, lossy = LOSSY.test(t.codec || '');
  switch (k) {
    case 'format': return L('按魔数+后缀判定的格式，与文件后缀无关', 'Detected by magic bytes + extension, not the file name');
    case 'container': return L('实际容器结构', 'Actual container structure');
    case 'codec': return L('音频编码算法；决定是否无损与压缩效率', 'Audio coding algorithm; determines lossless vs lossy');
    case 'lossless': return t.lossless ? L('无损：解码后与原始 PCM 完全一致 ', 'Lossless: bit-exact to source PCM ') + OKM : L('有损：高频/细节已被丢弃', 'Lossy: some detail is discarded');
    case 'codecId': return L('容器内登记的编码四字符码', 'FourCC registered in the container');
    case 'duration': {
      const d = t.duration;
      if (!d) return L('（未解析出）', '(not resolved)');
      return L('时长 ', 'Length ') + fmtDur(d) + ' ' + OKM;
    }
    case 'sampleRate': {
      const sr = t.sampleRate;
      if (!sr) return '';
      if (sr > 1000000) return L('DSD 比特率（1bit 采样），非 PCM 采样率 ', 'DSD bit rate (1-bit), not a PCM rate ') + OKM;
      const common = COMMON_SR.has(sr);
      return L('每秒采样点数；常见 44.1k / 48k，Hi-Res 96k+', 'Samples per second; 44.1k / 48k typical, 96k+ is Hi-Res')
        + (common ? ' ' + OKM : ' ' + WARNM + L(' 非常见采样率（可能是升采样）', ' unusual rate (may be upsampled)'));
    }
    case 'bitDepth': {
      const bd = t.bitDepth;
      if (bd === 1) return L('DSD 固定 1 bit', 'DSD is always 1-bit');
      const ok = [8, 16, 24, 32].indexOf(bd) >= 0;
      return L('量化位深；16 为 CD 标准，24 为录音室/Hi-Res', 'Quantisation depth; 16 = CD, 24 = studio/Hi-Res')
        + (ok ? ' ' + OKM : ' ' + WARNM + L(' 非常见位深', ' unusual depth'));
    }
    case 'channels': {
      const c = t.channels;
      const ok = c >= 1 && c <= 8;
      return L('声道数量（1 单声道 / 2 立体声 / 6 为 5.1）', 'Channel count (1 mono / 2 stereo / 6 = 5.1)') + (ok ? ' ' + OKM : ' ' + WARNM);
    }
    case 'channelLayout': case 'channelMode': case 'channelType': case 'channelIds':
      return L('声道排列方式', 'Speaker arrangement');
    case 'bitrate': {
      const br = t.bitrate;
      if (!br) return '';
      if (t.lossless) return L('无损编码码率随内容波动，仅作参考', 'For lossless this varies with content; indicative only');
      const ok = br >= 32 && br <= 1536;
      return L('每秒数据量；有损常见 96–320 kbps', 'Bits per second; 96–320 kbps typical for lossy') + (ok ? ' ' + OKM : ' ' + WARNM);
    }
    case 'bitrateMode': return L('CBR 固定码率 / VBR 可变码率', 'CBR constant / VBR variable bitrate');
    case 'bitrateAvg': case 'bitrateMax': case 'bitrateNominal': return L('各口径码率（平均 / 峰值 / 标称）', 'Bitrate figures (avg / max / nominal)');
    case 'totalSamples': return L('总采样点数（= 时长 × 采样率）', 'Total samples (= duration × rate)');
    case 'totalFrames': case 'frameCount': return L('编码帧/块总数', 'Total coded frames/blocks');
    case 'frameSize': case 'blockSize': case 'samplesPerBlock': return L('每帧/块的大小', 'Per-frame/block size');
    case 'md5': return L('FLAC 声学流校验（解码后 PCM 的 MD5）', 'FLAC audio-stream MD5 (of decoded PCM)');
    case 'fileMD5': return L('APE 记录的容器校验值', 'MD5 stored by the APE container');
    case 'compression': return L('APE 压缩档位：Fast < Normal < High < Extra High < Insane', 'APE compression preset: Fast < Normal < High < Extra High < Insane');
    case 'apeVersion': return L('Monkey\u2019s Audio 版本号', 'Monkey\u2019s Audio version');
    case 'formatVersion': return L('容器/子格式版本', 'Container/format version');
    case 'encoder': return L('写入该文件的软件或库', 'Software/library that wrote the file');
    case 'granulePos': return L('Ogg 最后一页的时间戳（采样数）', 'Ogg last-page timestamp in samples');
    case 'preSkip': return L('Opus 解码前需跳过的样本数（编码器延迟）', 'Samples to skip at start (Opus encoder delay)');
    case 'inputSampleRate': return L('Opus 宣称的输入采样率（解码恒为 48k）', 'Opus nominal input rate (decoding is always 48k)');
    case 'audioObjectType': case 'objectType': return L('编码的具体 Profile / 对象类型', 'Codec profile / object type');
    case 'bsid': return L('AC-3 码流类型（8 为 AC-3）', 'AC-3 bit-stream identification (8 = AC-3)');
    case 'validBits': return L('有效位深（容器可能按 32 对齐存储）', 'Valid bits (container may pad to 32)');
    case 'channelMask': return L('Windows 声道掩码', 'Windows channel mask');
    case 'dataSize': return L('音频数据区字节数', 'Audio data region size in bytes');
    case 'fileSize': return L('容器内部记录的文件大小', 'File size recorded inside the container');
    case 'objectCount': return L('ASF 头内对象数量', 'ASF header object count');
    case 'timescale': return L('MP4 时间基（duration = 时长 × timescale）', 'MP4 timescale (duration = secs × timescale)');
    case 'entryCount': return L('播放列表条目数', 'Playlist entry count');
    case 'totalDuration': return L('由 #EXTINF 累加的列表总时长', 'Sum of #EXTINF durations');
    case 'isStream': return t.isStream ? L('含 #EXT-X-* 标记，是流媒体列表（HLS）', 'Has #EXT-X-* tags — an HLS streaming playlist') : L('普通本地播放列表', 'Ordinary local playlist');
    case 'playlistType': return L('播放列表类型', 'Playlist flavour');
    case 'note': return L('解析备注', 'Parser note');
    default: return '';
  }
}

// ── 标签字段展示顺序 + 说明 ──
const TAG_ORDER = ['title', 'artist', 'album', 'albumArtist', 'track', 'trackTotal', 'disc', 'discTotal', 'date', 'year',
  'genre', 'composer', 'lyricist', 'performer', 'conductor', 'comment', 'lyrics', 'copyright', 'isrc', 'bpm', 'publisher',
  'encoder', 'encoderSettings', 'language', 'media', 'mood', 'grouping', 'subtitle', 'originalArtist', 'remixedBy',
  'replayGainTrack', 'replayGainAlbum', 'compilation', 'gapless', 'movement', 'movementIndex', 'playlistType', 'id3v2', 'id3v1'];
const TAG_LABEL = {
  title: ['标题', 'Title'], artist: ['艺术家', 'Artist'], album: ['专辑', 'Album'], albumArtist: ['专辑艺术家', 'Album artist'],
  track: ['音轨号', 'Track'], trackTotal: ['音轨总数', 'Total tracks'], disc: ['碟号', 'Disc'], discTotal: ['碟总数', 'Total discs'],
  date: ['日期', 'Date'], year: ['年份', 'Year'], genre: ['流派', 'Genre'], composer: ['作曲', 'Composer'],
  lyricist: ['作词', 'Lyricist'], performer: ['演奏者', 'Performer'], conductor: ['指挥', 'Conductor'],
  comment: ['备注', 'Comment'], lyrics: ['歌词', 'Lyrics'], copyright: ['版权', 'Copyright'], isrc: ['ISRC', 'ISRC'],
  bpm: ['BPM', 'BPM'], publisher: ['发行/厂牌', 'Publisher/Label'], encoder: ['编码器', 'Encoder'],
  encoderSettings: ['编码设置', 'Encoder settings'], language: ['语言', 'Language'], media: ['介质', 'Media'],
  mood: ['情绪', 'Mood'], grouping: ['分组', 'Grouping'], subtitle: ['副标题', 'Subtitle'],
  originalArtist: ['原艺术家', 'Original artist'], remixedBy: ['混音', 'Remixed by'],
  replayGainTrack: ['轨 ReplayGain', 'ReplayGain (track)'], replayGainAlbum: ['专辑 ReplayGain', 'ReplayGain (album)'],
  compilation: ['合辑', 'Compilation'], gapless: ['无缝', 'Gapless'], movement: ['乐章', 'Movement'],
  movementIndex: ['乐章号', 'Movement index'], playlistType: ['列表类型', 'Playlist type'],
  id3v2: ['ID3v2 版本', 'ID3v2 version'], id3v1: ['ID3v1 版本', 'ID3v1 version'],
};
function tlabel(k) { const f = TAG_LABEL[k]; return f ? (AM_EN ? f[1] : f[0]) : k; }
const TAG_NOTE = {
  track: () => L('格式常为「序号/总数」', 'Often "n/total"'),
  date: () => L('常见 YYYY 或 YYYY-MM-DD', 'Usually YYYY or YYYY-MM-DD'),
  year: () => L('4 位年份', '4-digit year'),
  bpm: () => L('常见 60–200', 'Typical 60–200'),
  isrc: () => L('12 位国际标准录音编码', '12-character ISRC'),
  id3v2: () => L('MP3 常用 ID3v2.3 / 2.4', 'MP3 commonly uses ID3v2.3 / 2.4'),
  id3v1: () => L('旧版标签：字段短、仅 ISO-8859-1', 'Legacy tag: short fields, Latin-1 only'),
  lyrics: () => L('可能很长', 'May be long'),
};
function tagNote(k) { const f = TAG_NOTE[k]; return f ? f() : L('字符串标签，无固定取值', 'Free-form string tag'); }

// ── 渲染 ──
let cur = null, coverUrl = null;

function section(title, rows, withNote) {
  const box = document.createElement('div');
  box.className = 'am-group';
  const h = document.createElement('div');
  h.className = 'am-group-head';
  h.textContent = title;
  box.appendChild(h);
  const table = document.createElement('table');
  table.className = 'am-table' + (withNote ? ' am-3col' : '');
  if (withNote) {
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    for (const [cls, label] of [['am-k', T.colField], ['am-v', T.colValue], ['am-note', T.colNote]]) {
      const th = document.createElement('th');
      th.className = cls;
      th.textContent = label;
      trh.appendChild(th);
    }
    thead.appendChild(trh);
    table.appendChild(thead);
  }
  const tb = document.createElement('tbody');
  let any = false;
  for (const row of rows) {
    const k = row[0], v = row[1], note = row[2], cls = row[3];
    if (v === undefined || v === null || String(v).trim() === '') continue;
    any = true;
    const tr = document.createElement('tr');
    const td1 = document.createElement('td'); td1.className = 'am-k'; td1.textContent = k;
    const td2 = document.createElement('td'); td2.className = 'am-v'; td2.textContent = String(v);
    tr.appendChild(td1); tr.appendChild(td2);
    if (withNote) {
      const td3 = document.createElement('td'); td3.className = 'am-note' + (cls ? ' ' + cls : '');
      td3.textContent = (note && String(note).trim()) ? note : T.na;
      tr.appendChild(td3);
    }
    tb.appendChild(tr);
  }
  table.appendChild(tb);
  box.appendChild(table);
  if (any) return box;
  return null;
}

function chip(label, value) {
  const d = document.createElement('div');
  d.className = 'am-chip';
  d.innerHTML = '<span class="am-chip-k"></span><span class="am-chip-v"></span>';
  d.children[0].textContent = label;
  d.children[1].textContent = value;
  return d;
}

function renderHero(r, file) {
  const hero = $('am-hero');
  hero.innerHTML = '';
  // 封面
  const cov = document.createElement('div');
  cov.className = 'am-cover';
  const pic = (r.pictures || []).find((p) => p.kind === 'cover') || (r.pictures || [])[0];
  if (coverUrl) { URL.revokeObjectURL(coverUrl); coverUrl = null; }
  if (pic && pic.bytes && pic.bytes.length) {
    try {
      coverUrl = URL.createObjectURL(new Blob([pic.bytes], { type: pic.mime || 'image/jpeg' }));
      const img = document.createElement('img');
      img.alt = T.coverAlt; img.src = coverUrl;
      cov.appendChild(img);
    } catch (e) { cov.appendChild(placeholder()); }
  } else {
    cov.appendChild(placeholder(r));
  }
  hero.appendChild(cov);

  // 标题区
  const info = document.createElement('div');
  info.className = 'am-hero-info';
  const t = r.tags || {};
  const title = t.title || file.name;
  const sub = [t.artist, t.album].filter(Boolean).join(' — ');
  info.insertAdjacentHTML('beforeend',
    '<div class="am-badge"></div><h3 class="am-title"></h3><p class="am-sub"></p>');
  info.querySelector('.am-badge').textContent = r.format || r.formatKey;
  info.querySelector('.am-title').textContent = title;
  const subEl = info.querySelector('.am-sub');
  if (sub) subEl.textContent = sub; else subEl.remove();

  const chips = document.createElement('div');
  chips.className = 'am-chips';
  const tech = r.tech || {};
  if (tech.duration) chips.appendChild(chip(L('时长', 'Length'), fmtDur(tech.duration)));
  if (tech.sampleRate) chips.appendChild(chip(L('采样率', 'Sample rate'), fmtSampleRate(tech.sampleRate)));
  if (tech.bitDepth) chips.appendChild(chip(L('位深', 'Bit depth'), tech.bitDepth + ' bit'));
  if (tech.channels) chips.appendChild(chip(L('声道', 'Channels'), String(tech.channels)));
  if (tech.bitrate) chips.appendChild(chip(L('码率', 'Bitrate'), tech.bitrate + ' kbps'));
  chips.appendChild(chip(L('文件大小', 'File size'), fmtBytes(r.fileSize)));
  info.appendChild(chips);
  hero.appendChild(info);
  hero.hidden = false;
}
function placeholder(r) {
  const d = document.createElement('div');
  d.className = 'am-cover-none';
  d.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/></svg><span></span>');
  d.querySelector('span').textContent = T.noCover;
  return d;
}

function render(r, file) {
  renderHero(r, file);
  const box = $('am-view');
  box.innerHTML = '';

  // 技术参数
  const tech = r.tech || {};
  const trows = [];
  const seen = new Set();
  for (const k of TECH_ORDER) {
    if (tech[k] === undefined || tech[k] === null || tech[k] === '') continue;
    seen.add(k);
    let v = tech[k];
    if (k === 'lossless') v = v ? L('是', 'Yes') : L('否', 'No');
    if (k === 'duration') v = fmtDur(v) || v;
    if (k === 'sampleRate') v = fmtSampleRate(v);
    if (/bitrate/i.test(k) && typeof v === 'number') v = v + ' kbps';
    if (k === 'dataSize' || k === 'fileSize') v = fmtBytes(v);
    trows.push([flabel(k), v, techNote(k, r)]);
  }
  for (const k of Object.keys(tech)) {
    if (seen.has(k) || k === 'picCount') continue;
    trows.push([flabel(k), tech[k], techNote(k, r)]);
  }
  const techSec = section(T.techTitle, trows, true);
  if (techSec) box.appendChild(techSec);

  // 标签
  const tags = r.tags || {};
  const grows = [];
  const gseen = new Set();
  for (const k of TAG_ORDER) {
    if (!tags[k]) continue;
    gseen.add(k);
    grows.push([tlabel(k), tags[k], tagNote(k)]);
  }
  for (const k of Object.keys(tags)) {
    if (gseen.has(k) || k === '__id3off') continue;
    grows.push([tlabel(k), tags[k], tagNote(k)]);
  }
  const tagSec = section(T.tagTitle, grows, true);
  if (tagSec) box.appendChild(tagSec);

  // 其他原始标签
  if (r.tagsRaw && r.tagsRaw.length) {
    const sec = section(T.rawTagsTitle, r.tagsRaw.map((kv) => [kv[0], kv[1]]), false);
    if (sec) box.appendChild(sec);
  }

  // 播放列表
  if (r.playlist && r.playlist.length) {
    const sec = section(T.playlistTitle, r.playlist.map((p, i) => ['#' + (i + 1) + (p.title ? ' · ' + p.title : ''), p.url]), false);
    if (sec) box.appendChild(sec);
  }

  // 原始 JSON
  const raw = document.createElement('div');
  raw.className = 'am-group';
  raw.insertAdjacentHTML('beforeend',
    '<div class="am-group-head am-raw-head"><span>' + esc(T.rawTitle) + '</span><button type="button" class="am-btn am-btn-sm" id="am-copyjson">' + esc(L('复制 JSON', 'Copy JSON')) + '</button></div>');
  const pre = document.createElement('pre');
  pre.className = 'am-raw';
  const dump = Object.assign({}, r);
  if (dump.pictures) dump.pictures = dump.pictures.map((p) => ({ kind: p.kind, mime: p.mime, desc: p.desc, bytes: (p.bytes && p.bytes.length) + ' bytes' }));
  pre.textContent = JSON.stringify(dump, null, 2);
  raw.appendChild(pre);
  box.appendChild(raw);
  raw.querySelector('#am-copyjson').addEventListener('click', (e) => {
    const b = e.currentTarget;
    navigator.clipboard?.writeText(pre.textContent).then(() => { b.textContent = T.copied; setTimeout(() => { b.textContent = L('复制 JSON', 'Copy JSON'); }, 1200); }).catch(() => {});
  });
}

function setStatus(msg, kind) {
  const el = $('am-status');
  el.textContent = msg || '';
  el.className = 'am-status' + (kind ? ' am-' + kind : '');
  el.hidden = !msg;
}

async function analyze(file) {
  setStatus(T.parsing);
  cur = null;
  $('am-filebar').hidden = false;
  $('am-fname').textContent = file.name;
  $('am-fsize').textContent = fmtBytes(file.size);
  $('am-hero').hidden = true;
  $('am-view').innerHTML = '';
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const r = parseAudio(bytes, file.name);
    cur = { file, r };
    if (r.formatKey === 'unknown') { setStatus(T.unknown, 'warn'); return; }
    if (r._error) setStatus(T.fail + r._error, 'warn');
    render(r, file);
    setStatus(r._error ? T.done + L('（部分字段异常已跳过）', ' (some fields skipped)') : T.done, r._error ? 'warn' : 'ok');
  } catch (e) {
    setStatus(T.fail + ((e && e.message) || e), 'err');
  }
}

function reset() {
  if (coverUrl) { URL.revokeObjectURL(coverUrl); coverUrl = null; }
  cur = null;
  $('am-file').value = '';
  $('am-filebar').hidden = true;
  $('am-hero').hidden = true;
  $('am-view').innerHTML = '';
  setStatus('');
}

// 纯文本序列化（复制用）
function toText(r) {
  const out = [];
  out.push('[' + T.techTitle + ']');
  for (const [k] of Object.entries(r.tech || {})) {
    if (k === 'picCount') continue;
    out.push('  ' + flabel(k) + ': ' + r.tech[k]);
  }
  out.push('\n[' + T.tagTitle + ']');
  for (const [k, v] of Object.entries(r.tags || {})) out.push('  ' + tlabel(k) + ': ' + v);
  if (r.tagsRaw && r.tagsRaw.length) { out.push('\n[' + T.rawTagsTitle + ']'); for (const kv of r.tagsRaw) out.push('  ' + kv[0] + ': ' + kv[1]); }
  if (r.playlist) { out.push('\n[' + T.playlistTitle + ']'); r.playlist.forEach((p, i) => out.push('  #' + (i + 1) + ' ' + (p.title ? p.title + ' — ' : '') + p.url)); }
  return out.join('\n');
}

function bind() {
  const drop = $('am-drop'), input = $('am-file');
  drop.addEventListener('click', () => input.click());
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  input.addEventListener('change', () => { if (input.files && input.files[0]) analyze(input.files[0]); });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('am-drop-active'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('am-drop-active')));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) analyze(f);
  });
  ['dragover', 'drop'].forEach((ev) => window.addEventListener(ev, (e) => e.preventDefault()));
  $('am-reset').addEventListener('click', reset);
  $('am-copy').addEventListener('click', (e) => {
    if (!cur) return;
    const b = e.currentTarget;
    navigator.clipboard?.writeText(toText(cur.r)).then(() => { b.textContent = T.copied; setTimeout(() => { b.textContent = T.copy; }, 1200); }).catch(() => {});
  });
  $('am-drop-title').textContent = T.dropTitle;
  $('am-drop-sub').textContent = T.dropSub;
  $('am-copy').textContent = T.copy;
  $('am-reset').textContent = T.reset;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
else bind();
