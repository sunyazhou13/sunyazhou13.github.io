---
layout: post
title: iOS呼吸动画
date: 2018-09-29 10:09:30
categories: [iOS]
tags: [iOS, 动画, Objective-C, skills]
typora-root-url: ..
---

# 前言

快放假了, 怕十一文章更新不及时,早点完成文章,保证每个月 2篇的产出量, 今天给大家带来的是 呼吸动画, 做的不是特别好.

上图

![](/assets/images/20180929BreathAnimation/breathAnimation.gif)

大概是这个样子 


# 需求和实现思路


具体要求

* 内部头像呼吸放大缩小 无限循环
* 每次放大同时需要背景还有一张图也放大 并且透明
* 点击缩放整个背景视图


## 实现思路

首先 需要使用创建一个Layer 装第一个无限放大缩小的呼吸的图    
背景也需要一个Layer 做 放大+透明度渐变的动画组并且也放置一张需要放大渐变的图片

最后点击触发. 添加一个一次性的缩放动画即可


### 呼吸动画layer和动画


呼吸layer

``` objc
CALayer *layer = [CALayer layer];
layer.position = CGPointMake(kHeartSizeWidth/2.0f, kHeartSizeHeight/2.0f);
layer.bounds = CGRectMake(0, 0, kHeartSizeWidth/2.0f, kHeartSizeHeight/2.0f);
layer.backgroundColor = [UIColor clearColor].CGColor;
layer.contents = (__bridge id _Nullable)([UIImage imageNamed:@"breathImage"].CGImage);
layer.contentsGravity = kCAGravityResizeAspect;
[self.heartView.layer addSublayer:layer];
```
> kHeartSizeHeight 和kHeartSizeWidth 是常量 demo中写好了100

加帧动画

``` objc
CAKeyframeAnimation *animation = [CAKeyframeAnimation animationWithKeyPath:@"transform.scale"];
animation.values = @[@1.f, @1.4f, @1.f];
animation.keyTimes = @[@0.f, @0.5f, @1.f];
animation.duration = 1; //1000ms
animation.repeatCount = FLT_MAX;
animation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
[animation setValue:kBreathAnimationKey forKey:kBreathAnimationName];
[layer addAnimation:animation forKey:kBreathAnimationKey];
```

> 差值器也可以自定义 例如:

``` objc

[CAMediaTimingFunction functionWithControlPoints:0.33 :0 :0.67 :1]

```

这里我做的持续时常1秒 

### 放大渐变动画group

创建新layer

``` objc
CALayer *breathLayer = [CALayer layer];
breathLayer.position = layer.position;
breathLayer.bounds = layer.bounds;
breathLayer.backgroundColor = [UIColor clearColor].CGColor;
breathLayer.contents = (__bridge id _Nullable)([UIImage imageNamed:@"breathImage"].CGImage);
breathLayer.contentsGravity = kCAGravityResizeAspect;
[self.heartView.layer insertSublayer:breathLayer below:layer];
//[self.heartView.layer addSublayer:breathLayer];

```

> 这里用的是放在 呼吸layer后边 如果想放在呼吸layer前边 就把里面注释打开 然后注掉 inert那行代码

动画组 包含 放大 渐变


``` objc
//缩放
CAKeyframeAnimation *scaleAnimation = [CAKeyframeAnimation animationWithKeyPath:@"transform.scale"];
scaleAnimation.values = @[@1.f, @2.4f];
scaleAnimation.keyTimes = @[@0.f,@1.f];
scaleAnimation.duration = animation.duration;
scaleAnimation.repeatCount = FLT_MAX;
scaleAnimation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseIn];
//透明度
CAKeyframeAnimation *opacityAnimation = [CAKeyframeAnimation animation];
opacityAnimation.keyPath = @"opacity";
opacityAnimation.values = @[@1.f, @0.f];
opacityAnimation.duration = 0.4f;
opacityAnimation.keyTimes = @[@0.f, @1.f];
opacityAnimation.repeatCount = FLT_MAX;
opacityAnimation.duration = animation.duration;
opacityAnimation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseIn];

//动画组
CAAnimationGroup *scaleOpacityGroup = [CAAnimationGroup animation];
scaleOpacityGroup.animations = @[scaleAnimation, opacityAnimation];
scaleOpacityGroup.removedOnCompletion = NO;
scaleOpacityGroup.fillMode = kCAFillModeForwards;
scaleOpacityGroup.duration = animation.duration;
scaleOpacityGroup.repeatCount = FLT_MAX;
[breathLayer addAnimation:scaleOpacityGroup forKey:kBreathScaleName];
```

### 点击缩放动画

跟第一个一样 只不过 执行次数默认一次 执行完就可以了

``` objc
- (void)shakeAnimation {
    CAKeyframeAnimation *animation = [CAKeyframeAnimation animationWithKeyPath:@"transform.scale"];
    animation.values = @[@1.0f, @0.8f, @1.f];
    animation.keyTimes = @[@0.f,@0.5f, @1.f];
    animation.duration = 0.35f;
    animation.timingFunctions = @[[CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut],[CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut]];
    [self.heartView.layer addAnimation:animation forKey:@""];
}

```

手势触发的时候 调用一下


### 遇到的问题

在开发动画的时候遇到 都一个动画 要执行 呼吸 

呼吸如果duration 到中间的话 比如1秒 那么0.5秒的时候 它就需要折回 

那么第二个动画刚刚执行到一半,就会感觉很奇怪

![](/assets/images/20180929BreathAnimation/aniamation.webp)


如果__渐变动画__执行0.5秒的话 它是重复的 那么他就重新开始 相当于 呼吸折回的时候它又重新开开始渐变

#### 怎么解决呢？

我们把0.5秒的动画加到 动画组里面,然后给动画组设置的时长保持和呼吸动画 一样,这样剩余的0.5的时候 渐变动画是不会重新开始的.


# 总结

动画很久没玩了 基本都忘了一干二净了,以后要勤加练习,多出文章和demo,记录一些更多的知识技巧.

博客像车一样,要是不是的时候经常保养,才能走更远的路,记录更多的美好.

全文完

[Demo在这里下载](https://github.com/sunyazhou13/BreathAnimation)