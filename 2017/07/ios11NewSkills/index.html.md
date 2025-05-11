---
layout: post
title: iOS 11 新技能
date: 2017-07-13 10:55:15
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..

---

![](/assets/images/20170713ios11NewSkills/whatisnewsinios11.webp)


## 可用性检查API

在swift代码中经常可以看到 某个API 适用于 iOS10.0 

如下代码

``` swift
	if (@available(iOS 11, *)) {
		//iOS 11可用 
	} else {
		//老版本API
	}

```
在Xcode9 中, 编译器增加了 Objective-C 版本的 API 可用性检查

##### 通过`API_AVAILABLE`宏来标注方法的可用性


``` objc
@interface ViewController : UIViewController
- (void)xxxMethodA API_AVAILABLE(ios(11.0));
- (void)xxxMethodB API_AVAILABLE(ios(8.0), macos(10.10), watchos(2.0), tvos(9.0));
@end

```

> 切记 `macos`、`ios`、`watchos`、`tvos`都是小写

通过这种写法进行可用性判断, 编辑器就不会产生警告了, 并且在`运行时`就根据iOS系统版本执行相应代码.

##### 通过`API_AVAILABLE`宏来标注整个`class`的可用性

``` objc
API_AVAILABLE(ios(11.0))
@interface A : NSObject
- (void)xxxMothod;
@end
```

看了大家会发现 这个 都是用于OC的代码 那C/C++ 有吗? 必须有

##### C/C++ 代码 可以使用 ``

判断是否可用

``` c++

if (__builtin_available(iOS 11, macOS 10.13, *)) {
     xxxxFunc();
}
```

``` c++
//导入头文件
#include <os/availability.h> 

//可用性判断用于 声明函数 
void myFunctionForiOS11OrNewer(int i) API_AVAILABLE(ios(11.0), macos(10.13));  

//可用性判断 用于类 XXXClassA
class API_AVAILABLE(ios(11.0), macos(10.13)) XXXClassA;  
```

默认 `API_AVAILABLE()` 只能用于 `iOS 11` / `tvOS 11` / `macOS 10.13` / `watchOS 4` 以上的 API 生效

如果就工程想使用这种llvm新版特性的话 需要修改 `buid setting`里面的 `Unguarded availability`  如下图:

![](/assets/images/20170713ios11NewSkills/availability.webp)


## 静态分析

前面的文章我又讲过[静态分析](http://www.sunyazhou.com/2017/06/20/enable-static-analyer/)

这里说一下变化

### NSNumber/CFNumberRed 静态分析 延时

当我们错误的判断 NSNumber时  静态分析 则给出了提示 

![](/assets/images/20170713ios11NewSkills/error.webp)
 

在Xcode9 中可以直接把这种倍忽视 的问题改成 当错误处理

![](/assets/images/20170713ios11NewSkills/static.webp)


## 开启 LTO 并设置为 Incremental 模式 

链接时优化（以下简称 `LTO`）是 LLVM 的一项优化特性，其主要原理是:

*利用对象文件经过一些优化得到的中间格式在链接阶段再进行深度优化，包含代码逻辑层面的分析，去除实际未用到的函数、变量、甚至局部代码片段，继而减小安装包大小，同时提高了运行时的效率。*

对于 LTO，Xcode 9 做出的改进主要是在进一步优化了编译速度。 苹果演示的例子是以某个大型 C++ 工程为参考，对于一次完整链接，Xcode 9 比 Xcode 8 提升了 35%；对于一次增量链接，Xcode 9 比 Xcode 8 提升了近 60%。

![](/assets/images/20170713ios11NewSkills/lto1.webp)

![](/assets/images/20170713ios11NewSkills/lto2.webp)

开启LTO

![](/assets/images/20170713ios11NewSkills/LTO.webp)

据说对包大小和运行时速度有 10% 左右的优化


## GCD 统一队列标识


统一队列标识是指我们在工程中散落在各处的创建队列，如果队列标识是一样的，他们在内核中会被 bind 在一起，其效率可以提高 30%。Apple 没有告诉我们其内核是怎么做到的，它提供了这样的建议，如果一类操作重要性程度或其他属性接近，亦或开发者希望散落在工程各处的代码可以放在同一个队列里去控制，那么我们在创建队列的时候就可以指定一个共同的标识符。 然后系统在内核中会把这些标识相同的队列 bind 到一起来管理

如下代码 如果app里面都使用同一个字符串 的话 效率可以提高30%

``` objc
	dispatch_queue_t queue = dispatch_queue_create("com.sunyazhou.demo.queue", DISPATCH_QUEUE_CONCURRENT);
    dispatch_async(queue, ^{
       //异步执行代码写在这里
    });
```

> 老实说 工程里面 避免不了文件上传下载 或者耗时任务处理  如果 整体搞成一个queue显然 不太符合业务需求 如果尽量保持 一个标识的Queue的话 也只能根据 业务分类来做到  可以有机会尝试一下


全文完

[参考](https://techblog.toutiao.com/2017/07/05/session0-2/)
