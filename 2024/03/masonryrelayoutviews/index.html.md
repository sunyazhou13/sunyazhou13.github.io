---
layout: post
title: 使用Masonry高阶方法对子视图统一布局
date: 2024-03-22 13:24 +0000
categories: [iOS, SwiftUI]
tags: [iOS,iPadOS,watchOS, SwiftUI,Masonry]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 背景介绍


![](/assets/images/20240322MasonryRelayoutViews/MasonryRelayout.gif)

在开发过程中,经常遇到某些入口的出现和消失不是按照指定的时序发生,比如 上面这三个入口,出现的时机不区分先后,但是出现的顺序是固定的, 这里就存在一些很不好处理的问题, 比如A视图出现 依赖B视图的位置,如果B不在那要继续向上或者向下依赖. 

## 面临的挑战案例

基于上述的背景描述,我们需要处理的问题如下

* 假设 入口视图的出现时机或者消失时机, 不是时序顺序的,是时序随机的.
* 各个入口视图的有依赖关系, 或者顺序固定 要如何处理
* 有没有简单更有效的方式 使用少量代码解决上述问题的最优解.

根据上述的挑战我们来分析一下如何解决

* 要给所有入口视图添加优先级, 添加和删除都需要排序
* 各种视图添加的时间是不固定的,那么就要有一个公用的方法控制他们添加和移除或者说是显示和消失都必须要调用的方法用于布局
* 基于简单的Masonry代码能不能 几行搞定.

### 最优解的方式实现

首先我们先封装一个UIView的子类,对外提供各种入口的show和dismiss方法.内部要对这些入口添加或者消失的时候调用relayout的函数方法. relayout方法中要对现有的视图进行排序. 然后统一用Masonry提供的方法解决布局问题.

``` objc
typedef NS_ENUM(NSUInteger, MTContainerViewPriority) {
    MTContainerViewPriorityL1 = 101,
    MTContainerViewPriorityL2 = 102,
    MTContainerViewPriorityL3 = 103,
    //more ...
};

@interface MTContainerView : UIView

- (void)showView1;
- (void)dismissView1;

- (void)showView2;
- (void)dimissView2;

- (void)showView3;
- (void)dismissView3;

@end
```

实现文件

