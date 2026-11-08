---
layout: post
title: Disabling Scroll in Webview's NSScrollView
date: 2017-02-09 13:37:28
categories: [iOS]
tags: [macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---



Implement the following code in the `webview`'s `WebFrameLoadDelegate` delegate method:

``` objc

#pragma mark -
#pragma mark - WebViewDelegate
- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame
{
    [sender stringByEvaluatingJavaScriptFromString:@"document.documentElement.style.overflow='hidden'"];
}
```


Note: the code above is for `macOS` development.
