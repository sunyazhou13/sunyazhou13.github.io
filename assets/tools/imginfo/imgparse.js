// 图片元数据解析（纯前端、零依赖、零上传）
// 设计原则：
//   1. 直接从文件字节读取元数据：格式靠魔数、尺寸靠各格式头部、EXIF 靠 TIFF IFD、ICC 靠 'acsp' 扫描。
//      不依赖浏览器原生解码，因此 HEIC / AVIF 这类“浏览器可能解不了像素”的格式，元数据照样能读出来。
//   2. 每个子解析器都用 try/catch 包裹，任何格式的异常都降级为“该项留空”，绝不导致整体解析失败。
//   3. 本模块不碰 window / document，可在浏览器与 Node 同时加载（便于单测）。

// ── 字节读取小工具 ──
function u16(b, o, le) { return le ? (b[o] | (b[o + 1] << 8)) : ((b[o] << 8) | b[o + 1]); }
function u32(b, o, le) {
  return le
    ? (b[o] >>> 0) + (b[o + 1] << 8) + (b[o + 2] << 16) + (b[o + 3] * 0x1000000)
    : ((b[o] << 24) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3]) >>> 0;
}
function sz(b, o, n) { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(b[o + i]); return s; }
function ascii(b, o, n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const c = b[o + i];
    if (c === 0) break;
    s += (c >= 0x20 && c <= 0x7e) ? String.fromCharCode(c) : ' ';
  }
  return s.trim();
}
// 取出字节区间内最长的可打印 ASCII 片段（跳过长度前缀等控制字节），用于容错解析 ICC 文本标签
function firstAsciiRun(b, start, end) {
  let best = '', cur = '';
  for (let i = start; i < end; i++) {
    const c = b[i];
    if (c >= 0x20 && c < 0x7f) cur += String.fromCharCode(c);
    else { if (cur.length > best.length) best = cur; cur = ''; }
  }
  if (cur.length > best.length) best = cur;
  return best.length >= 2 ? best : null;
}
function find4(b, type) {
  const c0 = type.charCodeAt(0), c1 = type.charCodeAt(1), c2 = type.charCodeAt(2), c3 = type.charCodeAt(3);
  for (let i = 0; i + 4 <= b.length; i++)
    if (b[i] === c0 && b[i + 1] === c1 && b[i + 2] === c2 && b[i + 3] === c3) return i;
  return -1;
}
export function findSeq(b, arr) {
  for (let i = 0; i + arr.length <= b.length; i++) {
    let ok = true;
    for (let j = 0; j < arr.length; j++) if (b[i + j] !== arr[j]) { ok = false; break; }
    if (ok) return i;
  }
  return -1;
}
function countOcc(b, type) {
  const c0 = type.charCodeAt(0), c1 = type.charCodeAt(1), c2 = type.charCodeAt(2), c3 = type.charCodeAt(3);
  let c = 0;
  for (let i = 0; i + 4 <= b.length; i++)
    if (b[i] === c0 && b[i + 1] === c1 && b[i + 2] === c2 && b[i + 3] === c3) c++;
  return c;
}

// ── 格式识别（魔数）──
function detectFormat(b) {
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'png';
  if (sz(b, 0, 3) === 'GIF') return 'gif';
  if (sz(b, 0, 4) === 'RIFF' && sz(b, 8, 4) === 'WEBP') return 'webp';
  if (b[0] === 0x42 && b[1] === 0x4D) return 'bmp';
  if ((sz(b, 0, 2) === 'II' && b[2] === 0x2A && b[3] === 0) ||
      (sz(b, 0, 2) === 'MM' && b[2] === 0 && b[3] === 0x2A)) return 'tiff';
  if (sz(b, 4, 4) === 'ftyp') {
    const major = sz(b, 8, 4);
    const brands = major + sz(b, 12, 4) + sz(b, 16, 4) + sz(b, 20, 4);
    if (/avif/.test(brands)) return 'avif';
    if (/heic|heix|hevc|heim|heis|mif1|msf1/.test(brands)) return 'heic';
    if (major === 'jp2 ' || major === 'jpx ') return 'jp2';
    return 'heif';
  }
  if (b[0] === 0 && b[1] === 0 && b[2] === 0x01 && b[3] === 0) return 'ico';
  return 'unknown';
}

