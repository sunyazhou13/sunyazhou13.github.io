---
title: 利用UIToolBar做高斯模糊背景
categories: [ios开发]
tags: [ios, macos]
date: 2018-07-23 18:22:05
---


![](/assets/images/20180723ToolBarBlur/blur.gif)

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

也可以使用`UIBlurEffect`


``` objc
UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleLight];
UIVisualEffectView *blurView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];
blurView.frame = myView.bounds;
[myView addSubview:blurView];

```


UIBlurEffectStyle 

* UIBlurEffectStyleExtraLight,//额外亮度，（高亮风格）

* UIBlurEffectStyleLight,//亮风格

* UIBlurEffectStyleDark//暗风格

> UIBlurEffect 不能调节模糊半径

如果要调整模糊半径

可以对图片进行高斯模糊

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

核心代码是`[gaussianBlurFilter setValue:@5 forKey:kCIInputRadiusKey]`;

但是我测试100也没啥问题 没有测试出最大值

以上是几种高斯模糊的相关代码 


全文完


