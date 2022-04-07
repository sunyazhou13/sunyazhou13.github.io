---
title: 滚动文本设置渐变颜色
categories: [iOS]
tags: [iOS, 学习笔记]
date: 2021-01-21 20:00:29
---

![](/assets/images/20210121TextGradient/gradientcover.png)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或使用,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,这样您将能在第一时间获取本站信息.


最近看到搜狐发表了一篇文章,其中有一段是文本如何添加渐变颜色,使用`非mask`的方式.因为mask的方式非常耗费性能,因为mask会触发离屏渲染.今天的demo中我使用了原来的demo做为例子


## 实现滚动字幕中增加 渐变颜色

核心实现很简单,[带你实现完整的 iOS 视频弹幕系统](https://mp.weixin.qq.com/s/4pWrwmZBEbrca2uxIt3o6w)中并没有给出相关demo.只是把相关弹幕的实现思路大概说说.所以做为一个iOS开发要善于动手写代码实现和验证它的思路. 其实我内心是很讨厌 搜狐的这篇有头没尾的技术文章,无非就是写写思路,代码实现的demo一个也不放出来显然不厚道.

这里面我们实现的比较简单.就是算出文本的size然后用 CoreGraphicContext画出一张图片.

核心代码如下

``` objc
+ (UIImage *)gradientFromColor:(UIColor *)fromeColor toColor:(UIColor *)toColor andSize:(CGSize)imageSize {
    if (fromeColor == nil) { fromeColor = [UIColor clearColor]; }
    if (toColor == nil) { toColor = [UIColor clearColor]; }
    NSArray* gradientColors = [NSArray arrayWithObjects: (id)fromeColor.CGColor, (id)toColor.CGColor, nil];
    CGFloat scale = [UIScreen mainScreen].scale;
    UIGraphicsBeginImageContextWithOptions(imageSize, NO, scale);
    CGContextRef context = UIGraphicsGetCurrentContext();
    CGContextSaveGState(context);
    CGColorSpaceRef colorSpace = CGColorGetColorSpace([fromeColor CGColor]);
    CGGradientRef gradient = CGGradientCreateWithColors(colorSpace, (CFArrayRef)gradientColors, NULL);
    CGPoint start = CGPointMake(0.0, 0.0);
    CGPoint end = CGPointMake(imageSize.width, 0.0);
    CGContextDrawLinearGradient(context, gradient, start, end, kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation);
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    CGGradientRelease(gradient);
    CGContextRestoreGState(context);
    UIGraphicsEndImageContext();
    return image;
}
```

这里面需要着重强调就是 两行代码 

``` objc
//获取渐变颜色的色彩空间
CGColorSpaceRef colorSpace = CGColorGetColorSpace([fromeColor CGColor]);
//然后根据渐变数组调用 线性渐变,至于放心可以在代码中找到 start 和end的CGPoint处设置
NSArray* gradientColors = [NSArray arrayWithObjects: (id)fromeColor.CGColor, (id)toColor.CGColor, nil];
CGGradientRef gradient = CGGradientCreateWithColors(colorSpace, (CFArrayRef)gradientColors, NULL);

```

下面是我这边实现的逻辑展示 demo我会放到下面大家自行下载.

![](/assets/images/20210121TextGradient/gradienttextscroll.gif)

# 总结

2021年第二篇.时间紧凑,有时间仔细研究一下 搜狐的弹幕系统 写个demo.

[本文demo下载](https://github.com/sunyazhou13/UIScrollTextNewDemo)

[参考 带你实现完整的 iOS 视频弹幕系统](https://mp.weixin.qq.com/s/4pWrwmZBEbrca2uxIt3o6w)