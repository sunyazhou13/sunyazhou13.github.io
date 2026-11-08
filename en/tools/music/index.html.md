---
layout: page
title: Local Music Player
icon: fas fa-music
lang: en
permalink: /tools/music/
tool_css: /assets/tools/music/app.css?v=202610262
---

<p class="hint">Pick a music folder; the browser <b>locally</b> traverses it depth-first and builds a playlist of every supported track. Switch, shuffle or repeat anytime, with a <b>live frequency-band visualizer</b> showing the L/R spectrum of what is playing. Supports FLAC / ALAC / APE / WAV / AIFF / DXD / MP3 / AAC / M4A / WMA / OGG / OPUS / MP2 / DSF / DFF / AC-3 / DTS — 17 formats in total; those the browser cannot play natively (APE / DSF / DFF / WMA / AC-3 / DTS / ALAC / DXD) are auto-transcoded with the built-in ffmpeg (WebAssembly). Everything runs locally; nothing is uploaded.</p>

<div id="mu-app">

  <div class="mu-toolbar">
    <button type="button" id="mu-pick" class="mu-btn mu-btn-primary">Choose music folder</button>
    <input type="file" id="mu-file" webkitdirectory directory multiple hidden aria-label="Choose music folder">
    <span class="mu-now" id="mu-now"></span>
  </div>

  <div class="mu-status" id="mu-status" role="status"></div>

  <div class="mu-player" id="mu-player">
    <div class="mu-cover-wrap" id="mu-cover-wrap">
      <div class="mu-disc" id="mu-disc">
        <img class="mu-cover" id="mu-cover" alt="Cover" hidden src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
      </div>
    </div>
    <div class="mu-meta">
      <div class="mu-title" id="mu-title">—</div>
      <div class="mu-sub" id="mu-sub"></div>
      <dl class="mu-fields">
        <div><dt>Album</dt><dd id="mu-album">—</dd></div>
        <div><dt>Genre</dt><dd id="mu-genre">—</dd></div>
        <div><dt>Format</dt><dd id="mu-format">—</dd></div>
        <div><dt>Size</dt><dd id="mu-size">—</dd></div>
        <div><dt>Length</dt><dd id="mu-dur">—</dd></div>
        <div><dt>Path</dt><dd id="mu-path" class="mu-path">—</dd></div>
      </dl>
    </div>
    <div class="mu-controls">
      <button type="button" id="mu-prev" class="mu-btn mu-ctl" disabled title="Previous">⏮</button>
      <button type="button" id="mu-play" class="mu-btn mu-ctl mu-ctl-play" disabled title="Play / pause">▶</button>
      <button type="button" id="mu-next" class="mu-btn mu-ctl" disabled title="Next">⏭</button>
      <span class="mu-time" id="mu-cur">0:00</span>
      <input type="range" id="mu-seek" class="mu-seek" min="0" max="1000" step="1" value="0" disabled aria-label="Progress">
      <span class="mu-time" id="mu-tot">0:00</span>
      <button type="button" id="mu-mode-btn" class="mu-btn mu-ctl mu-ctl-mode mu-toggle" disabled title="Sequential">🔁</button>
      <button type="button" id="mu-vol-btn" class="mu-btn mu-ctl" title="Mute / volume">🔊</button>
      <input type="range" id="mu-vol" class="mu-vol" min="0" max="1" step="0.01" value="1" aria-label="Volume">
      <button type="button" id="mu-3d-btn" class="mu-btn mu-ctl mu-toggle" title="3D time–frequency view (drag to orbit / hover to read)">3D view</button>
    </div>
    <audio id="mu-audio" class="mu-audio" preload="metadata"></audio>
    <div class="mu-lyrics" id="mu-lyrics"><div class="mu-lyric-empty">No lyrics</div></div>
    <div class="mu-vizbar">
      <canvas id="mu-viz" class="mu-viz"></canvas>
    </div>
    <div class="mu-viz3d" id="mu-viz3d" hidden>
      <div class="mu-viz3d-head">
        <span class="mu-viz3d-title" title="drag to orbit / wheel to zoom / hover to read / double-click to reset">3D time–frequency view</span>
        <span class="mu-viz3d-ctl">
          <label class="mu-viz3d-chk" title="Effect preset: applies a style + overlays (+ a suggested palette) in one go; fine-tune afterwards">effect <select id="mu-viz3d-preset" aria-label="Effect preset"></select></label>
          <label class="mu-viz3d-chk" title="Colour scheme for the 3D view (your choice is remembered)">colours <select id="mu-viz3d-pal" aria-label="Colour scheme"></select></label>
          <label class="mu-viz3d-chk" title="Body style: the shape the data is drawn with">style <select id="mu-viz3d-style" aria-label="Body style"></select></label>
          <label class="mu-viz3d-chk" title="Y-axis readout reference: dBFS (0 = full scale) or 0 VU (0 = the −20 dBFS alignment level, so programme sits around 0 with numbers above and below)">scale <select id="mu-viz3d-scale" aria-label="Y-axis scale reference"><option value="dbfs">dBFS</option><option value="vu">0 VU</option></select></label>
          <label class="mu-viz3d-chk" title="Widen the dB window to −8…−78 dBFS so quiet detail shows (applies to the 2D strip too)"><input type="checkbox" id="mu-viz3d-wide"> quiet detail</label>
          <label class="mu-viz3d-chk" title="Overlay: Tron-style glowing grid floor extending beyond the data box"><input type="checkbox" id="mu-viz3d-ov-grid"> grid floor</label>
          <label class="mu-viz3d-chk" title="Overlay: grid on floor, ceiling and all four walls — a full 3D cage"><input type="checkbox" id="mu-viz3d-ov-cage"> grid cage</label>
          <label class="mu-viz3d-chk" title="Overlay: mirror the surface below the floor"><input type="checkbox" id="mu-viz3d-ov-mirror"> reflection</label>
          <label class="mu-viz3d-chk" title="Overlay: glowing ridge lines (best on the dark stage)"><input type="checkbox" id="mu-viz3d-ov-glow"> glow</label>
          <label class="mu-viz3d-chk" title="Overlay: trace of each frame's peak"><input type="checkbox" id="mu-viz3d-ov-peaks"> peak trace</label>
          <button type="button" id="mu-viz3d-reset" class="mu-btn">Reset view</button>
        </span>
      </div>
      <canvas id="mu-viz3d-canvas" class="mu-viz3d-canvas"></canvas>
      <div class="mu-viz3d-guide">
        <b>Reading the Y axis:</b> <span id="mu-viz3d-guide-lead">0 dBFS = full scale (the digital ceiling — the loudest step)</span>, <b>lower means quieter</b>; −6 dB ≈ half the amplitude, −20 dB = 1/10, −40 dB = 1/100. Current window <span id="mu-viz3d-range">0 → −54</span> <span id="mu-viz3d-unit">dBFS</span>.
      </div>
      <div class="mu-viz3d-read" id="mu-viz3d-read">Hover a ribbon to read the exact values (frequency · band index · smoothed/raw dB · age · playback time · FFT bin range)</div>
    </div>
  </div>

  <div class="mu-playlist">
    <ol class="mu-list" id="mu-list"></ol>
  </div>

