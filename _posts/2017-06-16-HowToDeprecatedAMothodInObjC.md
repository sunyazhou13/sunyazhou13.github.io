---
title: 如何在Objective-C中废弃一个方法
categories: [ios开发]
tags: [ios, macos]
date: 2017-06-16 16:40:26
---
# 前言
![](/assets/images/20170616HowToDeprecatedAMothodInObjC/deprecated.png)


最新在从事SDK方向的开发 有的时候 不能轻易的把某个API去掉 因为有些人还在使用 于是为了保留 相关方法 并标识为弃用 的方式 我采用如下代码

``` objc
__attribute__((deprecated("此方法已弃用,请使用xxxxx:方法")));
```

### 场景1

我想标识一个方法使用其它方式传入某个参数 

例如:控制器中我想标识设置URL的方法直接使用setter方法就可以了


``` objc
@interface VideoEditorViewController : UIViewController

@property(nonatomic, strong)NSURL *videoPath;

-(instancetype)initWithUrl:(NSURL *)path __attribute__((deprecated("使用setVideoPath:方法传入")));

@end
```

这样调用的时候就直接显示警告了 告诉当前方法传入URL被弃用

![](/assets/images/20170616HowToDeprecatedAMothodInObjC/code.png)



相关`__attribute__`更多用法 请参考苹果官方文档和其它博客 
后续会持续更新更多用法

全文完



[参考](http://www.jianshu.com/p/0237c34158f0)
