---
layout: post
title: 使用Xcode配置文件来管理不同的环境设置
date: 2020-10-04 11:58:03
categories: [iOS, 系统理论实践]
tags: [Algorithm, Objective-C]
typora-root-url: ..
---

![](/assets/images/20201004XcodeBuildXcconfigFile/XcodeBuildConfigrationFile1.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

## 背景

最近工程遇到了一个环境切换的问题,想到了 *.xcconfig 文件的用处. 查了一圈搜索引擎大家的搞法真是各种抄袭.遇到的问题没有一个能正式解决的

下面是我遇到的问题,我尝试解决一下.

* 创建xcconfig后 cocoapods有警告
* xcconfig继承 需要注意的点
* 解决完警告 编译打印问题

### 创建

![](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig1.webp)

下面这里默认勾选tagget (Xcode 不会默认勾选)
![](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig2.webp)

创建完了 选择我们自己的配置
![](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig3.webp)

#### 先说第一个警告问题

搞完后我们来看下pod install后出现的警告

![](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig4.webp)

``` sh
[!] CocoaPods did not set the base configuration of your project because your project already has a custom config set. In order for CocoaPods integration to work at all, please either set the base configurations of the target `XcodeConfigDemo` to `Target Support Files/Pods-XcodeConfigDemo/Pods-XcodeConfigDemo.debug.xcconfig` or include the `Target Support Files/Pods-XcodeConfigDemo/Pods-XcodeConfigDemo.debug.xcconfig` in your build configuration (`XcodeConfigDemo/DemoDebug.xcconfig`).

[!] CocoaPods did not set the base configuration of your project because your project already has a custom config set. In order for CocoaPods integration to work at all, please either set the base configurations of the target `XcodeConfigDemo` to `Target Support Files/Pods-XcodeConfigDemo/Pods-XcodeConfigDemo.release.xcconfig` or include the `Target Support Files/Pods-XcodeConfigDemo/Pods-XcodeConfigDemo.release.xcconfig` in your build configuration (`XcodeConfigDemo/DemoRelease.xcconfig`).
```

先说如何解决 当我们生成了自己的.xcconfig文件后默认是cocoapods的配置,让我们改成了自己的并没有管理cocoapod.所以cocoapods对工程的build setting有可能因为我们的改动而不生效,为了解决这个问题我们需要在自己的xcconfig中导入cocoapods的 xcconfig


![](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig5.webp)

![](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig6.webp)


这里我顺便声明了2个变量 在 debug和release配置里,为了下面测试变量在工程中使用.

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

ok 下面 pod install后 警告就没了. 

#### xcconfig继承 需要注意的点

这里我加了一个通用的 DemoCommon.xcconfig 配置,为了向外输出公共的宏变量.

![](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig7.webp)

`GCC_PREPROCESSOR_DEFINITIONS ` . 表示继承通用环境变量 要加入预处理，即加上这句，代码中才可以调到相关的宏定义

``` sh
GCC_PREPROCESSOR_DEFINITIONS = $(inherited) SUNYAZHOU_COM='$(SUNYAZHOU_COM)' SYZ_TEST='$(SYZ_TEST)' 
```

这里需要注意多个变量的格式:

``` sh
 GCC_PREPROCESSOR_DEFINITIONS = $(inherited)空格(不能加换行)+SUNYAZHOU_COM='$(SUNYAZHOU_COM)'+空格(不能加换行)SYZ_TEST='$(SYZ_TEST)' 
```
我这里遇到的坑是加了20多个变量, 写了一堆.最后发现不像上边的格式那样就编译不过找不到变量.

#### 解决完警告 编译打印问题

![](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig8.webp)

``` sh
Unexpected '@' in program
```

出现这个问题是因为宏变量没有转义

必须将下面的变量 

``` sh
//转换前
SUNYAZHOU_COM = @"https://www.sunyazhou.com/"
SYZ_TEST = @"https://xxxxx.com/"

//转换后
SUNYAZHOU_COM = @"https:\/\/www.sunyazhou.com/"
SYZ_TEST = @"https:\/\/xxxxx.com/"

```

![](/assets/images/20201004XcodeBuildXcconfigFile/xcconfig9.webp)

转换完能编译过了 但是还是有警告,应该是没转义对 不过 能正常输出了. 哪位高手如果知道可以留言给我 多谢！

# 总结

有些知识不经常使用容易忘记, xcconfig就是这样.工程 demo我已经附在了下方 感兴趣的同学可以下载.

[本文demo](https://github.com/sunyazhou13/XcodeConfigDemo) 



[参考Mattt 大佬的 Xcode Build Configuration Files](https://nshipster.com/xcconfig/)    
[Using Xcode Configuration (.xcconfig) to Manage Different Build Settings](https://www.appcoda.com/xcconfig-guide/)  
