---
layout: post
title: 音频声像Pan值电平左右声道平衡
date: 2017-12-19 11:40:13
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
---


![](/assets/images/20171219AudioPan/AudioPan.webp)


# 前言

最近在开发多媒体音视频相关业务,期间遇到的问题这里全做记录下来,下面是同事提供的一个例子我整理出来,以备后续开发遇到此类问题有个备案.

## 开篇

最近开发音频涉及到左右声道调节,基于左右声道的音量实现 声音环绕效果.
下面是 UI 演示.


![](/assets/images/20171219AudioPan/AudioPanDemo.gif)


这里其实修改的类似 `AVAudioPlayer`里面的`pan`值修改

![](/assets/images/20171219AudioPan/PanAudioApi.webp)


我在以前的文章也有一篇提到过这个[pan 值](https://www.sunyazhou.com/2017/03/17/Learning-AV-Foundation-AVAudioPlayer/)


可能大家不理解为啥 这个 API 起名叫`pan`

在声学领域这个东西有专门的名字叫 `声像`.

[这篇文章](http://underwaysoft.com/writing/books/dsp-develop.html#%E7%BA%BF%E6%80%A7%E5%A3%B0%E5%83%8F%EF%BC%88<span class=cnBracket>Pan</span>%EF%BC%89)介绍了一些我们对声学知识的简单介绍,虽然不知道作者是谁,但是作者应该是非常专业的声学开发者.

其实按照我们平常的理解应该是这样去实现这个 pan 值的修改


左声道音量给右声道声音的补偿 或者右侧声道给左侧声道的补偿,通过滑块的 value 来决定两边谁加多少减多少,但是大家的思路是对的,但是做法是不正确的,因为 两边的音量放在中间必须是1.0,也就是说 range 在 `-1 ~ 1`之间. 如果按照这个滑动方式回导致滑动过大. 

带着这个问题我的同事找到了一个公式 来计算 这个值


![](/assets/images/20171219AudioPan/PanAlgorithm.webp)


* `pan`就是我们的滑块的`value`
* `Vl` 代表左侧音量
* `Vr` 代表右侧音量


根据这个公式我们有如下 代码


``` objc

#import <math.h>

typedef NS_ENUM(NSUInteger, KSYMCChannelType) {
    KSYMCChannelTypeLeft = 0,
    KSYMCChannelTypeRight = 1
};

@interface KSYMultiCanvasHelper : NSObject

+ (CGFloat)calculateVolume:(KSYMCChannelType)type
                  panValue:(CGFloat)pan
                    volume:(CGFloat)volume;

@end



@implementation KSYMultiCanvasHelper

+ (CGFloat)calculateVolume:(KSYMCChannelType)type
                  panValue:(CGFloat)pan
                    volume:(CGFloat)volume{
    if (type == KSYMCChannelTypeLeft) {
        CGFloat leftVolumn = sqrt(2) * cos((1 + pan)*M_PI_4) *volume;
        return leftVolumn;
    } else if (type == KSYMCChannelTypeRight) {
        CGFloat rightVolumn = sqrt(2) * sin((1 + pan)*M_PI_4) *volume;
        return rightVolumn;
    }
    
    return 0;
}
@end
```

这里的计算还是比较准确的.

经过测试 左侧 音量 为 0 时 右侧音量应该是 1.41左右


## 总结

经过上述测试音频的 pan 值修改 如果自行开发还是比较好搞得,只是鄙人对音频的知识积累的太少了.这篇文章看起来虽然没什么技术含量,全当知识的点滴积累吧. 至于为啥 是 `M_PI_4`还请专研一下文章的扩展链接,因为要把一个线性的操作转换成一个圆型方便数学的计算,以及 **声像**和**声向**的区别.

全文完

