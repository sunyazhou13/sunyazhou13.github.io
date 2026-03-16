---
layout: post
title: 在 SwiftUI 的 Stack 中避免使用 Spacer
date: 2026-03-16 03:38 +0000
categories: [iOS, SwiftUI]
tags: [skills, iOS, Swift, Objective-C]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

本文翻译自


**作者：** Pavel Zak  
**发布：** 2023年4月6日  
**原文：** https://nerdyak.tech/development/2023/04/06/avoid-swiftui-spacers-in-stacks.html  
**阅读时间：** 约 1 分钟

---


在教授 SwiftUI 的过程中，我发现一个非常常见的模式，它会带来一个微妙的布局 bug。

## 常见写法

```swift
HStack(spacing: 12) {
    Text(self.text)
    Spacer()
    Image(systemName: "tortoise.fill")
}
```

这是个很自然的布局思路——用 `Spacer()` 把左侧文字和右侧图标分开。但当文本内容较长时，文字和图标之间的间距会**比预期的 12pt 大得多**。

![典型视图布局示例](/assets/images/20260316AvoidSpacersInSwiftUIStacks/14_cell.webp)

---

## 问题分析

用颜色替换视图来看清问题：

```swift
HStack(spacing: 12) {
    Color.blue
    Spacer()
    Color.red
}
```

`Spacer` 本身虽然不占宽度，但 Stack 仍然会在它的**两侧各加一个 12pt 间距**，导致实际间距变成 24pt——翻倍了。

![期望布局与实际问题对比](/assets/images/20260316AvoidSpacersInSwiftUIStacks/14_colors.webp)

---

## 解决方案

### 方案一：去掉 spacing，改用 padding

把 HStack 的 `spacing` 参数去掉，手动给子视图加内边距。

### 方案二：用 `.frame(maxWidth: .infinity)` 代替 Spacer（推荐）

```swift
HStack(spacing: 12) {
    Text(self.text)
        .frame(maxWidth: .infinity, alignment: .leading)
    Image(systemName: "tortoise.fill")
}
```

![两种解决方案对比](/assets/images/20260316AvoidSpacersInSwiftUIStacks/14_comparison.webp)

---

## 推荐理由

推荐使用 `.frame(maxWidth: .infinity)` 方案，原因如下：

- **代码更简洁**：不需要多余的 `Spacer()` 视图
- **对齐更灵活**：可以通过 `alignment` 参数设置拉伸视图的内容对齐方式（`.leading`、`.center`、`.trailing` 等）
- **可选视图更安全**：Stack 中存在可选视图时，不会出现意外的间距叠加问题

---

## 总结

> 在 SwiftUI 的有 `spacing` 的 Stack 中，`Spacer()` 会导致两侧各增加一个 spacing 间距，造成间距翻倍。  
> 推荐用 `.frame(maxWidth: .infinity, alignment: .leading)` 代替 `Spacer()`。