</div>

<h2 id="viz3d">3D time–frequency view</h2>

<p class="hint">The same Fourier data, expressed in space: <b>X = frequency</b>, <b>Z = time</b>, <b>Y = Fourier magnitude</b>. Each ribbon is the full spectrum curve of one instant. Drag to orbit: facing the X axis you see <b>stacked frequency snapshots</b>, from the side you see <b>how the time domain evolves</b>, and from above it becomes a <b>time–frequency heat map</b>.</p>

<h3>Exact axis mapping</h3>

| Axis | Meaning | Range | Mapping |
| --- | --- | --- | --- |
| X | Frequency | **FMIN → FMAX**, computed from the sample rate and fftSize (48 kHz + fftSize 4096 → **11.7 Hz → 24 kHz**) | `f = FMIN × (FMAX / FMIN)^x`, where `FMIN = sampleRate ÷ fftSize` (lowest resolvable) and `FMAX = sampleRate ÷ 2` (Nyquist) |
| Z | Time | now → about 5 s ago | 96 layers stored at 20 Hz; driven by each frame's **real playback timestamp**, never a nominal frame rate |
| Y | Magnitude | **0 → −54 dBFS** by default (−8 → −78 dBFS with "quiet detail") | Labelled in **dBFS** (0 = full scale): `dB = AnalyserNode reading + 14.1` (measured calibration offset) |

