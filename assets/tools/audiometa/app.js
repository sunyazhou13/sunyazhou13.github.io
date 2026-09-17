// 音频元数据查看器（Audio Meta）—— 纯前端、零依赖、文件不出本机
// 字节解析见 ./audioparse.js；本文件只负责渲染与交互。
import { parseAudio } from './audioparse.js?v=202609186';

// ── 缓存击穿 ──
// app.js 自己的版本号来自页面里的 <script src="app.js?v=...">。
// 动态 import 的兄弟模块（spectrum / fftrans / dff2dsf）默认 URL 不带版本号，
// 改完这些文件浏览器照样吃旧缓存（踩过坑：波形能看到、DSF 转码却还是旧逻辑）。
// 这里统一从 import.meta.url 取出页面上那个 v，拼到所有动态 import 上，
// 以后只要改页面的 ?v=，所有模块一起失效，不用改多处。
// ⚠️ 上面 audioparse.js 的 ?v= 是静态 import（语法要求字面量），改版本时两处要一起改。
const AV = (new URL(import.meta.url).searchParams.get('v') || '');
const VS = (p) => p + (AV ? '?v=' + AV : '');

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
  lyricTitle: L('歌词', 'Lyrics'),
  lyricCopy: L('复制歌词', 'Copy lyrics'),
  lyricDownload: L('下载 .lrc', 'Download .lrc'),
  lyricHint: L('按时间戳逐行排列；可复制，或导出为 .lrc 文件', 'One line per timestamp — copy it, or export as an .lrc file'),
  lyricPlain: L('该文件未带时间戳，按原文展示', 'No timestamps in this file — shown as plain text'),
  colField: L('项目', 'Field'), colValue: L('值', 'Value'), colNote: L('说明 / 合理性', 'Notes / validity'),
  noCover: L('无内嵌封面', 'No embedded cover'),
  na: 'N/A',
  coverAlt: L('专辑封面', 'Album cover'),
  coverOf: L('内嵌图片', 'Embedded images'),
  playTitle: L('试听', 'Preview'),
  playLoading: L('正在载入解码器…', 'Loading decoder…'),
  playUnsupported: L('浏览器无法直接播放此格式', 'This format cannot be played by the browser'),
  playDecoded: L('浏览器解码时长', 'Browser duration'),
  playParsed: L('解析时长', 'Parsed duration'),
  playMatch: L('两者一致', 'they match'),
  playMismatch: L('存在差异', 'mismatch'),
  playNoParsed: L('解析器未给出时长，无法比对', 'No parsed duration to compare'),
  playLocal: L('播放同样在本机完成，不上传；大文件载入可能稍慢。', 'Playback is local as well — nothing is uploaded; large files may take a moment.'),
  playBroken: L('浏览器无法解码该流：缺少对应解码器，或文件已损坏', 'The browser cannot decode this stream: no such decoder, or the file is damaged'),
  transBtn: L('转码后试听', 'Transcode & play'),
  transHint: L('首次需载入 32 MB 解码核心，之后同一页面内复用', 'First run loads a 32 MB decoding core; reused afterwards'),
  transLoading: L('正在载入解码核心（约 32 MB）…', 'Loading the decoding core (~32 MB)…'),
  transWorking: L('正在转码…', 'Transcoding…'),
  transDone: L('已由内置 ffmpeg 转为 44.1 kHz / 16 bit PCM（软解预览）', 'Converted by built-in ffmpeg to 44.1 kHz / 16-bit PCM (software decode preview)'),
  transFail: L('转码失败：', 'Transcode failed: '),
  transUnsupported: L('该格式没有可用的转码方案', 'No transcoding path for this format'),
  specTitle: L('波形与频谱', 'Waveform & spectrum'),
  waveLabel: L('波形（时域）', 'Waveform (time domain)'),
  specLabel: L('频谱（频域）', 'Spectrum (frequency domain)'),
  specBtn: L('分析频谱', 'Analyze spectrum'),
  specWorking: L('正在解码并做 FFT…', 'Decoding and running FFT…'),
  specFail: L('频谱分析失败：', 'Spectrum analysis failed: '),
  specCutoff: L('实际有效带宽', 'Actual bandwidth'),
  specNyq: L('分析上限', 'Analysis Nyquist'),
  specHF: L('高频段电平', 'HF level'),
  specUpsampled: L('疑似升采样', 'Possibly upsampled'),
  specConsistent: L('带宽与标称相符', 'Bandwidth matches the label'),
  specUncertain: L('带宽偏低，无法确定来源', 'Bandwidth is low; source uncertain'),
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
  lossless: ['无损', 'Lossless'], sampleRate: ['采样率', 'Sample rate'], dsdRate: ['DSD 倍率', 'DSD rate'], bitDepth: ['位深', 'Bit depth'], bitOrder: ['位序', 'Bit order'],
  channels: ['声道数', 'Channels'], channelLayout: ['声道布局', 'Channel layout'], sampleLayout: ['样本交错', 'Sample interleave'], channelMode: ['声道模式', 'Channel mode'],
  channelType: ['声道类型', 'Channel type'], channelIds: ['声道标识', 'Channel IDs'],
  bitrate: ['码率', 'Bitrate'], bitrateMode: ['码率模式', 'Bitrate mode'], bitrateAvg: ['平均码率', 'Average bitrate'],
  bitrateMax: ['最大码率', 'Max bitrate'], bitrateNominal: ['标称码率', 'Nominal bitrate'], overallBitrate: ['总体码率', 'Overall bitrate'],
  duration: ['时长', 'Duration'], durationSec: ['时长（秒）', 'Duration (s)'], durationMs: ['时长（毫秒）', 'Duration (ms)'], totalSamples: ['样本总数', 'Total samples'], totalFrames: ['帧/块总数', 'Total frames'],
  frameCount: ['帧数', 'Frame count'], frameSize: ['帧字节数', 'Frame size'], blockSize: ['块字节数', 'Block size'],
  samplesPerBlock: ['每块样本数', 'Samples per block'],
  md5: ['流校验 MD5', 'Stream MD5'], fileMD5: ['容器 MD5', 'Container MD5'],
  compression: ['压缩级别', 'Compression level'], apeVersion: ['APE 版本', 'APE version'], formatVersion: ['格式版本', 'Format version'], formatId: ['格式 ID', 'Format ID'],
  encoder: ['写入器 / 编码器', 'Writing lib / encoder'], granulePos: ['末页 granule', 'Last granule'],
  preSkip: ['前置跳过', 'Pre-skip'], inputSampleRate: ['输入采样率', 'Input sample rate'],
  audioObjectType: ['AAC 对象类型', 'AAC object type'], objectType: ['对象类型', 'Object type'], bsid: ['bsid', 'bsid'],
  validBits: ['有效位深', 'Valid bits'], channelMask: ['声道掩码', 'Channel mask'],
  dataSize: ['音频数据字节数', 'Audio data bytes'], streamPct: ['流占比', 'Stream share'], fileSize: ['容器记录的文件大小', 'File size (in container)'],
  objectCount: ['对象数', 'Object count'], timescale: ['时间基', 'Timescale'],
  entryCount: ['条目数', 'Entry count'], totalDuration: ['列表总时长', 'Total duration'], isStream: ['流式列表', 'Streaming playlist'],
  playlistType: ['列表类型', 'Playlist type'], note: ['备注', 'Note'],
};
function flabel(k) { const f = FIELD[k]; return f ? (AM_EN ? f[1] : f[0]) : k; }

