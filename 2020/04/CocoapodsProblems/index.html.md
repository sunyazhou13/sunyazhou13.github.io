---
layout: post
title: Cocoapods清华镜像
date: 2020-04-10 07:13:59
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills, Cocoapods]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

## Cocoapod疑难杂症

这几天开发 总遇到疑难杂症 是因为我的cocoapods升级到了1.9.1,导致各种问题 然后还被和谐,无奈找到如下解决cocoapods各种问题的解决方式


对于旧版的 CocoaPods 可以使用如下方法使用 tuna 的镜像：

``` sh
$ pod repo remove master
$ pod repo add master https://mirrors.tuna.tsinghua.edu.cn/git/CocoaPods/Specs.git
$ pod repo update
```

新版的 CocoaPods 不允许用`pod repo add`直接添加master库了，但是依然可以：

``` sh
$ cd ~/.cocoapods/repos 
$ pod repo remove master
$ git clone https://mirrors.tuna.tsinghua.edu.cn/git/CocoaPods/Specs.git master
```

最后进入自己的工程，在自己工程的`PodFile`第一行加上：

``` ruby
source 'https://mirrors.tuna.tsinghua.edu.cn/git/CocoaPods/Specs.git'
```


# 总结


折腾了很久不如找对地方 

[参考CocoaPods 镜像使用帮助](https://mirrors.tuna.tsinghua.edu.cn/help/CocoaPods/)