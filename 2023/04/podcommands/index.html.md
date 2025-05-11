---
layout: post
title: pod仓库的常用命令
date: 2023-04-03 17:10 +0800
categories: [iOS]
tags: [iOS, macOS, Objective-C, Cocoapods, skills]
typora-root-url: ..
---

![](/assets/images/20201010PodSpec/cocoapods.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 添加私有源站的仓库

``` sh
pod repo add sunyazhou-specs https://www.sunyazhou.com/xxproject/Specs.git --verbose
```

## 单独更新某个pod spec的仓库索引

``` sh 
pod repo update sunyazhou-specs --verbose
```

## push本地 repo 的podspec到远端私有源站


``` sh
pod repo push sunyazhou-specs xxxxlib.podspec --allow-warnings --use-libraries --verbose --skip-import-validation
```


这里的push操作会自动触发git push.把podspec推送到远端索引仓库,后面加了一堆参数是为了去除警告方便编译通过.

如果是手动的话需要在spec仓库 创建 **库名**/**版本号**/**xxxlib.spec**文件

