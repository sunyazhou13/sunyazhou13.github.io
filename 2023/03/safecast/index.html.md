---
layout: post
title: objc中的类型安全转换
date: 2023-03-06 10:28 +0800
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
---

![](/assets/images/20230306SafeCast/cast.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


# CAST

`Cast`也叫柯里化,就是一种简单的类型转换过程.在iOS中我们经常对某种数据类型进行强制转换.每次不得不写一些臃肿的代码,于是大家习惯写成宏来check 某实例变量是否数据某class.

下面代码分享出来经常用到宏 利用objc运行时提供的动态特性来处理常用的类型check.

``` objc
#ifdef __cplusplus
extern "C" {
#endif

id YZSafeCast(id obj, Class classType);

#ifdef __cplusplus
}
#endif


#ifndef YZ_SAFE_CAST

/// 安全类型转换(柯里化)
#define YZ_SAFE_CAST(obj, asClass)  YZSafeCast(obj, [asClass class])

#endif
```

实现文件

``` objc
#import <Foundation/Foundation.h>
#import "YZSafeCast.h"

id YZSafeCast(id obj, Class classType)
{
    if ([obj isKindOfClass:classType])
    {
        return obj;
    }
    return classType ? nil : obj;
}

```

使用的时候如下

``` objc

```

## 总结 

记录一些常用且找的时候不是马上能找到的技巧

[demo](https://github.com/sunyazhou13/SafeCastDemo)