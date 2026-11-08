---
layout: page
title: 媒体信息查看器
icon: fas fa-film
tool_css: /assets/tools/mediainfo/app.css?v=202609185
---

<p class="hint">拖入一个音视频文件，浏览器本地解析出 MediaInfo 级别的完整技术参数：容器、时长、码率、分辨率、视频与音频编码、色彩信息、字幕轨等。支持分组表格 / 文本 / XML / JSON 四种视图，可一键复制。全部在本机完成，文件不会上传。</p>

<div id="mi-app">

  <div class="mi-drop" id="mi-drop" tabindex="0" role="button" aria-label="选择或拖入音视频文件">
    <input type="file" id="mi-file" accept="video/*,audio/*,.mkv,.mka,.mks,.flac,.aac,.opus,.ts,.m2ts,.vob,.ogv,.oga,.m4a,.m4v,.webm,.rmvb" hidden>
    <i class="fas fa-film"></i>
    <p class="mi-drop-title" id="mi-drop-title">拖入或点击选择音视频文件</p>
    <p class="mi-drop-sub" id="mi-drop-sub"></p>
  </div>

  <div class="mi-status" id="mi-status" role="status" hidden></div>

  <div class="mi-filebar" id="mi-filebar" hidden>
    <span class="mi-fname" id="mi-fname"></span>
    <span class="mi-fsize" id="mi-fsize"></span>
    <span class="mi-spacer"></span>
    <label class="mi-toggle" title="参考值为常见推荐范围，非强制标准">
      <input type="checkbox" id="mi-show-ref" checked>
      <span>显示参考值 / 备注</span>
    </label>
    <button type="button" class="mi-btn" id="mi-copy">复制当前视图</button>
    <button type="button" class="mi-btn" id="mi-play">播放</button>
    <button type="button" class="mi-btn" id="mi-reset">重新选择</button>
  </div>

  <div class="mi-summary" id="mi-summary" hidden></div>

  <div class="mi-cover" id="mi-cover-box" hidden>
    <img id="mi-cover-img" alt="内嵌封面" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
    <span class="mi-fsize">内嵌封面</span>
  </div>

  <div class="mi-player" id="mi-player" hidden></div>

  <div class="mi-tabs" id="mi-tabs" hidden>
    <button type="button" class="mi-tab is-active" data-view="tree">分组表格</button>
    <button type="button" class="mi-tab" data-view="text">文本</button>
    <button type="button" class="mi-tab" data-view="xml">XML</button>
    <button type="button" class="mi-tab" data-view="json">JSON</button>
    <button type="button" class="mi-tab" data-view="full">完整</button>
  </div>

  <div id="mi-view-tree"></div>
  <pre class="mi-raw" id="mi-view-text" hidden></pre>
  <pre class="mi-raw" id="mi-view-xml" hidden></pre>
  <pre class="mi-raw" id="mi-view-json" hidden></pre>
  <pre class="mi-raw" id="mi-view-full" hidden></pre>

  <div class="mi-edu">
    <h2>音视频参数怎么看</h2>

    <h3>1. 先分层次：容器 ≠ 编码</h3>
    <div class="mi-figure">
      <svg viewBox="0 0 680 320" role="img" xmlns="http://www.w3.org/2000/svg">
        <title>媒体文件的层级：容器、封装层、轨道、编码与原始信号</title>
        <rect class="mi-fig-outer" x="40" y="30" width="600" height="270" rx="20"/>
        <text class="mi-fig-title" x="60" y="54">媒体文件 = container（箱子）</text>
        <rect class="mi-fig-strip" x="60" y="68" width="560" height="42" rx="8"/>
        <text class="mi-fig-strip-t" x="340" y="89" text-anchor="middle">封装层：轨道组织 · 索引 · 时间戳 PTS/DTS · 元数据标签</text>
        <rect class="mi-fig-box" x="60" y="122" width="176" height="152" rx="10"/>
        <text class="mi-fig-title" x="148" y="146" text-anchor="middle">视频轨 Video</text>
        <text class="mi-fig-line" x="148" y="176" text-anchor="middle">H.264 / HEVC / AV1 / VP9</text>
        <text class="mi-fig-line" x="148" y="200" text-anchor="middle">码流单元 NAL / OBU</text>
        <text class="mi-fig-line" x="148" y="224" text-anchor="middle">原始信号：像素帧</text>
        <text class="mi-fig-line" x="148" y="248" text-anchor="middle">YUV·RGB · 采样 · 色深</text>
        <rect class="mi-fig-box" x="252" y="122" width="176" height="152" rx="10"/>
        <text class="mi-fig-title" x="340" y="146" text-anchor="middle">音频轨 Audio</text>
        <text class="mi-fig-line" x="340" y="176" text-anchor="middle">AAC / Opus / FLAC / MP3</text>
        <text class="mi-fig-line" x="340" y="200" text-anchor="middle">帧长 1024 / 960 样本</text>
        <text class="mi-fig-line" x="340" y="224" text-anchor="middle">原始信号：PCM 采样</text>
        <text class="mi-fig-line" x="340" y="248" text-anchor="middle">采样率 · 位深 · 声道</text>
        <rect class="mi-fig-box" x="444" y="122" width="176" height="152" rx="10"/>
        <text class="mi-fig-title" x="532" y="146" text-anchor="middle">字幕轨 Text</text>
        <text class="mi-fig-line" x="532" y="176" text-anchor="middle">SRT / ASS / WebVTT</text>
        <text class="mi-fig-line" x="532" y="200" text-anchor="middle">图形 PGS / VobSub</text>
        <text class="mi-fig-line" x="532" y="224" text-anchor="middle">文本 + 时间轴</text>
        <text class="mi-fig-line" x="532" y="248" text-anchor="middle">语言 · 默认 · 强制</text>
      </svg>
    </div>
    <p class="mi-cap">容器 / 封装层 / 轨道 / 编码 / 原始信号，五层从上到下</p>
    <div class="mi-note">容器和编码是两回事：MP4 里可以装 H.264，也可以装 H.265；反过来同一个 AAC 音轨，装进 MP4、MKV、TS 都行。看参数前先分清「这是容器属性还是编码属性」。</div>

    <h3>2. 视频关键参数</h3>
    <table class="mi-ref-table">
      <thead><tr><th>维度</th><th>常见取值</th><th>要点</th></tr></thead>
      <tbody>
        <tr><td>编码标准</td><td>H.264/AVC、H.265/HEVC、AV1、VP9、MPEG-2、ProRes</td><td>定压缩率、兼容性、硬解支持</td></tr>
        <tr><td>分辨率</td><td>1920×1080、3840×2160；SAR / PAR / DAR</td><td>像素不等于显示，注意旋转与宽高比</td></tr>
        <tr><td>帧率 fps</td><td>23.976 / 24 / 25 / 29.97 / 30 / 50 / 60，CFR 与 VFR</td><td>时基 timebase 决定时间戳精度</td></tr>
        <tr><td>色深</td><td>8 / 10 / 12 bit</td><td>10bit 是 HDR 与高画质的基础</td></tr>
        <tr><td>色度采样</td><td>4:2:0 / 4:2:2 / 4:4:4</td><td>4:2:0 最省，4:4:4 保色度，用于后期</td></tr>
        <tr><td>色彩空间</td><td>BT.601 / 709 / 2020；primaries · transfer · matrix</td><td>三要素缺一会偏色，错配很常见</td></tr>
        <tr><td>HDR</td><td>HLG、PQ / HDR10、HDR10+、Dolby Vision</td><td>需色深 + 传输函数 + 元数据配套</td></tr>
        <tr><td>扫描方式</td><td>Progressive、Interlaced（TFF / BFF）</td><td>交错源要正确去交错，否则拉丝</td></tr>
        <tr><td>Profile / Level</td><td>High@4.1、Main10@5.1</td><td>决定设备能否硬解，Level 限上界</td></tr>
        <tr><td>GOP 结构</td><td>I / P / B 帧、keyint、IDR、闭合与开放 GOP</td><td>影响拖动响应与直播延迟</td></tr>
        <tr><td>码率控制</td><td>CBR / VBR / CRF / ABR；maxrate · bufsize（VBV）</td><td>CRF 控质量，VBV 控网络抖动</td></tr>
        <tr><td>质量评价</td><td>PSNR / SSIM / VMAF</td><td>VMAF 最贴近主观，PSNR 只作参考</td></tr>
        <tr><td>码流格式</td><td>Annex-B 起始码 vs AVCC / HVCC 长度前缀</td><td>封装进 MP4 要转 AVCC，否则难播</td></tr>
      </tbody>
    </table>

    <h3>3. 音频关键参数</h3>
    <table class="mi-ref-table">
      <thead><tr><th>维度</th><th>常见取值</th><th>要点</th></tr></thead>
      <tbody>
        <tr><td>编码格式</td><td>AAC-LC、HE-AAC、Opus、MP3、FLAC、ALAC、AC-3、DTS</td><td>有损看场景，无损用于归档与母版</td></tr>
        <tr><td>采样率</td><td>8k / 16k / 44.1k / 48k / 96k / 192k Hz</td><td>影视配音通常 48k，音乐常见 44.1k</td></tr>
        <tr><td>位深</td><td>16 / 24 / 32 bit，int 与 float</td><td>制作链路 24bit，交付常 16bit</td></tr>
        <tr><td>声道与布局</td><td>mono、stereo、5.1、7.1；L R C LFE Ls Rs</td><td>布局标错会串声道，例如人声跑后置</td></tr>
        <tr><td>码率</td><td>64–320 kbps；每声道约 64k 起步</td><td>VBR 更省，CBR 利于流媒体稳定</td></tr>
        <tr><td>AAC 档次</td><td>LC / HE / HEv2 / ELD；ADTS 与 raw（LATM）</td><td>MP4 内是 raw AAC，裸流才是 ADTS</td></tr>
        <tr><td>帧长</td><td>AAC 1024（960）样本；Opus 2.5–60 ms</td><td>直接决定延迟与封装对齐</td></tr>
        <tr><td>采样格式</td><td>S16 / S24 / S32 / F32；planar 与 interleaved</td><td>planar 便于处理，interleaved 便于输出</td></tr>
        <tr><td>响度</td><td>LUFS（EBU R128）、True Peak</td><td>流媒体常以 -14 LUFS、TP -1 dBTP 为目标</td></tr>
        <tr><td>唇音同步</td><td>A/V offset、delay、时间戳偏移</td><td>音画不同步多半是时间戳或 delay 问题</td></tr>
        <tr><td>字幕</td><td>SRT / ASS / WebVTT / PGS；default 与 forced</td><td>forced 只在外语片段强制显示</td></tr>
      </tbody>
    </table>

    <h3>4. GOP 与 I / P / B 帧：为什么解码顺序 ≠ 显示顺序</h3>
    <div class="mi-figure">
      <svg viewBox="0 0 680 210" role="img" xmlns="http://www.w3.org/2000/svg">
        <title>GOP 中 I、P、B 帧的显示顺序与解码顺序</title>
        <text class="mi-fig-cap" x="340" y="22" text-anchor="middle">GOP = 相邻两个 I 帧之间的距离</text>
        <path class="mi-fig-bracket" d="M150 44 V34 H618 V44"/>
        <text class="mi-fig-label" x="40" y="68">显示顺序 · PTS</text>
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
        <text class="mi-fig-label" x="40" y="140">解码顺序 · DTS</text>
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
    <p class="mi-cap">I 独立解码 · P 参考前序帧 · B 双向参考须等后序帧，故解码顺序与显示顺序不同</p>
    <div class="mi-note">B 帧要参考「后面的帧」才能解码，所以必须先解出它后面的 P 帧。这就是容器里同时存在 PTS（什么时候显示）和 DTS（什么时候解码）两个时间戳的唯一原因。</div>

    <h3>5. 读一份报告的建议顺序</h3>
    <ol>
      <li><b>容器 + 编码组合</b> —— 先确认目标设备 / 浏览器是否支持</li>
      <li><b>分辨率 + 帧率 + 扫描方式</b> —— Progressive 还是 Interlaced</li>
      <li><b>色深 + 色度采样 + 色彩三要素</b> —— 会不会偏色、够不够格播 HDR</li>
      <li><b>Profile@Level</b> —— 硬解能力上限</li>
      <li><b>视频码率 + 音频码率</b> —— 配合分辨率看 bpp 才有意义</li>
      <li><b>音轨：编码 + 采样率 + 声道布局</b> —— 布局写错人会声跑到后置</li>
      <li><b>GOP / 关键帧间隔</b> —— 影响拖动响应、seek 精度与直播延迟</li>
      <li><b>时长 + 总大小 + 各轨语言 / default / forced</b></li>
    </ol>

    <div class="mi-note">
      <b>三个高频坑：</b>
      ① 以为「MP4 播不了」是编码问题，其实是 <code>moov</code> 在文件尾部（没做 faststart），或码流是 Annex-B 没转 AVCC；
      ② 画面发灰 / 过艳：<code>primaries / transfer / matrix</code> 三者只标一个或标错，尤其 BT.601 与 BT.709 混用；
      ③ 音画不同步、声道错位：多半是容器时间戳或音轨 delay，而不是「编码坏了」。
    </div>
  </div>

</div>

<script type="module" src="/assets/tools/mediainfo/app.js?v=202609185"></script>