const META = {
  jpeg: { label: 'JPEG', mime: 'image/jpeg' },
  png: { label: 'PNG', mime: 'image/png' },
  gif: { label: 'GIF', mime: 'image/gif' },
  webp: { label: 'WebP', mime: 'image/webp' },
  avif: { label: 'AVIF', mime: 'image/avif' },
  heic: { label: 'HEIC (HEIF)', mime: 'image/heic' },
  heif: { label: 'HEIF', mime: 'image/heif' },
  tiff: { label: 'TIFF', mime: 'image/tiff' },
  bmp: { label: 'BMP', mime: 'image/bmp' },
  jp2: { label: 'JPEG 2000', mime: 'image/jp2' },
  ico: { label: 'ICO', mime: 'image/x-icon' },
  unknown: { label: '未知格式', mime: '' },
};

// ── 各格式解析 ──
function fillPNG(b, res) {
  if (sz(b, 12, 4) !== 'IHDR') return;
  res.width = u32(b, 16, false);
  res.height = u32(b, 20, false);
  res.bitDepth = b[24];
  const ct = b[25];
  res.colorType = { 0: '灰度 (Grayscale)', 2: 'RGB', 3: '索引色 (Indexed)', 4: '灰度 + Alpha', 6: 'RGBA' }[ct] || '未知';
  res.hasAlpha = (ct === 4 || ct === 6);
  const actl = find4(b, 'acTL');
  if (actl >= 0) { res.animated = true; res.frameCount = u32(b, actl + 8, false); }
}

function fillGIF(b, res) {
  res.width = u16(b, 6, true);
  res.height = u16(b, 8, true);
  res.bitDepth = 8;
  res.colorType = '索引色 (Indexed)';
  res.hasAlpha = false;
  let frames = 0;
  for (let i = 1; i + 1 < b.length; i++) if (b[i] === 0x2C && b[i - 1] === 0x00) frames++;
  res.frameCount = frames;
  res.animated = frames > 1;
}

function fillJPEG(b, res) {
  res.bitDepth = 8;
  res.colorType = 'YCbCr';
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      res.height = u16(b, i + 5, false);
      res.width = u16(b, i + 7, false);
      const spp = b[i + 9];
      res.colorType = { 1: '灰度 (Grayscale)', 3: 'YCbCr', 4: 'CMYK' }[spp] || 'YCbCr';
      break;
    }
    if (m === 0xD9 || m === 0xDA) break;
    const len = u16(b, i + 2, false);
    i += 2 + len;
  }
}

function fillBMP(b, res) {
  res.width = u32(b, 18, true);
  res.height = Math.abs(u32(b, 22, true));
  const bpp = u16(b, 28, true);
  res.bitDepth = bpp;
  res.colorType = bpp >= 32 ? 'RGBA (含 alpha)' : (bpp >= 24 ? 'RGB' : '索引色 (Indexed)');
  res.hasAlpha = (bpp >= 32);
}

