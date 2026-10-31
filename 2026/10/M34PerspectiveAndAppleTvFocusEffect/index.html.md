---
layout: post
title: "m34 透视与 Apple TV 焦点卡片：从一个矩阵参数到一根滑杆"
description: "macOS 剪贴板工具里的卡片悬停倾斜效果。从 m34 与齐次坐标讲起，实测标定 SwiftUI perspective 与 m34 的换算关系（0.6 才等于 tvOS 的 1/500），复原 Apple TV 焦点卡的四件套，并解决 3D 变换篡改命中区导致的 60fps 闪烁。"
date: 2026-10-31 08:30 +0000
categories: [iOS, SwiftUI]
tags: [SwiftUI, macOS, 3D 变换, m34, CATransform3D, tvOS, 交互设计]
typora-root-url: ".."
math: false
mermaid: false
---

![效果演示](/assets/images/20261031M34PerspectiveAndAppleTvFocusEffect/m34.avif)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

---

我在写一个 macOS 剪贴板工具，面板底部是一排历史卡片，横向排开。用了几天之后我嫌它太「平」——鼠标划过去，卡片毫无反应，不像 Apple TV 上那些海报墙，光标停上去整张卡就活了。

于是我打算加个 hover 倾斜。当时的判断是：这不过是两行 `rotation3DEffect` 的事，十分钟能收工。

结果一路踩到这些东西：`m34` 到底加在哪、SwiftUI 的 `perspective` 和它什么关系、为什么某个强度下卡片会「压到框外」、鼠标贴着卡片边缘时画面为什么会按 60fps 疯狂闪烁。

最后那个最要命：它不是参数没调好，是 `rotation3DEffect` **把命中区一起改了**。

这篇把整个过程记下来。所有数字都是本机实测，不是从文档抄的。

---

## 一、m34 是干什么的

`CATransform3D` 是个 4×4 矩阵，字段叫 `m11` 到 `m44`。绝大多数人只用过 `m41/m42/m43`（平移）和左上角那 3×3（旋转缩放），`m34` 常年空着。

它之所以能做出「立体感」，是因为它参与**齐次坐标的第四个分量**。Core Animation 用行向量约定，一个点 `(x, y, z, 1)` 乘完矩阵得到：

```
w' = 1 + z · m34
屏幕坐标 = (x / w', y / w')
```

所以：

- `m34 = 0` 时 `w'` 恒等于 1，除下去等于没除，就是**正交投影**——左右两边只会被旋转横向压窄，不会「近大远小」。
- `m34 ≠ 0` 时，`z` 越大 `w'` 绝对值越大，除下来投影越小。

这里有个反直觉但很关键的点：**符号决定谁往后退**。惯用的写法是 `m34 = -1.0 / 500`（负号），此时 `z` 越大越近，`w' = 1 - z/500` 变小，投影变大，才是正常的「近大远小」。而 tvOS 那份复刻（React Native 的 `RCTTVView.m`）写的是 `m34 = 1.0 / 500`，正号——它必须配合反方向的旋转才能得到同样的观感，这就是为什么网上两种写法的代码看起来「效果一样但数字反着」。

还有一件事我一开始没想明白：**`m34` 只有在存在 `z` 的时候才有意义**。一张 `z = 0` 的平面图，`m34` 设成 1/2 还是 1/5000，画出来一模一样，因为 `w' = 1 + 0 · m34 = 1`。

所以「投影矩阵」和「旋转」是配套的：先旋转，把平面「转出深度」，`m34` 才有活干。Apple 开发者论坛上那句「不能直接 `CATransform3DRotate(identity, …)`，否则画面会 very distorted」，说的其实就是这件事的另一面。

![同一个倾角，只改 m34](/assets/images/20261031M34PerspectiveAndAppleTvFocusEffect/perspective-compare.avif)

上图三张卡片的倾角完全一样（绕 Y 轴 16°），只有 `m34` 不同。最左边是正交投影，看着就像把图片斜着「剪切」了一下；中间 1/2000 开始有收拢感；右边 1/500 已经是 tvOS 的取值，近端明显放大、远端明显后退。

