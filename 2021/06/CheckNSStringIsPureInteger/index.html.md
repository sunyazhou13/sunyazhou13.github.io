---
layout: post
title: 如何判断NSString是纯数字类型
date: 2021-06-23 00:30:00
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
---

![](/assets/images/20210623CheckNSStringIsPureInteger/pureinteger.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!



## 遇到的问题?

在iOS开发过程中是否有这样的需求,单纯判断NSString中是否是纯数字,如下面代码

``` objc
NSString *str1 = @"10003600";
NSString *str2 = @"ffdec500063143bf91f509255cb87cda";
```
我第一时间想到用正则匹配数字并连续,但是这样貌似不是便捷方式.
经过知识索引搜索,我找到了如下解决方式

``` objc
NSString *str = @"ffdec500063143bf91f509255cb87cda";//@"10003600";
NSScanner *scanner = [NSScanner scannerWithString:str1];
NSInteger intVal;
BOOL result = ([scanner scanInteger:&intVal] && [scanner isAtEnd]);
if (result) {
    NSLog(@"是纯整形");
} else {
    NSLog(@"非纯整形");
}
```
使用`NSScanner `类来处理, 我猜测实现原理是逐个字符串`迭代便利`逐个字符探测并到达最后的长度时来判定当前字符串是纯数字类型.

为了方便起见我写了一个demo和 category方便大家使用.

`.h`和`.m`文件

``` objc
#import "NSString+NumberTypeCheck.h"
#import <CoreGraphics/CoreGraphics.h>

@interface NSString (NumberTypeCheck)

/// 字符串是否是纯Int类型
- (BOOL)isPureInt;
/// 字符串是否是纯NSInteger类型
- (BOOL)isPureInteger;
/// 字符串是否是纯CGFloat(Double)类型
- (BOOL)isPureCGFloat;

@end

@implementation NSString (NumberTypeCheck)

- (BOOL)isPureInt {
    NSScanner *scanner = [NSScanner scannerWithString:self];
    int intVal;
    BOOL result = ([scanner scanInt:&intVal] && [scanner isAtEnd]);
    return result;
}

- (BOOL)isPureInteger {
    NSScanner *scanner = [NSScanner scannerWithString:self];
    NSInteger intVal;
    BOOL result = ([scanner scanInteger:&intVal] && [scanner isAtEnd]);
    return result;
}

- (BOOL)isPureCGFloat {
    NSScanner *scanner = [NSScanner scannerWithString:self];
    CGFloat floatVal;
    BOOL result = ([scanner scanDouble:&floatVal] && [scanner isAtEnd]);
    return result;
}

@end

```

# 总结

遇到问题需要不断探索,保持持续学习求真务实的态度.

[demo地址](https://github.com/sunyazhou13/NSScanner)