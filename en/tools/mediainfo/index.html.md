---
layout: page
title: MediaInfo Viewer
icon: fas fa-film
lang: en
permalink: /tools/mediainfo/
tool_css: /assets/tools/mediainfo/app.css?v=202609185
---

<p class="hint">Drop an audio or video file and the browser parses MediaInfo-grade technical details locally: container, duration, bit rate, resolution, video and audio codecs, colour information, subtitle tracks and more. Four views — grouped tree / text / XML / JSON — with one-click copy. Everything runs on your machine; the file is never uploaded.</p>

<div id="mi-app">

  <div class="mi-drop" id="mi-drop" tabindex="0" role="button" aria-label="Select or drop a media file">
    <input type="file" id="mi-file" accept="video/*,audio/*,.mkv,.mka,.mks,.flac,.aac,.opus,.ts,.m2ts,.vob,.ogv,.oga,.m4a,.m4v,.webm,.rmvb" hidden>
    <i class="fas fa-film"></i>
    <p class="mi-drop-title" id="mi-drop-title">Drop or click to select a media file</p>
    <p class="mi-drop-sub" id="mi-drop-sub"></p>
  </div>

  <div class="mi-status" id="mi-status" role="status" hidden></div>

  <div class="mi-filebar" id="mi-filebar" hidden>
    <span class="mi-fname" id="mi-fname"></span>
    <span class="mi-fsize" id="mi-fsize"></span>
    <span class="mi-spacer"></span>
    <label class="mi-toggle" title="Reference values are typical ranges, not strict standards">
      <input type="checkbox" id="mi-show-ref" checked>
      <span>Show reference &amp; notes</span>
    </label>
    <button type="button" class="mi-btn" id="mi-copy">Copy view</button>
    <button type="button" class="mi-btn" id="mi-play">Play</button>
    <button type="button" class="mi-btn" id="mi-reset">Choose another</button>
  </div>

  <div class="mi-summary" id="mi-summary" hidden></div>

  <div class="mi-cover" id="mi-cover-box" hidden>
    <img id="mi-cover-img" alt="Embedded cover" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
    <span class="mi-fsize">Embedded cover</span>
  </div>

  <div class="mi-player" id="mi-player" hidden></div>

  <div class="mi-tabs" id="mi-tabs" hidden>
    <button type="button" class="mi-tab is-active" data-view="tree">Tree</button>
    <button type="button" class="mi-tab" data-view="text">Text</button>
    <button type="button" class="mi-tab" data-view="xml">XML</button>
    <button type="button" class="mi-tab" data-view="json">JSON</button>
    <button type="button" class="mi-tab" data-view="full">Full</button>
  </div>

  <div id="mi-view-tree"></div>
  <pre class="mi-raw" id="mi-view-text" hidden></pre>
  <pre class="mi-raw" id="mi-view-xml" hidden></pre>
  <pre class="mi-raw" id="mi-view-json" hidden></pre>
  <pre class="mi-raw" id="mi-view-full" hidden></pre>

  <div class="mi-edu">
    <h2>How to read audio/video parameters</h2>

    <h3>1. Layers first: container is not the codec</h3>
    <div class="mi-figure">
      <svg viewBox="0 0 680 320" role="img" xmlns="http://www.w3.org/2000/svg">
        <title>Layers of a media file: container, muxing layer, tracks, codecs and raw signals</title>
        <rect class="mi-fig-outer" x="40" y="30" width="600" height="270" rx="20"/>
        <text class="mi-fig-title" x="60" y="54">Media file = container (the box)</text>
        <rect class="mi-fig-strip" x="60" y="68" width="560" height="42" rx="8"/>
        <text class="mi-fig-strip-t" x="340" y="89" text-anchor="middle">Muxing layer: track layout · index · timestamps PTS/DTS · metadata</text>
        <rect class="mi-fig-box" x="60" y="122" width="176" height="152" rx="10"/>
        <text class="mi-fig-title" x="148" y="146" text-anchor="middle">Video track</text>
        <text class="mi-fig-line" x="148" y="176" text-anchor="middle">H.264 / HEVC / AV1 / VP9</text>
        <text class="mi-fig-line" x="148" y="200" text-anchor="middle">Bitstream: NAL / OBU</text>
        <text class="mi-fig-line" x="148" y="224" text-anchor="middle">Raw signal: pixel frames</text>
        <text class="mi-fig-line" x="148" y="248" text-anchor="middle">YUV·RGB · sampling · depth</text>
        <rect class="mi-fig-box" x="252" y="122" width="176" height="152" rx="10"/>
        <text class="mi-fig-title" x="340" y="146" text-anchor="middle">Audio track</text>
        <text class="mi-fig-line" x="340" y="176" text-anchor="middle">AAC / Opus / FLAC / MP3</text>
        <text class="mi-fig-line" x="340" y="200" text-anchor="middle">Frame: 1024 / 960 samples</text>
        <text class="mi-fig-line" x="340" y="224" text-anchor="middle">Raw signal: PCM samples</text>
        <text class="mi-fig-line" x="340" y="248" text-anchor="middle">Sample rate · depth · channels</text>
        <rect class="mi-fig-box" x="444" y="122" width="176" height="152" rx="10"/>
        <text class="mi-fig-title" x="532" y="146" text-anchor="middle">Text track</text>
        <text class="mi-fig-line" x="532" y="176" text-anchor="middle">SRT / ASS / WebVTT</text>
        <text class="mi-fig-line" x="532" y="200" text-anchor="middle">Image-based PGS / VobSub</text>
        <text class="mi-fig-line" x="532" y="224" text-anchor="middle">Text + timeline</text>
        <text class="mi-fig-line" x="532" y="248" text-anchor="middle">Language · default · forced</text>
      </svg>
    </div>
    <p class="mi-cap">Container / muxing layer / track / codec / raw signal — five layers, top to bottom</p>
    <div class="mi-note">Container and codec are different things: an MP4 can carry H.264 or H.265, and the same AAC stream can be muxed into MP4, MKV or TS. Always ask "is this a container property or a codec property?"</div>

    <h3>2. Key video parameters</h3>
    <table class="mi-ref-table">
      <thead><tr><th>Aspect</th><th>Common values</th><th>Why it matters</th></tr></thead>
      <tbody>
        <tr><td>Codec</td><td>H.264/AVC, H.265/HEVC, AV1, VP9, MPEG-2, ProRes</td><td>Compression, compatibility, hardware decode</td></tr>
        <tr><td>Resolution</td><td>1920×1080, 3840×2160; SAR / PAR / DAR</td><td>Pixels are not display size — watch rotation and DAR</td></tr>
        <tr><td>Frame rate</td><td>23.976 / 24 / 25 / 29.97 / 30 / 50 / 60, CFR vs VFR</td><td>Timebase decides timestamp precision</td></tr>
        <tr><td>Bit depth</td><td>8 / 10 / 12 bit</td><td>10-bit is the basis of HDR and high quality</td></tr>
        <tr><td>Chroma subsampling</td><td>4:2:0 / 4:2:2 / 4:4:4</td><td>4:2:0 saves bits, 4:4:4 keeps chroma for post</td></tr>
        <tr><td>Colour space</td><td>BT.601 / 709 / 2020; primaries · transfer · matrix</td><td>Missing any of the three shifts colours</td></tr>
        <tr><td>HDR</td><td>HLG, PQ / HDR10, HDR10+, Dolby Vision</td><td>Needs depth + transfer function + metadata</td></tr>
        <tr><td>Scan type</td><td>Progressive, Interlaced (TFF / BFF)</td><td>Deinterlace correctly or you get combing</td></tr>
        <tr><td>Profile / Level</td><td>High@4.1, Main10@5.1</td><td>Level caps resolution, frame rate and bit rate</td></tr>
        <tr><td>GOP structure</td><td>I / P / B frames, keyint, IDR, closed vs open GOP</td><td>Affects seeking and live latency</td></tr>
        <tr><td>Bitrate control</td><td>CBR / VBR / CRF / ABR; maxrate · bufsize (VBV)</td><td>CRF targets quality, VBV tames network jitter</td></tr>
        <tr><td>Quality metrics</td><td>PSNR / SSIM / VMAF</td><td>VMAF tracks perception best; PSNR is only a number</td></tr>
        <tr><td>Bitstream format</td><td>Annex-B start codes vs AVCC / HVCC length prefix</td><td>MP4 needs AVCC-formatted streams</td></tr>
      </tbody>
    </table>

    <h3>3. Key audio parameters</h3>
    <table class="mi-ref-table">
      <thead><tr><th>Aspect</th><th>Common values</th><th>Why it matters</th></tr></thead>
      <tbody>
        <tr><td>Codec</td><td>AAC-LC, HE-AAC, Opus, MP3, FLAC, ALAC, AC-3, DTS</td><td>Lossy for delivery, lossless for archival</td></tr>
        <tr><td>Sample rate</td><td>8k / 16k / 44.1k / 48k / 96k / 192k Hz</td><td>Video usually 48k; music often 44.1k</td></tr>
        <tr><td>Bit depth</td><td>16 / 24 / 32 bit, int vs float</td><td>Produce at 24-bit, deliver at 16-bit</td></tr>
        <tr><td>Channels &amp; layout</td><td>mono, stereo, 5.1, 7.1; L R C LFE Ls Rs</td><td>A wrong layout sends dialogue to the rears</td></tr>
        <tr><td>Bit rate</td><td>64–320 kbps; roughly 64k per channel minimum</td><td>VBR saves bits; CBR suits streaming</td></tr>
        <tr><td>AAC profile</td><td>LC / HE / HEv2 / ELD; ADTS vs raw (LATM)</td><td>MP4 carries raw AAC; bare files use ADTS</td></tr>
        <tr><td>Frame length</td><td>AAC 1024 (960) samples; Opus 2.5–60 ms</td><td>Drives latency and muxing alignment</td></tr>
        <tr><td>Sample format</td><td>S16 / S24 / S32 / F32; planar vs interleaved</td><td>Planar for processing, interleaved for output</td></tr>
        <tr><td>Loudness</td><td>LUFS (EBU R128), True Peak</td><td>Streaming targets around -14 LUFS, -1 dBTP</td></tr>
        <tr><td>Lip sync</td><td>A/V offset, delay, timestamp drift</td><td>Sync issues are usually timestamps or delay</td></tr>
        <tr><td>Subtitles</td><td>SRT / ASS / WebVTT / PGS; default vs forced</td><td>Forced shows only foreign-language parts</td></tr>
      </tbody>
    </table>

    <h3>4. GOP and I / P / B frames: why decode order differs from display order</h3>
    <div class="mi-figure">
      <svg viewBox="0 0 680 210" role="img" xmlns="http://www.w3.org/2000/svg">
        <title>Display order versus decode order for I, P and B frames in a GOP</title>
        <text class="mi-fig-cap" x="340" y="22" text-anchor="middle">GOP = distance between two consecutive I frames</text>
        <path class="mi-fig-bracket" d="M150 44 V34 H618 V44"/>
        <text class="mi-fig-label" x="40" y="68">Display order · PTS</text>
        <rect class="mi-f-i" x="150" y="48" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="180" y="62" text-anchor="middle">I</text>
        <text class="mi-fig-num" x="180" y="80" text-anchor="middle">1</text>
        <rect class="mi-f-b" x="218" y="48" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="248" y="62" text-anchor="middle">B</text>
        <text class="mi-fig-num" x="248" y="80" text-anchor="middle">2</text>
        <rect class="mi-f-b" x="286" y="48" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="316" y="62" text-anchor="middle">B</text>
        <text class="mi-fig-num" x="316" y="80" text-anchor="middle">3</text>
        <rect class="mi-f-p" x="354" y="48" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="384" y="62" text-anchor="middle">P</text>
        <text class="mi-fig-num" x="384" y="80" text-anchor="middle">4</text>
        <rect class="mi-f-b" x="422" y="48" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="452" y="62" text-anchor="middle">B</text>
        <text class="mi-fig-num" x="452" y="80" text-anchor="middle">5</text>
        <rect class="mi-f-b" x="490" y="48" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="520" y="62" text-anchor="middle">B</text>
        <text class="mi-fig-num" x="520" y="80" text-anchor="middle">6</text>
        <rect class="mi-f-p" x="558" y="48" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="588" y="62" text-anchor="middle">P</text>
        <text class="mi-fig-num" x="588" y="80" text-anchor="middle">7</text>
        <path class="mi-fig-link" d="M180 88 L180 120"/>
        <path class="mi-fig-link" d="M248 88 C248 104 316 104 316 120"/>
        <path class="mi-fig-link" d="M316 88 C316 104 384 104 384 120"/>
        <path class="mi-fig-link" d="M384 88 C384 104 248 104 248 120"/>
        <path class="mi-fig-link" d="M452 88 C452 104 520 104 520 120"/>
        <path class="mi-fig-link" d="M520 88 C520 104 588 104 588 120"/>
        <path class="mi-fig-link" d="M588 88 C588 104 452 104 452 120"/>
        <text class="mi-fig-label" x="40" y="140">Decode order · DTS</text>
        <rect class="mi-f-i" x="150" y="120" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="180" y="134" text-anchor="middle">I</text>
        <text class="mi-fig-num" x="180" y="152" text-anchor="middle">1</text>
        <rect class="mi-f-p" x="218" y="120" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="248" y="134" text-anchor="middle">P</text>
        <text class="mi-fig-num" x="248" y="152" text-anchor="middle">4</text>
        <rect class="mi-f-b" x="286" y="120" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="316" y="134" text-anchor="middle">B</text>
        <text class="mi-fig-num" x="316" y="152" text-anchor="middle">2</text>
        <rect class="mi-f-b" x="354" y="120" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="384" y="134" text-anchor="middle">B</text>
        <text class="mi-fig-num" x="384" y="152" text-anchor="middle">3</text>
        <rect class="mi-f-p" x="422" y="120" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="452" y="134" text-anchor="middle">P</text>
        <text class="mi-fig-num" x="452" y="152" text-anchor="middle">7</text>
        <rect class="mi-f-b" x="490" y="120" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="520" y="134" text-anchor="middle">B</text>
        <text class="mi-fig-num" x="520" y="152" text-anchor="middle">5</text>
        <rect class="mi-f-b" x="558" y="120" width="60" height="40" rx="8"/>
        <text class="mi-fig-frame" x="588" y="134" text-anchor="middle">B</text>
        <text class="mi-fig-num" x="588" y="152" text-anchor="middle">6</text>
      </svg>
    </div>
    <p class="mi-cap">I decodes standalone · P references earlier frames · B references both ways, so decode order differs from display order</p>
    <div class="mi-note">A B frame needs the frame that comes <em>after</em> it, so that later P frame must be decoded first. That is the only reason containers carry two timestamps: PTS (when to show) and DTS (when to decode).</div>

    <h3>5. Suggested reading order for a report</h3>
    <ol>
      <li><b>Container + codec combo</b> — is it supported by the target device or browser?</li>
      <li><b>Resolution + frame rate + scan type</b> — progressive or interlaced</li>
      <li><b>Bit depth + chroma subsampling + the three colour tags</b> — colour shift and HDR eligibility</li>
      <li><b>Profile@Level</b> — the ceiling for hardware decoding</li>
      <li><b>Video + audio bit rate</b> — only meaningful next to resolution (bpp)</li>
      <li><b>Audio: codec + sample rate + channel layout</b> — a wrong layout moves voices to the rear</li>
      <li><b>GOP / keyframe interval</b> — seeking, precision and live latency</li>
      <li><b>Duration + size + per-track language / default / forced</b></li>
    </ol>

    <div class="mi-note">
      <b>Three classic traps:</b>
      ① "MP4 won't play" is often <code>moov</code> at the end of the file (no faststart), or an Annex-B stream that was never converted to AVCC;
      ② washed-out or over-saturated picture: <code>primaries / transfer / matrix</code> missing or mismatched, typically BT.601 mixed with BT.709;
      ③ A/V drift or wrong channels: usually container timestamps or track delay, not a broken encode.
    </div>
  </div>

</div>

<script type="module" src="/assets/tools/mediainfo/app.js?v=202609185"></script>
