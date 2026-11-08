---
layout: post
title: How to Determine Whether an NSString Is Pure Numeric
date: 2021-06-23 00:30:00
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

![pureinteger](/assets/images/20210623CheckNSStringIsPureInteger/pureinteger.avif)

# Preface

This article carries strong personal feelings. If you feel uncomfortable reading it, please close it as soon as possible. This article is only for personal learning records. Reposting or sharing within the scope of the license is welcome. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you think this site can help you, you can subscribe to this site via RSS. Thanks for your support!



## The Problem

In iOS development, is there a need to simply determine whether an NSString contains only digits, like the code below?

``` objc
NSString *str1 = @"10003600";
NSString *str2 = @"ffdec500063143bf91f509255cb87cda";
```
My first thought was to use a regex to match consecutive digits, but that doesn't seem like the most convenient way.
After searching through my knowledge index, I found the following solution

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
Using the `NSScanner` class to handle this, I guess the implementation principle is to iterate through the string character by character, probing each character, and when it reaches the end of the string, determine whether the current string is a pure numeric type.

For convenience, I wrote a demo and a category for everyone to use.

The `.h` and `.m` files

``` objc
#import "NSString+NumberTypeCheck.h"
#import <CoreGraphics/CoreGraphics.h>

@interface NSString (NumberTypeCheck)

/// Whether the string is a pure Int type
- (BOOL)isPureInt;
/// Whether the string is a pure NSInteger type
- (BOOL)isPureInteger;
/// Whether the string is a pure CGFloat (Double) type
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

# Summary

When encountering problems, you need to keep exploring, and maintain an attitude of continuous learning and seeking truth from facts.

[demo address](https://github.com/sunyazhou13/NSScanner)
