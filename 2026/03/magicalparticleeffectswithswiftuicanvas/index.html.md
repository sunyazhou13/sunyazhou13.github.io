---
layout: post
title: 使用 SwiftUI Canvas 实现魔幻粒子效果
date: 2026-03-16 03:36 +0000
categories: [iOS, SwiftUI]
tags: [skills, iOS, Swift, Objective-C]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

本文翻译自

**作者：** Pavel Zak  
**发布：** 2024年6月27日  
**原文：** https://nerdyak.tech/development/2024/06/27/particle-effects-with-SwiftUI-Canvas.html

---

在我之前的一篇文章中，我分享了一种在 SwiftUI 中创建粒子效果的简单方法——利用 `ViewModifier`，非常简洁。但我不推荐在生产环境中使用，因为每个粒子都是一个独立的视图，粒子数量稍多时性能开销就会很大。

本文介绍一种**更优的替代方案**：使用 `Canvas` 视图来渲染粒子。Let's go 💪

---

## 基础架构

我们从以下视图骨架开始：

```swift
struct ParticleCanvasView: View {
    
    var body: some View {
        TimelineView(.animation) { context in
            Canvas { context, size in
                let particleSymbol = context.resolveSymbol(id: 0)!
                let position = CGPoint(x: size.width/2, y: size.height/2)
                context.draw(particleSymbol, at: position, anchor: .center)
            } symbols: {
                SingleParticleView()
                    .tag(0)
            }
        }
    }
}
```

这里有一个外层的 `TimelineView`，它负责定期触发内部视图的重绘。内容主体是 `Canvas` 视图。

对于有 UIKit 背景的同学，绘图上下文（drawing context）的概念应该不陌生：我们拿到一块具有尺寸信息的画布区域，然后在上面绘制各种元素——形状、图像等。

在我们的例子里，要绘制的粒子由 `SingleParticleView` 表示。注意它被放在 `symbols` 参数里——这意味着 SwiftUI 会**预渲染**它，后续每次绘制调用都极为高效，非常适合大量粒子的场景 ;)

先把 `SingleParticleView` 定义成一个橙色小圆点：

```swift
struct SingleParticleView: View {
    var body: some View {
        Circle().fill(Color.orange)
            .frame(width: 35, height: 35)
    }
}
```

![静态粒子效果](/assets/images/20260316MagicalParticleEffectsWithSwiftUICanvas/16_01.webp)

---

## 让它动起来

现在来让粒子运动。

我想实现一个类似火焰的效果——多个粒子向上飘动。先从最简单的做起：让单个粒子从画布底部周期性地向上移动：

```swift
struct ParticleCanvasView: View {
    let movementDuration = 2.0
    
    var body: some View {
        TimelineView(.animation) { context in
            let timeInterval = context.date.timeIntervalSinceReferenceDate

            let time = timeInterval.truncatingRemainder(dividingBy: movementDuration) / movementDuration
            
            Canvas { context, size in
                let particleSymbol = context.resolveSymbol(id: 0)!
                let position = CGPoint(x: size.width/2, y: (1 - time) * size.height)
                context.draw(particleSymbol, at: position, anchor: .center)
            } symbols: {
                SingleParticleView().tag(0)
            }
        }
    }
}
```

通过 `time` 变量控制向上的运动。`TimelineView` 提供了时间属性，但我们需要一个标准化的值，方便与粒子运动绑定。这里设定每次运动持续 2 秒（`movementDuration`），用截断余数让 `time` 永远周期性地从 0 增长到 1。

[视频：线性运动演示](/assets/images/20260316MagicalParticleEffectsWithSwiftUICanvas/16_video_01.webm)

---

## 还记得三角函数吗？

接下来，把运动从枯燥的直线升级成更有"火焰感"的样子 :)

火焰的感觉是在飘动，所以让粒子沿**余弦波**路径运动，并且随着粒子升高振幅逐渐变小：

```swift
struct ParticleCanvasView: View {
    let movementDuration = 2.0
    
    func particlePosition(timeInterval: Double, canvasSize: CGSize) -> CGPoint {
        let time = timeInterval.truncatingRemainder(dividingBy: movementDuration) / movementDuration
        let rotations: CGFloat = 3
        let amplitude: CGFloat = 0.1 + 0.8 * (1 - time)
        let x = canvasSize.width/2 + cos(rotations * time * CGFloat.pi * 2) * canvasSize.width/2 * amplitude
        return CGPoint(x: x, y: (1 - time) * canvasSize.height)
    }
    
    var body: some View {
        TimelineView(.animation) { context in
            let timeInterval = context.date.timeIntervalSinceReferenceDate
            Canvas { context, size in
                let particleSymbol = context.resolveSymbol(id: 0)!
                let position = particlePosition(timeInterval: timeInterval, canvasSize: size)
                context.draw(particleSymbol, at: position, anchor: .center)
            } symbols: {
                SingleParticleView().tag(0)
            }
        }
    }
}
```

位置计算被提取到独立函数里，保持 Canvas 闭包的整洁。

[视频：余弦波运动演示](/assets/images/20260316MagicalParticleEffectsWithSwiftUICanvas/16_video_02.webm)

---

## 生成大量粒子

运动效果令人满意了。现在把绘制包进 for 循环，一次画出更多粒子：

```swift
let particleCount = 100
// …
for i in 0..<particleCount {
    let position = particlePosition(
        timeInterval: timeInterval + (Double(i) / Double(particleCount)),
        canvasSize: size
    )
    context.draw(particleSymbol, at: position, anchor: .center)
}
```

