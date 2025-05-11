---
layout: post
title: 阿里、字节：一套高效的iOS面试题之多线程
date: 2020-09-19 11:09:28
categories: [iOS, 系统理论实践]
tags: [Algorithm, Objective-C]
typora-root-url: ..
---

![](/assets/images/20200721iOSinterviewAnswers/iOSInterviewQuestionsAlbumCover.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

本篇我们来讲一下 [阿里、字节：一套高效的iOS面试题](https://mp.weixin.qq.com/s/bDnsaD__ZpdHIk3_So382w) 中的多线程相关的问题.


## 多线程

这一篇我们来解答下多线程问题,主要以GCD为主:

* iOS开发中有多少类型的线程？分别对比
* GCD有哪些队列，默认提供哪些队列
* GCD有哪些方法api
* GCD主线程 & 主队列的关系
* 如何实现同步，有多少方式就说多少
* `dispatch_once`实现原理
* 什么情况下会死锁
* 有哪些类型的线程锁，分别介绍下作用和使用场景
* NSOperationQueue中的`maxConcurrentOperationCount`默认值
* NSTimer、CADisplayLink、`dispatch_source_t` 的优劣

###  1.iOS开发中有多少类型的线程?分别对比

| 线程类型 | 对比 | 备注 |
| :------| :------: | :------: |
| `pthread_t` | 跨平台C语言标准库中的多线程框架 | 过于底层使用很麻烦,需要封装使用. |
| GCD(Grand Central Dispatch) | iOS5后苹果推出的双核CPU优化的多线程框架,对A5以后的CPU有很多底层优化,C函数的形式调用 有点面向过程,不能直接设置并发数,需要写一些代码曲线方式实现并发 |   推荐使用  |
| NSOperation & NSOperationQueue | 更加面向对象 可以设置并发数量 | GCD 的封装 |

> 苹果底层库经过自己多年实践没有问题才会推荐给上层使用, eg:siri. 所以NSOperation实际上是苹果的ver1.0的多线程SDK,对GCD封装和`pthread_t`的封装.

### 2.GCD有哪些队列，默认提供哪些队列

* 1.主线程串行队列
* 2.全局并行队列
* 3.自定义队列(可自行设置`串/并`的参数`DISPATCH_QUEUE_SERIAL`和`DISPATCH_QUEUE_CONCURRENT`)

下面我整理了一个表格:

| 队列类型 | 对应函数 | 系统默认提供/自定义 | 优先级 |
| :------| :------: | :------: | :------: |
| 主线程串行队列(mian)| `dispatch_get_main_queue()` | 系统 |  |
| 全局并行队列(global)| `dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0)` | 系统 | 系统提供参数设置 |
| 自定义并行队列(Concurrent)| `dispatch_queue_create("com.sunyazhou.self.queue.concurrent", DISPATCH_QUEUE_CONCURRENT)` | 自定义 | |
| 自定义串行队列(Serial)| `dispatch_queue_create("com.sunyazhou.self.queue.serial", DISPATCH_QUEUE_SERIAL)` | 自定义 |  |

`dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0)` 其中的第一个参数就是队列的优先级,具体对于优先级QOS如下:

| GCD全局队列优先级宏定义 |  对应枚举数值 | 对应Qos |
| :------| :------: | :------ | 
| `DISPATCH_QUEUE_PRIORITY_HIGH` | 2 | `QOS_CLASS_USER_INITIATED` |
| `DISPATCH_QUEUE_PRIORITY_DEFAULT` | 0 | `QOS_CLASS_DEFAULT` |
| `DISPATCH_QUEUE_PRIORITY_LOW` | -2 | `QOS_CLASS_UTILITY` |
| `DISPATCH_QUEUE_PRIORITY_BACKGROUND` | `INT16_MIN` | `QOS_CLASS_BACKGROUND` |

> 其中`dispatch_get_global_queue `的第二个参数flag只是一个苹果予保留字段，通常我们传0（你可以试试传1应该队列创建失败）

### 3.GCD有哪些方法api

* 队列相关API  

	``` objc
	dispatch_get_main_queue(void) //获取主线程队列
	dispatch_get_global_queue(intptr_t identifier, uintptr_t flags) //获取全局队列
	dispatch_queue_create(const char *_Nullable label,dispatch_queue_attr_t _Nullable attr) //创建自定义队列 (一般大家都用域名倒置来区分队列的唯一标识,苹果对标识符是否一致在iOS10后有优化请注意.)
	```
* 执行API

	``` objc
	dispatch_async(dispatch_queue_t queue, dispatch_block_t block) //在某队列开启异步线程 block{}花括号内的代码将在某队列异步运行
	dispatch_sync(dispatch_queue_t queue, DISPATCH_NOESCAPE dispatch_block_t block) //在某队列开启同步线程 block{}花括号内的代码将在某队列同步运行
	dispatch_after(dispatch_time_t when, dispatch_queue_t queue, dispatch_block_t block) //GCD定时器 多久后执行 block
	dispatch_once(dispatch_once_t *predicate, DISPATCH_NOESCAPE dispatch_block_t block) //单次操作 (单位时间内只允许一个线程进入操作系统的临界区,一般创建单利时使用)这个变量可以区分冷热启动.
	dispatch_apply(size_t iterations, dispatch_queue_t DISPATCH_APPLY_QUEUE_ARG_NULLABILITY queue, DISPATCH_NOESCAPE void (^block)(size_t)) //向队列中追加任务操作并等待处理执行结束.
	dispatch_barrier_async()  //将自己的任务插入到队列之后，不会等待自己的任务结束，它会继续把后面的任务插入到队列，然后等待自己的任务结束后才执行后面任务
	dispatch_barrier_sync()  //将自己的任务插入到队列的时候，需要等待自己的任务结束之后才会继续插入被写在它后面的任务，然后执行它们
	```
* 调度组API
	
	``` objc
	dispatch_group_create(void) //创建GCD 调度组
	dispatch_group_async(dispatch_group_t group, dispatch_queue_t queue,dispatch_block_t block) //调度组开启异步线程
	dispatch_group_enter() //调度组信号量 需要和leave成对出现.
	dispatch_group_leave() //调度组信号量 需要和enter成对出现.
	dispatch_group_notify() //调度组任务完成通知调用方 操作(一般都回到主线程)
	dispatch_group_wait() //整个调度组 阻塞操作.只等待不做结束处理
	```
* 信号量API
	
	``` objc
	dispatch_semaphore_create(intptr_t value) //创建信号量 (可以理解为是线程锁)
	dispatch_semaphore_wait(dispatch_semaphore_t dsema, dispatch_time_t timeout) //信号-1
	dispatch_semaphore_signal(dispatch_semaphore_t dsema) //信号+1
	```
* 调度资源API
	
	``` objc
	dispatch_source_create() 
	dispatch_source_set_timer()
	dispatch_source_set_event_handler()
	dispatch_activate()
	dispatch_resume()
	dispatch_suspend()
	dispatch_source_cancel()
	dispatch_source_testcancel()
	dispatch_source_set_cancel_handler()
	dispatch_notify()
	dispatch_get_context()
	dispatch_set_contex()
	dispatch_queue_set_specific() 给队列设置标识
	dispatch_queue_get_specific() 取出队列标识
	dispatch_get_specific() 查询线程标识
	...
	```

### 4.GCD主线程 & 主队列的关系

提交到主队列的任务在主线程执行.

### 5.如何实现同步，有多少方式就说多少

* `dispatch_sync(dispatch_queue_t queue, DISPATCH_NOESCAPE dispatch_block_t block)` 在某队列开启同步线程
* dispatch_barrier_sync() 障碍锁的方式同步
* dispatch_group_create() + dispatch_group_wait()
* dispatch_apply() 插队追加 操作同步
* dispatch_semaphore_create() + dispatch_semaphore_wait() 信号量锁
* 串行NSOperationQueue队列并发数为1的时候 [NSOpertaion start] 启动任务即使同步操作 (NSOperationQueue.maxConcurrentOperationCount = 1)
* `pthread_mutex`底层锁函数
* 上层应用层封装的NSLock
* NSRecursiveLock 递归锁，这个锁可以被同一线程多次请求，而不会引起死锁。这主要是用在循环或递归操作中
* NSConditionLock & NSCondition 条件锁
* @synchronized 同步操作  单位时间内只允许一个线程进入临界区
* dispatch_once() 单位时间内只允许一个线程进入临界区
...

### 6.`dispatch_once`实现原理

这个问题问的很傻吊也很高超.因为要解释清楚所有步骤需要记住里面所有代码

我认为这个问题应该从操作系统层面回答, 这个问题的核心是操作系统返回状态决定的,**单位时间内操作系统只允许一个线程进入临界区,进入临界区的线程会被标记**

回归到代码就是

``` sh
dispatch_once(dispatch_once_t *val, dispatch_block_t block)  
	|_____dispatch_once_f(val, block, _dispatch_Block_invoke(block))  
		|_______&l->dgo_once  // &l->dgo_once 地址中存储的值。显然若该值为DLOCK_ONCE_DONE，即为once已经执行过
```

`dgo_once`是`dispatch_once_gate_s`的成员变量

``` objc
typedef struct dispatch_once_gate_s {
	union {
		dispatch_gate_s dgo_gate;
		uintptr_t dgo_once;
	};
} dispatch_once_gate_s, *dispatch_once_gate_t;
```
有个内联函数`static inline bool
_dispatch_once_gate_tryenter(dispatch_once_gate_t l)`

这个内联函数返回一个 原子性操作的结果 

``` 
return os_atomic_cmpxchg(&l->dgo_once, DLOCK_ONCE_UNLOCKED,(uintptr_t)_dispatch_lock_value_for_self(), relaxed)
```
比较+交换 的原子操作。比较 `&l->dgo_once` 的值是否等于 `DLOCK_ONCE_UNLOCKED`

这样就实现了我们的执行1次的GCD API.

[dispatch_once的底层实现](https://juejin.im/post/6844904143753052174)

### 7.什么情况下会死锁

造成死锁的主要是 线程信息不对称,出现A等B的同时 B也在等A的情况.

``` objc
/// 在主线程中执行这句代码
dispatch_sync(dispatch_get_main_queue(), ^{
    NSLog(@"这里死锁了");
});
```

主线程一直不会执行完,追加到主线程同步执行的任务显然惨死.卡住主线程无法自拔.

其它的情况 都是资源产生竞争或者调用lock的函数没有调用unlock导致,异步线程 先后调用等产生的较多.


### 8.有哪些类型的线程锁，分别介绍下作用和使用场景

| 锁类型 |  使用场景 |  备注 |
| :------| :------: | :------ | 
| `pthread_mutex` | 互斥锁 | `PTHREAD_MUTEX_NORMAL`,`#import <pthread.h>`|
| OSSpinLock | 自旋锁 | 不安全，iOS 10 已启用 |
| `os_unfair_lock ` | 互斥锁 | 替代 OSSpinLock |
| `pthread_mutex`(recursive)  | 递归锁 | `PTHREAD_MUTEX_RECURSIVE`,`#import <pthread.h>`|
| `pthread_cond_t` | 条件变量 | `#import <pthread.h>`|
| `pthread_rwlock ` | 读写锁 | 读操作重入，写操作互斥 |
| @synchronized | 互斥锁 | 性能差，且无法锁住内存地址更改的对象 |
| NSLock | 互斥锁 | 封装 `pthread_mutex` |
| NSRecursiveLock | 递归锁 | 封装`pthread_mutex`(recursive)|
| NSCondition | 条件锁| 封装 `pthread_cond_t ` | 
| NSConditionLock | 条件锁 | 可以指定具体条件值  封装 `pthread_cond_t `| 

### 9.NSOperationQueue中的maxConcurrentOperationCount默认值

默认值 -1. 这个值操作系统会根据资源使用的综合开销情况设置.

### 10.`NSTimer、CADisplayLink、`dispatch_source_t` 的优劣

| 定时器类型 |  优势 |  劣势 |
| :------| :------: | :------ | 
| NSTimer  |使用简单  | 依赖 Runloop，具体表现在 无 Runloop 无法使用、NSRunLoopCommonModes、不精确 |
| CADisplayLink  | 依赖屏幕刷新频率出发事件,最精.最合适做UI刷新 | 若屏幕刷新被影响，事件也被影响、事件触发的时间间隔只能是屏幕刷新 duration 的倍数、若事件所需时间大于触发事件，跳过数次、不能被继承 |
| `dispatch_source_t` |不依赖 Runloop | 依赖线程队列,使用麻烦 使用不当容易Crash |


# 总结

今天这篇多线程 也算是一个objc开发者的知识总结,这里面问到的知识大部分和队列线程关系比较多. 高阶一些的搞法并没有. 比如:如何停掉`dispatch_source_t `的定时器.再比如 为什么要存在`dispatch_source`. 下一篇我们讲解一下 视图&图像相关文章.

