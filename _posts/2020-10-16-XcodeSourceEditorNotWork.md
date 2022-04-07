---
title: 修复Xcode Source Editor在masOS的扩展中不显示
categories: [mac疑难杂症]
tags: [ios开发, macos开发]
date: 2020-10-16 16:05:42
---

![](/assets/images/20201016XcodeSourceEditorNotWork/XcodeSourceEditorCover.jpg)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或使用,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,这样您将能在第一时间获取本站信息.


## 问题描述

这几天要对代码进行对齐发现经常用的 XAlign插件不起作用了,一看设置中发现 扩展中没有了Xcode Source Editor
![](/assets/images/20201016XcodeSourceEditorNotWork/XcodeSourceEditor.png)

通过网络上查询找到一篇靠谱的方式 特记录下来

终端输入如下 即可出来

``` sh
$ PATH=/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support:"$PATH"
$ lsregister -f /Applications/Xcode.app
```

引起的原因

当Xcode的多个副本在同一台机器上时，扩展可能会完全停止工作。在这种情况下，Apple Developer Relations建议重新注册你的Xcode主拷贝到Launch Services(最简单的方法是暂时将lsregister的位置先添加到PATH中):

参考 [https://nshipster.com/xcode-source-extensions/](https://nshipster.com/xcode-source-extensions/)


# 总结

记录经常遇到的问题.