function fillWebP(b, res) {
  res.bitDepth = 8;
  const vp8x = find4(b, 'VP8X');
  if (vp8x >= 0) {
    const flags = b[vp8x + 9];
    res.hasAlpha = !!(flags & 0x10);
    res.animated = !!(flags & 0x02);
    res.width = (b[vp8x + 13] | (b[vp8x + 14] << 8) | (b[vp8x + 15] << 16)) + 1;
    res.height = (b[vp8x + 16] | (b[vp8x + 17] << 8) | (b[vp8x + 18] << 16)) + 1;
    if (res.animated) res.frameCount = countOcc(b, 'ANMF') + 1;
    res.colorType = 'VP8 / VP8L';
  } else {
    const v = sz(b, 12, 4);
    if (v === 'VP8 ') {
      res.width = u16(b, 26, true);
      res.height = u16(b, 28, true);
      res.hasAlpha = false; res.colorType = 'VP8 (有损)';
    } else if (v === 'VP8L') {
      const w14 = (b[21] | (b[22] << 8)) & 0x3FFF;
      const h14 = ((b[22] >> 6) | (b[23] << 2) | (b[24] << 10)) & 0x3FFF;
      res.width = w14 + 1; res.height = h14 + 1;
      res.hasAlpha = true; res.colorType = 'VP8L (无损)';
    }
  }
}

function walkBoxes(b, start, end, containers, out) {
  let p = start;
  while (p + 8 <= end && p >= 0) {
    const size = u32(b, p, false);
    const type = sz(b, p + 4, 4);
    if (size < 8 || p + size > end + 8) break;
    out.push({ type, start: p, data: p + 8 });
    if (containers.has(type)) {
      let cs = p + 8;
      if (type === 'meta') cs = p + 12;
      walkBoxes(b, cs, p + size, containers, out);
    }
    p += size;
  }
}

// 取主图项（pitm）关联的 ispe 尺寸：meta>pitm + meta>iprp{ipco,ipma}
function heifPrimaryDims(b, meta) {
  const mStart = meta.data + 4;
  const pitm = findBox(b, mStart, meta.end, 'pitm');
  const iprp = findBox(b, mStart, meta.end, 'iprp');
  if (!pitm || !iprp) return null;
  const primaryId = b[pitm.data] === 0 ? u16(b, pitm.data + 4, false) : u32(b, pitm.data + 4, false);
  const ipco = findBox(b, iprp.data, iprp.end, 'ipco');
  const ipma = findBox(b, iprp.data, iprp.end, 'ipma');
  if (!ipco || !ipma) return null;
  const ispeByIdx = {};
  let idx = 0, p = ipco.data;
  while (p + 8 <= ipco.end) {
    const box = boxAt(b, p);
    if (!box) break;
    idx++;
    if (box.type === 'ispe') ispeByIdx[idx] = [u32(b, box.data + 4, false), u32(b, box.data + 8, false)];
    if (box.size <= 0) break;
    p = box.end;
  }
  if (!Object.keys(ispeByIdx).length) return null;
  const iver = b[ipma.data];
  const iflags = (b[ipma.data + 1] << 16) | (b[ipma.data + 2] << 8) | b[ipma.data + 3];
  const use15 = (iflags & 1) !== 0;
  let q = ipma.data + 4;
  const entryCount = u32(b, q, false); q += 4;
  let fallback = null;
  for (let i = 0; i < entryCount; i++) {
    if (q + (iver < 1 ? 3 : 5) > b.length) break;
    const itemId = iver < 1 ? u16(b, q, false) : u32(b, q, false);
    q += iver < 1 ? 2 : 4;
    const ac = b[q]; q += 1;
    for (let j = 0; j < ac; j++) {
      let propIdx;
      if (use15) { propIdx = u16(b, q, false) & 0x7FFF; q += 2; } else { propIdx = b[q] & 0x7F; q += 1; }
      if (ispeByIdx[propIdx]) {
        if (itemId === primaryId) return ispeByIdx[propIdx];
        if (!fallback) fallback = ispeByIdx[propIdx];
      }
    }
  }
  return fallback;
}

