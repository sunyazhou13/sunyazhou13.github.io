---
layout: post
title: Type-Safe Casting in Objective-C
date: 2023-03-06 10:28 +0800
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

![cast](/assets/images/20230306SafeCast/cast.avif)

# Preface

This article carries strong personal feelings. If you feel uncomfortable reading it, please close it as soon as possible. This article is only for personal learning records. Reposting or sharing within the scope of the license is welcome. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you think this site can help you, you can subscribe to this site via RSS. Thanks for your support!


# CAST

`Cast` is also called currying; it's simply a type conversion process. In iOS we often force-cast some data type. Every time we have to write some bloated code, so people get used to writing macros to check whether an instance variable belongs to a certain class.

Below I'll share some commonly used macros that leverage the dynamic features provided by the Objective-C runtime to handle common type checks.

``` objc
#ifdef __cplusplus
extern "C" {
#endif

id YZSafeCast(id obj, Class classType);

#ifdef __cplusplus
}
#endif


#ifndef YZ_SAFE_CAST

/// Safe type casting (currying)
#define YZ_SAFE_CAST(obj, asClass)  YZSafeCast(obj, [asClass class])

#endif
```

The implementation file

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

Usage looks like this:

``` objc

```

## Summary 

Recording some techniques that are commonly used but not immediately findable when you need them

[demo](https://github.com/sunyazhou13/SafeCastDemo)
