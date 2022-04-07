---
title: 手动管理UIViewController的生命周期
categories: [ios开发]
tags: [ios, macos]
date: 2018-05-08 12:01:27
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

全文完