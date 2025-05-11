---
layout: post
title: swiftUI中添加拟合手势MagnificationGesture
date: 2024-07-27 14:29 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---


![](/assets/images/20240727Magnificationgesture/SwiftUI.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# MagnificationGesture 介绍

`MagnificationGesture` 是SwiftUI中用于处理缩放手势的手势识别器。它允许用户通过捏合（即两个手指靠近或远离）的手势来放大或缩小视图中的元素。这种手势在多种应用场景中都非常有用，如图片缩放、地图缩放、用户界面缩放等。

![](/assets/images/20240727Magnificationgesture/MagnificationGesture.gif)

## 主要特点

- **缩放手势识别**：`MagnificationGesture` 能够识别用户的捏合手势，并根据手势的方向（靠近或远离）来放大或缩小视图。
- **实时响应**：在用户进行缩放手势时，`MagnificationGesture` 能够实时地调整视图的大小，提供流畅的交互体验。
- **可定制性**：开发者可以通过设置不同的参数和监听器来定制`MagnificationGesture`的行为，以满足不同的应用需求。

## 使用场景

1. **图片缩放**：在图片查看应用中，用户可以使用`MagnificationGesture`来放大或缩小图片，以便更清晰地查看图片的细节。
2. **地图缩放**：在地图应用中，`MagnificationGesture`允许用户通过捏合手势来放大或缩小地图，以便查看不同层级的地理信息。
3. **用户界面缩放**：在需要自定义界面大小的应用中，`MagnificationGesture`可以用于实现用户界面的缩放功能，提升用户的个性化体验。

## 示例代码

``` swift
import SwiftUI

struct MagnificationGestureDemo: View {
    @GestureState private var scalingRatio: CGFloat = 1.0

    var body: some View {
        Image("exampleImage") // 替换为实际图片名称
            .resizable()
            .frame(width: 200, height: 200)
            .scaleEffect(scalingRatio) // 应用缩放效果
            .gesture(
                MagnificationGesture()
                    .updating($scalingRatio, body: { value, state, _ in
                        state = value // 更新缩放比例
                    })
            )
    }
}

```

在上面的示例中，`MagnificationGesture`被添加到了一个图片视图上，并通过`.updating`修饰符来更新一个名为`scalingRatio`的`@GestureState`变量，该变量记录了当前的缩放比例。当用户进行缩放手势时，`scalingRatio`的值会实时更新，并通过`.scaleEffect`修饰符应用到图片上，从而实现图片的缩放效果。

# 总结

`MagnificationGesture`是SwiftUI中一个非常实用的手势识别器，它允许开发者通过简单的代码实现复杂的缩放手势交互效果。在开发需要缩放功能的应用时，`MagnificationGesture`是一个不可或缺的工具。