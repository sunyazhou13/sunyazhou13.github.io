---
layout: page
title: 本地音乐播放器
icon: fas fa-music
tool_css: /assets/tools/music/app.css?v=202610262
---

<p class="hint">选择一个音乐文件夹，浏览器会在<b>本机</b>深度优先遍历出所有支持的歌曲，形成一个播放列表，可随时切换、随机或循环播放，并用<b>实时频带可视化</b>展示正在播放的左右声道频谱。支持 FLAC / ALAC / APE / WAV / AIFF / DXD / MP3 / AAC / M4A / WMA / OGG / OPUS / MP2 / DSF / DFF / AC-3 / DTS 共 17 种格式；浏览器原生放不了的（APE / DSF / DFF / WMA / AC-3 / DTS / ALAC / DXD）会自动调用内置 ffmpeg（WebAssembly）转码后播放。全程本地处理，文件<b>不上传</b>。</p>

<div id="mu-app">

  <div class="mu-toolbar">
    <button type="button" id="mu-pick" class="mu-btn mu-btn-primary">选择音乐文件夹</button>
    <input type="file" id="mu-file" webkitdirectory directory multiple hidden aria-label="选择音乐文件夹">
    <span class="mu-now" id="mu-now"></span>
  </div>

  <div class="mu-status" id="mu-status" role="status"></div>

  <div class="mu-player" id="mu-player">
    <div class="mu-cover-wrap" id="mu-cover-wrap">
      <div class="mu-disc" id="mu-disc">
        <img class="mu-cover" id="mu-cover" alt="封面" hidden src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
      </div>
    </div>
    <div class="mu-meta">
      <div class="mu-title" id="mu-title">—</div>
      <div class="mu-sub" id="mu-sub"></div>
      <dl class="mu-fields">
        <div><dt>专辑</dt><dd id="mu-album">—</dd></div>
        <div><dt>曲风</dt><dd id="mu-genre">—</dd></div>
        <div><dt>格式</dt><dd id="mu-format">—</dd></div>
        <div><dt>大小</dt><dd id="mu-size">—</dd></div>
        <div><dt>时长</dt><dd id="mu-dur">—</dd></div>
        <div><dt>路径</dt><dd id="mu-path" class="mu-path">—</dd></div>
      </dl>
    </div>
    <div class="mu-controls">
      <button type="button" id="mu-prev" class="mu-btn mu-ctl" disabled title="上一首">⏮</button>
      <button type="button" id="mu-play" class="mu-btn mu-ctl mu-ctl-play" disabled title="播放/暂停">▶</button>
      <button type="button" id="mu-next" class="mu-btn mu-ctl" disabled title="下一首">⏭</button>
      <span class="mu-time" id="mu-cur">0:00</span>
      <input type="range" id="mu-seek" class="mu-seek" min="0" max="1000" step="1" value="0" disabled aria-label="播放进度">
      <span class="mu-time" id="mu-tot">0:00</span>
      <button type="button" id="mu-mode-btn" class="mu-btn mu-ctl mu-ctl-mode mu-toggle" disabled title="顺序播放">🔁</button>
      <button type="button" id="mu-vol-btn" class="mu-btn mu-ctl" title="静音 / 音量">🔊</button>
      <input type="range" id="mu-vol" class="mu-vol" min="0" max="1" step="0.01" value="1" aria-label="音量">
      <button type="button" id="mu-3d-btn" class="mu-btn mu-ctl mu-toggle" title="3D 时频立体视图（拖拽旋转 / 悬停读数）">3D 视图</button>
    </div>
    <audio id="mu-audio" class="mu-audio" preload="metadata"></audio>
    <div class="mu-lyrics" id="mu-lyrics"><div class="mu-lyric-empty">暂无歌词</div></div>
    <div class="mu-vizbar">
      <canvas id="mu-viz" class="mu-viz"></canvas>
    </div>
    <div class="mu-viz3d" id="mu-viz3d" hidden>
      <div class="mu-viz3d-head">
        <span class="mu-viz3d-title" title="拖拽旋转 / 滚轮缩放 / 悬停读数 / 双击复位">3D 时频立体视图</span>
        <span class="mu-viz3d-ctl">
          <label class="mu-viz3d-chk" title="效果预设：一次套用「主体样式 + 叠加层（+ 推荐配色）」，之后仍可单独微调">效果 <select id="mu-viz3d-preset" aria-label="效果预设"></select></label>
          <label class="mu-viz3d-chk" title="3D 视图配色方案（会记住选择）">配色 <select id="mu-viz3d-pal" aria-label="配色方案"></select></label>
          <label class="mu-viz3d-chk" title="主体样式：数据用什么形体画出来">样式 <select id="mu-viz3d-style" aria-label="主体样式"></select></label>
          <label class="mu-viz3d-chk" title="Y 轴读数基准：dBFS（0 = 满量程）或 0 VU（0 = −20 dBFS 对齐电平，节目通常落在 0 附近，上下都有数）">刻度 <select id="mu-viz3d-scale" aria-label="Y 轴刻度基准"><option value="dbfs">dBFS</option><option value="vu">0 VU</option></select></label>
          <label class="mu-viz3d-chk" title="放宽 dB 窗口到 −8…−78 dBFS，弱音也可见（2D 频谱条同步生效）"><input type="checkbox" id="mu-viz3d-wide"> 弱音可见</label>
          <label class="mu-viz3d-chk" title="叠加层：Tron 风格的发光网格地面（延伸到数据盒之外，有纵深）"><input type="checkbox" id="mu-viz3d-ov-grid"> 网格地板</label>
          <label class="mu-viz3d-chk" title="叠加层：地板 / 天花板 / 四面墙全铺网格，形成三维网格笼"><input type="checkbox" id="mu-viz3d-ov-cage"> 网格笼</label>
          <label class="mu-viz3d-chk" title="叠加层：地面镜像一份倒影"><input type="checkbox" id="mu-viz3d-ov-mirror"> 倒影</label>
          <label class="mu-viz3d-chk" title="叠加层：脊线发光（配深色舞台更明显）"><input type="checkbox" id="mu-viz3d-ov-glow"> 辉光</label>
          <label class="mu-viz3d-chk" title="叠加层：每层峰值点连成的轨迹"><input type="checkbox" id="mu-viz3d-ov-peaks"> 峰值轨迹</label>
          <button type="button" id="mu-viz3d-reset" class="mu-btn">重置视角</button>
        </span>
      </div>
      <canvas id="mu-viz3d-canvas" class="mu-viz3d-canvas"></canvas>
      <div class="mu-viz3d-guide">
        <b>Y 轴怎么读：</b><span id="mu-viz3d-guide-lead">0 dBFS = 满量程（数字域的上限，也是最响的一格）</span>，<b>越往下越弱</b>；−6 dB ≈ 幅度减半，−20 dB = 1/10，−40 dB = 1/100。当前窗口 <span id="mu-viz3d-range">0 → −54</span> <span id="mu-viz3d-unit">dBFS</span>。
      </div>
      <div class="mu-viz3d-read" id="mu-viz3d-read">把鼠标移到色带上，这里显示该点的详细数值（频率 · 频带序号 · 平滑/原始 dB · 时间 · 播放时刻 · FFT bin 区间）</div>
    </div>
  </div>

  <div class="mu-playlist">
    <ol class="mu-list" id="mu-list"></ol>
  </div>

