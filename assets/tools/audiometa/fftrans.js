// ffmpeg.wasm 封装：按需懒加载（32 MB 解码核心），把浏览器播不了的音频转成 PCM WAV
//
// 注意：这里用的是单线程版 core（@ffmpeg/core 0.12.x），
// 因此 **不要求页面处于 cross-origin isolated**（不需要 COOP/COEP 头），
// 在 GitHub Pages 这类无法自定义响应头的静态托管上同样可用。
// 多线程版（@ffmpeg/core-mt）才需要 SharedArrayBuffer + 跨源隔离。

const BASE = new URL('./ffmpeg/', import.meta.url).href;
let inst = null, pending = null;

export async function getFF(onLog, onProgress) {
  if (inst) return inst;
  if (pending) return pending;
  pending = (async () => {
    const mod = await import('./ffmpeg/index.js');
    const ff = new mod.FFmpeg();
    if (onLog) ff.on('log', (e) => { onLog(e.message); });
    if (onProgress) ff.on('progress', (e) => { onProgress(e.progress, e.time); });
    await ff.load({
      coreURL: BASE + 'ffmpeg-core.js',
      wasmURL: BASE + 'ffmpeg-core.wasm',
    });
    inst = ff;
    return ff;
  })();
  return pending;
}

/**
 * 转码。args 为 ffmpeg 输出参数（不含 -i 与输出名）。
 * 返回输出文件的 Uint8Array。
 */
export async function transcode(input, inName, outName, args, onLog, onProgress) {
  const ff = await getFF(onLog, onProgress);
  try { await ff.deleteFile(inName); } catch (e) { /* 首次不存在 */ }
  try { await ff.deleteFile(outName); } catch (e) { }
  await ff.writeFile(inName, input);
  const code = await ff.exec(['-hide_banner', '-nostdin', '-i', inName].concat(args, [outName]));
  if (code !== 0) throw new Error('ffmpeg 转码失败（退出码 ' + code + '）');
  const out = await ff.readFile(outName);
  try { await ff.deleteFile(inName); await ff.deleteFile(outName); } catch (e) { }
  return out;
}
