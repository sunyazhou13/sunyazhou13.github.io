---
layout: post
title:  Solving the iOS16 WKWebView Debugging Issue
date: 2023-06-15 08:24 +0800
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This article carries a strong personal tone. If you find it uncomfortable to read, please close it immediately. This article is intended only as a personal study record. You are welcome to repost or share it within the scope of the license—please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!



## The Problem

After the iOS16 update, I could no longer see debugging info in Safari on macOS. This gave me quite a headache. After searching through various resources, I discovered a rather baffling decision by the Apple WebKit team.

[Enabling the Inspection of Web Content in Apps](https://webkit.org/blog/13936/enabling-the-inspection-of-web-content-in-apps/)

After a certain version update, an `isInspectable` property was added, and it's disabled by default. If you're on iOS versions below 16, you won't encounter this issue because this field only exists in the iOS16 SDK. This kind of 16.4 new feature is quite frustrating—it doesn't consider backward compatibility.

The correct approach is to set `webView.inspectable` to `YES`

``` objc
WKWebViewConfiguration *webConfiguration = [WKWebViewConfiguration new];
WKWebView *webView = [[WKWebView alloc] initWithFrame:CGRectZero configuration:webConfiguration];
webView.inspectable = YES;
```

> Note: This API is only available in iOS16.4 and above—remember to add availability checks.  
> Also, if your company's build machine doesn't have the latest version of Xcode, make sure to upgrade—otherwise, the build might fail because this API only exists in Apple's iOS16 SDK and not in other SDKs.


# Summary

If you're developing with WKWebView, remember to pay attention to this. Many developers feel that since it's not their area of responsibility, they don't need to care—but often when you suddenly encounter it, you'll be caught off guard. I recommend either remembering this issue or informing your colleagues about it. In short, don't make the mistake of not learning due to lack of experience.

[Official explanation of this issue](https://webkit.org/blog/13936/enabling-the-inspection-of-web-content-in-apps/)  
[https://zhuanlan.zhihu.com/p/622049301](https://zhuanlan.zhihu.com/p/622049301)
