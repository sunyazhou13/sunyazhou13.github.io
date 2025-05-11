---
layout: post
title: SwiftUI可用性检测,解决小组件iOS17 available问题
date: 2023-08-02 17:13 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS,iPadOS,watchOS, SwiftUI]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 问题

![](/assets/images/20230802swiftuiextention1/WidgetiOS17.webp)

最近在开发iOS17上的小组件使用SwiftUI框架,第一次进行工程化遇到一个 api可用性检测问题

之前的小组件是锁屏小组件,在iOS16上运行,最近iOS17更新了新内容,导致运行起来之后被提示需要增加

``` swift
containerBackground(.red.gradient, for: .widget)
```

这样的适配容器,这就导致 在iOS16上的api `some View`要使用iOS17的API

``` swift
ZStack(alignment: .bottomTrailing) {
        Image("widget_clock")
            .resizable()
            .aspectRatio(contentMode: .fill)
        
        VStack(spacing: 0) {
            Text("\(entry.date.hour)")
            Text("\(entry.date.min)")
        }
        .font(.system(size: 60, weight: .bold))
        .foregroundColor(.white)
    }
    . if #available(iOSApplicationExtension 17.0, *) {   //这行代码报错 告知我不能这样做 不识别if 
            $0.containerBackground(.red.gradient, for: .widget)
        } else {
            // Fallback on earlier versions
        }
```

研究半天 发现还得给view扩展一个返回自己的函数来链式配置.

这写法真是不太明白咋写合适最终只能 给View写个extension


``` swift
import Foundation
import SwiftUI

public extension View {
    func modify<Content>(@ViewBuilder _ transform: (Self) -> Content) -> Content {
        transform(self)
    }
}

```

然后使用的时候 

``` swift
.modify{
    if #available(iOSApplicationExtension 17.0, *) {
        $0.containerBackground(.red.gradient, for: .widget)
    } else {
        // Fallback on earlier versions
    }
}
```

这样在swiftUI的 body 里面才能顺利编译通过

完整的测试代码如下 

``` swift
struct MomentsWidget: Widget {
    let kind: String = WidgetType.moments.kind
    
    var body: some WidgetConfiguration {
        IntentConfiguration(kind: kind, intent: ConfigurationIntent.self, provider: MomentsWidgetProvider()) { entry in
            MomentsWidgetEntryView(entry: entry)
                .modify{  //这里是适配代码
                    if #available(iOSApplicationExtension 17.0, *) {
                        $0.containerBackground(.white.gradient, for: .widget)
                    } else {
                        // Fallback on earlier versions
                    }
                }
        }
        // 这里定义的就是小组件弹出界面中的标题与副标题
        .configurationDisplayName("好友动态")
        .description("通过该组件可以创建好友动态列表")
        .supportedFamilies([.systemLarge])
    }
}
```

# 总结

1.写swiftUI感觉像是第一次接触UIKit时候那样 一开始比较困难时因为对它缺少认知  
2.swiftUI的框架设计应该把这种问题考虑进去 提供一个专用的API,或者至少不要让Xcode的提示出错吧,Xcode提供的东西都出错只能说明这个东西还不成熟.

[参考stackoverflow](https://stackoverflow.com/questions/76595240/widget-on-ios-17-beta-device-adopt-containerbackground-api)