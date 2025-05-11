---
layout: post
title: UITraitCollection详解
date: 2019-09-16 18:49:05
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..
---


![](/assets/images/20190916UITraitCollection/UITraitCollection1.webp)

# 前言


本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 先说问题

最近在适配iOS13 有个`Dark Mode`的暗黑模式, 为了适配这个模式不得不在UIView和UIViewController以及UIWindow中复写如下方法

``` objc
- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection {
    [super traitCollectionDidChange:previousTraitCollection];
}

```

这里有个`UITraitCollection`的类以前从来没有仔细研究,今天详细研究一下.

> Trait 特性 特点


显然 这个类是一个UIKit中用于处理苹果手机的一些特性的储存与UI相关的配置, 大家有没有想过如果你在iOS修改通用中的某些系统设置,比如(下图) 对比度、全局字体大小,这个我们开发人员怎么处理.

![](/assets/images/20190916UITraitCollection/UITraitCollection2.gif)


这些系统的特性修改就放到这个`UITraitCollection`中,这个类也就是我们经常在VC和View中经常用到而大家往往容易忽略的,下面简单记录一下这些特性都有哪些



## UITraitCollection API介绍

#### 判断当前设备时 iPhone/iPad/tv/carPlay 的配置

``` objc
+ (UITraitCollection *)traitCollectionWithUserInterfaceIdiom:(UIUserInterfaceIdiom)idiom;
@property (nonatomic, readonly) UIUserInterfaceIdiom userInterfaceIdiom; // unspecified: UIUserInterfaceIdiomUnspecified
```

#### 关于布局方向的配置

``` objc
+ (UITraitCollection *)traitCollectionWithLayoutDirection:(UITraitEnvironmentLayoutDirection)layoutDirection API_AVAILABLE(ios(10.0));
@property (nonatomic, readonly) UITraitEnvironmentLayoutDirection layoutDirection API_AVAILABLE(ios(10.0)); // unspecified: UITraitEnvironmentLayoutDirectionUnspecified
```

#### 图片 Scale 的配置

``` objc
+ (UITraitCollection *)traitCollectionWithDisplayScale:(CGFloat)scale;
@property (nonatomic, readonly) CGFloat displayScale; // unspecified: 0.0
```

#### 布局 Size Class 的配置

``` objc
+ (UITraitCollection *)traitCollectionWithHorizontalSizeClass:(UIUserInterfaceSizeClass)horizontalSizeClass;
@property (nonatomic, readonly) UIUserInterfaceSizeClass horizontalSizeClass; // unspecified: UIUserInterfaceSizeClassUnspecified

+ (UITraitCollection *)traitCollectionWithVerticalSizeClass:(UIUserInterfaceSizeClass)verticalSizeClass;
@property (nonatomic, readonly) UIUserInterfaceSizeClass verticalSizeClass; // unspecified: UIUserInterfaceSizeClassUnspecified

```

####  Force Touch 是否可用的配置

``` objc
+ (UITraitCollection *)traitCollectionWithForceTouchCapability:(UIForceTouchCapability)capability API_AVAILABLE(ios(9.0));
@property (nonatomic, readonly) UIForceTouchCapability forceTouchCapability API_AVAILABLE(ios(9.0)); // unspecified: UIForceTouchCapabilityUnknown
```

#### 全局字体大小的配置

``` objc
+ (UITraitCollection *)traitCollectionWithPreferredContentSizeCategory:(UIContentSizeCategory)preferredContentSizeCategory API_AVAILABLE(ios(10.0));
@property (nonatomic, copy, readonly) UIContentSizeCategory preferredContentSizeCategory API_AVAILABLE(ios(10.0)); // unspecified: UIContentSizeCategoryUnspecified

```
 
#### 色域的配置

``` objc

+ (UITraitCollection *)traitCollectionWithDisplayGamut:(UIDisplayGamut)displayGamut API_AVAILABLE(ios(10.0));
@property (nonatomic, readonly) UIDisplayGamut displayGamut API_AVAILABLE(ios(10.0)); // unspecified: UIDisplayGamutUnspecified

```

#### 是否开启高对比度的配置

``` objc
+ (UITraitCollection *)traitCollectionWithAccessibilityContrast:(UIAccessibilityContrast)accessibilityContrast API_AVAILABLE(ios(13.0), tvos(13.0)) API_UNAVAILABLE(watchos);
@property (nonatomic, readonly) UIAccessibilityContrast accessibilityContrast API_AVAILABLE(ios(13.0), tvos(13.0)) API_UNAVAILABLE(watchos); // unspecified: UIAccessibilityContrastUnspecified
```

#### 全局字重的配置

``` objc
+ (UITraitCollection *)traitCollectionWithLegibilityWeight:(UILegibilityWeight)legibilityWeight API_AVAILABLE(ios(13.0), tvos(13.0), watchos(6.0));
@property (nonatomic, readonly) UILegibilityWeight legibilityWeight API_AVAILABLE(ios(13.0), tvos(13.0), watchos(6.0)); // unspecified: UILegibilityWeightUnspecified
```

#### 主题的配置

``` objc
+ (UITraitCollection *)traitCollectionWithUserInterfaceStyle:(UIUserInterfaceStyle)userInterfaceStyle API_AVAILABLE(tvos(10.0)) API_AVAILABLE(ios(12.0)) API_UNAVAILABLE(watchos);
@property (nonatomic, readonly) UIUserInterfaceStyle userInterfaceStyle API_AVAILABLE(tvos(10.0)) API_AVAILABLE(ios(12.0)) API_UNAVAILABLE(watchos); // unspecified: UIUserInterfaceStyleUnspecified
```

### 如何获取 UITraitCollection

`UITraitCollection`本身是一个配置的集合，每个 `UIView`/`UIViewController`都有自己的 `UITraitCollection`对象，并将自己的`UITraitCollection`传递给子`UIView`/`UIViewController`作为默认值。

* 可以通过  `UIView`/`UIViewController`的属性 `traitCollection` 获取到当前视图的 UITraitCollection 对象

``` objc
- (void)viewDidLoad {
    [super viewDidLoad];
    self.traitCollection //拿到当前得
}
```

* 可以通过子类重写如下方法的方式监控 traitCollection 属性的变化

``` objc
- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection {
    [super traitCollectionDidChange:previousTraitCollection];
}

```

* 获取全局的`UITraitCollection`

``` objc
[UITraitCollection currentTraitCollection];
```



## 技巧

如果要在UIViewController中更新状态栏 当设置完style的时候可以调用

``` objc
[self setNeedsStatusBarAppearanceUpdate];
```


# 总结


通过简单的学习`UITraitCollection`又深刻学习了一下这个类,希望以后能记录一下学过的知识.
