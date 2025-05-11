---
layout: post
title: 判断NSWindow是否全屏
date: 2017-03-23 14:03:32
categories: [macOS]
tags: [macOS, Objective-C]
typora-root-url: ..
---

``` objc
@interface NSWindow (FullScreen)

- (BOOL)mn_isFullScreen;

@end

@implementation NSWindow (FullScreen)

- (BOOL)mn_isFullScreen
{
    return (([self styleMask] & NSFullScreenWindowMask) == NSFullScreenWindowMask);
}

@end
```

refs:[How to know if a NSWindow is fullscreen in Mac OS X Lion?](http://stackoverflow.com/questions/6815917/how-to-know-if-a-nswindow-is-fullscreen-in-mac-os-x-lion)