---
layout: post
title: 手动管理UIViewController的生命周期
date: 2018-05-08 12:01:27
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
---



# 前言

话说很久不用UIViewController的不常用 的API渐渐的都没有了印象,在 iOS 客户端中，多个 childViewController 的页面是个很常见的交互设计,最早的网易新闻,今日头条等.这篇文章回味一下古老的手动控制视图控制器的生命周期的API.

# UIViewController

我们在使用`addChildViewController:`的时候会遇到个问题.如何手动控制被添加控制器的生命周期.

如下代码


``` objc
self.vc1 = [[VC1ViewController alloc] init]; //子控制器
self.vc2 = [[VC2ViewController alloc] init]; //子控制器
    
[self addChildViewController:self.vc1]; //添加到父控制器中
[self.view addSubview:self.vc1.view];   //把子控制器的 view 添加到父控制器的 view 上面
self.vc1.view.frame = CGRectMake(0, 0, 100, 100); //设置 frame
[self.vc1 didMoveToParentViewController:self];//子控制器被通知有了一个父控制器


    
[self addChildViewController:self.vc2];
[self.view addSubview:self.vc2.view];
self.vc2.view.frame = CGRectMake(0, 0, 100, 100);
[self.vc2 didMoveToParentViewController:self];//子控制器被通知有了一个父控制器
```

如果是移除的话使用如下代码

``` objc
//移除一个 childViewController
[self.vc1 willMoveToParentViewController:nil];//子控制器被通知即将解除父子关系
[self.vc1.view removeFromSuperview];//把子控制器的 view 从到父控制器的 view 上面移除
[self.vc1 removeFromParentViewController];//真正的解除关系,会自己调用 [self.vc1 didMoveToParentViewController:nil]

```


当我们添加child到父控制器的时候
它的

``` objc
- (void)viewWillAppear:(BOOL)animated{
    [super viewWillAppear:animated];
}

- (void)viewDidAppear:(BOOL)animated{
    [super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated{
    [super viewWillDisappear:animated];
    
}

- (void)viewDidDisappear:(BOOL)animated{
    [super viewDidDisappear:animated];
}
```
这些放系统内部会自动帮我们调用

#### 手动管理child ViewController 的生命周期方法

需要在父ViewController里面复写如下方法 并返回`NO`

``` objc
- (BOOL)shouldAutomaticallyForwardAppearanceMethods{
    //手动管理子VC的生命周期
    return NO;
}
```

不过我们需要注意的是，不能手动调用 viewWillAppear、viewDidAppear等等这些方法，而应该调用：

``` objc
- (void)beginAppearanceTransition:(BOOL)isAppearing animated:(BOOL)animated;
- (void)endAppearanceTransition;
```

> 注意:_**用这两个方法来间接触发子控制器的生命周期，并且它们需要成对使用**_


`isAppearing` 设置为 `YES` : 触发 `viewWillAppear:`;  

`isAppearing` 设置为 `NO` : 触发 `viewWillDisappear:`;

`endAppearanceTransition`方法会基于我们传入的`isAppearing`  
来调用`viewDidAppear:`以及`viewDidDisappear:`方法



为了测试我写一段代码

``` objc
- (IBAction)click:(UIButton *)sender {
    sender.selected = !sender.selected;
    if (sender.selected) {
        [self.vc1 beginAppearanceTransition:NO animated:YES];  //调用vc1的 viewWillDisappear:
        [self.vc2 beginAppearanceTransition:YES animated:YES];  //调用vc2的 viewWillAppear:
        [self.vc1 endAppearanceTransition]; //调用vc1的viewDidDisappear: 
        [self.vc2 endAppearanceTransition]; //调用vc2的viewDidAppear:
    } else {
        [self.vc1 beginAppearanceTransition:YES animated:YES];
        [self.vc2 beginAppearanceTransition:NO animated:YES];
        [self.vc1 endAppearanceTransition];
        [self.vc2 endAppearanceTransition];
    }
}

```

[Demo](https://github.com/sunyazhou13/VCLifeCycle)


#### 常用的切换动画 

`transitionFromViewController:toViewController:duration:options:animations:completion: `是自定义容器控制器在两个子控制器之间切换的“官方推荐”方式。它会自动帮你正确转发生命周期（`viewWill`/`DidAppear`/`Disappear`），你就不需要再手动调用 `beginAppearanceTransition`/`endAppearanceTransition`。

最小可用范式（fromVC 已经是当前显示的子控制器，toVC 是将要切换到的子控制器）：

``` objc
- (void)switchFrom:(UIViewController *)fromVC to:(UIViewController *)toVC 
{
    if (fromVC == toVC) return;

    // 1) 父子关系准备
    [fromVC willMoveToParentViewController:nil]; // 即将移除旧的
    [self addChildViewController:toVC];          // 先把新的加为子控制器

    // 2) 视图大小/位置准备（重要）
    toVC.view.frame = self.containerView.bounds; // 或者设置自动布局约束
    // 若用 Auto Layout，通常先设 frame，完成后再补约束

    // 3) 切换（系统会自动处理 appearance 生命周期）
    [self transitionFromViewController:fromVC
                      toViewController:toVC
                              duration:0.25
                               options:UIViewAnimationOptionTransitionCrossDissolve
                            animations:^{
                                // 可选：额外动画，如布局变化、alpha、transform 等
                                // [self.containerView layoutIfNeeded];
                            }
                            completion:^(BOOL finished) {
                                // 4) 完成父子关系变更
                                [toVC didMoveToParentViewController:self];
                                [fromVC removeFromParentViewController];

                                self.currentVC = toVC;
                            }];
}
```


##### 关键点说明

**使用场景** 

这是“自定义容器控制器”里在两个子控制器之间切换的工具方法。比如类似自研的 Tab 切换、分页内容切换等。

**生命周期**

该方法会自动按时机调用 fromVC 的消失、toVC 的出现相关回调（viewWill/DidDisappear/Appear），不要再手动写 beginAppearanceTransition/endAppearanceTransition，否则会重复触发。

**父子关系调用顺序** 

在切换前：对旧控制器调用 willMoveToParentViewController:nil；对新控制器先调用 addChildViewController:。

在 `completion` 里：对新控制器调用 `didMoveToParentViewController:self`；对旧控制器调用 `removeFromParentViewController`。

**视图层级与大小** 

在调用前给 toVC.view 设置好最终大小（frame）或准备好约束。transitionFrom 会把 toVC.view 插入到 fromVC.view 的父视图中，并在完成时移除 fromVC.view（不需要你手动 addSubview/removeFromSuperview）。

**若使用 Auto Layout，常见做法：**

简单方案：先用 frame 切换，完成后再补充/更新 toVC.view 的约束。
或者使用 `UIViewAnimationOptionShowHideTransitionViews` 选项，提前把两个子视图都加到同一容器并设好约束，切换时系统只做 show/hide，但这需要你在切换前就把视图安装好。
options 常用取值

* UIViewAnimationOptionTransitionCrossDissolve：淡入淡出
* UIViewAnimationOptionTransitionFlipFromLeft/Right：翻转
* UIViewAnimationOptionCurveEaseInOut 等：动画曲线
* UIViewAnimationOptionShowHideTransitionViews：只切换 hidden 属性（两视图需同层级且都已在父视图）


`animations` 块 可在里面做额外的布局或视觉变化（alpha、transform、约束变化后 layoutIfNeeded 等）。如果只是简单过渡，也可以留空。  

易错点
fromVC 必须已经是 self 的子控制器；toVC 需要先 addChild 再调用 transitionFrom，否则会崩溃或无效果。

不要再手动触发生命周期

全文完