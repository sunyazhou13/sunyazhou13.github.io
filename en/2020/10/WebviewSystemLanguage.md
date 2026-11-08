---
layout: post
title: Fixing iOS System Photo Album Not Showing Chinese
date: 2020-10-27 13:57:30
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

This article is strongly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. You are welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

Recently in development I ran into a bug: tapping to select from the iOS system photo album in H5 shows English text.

![Webview System Language](/assets/images/2020107WebviewSystemLanguage/WebviewSystemLanguage1.avif)


## Solution

Add the following code to the plist in Xcode

``` xml
<key>CFBundleAllowMixedLocalizations</key>
<true/>
```

Alternatively, add `Localized resources can be mixed` in info.plist and set it to `YES`; this indicates whether the app is allowed to adopt the languages of the framework libraries.

![Webview System Language](/assets/images/2020107WebviewSystemLanguage/WebviewSystemLanguage2.avif)


Then the result at runtime:

![Webview System Language](/assets/images/2020107WebviewSystemLanguage/WebviewSystemLanguage3.avif)

# Summary

Thanks for watching — that's all for now.
