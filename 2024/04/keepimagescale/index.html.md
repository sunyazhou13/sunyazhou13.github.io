---
layout: post
title: 保持原UIImage缩放比的计算方法
date: 2024-04-02 09:16 +0000
categories: [iOS, SwiftUI]
tags: [iOS,iPadOS,watchOS, SwiftUI,Masonry]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或引用,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,这样您将能在第一时间获取本站信息.

# 代码记录

``` objc
/// 保持宽高比不变的前提的 宽高不超过 最大限制2048
/// - Parameter imageSize: 原始大小
- (CGSize)keepScaleSize:(CGSize)imageSize
{
    if (kw_is_float_zero(imageSize.width) || kw_is_float_zero(imageSize.height)) { return imageSize; }
    //check有没有超过最大限制
    if (imageSize.width < 2048 && imageSize.height < 2048) { return imageSize; }
    //超过最大限制
    CGSize resize = CGSizeZero;
    if (imageSize.width > imageSize.height) {
        //最长边是 宽
        CGFloat ratio = imageSize.height / imageSize.width;
        CGFloat disWidth = 2048;
        CGFloat disHeight = disWidth * ratio;
        resize = CGSizeMake(disWidth, disHeight);
    } else {
        //最长边是 高
        CGFloat ratio = imageSize.width / imageSize.height;
        CGFloat disHeight = 2048;
        CGFloat disWidth = disHeight * ratio;
        resize = CGSizeMake(disWidth, disHeight);
    }
    return resize;
}
```

# 总结

开发过程中有一些经常忘记,却很容易的计算方法,当用到的时候很难找,记录一下代码片段