---
layout: post
title: UITraitCollection in Detail
date: 2019-09-16 18:49:05
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..
math: false
mermaid: false

---


![UI Trait Collection](/assets/images/20190916UITraitCollection/UITraitCollection1.avif)

# Preface


This article carries strong personal sentiment. If it makes you uncomfortable, please close it as soon as possible. This article is only for personal study records. Reprinting or sharing within the scope of the license is also welcome. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


## Let's Talk About the Problem First

Recently, while adapting to iOS 13 with its `Dark Mode`, I had to override the following method in UIView, UIViewController, and UIWindow to adapt to this mode

``` objc
- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection {
    [super traitCollectionDidChange:previousTraitCollection];
}

```

There's a class called `UITraitCollection` here that I'd never studied carefully before. Today, let's study it in detail.

> Trait: characteristic, feature


In short, this UIKit class stores device characteristics and related UI configuration. Have you ever wondered how we developers handle it when you modify certain system settings in iOS's General, such as (see below) contrast and global font size?

![UI Trait Collection](/assets/images/20190916UITraitCollection/UITraitCollection2.avif)


These system characteristic changes are stored in `UITraitCollection`. This is a class we often use in VCs and Views but easily overlook. Below, I'll briefly record what these characteristics are.



## UITraitCollection API Introduction

#### Configuration for determining whether the current device is iPhone/iPad/tv/carPlay

``` objc
+ (UITraitCollection *)traitCollectionWithUserInterfaceIdiom:(UIUserInterfaceIdiom)idiom;
@property (nonatomic, readonly) UIUserInterfaceIdiom userInterfaceIdiom; // unspecified: UIUserInterfaceIdiomUnspecified
```

#### Configuration for layout direction

``` objc
+ (UITraitCollection *)traitCollectionWithLayoutDirection:(UITraitEnvironmentLayoutDirection)layoutDirection API_AVAILABLE(ios(10.0));
@property (nonatomic, readonly) UITraitEnvironmentLayoutDirection layoutDirection API_AVAILABLE(ios(10.0)); // unspecified: UITraitEnvironmentLayoutDirectionUnspecified
```

#### Configuration for image Scale

``` objc
+ (UITraitCollection *)traitCollectionWithDisplayScale:(CGFloat)scale;
@property (nonatomic, readonly) CGFloat displayScale; // unspecified: 0.0
```

#### Configuration for layout Size Class

``` objc
+ (UITraitCollection *)traitCollectionWithHorizontalSizeClass:(UIUserInterfaceSizeClass)horizontalSizeClass;
@property (nonatomic, readonly) UIUserInterfaceSizeClass horizontalSizeClass; // unspecified: UIUserInterfaceSizeClassUnspecified

+ (UITraitCollection *)traitCollectionWithVerticalSizeClass:(UIUserInterfaceSizeClass)verticalSizeClass;
@property (nonatomic, readonly) UIUserInterfaceSizeClass verticalSizeClass; // unspecified: UIUserInterfaceSizeClassUnspecified

```

#### Configuration for whether Force Touch is available

``` objc
+ (UITraitCollection *)traitCollectionWithForceTouchCapability:(UIForceTouchCapability)capability API_AVAILABLE(ios(9.0));
@property (nonatomic, readonly) UIForceTouchCapability forceTouchCapability API_AVAILABLE(ios(9.0)); // unspecified: UIForceTouchCapabilityUnknown
```

#### Configuration for the global font size

``` objc
+ (UITraitCollection *)traitCollectionWithPreferredContentSizeCategory:(UIContentSizeCategory)preferredContentSizeCategory API_AVAILABLE(ios(10.0));
@property (nonatomic, copy, readonly) UIContentSizeCategory preferredContentSizeCategory API_AVAILABLE(ios(10.0)); // unspecified: UIContentSizeCategoryUnspecified

```
 
#### Configuration for the display gamut

``` objc

+ (UITraitCollection *)traitCollectionWithDisplayGamut:(UIDisplayGamut)displayGamut API_AVAILABLE(ios(10.0));
@property (nonatomic, readonly) UIDisplayGamut displayGamut API_AVAILABLE(ios(10.0)); // unspecified: UIDisplayGamutUnspecified

```

#### Configuration for whether high contrast is enabled

``` objc
+ (UITraitCollection *)traitCollectionWithAccessibilityContrast:(UIAccessibilityContrast)accessibilityContrast API_AVAILABLE(ios(13.0), tvos(13.0)) API_UNAVAILABLE(watchos);
@property (nonatomic, readonly) UIAccessibilityContrast accessibilityContrast API_AVAILABLE(ios(13.0), tvos(13.0)) API_UNAVAILABLE(watchos); // unspecified: UIAccessibilityContrastUnspecified
```

#### Configuration for the global legibility weight

``` objc
+ (UITraitCollection *)traitCollectionWithLegibilityWeight:(UILegibilityWeight)legibilityWeight API_AVAILABLE(ios(13.0), tvos(13.0), watchos(6.0));
@property (nonatomic, readonly) UILegibilityWeight legibilityWeight API_AVAILABLE(ios(13.0), tvos(13.0), watchos(6.0)); // unspecified: UILegibilityWeightUnspecified
```

#### Configuration for the user interface style

``` objc
+ (UITraitCollection *)traitCollectionWithUserInterfaceStyle:(UIUserInterfaceStyle)userInterfaceStyle API_AVAILABLE(tvos(10.0)) API_AVAILABLE(ios(12.0)) API_UNAVAILABLE(watchos);
@property (nonatomic, readonly) UIUserInterfaceStyle userInterfaceStyle API_AVAILABLE(tvos(10.0)) API_AVAILABLE(ios(12.0)) API_UNAVAILABLE(watchos); // unspecified: UIUserInterfaceStyleUnspecified
```

### How to Get the UITraitCollection

`UITraitCollection` itself is a collection of configurations. Each `UIView`/`UIViewController` has its own `UITraitCollection` object and passes its own `UITraitCollection` to child `UIView`s/`UIViewController`s as the default value.

* You can get the current view's UITraitCollection object via the `traitCollection` property of `UIView`/`UIViewController`

``` objc
- (void)viewDidLoad {
    [super viewDidLoad];
    self.traitCollection //拿到当前得
}
```

* You can monitor changes to the traitCollection property by overriding the following method in a subclass

``` objc
- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection {
    [super traitCollectionDidChange:previousTraitCollection];
}

```

* Get the global `UITraitCollection`

``` objc
[UITraitCollection currentTraitCollection];
```



## Tips

If you want to update the status bar in a UIViewController, after setting the style you can call

``` objc
[self setNeedsStatusBarAppearanceUpdate];
```


# Summary


Through a simple study of `UITraitCollection`, I've gained a deeper understanding of this class. I hope to keep recording the knowledge I've learned in the future.
