---
layout: post
title: 如何在macOS/MAC OS X上创建替身文件
date: 2017-05-09 17:41:17
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
---

![](/assets/images/20170509HowToCreateSymbolicLinkOnMacosInCode/symboliclink.webp)

### 前言

熟悉WIN 开发的同学一定很熟悉快捷方式,在macOS上叫做替身 最近开发插件相关逻辑 发现需要把插件复制到指定目录所以有了此文


### 软连接

如果你深刻的理解了内存管理的原理，软连接就如同内存管理中的“指向指针的指针”，软连接本质就是指向硬连接的一个地址，自然它也只会对这一个硬连接有效，一旦软连接所指向的硬连接被删除，软连接也就失效了。当然这与”指针的指针”也有一个很微妙的差别，那就是你对软链接的操作都是通过跳转到硬连接再映射到了对节点的操作


创建软链接可以使用`NSFileManager`中的两个方法:

``` objc
- (BOOL)createSymbolicLinkAtPath:(NSString *)path withDestinationPath:(NSString *)destPath error:(NSError **)error ;
- (BOOL)createSymbolicLinkAtURL:(NSURL *)url withDestinationURL:(NSURL *)destURL error:(NSError **)error;

```

### 使用场景 

最近在开发插件 需要把插件从工程目录 copy到 系统的插件目录`~/Library/Internet Plug-Ins/` ([这里用了老谭的插件举例](http://www.tanhao.me/pieces/1084.html/))


如下图:
![](/assets/images/20170509HowToCreateSymbolicLinkOnMacosInCode/step1.webp)

本想把它直接copy过去, 但可能存在以后升级问题,后续判断各种版本 删除旧的版本逻辑处理比较麻烦,于是想到用替身的方式实现

![](/assets/images/20170509HowToCreateSymbolicLinkOnMacosInCode/step2.webp)

使用这种方式创建替身:

``` objc
    //工程目录文件
    NSString *homePath = [[NSBundle mainBundle] pathForResource:@"NPAPI_Download_Plugin" ofType:@"plugin"];
    //插件在系统的目录位置
    NSString *strHome = [NSString stringWithUTF8String:getenv("HOME")];
    NSString *desc = [NSString stringWithFormat:@"%@/Library/Internet Plug-Ins/NPAPI_Download_Plugin.plugin",strHome];
    NSFileManager *fm = [NSFileManager defaultManager];
    //创建替身代码
    [fm createSymbolicLinkAtPath:desc withDestinationPath:homePath error:nil];  
    
```

*注意:`createSymbolicLinkAtPath:withDestinationPath:error:`方法 第一个参数`LinkAtPath`是`desc`,它是放替身文件的位置. 第二个参数`DestinationPath`是`homePath`代表本地文件的原始路径,这里用工程目录的文件是为了方便,切记不要和 copyItem方法搞混*


![](/assets/images/20170509HowToCreateSymbolicLinkOnMacosInCode/step3.webp)


### 总结

主要涉及的一些macOS开发技巧, 希望不足之处大家多多指教.

参考:[详解OSX(Unix)中的Hard Link与Symbolic Link(硬连接与软连接)](http://www.tanhao.me/pieces/597.html/)

全文完

