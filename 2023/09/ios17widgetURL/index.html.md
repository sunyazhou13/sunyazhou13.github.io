---
layout: post
title: 解决iOS小组件开发中widgetURL问题
date: 2023-09-12 09:54 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS,iPadOS,watchOS, SwiftUI]
typora-root-url: ..
---

![](/assets/images/20230912iOS17WidgetURL/banner.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

## 背景描述

最近再开发iOS17的小组件遇到一个非常奇怪且很脑残的问题

在小组件开发过程中有如下代码使用深度链接(deeping URL )调用open URL 打开host app.

当我第一次使用下面代码的时候 总是最后一个生效

``` swift
HStack(alignment: .bottom) {
    Image(itemInfo!.didCollected ? "kw_widget_absorption_color_like" : "kw_widget_absorption_color_unlike")
        .resizable()
        .aspectRatio(contentMode: .fit)
        .frame(minWidth: itemSize.width, maxWidth: .infinity, minHeight:itemSize.height, maxHeight:.infinity)
        .widgetURL(URL(string: "sunyazhou://collectOrNot"))
        .border(.red)
    Image(itemInfo!.isPlay ? "kw_widget_absorption_color_play" : "kw_widget_absorption_color_pause")
        .resizable()
        .aspectRatio(contentMode: .fit)
        .frame(minWidth: itemSize.width, maxWidth: .infinity, minHeight:itemSize.height, maxHeight:.infinity)
        .widgetURL(URL(string: "sunyazhou://playOrPause"))
        .border(.cyan)
    Image("kw_widget_absorption_color_next")
        .resizable()
        .aspectRatio(contentMode: .fit)
        .frame(minWidth: itemSize.width, maxWidth: .infinity, minHeight:itemSize.height, maxHeight:.infinity)
        .widgetURL(URL(string: "sunyazhou://playNext"))
        .border(.blue)
}
```

![](/assets/images/20230912iOS17WidgetURL/widget1.webp)

也就是这三个按钮我点击哪个都是最后一个Image生效,我认真翻阅了一下文档,只能说太坑了

``` swift
@available(iOS 14.0, macOS 11.0, watchOS 9.0, *)
@available(tvOS, unavailable)
extension View {

    /// Sets the URL to open in the containing app when the user clicks the widget.
    /// - Parameter url: The URL to open in the containing app.
    /// - Returns: A view that opens the specified URL when the user clicks
    ///   the widget.
    ///
这行    /// Widgets support one `widgetURL` modifier in their view hierarchy.
这行    /// If multiple views have `widgetURL` modifiers, the behavior is
这行    /// undefined.
    public func widgetURL(_ url: URL?) -> some View

}
```

它明确标识如果并排添加多个widgetURL的话,这种行为是未定义不确定的,作为一个负责任的iOS开发者我必须对这种注释提出批评, 如果你要是告诉我不确定那就在编辑代码的时候告诉开发者这玩意最多只能添加一个View上,如果添加多个的话要用 其它方法 然后给个相关链接

#### 解决办法

使用如下代码

``` swift
Link(destination: URL(string: "wig://\(item.id)")!) {
	 ZStack {
	    // some views
	 }
}
```

于是我就改成了如下 ：

``` swift
HStack(alignment: .bottom) {
    Link(destination: URL(string: "sunyazhou://collectOrNot")!) {
        Image(itemInfo!.didCollected ? "kw_widget_absorption_color_like" : "kw_widget_absorption_color_unlike")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(minWidth: itemSize.width, maxWidth: .infinity, minHeight:itemSize.height, maxHeight:.infinity)
            .border(.red)
    }
    Link(destination: URL(string: "sunyazhou://playOrPause")!) {
        Image(itemInfo!.isPlay ? "kw_widget_absorption_color_play" : "kw_widget_absorption_color_pause")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(minWidth: itemSize.width, maxWidth: .infinity, minHeight:itemSize.height, maxHeight:.infinity)
            .border(.cyan)
    }
    Link(destination: URL(string: "sunyazhou://playNext")!) {
        Image("kw_widget_absorption_color_next")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(minWidth: itemSize.width, maxWidth: .infinity, minHeight:itemSize.height, maxHeight:.infinity)
            .border(.blue)
    }
}
```

> 注意: `Link` 仅支持widget的`Families`中的`systemMedium`和`systemLarge`,不支持`systemSmall`


# 总结

小组件开发中很多在常规swiftUI中符合自己预期的功能在小组件中就很不符合预期,请大家开发小组件的话记得多看看文档.

[小组件开发相关文章](https://mp.weixin.qq.com/s/684dX2rFCUq1Tum6D0oJeA) 