动态看着更直观，`m34` 从 1/5555 连续扫到 1/195：

![m34 从 1/5555 扫到 1/195](/assets/images/20261031M34PerspectiveAndAppleTvFocusEffect/perspective-sweep.avif)

---

## 二、Apple TV 焦点卡的四件套

把 Apple TV 的焦点效果拆开，其实是四样东西叠在一起，单拎任何一件都不像：

1. **3D 倾斜**：卡片朝光标方向轻微翘起，`m34 = 1/500`。
2. **悬浮放大**：大约 1.05，配合倾斜制造「离开桌面」的感觉。
3. **动态阴影**：光源固定在左上，卡片往哪边压，阴影就往反方向甩。
4. **高光/视差**：光标位置决定受光面，图标和文字浮在背景之上做分层视差（复刻代码里前景层会用 `1/-250` 这种更强的投影来拉视差）。

![依次叠加四件套](/assets/images/20261031M34PerspectiveAndAppleTvFocusEffect/four-layers.avif)

动图里四步是依次叠上去的：先只有倾斜 → 加放大 → 加阴影 → 加光照。前两步只是「变形」，第三步开始才有物理感，到第四步整张卡才「活」过来。

值得注意的是 Human Interface Guideline 里那句原话：**"Parallax is designed to be almost unnoticeable."**（视差效果刻意做到几乎察觉不到。）

这句话直接影响了我后面的参数选择——Apple 自己在电视上都不追求「哇好立体」，靠的是阴影和光照的微妙变化，而不是大角度。

---

## 三、SwiftUI 的 perspective 不是 m34

SwiftUI 里没有 `m34`，只有 `rotation3DEffect(_:axis:anchor:perspective:)`。

我第一版的错误就是把它当成了「m34 的倒数」，满强度直接写了 `perspective: 2.0`。上线自己用了一下，感觉卡片边角快飞出去了——用户当时也贴了截图说「都压到外部了」。

于是决定不猜了，直接量。

### 实测方法

`ImageRenderer` 可以离屏渲染任意 SwiftUI 视图，不需要窗口服务器（这点在 headless 环境里特别有用）。构造一个黑底 + 白矩形的最小用例：

```swift
Rectangle()
    .fill(Color.white)
    .frame(width: 272, height: 288)
    .rotation3DEffect(.degrees(10), axis: (x: 0, y: 1, z: 0),
                      anchor: .center, perspective: p)
```

渲染成 PNG 之后，用 Pillow 找白色像素的包围盒。绕 Y 轴旋转时，`z` 只跟 `x` 有关（`z = -x·sinθ`），所以 `w' = 1 - x·sinθ·m34` 只随 `x` 变，结果就是：**上下边缘被投影成两条不水平的线，包围盒高度从 288 涨到 `288 / (1 - u)`**，其中

```
u = (W/2) · sinθ · m34
```

反解一下就得到 m34。为了确认没搞反方向，再用同一组 m34 反算**宽度**（`2·(W/2)·cosθ / (1 - u²)`）与实际测量对比，逐档吻合到 1pt 以内。

### 结果

| perspective | 投影高度(px) | 等效 m34 |
|---|---|---|
| 0（正交） | 288 | — |
| 0.6 | 302 | **1/509** ← tvOS 的 1/500 就在这 |
| 0.8 | 308 | 1/363 |
| 1.0 | 312 | 1/309 |
| 1.2 | 318 | **1/250** |
| 1.5 | 328 | 1/193 |
| 2.0 | 344 | 1/145 |
| 3.0 | 380 | 1/97 |
| 4.0 | 426 | 1/73 |

所以真实的结论是：

- `perspective` **越大透视越强**（方向对了，我第一版把它当倒数用，正好反过来）；
- 它是个无量纲因子，**不是 m34**，也不是 `1/m34`；
- 对这个 272×288 的卡片，**`perspective: 0.6` 才是 tvOS 的 `m34 = 1/500`**，而我当初写的 1.2 是它的两倍。

也就是说：真正和 Apple TV 平起平坐的强度只有 0.6，我把它当成了「很弱」。