``` objc
#import "MTContainerView.h"
#import <Masonry/Masonry.h>

const CGSize MTContainerSize = { 40 , 40};

@interface MTContainerView ()

@property (nonatomic, strong) UIView *view1;
@property (nonatomic, strong) UIView *view2;
@property (nonatomic, strong) UIView *view3;

@end

@implementation MTContainerView

#pragma mark -
#pragma mark - private methods 私有方法
- (void)layoutAllEntryViewsIfNeeded
{
    NSSortDescriptor *ascendingSort = [[NSSortDescriptor alloc] initWithKey:@"tag" ascending:YES];
    NSArray <UIView *> *allEntries = [[self subviews] sortedArrayUsingDescriptors:[NSArray arrayWithObject:ascendingSort]];
    if (allEntries.count == 0) { return; }
    if (allEntries.count == 1) {
        UIView *entryView = [allEntries objectAtIndex:0];
        [entryView mas_remakeConstraints:^(MASConstraintMaker *make) {
            make.size.mas_equalTo(MTContainerSize);
            make.right.equalTo(self.mas_right).offset(-10);
            make.centerY.equalTo(self.mas_centerY);
        }];
    } else {
        // 使用 mas_distributeViewsAlongAxis 方法对三个视图进行水平右对齐并一次排开
        [allEntries mas_remakeConstraints:^(MASConstraintMaker *make) {
            make.size.mas_equalTo(MTContainerSize);
            make.centerY.equalTo(self.mas_centerY);
        }];
        //必须 allEntries.count >= 2 才能用下述方法, 下面间距算法 容器宽度-所用容量宽度(包含右侧间隙+每个item大小+每个item之间的间隙)
        CGFloat leadSpace = CGRectGetWidth(self.frame) - allEntries.count * MTContainerSize.width - 10 - (allEntries.count - 1) * 10;
        [allEntries mas_distributeViewsAlongAxis:MASAxisTypeHorizontal withFixedSpacing:10 leadSpacing:leadSpace tailSpacing:10];
    }
    [UIView animateWithDuration:0.3 animations:^{
        [self layoutIfNeeded];
    }];
}

- (UIColor *)randomColor
{
    CGFloat hue = ( arc4random() % 256 / 256.0 );  //  0.0 to 1.0
    CGFloat saturation = ( arc4random() % 128 / 256.0 ) + 0.5;  //  0.5 to 1.0, away from white
    CGFloat brightness = ( arc4random() % 128 / 256.0 ) + 0.5;  //  0.5 to 1.0, away from black
    UIColor *color = [UIColor colorWithHue:hue saturation:saturation brightness:brightness alpha:1];
    return color;
}

#pragma mark -
#pragma mark - public methods 公有方法
- (void)showView1
{
    if (self.view1 == nil) {
        self.view1 = [[UIView alloc] initWithFrame:CGRectMake(CGRectGetWidth(UIScreen.mainScreen.bounds), 20, MTContainerSize.width, MTContainerSize.height)];
        self.view1.backgroundColor = [self randomColor];
        self.view1.tag = MTContainerViewPriorityL1;
    }
    if (self.view1.superview == nil) {
        [self addSubview:self.view1];
    }
    [self layoutAllEntryViewsIfNeeded];
}

- (void)dismissView1
{
    if (self.view1.superview) {
        [self.view1 removeFromSuperview];
    }
    self.view1 = nil;
    [self layoutAllEntryViewsIfNeeded];
}

- (void)showView2
{
    if (self.view2 == nil) {
        self.view2 = [[UIView alloc] initWithFrame:CGRectMake(CGRectGetWidth(UIScreen.mainScreen.bounds), 20, MTContainerSize.width, MTContainerSize.height)];
        self.view2.backgroundColor = [self randomColor];
        self.view2.tag = MTContainerViewPriorityL2;
    }
    if (self.view2.superview == nil) {
        [self addSubview:self.view2];
    }
    [self layoutAllEntryViewsIfNeeded];
}

- (void)dimissView2
{
    if (self.view2.superview) {
        [self.view2 removeFromSuperview];
    }
    self.view2 = nil;
    [self layoutAllEntryViewsIfNeeded];
}

- (void)showView3
{
    if (self.view3 == nil) {
        self.view3 = [[UIView alloc] initWithFrame:CGRectMake(CGRectGetWidth(UIScreen.mainScreen.bounds), 20, MTContainerSize.width, MTContainerSize.height)];
        self.view3.backgroundColor = [self randomColor];
        self.view3.tag = MTContainerViewPriorityL3;
    }
    if (self.view3.superview == nil) {
        [self addSubview:self.view3];
    }
    [self layoutAllEntryViewsIfNeeded];
}

- (void)dismissView3
{
    if (self.view3.superview) {
        [self.view3 removeFromSuperview];
    }
    self.view3 = nil;
    [self layoutAllEntryViewsIfNeeded];
}
 
@end
```


这里我们模拟不按顺序 不同时序 添加视图

``` objc
- (void)viewDidLoad {
    [super viewDidLoad];
    
    self.continerView = [[MTContainerView alloc] initWithFrame:CGRectZero];
    self.continerView.backgroundColor = [UIColor cyanColor];
    [self.view addSubview:self.continerView];
    
    [self.continerView mas_remakeConstraints:^(MASConstraintMaker *make) {
        make.left.right.equalTo(self.view);
        make.top.mas_equalTo(self.mas_topLayoutGuideBottom);
        make.height.equalTo(@60);
    }];
    
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(3 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self.continerView showView3];
    });
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(4 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self.continerView showView1];
    });
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(7 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self.continerView showView2];
    });
}

```

