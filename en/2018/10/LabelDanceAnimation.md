---
layout: post
title: iOS Number Multiple Animation
date: 2018-10-29 18:13:15
categories: [iOS]
tags: [iOS, 动画, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


# Preface 

I wrote a simple number multiple animation implemented with opacity and scale

![demo](/assets/images/20181029LabelDanceAnimation/danceLabel.avif)


# Implementation Approach

The code is easier to understand

``` objc
// Number bounce animation
- (void)labelDanceAnimation:(NSTimeInterval)duration {
    // Opacity
    CABasicAnimation *opacityAnimation = [CABasicAnimation animationWithKeyPath:@"opacity"];
    opacityAnimation.duration = 0.4 * duration;
    opacityAnimation.fromValue = @0.f;
    opacityAnimation.toValue = @1.f;
    
    // Scale
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

Just use an alpha that goes from 0 ~ 1, then scale it, and add everything to an animation group to finish.

> Remember to remove the animation after it finishes; otherwise, it may cause animation memory issues

Here we set the italic font

``` objc
self.comboLabel.font = [UIFont fontWithName:@"AvenirNext-BoldItalic" size:50];
```

It looks more obvious this way


Finally, call it when the button is clicked

``` objc
- (IBAction)clickAction:(UIButton *)sender {
    self.danceCount++;
    [self labelDanceAnimation:0.4];
    self.comboLabel.text = [NSString stringWithFormat:@"+  %tu",self.danceCount];
}
```

If you want to implement the dozen animation, it's simple: just take the modulo with __danceCount % 10 == 0__.

# Summary

This animation is suitable for click-counting in some live streaming scenarios. Thanks for watching.


[Demo here](https://github.com/sunyazhou13/LiveComboLabel)




