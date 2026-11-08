---
layout: post
title: Solving the widgetURL Issue in iOS Widget Development
date: 2023-09-12 09:54 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS,iPadOS,watchOS, SwiftUI]
typora-root-url: ..
math: false
mermaid: false

---

![banner](/assets/images/20230912iOS17WidgetURL/banner.avif)

# Preface

This article carries a strong personal tone. If you find it uncomfortable to read, please close it immediately. This article is intended only as a personal study record. You are welcome to repost or share it within the scope of the license—please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

## Background

While developing iOS17 widgets recently, I encountered a very strange and rather frustrating issue.

During widget development, I had the following code using deep links (deeping URL) to call open URL and launch the host app.

When I first used the following code, only the last one would take effect.

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

![widget](/assets/images/20230912iOS17WidgetURL/widget1.avif)

That is, no matter which of the three buttons I clicked, only the last Image would work. I carefully read through the documentation and can only say it's quite a trap.

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

It explicitly states that if multiple widgetURLs are added side by side, the behavior is undefined and uncertain. As a responsible iOS developer, I must criticize this kind of comment. If you're telling me it's uncertain, then warn developers at code-editing time that this modifier can only be applied to one View. If multiple are needed, suggest alternative approaches and provide a relevant link.

#### Solution

Use the following code:

``` swift
Link(destination: URL(string: "wig://\(item.id)")!) {
	 ZStack {
	    // some views
	 }
}
```

So I changed it to the following:

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

> Note: `Link` only supports the `systemMedium` and `systemLarge` widget families, not `systemSmall`.


# Summary

In widget development, many features that work as expected in regular SwiftUI behave quite differently in widgets. If you're developing widgets, remember to read the documentation carefully.

[Related articles on widget development](https://mp.weixin.qq.com/s/684dX2rFCUq1Tum6D0oJeA)