[视频：多粒子演示](/assets/images/20260316MagicalParticleEffectsWithSwiftUICanvas/16_video_03.webm)

---

## 随机化

粒子多了，但都走同一条路径，看起来太整齐。用随机的**初始旋转角**和**时间偏移**让每个粒子各走各的路：

```swift
struct ParticleCanvasView: View {
    let movementDuration: Double
    let particleCount: Int
    let startingParticleOffsets: [CGFloat]
    let startingParticleAlphas: [CGFloat]
    
    init(particleCount: Int = 200, movementDuration: Double = 3.0) {
        self.particleCount = particleCount
        self.movementDuration = movementDuration
        self.startingParticleOffsets = (0..<particleCount).map { _ in CGFloat.random(in: 0...1) }
        self.startingParticleAlphas  = (0..<particleCount).map { _ in CGFloat.random(in: 0...CGFloat.pi*2) }
    }
    
    func particlePosition(index: Int, timeInterval: Double, canvasSize: CGSize) -> CGPoint {
        let startingRotation  = startingParticleAlphas[index]
        let startingTimeOffset = startingParticleOffsets[index] * movementDuration
        
        let time = (timeInterval + startingTimeOffset)
            .truncatingRemainder(dividingBy: movementDuration) / movementDuration
        let rotations: CGFloat = 3
        let amplitude: CGFloat = 0.1 + 0.8 * (1 - time)
        
        let x = canvasSize.width/2 + cos(rotations * time * CGFloat.pi * 2 + startingRotation)
                 * canvasSize.width/2 * amplitude
        return CGPoint(x: x, y: (1 - time) * canvasSize.height)
    }
    // … body 部分不变
}
```

[视频：随机化粒子演示](/assets/images/20260316MagicalParticleEffectsWithSwiftUICanvas/16_video_04.webm)

---

## 优化视觉效果

运动逻辑完成了，还需要打磨外观，让效果更"出汁"。

**第一步：** 随着运动改变粒子透明度——在 draw 调用前修改上下文的 opacity：

```swift
context.opacity = positionAndAlpha.1
```

**第二步：** 利用混合模式重新设计粒子外观：

```swift
struct SingleParticleView: View {
    var body: some View {
        Circle().fill(Color.orange.opacity(0.4))
            .frame(width: 35, height: 35)
            .blendMode(.plusLighter)
            .blur(radius: 10)
    }
}
```

粒子被做成大的模糊圆点，重叠时通过 `.plusLighter` 混合增亮交叠区域，从而形成火焰的体积感。

还有一个困扰我的问题：粒子在顶部更密集，我希望反过来。调整 y 坐标公式解决：

```swift
let y = (1 - time * time) * canvasSize.height
```

[视频：透明度效果](/assets/images/20260316MagicalParticleEffectsWithSwiftUICanvas/16_video_05.webm)

[视频：blendMode 效果](/assets/images/20260316MagicalParticleEffectsWithSwiftUICanvas/16_video_06.webm)

---

## 最终完整代码

```swift
struct ParticleCanvasView: View {
    let movementDuration: Double
    let particleCount: Int
    let startingParticleOffsets: [CGFloat]
    let startingParticleAlphas: [CGFloat]
    
    init(particleCount: Int = 200, movementDuration: Double = 3.0) {
        self.particleCount = particleCount
        self.movementDuration = movementDuration
        self.startingParticleOffsets = (0..<particleCount).map { _ in CGFloat.random(in: 0...1) }
        self.startingParticleAlphas  = (0..<particleCount).map { _ in CGFloat.random(in: 0...CGFloat.pi*2) }
    }
    
    func particlePositionAndAlpha(index: Int, timeInterval: Double, canvasSize: CGSize) -> (CGPoint, CGFloat) {
        let startingRotation   = startingParticleAlphas[index]
        let startingTimeOffset = startingParticleOffsets[index] * movementDuration
        
        let time = (timeInterval + startingTimeOffset)
            .truncatingRemainder(dividingBy: movementDuration) / movementDuration
        let rotations: CGFloat = 1.5
        let amplitude: CGFloat = 0.1 + 0.8 * (1 - time)
        
        let x = canvasSize.width/2 + cos(rotations * time * CGFloat.pi * 2 + startingRotation)
                 * canvasSize.width/2 * amplitude * 0.8
        let y = (1 - time * time) * canvasSize.height
        
        return (CGPoint(x: x, y: y), 1 - time)
    }
    
    var body: some View {
        TimelineView(.animation) { context in
            let timeInterval = context.date.timeIntervalSinceReferenceDate
            Canvas { context, size in
                let particleSymbol = context.resolveSymbol(id: 0)!
                for i in 0..<particleCount {
                    let positionAndAlpha = particlePositionAndAlpha(
                        index: i, timeInterval: timeInterval, canvasSize: size
                    )
                    context.opacity = positionAndAlpha.1
                    context.draw(particleSymbol, at: positionAndAlpha.0, anchor: .center)
                }
            } symbols: {
                SingleParticleView().tag(0)
            }
        }
    }
}
```

[视频：最终效果](/assets/images/20260316MagicalParticleEffectsWithSwiftUICanvas/16_video_07.webm)

---

## 现在轮到你了！

可以继续探索的方向：
- 改变粒子外观（形状、颜色、尺寸）
- 修改粒子运动路径
- 组合多种粒子类型
- 响应用户输入
- 💫 更多可能……
