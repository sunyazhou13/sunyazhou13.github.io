---
layout: post
title: Getting Paths of Various Directories in iOS
date: 2017-06-26 16:44:22
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

``` objc
//Get the sandbox home directory path
NSString *homeDir = NSHomeDirectory();
//Get the Documents directory path
NSString *docDir = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
//Get the Library directory path
NSString *libDir = [NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) lastObject];
//Get the Caches directory path
NSString *cachesDir = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
//Get the tmp directory path
NSString *tmpDir =  NSTemporaryDirectory();
```

