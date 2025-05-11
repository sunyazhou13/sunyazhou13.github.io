---
layout: post
title: iOS生成随机UIColor颜色代码
date: 2017-07-04 17:45:28
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
---


``` objc
- (UIColor *)randomColor
{
    CGFloat hue = ( arc4random() % 256 / 256.0 );  //  0.0 to 1.0
    CGFloat saturation = ( arc4random() % 128 / 256.0 ) + 0.5;  //  0.5 to 1.0, away from white
    CGFloat brightness = ( arc4random() % 128 / 256.0 ) + 0.5;  //  0.5 to 1.0, away from black
    UIColor *color = [UIColor colorWithHue:hue saturation:saturation brightness:brightness alpha:1];
    return color;
}
```

我们通常接触到的颜色空间是RGB，其实常用的还有HSV又叫HSB。
HSV即Hue, Saturation, Value.
什么意思呢？
先看一张图

![](/assets/images/20170704Arc4RandomColor/hsv.webp)

HSV这个color space可以用上图的圆柱体来表示。
Hue代表从0°到360°的不同颜色.
Saturation指的是色彩的饱和度，它用0%至100%的值描述了相同色相、明度下色彩纯度的变化。数值越大，颜色中的灰色越少，颜色越鲜艳，呈现一种从理性(灰度)到感性(纯色)的变化
Value指的是色彩的明度，作用是控制色彩的明暗变化。它同样使用了0%至100%的取值范围。数值越小，色彩越暗，越接近于黑色；数值越大，色彩越亮，越接近于白色。

[色彩引用](https://zhuanlan.zhihu.com/p/31202175)