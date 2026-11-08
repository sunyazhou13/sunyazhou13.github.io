---
layout: post
title: Generating Random UIColor Colors in iOS
date: 2017-07-04 17:45:28
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

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

The color space we usually deal with is RGB. In fact, another commonly used one is HSV, also known as HSB.
HSV stands for Hue, Saturation, Value.
What does that mean?
Take a look at this image first.

![hsv](/assets/images/20170704Arc4RandomColor/hsv.avif)

The HSV color space can be represented by the cylinder in the image above.
Hue represents the different colors from 0° to 360°.
Saturation refers to the purity of a color. It uses values from 0% to 100% to describe how pure the color is while keeping the same hue and lightness. The larger the value, the less gray the color contains and the more vivid it becomes — a progression from rationality (gray) to sensibility (pure color).
Value refers to the lightness of a color and controls how light or dark it is. It also uses a range from 0% to 100%. The smaller the value, the darker the color, approaching black; the larger the value, the brighter the color, approaching white.

[Color reference](https://zhuanlan.zhihu.com/p/31202175)
