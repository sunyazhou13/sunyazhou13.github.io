---
title: Xcode开启静态分析器
categories: [ios开发]
tags: [ios, macos, 技巧]
date: 2017-06-20 15:07:33
---

![](/assets/images/20170620EnableStaticAnalyer/static.png)



## Clang 静态分析器

Clang 编译器（也就是 XCode 使用的编译器）有一个 静态分析器(static analyer) ，用来执行代码控制流和数据流的分析，可以发现许多编译器检查不出的问题。

你可以在 Xcode 的 Product → Analyze 里手动运行分析器。

分析器可以运行“`shallow`”和“`deep`”两种模式。后者要慢得多，但是有跨方法的控制流分析以及数据流分析，因此能发现更多问题。

## 建议：

开启分析器的 全部 检查（方法是在 `build setting` 的“`Static Analyzer`”部分开启所有选项）

在 `build setting` 里，对 `release` 的 `build` 配置开启 “`Analyze during` `‘Build’`” 。（真的，一定要这样做——你不会记得手动跑分析器的。）

把 `build setting` 里的 “Mode of Analysis for `‘Analyze’`” 设为  `Deep`

把 `build setting` 里的 “Mode of Analysis for `‘Build’`” 设为 `Shallow` (faster)

![](/assets/images/20170620EnableStaticAnalyer/EnableSStaticAnalyer.png)

全文完

[参考](http://mp.weixin.qq.com/s/x6XSQ_rrYCOXi2EVeiMfCg)

