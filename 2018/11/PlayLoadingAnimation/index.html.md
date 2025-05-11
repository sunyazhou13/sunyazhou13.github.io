---
layout: post
title: iOS视频加载动画
date: 2018-11-14 14:14:39
categories: [iOS]
tags: [iOS, 动画, 抖音动画系列, Objective-C, skills]
typora-root-url: ..
---


# 前言

这几天一直跟开源的抖音demo斗智斗勇,今天跟大家分享的是抖音中或者快手中加载视频的动画 

上图看成品

![](/assets/images/20181114PlayLoadingAnimation/playloading.gif)



# 实现原理


首先我创建一个视图

``` objc
@interface ViewController ()
@property (nonatomic, strong) UIView *playLoadingView;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    //init player status bar
    self.playLoadingView = [[UIView alloc]init];
    self.playLoadingView.backgroundColor = [UIColor whiteColor];
    [self.playLoadingView setHidden:YES];
    [self.view addSubview:self.playLoadingView];
    
    //make constraintes
    [self.playLoadingView mas_makeConstraints:^(MASConstraintMaker *make) {
        make.center.equalTo(self.view);
        make.width.mas_equalTo(1.0f); //宽 1 dp
        make.height.mas_equalTo(0.5f); //高 0.5 dp
    }];
    
    [self startLoadingPlayAnimation:YES]; //调用动画代码
}

```

> 这里我们可以看到 我们实际上创建的是一个 1pt宽度 0.5 pt的宽度 的视图

紧接着动画实现的代码

``` objc
- (void)startLoadingPlayAnimation:(BOOL)isStart {
    if (isStart) {
        self.playLoadingView.backgroundColor = [UIColor whiteColor];
        self.playLoadingView.hidden = NO;
        [self.playLoadingView.layer removeAllAnimations];
        
        CAAnimationGroup *animationGroup = [[CAAnimationGroup alloc] init];
        animationGroup.duration = 0.5;
        animationGroup.beginTime = CACurrentMediaTime() + 0.5;
        animationGroup.repeatCount = MAXFLOAT;
        animationGroup.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
        
        CABasicAnimation *scaleAnimation = [CABasicAnimation animation];
        scaleAnimation.keyPath = @"transform.scale.x";
        scaleAnimation.fromValue = @(1.0f);
        scaleAnimation.toValue = @(1.0f * ScreenWidth);
        
        CABasicAnimation *alphaAnimation = [CABasicAnimation animation];
        alphaAnimation.keyPath = @"opacity";
        alphaAnimation.fromValue = @(1.0f);
        alphaAnimation.toValue = @(0.5f);
        
        [animationGroup setAnimations:@[scaleAnimation, alphaAnimation]];
        [self.playLoadingView.layer addAnimation:animationGroup forKey:nil];
    } else {
        [self.playLoadingView.layer removeAllAnimations];
        self.playLoadingView.hidden = YES;
    }
}

```

完事 就这几行代码 搞定

其实核心的只有4行代码

``` objc
CABasicAnimation *scaleAnimation = [CABasicAnimation animation];
scaleAnimation.keyPath = @"transform.scale.x";
scaleAnimation.fromValue = @(1.0f);
scaleAnimation.toValue = @(1.0f * ScreenWidth);
```

> 关键在`scaleAnimation.keyPath = @"transform.scale.x";` 这里我们要沿着x做缩放

缩放的得值从 __1~屏幕宽度__, 当然值多大自己可以控制. 

如果`@"transform.scale.y"` 则是沿着Y轴缩放

当然 如果写成`@"transform.scale"` 那就X,Y 一起缩放 大家可以试试.


# 总结

本篇的动画技巧是 缩放的 `transform.scale.y` 从一个点 做layer缩放 就会出现 加载效果.


[最后附上demo](https://github.com/sunyazhou13/PlayLoadingDemo)

感谢大家支持


