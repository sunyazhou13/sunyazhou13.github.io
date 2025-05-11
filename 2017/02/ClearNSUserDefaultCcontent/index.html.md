---
layout: post
title: 使用终端删除NSUserDefault的内容
date: 2017-02-20 19:05:01
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
---

前言
--
> 大家对`NSUserDefaults`非常熟悉 今天给大家讲一下如何用终端清理`NSUserDefaults`的信息  

`NSUserDefaults`和`win`开发的注册表一样 用于存储一些标记位
最近开发用到的比较多是如何不运行代码的情况下清理`NSUserDefaults `信息

**$ defaults delete + 包名**  eg: com.baidu.demo 

下面这样会删除所有以`com.baidu.demo`为包名的文件  

``` shell
$ defaults delete com.baidu.demo
```  

> 实际的的路径(把 my app和前后剪头 换成自己的应用的包名)

macOS应用非沙盒权限(如下图) `~/Library/Preferences/<my app>.plist  <my app>`  eg:QQ
![非沙盒路径](/assets/images/20170220ClearNSUserDefaultCcontent/NonSandBoxPermission.webp)

macOS应用沙盒权限(如下图)  `~/Library/Containers/<my app>/Data/Library/Preferences/<my app>.plist` eg:qq  

![](/assets/images/20170220ClearNSUserDefaultCcontent/SandBoxPermission.webp)


总结
--

> defaults 还有其它指令还可以为某个`key`设置`value` 大家可自行google  

谢谢大家

全文完