</div>

<h2 id="viz3d">3D 时频立体视图</h2>

<p class="hint">同一份傅里叶数据，用三维空间表达：<b>X 轴 = 频率</b>、<b>Z 轴 = 时间</b>、<b>Y 轴 = 傅里叶幅值</b>。每一层色带就是「某一时刻的整条频谱曲线」，鼠标可自由拖拽旋转 —— 正对 X 轴看是<b>频域快照的堆叠</b>，转到侧面看是<b>时域演化</b>，俯视则是一张<b>时频热力图</b>。</p>

<h3>三根轴的精确映射</h3>

| 轴 | 含义 | 取值范围 | 精确映射 |
| --- | --- | --- | --- |
| X | 频率 | **FMIN → FMAX**（随采样率与 fftSize 现算：48 kHz + fftSize 4096 → **11.7 Hz → 24 kHz**） | `f = FMIN × (FMAX / FMIN)^x`，其中 `FMIN = 采样率 ÷ fftSize`（可分辨下限）、`FMAX = 采样率 ÷ 2`（Nyquist，采样率极限） |
| Z | 时间 | 现在 → 约 5 秒前 | 96 层 × 20 Hz 落帧；由每帧记录的**真实播放时刻**决定，不按固定帧率推算 |
| Y | 傅里叶幅值 | **默认 0 → −54 dBFS**（勾选「弱音可见」切到 −8 → −78 dBFS） | 以 **dBFS** 标注（0 = 满量程）：`dB = AnalyserNode 读数 + 14.1`（实测标定偏移） |

> **为什么 Y 轴全是负数？** dB 是**比值**，`0 dBFS` 的定义就是"满量程" —— 数字音频里超过它就意味着削顶，所以**合法信号一律 ≤ 0**。刻度上的 `0 dBFS` 是理论天花板（实际母带峰值通常在 −1 dBFS 上下）；要让刻度"正负都有"，只能换一个参考点，例如广播惯例把 0 设在 **−20 dBFS 的对齐电平**上（那样节目就落在 0 附近、上下都有数）—— 那是另一种标法，需要的话可以加。

