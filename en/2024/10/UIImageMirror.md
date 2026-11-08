---
layout: post
title: UIImage Mirroring
date: 2024-10-16 01:46 +0000
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---



# Preface

This article is highly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. Reposts and sharing are welcome within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


# Example Code Record

``` objc

@implementation UIImage (MTMirrorImage)

- (nullable UIImage *)mirrorImageHorizontally
{
    if (self == nil) { return nil; }
    CGSize size = self.size;
    CGRect rect = CGRectMake(0, 0, size.width, size.height);
    // Create a bitmap context
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    unsigned char *bytes = (unsigned char *)malloc(size.width * size.height * 4);
    CGContextRef context = CGBitmapContextCreate(bytes, size.width, size.height, 8, size.width * 4, colorSpace, kCGBitmapByteOrderDefault | kCGImageAlphaPremultipliedLast);
    // Draw the original image into the bitmap context
    CGContextDrawImage(context, rect, self.CGImage);
    // Flip the image horizontally in the bitmap context
    CGContextTranslateCTM(context, size.width, 0);
    CGContextScaleCTM(context, -1, 1);
    CGContextDrawImage(context, rect, self.CGImage);
    // Get the new image from the bitmap context
    CGImageRef newImageRef = CGBitmapContextCreateImage(context);
    UIImage *newImage = [UIImage imageWithCGImage:newImageRef];
    // Release resources
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
    // Create a bitmap context
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    unsigned char *bytes = (unsigned char *)malloc(size.width * size.height * 4);
    CGContextRef context = CGBitmapContextCreate(bytes, size.width, size.height, 8, size.width * 4, colorSpace, kCGBitmapByteOrderDefault | kCGImageAlphaPremultipliedLast);
    // Draw the original image into the bitmap context
    CGContextDrawImage(context, rect, self.CGImage);
    // Flip the image vertically in the bitmap context
    CGContextTranslateCTM(context, 0, size.height);
    CGContextScaleCTM(context, 1, -1);
    CGContextDrawImage(context, rect, self.CGImage);
    // Get the new image from the bitmap context
    CGImageRef newImageRef = CGBitmapContextCreateImage(context);
    UIImage *newImage = [UIImage imageWithCGImage:newImageRef];
    // Release resources
    CGImageRelease(newImageRef);
    CGContextRelease(context);
    free(bytes);
    CGColorSpaceRelease(colorSpace);
    return newImage;
}

@end
```
