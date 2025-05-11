---
layout: post
title:  开发iOS17小组件
date: 2023-08-04 14:56 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS,iPadOS,watchOS, SwiftUI]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


# iOS17关于小组件的WWDC

[WWDC23](https://developer.apple.com/wwdc23/)中提供了一些关于小组件的视频,最近开发小组件遇到了一些问题,在这里解读一下视频中的内容

## Bring widgets to new places

[Bring widgets to new places](https://developer.apple.com/videos/play/wwdc2023/10027/?time=180)

The widget ecosystem is expanding: Discover how you can use the latest WidgetKit APIs to make your widget look great everywhere. We'll show you how to identify your widget's background, adjust layout dynamically, and prepare colors for vibrant rendering so that your widget can sit seamlessly in any environment.

小部件生态系统正在扩展:了解如何使用最新的WidgetKit api使您的小部件在任何地方看起来都很棒。我们将向您展示如何识别小部件的背景，动态调整布局，并为充满活力的渲染准备颜色，以便您的小部件可以在任何环境中无缝地运行。



###  Transition to content margins

[ Transition to content margins](https://developer.apple.com/videos/play/wwdc2023/10027/?time=104)

从 ios14 引入桌面小组件，后又在 ios16 增加锁屏小组件，现在，它可以扩展到：mac 桌面、pad 锁屏、iphone StandBy 以及 iwatch 的 new Smart Stack。所以确保一次编码后在各个位置都能表现出色是件很重要的事。我的理解就是iOS, iPadOS, WatchOS, macOS 全苹果平台通用适配.也就是说编码一次小组件可以运行到所有苹果的系统上.

以 watchOS 的 safe area 为例:

* watchOS9 and below: 使用了system-defined 的 safe area 以避免小组件太贴边。但开发者可以通过`Color.blue.ignoresSafeArea()` 来忽略它
* watchOS10 and above: 方法`ignoresSafeArea()`不在起作用，而应该对 `widget configuration` 应用 `contentMarginsDisabled`修改器来实现这一目的

![](/assets/images/20230804iOS17Widget/widget1.gif)

![](/assets/images/20230804iOS17Widget/widget2.webp)
![](/assets/images/20230804iOS17Widget/widget3.webp)

### Add a removable background

现有的 accessory family 小组件可以自动适配到 ipad 的锁屏上。ipad can also show system small widgets right alongside them。 但会有一个半透明的背景，如果想去掉它，可以使用：

``` swift
ZStack {
    // TODO
}.containerBackground(for: .widget) {
    Color.gameBackground
}
```

这样系统就可以根据显示的位置来自动决定是否要显示背景。对于，watchOS 上的组件也一样，系统会默认给予一个半透明背景，也可以通过这种方式交给系统来进行处理背景，以展示丰富多彩的样式。

如果确实不想系统对某些组件(如：ios上的桌面照片组件)使用可移除的背景，可以在小组件的 widget configuration 上应用 `containerBackgroundRemovable(false)` 修改器。

### Dynamically adjust layout

当使用 StandBy mode 时，小组件会被放大，并且会移除背景。可以通过使用以下代码来检查背景是否被移除来进行适配：

``` swift
@Environment(\.showsWidgetContainerBackground) var showsWidgetBackground
```

### Prepare for vibrant rendering

在 ipad lock screen 上的小组件，系统可能会根据需要调整饱和度(desaturate)，也就是说小组件可能需要根据实际情况进行不同的色彩、背景等样式微调，此时可以通过以下代码来检查渲染是否为 .vibrant 来进行适配：

``` swift
@Environment(\.widgetRenderingMode) var widgetRender 
```

## Adding interactivity to widgets and Live Activities

[Adding interactivity to widgets and Live Activities
](https://developer.apple.com/documentation/WidgetKit/Adding-interactivity-to-widgets-and-Live-Activities)

### AppIntent 

这可能是此次WWDC中小组件开发最感兴趣的内容之一了，它简化了交互式小组件的现有实现方式，同时也对现有的交互效果有了明显的改善。

从 iOS 17, iPadOS 17, 以及 macOS 14 开始，widgets 和 Live Activities 可以使用 buttons 和 toggles 在不启动主 app 的情况下提供一些特殊功能。  
> 注意：仅仅 Button 和 Toggle 组件支持，需要引入import AppIntents模块  

以下类型的小组件在新版本 sdk 中包含此特性的 Button 和 Toggle：

``` swift
WidgetFamily.systemSmall
WidgetFamily.systemMedium
WidgetFamily.systemLarge
WidgetFamily.systemExtraLarge
WidgetFamily.accessoryCircular on iPhone and iPad
WidgetFamily.accessoryRectangular on iPhone and iPad
```

在具体开发过程中需要实现自己的 AppIntent 对象：

``` swift
struct MyIntent : AppIntent {
    static var title: LocalizedStringResource = "title"

    func perform() async throws -> some IntentResult {
        await MyActionWhichMaybeAsync()
        return .result()
    }
}
```

这里需要说明的是：  

* 当 perform() 返回后，系统会立即触发 timeline 更新
* 所以 perform 中如果是异步操作时，需要 await 异步操作结束
* 需要在 perform 中更新小组件数据并持久化

AppIntent 工作的本质就是由系统触发 timeline 来实现小组件视图(不可变对象)更新。具体的使用方式可以参考[官方代码示例](https://developer.apple.com/documentation/WidgetKit/Adding-interactivity-to-widgets-and-Live-Activities)。

### Preview

这里有个有趣的地方就是更新了 preview 的方式：相比原来的：

``` swift
struct MyWidgetView_Previews: PreviewProvider {
   static var previews: some View {
       MyWidgetView().previewContext(WidgetPreviewContext(family: .systemLarge))
   }
}
```

增加了 timeline 的支持，可以方便的观察动画效果等：

``` swift
#Preview(as: WidgetFamily.systemLarge) {
    // TODO：view
} timeline: {
    // TODO：timeline list
}
```

### Animating data updates in widgets and Live Activities

[Animating data updates in widgets and Live Activities](https://developer.apple.com/documentation/WidgetKit/Animating-data-updates-in-widgets-and-live-activities)

把 Live Activity 中的效果扩展到了 Widget 上，Live Activity 中的 timer 类型 Text 自带翻页特效，如果不想使用的话可以使用以下方式去掉：

``` swift
Text(Date.now, style: .timer).contentTransition(.identity)
```

# 总结

iOS小组件有一些细微改动的,经过WWDC分析 我们还是需要认真学习的.