function fillHEIF(b, res, key) {
  const out = [];
  walkBoxes(b, 0, b.length,
    new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf', 'meta', 'iprp', 'ipco', 'iinf', 'iloc']), out);
  // 尺寸取主图项关联的 ispe，而非默认第一个（首个常是缩略图）
  let dims = null;
  try {
    const meta = findBox(b, 0, b.length, 'meta');
    if (meta) dims = heifPrimaryDims(b, meta);
  } catch (e) { /* ignore */ }
  if (!dims) {
    let area = -1;
    for (const x of out) {
      if (x.type !== 'ispe') continue;
      const w = u32(b, x.start + 12, false), h = u32(b, x.start + 16, false);
      if (w * h > area) { area = w * h; dims = [w, h]; }
    }
  }
  if (dims) { res.width = dims[0]; res.height = dims[1]; }

  const av1 = out.find((x) => x.type === 'av1C');
  const hvc = out.find((x) => x.type === 'hvcC');
  if (av1) {
    const d = av1.data;
    const high = (b[d + 2] >> 6) & 1, twelve = (b[d + 2] >> 5) & 1;
    res.bitDepth = twelve ? 12 : (high ? 10 : 8);
    res.colorType = 'YUV (AV1)';
  }
  if (hvc) {
    const d = hvc.data;
    res.bitDepth = ((b[d + 3] >> 3) & 7) + 8;
    res.colorType = 'YUV (HEVC)';
  }
  const pixi = out.find((x) => x.type === 'pixi');
  if (pixi) {
    const ch = b[pixi.data + 4], bd = b[pixi.data + 5];
    res.bitDepth = bd || res.bitDepth;
    res.colorType = ch === 4 ? 'RGBA' : (ch === 3 ? 'YCbCr / RGB' : res.colorType);
  }
  const aux = out.find((x) => x.type === 'auxC');
  if (aux) res.hasAlpha = /alpha/i.test(ascii(b, aux.data + 4, 64));
  const traks = out.filter((x) => x.type === 'trak').length;
  if (traks > 1) { res.animated = true; res.frameCount = traks; }
  if (!res.bitDepth) res.bitDepth = 8;
}

function fillTIFFFile(b, res) {
  const tags = parseTIFF(b, 0);
  if (tags[256] != null) res.width = tags[256];
  if (tags[257] != null) res.height = tags[257];
  const spp = tags[277] || 1;
  const bps = tags[258];
  res.bitDepth = Array.isArray(bps) ? bps[0] : (bps || 8);
  res.colorType = spp === 1 ? '灰度 (Grayscale)' : (spp === 3 ? 'RGB' : (spp === 4 ? 'RGBA / CMYK' : 'RGB'));
  res.hasAlpha = (spp === 4);
}

// ── TIFF / EXIF ──
function readTagValue(b, base, get16, get32, le, type, count, valOff) {
  const typeSize = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const total = typeSize[type] * count;
  const dataOff = total <= 4 ? valOff : base + get32(valOff - base);
  const rd16 = (o) => get16(o - base);
  const rd32 = (o) => get32(o - base);
  if (type === 2) return ascii(b, dataOff, count);
  if (type === 1 || type === 7) {
    if (count === 1) return b[dataOff];
    const a = []; for (let i = 0; i < count; i++) a.push(b[dataOff + i]); return a;
  }
  if (type === 3) { if (count === 1) return rd16(dataOff); const a = []; for (let i = 0; i < count; i++) a.push(rd16(dataOff + i * 2)); return a; }
  if (type === 4) { if (count === 1) return rd32(dataOff); const a = []; for (let i = 0; i < count; i++) a.push(rd32(dataOff + i * 4)); return a; }
  if (type === 5 || type === 10) {
    if (count === 1) { const n = rd32(dataOff), d = rd32(dataOff + 4); return d ? n / d : 0; }
    const a = []; for (let i = 0; i < count; i++) { const n = rd32(dataOff + i * 8), d = rd32(dataOff + i * 8 + 4); a.push(d ? n / d : 0); }
    return a;
  }
  return null;
}
function readIFD(b, base, off, le, get16, get32) {
  const count = get16(off - base);
  const tags = {};
  for (let i = 0; i < count; i++) {
    const e = off + 2 + i * 12;
    const id = get16(e - base);
    const type = get16(e + 2 - base);
    const cnt = get32(e + 4 - base);
    const valOff = e + 8;
    try { tags[id] = readTagValue(b, base, get16, get32, le, type, cnt, valOff); } catch (e) { /* ignore */ }
  }
  return tags;
}
function parseTIFF(b, base) {
  const le = sz(b, base, 2) === 'II';
  const dv = new DataView(b.buffer, b.byteOffset + base, b.length - base);
  const get16 = (o) => le ? dv.getUint16(o, true) : dv.getUint16(o, false);
  const get32 = (o) => le ? dv.getUint32(o, true) : dv.getUint32(o, false);
  const ifd0 = get32(4);
  const tags = readIFD(b, base, base + ifd0, le, get16, get32);
  if (tags[34665] != null) Object.assign(tags, readIFD(b, base, base + tags[34665], le, get16, get32));
  if (tags[34853] != null) tags.__gps = readIFD(b, base, base + tags[34853], le, get16, get32);
  return tags;
}
function toDeg(c, ref) {
  const v = c[0] + c[1] / 60 + c[2] / 3600;
  return Math.round((ref === 'S' || ref === 'W' ? -v : v) * 1e6) / 1e6;
}
// 给定“容器数据起点”，探测 TIFF 头在 b 中的偏移：
//   - 多数容器直接以 II/MM 开头的 TIFF 头起始；
//   - 部分实现（尤其 JPEG APP1 / WebP EXIF）会前置 'Exif\0\0' 6 字节签名。两种都兼容。
function tiffStartFromData(b, dataStart) {
  if (dataStart + 6 <= b.length &&
      b[dataStart] === 0x45 && b[dataStart + 1] === 0x78 && b[dataStart + 2] === 0x69 && b[dataStart + 3] === 0x66 &&
      b[dataStart + 4] === 0 && b[dataStart + 5] === 0) {
    return dataStart + 6; // 跳过 'Exif\0\0' 前缀
  }
  if (dataStart + 2 <= b.length && (sz(b, dataStart, 2) === 'II' || sz(b, dataStart, 2) === 'MM')) return dataStart;
  return -1;
}

// 按容器格式定位 EXIF 中的 TIFF 头偏移；找不到返回 -1
function exifOffset(b, key) {
  if (key === 'jpeg') {
    const i = findSeq(b, [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // 'Exif\0\0'
    return i >= 0 ? i + 6 : -1;
  }
  if (key === 'png') {
    // PNG: [4字节长度][4字节type='eXIf'][数据][4字节CRC]，数据紧跟 type 之后
    const i = find4(b, 'eXIf');
    if (i < 0) return -1;
    return tiffStartFromData(b, i + 4);
  }
  if (key === 'webp') {
    // WebP(RIFF): [4CC='EXIF'][4字节LE长度][数据]；数据位于 type+8（中间隔了 4 字节长度）
    const i = find4(b, 'EXIF');
    if (i < 0) return -1;
    return tiffStartFromData(b, i + 8);
  }
  if (key === 'tiff') return 0; // 整个文件就是 TIFF/IFD
  return -1;
}

// 把 tiffStart 处的 TIFF/IFD 解析为 res.exif（各容器格式共用）
function applyEXIFTags(b, res, tiffStart) {
  try {
    const tags = parseTIFF(b, tiffStart);
    const ex = {};
    if (tags[274] != null) ex.orientation = tags[274];
    if (tags[271]) ex.make = tags[271];
    if (tags[272]) ex.model = tags[272];
    if (tags[36867]) ex.dateTimeOriginal = tags[36867];
    else if (tags[306]) ex.dateTimeOriginal = tags[306]; // TIFF IFD0 的 DateTime 兜底
    if (tags[34855] != null) ex.iso = tags[34855];
    else if (tags[34864] != null) ex.iso = Array.isArray(tags[34864]) ? tags[34864][0] : tags[34864];
    if (tags[33434] != null) ex.exposureTime = tags[33434];
    if (tags[33437] != null) ex.fNumber = tags[33437];
    if (tags[37386] != null) ex.focalLength = tags[37386];
    if (tags.__gps && tags.__gps[2] && tags.__gps[1] && tags.__gps[4] && tags.__gps[3]) {
      ex.gps = { lat: toDeg(tags.__gps[2], tags.__gps[1]), lon: toDeg(tags.__gps[4], tags.__gps[3]), latRef: tags.__gps[1], lonRef: tags.__gps[3] };
    }
    if (Object.keys(ex).length) res.exif = ex;
  } catch (e) { /* ignore */ }
}

// 合法 TIFF 头：字节序标记 II/MM + 魔数 42（II=LE 2A00，MM=BE 002A）
function isTiffHeader(b, o) {
  if (o < 0 || o + 4 > b.length) return false;
  if (b[o] === 0x49 && b[o + 1] === 0x49 && b[o + 2] === 0x2A && b[o + 3] === 0x00) return true;
  if (b[o] === 0x4D && b[o + 1] === 0x4D && b[o + 2] === 0x00 && b[o + 3] === 0x2A) return true;
  return false;
}

// ── ISOBMFF 盒子读取（HEIC / HEIF / AVIF 的 EXIF 存在 meta>iinf/iloc 的 Exif item 里）──
function boxAt(b, p) {
  if (p + 8 > b.length) return null;
  let size = u32(b, p, false);
  const type = sz(b, p + 4, 4);
  let headerLen = 8;
  if (size === 1) { // 64 位长度
    if (p + 16 > b.length) return null;
    size = u32(b, p + 8, false) * 4294967296 + u32(b, p + 12, false);
    headerLen = 16;
  } else if (size === 0) {
    size = b.length - p;
  }
  if (size < headerLen) return null;
  return { size, type, data: p + headerLen, end: p + size };
}
function findBox(b, start, end, type) {
  let p = start;
  const limit = Math.min(end, b.length);
  while (p + 8 <= limit) {
    const box = boxAt(b, p);
    if (!box) return null;
    if (box.type === type) return box;
    if (box.size <= 0) break;
    p = box.end;
  }
  return null;
}
// 在 iinf 中找 item_type==='Exif' 的 item_ID
function heifExifItemId(b, iinf) {
  const ver = b[iinf.data];
  let p = iinf.data + 4;
  let count;
  if (ver === 0) { count = u16(b, p, false); p += 2; } else { count = u32(b, p, false); p += 4; }
  for (let i = 0; i < count && p + 8 <= iinf.end; i++) {
    const child = boxAt(b, p);
    if (!child) break;
    if (child.type === 'infe') {
      const iver = b[p + 8];
      let id, itemType = '';
      if (iver === 2) { id = u16(b, p + 12, false); itemType = sz(b, p + 16, 4); }
      else if (iver === 3) { id = u32(b, p + 12, false); itemType = sz(b, p + 18, 4); }
      else { id = u16(b, p + 12, false); }
      if (itemType === 'Exif') return id;
    }
    if (child.size <= 0) break;
    p = child.end;
  }
  return -1;
}
// 在 iloc 中取指定 item 的定位信息 { method, baseOffset, extents:[[off,len]...] }
function heifItemLocation(b, iloc, wantId) {
  const ver = b[iloc.data];
  let p = iloc.data + 4;
  const b0 = b[p], b1 = b[p + 1];
  const offSize = (b0 >> 4) & 0xF, lenSize = b0 & 0xF;
  const baseSize = (b1 >> 4) & 0xF, idxSize = b1 & 0xF;
  p += 2;
  let count;
  if (ver < 2) { count = u16(b, p, false); p += 2; } else { count = u32(b, p, false); p += 4; }
  const readN = (o, n) => { let v = 0; for (let k = 0; k < n; k++) v = v * 256 + b[o + k]; return v; };
  for (let i = 0; i < count; i++) {
    let id;
    if (ver < 2) { id = u16(b, p, false); p += 2; } else { id = u32(b, p, false); p += 4; }
    let method = 0;
    if (ver === 1 || ver === 2) { method = u16(b, p, false) & 0xF; p += 2; }
    p += 2; // data_reference_index
    const baseOffset = readN(p, baseSize); p += baseSize;
    const extentCount = u16(b, p, false); p += 2;
    const extents = [];
    for (let e = 0; e < extentCount; e++) {
      if ((ver === 1 || ver === 2) && idxSize > 0) p += idxSize;
      const off = readN(p, offSize); p += offSize;
      const len = readN(p, lenSize); p += lenSize;
      extents.push([off, len]);
    }
    if (id === wantId) return { method, baseOffset, extents };
  }
  return null;
}
function fillEXIF_HEIF(b, res) {
  const meta = findBox(b, 0, b.length, 'meta');
  if (!meta) return;
  const mStart = meta.data + 4; // meta 是 FullBox（多 4 字节 version/flags）
  const iinf = findBox(b, mStart, meta.end, 'iinf');
  const iloc = findBox(b, mStart, meta.end, 'iloc');
  if (!iinf || !iloc) return;
  const id = heifExifItemId(b, iinf);
  if (id < 0) return;
  const loc = heifItemLocation(b, iloc, id);
  if (!loc || !loc.extents.length) return;
  let rel = 0;
  if (loc.method === 1) { // 相对 idat 盒子数据区
    const idat = findBox(b, mStart, meta.end, 'idat');
    if (!idat) return;
    rel = idat.data;
  } else if (loc.method === 2) { // 相对 item 自身数据，罕见 → 放弃
    return;
  }
  // 把各 extent 拼成连续缓冲（Exif 通常单 extent）
  let total = 0;
  for (const e of loc.extents) total += e[1];
  if (total <= 8) return;
  const buf = new Uint8Array(total);
  let w = 0;
  for (const e of loc.extents) {
    const s = rel + loc.baseOffset + e[0];
    if (s < 0 || s + e[1] > b.length) continue;
    buf.set(b.subarray(s, s + e[1]), w);
    w += e[1];
  }
  if (w <= 8) return;
  // 负载前 4 字节 BE = 到 TIFF 头的偏移（相对这 4 字节之后）
  const hdrOff = u32(buf, 0, false);
  let t = 4 + hdrOff;
  if (!isTiffHeader(buf, t)) {
    t = -1;
    const scanEnd = Math.min(buf.length - 4, 4 + 256);
    for (let o = 4; o <= scanEnd; o++) { if (isTiffHeader(buf, o)) { t = o; break; } }
    if (t < 0) return;
  }
  applyEXIFTags(buf, res, t);
}

function fillEXIF(b, res, key) {
  if (key === 'heic' || key === 'heif' || key === 'avif') {
    try { fillEXIF_HEIF(b, res); } catch (e) { /* ignore */ }
    if (!res.exif) {
      // 兜底：个别文件把带 EXIF 的缩略图直接嵌在 mdat 里
      const i = findSeq(b, [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // 'Exif\0\0'
      if (i >= 0) applyEXIFTags(b, res, i + 6);
    }
    return;
  }
  let tiffStart = -1;
  try { tiffStart = exifOffset(b, key); } catch (e) { /* ignore */ }
  if (tiffStart >= 0) applyEXIFTags(b, res, tiffStart);
}

// ── ICC 色彩配置文件 ──
function classifyICC(text) {
  const t = (text || '').toLowerCase();
  let space = null;
  if (t.includes('srgb')) space = 'sRGB';
  else if (t.includes('display p3')) space = 'Display P3';
  else if (t.includes('adobe rgb')) space = 'Adobe RGB';
  else if (t.includes('prophoto')) space = 'ProPhoto RGB';
  else if (t.includes('eci rgb')) space = 'ECI RGB';
  else if (t.includes('rec.') || t.includes('bt.709') || t.includes('bt.2020')) space = 'Rec.709/2020';
  return { description: text.trim().replace(/^[^A-Za-z0-9]+/, ''), space };
}
function fillICC(b, res) {
  const i = findSeq(b, [0x61, 0x63, 0x73, 0x70]); // 'acsp'
  if (i < 0) return;
  // 标准 ICC：'acsp' 位于头部偏移 4（偏移 0 为 profile 字节长度）；少数内嵌方式把它放在偏移 0。两种都试。
  const candidates = [];
  if (i >= 4) candidates.push(i - 4);
  candidates.push(i);
  for (const base of candidates) {
    try { const r = parseICC(b, base); if (r) { res.icc = r; return; } } catch (e) { /* ignore */ }
  }
}

// 解析解压后的 ICC 字节：base 为 profile 起点（偏移 0 = 字节长度，偏移 4 = 'acsp'）
export function parseICC(b, base) {
  const count = u32(b, base + 128, false);
  if (count < 1 || count > 1000) return null;
  let bestText = '';
  let bestSpace = null;
  for (let k = 0; k < count; k++) {
    const e = base + 132 + k * 12;
    if (e + 12 > b.length) break;
    const tag = sz(b, e, 4);
    const off = u32(b, e + 4, false);
    const size = u32(b, e + 8, false);
    if (off === 0 || off + base > b.length || off + size + base > b.length) continue; // 跳过损坏/越界项
    let txt = null;
    if (tag === 'desc' || tag === 'dmnd' || tag === 'dmdd') {
      // 文本标签：跳过 8 字节 type+reserved 头，取最长可打印串（容忍 1/4 字节长度前缀差异）
      txt = firstAsciiRun(b, base + off + 4, base + off + size);
    } else if (tag === 'mluc') {
      // mluc: type(4) reserved(4) recordCount(4) [langCode(4) len(4) offset(4)]* 字符串数据
      const recs = u32(b, base + off + 8, false);
      if (recs >= 1) {
        const len = u32(b, base + off + 16, false);
        const strOff = u32(b, base + off + 20, false);
        if (len > 1 && strOff + len <= size) txt = ascii(b, base + off + strOff, len);
      }
    }
    if (!txt) continue;
    const c = classifyICC(txt);
    if (c.space) return c; // 命中色彩空间则立即返回
    if (txt.length > bestText.length) { bestText = txt; bestSpace = c.space; }
  }
  return bestText ? { description: bestText, space: bestSpace } : null;
}

// ── 主入口 ──
export function parseImage(bytes, fileName) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const res = { fileName: fileName || '', fileSize: b.length, formatKey: 'unknown' };
  try {
    const key = detectFormat(b);
    res.formatKey = key;
    const m = META[key] || META.unknown;
    res.format = m.label;
    res.mime = m.mime;
    if (key === 'png') fillPNG(b, res);
    else if (key === 'gif') fillGIF(b, res);
    else if (key === 'jpeg') fillJPEG(b, res);
    else if (key === 'bmp') fillBMP(b, res);
    else if (key === 'webp') fillWebP(b, res);
    else if (key === 'tiff') fillTIFFFile(b, res);
    else if (key === 'avif' || key === 'heic' || key === 'heif') fillHEIF(b, res, key);
    fillEXIF(b, res, key);
    fillICC(b, res);
    if (res.width && res.height) res.aspectRatio = (res.width / res.height).toFixed(3);
  } catch (e) {
    res._error = String((e && e.message) || e);
  }
  return res;
}
