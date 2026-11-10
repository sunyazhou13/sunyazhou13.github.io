---
layout: post
title: "让浮动窗口拖不出屏幕：macOS 与 iOS 的边界夹取"
description: "从被拖到屏幕外的悬浮工具条说起：用 visibleFrame 做每帧四边夹取，用绝对增量替代逐帧累加，再把这套办法搬到 iOS 的父视图 bounds 与安全区。两版示意图 + 可直接抄的代码。"
date: 2026-11-10 04:50 +0000
categories: [iOS]
tags: [macOS, AppKit, SwiftUI, UIKit, 拖拽交互, 窗口管理]
typora-root-url: ".."
math: false
mermaid: false
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

---

![动图演示](/assets/images/20261110KeepFloatingViewInsideScreen/dragdemo.avif)

前阵子写了个 macOS 的悬浮工具条：无边框 `NSPanel`，贴着屏幕底部一排画笔按钮，随时能拖到顺手的位置。真机跑了一圈，收到第一条缺陷：

> 拖拽容易拖出屏幕。

我第一反应是「松手时检测一下不就行了」——超界就挪回来。但实际体验是：**拖动过程中它就已经不见了**，用户看到的是「东西被我推丢了，然后又被谁拽回半截」，比不给拖还糟。

真正要做的是**每帧都把位置夹在边界内**，而且位移的算法得换。核心其实只有一行：

```swift
min(max(value, lower), upper)
```

下面 macOS 和 iOS 两版都走一遍。iOS 上没有窗口可拖，但「把子视图关在父视图里」是完全同一道题，只是边界的来源变了。

## 一、先分清：边界到底是谁的边界

夹取之前得回答一个问题：允许活动的范围是哪块矩形？三个平台各有各的答案。

| 平台 | 常见错误选择 | 正确选择 |
| --- | --- | --- |
| macOS | `NSScreen.frame` | `NSScreen.visibleFrame` |
| UIKit | `UIScreen.main.bounds` | `superview.bounds`（再让 `safeAreaInsets`） |
| SwiftUI | 写死一个尺寸 | 父容器尺寸 + 安全区 |

- `screen.frame` 是整块物理屏，**包含**菜单栏和 Dock 占的位置。按它夹，窗口能钻进 Dock 底下、能被菜单栏压住半截。
- `visibleFrame` 是系统算好的「用户真正能用」的区域：上边扣掉菜单栏，下边扣掉 Dock，左右扣掉侧边 Dock。它是**动态**的——Dock 换边、换显示器、改分辨率，它跟着变。自己去量 `NSStatusBar.thickness` 或硬编码 44pt，一定会在某块屏上差几个像素。
- iOS 的 `bounds` 是父视图给的空间；`safeAreaInsets` 是系统占用（状态栏、刘海、Home Indicator）。默认应该让出安全区，除非你确实想画到刘海底下。

![macOS：visibleFrame 与四条夹取边界](/assets/images/20261110KeepFloatingViewInsideScreen/macos-bounds.avif)

## 二、macOS：给 NSPanel 做每帧夹取

### 2.1 记住「按下那一刻」

拖拽位移必须相对某个**固定锚点**来算。锚点就是按下时的鼠标位置 + 窗口原点：

```swift
/// 按下那一刻的「鼠标屏幕坐标 + 窗口原点」
private var dragStart: (mouse: NSPoint, origin: NSPoint)?

func dragToCurrentMouse() {
    guard let panel else { return }
    let now = NSEvent.mouseLocation

    guard let start = dragStart else {          // 第一次回调只记锚点
        dragStart = (now, panel.frame.origin)
        return
    }

    var origin = NSPoint(x: start.origin.x + (now.x - start.mouse.x),
                         y: start.origin.y + (now.y - start.mouse.y))
    origin = clamp(origin, size: panel.frame.size)   // ← 每帧都夹，不是松手才夹
    panel.setFrameOrigin(origin)
}
```

### 2.2 夹取本体

```swift
/// 把窗口原点夹进指定屏幕的 visibleFrame
private func clamp(_ origin: NSPoint, size: NSSize) -> NSPoint {
    let vf = selectedScreen().visibleFrame          // 多屏时锁定用户选的那块
    let maxX = max(vf.minX, vf.maxX - size.width)
    let maxY = max(vf.minY, vf.maxY - size.height)
    return NSPoint(x: min(max(origin.x, vf.minX), maxX),
                   y: min(max(origin.y, vf.minY), maxY))
}
```