### 这个常数还会跟着尺寸变

本来以为换算表是通用的，换几个尺寸一测发现不是：

| 视图尺寸 | perspective=1 时的等效 m34 |
|---|---|
| 100×100 | 1/110 |
| 272×288 | 1/309 |
| 544×576 | 1/595 |

同一份代码、同一个 `perspective`，小卡片得到的投影比大卡片强三倍。我又试了 400×100 和 100×400 想找出规律（分别得 1/470 和 1/356），发现它不是简单地跟宽度或对角线成正比，而是跟宽高都有关系。

**结论：别去推公式，直接在目标尺寸上量。** 这里的卡片尺寸是写死的 272×288，所以上面那张表对本项目永远有效；但如果哪天卡片可以拖拽改大小，这张表就得重测。

---

## 四、方向映射：手指按哪边，哪边陷进去

有了强度还得有方向。归一化那步是全行业统一的写法：

```swift
let dx = (point.x - size.width / 2) / (size.width / 2)   // -1…1
let dy = (point.y - size.height / 2) / (size.height / 2)
```

tvOS 复刻里叫 `xFactor = MIN(1, MAX(-1, ...))`，一模一样。

然后两个轴各做一次旋转：

```swift
.rotation3DEffect(.degrees( tilt.width * maxAngle), axis: (x: 0, y: 1, z: 0),
                  anchor: .center, perspective: p)
.rotation3DEffect(.degrees(-tilt.height * maxAngle), axis: (x: 1, y: 0, z: 0),
                  anchor: .center, perspective: p)
```

注意第二个是**负号**。因为 SwiftUI 的 Y 轴向下，`dy` 为正代表光标在下方，而「下方被按下去」需要的是上缘后缩，也就是绕 X 轴的反向旋转。这个符号错了不会崩，只会让整张卡看起来「跟着鼠标跑」而不是「被鼠标按」。

![四个方向](/assets/images/20261031M34PerspectiveAndAppleTvFocusEffect/tilt-directions.avif)

四张卡片分别对应光标在右、左、下、上，规律是一句话：**永远是指向光标的那条边往里陷，对面那条边翘起来。**

另一个细节：这里是两次独立的 `rotation3DEffect`，数学上**绕 Y 再绕 X 不等于绕 X 再绕 Y**，顺序会影响最终姿态。10° 这个量级肉眼分不出来，但如果哪天想做大角度翻卡，顺序就得重新排。

---

## 五、光照：白色卡片上没法加高光

Apple TV 的高光是镜面反射——光标在左上，左上就有一片亮斑。但我这个卡片是**纯白底**（跟 Paste 一样的观感），白底上叠白色高光等于什么都没干。

所以只能反着来：**不画亮的地方，改成压暗不亮的地方。**

```swift
RadialGradient(
    colors: [.clear, .black.opacity(lightOpacity)],
    center: UnitPoint(x: (tilt.width + 1) / 2, y: (tilt.height + 1) / 2),
    startRadius: 12,
    endRadius: 270
)
```

中心是光标位置、完全透明，往外 270pt 渐变成 26% 的黑色。倾斜的时候，远离光标的那半边自然变暗，受光面和背光面就分出来了——**观感和真正的镜面高光几乎一样，因为人眼判断「哪边朝光」靠的是明暗对比，而不是有没有那块亮斑。**

![光照跟着光标走](/assets/images/20261031M34PerspectiveAndAppleTvFocusEffect/light-follow.avif)

左边有光照层、右边没有，两张卡片的倾角和阴影完全一致。盯几秒钟就能感觉到：右边的卡是「贴纸被掰弯了」，左边那张才是「一块有厚度的板子被按下去」。

这里我返工过一次。第一版把暗角上限写到了 70/255，动图出来整张卡发灰，像蒙了一层脏东西。降到 28/255、同时把渐变半径放大到超过对角线之后才对——**远端只是「轻微退后」，不是「刷了一层灰」**。

---

## 六、那个闪到眼花 bug

