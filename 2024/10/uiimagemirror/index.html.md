---
layout: post
title: UIImage镜像
date: 2024-10-16 01:46 +0000
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---



# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


# 示例代码记录

``` objc

@implementation UIImage (MTMirrorImage)

- (nullable UIImage *)mirrorImageHorizontally
{
    if (self == nil) { return nil; }
    CGSize size = self.size;
    CGRect rect = CGRectMake(0, 0, size.width, size.height);
    // 创建一个位图上下文
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    unsigned char *bytes = (unsigned char *)malloc(size.width * size.height * 4);
    CGContextRef context = CGBitmapContextCreate(bytes, size.width, size.height, 8, size.width * 4, colorSpace, kCGBitmapByteOrderDefault | kCGImageAlphaPremultipliedLast);
    // 将原始图像绘制到位图上下文中
    CGContextDrawImage(context, rect, self.CGImage);
    // 水平翻转位图上下文中的图像
    CGContextTranslateCTM(context, size.width, 0);
    CGContextScaleCTM(context, -1, 1);
    CGContextDrawImage(context, rect, self.CGImage);
    // 从位图上下文中获取新的图像
    CGImageRef newImageRef = CGBitmapContextCreateImage(context);
    UIImage *newImage = [UIImage imageWithCGImage:newImageRef];
    // 释放资源
    CGImageRelease(newImageRef);
    CGContextRelease(context);
    free(bytes);
    CGColorSpaceRelease(colorSpace);
    return newImage;
}

- (nullable UIImage *)mirrorImageVertically;
{
    if (self == nil) { return nil; }
    CGSize size = self.size;
    CGRect rect = CGRectMake(0, 0, size.width, size.height);
    // 创建一个位图上下文
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    unsigned char *bytes = (unsigned char *)malloc(size.width * size.height * 4);
    CGContextRef context = CGBitmapContextCreate(bytes, size.width, size.height, 8, size.width * 4, colorSpace, kCGBitmapByteOrderDefault | kCGImageAlphaPremultipliedLast);
    // 将原始图像绘制到位图上下文中
    CGContextDrawImage(context, rect, self.CGImage);
    // 垂直翻转位图上下文中的图像
    CGContextTranslateCTM(context, 0, size.height);
    CGContextScaleCTM(context, 1, -1);
    CGContextDrawImage(context, rect, self.CGImage);
    // 从位图上下文中获取新的图像
    CGImageRef newImageRef = CGBitmapContextCreateImage(context);
    UIImage *newImage = [UIImage imageWithCGImage:newImageRef];
    // 释放资源
    CGImageRelease(newImageRef);
    CGContextRelease(context);
    free(bytes);
    CGColorSpaceRelease(colorSpace);
    return newImage;
}

@end
```