四个方向：

| 方向 | 条件 | 说明 |
| --- | --- | --- |
| 左 | `origin.x >= vf.minX` | 左边不能越过屏左沿 |
| 右 | `origin.x <= vf.maxX - w` | 上界要**减宽度**，让右边贴住屏右沿 |
| 上 | `origin.y <= vf.maxY - h` | 顶边不能顶进菜单栏 |
| 下 | `origin.y >= vf.minY` | `vf.minY` 就是 Dock 上沿 |

`max(vf.maxX - size.width, vf.minX)` 这一层不是多余的：**万一窗口比屏幕还宽**，`vf.maxX - w` 会小于 `vf.minX`，区间反转，`min(max())` 会在两个值之间来回跳。加个 `max` 让区间退化成「贴左边」，至少不抽搐。

### 2.3 为什么不能「逐帧累加」

这是最容易写错的一行。直觉写法是：

```swift
origin.x += now.x - lastMouse.x
```

看着等价，其实有两个坑：

1. **贴边时会攒误差。** 被夹住的那几帧里，鼠标还在动、窗口不动，差值就攒在手里；等你往回拖，窗口要先「空走」一段才开始跟手。
2. 需要额外维护 `lastMouse` 并处理丢帧，状态更多。

绝对增量（`start + (now - start)`）每次都从按下点重算，夹住不产生任何残留。示意图左边就是「空走」的样子：

![逐帧累加与绝对增量的区别](/assets/images/20261110KeepFloatingViewInsideScreen/drag-delta.avif)

### 2.4 松手之后还要再夹一次

拖动过程中被夹的是「背景拖拽面」这条路径。如果用户抓的是左侧那个原生拖拽把手，走的是 AppKit 的 `performDrag(with:)`——那是一个自己的模态事件循环，我们插不进手。所以松手后要补一次：

```swift
func endDrag() {
    dragStart = nil
    snapToNearestEdge()     // 内部先 clamp，再判 36pt 内是否吸边
}
```

`snapToNearestEdge()` 里先 `clamp` 再吸边，于是「用把手拖到屏幕外」也会被收回来。

### 2.5 所有定位入口统一走同一个 clamp

只给拖动加夹取是不够的。窗口位置还有别的来源：启动时恢复上次位置、设置里切换显示器、展开/收起导致高度变化。这些路径各写一份判断，迟早不一致。所以只留一个出口：拖动、恢复、切屏、展开收起，全部调同一个 `clamp`。

### 2.6 顺带的坑：borderless 窗口根本拖不动

如果你也在做无边框面板，注意 `isMovableByWindowBackground` 在 **borderless** 窗口上是空操作（没有 theme frame 接管拖拽）。要拖只能自己实现：`performDrag(with:)`，或者手势 + `setFrameOrigin`。

而且自绘的 `NSView` 必须实现：

```swift
override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
```

否则面板永远不是 key window，每次按下都被当成「首次点击」拿去激活窗口，`mouseDown` 根本不触发。表现很迷惑：**按钮都能点，就是拖拽没反应**。

## 三、iOS：同一道题，换个边界来源

iOS 上拖的不是窗口是视图，边界不是屏幕是父视图。公式一个字都不用改。

![iOS：父视图 bounds 与安全区](/assets/images/20261110KeepFloatingViewInsideScreen/ios-bounds.avif)

### 3.1 UIKit 版

```swift
private var startCenter: CGPoint?

@objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
    guard let superview else { return }

    switch gesture.state {
    case .began:
        startCenter = center

    case .changed:
        guard let start = startCenter else { return }
        // 关键：以父视图为参照系，不能用 self
        let t = gesture.translation(in: superview)
        let target = CGPoint(x: start.x + t.x, y: start.y + t.y)
        center = clamp(target, size: bounds.size,
                       in: superview.bounds, safeArea: superview.safeAreaInsets)

    default:
        break
    }
}

/// center 版夹取：边界各让半个自身尺寸
private func clamp(_ center: CGPoint, size: CGSize,
                   in bounds: CGRect, safeArea: UIEdgeInsets) -> CGPoint {
    let minX = bounds.minX + safeArea.left + size.width / 2
    let maxX = bounds.maxX - safeArea.right - size.width / 2
    let minY = bounds.minY + safeArea.top + size.height / 2
    let maxY = bounds.maxY - safeArea.bottom - size.height / 2

    return CGPoint(
        x: min(max(center.x, min(minX, maxX)), max(minX, maxX)),
        y: min(max(center.y, min(minY, maxY)), max(minY, maxY)))
}
```

