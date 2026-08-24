---
layout: post
title: 解决iOS调用系统相册不显示中文问题
date: 2020-10-27 13:57:30
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..

---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

最近开发遇到一个bug,在h5中点击选择iOS系统相册,显示的是英文的

![Webview System Language](/assets/images/2020107WebviewSystemLanguage/WebviewSystemLanguage1.avif)


## 解决方式 

在Xcode的plist中加入如下代码

``` xml
<key>CFBundleAllowMixedLocalizations</key>
<true/>
```

也可以 在 info.plist里面添加`Localized resources can be mixed` `YES`表示是否允许应用程序获取框架库内语言。

![Webview System Language](/assets/images/2020107WebviewSystemLanguage/WebviewSystemLanguage2.avif)


然后运行效果:

![Webview System Language](/assets/images/2020107WebviewSystemLanguage/WebviewSystemLanguage3.avif)

# 总结

感谢大家观看 到位挠挠了