// ── 技术字段展示顺序 ──
const TECH_ORDER = ['format', 'container', 'codec', 'codecId', 'lossless', 'duration', 'sampleRate', 'dsdRate', 'bitDepth', 'bitOrder', 'channels',
  'channelLayout', 'sampleLayout', 'channelMode', 'channelType', 'channelIds', 'bitrate', 'bitrateMode', 'bitrateAvg', 'bitrateMax', 'bitrateNominal', 'overallBitrate',
  'totalSamples', 'totalFrames', 'frameCount', 'frameSize', 'blockSize', 'samplesPerBlock', 'md5', 'fileMD5',
  'compression', 'apeVersion', 'formatVersion', 'encoder', 'audioObjectType', 'objectType', 'bsid', 'validBits', 'channelMask',
  'dataSize', 'streamPct', 'fileSize', 'objectCount', 'timescale', 'granulePos', 'preSkip', 'inputSampleRate',
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
    case 'durationSec': return L('同一时长的「秒数」表示（精确到毫秒），便于直接换算码率 / 切割点 / 批处理',
      'The same duration expressed in seconds (ms precision) — handy for bitrate math, cut points and batch work');
    case 'durationMs': return L('同一时长的「毫秒数」表示，便于直接用于时间轴 / 字幕 / 剪辑定位',
      'The same duration expressed in milliseconds — handy for timelines, subtitles and edit points');
    case 'sampleRate': {
      const sr = t.sampleRate;
      if (!sr) return '';
      if (sr > 1000000) return L('DSD 比特率（1bit 采样），非 PCM 采样率 ', 'DSD bit rate (1-bit), not a PCM rate ') + OKM;
      const common = COMMON_SR.has(sr);
      return L('每秒采样点数；常见 44.1k / 48k，Hi-Res 96k+', 'Samples per second; 44.1k / 48k typical, 96k+ is Hi-Res')
        + (common ? ' ' + OKM : ' ' + WARNM + L(' 非常见采样率（可能是升采样）', ' unusual rate (may be upsampled)'));
    }
    case 'dsdRate': {
      const dr = t.dsdRate || '';
      const ok = /^DSD(64|128|256|512|1024)$/.test(dr);
      return L('相对 44.1 kHz 的倍率；DSD64 = 2.8224 MHz，DSD128 = 5.6448 MHz', 'Multiple of 44.1 kHz; DSD64 = 2.8224 MHz, DSD128 = 5.6448 MHz')
        + (ok ? ' ' + OKM : ' ' + WARNM + L(' 非常见倍率', ' unusual rate'));
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
    case 'sampleLayout': return L('解码后 PCM 的样本排列：交错 = 一帧内各声道样本相邻（L R L R…）；平面 = 每个声道一整条独立序列。规则是「PCM/无损容器 → 交错，有损编码与 DSD → 平面」（按主流解码器如 FFmpeg 的解码输出）；编码前的码流本身不分交不交错。',
      'PCM sample layout after decoding: interleaved = per-frame channel samples adjacent (L R L R…); planar = one contiguous run per channel. Rule: PCM/lossless containers are interleaved, lossy codecs and DSD are planar, following mainstream decoders such as FFmpeg; the coded bitstream itself is neither.');
    case 'bitrate': {
      const br = t.bitrate;
      if (!br) return '';
      const est = t.bitrateEst ? L('容器未存码率，由「音频数据量 ÷ 时长」估算；', 'not stored in container — estimated from data size ÷ duration; ') : '';
      // DSD 是恒定码率 = 采样率 × 声道数 × 1 bit，不随内容波动
      if (t.bitDepth === 1 && t.dsdRate) return est + L('DSD 恒定码率 = 采样率 × 声道数 × 1 bit，不含文件头与块对齐填充',
        'DSD is constant rate = rate × channels × 1 bit, excluding header and block padding');
      if (t.lossless) return est + L('无损编码码率随内容波动，仅作参考', 'For lossless this varies with content; indicative only');
      const ok = br >= 32 && br <= 1536;
      return est + L('每秒数据量；有损常见 96–320 kbps', 'Bits per second; 96–320 kbps typical for lossy') + (ok ? ' ' + OKM : ' ' + WARNM);
    }
    case 'bitrateMode': return L('CBR 固定码率 / VBR 可变码率', 'CBR constant / VBR variable bitrate');
    case 'bitrateAvg': case 'bitrateMax': case 'bitrateNominal': return L('各口径码率（平均 / 峰值 / 标称）', 'Bitrate figures (avg / max / nominal)');
    case 'overallBitrate': return L('容器层总体码率 = 文件大小 ÷ 时长（含标签 / 封面等开销）—— 与上面「码率」（音频流）不是一回事，MediaInfo 也是分两行列',
      'Overall/container bitrate = file size ÷ duration (includes tag/art overhead) — distinct from the audio-stream bitrate above');
    case 'bitOrder': return L('DSD 的比特顺序：Little = LSB 优先，Big = MSB 优先（对应 DSF 格式里的 bitsPerSample 1 / 8）',
      'DSD bit order: Little = LSB-first, Big = MSB-first (DSF bitsPerSample 1 / 8)');
    case 'formatId': return L('容器里登记的音频数据类型（DSF 中 0 = 原始 DSD，未压缩）',
      'Audio data type registered in the container (0 = raw uncompressed DSD in DSF)');
    case 'streamPct': return L('音频数据占整个文件的百分比；与 100% 的差值就是标签 / 封面 / 头部开销',
      'Share of the file taken by audio data; the gap to 100% is tag/art/header overhead');
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
  const top = document.createElement('div');
  top.className = 'am-hero-top';
  top.appendChild(cov);

  // 标题区
  const info = document.createElement('div');
  info.className = 'am-hero-info';
  const t = r.tags || {};
  const title = t.title || file.name;
  const sub = [t.artist, t.album].filter(Boolean).join(' — ');
  info.insertAdjacentHTML('beforeend', '<h3 class="am-title"></h3><p class="am-sub"></p>');
  info.querySelector('.am-title').textContent = title;
  const subEl = info.querySelector('.am-sub');
  if (sub) subEl.textContent = sub; else subEl.remove();

  // 试听：播放控件留在右列；频谱 + 状态行放进「整行宽」容器（稍后 append 到 hero）
  const wide = document.createElement('div');
  wide.className = 'am-hero-wide';
  info.appendChild(renderPlayer(r, file, wide));

  const chips = document.createElement('div');
  chips.className = 'am-chips';
  const tech = r.tech || {};
  if (tech.duration) chips.appendChild(chip(L('时长', 'Length'), fmtDur(tech.duration)));
  if (tech.sampleRate) chips.appendChild(chip(L('采样率', 'Sample rate'), fmtSampleRate(tech.sampleRate)));
  if (tech.bitDepth) chips.appendChild(chip(L('位深', 'Bit depth'), tech.bitDepth + ' bit'));
  if (tech.channels) chips.appendChild(chip(L('声道', 'Channels'), String(tech.channels)));
  if (tech.bitrate) chips.appendChild(chip(L('码率', 'Bitrate'), tech.bitrate + ' kbps'));
  chips.appendChild(chip(L('文件大小', 'File size'), fmtBytes(r.fileSize)));
  top.appendChild(info);
  hero.appendChild(top);
  hero.appendChild(wide);
  hero.appendChild(chips);
  // 音频格式徽标（仿 4K ULTRA HD 标：金色外框 + 黑底金字 + 金字底黑字副标）：挪到卡片右下角
  const fmt = document.createElement('div');
  fmt.className = 'am-fmt';
  fmt.insertAdjacentHTML('beforeend', '<span class="am-fmt-k"></span><span class="am-fmt-v"></span>');
  const q = qualityTier(r);
  fmt.children[0].textContent = String(r.formatKey || r.format || '?').toUpperCase();
  fmt.children[1].textContent = q.sub || q.tier;
  hero.appendChild(fmt);
  hero.hidden = false;
}

// 音质等级：给右下角格式徽标当副标（HI-RES / LOSSLESS / DSD / LOSSY）
function qualityTier(r) {
  const tech = r.tech || {}, fk = r.formatKey || '';
  const sr = tech.sampleRate || 0, bd = tech.bitDepth || 0;
  if (fk === 'm3u') return { tier: 'PLAYLIST', sub: '' };
  if (fk === 'iso') return { tier: 'SACD', sub: '' };
  if (fk === 'dsf' || fk === 'dff') {
    const sub = sr >= 11289600 ? 'DSD256' : sr >= 5644800 ? 'DSD128' : sr >= 2822400 ? 'DSD64' : 'DSD';
    return { tier: 'DSD', sub };
  }
  const lossless = tech.lossless === true || /^(flac|alac|wav|aiff|ape)$/.test(fk);
  const hires = bd >= 24 || sr > 48000;
  return { tier: hires ? 'HI-RES' : (lossless ? 'LOSSLESS' : 'LOSSY'), sub: '' };
}
function placeholder(r) {
  const d = document.createElement('div');
  d.className = 'am-cover-none';
  d.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/></svg><span></span>');
  d.querySelector('span').textContent = T.noCover;
  return d;
}

// ── 试听 ──
// 浏览器原生解码能力有限：DSD / APE / WMA / AC-3 / DTS 全部没有原生解码器，
// 这类文件明确告知原因，而不是放一个点不动的播放器。
const NOPLAY = {
  dsf: () => L('DSD（DSF）是 1-bit 码流，浏览器没有 DSD 解码器；需先转 PCM（或走 DoP）才能听',
    'DSD (DSF) is a 1-bit stream; browsers ship no DSD decoder — convert to PCM (or use DoP) first'),
  dff: () => L('DSD（DFF）是 1-bit 码流，浏览器没有 DSD 解码器；需先转 PCM（或走 DoP）才能听',
    'DSD (DFF) is a 1-bit stream; browsers ship no DSD decoder — convert to PCM (or use DoP) first'),
  ape: () => L("Monkey's Audio 是专有闭源格式，主流浏览器均不支持；可用 ffmpeg 转 FLAC 后再听",
    "Monkey's Audio is proprietary and unsupported by all major browsers — convert to FLAC with ffmpeg first"),
  wma: () => L('WMA（ASF）仅旧版 Edge / IE 支持；可用 ffmpeg 转 MP3 或 FLAC 后再听',
    'WMA (ASF) is only supported by legacy Edge/IE — convert to MP3 or FLAC with ffmpeg first'),
  ac3: () => L('AC-3 是影院/广播用的 Dolby 码流，浏览器不支持；需封装进 MP4/MKV 或转 AAC',
    'AC-3 is a cinema/broadcast Dolby stream, unsupported by browsers — mux into MP4/MKV or convert to AAC'),
  dts: () => L('DTS 是影院/多声道码流，浏览器不支持；需转 AC-3 / AAC 后播放',
    'DTS is a cinema/multichannel stream, unsupported by browsers — convert to AC-3 / AAC first'),
  m3u: () => L('M3U / M3U8 是纯文本播放列表，本身不含音频数据',
    'M3U / M3U8 is a plain-text playlist; it holds no audio data'),
  iso: () => L('SACD ISO 是光盘镜像，不是可直接解码的音频流',
    'A SACD ISO is a disc image, not a decodable audio stream'),
};

let playUrl = null;
function revokePlay() { if (playUrl) { try { URL.revokeObjectURL(playUrl); } catch (e) { } playUrl = null; } }

function noPlayNode(reason) {
  const d = document.createElement('div');
  d.className = 'am-noplay';
  d.insertAdjacentHTML('beforeend', '<b></b><span></span>');
  d.querySelector('b').textContent = T.playUnsupported + ' — ';
  d.querySelector('span').textContent = reason;
  return d;
}

function playerBox() {
  const box = document.createElement('div');
  box.className = 'am-group am-player';
  const head = document.createElement('div');
  head.className = 'am-group-head';
  head.textContent = T.playTitle;
  box.appendChild(head);
  const body = document.createElement('div');
  body.className = 'am-play-body';
  box.appendChild(body);
  return { box, body };
}

// 浏览器放不了、但可以用内置 ffmpeg 转码后试听的格式（值为喂给 ffmpeg 的扩展名）
const TRANSCODE = { dsf: '.dsf', dff: '.dsf', ape: '.ape', wma: '.wma', ac3: '.ac3', dts: '.dts' };

function renderPlayer(r, file, wide) {
  const key = r.formatKey || '';
  // 频谱 / 状态行放进「整行宽」容器；没传 wide 时退回播放器体内（旧调用兼容）
  const W = wide || null;
  if (NOPLAY[key]) {
    const p = playerBox();
    p.body.appendChild(noPlayNode(NOPLAY[key]()));
    const area = document.createElement('div');
    area.className = 'am-trans';
    const hint = document.createElement('span');
    hint.className = 'am-trans-hint';
    hint.textContent = TRANSCODE[key] ? T.transHint : T.transUnsupported;
    area.appendChild(hint);
    (W || p.body).appendChild(area);
    // 自动开始转码 —— 既然浏览器解不了，就别再让用户多点一次
    if (TRANSCODE[key]) runTranscode(r, file, key, p, area, W);
    return p.box;
  }

  const p = playerBox();
  const audio = document.createElement('audio');
  audio.className = 'am-audio';
  audio.controls = true;
  audio.preload = 'metadata';
  revokePlay();
  playUrl = URL.createObjectURL(file);
  audio.src = playUrl;
  p.body.appendChild(audio);

  // 实时频谱动画（播放时出现，暂停即停在最后一帧）—— 放整行宽容器
  const viz = document.createElement('canvas');
  viz.className = 'am-viz';
  (W || p.body).appendChild(viz);
  import(VS('./spectrum.js')).then((m) => m.bindVisualizer(audio, viz)).catch((e) => { console.warn('[am-viz]', e && e.message); viz.remove(); });

  const meta = document.createElement('div');
  meta.className = 'am-play-meta';
  meta.textContent = T.playLoading;
  (W || p.body).appendChild(meta);

  let settled = false;
  const fail = (why) => {
    if (settled) return;
    settled = true;
    audio.remove();
    viz.remove();
    meta.remove();
    p.body.appendChild(noPlayNode(why));
  };

  audio.addEventListener('loadedmetadata', () => {
    if (settled) return;
    settled = true;
    const bd = audio.duration, pd = (r.tech || {}).duration;
    meta.textContent = '';
    if (!isFinite(bd) || bd <= 0) { meta.textContent = T.playLocal; return; }
    const a = document.createElement('span');
    a.className = 'am-mono';
    a.textContent = T.playDecoded + ' ' + fmtDur(bd);
    meta.appendChild(a);
    if (!isFinite(pd) || pd <= 0) {
      const b = document.createElement('span');
      b.className = 'am-play-cmp';
      b.textContent = ' · ' + T.playNoParsed;
      meta.appendChild(b);
      return;
    }
    const diff = Math.abs(bd - pd), ok = diff <= 0.2;
    const b = document.createElement('span');
    b.className = 'am-play-cmp ' + (ok ? 'am-ok' : 'am-warn2');
    b.textContent = ' · ' + T.playParsed + ' ' + fmtDur(pd) + ' · '
      + (ok ? OKM + ' ' + T.playMatch : WARNM + ' ' + T.playMismatch + ' ' + diff.toFixed(3) + 's');
    meta.appendChild(b);
  });
  audio.addEventListener('error', () => fail(T.playBroken));
  return p.box;
}

let transUrl = null;
async function runTranscode(r, file, key, p, area, wide) {
  if (area.dataset.busy === '1') return;
  area.dataset.busy = '1';
  area.innerHTML = '';
  const st = document.createElement('div');
  st.className = 'am-play-meta';
  st.textContent = T.transLoading;
  area.appendChild(st);
  try {
    let input = new Uint8Array(await file.arrayBuffer());
    if (key === 'dff') {
      const mod = await import(VS('./dff2dsf.js'));
      input = mod.dffToDsf(input);                       // DFF → DSF（去交错 + 位反转 + 重新分块）
      st.textContent = L('已重封装为 DSF，正在转码…', 'Re-wrapped as DSF, transcoding…');
    }
    const { transcode } = await import(VS('./fftrans.js'));
    const out = await transcode(input, 'in' + TRANSCODE[key], 'out.wav',
      ['-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le'], null,
      (prog) => { st.textContent = T.transWorking + ' ' + Math.round(Math.min(1, Math.max(0, prog)) * 100) + '%'; });
    if (transUrl) { URL.revokeObjectURL(transUrl); transUrl = null; }
    transUrl = URL.createObjectURL(new Blob([out], { type: 'audio/wav' }));
    const audio = document.createElement('audio');
    audio.className = 'am-audio'; audio.controls = true; audio.preload = 'metadata'; audio.src = transUrl;
    p.body.appendChild(audio);                       // 播放控件留在右列（与标题同列）
    const viz = document.createElement('canvas');     // 频谱跟着 area 走：area 已在整行宽容器里
    viz.className = 'am-viz';
    area.parentNode.insertBefore(viz, area);
    import(VS('./spectrum.js')).then((m) => m.bindVisualizer(audio, viz)).catch((e) => { console.warn('[am-viz]', e && e.message); viz.remove(); });
    const pd = (r.tech || {}).duration;
    audio.addEventListener('loadedmetadata', () => {
      const bd = audio.duration;
      st.textContent = T.transDone
        + (isFinite(bd) && bd > 0 ? ' · ' + T.playDecoded + ' ' + fmtDur(bd) : '')
        + (isFinite(pd) && pd > 0 ? ' · ' + T.playParsed + ' ' + fmtDur(pd) : '');
    });
  } catch (e) {
    st.className = 'am-play-meta am-err-text';
    st.textContent = T.transFail + ((e && e.message) || e);
    const retry = document.createElement('button');
    retry.type = 'button'; retry.className = 'am-btn am-btn-sm'; retry.textContent = T.transBtn;
    retry.addEventListener('click', () => { area.dataset.busy = ''; runTranscode(r, file, key, p, area, wide); });
    area.appendChild(retry);
  }
}

const khz = (f) => (Math.round(f / 100) / 10) + ' kHz';

function specGroup(r, file) {
  const box = document.createElement('div');
  box.className = 'am-group am-spec';
  const head = document.createElement('div');
  head.className = 'am-group-head';
  const span = document.createElement('span'); span.textContent = T.specTitle;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'am-btn am-btn-sm'; btn.textContent = T.specBtn;
  head.appendChild(span); head.appendChild(btn);
  box.appendChild(head);
  const body = document.createElement('div');
  body.className = 'am-spec-body';
  const st = document.createElement('div');
  st.className = 'am-spec-status';
  body.appendChild(st);
  box.appendChild(body);
  btn.addEventListener('click', () => runSpectrum(r, file, body, st, btn));
  return box;
}

async function runSpectrum(r, file, body, st, btn) {
  if (btn.dataset.busy === '1') return;
  btn.dataset.busy = '1'; btn.disabled = true;
  st.className = 'am-spec-status';
  st.textContent = T.specWorking;
  let canvas = null;
  try {
    const key = r.formatKey || '';
    let pcm = new Uint8Array(await file.arrayBuffer());
    if (NOPLAY[key] && TRANSCODE[key]) {
      let input = pcm;
      if (key === 'dff') { const m = await import(VS('./dff2dsf.js')); input = m.dffToDsf(input); }
      const { transcode } = await import(VS('./fftrans.js'));
      // DSD 转到 88.2 kHz：否则看不到 20 kHz 以上的噪声整形特征
      const ar = (key === 'dsf' || key === 'dff') ? '88200' : '44100';
      pcm = await transcode(input, 'sp' + TRANSCODE[key], 'sp.wav', ['-ar', ar, '-ac', '2', '-c:a', 'pcm_s16le'], null,
        (p) => { st.textContent = T.transWorking + ' ' + Math.round(Math.min(1, Math.max(0, p)) * 100) + '%'; });
    }
    st.textContent = T.specWorking;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('浏览器不支持 Web Audio');
    // 关键：decodeAudioData 会把音频重采样到 AudioContext 的采样率。不指定就用默认的
    // 44.1 kHz —— 那样 96k / 192k 文件的分析上限被压到 22.05 kHz，真假 Hi-Res 判定彻底失效。
    // 转码来的按转码后的速率算；原生解码的按文件标称采样率建 context。
    const wantRaw = (NOPLAY[key] && TRANSCODE[key])
      ? ((key === 'dsf' || key === 'dff') ? 88200 : 44100)
      : ((r.tech && r.tech.sampleRate) || 0);
    let ctx = null;
    if (wantRaw >= 8000 && wantRaw <= 96000) {
      try { ctx = new AC({ sampleRate: wantRaw }); } catch (e) { ctx = null; }
    }
    if (!ctx) ctx = new AC();
    const ab = pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength);
    const buf = await ctx.decodeAudioData(ab);
    const sp = await import(VS('./spectrum.js'));
    const spec = sp.analyzeSpectrum(buf);

    const cap = (t) => { const d = document.createElement('div'); d.className = 'am-cap'; d.textContent = t; return d; };

    // 时域：波形（双声道各一条）
    body.appendChild(cap(T.waveLabel));
    const wc = document.createElement('canvas');
    wc.className = 'am-wave';
    body.appendChild(wc);
    sp.drawWaveform(wc, sp.computeWaveform(buf, 900), { height: 96 });

    // 频域：频谱 + 截止判定
    body.appendChild(cap(T.specLabel));
    canvas = document.createElement('canvas');
    canvas.className = 'am-spec-canvas';
    body.appendChild(canvas);
    sp.drawSpectrum(canvas, spec, { cutoff: spec.cutoff, height: 300 });

    // 判定
    const isDsd = key === 'dsf' || key === 'dff';
    const lossy = r.tech && r.tech.lossless === false;
    // 判据里的「上限」取实际分析的 PCM 奈奎斯特频率，而不是文件标称采样率：
    // DSD 标称 2.8224 MHz，但我们是转成 88.2 kHz PCM 分析的，拿标称值比没有意义。
    const nyq = spec.sr / 2;
    const nominal = (r.tech && r.tech.sampleRate) || spec.sr;
    let cls = 'am-verdict-ok', title = T.specConsistent, detail = '';
    if (isDsd) {
      cls = 'am-verdict-info';
      title = L('DSD 噪声整形', 'DSD noise shaping');
      detail = L('高频段噪声随频率抬升，这是 DSD 噪声整形的正常形态，不是缺陷；曲线在超声频段上翘属于预期。',
        'Noise rises with frequency — that is DSD noise shaping, not a defect; the curve climbing in the ultrasonic band is expected.');
    } else if (lossy) {
      cls = 'am-verdict-info';
      title = L('有损编码的高频截止', 'Lossy codec roll-off');
      detail = L('有损编码本身就会砍掉高频，此处的截止属于编码行为，不代表母带缺失，不能据此判断真假 Hi-Res。',
        'Lossy coding removes high frequencies by design; this roll-off says nothing about the master, so it cannot be used to judge Hi-Res authenticity.');
    } else if (nyq >= 40000 && spec.hfInner !== null && spec.hfInner <= -90) {
      cls = 'am-verdict-warn'; title = T.specUncertain;
      detail = L('21 kHz 附近几乎没有内容（' + Math.round(spec.hfInner) + ' dB），母带高频本身就极少，无法据此判断是否升采样。',
        'There is almost nothing around 21 kHz (' + Math.round(spec.hfInner) + ' dB) — this master has very little HF content, so upsampling cannot be judged from it.');
    } else if (nyq >= 40000 && spec.hfDrop !== null && spec.hfDrop <= -15) {
      cls = 'am-verdict-warn';
      title = T.specUpsampled;
      detail = L('紧邻 22.05 kHz 的两个窄带（21–22 kHz / 23–25 kHz）落差达 ' + Math.round(-spec.hfDrop)
        + ' dB —— 天然滚降在这个间隔上只有 1–3 dB，这是砖墙断崖，特征与 44.1 kHz 母带一致，很可能是升采样的“假 Hi-Res”。',
        'The gap between the two narrow bands straddling 22.05 kHz (21–22 / 23–25 kHz) is ' + Math.round(-spec.hfDrop)
        + ' dB — natural roll-off only accounts for 1–3 dB across that gap, so this is a brick wall: the signature of a 44.1 kHz master, i.e. likely an upsampled "fake Hi-Res".');
    } else if (spec.cutoff < nyq * 0.6) {
      cls = 'am-verdict-warn'; title = T.specUncertain;
      detail = L('有效带宽明显低于标称奈奎斯特频率，可能是母带本身带宽有限，也可能经过处理。',
        'Bandwidth is well below the nominal Nyquist — the master may be limited, or the audio may have been processed.');
    } else {
      detail = L('内容一直延伸到 ' + khz(spec.cutoff) + '，与标称的 ' + khz(nyq) + ' 相符。',
        'Content extends to ' + khz(spec.cutoff) + ', consistent with the nominal ' + khz(nyq) + '.');
    }

    const v = document.createElement('div');
    v.className = 'am-verdict ' + cls;
    v.insertAdjacentHTML('beforeend', '<div class="am-verdict-title"></div><div class="am-verdict-detail"></div><div class="am-verdict-nums"></div>');
    v.querySelector('.am-verdict-title').textContent = title;
    v.querySelector('.am-verdict-detail').textContent = detail;
    const nums = v.querySelector('.am-verdict-nums');
    nums.innerHTML = '';
    [[T.specCutoff, khz(spec.cutoff)], [T.specNyq, khz(nyq)], [T.specHF, Math.round(spec.hfLevel) + ' dB']]
      .forEach(([k, val]) => {
        const d = document.createElement('span');
        d.className = 'am-vnum';
        d.insertAdjacentHTML('beforeend', '<i></i><b></b>');
        d.querySelector('i').textContent = k;
        d.querySelector('b').textContent = val;
        nums.appendChild(d);
      });
    body.appendChild(v);
    st.textContent = '';
  } catch (e) {
    st.className = 'am-spec-status am-err-text';
    st.textContent = T.specFail + ((e && e.message) || e);
  } finally {
    btn.disabled = false;
  }
}