> **Why is the Y axis entirely negative?** dB is a **ratio**, and `0 dBFS` is by definition *full scale* — going above it in digital audio means clipping, so **no legitimate signal exceeds 0**. The `0 dBFS` tick is the theoretical ceiling (real masters usually peak near −1 dBFS). To get an axis with both signs you have to move the reference, e.g. the broadcast convention that puts 0 at a **−20 dBFS alignment level** — a different labelling, available on request.

<h3>Where the data comes from</h3>

- **FFT**: `AnalyserNode`, `fftSize = 4096` → 2048 bins; spacing `sampleRate / fftSize` (**11.7 Hz** at 48 kHz, 10.8 Hz at 44.1 kHz — always computed from the actual sample rate).
- **Band mapping**: logarithmic, 64 bands merged straight from FFT bins (each band covers at least one bin, same "monotonic" rule as the 2D strip).
- **Channels**: **L and R drawn separately** — L warm (red→gold), R cool (blue→teal), matching the 2D strip; the two runs are offset by half a layer along the time axis.
- **Level**: `getByteFrequencyData` 0–255, **no A-weighting**, dB window **−66 … −12** by default (**−90 … −20** with the "quiet detail" toggle).
- **Smoothing**: asymmetric (attack 0.72 / release 0.12).
- **Capture throttle**: the render loop runs at rAF (≈60 fps) but frames are stored at **20 Hz max**, so 48 layers cover ≈2.4 s. If the real frame rate is lower the span grows slightly (measured ≈2.7 s) — that is fine, because **the time axis is labelled from each frame's real timestamp**, never from a nominal frame rate.
- **Shared capture**: one acquisition loop feeds both this view and the 2D spectrum strip — the FFT is read once.

<h3>Why the readings are exact</h3>

1. Band centre frequencies are always derived from the real sample rate, so 48 k / 44.1 k / 96 k files all line up.
2. Every ring-buffer frame stores its **actual playback timestamp**, so a dropped frame never shifts the time axis.
3. The hover readout shows **both** the smoothed dB (what you see drawn) and the raw instantaneous dB of that frame.
4. The readout also reports the underlying FFT bin range, so any number can be traced back to the raw data.
5. **Frequency is reported as measured, not as an axis position**: at the low end a band is narrower than an FFT bin, so its log-axis position can differ a lot from the real data (measured: the band sitting at 84 Hz actually reads bin 17 = **205 Hz**). The readout therefore reports the **centre frequency of the covered bins**, and quotes the axis position whenever the two differ by more than 12%. For the same reason X starts at `sampleRate ÷ fftSize` rather than 0 — **0 Hz is DC (bin 0): it has no place on a log axis and is normally just an offset, not sound**.
6. `AnalyserNode` reads about **14 dB below true dBFS** (Blackman window coherent gain + FFT normalisation; measured, not theoretical). Add **+14 dB** to display dBFS.

<h3>Annotations</h3>

- **X ticks**: 20 / 50 / 100 / 200 / 500 Hz / 1 k / 2 k / 5 k / 10 k / 16 kHz, one grid line each.
- **Y ticks**: one grid line every 10 dB inside the current window. Without quiet detail the window is **0 … −54 dBFS** (top line = 0 dBFS = full scale); with it, −8 … −78 dBFS. Ticks outside the window are dropped rather than clamped.
- **Z ticks**: 0 / −0.6 / −1.2 / −1.8 / −2.4 s, one floor grid line each.
- **Hover readout**: frequency · band index · smoothed level · raw level · time relative to now · real timestamp · FFT bin range.
- **Live extremes**: current frame's peak frequency and peak dB, always on screen.

