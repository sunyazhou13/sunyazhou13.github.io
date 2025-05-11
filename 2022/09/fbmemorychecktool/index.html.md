---
layout: post
title: FB内存检测工具分享
date: 2022-09-16 10:11 +0800
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..

---

![](/assets/images/20220916FBMemoryCheckTool/FBMemoryProfiler.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 讨论

如果申请一大块内存没有被release这属于内存泄漏,并不属于内存竞争导致的持有,根本原因是没有正确的release.
在常规流程下(正常 alloc,release或者 malloc free,亦或是 new  delete)合理使用内存,造成内存泄漏的最主要原因是资源的竞争造成的相互持有.这是诱因导致 资源没有被正常释放. 此工具擅长解决 相互持有关系不释放内存问题,精确到实例类型和内存地址,并直观看到 找到相关对象.

## 内存检测工具-介绍

* FBMemoryProfiler  
	> FBMemoryProfiler 是几个组件的结合。其中包括 FBAllocationTracker 和 FBRetainCycleDetector。
 可视化工具，直接嵌入到 App 中，可以起到在 App 中直接查看内存使用情况，并筛选潜在泄漏对象的作用

* FBAllocationTracker  
 > 主要用于快速检测潜在的内存泄漏对象，并提供给 FBRetainCycleDetector 进行检测
 这是一个用来主动追踪所有 NSObject 的子类的内存分配和释放操作的工具。
 
 > FBAllocationTracker 用于检测应用在运行时所有实例的分配。它的原理其实就是用 method swizzling 替换原本的 alloc 方法。这样就可以记录下所有的实例分配了。
 
 >  在需要的时候调用 currentAllocationSummary 方法，就可以得到当前整体的实例分配情况（前提是在 main 中初始化过，下面有介绍）：
 	
 	``` objc
 	NSArray<FBAllocationTrackerSummary *> *summaries = [[FBAllocationTrackerManager sharedManager] currentAllocationSummary];
 	```
 
* FBRetainCycleDetector
 >  FBRetainCycleDetector 接受一个运行时的实例，然后从这个实例开始遍历它所有的属性，逐级递归。 如果发现遍历到重复的实例，就说明存在循环引用，并给出报告。

 ``` objc
  FBRetainCycleDetector *detector = [FBRetainCycleDetector new];
 [detector addCandidate:myObject];
 NSSet *retainCycles = [detector findRetainCycles];
 NSLog(@"%@", retainCycles);

 ```
 

## 代码检测循环引用-原理

在运行时中检测对象 的内存布局,实例地址 

``` objc
const char *class_getIvarLayout(Class cls);
const char *class_getWeakIvarLayout(Class cls);
```
>  support for Objective-C++

代码中使用

``` objc
FBRetainCycleDetector *detector = [[FBRetainCycleDetector alloc] initWithConfiguration:nil];
[detector addCandiate:myObject];
NSSet<NSArray<FBObjectiveCGraphElement *> *> *retainCycles = [detector findRetainCycles];
NSLog(@"%@", retainCycles);
```  
> 这里的 `myObject `，就是我们所怀疑的实例变量

`FBObjectiveCGraphElement` 是所有用来查找对象类型的基类。所有的查找对象都基于它实现。该类并不需要外部的调用，主要是供内部查询使用。其提供的功能主要是：

* 提供初始化方法封装`object`（即调用`addCandiate`传入的`object`）
* 获取所有该对象所持有对象`- (NSSet *)allRetainedObjects;`。
基类`FBObjectiveCGraphElement`所获取的对象类型是通过`associated object`所持有的对象。 `associated object`对象的获取是通过`Facebook`自身的`fishhook`去`hook`原先的`objc_setAssociatedObject`和`objc_removeAssociatedObjects`来实现对象的持有标记。
* 提供过滤接口`- (NSSet *)filterObjects:(nullable NSArray *)objects`;，过滤接口主要是与`FBObjectGraphConfiguration`相结合使用，`FBObjectGraphConfiguration`会在下文介绍。

`FBObjectGraphConfiguration ` 是提供过滤相关白名单的类,相关的配置

其余的不就在这里过多介绍了.

#### findRetainCycles查询方式 - DFS深度优先

这里查找对象的方式用的是深度优先遍历搜索

![](/assets/images/20220916FBMemoryCheckTool/retainCycle.gif)


## 如何使用

![](/assets/images/20220916FBMemoryCheckTool/retainCycle1.gif)

示例场景分析

![](/assets/images/20220916FBMemoryCheckTool/retainCycle2.webp)

示例代码

``` objc
@property (nonatomic, strong) NSTimer *timer;
@property(copy,nonatomic)NSString *name;

 self.timer = [NSTimer scheduledTimerWithTimeInterval:0.1
                                              target:self
                                            selector:@selector(handleTimer)
                                            userInfo:nil
                                             repeats:YES];

- (void)handleTimer
{
     self.name = @"123";
}
```

参考

[FBRetainCycleDetector分析](https://www.jianshu.com/p/bdce04214cf3)  
[automatic-memory-leak-detection-on-ios](https://engineering.fb.com/2016/04/13/ios/automatic-memory-leak-detection-on-ios/)