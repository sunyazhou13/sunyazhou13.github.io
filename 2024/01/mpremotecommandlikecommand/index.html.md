---
layout: post
title: iOS控制中心收藏按钮likeCommand动画
date: 2024-01-25 13:03 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS,iPadOS,watchOS, SwiftUI]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

## 背景描述

最近开发中,产品要求在音频播放控制中心中增加 收藏按钮, 查看了QQ音乐和网易云音乐发现他们都已经有了此按钮,然而在酷我音乐的app切后台锁屏后这个按钮没有漏出,查了一下代码发现按钮没有添加,于是加了按钮发现没有动画效果.

就此问题查了全网没有一个说清楚的,经过反复测试发现,苹果给我们提供了一个新的api我们没有注意.

先看看做完啥效果,

![](/assets/images/20240125MPRemoteCommandLikecommand/MPRemoteCommand.gif)

这里要用到的关键代码api如下:

``` objc
@interface MPFeedbackCommand : MPRemoteCommand

/// Whether the feedback command is in an "active" state. An example of when a
/// feedback command would be active is if the user already "liked" a particular
/// content item.
@property (nonatomic, assign, getter = isActive) BOOL active;   //就是这个
...  
@end
```
下面是完整的添加此功能的代码.

``` objc
if (@available(iOS 17.1, *)) {
    MPRemoteCommandCenter *center = [MPRemoteCommandCenter sharedCommandCenter];
    [center.likeCommand setEnabled:YES];
    [center.likeCommand setLocalizedTitle:@"收藏"];
    [center.likeCommand setLocalizedShortTitle:@"收藏此歌曲"];
    //TODO: check 是否 已收藏
    [center.likeCommand setActive:NO]; //假设默认此歌曲没有被收藏的效果是没有 电量喜欢
    [center.likeCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
        // ... 处理收藏歌曲逻辑的代码 此处省略
        if (@available(iOS 17.1, *)) {
            MPFeedbackCommand *likeCommand = (MPFeedbackCommand *)event.command;
            if (likeCommand && likeCommand.isEnabled) {
                BOOL lastActive = likeCommand.isActive;
                [likeCommand setActive:!lastActive]; //TODO: 此处代码模拟已收藏和取消收藏,这里得到结果后 再次设置Active将会出现动画效果
            }
        }
        return MPRemoteCommandHandlerStatusSuccess; //如果点击收藏成功可以返回这个状态
    }];
}];
}
```

以上是实现 收藏动效的全部代码.

## 踩坑记录

这里注意下 `MPRemoteCommandCenter `中 有如下代码

``` objc
// Feedback Commands
// These are generalized to three distinct actions. Your application can provide
// additional context about these actions with the localizedTitle property in
// MPFeedbackCommand.
@property (nonatomic, readonly) MPFeedbackCommand *likeCommand;
@property (nonatomic, readonly) MPFeedbackCommand *dislikeCommand;
```

一开始我尝试使用disklikeCommand按钮,结果发现没有效果, 苹果这个操作我也是真没看懂,如果想要一个按钮解决两种状态 那为何不提供这个按钮可以选中的状态,为啥搞两个按钮迷惑开发者,整得我读完文档我也没有理解一个按钮能出动效,两个按钮就不能出动效的方式. 这是一个可以被废弃的按钮,留着意义不大,建议苹果官方看到的话去掉吧！至少能让开发者少走一些弯路

# 总结

开发中总会出现一些奇奇怪怪的API,善于积累,勤于实践,记录过程,解决问题,以上就是本章的全部内容.