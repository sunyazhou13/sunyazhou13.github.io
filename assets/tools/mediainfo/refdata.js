// 媒体信息查看器 —— 参数「参考值 / 备注」数据表（中英双语）
// 设计原则：
//   1. 参考值 = 常见推荐范围 / 典型取值，不是“唯一正确值”；纯标识 / 标签 / 时间戳类字段不收录 → 渲染 N/A
//   2. 同一键名在不同轨道含义不同（如 Format：容器 / 视频编码 / 音频编码），故用 "轨道:键" 复合键优先，退化到纯键
//   3. 每条 ref/note 存 [中文, 英文] 数组，运行时按页面语言取 [mi_en?1:0]
//   4. 本文件不依赖 DOM / window，可被浏览器与 Node 同时加载（便于单元测试）

const E = (zh, en) => [zh, en];

// 复合键 "Track:Key" 优先；纯 "Key" 兜底
export const REF = {
  // 跨轨道都可能出现的通用键（General 中作为全局摘要，Video 中作为轨内字段）
  'FrameRate': {
    ref: E('24 / 25 / 30 / 50 / 60 fps', '24 / 25 / 30 / 50 / 60 fps'),
    note: E('影视 24/25，网络 30，高帧 50/60；>60 较少见',
      'Film/TV 24/25, web 30, high-fps 50/60; >60 rare'),
  },
  'FrameRate_Mode': {
    ref: E('CFR 更适合剪辑', 'CFR better for editing'),
    note: E('VFR 省体积，但非线编时间戳易乱、可能音画漂移，建议转 CFR',
      'VFR saves space but confuses NLE timestamps and may drift A/V; convert to CFR'),
  },

  // ── 通用 / 容器 ──
  'General:Format': {
    ref: E('MP4 / MKV / MOV / WebM', 'MP4 / MKV / MOV / WebM'),
    note: E('MP4 兼容性最广；MKV 功能最全（多音轨/章节）；TS 适合流媒体；按播放目标选容器',
      'MP4 has the widest compatibility; MKV is most feature-complete; TS suits streaming. Pick by playback target'),
  },
  'General:OverallBitRate': {
    ref: E('视内容与编码而定', 'depends on content & codec'),
    note: E('总码率≈视频+音频之和；必须配合分辨率/帧率看才有意义，单独看无意义',
      'Overall ≈ video + audio bit rate; only meaningful together with resolution & frame rate'),
  },

  // ── 视频 ──
  'Video:Format': {
    ref: E('H.264 / HEVC / AV1 / VP9', 'H.264 / HEVC / AV1 / VP9'),
    note: E('H.264 兼容性最广；HEVC/AV1 更省带宽但硬解与浏览器支持有限；VP9 多见于 WebM',
      'H.264 widest support; HEVC/AV1 save bandwidth but limited HW decode / browser support; VP9 common in WebM'),
  },
  'Video:Format_Profile': {
    ref: E('High（主流）/ Main10（10bit）', 'High (mainstream) / Main10 (10-bit)'),
    note: E('H.264：Baseline（老移动端）/ Main / High；10bit 需 High 10 / Main 10',
      'H.264: Baseline (legacy mobile) / Main / High; 10-bit needs High 10 / Main 10'),
  },
  'Video:Format_Level': {
    ref: E('由分辨率×帧率上限决定', 'capped by resolution × frame rate'),
    note: E('Level 决定设备能否硬解；超出则播放设备无法解码（如 High@4.1 上限约 1080p30）',
      'Level caps decode capability; exceeding it means the device cannot decode (e.g. High@4.1 ≈ 1080p30)'),
  },
  'Video:Format_Settings_CABAC': {
    ref: E('建议开启', 'recommended on'),
    note: E('CABAC 比 CAVLC 压缩率更高，仅略微增加解码算力',
      'CABAC gives better compression than CAVLC for slightly more decode cost'),
  },
  'Video:Format_Settings_RefFrames': {
    ref: E('1–16 帧（常见 3–5）', '1–16 frames (often 3–5)'),
    note: E('参考帧越多压缩越好，但解码内存占用与延迟上升',
      'More reference frames → better compression, but more decode memory and latency'),
  },
  'Video:BitRate': {
    ref: E('取决于分辨率×帧率×编码', 'depends on resolution × fps × codec'),
    note: E('1080p30 H.264 常见 4–10 Mb/s；720p 2–5 Mb/s；过低明显糊、过高浪费带宽',
      '1080p30 H.264 ≈ 4–10 Mb/s; 720p ≈ 2–5 Mb/s; too low = blurry, too high = wasted'),
  },
  'Video:BitRate_Mode': {
    ref: E('VBR 更省 / CBR 更稳', 'VBR saves / CBR stable'),
    note: E('流媒体常用 CBR 或 VBV 限幅；归档可用 CRF/VBR 控质量',
      'Streaming prefers CBR or VBV cap; archival can use CRF/VBR for quality'),
  },
  'Video:Width': {
    ref: E('标准档：480/720/1080/1440/2160p', 'tiers: 480/720/1080/1440/2160p'),
    note: E('注意旋转与 SAR/PAR，显示尺寸常≠存储尺寸',
      'Watch rotation & SAR/PAR; displayed size often ≠ stored size'),
  },
  'Video:Height': {
    ref: E('标准档：480/720/1080/1440/2160p', 'tiers: 480/720/1080/1440/2160p'),
    note: E('注意旋转与 SAR/PAR，显示尺寸常≠存储尺寸',
      'Watch rotation & SAR/PAR; displayed size often ≠ stored size'),
  },
  'Video:FrameRate': {
    ref: E('24 / 25 / 30 / 50 / 60 fps', '24 / 25 / 30 / 50 / 60 fps'),
    note: E('影视 24/25，网络 30，高帧 50/60；>60 较少见',
      'Film/TV 24/25, web 30, high-fps 50/60; >60 rare'),
  },
  'Video:FrameRate_Mode': {
    ref: E('CFR 更适合剪辑', 'CFR better for editing'),
    note: E('VFR 省体积，但非线编时间戳易乱、可能音画漂移，建议转 CFR',
      'VFR saves space but confuses NLE timestamps and may drift A/V; convert to CFR'),
  },
  'Video:ChromaSubsampling': {
    ref: E('4:2:0（主流）/ 4:2:2 / 4:4:4', '4:2:0 (mainstream) / 4:2:2 / 4:4:4'),
    note: E('4:2:0 最省带宽；4:2:2/4:4:4 用于后期与母版，保留完整色度',
      '4:2:0 saves bandwidth; 4:2:2/4:4:4 for post-production & masters, full chroma'),
  },
  'Video:BitDepth': {
    ref: E('8 位 SDR / 10 位 HDR', '8-bit SDR / 10-bit HDR'),
    note: E('HDR 与高质量渐变需 10bit；8bit 暗部易出色彩断层（banding）',
      'HDR & smooth gradients need 10-bit; 8-bit shows banding in gradients'),
  },
  'Video:ScanType': {
    ref: E('Progressive 逐行（主流）', 'Progressive (mainstream)'),
    note: E('隔行 Interlaced 已基本淘汰，播放需正确去交错否则拉丝',
      'Interlaced is largely obsolete; needs correct deinterlace or shows combing'),
  },
  'Video:ColorSpace': {
    ref: E('YUV', 'YUV'),
    note: E('显示/压缩用 YUV；RGB 仅特定采集或处理场景',
      'Display/compression use YUV; RGB only in specific capture or processing'),
  },
  'Video:colour_primaries': {
    ref: E('BT.709（SDR）/ BT.2020（HDR）', 'BT.709 (SDR) / BT.2020 (HDR)'),
    note: E('色彩三要素需配套，错配会偏色（尤其 601 与 709 混用）',
      'Colour triple must match; mismatch causes wrong colour (esp. 601 vs 709)'),
  },
  'Video:transfer_characteristics': {
    ref: E('BT.709 / PQ / HLG', 'BT.709 / PQ / HLG'),
    note: E('HDR 用 PQ 或 HLG；SDR 用 BT.709；与 primaries/matrix 必须一致',
      'HDR uses PQ or HLG; SDR uses BT.709; must match primaries/matrix'),
  },
  'Video:matrix_coefficients': {
    ref: E('BT.709 / BT.2020', 'BT.709 / BT.2020'),
    note: E('与 primaries/transfer 必须一致，否则偏色',
      'Must match primaries/transfer or colour is wrong'),
  },
  'Video:colour_range': {
    ref: E('Limited（广电）/ Full（PC）', 'Limited (broadcast) / Full (PC)'),
    note: E('范围不一致会导致画面过亮/过暗（如 Full 当 Limited 播放发灰）',
      'Mismatch causes too bright/dark (e.g. Full treated as Limited looks washed out)'),
  },
  'Video:HDR_Format': {
    ref: E('HDR10 / HLG / Dolby Vision', 'HDR10 / HLG / Dolby Vision'),
    note: E('需色深 + 传输函数 + 元数据三者配套才成立',
      'Needs bit depth + transfer + metadata all together'),
  },

  // ── 音频 ──
  'Audio:Format': {
    ref: E('AAC / MP3 / FLAC / Opus', 'AAC / MP3 / FLAC / Opus'),
    note: E('AAC 兼容性最好；Opus 更省；FLAC 无损；MP3 老但通用',
      'AAC widest support; Opus more efficient; FLAC lossless; MP3 legacy-universal'),
  },
  'Audio:BitRate': {
    ref: E('64–320 kb/s（有损）', '64–320 kb/s (lossy)'),
    note: E('每声道约 64k 起步；立体声 128–256k 常见；VBR 更省',
      '≈64k per channel minimum; stereo 128–256k typical; VBR saves'),
  },
  'Audio:BitRate_Mode': {
    ref: E('VBR 省 / CBR 稳', 'VBR saves / CBR stable'),
    note: E('流媒体偏好 CBR 或限幅，避免码率波动',
      'Streaming prefers CBR or cap to avoid bit-rate swings'),
  },
  'Audio:Channel(s)': {
    ref: E('1 单声道 / 2 立体声 / 5.1·7.1 环绕', '1 mono / 2 stereo / 5.1·7.1 surround'),
    note: E('布局标错会串声道（如人声跑到后置）',
      'Wrong layout swaps channels (e.g. voice to rear)'),
  },
  'Audio:Channels': {
    ref: E('1 单声道 / 2 立体声 / 5.1·7.1 环绕', '1 mono / 2 stereo / 5.1·7.1 surround'),
    note: E('布局标错会串声道（如人声跑到后置）',
      'Wrong layout swaps channels (e.g. voice to rear)'),
  },
  'Audio:ChannelLayout': {
    ref: E('mono / stereo / 5.1', 'mono / stereo / 5.1'),
    note: E('声道布局须与实际声道数一致，否则播放串声',
      'Layout must match channel count or playback swaps audio'),
  },
  'Audio:SamplingRate': {
    ref: E('44.1k / 48k / 96k / 192k Hz', '44.1k / 48k / 96k / 192k Hz'),
    note: E('影视配音常 48k，音乐常见 44.1k；Hi-Res 用 96k/192k',
      'Video often 48k, music 44.1k; Hi-Res uses 96k/192k'),
  },
  'Audio:BitDepth': {
    ref: E('16 / 24 / 32 bit', '16 / 24 / 32 bit'),
    note: E('制作链路 24bit，交付常 16bit；无损归档可用 24/32',
      'Production 24-bit, delivery often 16-bit; lossless archive 24/32'),
  },
  'Audio:Compression_Mode': {
    ref: E('有损 / 无损', 'lossy / lossless'),
    note: E('有损省空间，无损保真用于母版与归档',
      'Lossy saves space, lossless preserves fidelity for masters'),
  },

  // ── 字幕 ──
  'Text:Format': {
    ref: E('SRT / ASS / WebVTT / PGS', 'SRT / ASS / WebVTT / PGS'),
    note: E('文本字幕体积小可搜索；图形字幕（PGS/VobSub）体积大、难改',
      'Text subs are small & searchable; image subs (PGS/VobSub) large & hard to edit'),
  },
};

// 取某字段的参考信息；返回 null 表示无参考值（渲染 N/A）
export function refEntry(trackType, key, mi_en) {
  const e = REF[(trackType || '') + ':' + key] || REF[key];
  if (!e) return null;
  const i = mi_en ? 1 : 0;
  return {
    ref: e.ref ? e.ref[i] : '',
    note: e.note ? e.note[i] : '',
  };
}