// ── 歌词：LRC 解析 / 导出 ──
// LRC 形如：[ti:..][ar:..] [00:00.97]第一句 [00:02.88]第二句 …
// 非数字标签（ti/ar/al/by/offset…）当头部保留；其余按 [mm:ss.xx] 切成一行一句。
function lrcParse(raw) {
  let body = String(raw || '').replace(/\r\n?/g, '\n');
  const meta = [];
  body = body.replace(/\[([a-zA-Z]{1,10}):([^\]]*)\]/g, (_, k, v) => { meta.push([k.toLowerCase(), v.trim()]); return ''; });
  const re = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  const marks = [];
  let m;
  while ((m = re.exec(body))) {
    marks.push({ pos: m.index, end: re.lastIndex, sec: (+m[1]) * 60 + (+m[2]) + (m[3] ? +('0.' + m[3]) : 0) });
  }
  // 取每个时间戳之后、下一个时间戳之前的文本
  const seq = [];
  for (let i = 0; i < marks.length; i++) {
    seq.push({ sec: marks[i].sec, text: body.slice(marks[i].end, i + 1 < marks.length ? marks[i + 1].pos : body.length).replace(/\s+/g, ' ').trim() });
  }
  // 相邻的空文本时间戳（同词多时间）合并到后面那句
  const items = [];
  let pending = [];
  for (const e of seq) {
    if (!e.text) { pending.push(e.sec); continue; }
    items.push({ sec: pending.length ? pending[0] : e.sec, times: pending.concat(e.sec), text: e.text });
    pending = [];
  }
  items.sort((a, b) => a.sec - b.sec);
  return { meta, items, hasTime: marks.length > 0 };
}

