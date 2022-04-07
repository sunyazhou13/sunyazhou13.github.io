---
title: 判断NSWindow是否全屏
categories: [ios开发]
tags: [ios, macos]
date: 2017-03-23 14:03:32
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