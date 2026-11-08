---
layout: post
title: iOS Video Loading Animation
date: 2018-11-14 14:14:39
categories: [iOS]
tags: [iOS, 动画, 抖音动画系列, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

I've spent the past few days wrestling with the open-source TikTok (Douyin) demo. Today I'm sharing the video loading animation used in TikTok or Kuaishou.

Here's the finished result:

![playloading](/assets/images/20181114PlayLoadingAnimation/playloading.avif)



# How It Works


First, I create a view:

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

> As you can see, what we actually create is a view 1 pt wide and 0.5 pt tall.

Next, the animation implementation code:

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

That's it — just those few lines and you're done.

Actually, the core is only 4 lines of code:

``` objc
CABasicAnimation *scaleAnimation = [CABasicAnimation animation];
scaleAnimation.keyPath = @"transform.scale.x";
scaleAnimation.fromValue = @(1.0f);
scaleAnimation.toValue = @(1.0f * ScreenWidth);
```

> The key is `scaleAnimation.keyPath = @"transform.scale.x";` — here we want to scale along the x-axis.

The scale value goes from __1 to screen width__ — of course, you can control how large the value gets.

If you use `@"transform.scale.y"`, it scales along the Y-axis.

And if you write `@"transform.scale"`, it scales on both X and Y — give it a try.


# Summary

The animation technique in this post is scaling via `transform.scale.y`: scaling the layer from a single point produces the loading effect.


[Finally, here's the demo](https://github.com/sunyazhou13/PlayLoadingDemo)

Thanks for your support


