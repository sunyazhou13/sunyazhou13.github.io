---
layout: post
title: String Enums in iOS Development
date: 2022-08-22 19:23 +0800
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false


---


# Preface

This article carries a strong personal tone. If you find it uncomfortable to read, please close it immediately. This article is intended only as a personal study record. You are welcome to repost or share it within the scope of the license—please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!



# Enums


In `Objective-C`, there is no dedicated type for defining string enums. The enums we commonly use are integer-based and auto-increment by +1.

``` objc
typedef NS_ENUM(NSInteger, YZAnimationType) {
    YZAnimationTypeDefault = 0,
    YZAnimationType1       = 1,
    YZAnimationType2       = 2,
    YZAnimationType3       = 3,
    YZAnimationType4       = 4,
    YZAnimationTypeCount,
};
```

C++ has dedicated enum classes, but Objective-C in iOS does not have the equivalent of C++ enum classes. Today let's learn about an enum type defined using constant string literals.

Let's create a new class called `YZEnumConst.h` and write the following code:

``` objc
#import <Foundation/Foundation.h>

typedef NSString * const kComponentMessage NS_STRING_ENUM;
FOUNDATION_EXPORT kComponentMessage const kComponentMessageXXXXX;
```

In `YZEnumConst.m`, write:

``` objc
kComponentMessage const kComponentMessageXXXXX = @"ComponentMessageXXXXX";

```

This way, a string enum type in Objective-C is constructed using type aliases.

> Note: The declaration must be in the `.h` file and the implementation must be in the `.m` file; otherwise, you'll get a symbol-not-found compilation error.


Here you'll notice the keywords `NS_STRING_ENUM` and `FOUNDATION_EXPORT`.

* `NS_STRING_ENUM` indicates the type is specifically for string enums
* `FOUNDATION_EXPORT` represents an externally exposed string constant declaration.

Combining the above usage rules, we can look at Apple's internal definitions—for example, the commonly used timing function constants in animation.

``` objc
typedef NSString * CAMediaTimingFunctionName NS_TYPED_ENUM;
CA_EXTERN CAMediaTimingFunctionName const kCAMediaTimingFunctionLinear
    API_AVAILABLE(macos(10.5), ios(2.0), watchos(2.0), tvos(9.0));
CA_EXTERN CAMediaTimingFunctionName const kCAMediaTimingFunctionEaseIn
    API_AVAILABLE(macos(10.5), ios(2.0), watchos(2.0), tvos(9.0));
CA_EXTERN CAMediaTimingFunctionName const kCAMediaTimingFunctionEaseOut
    API_AVAILABLE(macos(10.5), ios(2.0), watchos(2.0), tvos(9.0));
CA_EXTERN CAMediaTimingFunctionName const kCAMediaTimingFunctionEaseInEaseOut
    API_AVAILABLE(macos(10.5), ios(2.0), watchos(2.0), tvos(9.0));
CA_EXTERN CAMediaTimingFunctionName const kCAMediaTimingFunctionDefault
    API_AVAILABLE(macos(10.6), ios(3.0), watchos(2.0), tvos(9.0));
```

`CA_EXTERN` is defined in `<CoreGraphics/CGBase.h>`

``` objc
#ifndef CA_EXTERN
# define CA_EXTERN extern __attribute__((visibility("default")))
#endif
```

This implementation follows Apple's timing function string enum pattern.

# Summary

Recording valuable knowledge during development allows you to complete work more quickly and improve efficiency when you need it.


[Reference: Exploring `NS_STRING_ENUM`](https://juejin.cn/post/6844903638226173966)
