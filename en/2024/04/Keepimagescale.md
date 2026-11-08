---
layout: post
title: A Calculation Method to Keep the Original UIImage Scale Ratio
date: 2024-04-02 09:16 +0000
categories: [iOS, SwiftUI]
tags: [iOS,iPadOS,watchOS, SwiftUI,Masonry]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This post carries strong personal opinions; if reading it makes you uncomfortable, please close it right away. This article is only for my personal study notes. You're welcome to repost or quote it within the scope of the license — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS, so you'll get this site's updates as soon as they're out.

# Code Snippet

``` objc
/// Keep the aspect ratio unchanged while ensuring width and height do not exceed the maximum limit of 2048
/// - Parameter imageSize: original size
- (CGSize)keepScaleSize:(CGSize)imageSize
{
    if (kw_is_float_zero(imageSize.width) || kw_is_float_zero(imageSize.height)) { return imageSize; }
    //check whether it exceeds the maximum limit
    if (imageSize.width < 2048 && imageSize.height < 2048) { return imageSize; }
    //exceeds the maximum limit
    CGSize resize = CGSizeZero;
    if (imageSize.width > imageSize.height) {
        //the longest side is the width
        CGFloat ratio = imageSize.height / imageSize.width;
        CGFloat disWidth = 2048;
        CGFloat disHeight = disWidth * ratio;
        resize = CGSizeMake(disWidth, disHeight);
    } else {
        //the longest side is the height
        CGFloat ratio = imageSize.width / imageSize.height;
        CGFloat disHeight = 2048;
        CGFloat disWidth = disHeight * ratio;
        resize = CGSizeMake(disWidth, disHeight);
    }
    return resize;
}
```

# Summary

During development there are some calculation methods that are easy to work out but easy to forget, and hard to find again when you need them — so here's a code snippet recorded for reference.