<h3>数据来源（与原 2D 频谱同源）</h3>

- **FFT**：`AnalyserNode`，`fftSize = 4096` → 2048 个 bin；bin 间隔 `sampleRate / fftSize`（48 kHz 下 **11.7 Hz**，44.1 kHz 下 10.8 Hz，**按实际采样率现算，不写死**）。
- **频带压缩**：对数分布压成 **64 带**，**直接由 FFT bin 归并**（每带至少覆盖 1 个 bin，与 2D 条同一套「单调推进」规则）。
- **声道**：**L / R 分开绘制** —— L 暖色（红→金）、R 冷色（蓝→青），与 2D 频谱条同一套色语；两路沿时间轴错开半个层距，互不遮挡。
- **电平**：`getByteFrequencyData` 的 0–255，**不做 A 计权**。dB 窗口按 **dBFS** 定义（0 = 满量程），默认 **0 … −54 dBFS**，传入 AnalyserNode 前减去 14.1 dB 标定偏移（即 analyser 刻度 −68.1 … −14.1）；面板上「弱音可见」切到 **−8 … −78 dBFS**。
- **平滑**：非对称（攻击 0.72 / 释放 0.12），瞬态跟得上、回落又稳。
- **采集节流**：渲染循环按 rAF（≈60 fps）跑，但**按 20 Hz 上限落帧** —— 48 层约覆盖 2.4 秒。实际帧率略低时跨度会稍长（实测 ≈2.7 s），这没关系：**时间轴刻度标的是每帧的真实时间戳**，不是按标称帧率推算。
- **共享采集**：与原 2D 频谱条共用同一个采集循环（`spectrum.js` 的单次采集 + 多订阅），**不重复读 FFT**。

<h3>为什么能做到「频域和时域一点不差」</h3>

1. **频率轴不写死采样率**：每个频带的中心频率一律用 `bin × sampleRate / fftSize` 现算，48 k / 44.1 k / 96 k 的文件都严格对得上。
2. **时间轴用真实时间戳**：环形缓冲的每一帧都记录**捕获时刻的播放时间**，而不是假设「每 1/20 秒一帧」。即使掉帧，时间轴也不会错位。
3. **悬停读数同时给两个值**：**平滑后**的 dB（画面上真正看到的高度）与**该帧原始瞬时**的 dB（未平滑读数）并排显示，避免"标注和画面不一致"。
4. **标出底层 bin 区间**：读数里给出该频带覆盖的原始 FFT bin 范围，可一路回溯到最底层数据。
5. **频率标的是实际值，不是轴位**：低频段的频带比 FFT bin 还窄，对数轴上的标称位置会与真实数据相差很大（实测：轴位 84 Hz 的那一带，实际读到的是 bin 17 = **205 Hz**）。因此读数以**覆盖 bin 的中心频率**为准，与轴位差异超过 12% 时同时把轴位标出来。这也是 X 轴下限取 `采样率 ÷ fftSize`（可分辨下限）而不是 0 的原因 —— **0 Hz 是直流（bin 0），对数轴上放不下，而且它通常只是直流偏移不是声音**。
6. **校准说明**：`AnalyserNode` 的 dB 读数比真实 dBFS **低约 14 dB**（Blackman 窗相干增益 + FFT 归一化所致，实测标定值）。若要以 dBFS 标注，把读数 **+14 dB** 即可 —— 这是实测量出来的，不是理论估计。

<h3>数值标注（详细）</h3>

- **X 轴刻度**：按当前频率范围自动筛选（48 kHz + fftSize 4096 时是 20 / 50 / 100 / 200 / 500 Hz / 1 k / 2 k / 5 k / 10 k / 20 k），并在轴两端标出可分辨下限与 Nyquist（采样率上限）。
- **Y 轴刻度**：0 / −10 / −20 / −30 / −40 / −50 dBFS（只画落在当前窗口内的），每刻度在左墙与后墙各画一条等电平网格线 —— 透视下同一个 dB 在不同深度落在不同屏幕高度，光看左侧数字读不准，靠这两面墙的网格才能把任意位置的高度对回刻度。
- **Z 轴刻度**：0 / −0.6 / −1.2 / −1.8 / −2.4 s，每刻度对应一条地面横向网格线。
- **悬停读数**：频率 · 频带序号 · 电平（平滑）· 电平（原始瞬时）· 相对现在的时间 · 该帧真实播放时刻 · 覆盖的 FFT bin 区间。
- **实时极值**：角落常驻显示当前帧的「峰值频率 + 峰值 dB」。

