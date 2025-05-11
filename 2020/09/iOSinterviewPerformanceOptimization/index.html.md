---
layout: post
title: 阿里、字节：一套高效的iOS面试题之性能优化
date: 2020-09-22 09:42:48
categories: [iOS, 系统理论实践]
tags: [Algorithm, Objective-C]
typora-root-url: ..
---

![](/assets/images/20200721iOSinterviewAnswers/iOSInterviewQuestionsAlbumCover.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

本篇我们来讲一下 [阿里、字节：一套高效的iOS面试题](https://mp.weixin.qq.com/s/bDnsaD__ZpdHIk3_So382w) 中的性能优化相关的问题.

## 性能优化

主要的优化如下:

1. 如何做启动优化，如何监控
2. 如何做卡顿优化，如何监控
3. 如何做耗电优化，如何监控
4. 如何做网络优化，如何监控

首先优化要从多维度进行才有较大的收益 

这里推荐大家认真分析一下自己的工程并研读一下戴铭老师的[如何对 iOS 启动阶段耗时进行分析](https://ming1016.github.io/2019/12/07/how-to-analyze-startup-time-cost-in-ios/) 文章

必须要从多维度分析并入手.

运行时初始化过程 分为：

* 加载类扩展
* 加载 C++静态对象
* 调用+load 函数
* 执行 main 函数
* Application 初始化，到 applicationDidFinishLaunchingWithOptions 执行完
初始化帧渲染，到 viewDidAppear 执行完，用户可见可操作。


# 总结

性能优化部分 并没有标准的答案,所以分享给大家一篇重要的文章作为抓手和参考,只要达到预期的优化目的并保证程序稳定即可.