function fmtLrcTime(sec) {
  sec = Math.max(0, sec);
  const m = Math.floor(sec / 60), s = sec - m * 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
}

function lrcBuild(parsed, rawFallback) {
  if (!parsed.hasTime) return String(rawFallback || '').replace(/\r\n?/g, '\n').trim() + '\n';
  const out = [];
  for (const kv of parsed.meta) out.push('[' + kv[0] + ':' + kv[1] + ']');
  for (const it of parsed.items) for (const t of it.times) out.push('[' + fmtLrcTime(t) + ']' + it.text);
  return out.join('\n') + '\n';
}

function lyricsSection(r) {
  const raw = (r.tags || {}).lyrics;
  if (!raw || !String(raw).trim()) return null;
  const parsed = lrcParse(raw);
  const lrc = lrcBuild(parsed, raw);

  const box = document.createElement('div');
  box.className = 'am-group';
  const head = document.createElement('div');
  head.className = 'am-group-head';
  const span = document.createElement('span'); span.textContent = T.lyricTitle;
  const btns = document.createElement('div'); btns.className = 'am-lyrics-btns';
  const bc = document.createElement('button'); bc.type = 'button'; bc.className = 'am-btn am-btn-sm'; bc.textContent = T.lyricCopy;
  const bd = document.createElement('button'); bd.type = 'button'; bd.className = 'am-btn am-btn-sm'; bd.textContent = T.lyricDownload;
  btns.appendChild(bc); btns.appendChild(bd);
  head.appendChild(span); head.appendChild(btns);
  box.appendChild(head);

  if (parsed.hasTime) {
    const body = document.createElement('div'); body.className = 'am-lyrics-body';
    for (const it of parsed.items) {
      const line = document.createElement('div'); line.className = 'am-lrc-line';
      const tt = document.createElement('span'); tt.className = 'am-lrc-t';
      tt.textContent = it.times.map((x) => '[' + fmtLrcTime(x) + ']').join('');
      const xx = document.createElement('span'); xx.className = 'am-lrc-x'; xx.textContent = it.text;
      line.appendChild(tt); line.appendChild(xx);
      body.appendChild(line);
    }
    box.appendChild(body);
  } else {
    const pre = document.createElement('pre'); pre.className = 'am-lrc-plain';
    pre.textContent = String(raw).replace(/\r\n?/g, '\n').trim();
    box.appendChild(pre);
  }
  const hint = document.createElement('div'); hint.className = 'am-lyrics-hint';
  hint.textContent = parsed.hasTime ? T.lyricHint : T.lyricPlain;
  box.appendChild(hint);

  bc.addEventListener('click', () => {
    const done = () => { bc.textContent = T.copied; setTimeout(() => { bc.textContent = T.lyricCopy; }, 1200); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lrc).then(done).catch(() => {});
    } else {
      const ta = document.createElement('textarea'); ta.value = lrc;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { }
      ta.remove();
    }
  });
  bd.addEventListener('click', () => {
    const base = String((r.tags || {}).title || r.fileName || 'lyrics')
      .replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'lyrics';
    const url = URL.createObjectURL(new Blob([lrc], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = base + '.lrc';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  });
  return box;
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
    if (k === 'streamPct' && typeof v === 'number') v = v + '%';
    trows.push([flabel(k), v, techNote(k, r)]);
    // 时长额外补两行：秒 / 毫秒 —— 有些人就想直接看数值（便于换算/比对）
    if (k === 'duration' && typeof tech.duration === 'number' && tech.duration > 0) {
      trows.push([flabel('durationSec'), tech.duration.toFixed(3) + ' s', techNote('durationSec', r)]);
      trows.push([flabel('durationMs'), Math.round(tech.duration * 1000) + ' ms', techNote('durationMs', r)]);
    }
  }
  for (const k of Object.keys(tech)) {
    if (seen.has(k) || k === 'picCount' || k === 'bitrateEst') continue;
    trows.push([flabel(k), tech[k], techNote(k, r)]);
  }
  const techSec = section(T.techTitle, trows, true);
  if (techSec) box.appendChild(techSec);

  // 频谱分析（纯文本列表 / 光盘镜像不做）
  const fk = r.formatKey || '';
  if (fk !== 'm3u' && fk !== 'iso') box.appendChild(specGroup(r, file));

  // 标签（歌词单独成块，见 lyricsSection）
  const tags = r.tags || {};
  const grows = [];
  const gseen = new Set();
  for (const k of TAG_ORDER) {
    if (!tags[k] || k === 'lyrics') continue;
    gseen.add(k);
    grows.push([tlabel(k), tags[k], tagNote(k)]);
  }
  for (const k of Object.keys(tags)) {
    if (gseen.has(k) || k === '__id3off' || k === 'lyrics') continue;
    grows.push([tlabel(k), tags[k], tagNote(k)]);
  }
  const tagSec = section(T.tagTitle, grows, true);
  if (tagSec) box.appendChild(tagSec);

  // 歌词：单独一块，按时间戳逐行，可复制 / 导出 .lrc
  const lyrSec = lyricsSection(r);
  if (lyrSec) box.appendChild(lyrSec);

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
  revokePlay();
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
  revokePlay();
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
  // 文件输入以透明层覆盖整个拖拽区，点击/拖入由浏览器原生处理（含键盘聚焦后回车），无需再 input.click()
  input.addEventListener('change', () => { if (input.files && input.files[0]) analyze(input.files[0]); });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('am-drop-active'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('am-drop-active')));
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
