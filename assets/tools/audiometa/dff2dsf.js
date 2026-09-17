// DSDIFF (DFF) → DSF 重封装
//
// 两种容器除了头部结构，音频数据本身有两处关键差异（都有权威出处）：
//   1. 交错方式：DFF 是「逐字节交错」 L,R,L,R…；
//      DSF 是「每声道 4096 字节分块」 L×4096, R×4096, L×4096…
//      （WavPack 作者 bryant 于 hydrogenaudio 明确说明；MPD 的 dsf_to_pcm_order 亦同）
//   2. 位序：DFF 是 MSB-first，DSF 是 LSB-first —— 每个字节必须做 8 位反转
//      （sacd-ripper：DSF 写入时需 bit reversal）
// 少做其中任何一步，解出来的都是噪声。

const BLOCK = 4096; // DSF 每声道分块大小（事实上所有 DSF 都用 4096）

function sz(b, o, n) { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(b[o + i] || 0); return s; }
function u16be(b, o) { return ((b[o] || 0) << 8) | (b[o + 1] || 0); }
function u32be(b, o) { return (((b[o] || 0) << 24) | ((b[o + 1] || 0) << 16) | ((b[o + 2] || 0) << 8) | (b[o + 3] || 0)) >>> 0; }
function u64be(b, o) { // 文件大小远小于 2^53，直接用 Number
  let hi = u32be(b, o), lo = u32be(b, o + 4);
  return hi * 4294967296 + lo;
}
const isTag = (b, o) => /^[\x20-\x7e]{4}$/.test(sz(b, o, 4));

// 8 位反转表：MSB-first → LSB-first
const REV = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  let r = 0, v = i;
  for (let k = 0; k < 8; k++) { r = (r << 1) | (v & 1); v >>= 1; }
  REV[i] = r;
}

/**
 * 解析 DFF，返回 { sampleRate, channels, cmpr, data, dataSize }
 */
export function parseDFF(b) {
  if (sz(b, 0, 4) !== 'FRM8') throw new Error('不是 DSDIFF（FRM8）文件');
  // 规范是 8 字节块长度，但部分写入器写 4 字节 —— 自动判别
  const s4 = isTag(b, 8);
  const SZ = s4 ? 4 : 8, step = 4 + SZ;
  const rdSize = (o) => (s4 ? u32be(b, o) : u64be(b, o));

  const formSize = rdSize(4);
  const formEnd = 4 + SZ + formSize;

  let sampleRate = 0, channels = 0, cmpr = '';
  let dataOff = -1, dataSize = 0;

  let q = 4 + SZ + 4; // 跳过 FRM8 头 + 形式类型（'DSD '）
  while (q + step <= Math.min(formEnd, b.length)) {
    const id = sz(b, q, 4), size = rdSize(q + 4), d = q + step;
    if (!isTag(b, q) || size <= 0) break;

    if (id === 'PROP') {
      let pp = d;
      if (sz(b, d, 4) === 'SND ') pp = d + 4; // 个别写入器省略形式类型
      let r = pp;
      while (r + step <= Math.min(d + size, b.length)) {
        const sid = sz(b, r, 4), ssize = rdSize(r + 4), sd = r + step;
        if (!isTag(b, r) || ssize <= 0) break;
        if (sid === 'FS  ') sampleRate = u32be(b, sd);
        else if (sid === 'CHNL') channels = u16be(b, sd);
        else if (sid === 'CMPR') cmpr = sz(b, sd, 4);
        r = sd + ssize + (ssize & 1);
      }
    } else if (id === 'DSD ') {
      dataOff = d; dataSize = size;
    }
    q = d + size + (size & 1);
  }

  if (dataOff < 0) throw new Error('DFF 里找不到 DSD 数据块');
  if (/^DST/.test(cmpr)) throw new Error('DST 压缩的 DFF 无法转换（ffmpeg 没有 DST 解码器）');
  if (!sampleRate) throw new Error('DFF 缺少采样率（FS 块）');
  if (!channels) channels = 2;
  return { sampleRate, channels, cmpr, dataOff, dataSize };
}

/**
 * DFF → DSF 字节流。
 * 步骤：去交错 → 逐字节位反转 → 按 4096 字节/声道重新分块 → 写 DSF 头
 */
export function dffToDsf(b) {
  const { sampleRate, channels, dataOff, dataSize } = parseDFF(b);
  const src = b.subarray(dataOff, dataOff + dataSize);
  const C = channels;

  // 1) 去交错：DFF 是逐字节交错，拆成每声道独立的字节序列
  const perChBytes = Math.floor(dataSize / C);
  const ch = [];
  for (let c = 0; c < C; c++) {
    const a = new Uint8Array(perChBytes);
    for (let j = 0; j < perChBytes; j++) a[j] = REV[src[j * C + c]]; // 2) 同时做位反转
    ch.push(a);
  }

  // 3) 按 BLOCK 字节/声道重新分块（末块不足补 0）
  const blocks = Math.ceil(perChBytes / BLOCK);
  const outData = new Uint8Array(blocks * BLOCK * C);
  for (let blk = 0; blk < blocks; blk++) {
    for (let c = 0; c < C; c++) {
      const dst = (blk * C + c) * BLOCK;
      outData.set(ch[c].subarray(blk * BLOCK, (blk + 1) * BLOCK), dst);
    }
  }

  // 4) 拼 DSF
  const sampleCount = perChBytes * 8; // 每声道样本数
  const headerSize = 28 + 12 + 52 + 12;
  const total = headerSize + outData.length;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  const u32 = (o, v) => dv.setUint32(o, v, true);
  const u64 = (o, v) => { dv.setUint32(o, v % 4294967296, true); dv.setUint32(o + 4, Math.floor(v / 4294967296), true); };
  for (let i = 0; i < 4; i++) out[i] = 'DSD '.charCodeAt(i);
  u64(4, 28);            // DSD chunk size
  u64(12, total);        // file size
  u64(20, 0);            // metadata pointer（无 ID3）
  for (let i = 0; i < 4; i++) out[28 + i] = 'fmt '.charCodeAt(i);
  u64(32, 52);           // fmt chunk size
  u32(40, 1);            // format version
  u32(44, 0);            // format ID: 0 = 原始 DSD
  u32(48, C === 1 ? 1 : (C === 2 ? 2 : C)); // channel type
  u32(52, C);            // channel num
  u32(56, sampleRate);
  u32(60, 1);            // bits per sample
  u64(64, sampleCount);
  u32(72, BLOCK);        // block size per channel
  u32(76, 0);            // reserved
  for (let i = 0; i < 4; i++) out[80 + i] = 'data'.charCodeAt(i);
  u64(84, outData.length);
  out.set(outData, 92);
  return out;
}
