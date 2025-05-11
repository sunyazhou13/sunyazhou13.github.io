---
layout: post
title:  解决iOS16 WKWebview无法调试问题
date: 2023-06-15 08:24 +0800
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!



## 问题

最近在IOS16更新后,无法在mac端的safari看到调试信息了.这让我很是头疼,经过查各种资料发现一个Aeppl WebKit团队很脑残的一个操作

[Enabling the Inspection of Web Content in Apps](https://webkit.org/blog/13936/enabling-the-inspection-of-web-content-in-apps/)

某版本更新以后，新增了个isInspectable的属性，而且默认是关闭的。如果是iOS16以下就没有这个问题是因为iOS16的SDK中才有的这个字段, 这种16.4的新特性很SB,不做向下兼容考虑.

正确的方式应该是设置`webView.inspectable` 为`YES`

``` objc
WKWebViewConfiguration *webConfiguration = [WKWebViewConfiguration new];
WKWebView *webView = [[WKWebView alloc] initWithFrame:CGRectZero configuration:webConfiguration];
webView.inspectable = YES;
```

> 注意这个API是iOS16.4才有的特性,记得加上可用性检测的API  
> 还有如果你公司的打包机没有最近版本的Xcode请记得升级,否则有可能造成这个API在苹果的iOS16SDK中才有,其它SDK中没有引起的打包机打包失败.


# 总结

如果开发WKWebView的同学记得关注一下,有很多开发者觉得看到了不是干这个业务的这个不需要关注,往往很多时候你偶尔遇到就会手足无措,还是建议你要么记住这个问题,要么告诉一下周围同事周知这个事情,总之不要犯没有经验而不去学习了解的错误.

[官方对此问题解释](https://webkit.org/blog/13936/enabling-the-inspection-of-web-content-in-apps/)  
[https://zhuanlan.zhihu.com/p/622049301](https://zhuanlan.zhihu.com/p/622049301)
