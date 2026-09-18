---
layout: post
title: ffmpeg 视频转动图 AVIF：一条命令讲透
date: 2026-09-18 12:04 +0000
categories: [iOS]
tags: [ffmpeg, AVIF, 动图, 视频转码, 图片格式]
typora-root-url: ".."
math: false
mermaid: false
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

---

![从一段 iPhone Duo 折叠演示录屏转出的动画 AVIF，571 KB](/assets/images/20260918ConvertVideoToAnimatedAvifWithFfmpeg/demo-screenrec.avif)

*上面这张动图就是从一段 4.3 秒的录屏转出来的，**571 KB**，无限循环播放。素材是 Apple 官方的 iPhone Duo 折叠演示片段。*

---

## 先说结论

```bash
ffmpeg -y -i in.mov -an \
  -vf "fps=15,scale=1296:-2:flags=lanczos" \
  -c:v libsvtav1 -crf 32 -preset 8 -g 1 \
  -pix_fmt yuv420p -loop 0 out.avif
```

就这一条。原文件 19.9 MB，出来 571 KB（另一版更高画质的是 1.48 MB），编码只花了一两秒。

**前提**是你的 ffmpeg 带 `avif` muxer 和 AV1 编码器。先验一下：

```bash
ffmpeg -hide_banner -h muxer=avif            # 要能看到 "Muxer avif [AVIF]"
ffmpeg -hide_banner -encoders | grep -i av1  # 要有 libsvtav1 或 libaom-av1
```

本文用的 homebrew ffmpeg 9.0.1，两条都过，自带 `libsvtav1`。**不需要额外装 `avifenc` 或 ImageMagick**。

---

## 为什么不用 GIF

GIF 是 1987 年的东西：256 色、LZW 无损压缩，没有跨帧的预测编码。一段几秒的屏幕录像转 GIF，动辄三五 MB，而且渐变和肤色上全是色带。

动画 AVIF 是另一条路线：**它本质上是把 AV1 视频编码的帧序列装进图片容器里**。AV1 是目前压缩效率最高的通用编码之一，所以同样内容的体积通常只有 GIF 的几分之一到十几分之一，还是 24 位真彩 + 完整 alpha 通道。

代价有两个，后面都会讲：编码慢一点（其实也很快），以及**兼容性门槛比静态 AVIF 高**。

---

## 转换的四个阶段

![ffmpeg 转换流水线：解码、抽帧缩放、AV1 编码、AVIF 封装](/assets/images/20260918ConvertVideoToAnimatedAvifWithFfmpeg/avif-pipeline.avif)

`ffmpeg` 做的事说穿了很朴素：**把视频拆成一帧帧，每帧单独压成 AV1 图，再打包成一个图片文件。**

### 一、解码

读 `.mov`（H.264 + AAC），解出原始帧序列。这一步和普通转码没区别。

### 二、抽帧 + 缩放

`-vf "fps=15,scale=1296:-2"` 里塞了两件事：

- `fps=15` —— 源是 60fps，每 4 帧只留 1 帧。**帧数从 260 降到 65，体积直接砍到四分之一**，这是最有效的一刀，动图的观感几乎不受影响。
- `scale=1296:-2` —— 宽度定 1296，高度按比例自动算。**`-2` 不是 `-1`**：`-2` 表示算完之后向偶数取整。因为后面要用 4:2:0 色度采样，宽高必须是偶数，写 `-1` 有可能得到奇数、直接报错。

### 三、AV1 编码

`-c:v libsvtav1` 调的是 SVT-AV1（Intel 和 Netflix 开源的那套），而不是 ffmpeg 默认可能带的 `libaom-av1`——后者慢得多。

这里最关键的是 `-g 1`：**关键帧间隔设为 1，也就是每一帧都编码成独立关键帧**。为什么非这样不可，下一节说。

### 四、封装

最后交给 `avif` muxer 写文件，`-loop 0` 表示无限循环。

---

## 文件内部长什么样

![动画 AVIF 文件内部：ftyp / meta / mdat 三个盒子，mdat 里是一串独立关键帧](/assets/images/20260918ConvertVideoToAnimatedAvifWithFfmpeg/avif-structure.avif)

AVIF 用的是 **ISOBMFF 容器**——和 MP4 是同一套「盒子」结构，这也解释了为什么 `ffprobe` 会把它认成 `mov,mp4`。

- `ftyp`：格式标识
- `meta`：尺寸、帧数、循环次数这些元数据
- `mdat`：真正的帧数据，一串 AV1 帧排排坐

**每一帧都是一张完整的关键帧（intra frame），帧与帧之间不做前后预测。**

这就是 `-g 1` 存在的理由。视频编码省体积主要靠帧间预测——P 帧只记录「和上一帧的差异」。但图片序列不能这么干：

- 播放器要能定位到任意一帧（用户可能只想看第 30 帧）
- 循环回到第一帧时，不能还依赖末尾帧的状态
- 图片解码器本来就不维护「参考帧」这种跨帧状态

