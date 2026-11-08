---
layout: post
title: UIImage Black-and-White Filter
date: 2023-06-14 09:37 +0800
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This article has a strong personal flavor; if it makes you uncomfortable, please close it right away. This article is only for personal study notes. You're welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for the support!


## Background

Recently, while developing a feature product, there was a requirement to turn an image into a black-and-white image. Our first thought was to add a render tint, but tinting wasn't what the product wanted. The product meant adding a black-and-white filter. A previous colleague once used some private APIs with obfuscation to turn all the views in the project black-and-white for memorial-day-style events. But surely I can't use private APIs with obfuscation for one difficult feature and risk getting disciplined by Apple!

After searching around without finding an optimal solution, I thought of ChatGPT. Through a Q&A session with ChatGPT, it gave the following code:

``` objc

#import <UIKit/UIKit.h>
#import <CoreImage/CoreImage.h>

@interface UIImage (RenderingColor)

/// Add a black-and-white filter to an image
/// - Parameter image: the image
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

Through the above operations, we easily added a black-and-white filter to a UIImage to make it appear grayscale.

![Black White Filter](/assets/images/20230614BlackWhiteFilter/BlackWhiteFilter.avif)



#### Can it be applied to CALayer?

Yes

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

The core essence is using the built-in `CIPhotoEffectMono` filter to render the image.

> 1. This method is available from iOS 5.0 and above, so you don't need to worry about system compatibility.  
> 2. This is not a private API — use it with confidence, there's no review risk.

The minimum compatible iOS version for this method is iOS 5.0 and above. Regarding private API and App Store review risks, please note the following points:

* 1. This method does not use private APIs; it uses the public interfaces provided by the Core Image framework to create and apply filter effects.  
* 2. The Core Image framework is a public framework on iOS and is not a private API. Therefore, using this method does not violate Apple's App Store review guidelines.  
* 3. Appropriate error handling and safety checks are provided to ensure no crashes or abnormal behavior occur on unsupported devices. 

# Summary

After repeatedly searching for information on the internet, it's all the same — tons of copy-pasted articles that are unreadable, don't work, and don't solve the problem while generating lots of internet junk at the same time. I hope things like this on the internet can become a bit cleaner.

