---
layout: page
title: Audio Metadata Viewer
icon: fas fa-headphones-simple
lang: en
permalink: /tools/audiometa/
tool_css: /assets/tools/audiometa/app.css?v=202609258
---

<p class="hint">Drop an audio file to parse, entirely in your browser, its <b>metadata tags</b> (title, artist, album, track, year, genre, lyrics, ReplayGain …) and <b>technical parameters</b> (codec, sample rate, bit depth, channels, bitrate, duration, lossless or not), plus the <b>embedded cover art</b>, and lets you <b>play the file right in the page</b>. Supports FLAC / ALAC / APE / WAV / AIFF / DXD / MP3 / AAC / M4A / WMA / OGG / OPUS / MP2 / DSF / DFF / AC-3 / DTS and M3U / M3U8 playlists. Everything runs locally; nothing is uploaded.</p>

<div id="am-app">

  <div class="am-drop" id="am-drop">
    <input type="file" id="am-file" class="am-file-overlay" accept="audio/*,.flac,.alac,.ape,.wav,.aiff,.aif,.m4a,.mp3,.aac,.wma,.ogg,.opus,.mp2,.dsf,.dff,.ac3,.dts,.m3u,.m3u8" aria-label="Select or drop an audio file">
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="16.5" cy="16" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
    <p class="am-drop-title" id="am-drop-title">Drop or click to select an audio file</p>
    <p class="am-drop-sub" id="am-drop-sub"></p>
  </div>

  <div class="am-status" id="am-status" role="status" hidden></div>

  <div class="am-filebar" id="am-filebar" hidden>
    <span class="am-fname" id="am-fname"></span>
    <span class="am-fsize" id="am-fsize"></span>
    <span class="am-spacer"></span>
    <button type="button" class="am-btn" id="am-copy">Copy all</button>
    <button type="button" class="am-btn" id="am-reset">Choose another</button>
  </div>

  <div class="am-hero" id="am-hero" hidden></div>
  <div class="am-view" id="am-view"></div>

  <div class="am-edu">
    <h2>Coverage &amp; how to read it</h2>

    <h3>1. Supported containers</h3>
    <table class="am-ref">
      <thead><tr><th>Kind</th><th>Formats</th><th>Tag source</th></tr></thead>
      <tbody>
        <tr><td>Lossless</td><td>FLAC / ALAC / APE / WAV / AIFF / DXD</td><td>Vorbis comment / iTunes ilst / APEv2 / RIFF-INFO / ID3</td></tr>
        <tr><td>Lossy</td><td>MP3 / MP2 / AAC / M4A / WMA / OGG / OPUS</td><td>ID3v2 / ID3v1 / iTunes ilst / ASF / Vorbis comment</td></tr>
        <tr><td>DSD</td><td>DSF / DFF</td><td>ID3v2</td></tr>
        <tr><td>Cinema tracks</td><td>AC-3 / DTS</td><td>Usually none (raw elementary stream)</td></tr>
        <tr><td>Playlists</td><td>M3U / M3U8</td><td>Text entries + #EXTINF</td></tr>
        <tr><td>Disc image</td><td>SACD ISO</td><td>Detected only; inner tracks not expanded</td></tr>
      </tbody>
    </table>
    <div class="am-note">This tool reads raw bytes: format from magic number + extension, parameters from each container's header, tags from each container's tag region, and cover art from each container's picture block (ID3 APIC / FLAC PICTURE / MP4 covr / APEv2 Cover Art / ASF WM-Picture). So even when the browser cannot play the audio (e.g. DSD, APE), the parameters and tags are still read.</div>

    <h3>2. How to read the numbers</h3>
    <ul>
      <li><b>Sample rate</b> — samples per second. 44.1 kHz is CD, 48 kHz is film/streaming, 96 kHz and up is Hi-Res; a DSD figure (e.g. 2.8224 MHz) is a 1-bit bit rate, not a PCM rate.</li>
      <li><b>Bit depth</b> — quantisation precision. 16 bit is CD, 24 bit is studio/Hi-Res; DSD is always 1 bit.</li>
      <li><b>Bitrate</b> — data per second. 96–320 kbps is typical for lossy; for lossless (FLAC/ALAC/APE/WAV) it varies with content and is indicative only.</li>
      <li><b>Duration</b> — derived from samples ÷ sample rate; for VBR lossy files it is accumulated per frame and may differ by milliseconds.</li>
      <li><b>The "Notes / validity" column</b> — shows the usual range for that field; values clearly outside it are flagged <code>⚠</code>, and fields with no note show <code>N/A</code>.</li>
    </ul>

    <h3>3. About playback</h3>
    <p>The header carries a native player that plays the local file directly — again, nothing is uploaded. Whether it can play depends on <b>the browser's own decoders</b>, which is a different question from whether this tool can parse it:</p>
    <ul>
      <li><b>Usually playable</b> — MP3 / MP2 / AAC / M4A / ALAC / FLAC / WAV / AIFF / OGG / OPUS.</li>
      <li><b>Not playable</b> — DSF / DFF (DSD, a 1-bit stream), APE, WMA, AC-3, DTS. Their parameters and tags are still read fine; there is simply no native decoder.</li>
      <li><b>Playable after transcoding</b> — for those formats, <b>transcoding starts automatically on drop</b>: the page's built-in ffmpeg (WebAssembly build) converts the audio to 44.1 kHz / 16-bit PCM and hands it to the player. The first run loads a ~32 MB decoding core, reused afterwards; transcoding also happens entirely on your machine.</li>
      <li>DFF is re-wrapped into DSF before ffmpeg sees it, because ffmpeg has no DSDIFF demuxer. The audio data differs in two ways: DFF is <b>byte-interleaved</b> while DSF uses <b>4096-byte blocks per channel</b>, and DFF is <b>MSB-first</b> while DSF is <b>LSB-first</b>, so every byte is bit-reversed. Skip either step and you get noise.</li>
      <li>Under the player you get a comparison of the <b>browser's decoded duration</b> and the <b>parsed duration</b>: if they match, the parser's duration is sound. Some MP3s without a Xing / VBRI header will differ.</li>
    </ul>

    <h3>4. Privacy</h3>
    <p>All parsing and playback happens locally in your browser. Nothing is uploaded or stored.</p>
  </div>

</div>

<script type="module" src="/assets/tools/audiometa/app.js?v=202610126"></script>
