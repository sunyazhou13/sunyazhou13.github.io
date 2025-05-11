---
layout: post
title: UIImage黑白滤镜
date: 2023-06-14 09:37 +0800
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 背景

最近开发功能产品有一个需求是这样的,将一张图片变成黑白图片,我们第一想法是加render着色,然而着色不产品想要的需求,产品的意思是加黑白滤镜,之前开发的同事曾经搞过一些私有API做混淆的方式实现了公祭日之类的纪念活动把工程里所有的视图都搞成了黑白色.可是我总不能为了一个艰难的功能动用私有API做混淆被苹果教育吧!

经过各种查找都没有最优解,我想到了ChatGPT,经过和ChatGPT问答的形式它给出了如下代码:

``` objc

#import <UIKit/UIKit.h>
#import <CoreImage/CoreImage.h>

@interface UIImage (RenderingColor)

/// 给一张图片加黑白滤镜
/// - Parameter image: 图片
+ (UIImage *)applyBlackWhiteFilterToImage:(UIImage *)image;

@end

@implementation UIImage (RenderingColor)

+ (UIImage *)applyBlackWhiteFilterToImage:(UIImage *)image
{
    if (image == nil) { return nil; }
    CIImage *ciImage = [CIImage imageWithCGImage:image.CGImage];
    CIFilter *filter = [CIFilter filterWithName:@"CIPhotoEffectMono"]; // Create the black-and-white filter
    [filter setValue:ciImage forKey:kCIInputImageKey];
    CIContext *context = [CIContext contextWithOptions:nil];
    CIImage *outputImage = [filter outputImage];
    CGImageRef cgImage = [context createCGImage:outputImage fromRect:[outputImage extent]];
    UIImage *filteredImage = [UIImage imageWithCGImage:cgImage];
    CGImageRelease(cgImage);
    return filteredImage;
}

@end
```

通过上述操作我们就轻松的实现了给一个UIImage 加黑白滤镜让它变成灰白色的效果,

![](/assets/images/20230614BlackWhiteFilter/BlackWhiteFilter.webp)



#### 能给CALayer加吗？

能

``` objc
#import <QuartzCore/QuartzCore.h>
#import <CoreImage/CoreImage.h>

@interface CALayer (BlackWhiteFilter)

- (void)applyBlackWhiteFilter;

@end

@implementation CALayer (BlackWhiteFilter)

- (void)applyBlackWhiteFilter {
    CIFilter *filter = [CIFilter filterWithName:@"CIPhotoEffectMono"]; // Create the black-and-white filter
    
    // Convert the CALayer's contents to a CIImage
    if ([self.contents isKindOfClass:[UIImage class]]) {
        CIImage *ciImage = [CIImage imageWithCGImage:(CGImageRef)self.contents];
        
        // Set the input image for the filter
        [filter setValue:ciImage forKey:kCIInputImageKey];
        
        // Apply the filter
        CIContext *context = [CIContext contextWithOptions:nil];
        CIImage *outputImage = [filter outputImage];
        CGImageRef cgImage = [context createCGImage:outputImage fromRect:[outputImage extent]];
        
        // Set the filtered image as the layer's contents
        self.contents = (__bridge id)cgImage;
        
        CGImageRelease(cgImage);
    }
}

@end

```

本质核心是使用`CIPhotoEffectMono`内置滤镜对图片进行绘制

> 1.这个是iOS5.0以上提供的方法,大家不用担心系统兼容问题  
> 2.这个不是私有API请放心使用,没有审核风险

这个方法的最低兼容iOS系统是iOS 5.0及以上版本。关于私有API和App Store审核风险的问题，请注意以下几点：

* 1.该方法并不使用私有API，它是使用了Core Image框架提供的公共接口来创建和应用滤镜效果。  
* 2.Core Image框架是iOS的公共框架，不属于私有API。因此，使用该方法不会违反苹果的App Store审核指南。  
* 3.提供了适当的错误处理和安全检查，以确保在不支持的设备上不会发生崩溃或异常行为。 

# 总结

经过反复找寻互联网上的资料，千篇一律,各种复制粘贴的文章真是没法看,不好使不说还不解决问题的同时制造很多互联网垃圾.希望互联网上这样的事情能变的纯净一些.

