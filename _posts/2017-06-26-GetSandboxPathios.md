---
title: iOS获取各种文件目录的路径
categories: [ios开发]
tags: [ios, macos, 安全]
date: 2017-06-26 16:44:22
---

``` objc
// 获取沙盒主目录路径
NSString *homeDir = NSHomeDirectory();
// 获取Documents目录路径
NSString *docDir = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
// 获取Library的目录路径
NSString *libDir = [NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) lastObject];
// 获取Caches目录路径
NSString *cachesDir = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
// 获取tmp目录路径
NSString *tmpDir =  NSTemporaryDirectory();
```

