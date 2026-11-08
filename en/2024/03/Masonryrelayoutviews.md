---
layout: post
title: Using Masonry Advanced Methods to Lay Out Subviews Uniformly
date: 2024-03-22 13:24 +0000
categories: [iOS, SwiftUI]
tags: [iOS,iPadOS,watchOS, SwiftUI,Masonry]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

This article carries strong personal feelings. If you feel uncomfortable reading it, please close it as soon as possible. This article is only for personal learning records. Reposting or sharing within the scope of the license is welcome. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you think this site can help you, you can subscribe to this site via RSS. Thanks for your support!


## Background


![Masonry Relayout](/assets/images/20240322MasonryRelayoutViews/MasonryRelayout.avif)

During development, we often encounter situations where certain entries appear or disappear not in a specified time order. For example, for the three entries above, the appearance timings don't follow a particular sequence, but the order of appearance is fixed. This creates some difficult problems, such as view A's appearance depending on view B's position; if B isn't there, the dependency continues upward or downward.

## The Challenges We Face

Given the background above, here are the problems we need to solve:

* Assume the appearance or disappearance timing of the entry views is not sequential, but random.
* Each entry view has dependencies, or a fixed order — how should this be handled?
* Is there a simpler, more effective way to solve the above problems with a minimal amount of code?

Based on the challenges above, let's analyze how to solve them

* All entry views need priorities; both adding and removing need to be sorted
* The timing at which views are added is not fixed, so there must be a common method controlling their addition/removal — or rather, a method that must be called for both showing and hiding, used for layout
* Can it be done in just a few lines with simple Masonry code?

### The Optimal Implementation

First, let's wrap a UIView subclass that exposes show and dismiss methods for each entry to the outside. Internally, whenever these entries are added or removed, a relayout function must be called. The relayout method sorts the existing views, then uniformly uses the methods Masonry provides to solve the layout problem.

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

The implementation file

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
#pragma mark - private methods
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
        // Use mas_distributeViewsAlongAxis to align the three views horizontally to the right and spread them out
        [allEntries mas_remakeConstraints:^(MASConstraintMaker *make) {
            make.size.mas_equalTo(MTContainerSize);
            make.centerY.equalTo(self.mas_centerY);
        }];
        // allEntries.count >= 2 is required for the method below. The spacing formula: container width - used width (including right gap + each item's size + gaps between items)
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
#pragma mark - public methods
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


Here we simulate adding views in no particular order and at different timings

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

## Core Implementation Code

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
        // Use mas_distributeViewsAlongAxis to align the three views horizontally to the right and spread them out
        [allEntries mas_remakeConstraints:^(MASConstraintMaker *make) {
            make.size.mas_equalTo(MTContainerSize);
            make.centerY.equalTo(self.mas_centerY);
        }];
        // allEntries.count >= 2 is required for the method below. The spacing formula: container width - used width (including right gap + each item's size + gaps between items)
        CGFloat leadSpace = CGRectGetWidth(self.frame) - allEntries.count * MTContainerSize.width - 10 - (allEntries.count - 1) * 10;
        [allEntries mas_distributeViewsAlongAxis:MASAxisTypeHorizontal withFixedSpacing:10 leadSpacing:leadSpace tailSpacing:10];
    }
    [UIView animateWithDuration:0.3 animations:^{
        [self layoutIfNeeded];
    }];
}
```

There are a few things that need to be made clear here

* mas_makeConstraints is a method Masonry extends for NSArray, used for batch processing of views. It requires NSArray.count > 1
* The uniform layout here implements a fixed size. If you need multiple views of different sizes, this approach doesn't apply
* Masonry doesn't have the declarative programming found in ArkUI and SwiftUI, with container alignment like start, center, end. That's why you see code like the following

``` objc
CGFloat leadSpace = CGRectGetWidth(self.frame) - allEntries.count * MTContainerSize.width - 10 - (allEntries.count - 1) * 10;
[allEntries mas_distributeViewsAlongAxis:MASAxisTypeHorizontal withFixedSpacing:10 leadSpacing:leadSpace tailSpacing:10];
```

Calculating the offset distance of `leadSpace` from the left to the right.

Through the above implementation, we get the following demo

![Masonry Relayout Demo](/assets/images/20240322MasonryRelayoutViews/MasonryRelayoutDemo.avif)

The core code here is Masonry's array extension methods

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

The three methods above are the key to implementing the views described earlier


# Summary

Understand Masonry's API usage in depth. Use advanced usage to implement complex features.

[Demo for this article — click to download](https://github.com/sunyazhou13/MasonryRelayoutDemo)
