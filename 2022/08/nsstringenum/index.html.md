---
layout: post
title: iOS开发中的字符串枚举
date: 2022-08-22 19:23 +0800
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..

---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!



# 枚举


在`Objective-C`中并没有一个专门的类型来定义字符串枚举.我们常用的枚举都是整形,并且自动伸长累加+1.

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

在C++中有专门的枚举类,但是在iOS的objc中并没有C++中的专门枚举类,今天就来学习一个常量字符串字面量定义的枚举类型

我们新建一个class, 就叫`YZEnumConst.h`,然后 写上以下代码

``` objc
#import <Foundation/Foundation.h>

typedef NSString * const kComponentMessage NS_STRING_ENUM;
FOUNDATION_EXPORT kComponentMessage const kComponentMessageXXXXX;
```

在`YZEnumConst.m`中 写上

``` objc
kComponentMessage const kComponentMessageXXXXX = @"ComponentMessageXXXXX";

```

这样通过类型别名的形式就构成了 objc中的字符串枚举类型.

> 注意: 声明必须在`.h`中,实现必须在`.m`中,这样才不会造成找不到符号编译报错.


这里大家会注意到有个关键字 `NS_STRING_ENUM `和`FOUNDATION_EXPORT`

* `NS_STRING_ENUM `代表 类型 专用于枚举字符串
* `FOUNDATION_EXPORT`代表 对外暴漏声明 的字符串常量.

结合以上使用规则我们可以参考一下苹果内部的定义,例如动画常用的差时器常量.

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

`CA_EXTERN `定义在`<CoreGraphics/CGBase.h>`中

``` objc
#ifndef CA_EXTERN
# define CA_EXTERN extern __attribute__((visibility("default")))
#endif
```

这里的实现是参照苹果的差时器字符串枚举实现的.

# 总结

开发过程中记录一些有价值的知识点,当使用时才能更加快速的完成工作,提高工作效率.


[参考 初探 `NS_STRING_ENUM`](https://juejin.cn/post/6844903638226173966)