<h3>Interaction</h3>

Drag to orbit (pointer events, touch included, with a little inertia on release), wheel to zoom, hover to read values (per channel), double-click to reset.

**Controls on the panel** (**effect** is the one-click "whole look" entry point; **colour / style / overlays** are the three independent dimensions for fine-tuning — 6 colours × 6 styles × 2³ overlay combos = 288 combinations. Touching any of them flips the preset to "custom". All choices live in localStorage):

- **Effect** (10 presets, each applies a style + overlays (+ a suggested palette)): `classic` / `ridge` / `bars` / `city` / `cloud` / `rain` / `measuring` (fill + peak trace) / `stage` (fill + reflection) / `neon bars` (bars + glow) / `aurora` (points + reflection + glow, best with the neon stage).
- **Colours**: six schemes — `contrast` (default) / `theme` (the card's four gradient colours spread as a multi-stop ramp **along the frequency axis**; L runs forwards, R backwards; falls back to a built-in ramp when there is no cover) / `cover` (the two cover colours furthest apart in hue go to L and R; a near-monochrome cover falls back to contrast) / `flat` / `morandi` / `neon` (dark stage).
- **Style**: six body styles — `fill` (default) / `mesh` (wireframe; one ridge every 3rd layer, one longitudinal line every 4th band — **both directions must be sparse** or it turns into fur) / `bars` (one vertical stick per band) / `blocks` (one solid block per band, closest to a 3D bar chart) / `points` / `streaks` (points pulled along the time axis).
- **Five overlays, freely combinable**: `reflection` (mirrors the surface below the floor at 26 % alpha) / `glow` (a wide translucent stroke plus a thin bright one — **never `shadowBlur`**, which would kill 96 ribbons) / `peak trace` (each frame's peak joined into a line, showing where the fundamental moves).
- **quiet detail**: widens the dB window to −8…−78 dBFS (**the analyser window is shared by the 2D and 3D views, so the 2D strip changes too**).
- **scale**: switches the Y-axis *reference* between **dBFS** (0 = full scale, every number ≤ 0) and **0 VU** (0 = the −20 dBFS SMPTE alignment level, so programme sits around 0 and full scale reads +20 dB). This only changes the labels — the window, the geometry and the capture are untouched.

> Implementation note: each frame first projects all layers **once** into flat `Float32Array`s (index `(layer × 2 + channel) × bands + band`), then the style functions read from them. That is what makes cross-layer effects (longitudinal mesh, streaks, mirror, peak trace) possible, and it cut the per-frame cost from 2.5 ms to **≤1 ms** by removing tens of thousands of temporary point objects per frame.

<h3>Implementation notes</h3>

1. Orbit camera: yaw about Y, pitch about X, perspective `k = D / (D − Z)`.
2. **Scale by the bounding-sphere radius, never the bounding box** — a box changes size while rotating and makes the scene "breathe".
3. **Sort by depth every frame and paint back-to-front** (painter's algorithm), otherwise occlusion is wrong.
4. Hover readout caches projected coordinates in a `Float32Array` and does one O(n) nearest-point search in screen space.
5. **Cost**: 48 filled ribbons + 48 strokes + grid + 3072 projections ≈ **3–6 ms per frame**; a steady 60 fps in plain Canvas 2D. **No external dependencies, no WebGL.**
6. Optional extras: pin several readouts to compare, time-slice the volume, switch the Y axis between linear and logarithmic.

<p class="hint">Status: the design and precision scheme above are final; wiring the code in comes after refactoring <code>spectrum.js</code> to a single-capture / multi-subscriber model (which must leave the existing 2D spectrum unchanged).</p>

<script type="module" src="/assets/tools/music/app.js?v=202610262"></script>
