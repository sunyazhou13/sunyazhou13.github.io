---
layout: post
title: "UIVisualEffectView 教程：从入门开始"
description: "从像素层面讲清模糊（Gaussian blur）的原理与设计取舍，再用一个童话阅读 App 一步步给界面加上 UIBlurEffect、UIVibrancyEffect 鲜活效果，并处理「减弱透明度」无障碍设置。"
date: 2026-11-17 08:22 +0000
categories: [iOS]
tags: [iOS, UIKit, UIVisualEffectView, UIBlurEffect, UIVibrancyEffect, 模糊, 无障碍]
typora-root-url: ".."
math: false
mermaid: false
---

![iOS 系统中的模糊效果示例](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/blur-examples.avif)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

---

> **原文**：[UIVisualEffectView Tutorial: Getting Started](https://www.kodeco.com/16125723-uivisualeffectview-tutorial-getting-started) — Kodeco，作者 Ron Kliffer（Ryan Nystrom 撰写初版，Ron Kliffer 更新至 Xcode 12 / Swift 5 / iOS 14）。本文为个人学习整理，英文版内容与原文保持一致。

自 iOS 7 起，iOS 的设计发生了翻天覆地的变化，模糊（blur）在 App 设计里就一直扮演着重要角色。用得恰当，模糊能显著提升 App 的易用性和观感。

Apple 在系统层面把模糊用得炉火纯青，两个典型例子是**控制中心（Control Center）**和 iOS 14 新增的**小组件中心（Widget Center）**。它们模糊背景，是为了保留操作的上下文——控制中心和Widget Center 本身并不是独立的 App，而是浮在当前 App 之上的面板。

**通知中心（Notification Center）**同样使用模糊效果，但它不是模糊整个背景，而是每个通知扩展、每条通知各自拥有一块模糊背景。除了好看，这种模糊还能让每个元素恰到好处地凸显出来。

那么怎么在自己的 App 里复刻这类模糊？用内置的 `UIVisualEffectView` 就行！这篇教程会讲清楚用模糊让 App 脱颖而出的一切，包括：

- 模糊的原理
- 模糊的设计策略
- 如何使用 `UIVisualEffectView`

往下读，开始吧。

## 开始动手

点击[下载教程材料（含初始与完整工程）](https://koenig-media.raywenderlich.com/uploads/2020/11/UIVisualEffectsView_Materials.zip)即可获取配套源码，其中 `starter` 是初始工程、`final` 是完成后的工程。

为了学习模糊的用法，你要给一个全新的《格林童话》App 加上模糊效果——它叫 *Grimm*。

这个 App 展示一个童话故事库。用户点开某个童话，App 就呈现完整故事；用户还能自定义显示字体、文本对齐方式，甚至配色主题。

在 Xcode 中打开 *Grimm.xcodeproj*，打开 *Main.storyboard*，看看 App 里的视图控制器，如下图所示：

![示例工程的 Storyboard](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/storyboard.avif)

图里第一个视图控制器可以忽略，它只是 App 的根导航控制器，根视图控制器是 `StoryListViewController`。按编号依次看：

1. 第一个是 `StoryListViewController`，显示数据库中所有童话的列表。
2. 点击列表中的故事会 segue 到 `StoryViewController`，显示所选童话的标题和正文。
3. `OptionsViewController` 嵌在 `StoryViewController` 里，显示可用的字体、文本对齐和颜色选项。点击导航栏右上角的设置图标即可显示。

编译运行，你会看到初始界面：

![Grimm 初始 App](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/starter-app.avif)

尽情探索一下这个 App：选不同的故事、点设置图标、滑动切换字体和阅读模式，摸清界面是怎么运作的。

在继续之前，有必要先弄明白模糊的原理。接下来两节会讲模糊是怎么工作的，以及使用它的设计准则。

## 模糊是怎么工作的

所有模糊都始于一张图片。要实现模糊，就对图片里的每个像素应用一种**模糊算法（blurring algorithm）**，得到的结果就是原图均匀模糊后的版本。模糊算法的风格和复杂度各异，这一节讲一种常见算法——**高斯模糊（Gaussian blur）**。

模糊算法通常会检查图片的每个像素，用周围像素来算出该像素的新颜色值。举个例子，看下面这张理论上的像素网格：

![模糊示例像素网格](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/blur-grid.avif)

网格里每个格子代表一个像素，值在 1 到 10 之间。假设算法正在评估中心像素：它把周围像素的值取平均，再把这个平均值写回中心像素，于是得到新的像素网格：

![取平均后的像素网格](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/blur-grid-averaged.avif)

算法会对原图的每一个像素重复这个过程。

上面的例子只朝每个方向看了**一个**像素来求平均。但扩大**模糊半径（blur radius）**会加大图片的模糊程度，如下图所示：

![同一张图分别施加 3px 与 16px 高斯模糊](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/blur-radius-compare.avif)

> **注**：一般来说，模糊半径越大，处理图片所需的算力就越多。iOS 把大部分图像处理工作交给 GPU，以保持主线程空闲。

现在你多少知道模糊是怎么工作的了，那设计上该怎么用呢？下一节讲几条准则。

## 模糊的设计策略

人类天生会留意清晰的元素、忽略模糊的元素。信不信由你，这是我们眼睛工作方式带来的自然结果。当物体靠近或远离眼睛时，眼睛会对焦，这叫**调节（accommodation）**，它帮助我们感知周围物体的深度和距离。

App 设计师利用这一点，把屏幕上不重要的元素模糊掉，把用户注意力引到剩下的清晰元素上。iOS 原生**照片（Photos）**App 的这张截图就是例子：

![iOS 原生「照片」App 中的模糊用法](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/photos-blur.avif)

上图里背景界面还能认出来，但只是勉强可辨。这为用户提供了**上下文感知（contextual awareness）**——知道自己处在导航层级的什么位置。比如你关掉当前菜单后，理应回到背景里那个被模糊的视图。

遵循这套标准设计思路，用模糊把注意力引到真正重要的东西上，你基本不会出错。更多内容参见 iOS 人机界面指南的 [Materials](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/materials/) 一节。

> **注**：小心别在移动 App 里过度使用模糊。模糊虽能做出很棒的效果，但用得不当或太频繁，反而会分散注意力、招人烦。

好，这些说完了，是时候真正上手加模糊效果了。

## 用 UIVisualEffectView 实现模糊效果

UIKit 提供了一整套视觉效果组件。其中 `UIBlurEffect` 尤其值得关注——它是 `UIVisualEffect` 的子类，正是你在导航栏、通知中心和控制中心里看到的那种漂亮模糊，而且你也能在自己的 App 里用它。

### 添加 UIBlurEffect

在这个项目里，你要用模糊让 `OptionsViewController` 从故事页面之上凸显出来。

打开 *OptionsViewController.swift*，在 `viewDidLoad()` 末尾加上：

```swift
// 1
view.backgroundColor = .clear
// 2
let blurEffect = UIBlurEffect(style: .light)
// 3
let blurView = UIVisualEffectView(effect: blurEffect)
// 4
blurView.translatesAutoresizingMaskIntoConstraints = false
view.insertSubview(blurView, at: 0)
```

上面代码做了什么：

1. `UIVisualEffectView` 要真正模糊背后的内容，它的父视图必须是透明的。所以把 `view` 的背景色改成 `clear`。
2. 创建一个 `.light` 样式的 `UIBlurEffect`，它定义了模糊风格。样式有很多种，去[官方文档](https://developer.apple.com/documentation/uikit/uiblureffect/style)看完整列表。
3. 用刚创建的模糊效果构造一个 `UIVisualEffectView`。这个类是 `UIView` 的子类，唯一职责就是定义并展示复杂的视觉效果。
4. 关掉 `blurView` 的 autoresizing mask 转约束（约束稍后手动加），并把它插到视图栈的**最底层**。如果把 `blurView` 加在最上层，它模糊的就是底下那些控件了！

接下来要确保 `blurView` 和视图的其余部分正确布局。在 `viewDidLoad` 末尾加上：

```swift
NSLayoutConstraint.activate([
  blurView.topAnchor.constraint(equalTo: view.topAnchor),
  blurView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
  blurView.heightAnchor.constraint(equalTo: view.heightAnchor),
  blurView.widthAnchor.constraint(equalTo: view.widthAnchor)
])
```

这些约束让 `blurView` 的 frame 与 `OptionsViewController` 保持一致。

编译运行，选一个童话，点设置按钮，然后滚动文字，你会看到模糊实时更新：

![加上模糊的 Grimm](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/grimm-blur.avif)

切换 *Reading Mode*，注意模糊背景是怎么变化的：

![切换阅读模式后的模糊](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/grimm-reading-mode.avif)

现在你的 App 里已经有了一个动态模糊效果——实现起来简单，看着还很棒。

### 给模糊加上鲜活感（Vibrancy）

模糊效果很棒，但 Apple 照例又往前推了一步：`UIVibrancyEffect`。Vibrancy 配合 `UIVisualEffectView` 使用，会调整内容的颜色，让它显得更鲜活。

下图展示了 vibrancy 如何让标签和图标从屏幕上「跳」出来，同时又与背景融为一体：

![Vibrancy 效果示例](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/vibrancy-example.avif)

图左边是普通的标签和按钮，右边是加上 vibrancy 的标签和按钮。

> **注**：你**必须**把 `UIVibrancyEffect` 添加到一个已经用 `UIBlurEffect` 对象配置好的 `UIVisualEffectView` 的 `contentView` 上。否则根本没有模糊可供施加鲜活效果！

打开 *OptionsViewController.swift*，在 `viewDidLoad()` 末尾加上：

```swift
// 1
let vibrancyEffect = UIVibrancyEffect(blurEffect: blurEffect)
// 2
let vibrancyView = UIVisualEffectView(effect: vibrancyEffect)
vibrancyView.translatesAutoresizingMaskIntoConstraints = false
// 3
vibrancyView.contentView.addSubview(optionsView)
// 4
blurView.contentView.addSubview(vibrancyView)
```

上面的代码：

1. 创建一个 `UIVibrancyEffect`，使用前面设好的 `blurEffect`。`UIVibrancyEffect` 是 `UIVisualEffect` 的另一个子类。
2. 创建一个 `UIVisualEffectView` 来承载 vibrancy 效果。过程和创建模糊完全一样。因为用了 Auto Layout，这里同样要关掉 autoresizing 转换。
3. 把 `optionsView` 加为 vibrancy 视图 `contentView` 的子视图，确保鲜活效果作用到包含所有控件的那个视图上。
4. 把 vibrancy 视图加到模糊视图的 `contentView` 上，效果就完整了。

接下来给 vibrancy 视图设置 Auto Layout 约束，让它和模糊视图同尺寸，再把 options 视图在 vibrancy 视图里居中。在 `viewDidLoad()` 末尾加上：

```swift
NSLayoutConstraint.activate([
  vibrancyView
    .heightAnchor
    .constraint(equalTo: blurView.contentView.heightAnchor),
  vibrancyView
    .widthAnchor
    .constraint(equalTo: blurView.contentView.widthAnchor),
  vibrancyView
    .centerXAnchor
    .constraint(equalTo: blurView.contentView.centerXAnchor),
  vibrancyView
    .centerYAnchor
    .constraint(equalTo: blurView.contentView.centerYAnchor)
])

NSLayoutConstraint.activate([
  optionsView
    .centerXAnchor
    .constraint(equalTo: vibrancyView.contentView.centerXAnchor),
  optionsView
    .centerYAnchor
    .constraint(equalTo: vibrancyView.contentView.centerYAnchor)
])
```

编译运行，进入选项页看看新的鲜活效果：

![加上模糊与 Vibrancy 的 Grimm（浅色）](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/grimm-vibrancy-light.avif)

除非你的视觉对比度很高，否则这个 vibrancy 效果会让标签和控件很难读。怎么回事？

啊——模糊视图背后的内容是浅色的，而你用的是 `.light` 模糊样式，这纯粹是帮倒忙。

把 `viewDidLoad()` 开头初始化 `blurEffect` 那行改掉：

```swift
let blurEffect = UIBlurEffect(style: .dark)
```

从 `light` 改成 `dark`，背景和文字之间的对比度就上来了。

编译运行，现在你看到的是真正的鲜活感：

![加上模糊与 Vibrancy 的 Grimm（深色）](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/grimm-vibrancy-dark.avif)

## 无障碍

不过说到模糊，还有最后一件事要考虑：如果用户关闭了模糊效果呢？

在模拟器或设备上打开**设置** App，进入**辅助功能 ▸ 显示与文字大小**，开启**减弱透明度（Reduce Transparency）**。回到 App，再次打开选项页。

呃，有点太暗了。还是回到最初的样子更好。

好在可以用 `UIAccessibility.isReduceTransparencyEnabled` 检查这个无障碍设置是否开启。如果开了，就能改变 App 的外观和行为。

在 `viewDidLoad()` 里设置视图背景色**之前**加上：

```swift
guard !UIAccessibility.isReduceTransparencyEnabled else {
  return
}
```

这段代码检查「减弱透明度」是否开启。如果开了，就忽略你刚写的所有代码，回到没有任何模糊的原始布局。

编译运行，你会看到选项菜单的背景不再模糊了：

![开启减弱透明度后的 Grimm](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/grimm-reduced-alpha.avif)

![关闭模糊后的 Grimm](/assets/images/20261117UIVisualEffectViewTutorialGettingStarted/grimm-no-blur.avif)

## 接下来去哪？

点击[下载教程材料](https://koenig-media.raywenderlich.com/uploads/2020/11/UIVisualEffectsView_Materials.zip)获取完整工程（zip 中的 `final` 目录）。

你已经看到了如何模糊图片，以及如何用 *UIVisualEffectView* 创建实时模糊效果。你也能同样轻松地把高级模糊效果加进自己的 App！还有更多效果和选项值得深入，继续探索的最佳去处是 [Apple 官方 UIVisualEffectView 文档](https://developer.apple.com/reference/uikit/uivisualeffectview)。

`UIVisualEffectView` 是实时更新的，所以你能用这些效果做出各种奇妙的事。虽然很容易就想「把所有东西都模糊掉」，但请记住前面关于克制使用、只在恰当之处使用的建议。和很多事情一样，在模糊与鲜活感这件事上，少即是多。

如果你对这篇 UIVisualEffectView 教程或视觉效果有疑问或想法，欢迎到[原文页面](https://www.kodeco.com/16125723-uivisualeffectview-tutorial-getting-started)下方的论坛讨论区交流！

---

> **原文链接**：[UIVisualEffectView Tutorial: Getting Started](https://www.kodeco.com/16125723-uivisualeffectview-tutorial-getting-started) — Kodeco，Ron Kliffer（原作者 Ryan Nystrom）。本文为个人学习整理，英文版内容与原文一致。
>
> **配套源码**：[UIVisualEffectsView_Materials.zip](https://koenig-media.raywenderlich.com/uploads/2020/11/UIVisualEffectsView_Materials.zip)（含 `starter` 初始工程与 `final` 完整工程）。
