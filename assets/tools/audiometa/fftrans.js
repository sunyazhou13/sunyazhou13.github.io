// ffmpeg.wasm 封装：按需懒加载（32 MB 解码核心），把浏览器播不了的音频转成 PCM WAV
//
// 注意：这里用的是单线程版 core（@ffmpeg/core 0.12.x），
// 因此 **不要求页面处于 cross-origin isolated**（不需要 COOP/COEP 头），
// 在 GitHub Pages 这类无法自定义响应头的静态托管上同样可用。
// 多线程版（@ffmpeg/core-mt）才需要 SharedArrayBuffer + 跨源隔离。
//
// ── 分片下载（对齐英文词典 ECDICT 的分片思路）──
// 31 MB 的 wasm 从 GitHub Pages 到国内只有 ~200 KB/s，单连接要爬两分多钟，
// 且旧版只有一句静态提示，看起来像卡死。现在把 wasm 预先切成 3 片：
//   ① 3 路并行下载（GitHub Pages 对并发连接友好，实测吞吐能翻倍以上）
//   ② 边下边通过 onCoreProg 上报「x.x / 31 MB (xx%)」给 UI 画进度
//   ③ 任一分片 404 / 大小对不上 → 自动回退整文件下载（兼容旧部署 + SW 缓存过渡期）

const BASE = new URL('./ffmpeg/', import.meta.url).href;
let inst = null, pending = null;

// ── 缓存戳 ──
// app.js 经 VS() 导入本模块时，URL 自动带上页面的 ?v=（如 fftrans.js?v=202609194）。
// 这里读回那个版本号，拼到所有核心文件的请求上：换 wasm / 分片后只需顶页面版本号，
// 分片 URL 随之变化，浏览器 HTTP 缓存和 SW 缓存都会当作新资源重新下载，不会新旧混拼。
// ⚠️ 与 WASM_PARTS 一起维护：改 wasm → 重新 split → 同步 size → 顶版本号。
const VER = new URL(import.meta.url).searchParams.get('v') || '0';
const Q = (f) => f + '?v=' + VER;

// 分片清单：切分命令 `split -b 10744140 ffmpeg-core.wasm ffmpeg-core.wasm.p`
// 改动 wasm 后必须重新切分并同步这三个大小（用于进度分母 + 完整性校验）。
const WASM_PARTS = [
  { name: 'ffmpeg-core.wasm.p0', size: 10744140 },
  { name: 'ffmpeg-core.wasm.p1', size: 10744140 },
  { name: 'ffmpeg-core.wasm.p2', size: 10744139 },
];
const WASM_TOTAL = WASM_PARTS.reduce((s, p) => s + p.size, 0);   // 32232419

// 读流式响应，每收到一块就回调（loaded / total）。
async function fetchStream(url, onChunk) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' @ ' + url);
  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const r = await reader.read();
    if (r.done) break;
    chunks.push(r.value);
    loaded += r.value.length;
    onChunk(loaded);
  }
  return { chunks, loaded };
}

// 按分片清单并行下载并拼成一个 wasm blob。任一分片失败或拼出来大小不对就抛错（由上层回退）。
async function fetchWasmSharded(onProg) {
  const got = WASM_PARTS.map(() => 0);
  const tick = () => onProg(got.reduce((s, v) => s + v, 0), WASM_TOTAL);
  const parts = await Promise.all(WASM_PARTS.map((p, i) =>
    fetchStream(BASE + Q(p.name), (l) => { got[i] = l; tick(); })));
  const total = parts.reduce((s, r) => s + r.loaded, 0);
  if (total !== WASM_TOTAL) throw new Error('分片大小不匹配: ' + total);
  return new Blob(parts.flatMap((r) => r.chunks), { type: 'application/wasm' });
}

// 整文件下载（回退路径），同样带进度。
async function fetchWasmWhole(onProg) {
  const { chunks, loaded } = await fetchStream(BASE + Q('ffmpeg-core.wasm'), (l) => onProg(l, WASM_TOTAL));
  return new Blob(chunks, { type: 'application/wasm' });
}

export async function getFF(onLog, onProgress, onCoreProg) {
  if (inst) return inst;
  if (pending) return pending;
  pending = (async () => {
    const mod = await import('./ffmpeg/index.js');
    const ff = new mod.FFmpeg();
    if (onLog) ff.on('log', (e) => { onLog(e.message); });
    if (onProgress) ff.on('progress', (e) => { onProgress(e.progress, e.time); });
    // 核心下载进度回调（可能不存在 —— 老调用方只传了前两个参数）
    const coreProg = onCoreProg || (() => { });
    let wasmURL = BASE + 'ffmpeg-core.wasm';
    let wasmBlob = null;
    try {
      wasmBlob = await fetchWasmSharded(coreProg);
    } catch (e) {
      coreProg(0, WASM_TOTAL);                       // 进度归零重走
      wasmBlob = await fetchWasmWhole(coreProg);
    }
    wasmURL = URL.createObjectURL(wasmBlob);
    try {
      await ff.load({ coreURL: BASE + Q('ffmpeg-core.js'), wasmURL });
    } finally {
      URL.revokeObjectURL(wasmURL);                  // load 已把 wasm 读进内存，blob 可释放
    }
    inst = ff;
    return ff;
  })();
  return pending;
}

/**
 * 转码。args 为 ffmpeg 输出参数（不含 -i 与输出名）。
 * onCoreProg：核心（wasm 分片）下载进度 (loadedBytes, totalBytes)，仅首次载入时会触发。
 * 返回输出文件的 Uint8Array。
 */
export async function transcode(input, inName, outName, args, onLog, onProgress, onCoreProg) {
  const ff = await getFF(onLog, onProgress, onCoreProg);
  try { await ff.deleteFile(inName); } catch (e) { /* 首次不存在 */ }
  try { await ff.deleteFile(outName); } catch (e) { }
  await ff.writeFile(inName, input);
  const code = await ff.exec(['-hide_banner', '-nostdin', '-i', inName].concat(args, [outName]));
  if (code !== 0) throw new Error('ffmpeg 转码失败（退出码 ' + code + '）');
  const out = await ff.readFile(outName);
  try { await ff.deleteFile(inName); await ff.deleteFile(outName); } catch (e) { }
  return out;
}