两个细节：

1. **`translation(in: superview)` 而不是 `translation(in: self)`。** 手势的 translation 是在指定坐标系里量的；传 `self`，而这个 view 正在被拖动、参考系自己也在动，于是越拖越飘。父视图不动，用它做参照就稳。
2. 这里用 `center` 而不是 `origin`，所以边界要**各让半个尺寸**；换算成 origin 就是 `bounds.width - size.width`，两者等价。

### 3.2 SwiftUI 版

SwiftUI 的 `DragGesture` 有同一个陷阱：`translation` 默认基于当前视图的坐标系。解法是把手势绑到一个**不动的命名坐标空间**：

```swift
@State private var offset: CGSize = .zero
@State private var startOffset: CGSize = .zero
@State private var limit: CGSize = .zero      // 允许偏移的最大绝对值

private let cardSize = CGSize(width: 120, height: 80)

var body: some View {
    GeometryReader { proxy in
        RoundedRectangle(cornerRadius: 12)
            .fill(.blue.opacity(0.2))
            .frame(width: cardSize.width, height: cardSize.height)
            .offset(offset)
            .gesture(
                DragGesture(minimumDistance: 1, coordinateSpace: .named("board"))
                    .onChanged { value in
                        let target = CGSize(
                            width: startOffset.width + value.translation.width,
                            height: startOffset.height + value.translation.height)
                        offset = clamp(target, limit: limit)
                    }
                    .onEnded { _ in startOffset = offset }
            )
            .onChange(of: proxy.size) { _, _ in
                limit = self.limit(for: proxy.size)
                offset = clamp(offset, limit: limit)     // 转屏 / 分屏后重夹
            }
    }
    .coordinateSpace(name: "board")     // ← 必须挂在父容器上
}

private func limit(for container: CGSize) -> CGSize {
    CGSize(width: max(0, container.width - cardSize.width),
           height: max(0, container.height - cardSize.height))
}

private func clamp(_ value: CGSize, limit: CGSize) -> CGSize {
    CGSize(width: min(max(value.width, -limit.width), limit.width),
           height: min(max(value.height, -limit.height), limit.height))
}
```

这里 `offset` 的原点是容器的左上角（`GeometryReader` 的内容默认贴 top-leading），所以 `limit` 直接是「容器减卡片」，不用除以 2。如果容器有安全区，把 `proxy.size` 换成扣掉 `proxy.safeAreaInsets` 的可用区域即可。

## 四、两个平台共通的四条规矩

1. **绝对增量，永不累加。** `start + (now - start)` 天然抗夹取、抗丢帧。
2. **夹取写成 `min(max(v, lo), hi)`，并且容忍区间反转。** 视图比容器大时，`max(lo, hi)` 兜底比「祈祷不会发生」便宜。
3. **边界交给系统算。** macOS 用 `visibleFrame`，iOS 用 `bounds` + `safeAreaInsets`。手写的 44 / 34 / 20 总会在某个机型上错。
4. **尺寸一变就重夹。** iOS 转屏、分屏、键盘弹出；macOS 换屏、改分辨率、展开收起——都回到同一个 `clamp`。

## 五、iOS 上容易漏的两种情况

- **旋转 / 分屏**：`bounds` 变了。`viewDidLayoutSubviews` 或 `onChange(of: proxy.size)` 里把当前位置重新夹一遍。原来是合法的位置，转完屏可能就在屏幕外。
- **键盘**：键盘不改 `bounds`，但会挡住下半屏。UIKit 用 `keyboardLayoutGuide` 或监听 `keyboardWillChangeFrameNotification`；SwiftUI 用 `.safeAreaInset(edge: .bottom)`。把「可见区」再缩一次，然后照样走同一个 `clamp`。

## 六、小结

这个需求看起来是「加个判断」，实际是两个决定：

- **在哪一层夹**：每帧夹（拖动中），而不是松手后夹。用户根本看不见「越界」这件事，才算真的挡住了。
- **边界从哪来**：向系统要，不自己量。

代码上真正核心的只有 `dragStart` 那个锚点，和 `clamp` 那三行。剩下的工作是把这两个东西接到所有会移动位置的入口上。

悬浮球、画中画、可拖动的浮动面板，基本都是同一套。把这两段抄过去就够了。
