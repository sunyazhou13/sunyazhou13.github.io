---
layout: post
title: Using Xcode Configuration Files to Manage Different Environment Settings
date: 2020-10-04 11:58:03
categories: [iOS, 系统理论实践]
tags: [Algorithm, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

![Xcode Build Configuration File](/assets/images/20201004XcodeBuildXcconfigFile/XcodeBuildConfigurationFile1.avif)

# Preface

This post carries a strong personal tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only for my personal learning notes. You're welcome to repost or share it within the scope of the license, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

## Background

Recently our project hit an environment-switching problem, and I thought about the use of *.xcconfig files. I searched around search engines and found that people's approaches are mostly copies of each other. None of the problems I encountered were properly solved.

Below are the problems I ran into; I'll try to solve them.

* CocoaPods warns after creating an xcconfig
* Points to note about xcconfig inheritance
* After resolving the warning, compile-and-print issues

### Creating

![xcconfig](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig1.avif)

By default the target is checked here (Xcode doesn't check it by default).
![xcconfig](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig2.avif)

Once created, select our own configuration.
![xcconfig](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig3.avif)

#### First, the Warning Issue

After we're done, let's look at the warning that appears after `pod install`.

![xcconfig](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig4.avif)

``` sh
[!] CocoaPods did not set the base configuration of your project because your project already has a custom config set. In order for CocoaPods integration to work at all, please either set the base configurations of the target `XcodeConfigDemo` to `Target Support Files/Pods-XcodeConfigDemo/Pods-XcodeConfigDemo.debug.xcconfig` or include the `Target Support Files/Pods-XcodeConfigDemo/Pods-XcodeConfigDemo.debug.xcconfig` in your build configuration (`XcodeConfigDemo/DemoDebug.xcconfig`).

[!] CocoaPods did not set the base configuration of your project because your project already has a custom config set. In order for CocoaPods integration to work at all, please either set the base configurations of the target `XcodeConfigDemo` to `Target Support Files/Pods-XcodeConfigDemo/Pods-XcodeConfigDemo.release.xcconfig` or include the `Target Support Files/Pods-XcodeConfigDemo/Pods-XcodeConfigDemo.release.xcconfig` in your build configuration (`XcodeConfigDemo/DemoRelease.xcconfig`).
```

Let me first explain how to solve it. After generating our own .xcconfig file, the CocoaPods configuration is the default. We changed it to our own but didn't manage CocoaPods, so CocoaPods' build settings might not take effect in the project because of our changes. To solve this, we need to import CocoaPods' xcconfig into our own xcconfig.


![xcconfig](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig5.avif)

![xcconfig](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig6.avif)


Here I also declared 2 variables in the debug and release configurations, for testing variable usage in the project below.

``` sh
// debug
SUNYAZHOU_COM = @"https://www.sunyazhou.com/"
SYZ_TEST = @"https://xxxxx.com/"
#include "../Pods/Target Support Files/Pods-XcodeConfigDemo/Pods-XcodeConfigDemo.release.xcconfig"
#include "DemoCommon.xcconfig"

//release
SUNYAZHOU_COM = @"https://www.sunyazhou.com/"
SYZ_TEST = @"https://xxxxx.com/"
#include "../Pods/Target Support Files/Pods-XcodeConfigDemo/Pods-XcodeConfigDemo.debug.xcconfig"
#include "DemoCommon.xcconfig"
```

OK. After `pod install`, the warning is gone.

#### Points to Note About xcconfig Inheritance

Here I added a common DemoCommon.xcconfig configuration, to export common macro variables.

![xcconfig](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig7.avif)

`GCC_PREPROCESSOR_DEFINITIONS` means inheriting the common environment variables and adding them to preprocessing — that is, adding this line so that the related macro definitions can be referenced in code.

``` sh
GCC_PREPROCESSOR_DEFINITIONS = $(inherited) SUNYAZHOU_COM='$(SUNYAZHOU_COM)' SYZ_TEST='$(SYZ_TEST)' 
```

Note the format when there are multiple variables:

``` sh
 GCC_PREPROCESSOR_DEFINITIONS = $(inherited)空格(不能加换行)+SUNYAZHOU_COM='$(SUNYAZHOU_COM)'+空格(不能加换行)SYZ_TEST='$(SYZ_TEST)' 
```
The pitfall I hit here was adding 20+ variables and writing a big pile of them. In the end, unless the format matched the above, the build failed and the variables couldn't be found.

#### After Resolving the Warning, Compile-and-Print Issues

![xcconfig](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig8.avif)

``` sh
Unexpected '@' in program
```

This problem occurs because the macro variables aren't escaped.

The following variables must be converted:

``` sh
//Before conversion
SUNYAZHOU_COM = @"https://www.sunyazhou.com/"
SYZ_TEST = @"https://xxxxx.com/"

//After conversion
SUNYAZHOU_COM = @"https:\/\/www.sunyazhou.com/"
SYZ_TEST = @"https:\/\/xxxxx.com/"

```

![xcconfig](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig9.avif)

After the conversion it compiles, but there's still a warning. It's probably not escaped correctly, but the output works. If any expert knows the answer, please leave a comment — thanks!

# Summary

Some knowledge is easily forgotten when you don't use it often — xcconfig is exactly like that. The project demo is attached below; interested readers can download it.

[Demo for this post](https://github.com/sunyazhou13/XcodeConfigDemo) 



[Refer to Mattt's Xcode Build Configuration Files](https://nshipster.com/xcconfig/)    
[Using Xcode Configuration (.xcconfig) to Manage Different Build Settings](https://www.appcoda.com/xcconfig-guide/)  
