---
layout: post
title: iOS数字倍数动画
date: 2018-10-29 18:13:15
categories: [iOS]
tags: [iOS, 动画, Objective-C, skills]
typora-root-url: ..
---


# 前言 

写了一个简单的利用 透明度和 缩放 实现的 数字倍数动画 

![demo](/assets/images/20181029LabelDanceAnimation/danceLabel.gif)


# 实现思路

上代码 看比较清晰

``` objc
// 数字跳动动画
- (void)labelDanceAnimation:(NSTimeInterval)duration {
    //透明度
    CABasicAnimation *opacityAnimation = [CABasicAnimation animationWithKeyPath:@"opacity"];
    opacityAnimation.duration = 0.4 * duration;
    opacityAnimation.fromValue = @0.f;
    opacityAnimation.toValue = @1.f;
    
    //缩放
    CAKeyframeAnimation *scaleAnimation = [CAKeyframeAnimation animationWithKeyPath:@"transform.scale"];
    scaleAnimation.duration = duration;
    scaleAnimation.values = @[@3.f, @1.f, @1.2f, @1.f];
    scaleAnimation.keyTimes = @[@0.f, @0.16f, @0.28f, @0.4f];
    scaleAnimation.removedOnCompletion = YES;
    scaleAnimation.fillMode = kCAFillModeForwards;
    
    CAAnimationGroup *animationGroup = [CAAnimationGroup animation];
    animationGroup.animations = @[opacityAnimation, scaleAnimation];
    animationGroup.duration = duration;
    animationGroup.removedOnCompletion = YES;
    animationGroup.fillMode = kCAFillModeForwards;
    
    [self.comboLabel.layer addAnimation:animationGroup forKey:@"kComboAnimationKey"];
}

```

利用一个透明度从 0 ~ 1之间的alpha,然后缩放 之后加到动画组实现一下就好了

> 切记动画完成最好移除 否则可能引起动画内存问题

这里设置斜体字体

``` objc
self.comboLabel.font = [UIFont fontWithName:@"AvenirNext-BoldItalic" size:50];
```

看着比较明显


最后按钮点击的时候调用

``` objc
- (IBAction)clickAction:(UIButton *)sender {
    self.danceCount++;
    [self labelDanceAnimation:0.4];
    self.comboLabel.text = [NSString stringWithFormat:@"+  %tu",self.danceCount];
}
```

如果实现 dozen动画的话很简单, __danceCount % 10 == 0__ 求模就行了.

# 总结

这个动画比较适合 有些直播场景的点击操作计数相关.感谢观看


[Demo在这里](https://github.com/sunyazhou13/LiveComboLabel)