## 核心实现代码

``` objc
- (void)layoutAllEntryViewsIfNeeded
{
    NSSortDescriptor *ascendingSort = [[NSSortDescriptor alloc] initWithKey:@"tag" ascending:YES];
    NSArray <UIView *> *allEntries = [[self subviews] sortedArrayUsingDescriptors:[NSArray arrayWithObject:ascendingSort]];
    if (allEntries.count == 0) { return; }
    if (allEntries.count == 1) {
        UIView *entryView = [allEntries objectAtIndex:0];
        [entryView mas_remakeConstraints:^(MASConstraintMaker *make) {
            make.size.mas_equalTo(MTContainerSize);
            make.right.equalTo(self.mas_right).offset(-10);
            make.centerY.equalTo(self.mas_centerY);
        }];
    } else {
        // 使用 mas_distributeViewsAlongAxis 方法对三个视图进行水平右对齐并一次排开
        [allEntries mas_remakeConstraints:^(MASConstraintMaker *make) {
            make.size.mas_equalTo(MTContainerSize);
            make.centerY.equalTo(self.mas_centerY);
        }];
        //必须 allEntries.count >= 2 才能用下述方法, 下面间距算法 容器宽度-所用容量宽度(包含右侧间隙+每个item大小+每个item之间的间隙)
        CGFloat leadSpace = CGRectGetWidth(self.frame) - allEntries.count * MTContainerSize.width - 10 - (allEntries.count - 1) * 10;
        [allEntries mas_distributeViewsAlongAxis:MASAxisTypeHorizontal withFixedSpacing:10 leadSpacing:leadSpace tailSpacing:10];
    }
    [UIView animateWithDuration:0.3 animations:^{
        [self layoutIfNeeded];
    }];
}
```

这里有几个问题需要说清楚

* mas_makeConstraints 是Masonry给NSArray扩展的方法.用于批量处理视图使用,它必须保证NSArray.count > 1
* 统一布局 实现的是固定大小, 如果要实现 多个视图不同大小,那目前这种方式不适用
* Masonry没有像ArkUI和SwiftUI中声明式编程,那种容器对齐的方式,比如 start、center、end等内容对齐.所以会看到有如下代码

``` objc
CGFloat leadSpace = CGRectGetWidth(self.frame) - allEntries.count * MTContainerSize.width - 10 - (allEntries.count - 1) * 10;
[allEntries mas_distributeViewsAlongAxis:MASAxisTypeHorizontal withFixedSpacing:10 leadSpacing:leadSpace tailSpacing:10];
```

计算`leadSpace`左侧向右的偏移距离.

通过上述实现我们就有了如下的demo

![](/assets/images/20240322MasonryRelayoutViews/MasonryRelayoutDemo.gif)

这里的核心代码是Masonry提供的数组扩展方法

``` objc
- (NSArray *)mas_makeConstraints:(void(^)(MASConstraintMaker *))block {
    self.translatesAutoresizingMaskIntoConstraints = NO;
    MASConstraintMaker *constraintMaker = [[MASConstraintMaker alloc] initWithView:self];
    block(constraintMaker);
    return [constraintMaker install];
}

- (void)mas_distributeViewsAlongAxis:(MASAxisType)axisType withFixedSpacing:(CGFloat)fixedSpacing leadSpacing:(CGFloat)leadSpacing tailSpacing:(CGFloat)tailSpacing;

- (void)mas_distributeViewsAlongAxis:(MASAxisType)axisType withFixedItemLength:(CGFloat)fixedItemLength leadSpacing:(CGFloat)leadSpacing tailSpacing:(CGFloat)tailSpacing;

```

以上三个方法是实现上述视图的关键


# 总结

深入了解Masonry的api使用.用高阶用法实现复杂的功能.

[本文demo 点击下载](https://github.com/sunyazhou13/MasonryRelayoutDemo)