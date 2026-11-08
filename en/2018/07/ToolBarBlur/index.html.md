---
layout: post
title: Using UIToolbar for a Gaussian Blur Background
date: 2018-07-23 18:22:05
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


![blur](/assets/images/20180723ToolBarBlur/blur.avif)

``` objc
- (UIView *)containerBackgroundView {
    if (!_containerBackgroundView) {
        UIToolbar *toolBar = [[UIToolbar alloc] initWithFrame:CGRectZero];
        toolBar.barStyle = UIBarStyleBlack;
        toolBar.clipsToBounds = YES;
        _containerBackgroundView = toolBar;
    }
    return _containerBackgroundView;
}

```

You can also use `UIBlurEffect`:


``` objc
UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleLight];
UIVisualEffectView *blurView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];
blurView.frame = myView.bounds;
[myView addSubview:blurView];

```


UIBlurEffectStyle 

* UIBlurEffectStyleExtraLight,//Extra brightness (highlight style)

* UIBlurEffectStyleLight,//Light style

* UIBlurEffectStyleDark//Dark style

> UIBlurEffect cannot adjust the blur radius.

If you want to adjust the blur radius,

you can apply a Gaussian blur to the image:

``` objc
-(UIImage *)convertToBlurImage:(UIImage *)image{
    CIFilter *gaussianBlurFilter = [CIFilter filterWithName:@"CIGaussianBlur"];
    [gaussianBlurFilter setDefaults];
    CIImage *inputImage = [CIImage imageWithCGImage:[image CGImage]];
    [gaussianBlurFilter setValue:inputImage forKey:kCIInputImageKey];
    [gaussianBlurFilter setValue:@5 forKey:kCIInputRadiusKey];
    CIImage *outputImage = [gaussianBlurFilter outputImage];
    CIContext *context   = [CIContext contextWithOptions:nil];
    CGImageRef cgimg     = [context createCGImage:outputImage fromRect:[inputImage extent]];  // note, use input image extent if you want it the same size, the output image extent is larger
    UIImage *convertedImage = [UIImage imageWithCGImage:cgimg];
    return convertedImage;
}

```

The core line is `[gaussianBlurFilter setValue:@5 forKey:kCIInputRadiusKey]`;

I tested 100 and it worked fine too — I never found the maximum value.

Above are several pieces of Gaussian blur related code.


End of article


