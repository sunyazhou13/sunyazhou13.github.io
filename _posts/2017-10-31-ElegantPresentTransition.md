---
title: 论一个优雅的模态转场的自我修养
categories: [ios开发]
tags: [ios, macos]
date: 2017-10-31 11:32:17
---




# 前言

在开发过程中虽然 UI 这个活很没技术含量,但有时候还是需要做些的特别的转场效果.本教程参考[UIPresentationController Tutorial: Getting Started](https://www.raywenderlich.com/139277/uipresentationcontroller-tutorial-getting-started) 这篇博文进行 OC 版翻译 也加入了一些小改动

> swift 点这里下载[demo](https://koenig-media.raywenderlich.com/uploads/2016/08/Medal_Count_Completed.zip)  
> Objective-C 点击这里直达[demo](https://github.com/sunyazhou13/SlideInPresentation)


![](/assets/images/20171031ElegantPresentTransition/ElegantPresentTransition.gif)


### 需求背景

转场对目前的 iOS 来讲已经不能再熟悉了 但想找个靠谱点的带遮盖的转场 没找到几个靠谱的

不是这个问题不行就那个问题不能满足 


![](/assets/images/20171031ElegantPresentTransition/demo1.png)


根据`Raywenderrich`的教程 我翻译成了 OC 版本 并加了一些小改动 



### 如何使用

* 导入头文件
 
``` objc
#import "SlideInPresentationManager.h"

```

* 声明属性

``` objc
@property (nonatomic, strong) SlideInPresentationManager *slideInTransitioningDelegate;
```

* 弹出模态控制器的时候如下代码

``` objc
- (IBAction)presentAction:(UIButton *)sender {
    PresentationDirection direction;
    if (sender.tag == 100) {
        NSLog(@"左侧弹出模态转场");
        direction = PresentationDirectionLeft;
    } else if (sender.tag == 101) {
        NSLog(@"上弹出模态转场");
        direction = PresentationDirectionTop;
    } else if (sender.tag == 102) {
        NSLog(@"右弹出模态转场");
        direction = PresentationDirectionRight;
    } else {
        NSLog(@"下弹出模态转场");
        direction = PresentationDirectionBottom;
    }
    
    self.slideInTransitioningDelegate = nil;
    //控制现实遮盖的视图转场(core 代码)
    self.slideInTransitioningDelegate = [[SlideInPresentationManager alloc] init];
    self.slideInTransitioningDelegate.direction = direction;
    self.slideInTransitioningDelegate.disableCompactHeight = NO;
    self.slideInTransitioningDelegate.sliderRate = 1.0/3.0;
    
    //创建控制器实例
    PresentController *presentVC = [[PresentController alloc] initWithNibName:@"PresentController" bundle:[NSBundle mainBundle]];
    presentVC.transitioningDelegate = self.slideInTransitioningDelegate;
    presentVC.modalPresentationStyle = UIModalPresentationCustom;
    [self presentViewController:presentVC animated:YES completion:nil];
}


``` 


剩下的就可以愉快的玩耍了 

