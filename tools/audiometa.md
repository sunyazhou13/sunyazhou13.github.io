---
layout: page
title: 音频元数据查看器
icon: fas fa-headphones-simple
tool_css: /assets/tools/audiometa/app.css?v=202609258
---

<p class="hint">拖入一个音频文件，浏览器本地解析出<b>元数据标签</b>（标题、艺术家、专辑、音轨、年份、流派、歌词、ReplayGain 等）与<b>技术参数</b>（编码、采样率、位深、声道、码率、时长、无损与否等），并展示<b>内嵌封面</b>，还能<b>直接在页面里试听</b>。支持 FLAC / ALAC / APE / WAV / AIFF / DXD / MP3 / AAC / M4A / WMA / OGG / OPUS / MP2 / DSF / DFF / AC-3 / DTS 以及 M3U / M3U8 播放列表。全部在本机完成，文件不会上传。</p>

<div id="am-app">

  <div class="am-drop" id="am-drop">
    <input type="file" id="am-file" class="am-file-overlay" accept="audio/*,.flac,.alac,.ape,.wav,.aiff,.aif,.m4a,.mp3,.aac,.wma,.ogg,.opus,.mp2,.dsf,.dff,.ac3,.dts,.m3u,.m3u8" aria-label="选择或拖入音频文件">
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="16.5" cy="16" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
    <p class="am-drop-title" id="am-drop-title">拖入或点击选择音频文件</p>
    <p class="am-drop-sub" id="am-drop-sub"></p>
  </div>

  <div class="am-status" id="am-status" role="status" hidden></div>

  <div class="am-filebar" id="am-filebar" hidden>
    <span class="am-fname" id="am-fname"></span>
    <span class="am-fsize" id="am-fsize"></span>
    <span class="am-spacer"></span>
    <button type="button" class="am-btn" id="am-copy">复制全部</button>
    <button type="button" class="am-btn" id="am-reset">重新选择</button>
  </div>

  <div class="am-hero" id="am-hero" hidden></div>
  <div class="am-view" id="am-view"></div>

  <div class="am-edu">
    <h2>支持情况与读数说明</h2>

    <h3>1. 支持的容器</h3>
    <table class="am-ref">
      <thead><tr><th>类型</th><th>格式</th><th>标签来源</th></tr></thead>
      <tbody>
        <tr><td>无损</td><td>FLAC / ALAC / APE / WAV / AIFF / DXD</td><td>Vorbis comment / iTunes ilst / APEv2 / RIFF-INFO / ID3</td></tr>
        <tr><td>有损</td><td>MP3 / MP2 / AAC / M4A / WMA / OGG / OPUS</td><td>ID3v2 / ID3v1 / iTunes ilst / ASF / Vorbis comment</td></tr>
        <tr><td>DSD</td><td>DSF / DFF</td><td>ID3v2</td></tr>
        <tr><td>影院音轨</td><td>AC-3 / DTS</td><td>一般无标签（仅裸码流）</td></tr>
        <tr><td>播放列表</td><td>M3U / M3U8</td><td>文本条目 + #EXTINF</td></tr>
        <tr><td>光盘镜像</td><td>SACD ISO</td><td>仅识别，不展开内部音轨</td></tr>
      </tbody>
    </table>
    <div class="am-note">本工具直接读文件字节：格式靠魔数与后缀、参数靠各容器头、标签靠各容器的标签区、封面靠各容器的图片块（ID3 APIC / FLAC PICTURE / MP4 covr / APEv2 Cover Art / ASF WM-Picture）。因此即使浏览器无法播放（如 DSD、APE），参数与标签照样能读出。</div>

    <h3>2. 怎么读这些数字</h3>
    <ul>
      <li><b>采样率</b> —— 每秒采样点数。44.1 kHz 为 CD，48 kHz 为影视/流媒体，96 kHz 及以上为 Hi-Res；DSD 的数值（如 2.8224 MHz）是 1-bit 比特率，不是 PCM 采样率。</li>
      <li><b>位深</b> —— 每次采样的量化精度。16 bit 为 CD，24 bit 为录音室/Hi-Res；DSD 固定为 1 bit。</li>
      <li><b>码率</b> —— 每秒数据量。有损常见 96–320 kbps；无损（FLAC/ALAC/APE/WAV）码率随内容波动，仅作参考。</li>
      <li><b>时长</b> —— 由样本数 ÷ 采样率推算；VBR 有损文件为逐帧累计估算，可能有毫秒级误差。</li>
      <li><b>标签里的「说明 / 合理性」列</b> —— 标出该字段的常见范围；明显偏离常见值会标 <code>⚠</code>，无对应说明的填 <code>N/A</code>。</li>
    </ul>

    <h3>3. 关于试听</h3>
    <p>头部区域有一个原生播放器，直接播放本机文件，同样不上传。能否播放取决于<b>浏览器自带的解码器</b>，与本工具能否解析是两回事：</p>
    <ul>
      <li><b>一般可直接播放</b> —— MP3 / MP2 / AAC / M4A / ALAC / FLAC / WAV / AIFF / OGG / OPUS。</li>
      <li><b>浏览器放不了</b> —— DSF / DFF（DSD 的 1-bit 码流）、APE、WMA、AC-3、DTS。这些格式的参数与标签照样读得出来，只是没有原生解码器。</li>
      <li><b>可以转码后听</b> —— 上面这几种<b>拖进来就会自动转码并播放</b>：页面内置的 ffmpeg（WebAssembly 版）把音频转成 44.1 kHz / 16 bit PCM 再交给播放器。首次会载入约 32 MB 的解码核心，之后同一页面内复用；转码同样全在本机完成，不上传。</li>
      <li>DFF 会先被重新封装成 DSF 再交给 ffmpeg —— 因为 ffmpeg 没有 DSDIFF 解复用器。两者的音频数据有两处差异：DFF 是<b>逐字节交错</b>而 DSF 是<b>每声道 4096 字节分块</b>；DFF 是 <b>MSB 优先</b>而 DSF 是 <b>LSB 优先</b>，逐字节做位反转。少做一步解出来就是噪声。</li>
      <li>播放器下方会给出<b>浏览器解码时长</b>与<b>解析时长</b>的比对：两者一致，说明解析器算出的时长没问题；个别 MP3 缺少 Xing / VBRI 头时会有偏差。</li>
    </ul>

    <h3>4. 数据来源与隐私</h3>
    <p>所有解析与播放均在浏览器本地完成，文件不上传、不留存。</p>
  </div>

</div>

<script type="module" src="/assets/tools/audiometa/app.js?v=202610126"></script>