所以规范要求每帧自给自足。

**这是动画 AVIF 天生的代价**：它放弃了帧间压缩，所以同等画质下文件比 MP4 大。但换来的是它仍然是一张「图片」——可以用 `<img>` 标签、能进 CSS、能被图片 CDN 处理，而且 AV1 的单帧压缩效率足够高，最终体积依然远小于 GIF。

---

## 参数逐条拆解

| 参数 | 作用 | 备注 |
| --- | --- | --- |
| `-an` | 丢弃音轨 | AVIF 不存声音，留着只会浪费 |
| `fps=15` | 抽帧 | 对体积影响最大的一刀 |
| `scale=1296:-2` | 缩放宽度 | `-2` = 高度取偶数，4:2:0 的硬性要求 |
| `-c:v libsvtav1` | AV1 编码器 | 比 libaom-av1 快得多 |
| `-crf 32` | 质量档 | 0–63，越大越小越糊。**录屏含文字时别超过 40** |
| `-preset 8` | 编码速度档 | 0–13，越大越快、画质略降 |
| `-g 1` | 每帧都是关键帧 | AVIF 序列的硬性要求，不是优化项 |
| `-pix_fmt yuv420p` | 8bit 4:2:0 | 兼容性最好；10bit 很多解码器吃不下 |
| `-loop 0` | 循环次数 | 0 = 无限循环 |

---

## 三个体积旋钮

体积大致是 `帧数 × 分辨率 × 单帧码率`，所以能拧的就三个，**按效果排序**：

| 旋钮 | 力度 | 代价 |
| --- | --- | --- |
| `fps` | 最大 | 帧率越低越卡顿，12–15 是动图的舒适区 |
| `scale` | 大 | 分辨率越低越糊，宽度 960–1300 适合正文 |
| `-crf` | 中 | 越大压缩痕迹越重，文字边缘先崩 |

实测（源：4.34 秒 / 2592×1596 / 60fps 录屏，19.9 MB）：

| 版本 | 参数 | 体积 |
| --- | --- | --- |
| 大版 | 1296×798 · 15fps · 65 帧 · crf 32 | **1.48 MB** |
| 小版 | 960×592 · 12fps · 52 帧 · crf 40 | **571 KB** |

**编码耗时都在两秒以内。** 原因在于 SVT-AV1 针对多核优化，而且 intra 帧之间没有依赖，可以满核并行——不像转普通视频那样被帧依赖卡住流水线。

---

## 怎么确认它真的是动图

这一步很容易翻车：文件生成成功 ≠ 里面有多帧。

**用 Pillow 最直接**：

```bash
python -c "from PIL import Image; print(Image.open('out.avif').n_frames)"
# 65
```

**用 ffprobe 也可以，但有个坑**：它会报**两个流**，第一个 `nb_frames=1` 其实是首帧缩略图，第二个才是真正的帧序列。别看到第一个流就以为只有一帧。

```bash
ffprobe -v error -show_entries stream=nb_frames,width,height -of default=noprint_wrappers=1 out.avif
# nb_frames=1     ← 首帧缩略图
# nb_frames=65    ← 真正的序列
```

---

## 放到网页上

**浏览器支持（2026 年现状）**，注意**动画**的门槛比静态高：

| 浏览器 | 静态 AVIF | 动画 AVIF |
| --- | --- | --- |
| Chrome | 85+ | **93+** |
| Firefox | 93+ | **113+** |
| Safari | 16.1+ | **16.4+** |
| Edge | 121+ | 121+ |

全球覆盖率约 93–95%。**不支持的浏览器不会裂图，只会显示第一帧**——所以退化是「静图」而不是「红叉」。

如果这点体验损失不能忍，两条兜底路线：

1. `<picture>` 里挂一份动画 WebP（WebP 动画的支持面更宽）
2. 直接上 `<video autoplay loop muted playsinline>` + MP4，把「动」这件事交给视频标签

**还有一个实践中的坑：文件名一定要用 ASCII。** 中文文件名在 macOS 上是 NFD 归一化形式，Jekyll 构建时可能在 URL 处理环节直接崩掉（这个坑我在博客上真踩过）。所以是 `demo-screenrec.avif`，不是「录屏.avif」。

---

## 参考

- [ffmpeg 官方文档 · AVIF muxer](https://ffmpeg.org/ffmpeg-formats.html#avif-1)
- [SVT-AV1 编码器](https://gitlab.com/AOMediaCodec/SVT-AV1)
- [Can I use · AVIF](https://caniuse.com/avif)
- [ezgif · What is AVIF? How to Create Animated AVIF Images](https://ezgif.com/help/animated-avif)

---

**最后一句**：本文所有数据和命令都在本机（macOS + homebrew ffmpeg 9.0.1）实测跑过，体积和耗时都是真实输出，不是估算。
