---
layout: post
title: "Getting UIWindow Edge Insets"
date: 2021-01-18 13:43:41
categories: [iOS,Swift]
tags: [iOS, Swift, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

This article carries strong personal sentiments. If you find it uncomfortable to read, please close it. This article is for personal learning records only. You're welcome to repost or share it within the scope of the license — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


First post of 2021, recording a time-consuming problem encountered during development.

### Solving the Notch/Safe Area Inset Problem Often Encountered in New Projects

Wrote a utility class to record the edge insets:

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

This is the process code.