<h3>交互</h3>

按住拖动 = 旋转（pointer events，手机触摸同样可用，松手还有一点惯性）；滚轮 = 缩放；悬停 = 读出该点数值（两声道分别给）；双击 = 复位视角。

**面板上的控件**（**效果预设**是"整装"入口，**配色 / 样式 / 叠加层**是三个独立维度用来微调，共 6 配色 × 6 样式 × 2³ 叠加 = 288 种组合；手动改任一项，预设会自动切到「自定义」。选择都记在 localStorage）：

- **效果**（10 个预设，一次套用「样式 + 叠加层（+ 推荐配色）」）：`经典瀑布` / `线框山脊` / `柱林` / `立体方块` / `点云` / `粒子流` / `测量视图`（填充+峰值轨迹）/ `舞台倒影`（填充+倒影）/ `霓虹柱林`（柱林+辉光）/ `极光帘幕`（点云+倒影+辉光，配暗场霓虹最佳）。
- **配色**：六套方案自由切换 —— `暖冷对撞`（默认）/ `跟随卡片`（用卡片渐变那四色沿**频率轴**做多段渐变铺满色带，L 正序 / R 倒序，所以同一频率处左右声道颜色天然不同；无封面时用内置默认渐变）/ `封面吸色`（从封面四色里挑色相距离最大的一对给 L / R，封面接近单色时自动退回暖冷对撞）/ `双色扁平` / `莫兰迪柔彩` / `暗场霓虹`（深色舞台）。
- **样式**：六种主体样式 —— `填充色带`（默认）/ `线框网格`（骨架；脊线每 3 层一条、纵向线每 4 个频带一条，**两个方向都稀疏才是网格**，全画会糊成刷毛）/ `立体柱林`（每频带一根竖柱）/ `立体方块`（每频带一个实心块，最像 3D 柱状图）/ `点云` / `粒子流`（点沿时间方向拉出短线段）。
- **五个叠加层，可任意组合**：`网格地板`（**Tron / retrowave 那种**：网格延伸到数据盒之外，越靠前越亮、远处淡出，并用 **R 声道那侧的颜色**——和 L 的暖色互补，网格不会和数据糊在一起）/ `网格笼`（地板 / 天花板 / 四面墙全铺网格，形成三维笼子）/ `倒影`（同一层镜像到地面以下，α 压到 26%）/ `辉光`（脊线用「粗半透明打底 + 细亮线」两层 —— **不用 `shadowBlur`**，否则 96 条色带会卡死）/ `峰值轨迹`（每层的峰值点连成一条线，能看出主频走向）。
- **弱音可见**：把 dB 窗口放宽到 −8…−78 dBFS（**analyser 的窗口是 2D 与 3D 共用的，所以 2D 频谱条会同步变化**）。

> 实现注记：每帧先把各层几何**一次性投影进扁平 `Float32Array`**（索引 `(层×2+声道)×频带数+带号`），再由样式函数取点绘制。这样既支撑了「纵向骨架 / 粒子流 / 镜像 / 峰值轨迹」这些需要跨层取点的效果，又把每帧耗时从 2.5 ms 降到 **≤1 ms**（省掉了每帧几万个临时点对象）。

<h3>实现要点（含踩过的坑）</h3>

1. **轨道相机**：yaw 绕 Y 轴、pitch 绕 X 轴，透视投影 `k = D / (D − Z)`。
2. **缩放必须按包围球半径算，不能用包围盒** —— 用包围盒的话，一旋转包围盒尺寸就在变，画面会"忽大忽小"地呼吸。
3. **每帧按深度排序、远的先画**（画家算法），否则遮挡关系是错的。
4. **悬停读数**：把投影坐标缓存进 `Float32Array`，在屏幕空间做一次 O(n) 最近点查找 —— 比反投影回世界坐标简单得多，且完全够用。
5. **性能**：48 层填充 + 48 层描边 + 网格线 + 3072 次投影 ≈ **3–6 ms/帧**，Canvas 2D 稳定 60 fps。**零外部依赖，不需要 WebGL**。
6. **可选增强**：点击"钉住"多个读数做对比、按时间剖面切割、Y 轴在线性/对数之间切换。

<p class="hint">工程状态：本视图的设计与精度方案已定稿，代码接入前需先完成 <code>spectrum.js</code> 的「单次采集 + 多订阅」重构（保证原 2D 频谱行为零变化）。</p>

<script type="module" src="/assets/tools/music/app.js?v=202610262"></script>
