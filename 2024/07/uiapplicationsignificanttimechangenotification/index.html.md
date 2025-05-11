---
layout: post
title: iOS中如何解决跨天日期变化
date: 2024-07-31 03:17 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---


![](/assets/images/20240727Magnificationgesture/SwiftUI.webp)


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

## 背景介绍

最近工作中遇到一个需求是 当app在前台并且 过午夜12点时 触发某些逻辑,而且还需要在前台触发, 也就是说如果在后台挂起状态 回到前台才要触发,一般用于一些签到之类的逻辑. 

## UIApplicationSignificantTimeChangeNotification

在iOS应用开发中，`UIApplicationSignificantTimeChangeNotification`是一个强大的工具，它允许开发者在时间发生重大变化时接收通知。这种变化包括日期的更改、时区的变动或夏令时（DST）的开始和结束或运营商的时间更新。这个功能尤其对于需要在特定时间执行某些任务的应用非常有用，例如在`午夜12点`进行数据备份或更新。

要在应用中接收UIApplicationSignificantTimeChangeNotification，首先需要向系统注册以接收此通知。这可以在应用的任何部分完成，但通常是在applicationDidFinishLaunching:或类似的应用生命周期方法中进行。

以下是如何注册的示例代码：

``` objc
//注册通知
[[NSNotificationCenter defaultCenter] addObserver:self
                                         selector:@selector(significantTimeChangeHandler:)
                                             name:UIApplicationSignificantTimeChangeNotification
                                           object:nil];
...

- (void)significantTimeChangeHandler:(NSNotification *)notification {
    if ([notification.name isEqualToString:UIApplicationSignificantTimeChangeNotification]) {
        // 获取当前日期
        NSDate *currentDate = [NSDate date];
        // 获取昨天的日期
        NSCalendar *calendar = [NSCalendar currentCalendar];
        NSDateComponents *comps = [calendar components:NSCalendarUnitDay fromDate:currentDate];
        comps.day = comps.day - 1;
        NSDate *yesterday = [calendar dateFromComponents:comps];
        
        // 检查是否跨过午夜
        if ([currentDate compare:yesterday] == NSOrderedDescending) {
            // 在这里执行跨日期后需要的操作，如数据备份等
            NSLog(@"Crossed midnight, perform necessary actions.");
        }
    }
}

```

此方法首先确认收到的通知是我们所关心的时间显著变化通知。然后，它获取当前的日期，并计算出昨天的日期。通过比较这两个日期，我们可以确定是否跨过了午夜。如果是这样，那么可以执行需要在新一天开始时进行的任何操作，比如数据备份、刷新用户界面等。

这个通知单的官方注释如下 

``` txt
A notification that posts when there is a significant change in time, for example, change to a new day (midnight), carrier time update, and change to or from daylight savings time.
当时间发生重大变化时发布的通知，例如，更改为新的一天（午夜）、运营商时间更新，以及更改为夏令时。

This notification does not contain a userInfo  dictionary.
此通知不包含userInfo字典。

If your app is currently suspended, this message is queued until your app returns to the foreground, at which point it is delivered. If multiple time changes occur, only the most recent one is delivered.
如果你的应用程序当前处于挂起状态，则此消息将一直排队，直到你的应用程序返回前台，并在前台发送。如果发生多个时间更改，则只发送最近的一个。

```
> [官方文档](https://developer.apple.com/documentation/uikit/uiapplicationsignificanttimechangenotification)

# 总结

这个通知并不常用,但能完全满足需求中要求的 跨天变化,日期修改回到前台等逻辑,并且还能在修改夏令时或运营商时间更新时触发.  
