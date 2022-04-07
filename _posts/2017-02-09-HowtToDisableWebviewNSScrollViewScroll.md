---
title: Webview的NSScrollView禁用滑动功能
date: 2017-02-09 13:37:28
categories: [ios开发]
tags: [ios, macos]
---



在`webview`的`WebFrameLoadDelegate`代理里面实现如下代码

``` objc

#pragma mark -
#pragma mark - WebViewDelegate
- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame
{
    [sender stringByEvaluatingJavaScriptFromString:@"document.documentElement.style.overflow='hidden'"];
}
```


以上代码属于`macOS`上的开发内容.
