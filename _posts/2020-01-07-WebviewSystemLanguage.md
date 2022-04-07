---
title: 解决iOS调用系统相册不显示中文问题
categories: [ios开发]
tags: [ios, macos]
date: 2020-10-27 13:57:30
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或使用,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,这样您将能在第一时间获取本站信息.

最近开发遇到一个bug,在h5中点击选择iOS系统相册,显示的是英文的

![](/assets/images/2020107WebviewSystemLanguage/WebviewSystemLanguage1.jpeg)


## 解决方式 

在Xcode的plist中加入如下代码

``` xml
<key>CFBundleAllowMixedLocalizations</key>
<true/>
```

也可以 在 info.plist里面添加`Localized resources can be mixed` `YES`表示是否允许应用程序获取框架库内语言。

![](/assets/images/2020107WebviewSystemLanguage/WebviewSystemLanguage2.png)


然后运行效果:

![](/assets/images/2020107WebviewSystemLanguage/WebviewSystemLanguage3.jpeg)

# 总结

感谢大家观看 到位挠挠了