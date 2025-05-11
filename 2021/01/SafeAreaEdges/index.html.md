---
layout: post
title: 获取UIWindow的边界距离
date: 2021-01-18 13:43:41
categories: [iOS,Swift]
tags: [iOS, Swift, Objective-C]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


2021第一篇发布记录开发中遇到的费时间问题

### 新工程经常遇到解决刘海屏的距离问题

写了一个工具类用于记录边界

``` objc

#import <Foundation/Foundation.h>

#define YZAreaInsets [YZUtilTool yz_safeAreaInsets]


@interface YZUtilTool : NSObject

+ (UIEdgeInsets)yz_safeAreaInsets;

@end


@implementation YZUtilTool

+ (UIEdgeInsets)yz_safeAreaInsets {
    UIWindow *window = [UIApplication sharedApplication].windows.firstObject;
    if (![window isKeyWindow]) {
        UIWindow *keyWindow = [UIApplication sharedApplication].keyWindow;
        if (CGRectEqualToRect(keyWindow.bounds, [UIScreen mainScreen].bounds)) {
            window = keyWindow;
        }
    }
    if (@available(iOS 11.0, *)) {
        UIEdgeInsets insets = [window safeAreaInsets];
        return insets;
    }
    return UIEdgeInsetsZero;
}


@end

```

记录过程代码.