功能做完自己用了一晚，发现一个恶心的现象：鼠标停在卡片**正中间**时一切正常，但贴在**边缘**上，整张卡就开始高频闪烁，像接触不良的日光灯。

用户录了屏给我，我抽帧算相邻帧差异，定位到某个时间点单帧差异突然拉满——不是渐变，是「跳变」。

### 根因

`rotation3DEffect` 和 `scaleEffect` **会连带改变 SwiftUI 的命中测试区域**。于是形成了一个自激循环：

```
鼠标进入 → active → 卡片倾斜 → 命中区跟着斜了 → 鼠标落在命中区外
   → ended → 卡片回正 → 命中区又回正 → 鼠标又落在里面 → active → …
```

一圈 16ms，正好 60fps，看起来就是疯狂闪烁。鼠标在中心时不会触发，因为中心点无论怎么斜都还在区域内——**这也是为什么它只在边缘出现**，很容易误判成「随机 bug」。

### 修复

关键是**把视觉变换和命中判定分开**。原来 `body` 是一整块，现在拆成「卡片本体」和「外层命中容器」：

```swift
var body: some View {
    cardBody
        // 3D 变换只作用在本体上
        .modifier(MTCardTiltEffect(tilt: tilt, isHovering: isHovering, strength: strength))
        // 外面再套一层固定尺寸、不跟着变换走的容器
        .frame(width: Self.cardSize.width, height: Self.cardSize.height)
        .contentShape(Rectangle())
        .onContinuousHover(coordinateSpace: .local) { handleHover($0) }
}
```

三个修饰符的顺序一个都不能错：

1. 先 `modifier(...)` —— 变换只作用于卡片；
2. 再 `.frame(固定尺寸)` —— 给外层一个**不随变换变化**的框；
3. 最后 `.contentShape(Rectangle())` —— 把命中区显式钉成这个矩形。

![命中区与视觉边缘的关系](/assets/images/20261031M34PerspectiveAndAppleTvFocusEffect/hit-area.avif)

左边蓝色虚线是命中区，右边是倾斜后的视觉边缘。它们**故意不重合**：命中永远是那个没倾斜的矩形，倾斜只是画出来的样子。

### 再加一层兜底

光钉住命中区还不够。屏幕有缩放、浮点有误差，鼠标正好压在边界上时仍可能抖一下，而「抖一下」就是一次可见的闪。

所以 `ended` 之后**不立刻复位**，延迟 0.12 秒再说，期间只要再收到 `active` 就取消：

```swift
case .ended:
    resetWork?.cancel()
    let work = DispatchWorkItem { isHovering = false; tilt = .zero }
    resetWork = work
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.12, execute: work)
```

0.12 秒这个值试出来的：一帧（16ms）挡不住抖动，再长就会出现「鼠标已经走了、卡片还赖着」的残影。

两层的分工是——`contentShape` 解决**结构性的**抖动（命中区形状变了），延迟解决**数值性的**抖动（边界上的误差）。只做前者能好八成，但没根治。

---

## 七、把它做成可调的

效果调完我自己满意了，但这是给别人用的软件，凭什么我的口味就是对的？

于是加了两样东西：**总开关**（默认关闭）和**强度滑杆**（0…1）。

强度不是直接乘到角度上就完事，四个参数要一起跟着走，否则「弱」的时候只有角度变小、放大和阴影还是满的，看起来会很怪：

```swift
static func parameters(for strength: Double) -> MTCardTiltParameters {
    let s = min(1, max(0, strength))
    return MTCardTiltParameters(
        maxAngle: 10 * s,          // 最大倾角 10°
        perspective: max(0.01, 1.2 * s),
        scale: 1 + 0.04 * s,       // 最多放大 4%
        lightOpacity: 0.26 * s     // 最多压暗 26%
    )
}
```

`perspective` 那个 `max(0.01, ...)` 是个下限保护。`perspective: 0` 在 SwiftUI 里的语义是「完全没有透视」（我实测过，就是正交投影，不会崩），但既然「0 透视」和「关掉这个效果」本来就是一回事，索性夹到一个非零值，省得 0 出现在任何除法里。

强度入参还要做防御，因为这个值存在 UserDefaults 里，用户（或者某个更早的版本）可能塞进来任何东西：

```swift
static func normalizedTiltStrength(_ value: Double) -> Double {
    guard value.isFinite else { return tiltStrengthDefault }   // NaN / inf 回退到默认
    return min(1, max(0, value))
}

/// 总开关关掉时直接归零
static func effectiveTiltStrength(enabled: Bool, strength: Double) -> Double {
    enabled ? normalizedTiltStrength(strength) : 0
}
```

`effectiveTiltStrength` 这个小函数是把「开关」和「强度」两个独立状态收成一个出口，避免 UI 层到处写 `if enabled`。自检里为它专门写了 18 条断言：边界夹紧、单调性、NaN 回退、开关关闭时必须归零。

### 为什么默认关闭

这是个**锦上添花**的效果，不是功能。默认开着会带来三个问题：每帧重绘（虽然只在 hover 时）、对晕动症用户不友好、以及「第一次打开的人会以为这软件在炫技」。

所以默认关闭，滑杆置灰，用户自己去「外观」tab 里打开。打开之后如果嫌夸张，往左拉——**把选择权交出去，比猜一个「最佳值」靠谱**。

顺便说一句，我自己最后停在 60% 左右。注意这个 60% 不是滑杆坐标上的「原版强度」——`perspective = 1.2 × 0.6 = 0.72`，换算回来约 1/420，是 tvOS 的 1.2 倍。**滑杆上的 50% 才对应 perspective 0.6，也就是 tvOS 的 1/500。**

---

## 八、几个不怎么显然的细节

**`zIndex` 不能省。** 卡片倾斜 + 放大之后会溢出自己的格子，如果旁边那张卡片是后画的，就会把溢出部分盖住，看起来像被切了一刀。

```swift
.zIndex(isTilting ? 1 : 0)
```

**`ScrollView` 会裁剪溢出内容。** 这个问题我一开始误判成「被顶部工具栏盖住了」，还去改 header 高度。实际是 `ScrollView` 默认按 bounds 裁剪，卡片往上抬的那十几 pt 被裁掉了。macOS 14+ 有现成的开关：

```swift
.scrollClipDisabled()
```

**两条动画曲线要分开。** 跟随鼠标的角度必须够快，不然手感发黏；但「进入/离开」的浮起要有点回弹：

```swift
.animation(.easeOut(duration: 0.12), value: tilt)                    // 跟手
.animation(.spring(response: 0.3, dampingFraction: 0.75), value: isHovering)  // 浮起/落下
```

如果把跟随也做成 spring，鼠标划快的时候卡片会「追不上」，一路滞后。

**headless 环境测不了 hover。** 这台机器上跑起来的 GUI 进程拿不到 window server 会话，`onContinuousHover` 根本不触发。所以加了个环境变量后门，直接把某张卡片钉在指定倾角上，专门用来截图核对角度、方向和会不会压到邻居：

```bash
MTPASTE_TILT_TEST="2:0.9,-0.5" ./MTPastePro --show
```

（`2:` 是卡片序号，后面是归一化的 x/y。）这个后门只用于调试，但确实救了我好几次——**没法交互验证的时候，就把「交互产生的状态」变成「可以直接注入的状态」**。

---

## 收尾

一条 hover 倾斜，从「两行代码」做到能上线，中间隔着的其实是四件事：

1. **`m34` 只有在有 `z` 的时候才生效**，它和旋转是配套的；
2. **SwiftUI 的 `perspective` 不是 `m34`**，而且换算常数跟视图尺寸有关，必须实测；
3. **3D 变换会改命中区**，视觉和命中必须分开，否则边缘就是 60fps 闪烁；
4. **参数要能调**，尤其当「正确值」本身就是主观的时候。

至于 Apple TV 那套效果，抄参数容易，抄到「为什么是这个参数」才算抄明白——HIG 说视差要「几乎察觉不到」，而我在桌面端最后用的是它两倍的强度，这不是抄错了，是**屏幕距离和使用场景不一样，同一个数字不可能同时合适**。

这也是为什么最后落在一根滑杆上。
