---
layout: post
title: "Alibaba, ByteDance: A Set of Efficient iOS Interview Questions — Multithreading"
date: 2020-09-19 11:09:28
categories: [iOS, 系统理论实践]
tags: [Algorithm, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

![i OS Interview Questions Album Cover](/assets/images/20200721iOSinterviewAnswers/iOSInterviewQuestionsAlbumCover.avif)

# Preface

This article carries a strong personal flavor. If it makes you uncomfortable, please close it as soon as possible. This article is for personal study notes only. You're welcome to repost or share it within the bounds of the license agreement — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

In this post, we'll answer the multithreading-related questions from [Alibaba, ByteDance: A Set of Efficient iOS Interview Questions](https://mp.weixin.qq.com/s/bDnsaD__ZpdHIk3_So382w).


## Multithreading

In this post, we'll answer the multithreading questions, mainly GCD:

* How many types of threads are there in iOS development? Compare them
* What queues does GCD have, and which queues are provided by default
* What method APIs does GCD have
* The relationship between the GCD main thread & the main queue
* How to achieve synchronization — name as many ways as you can
* The implementation principle of `dispatch_once`
* When does a deadlock occur
* What types of thread locks are there? Describe their functions and use cases
* The default value of `maxConcurrentOperationCount` in NSOperationQueue
* Pros and cons of NSTimer, CADisplayLink, and `dispatch_source_t`

### 1. How Many Types of Threads Are There in iOS Development? Compare Them

| Thread Type | Comparison | Notes |
| :------| :------: | :------: |
| `pthread_t` | Multithreading framework from the cross-platform C standard library | Too low-level and troublesome to use; needs to be wrapped. |
| GCD (Grand Central Dispatch) | Apple's multithreading framework with dual-core CPU optimization released after iOS 5, with many low-level optimizations for A5 and later CPUs. Called in C function form, somewhat procedural; can't directly set the concurrency count, requires writing some code to achieve concurrency indirectly | Recommended |
| NSOperation & NSOperationQueue | More object-oriented; can set the concurrency count | A wrapper around GCD |

> Apple only recommends its low-level libraries to upper layers after years of practice without problems, e.g., Siri. So NSOperation is actually Apple's ver1.0 multithreading SDK — a wrapper around GCD and `pthread_t`.

### 2. What Queues Does GCD Have, and Which Queues Are Provided by Default

* 1. Main thread serial queue
* 2. Global concurrent queue
* 3. Custom queues (you can set the `serial/concurrent` parameters `DISPATCH_QUEUE_SERIAL` and `DISPATCH_QUEUE_CONCURRENT` yourself)

I've put together a table below:

| Queue Type | Corresponding Function | Provided by System / Custom | Priority |
| :------| :------: | :------: | :------: |
| Main thread serial queue (mian) | `dispatch_get_main_queue()` | System |  |
| Global concurrent queue (global) | `dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0)` | System | Set via system parameters |
| Custom concurrent queue (Concurrent) | `dispatch_queue_create("com.sunyazhou.self.queue.concurrent", DISPATCH_QUEUE_CONCURRENT)` | Custom | |
| Custom serial queue (Serial) | `dispatch_queue_create("com.sunyazhou.self.queue.serial", DISPATCH_QUEUE_SERIAL)` | Custom |  |

In `dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0)`, the first parameter is the queue's priority. Here are the specifics of the priority QoS:

| GCD Global Queue Priority Macro | Corresponding Enum Value | Corresponding QoS |
| :------| :------: | :------ | 
| `DISPATCH_QUEUE_PRIORITY_HIGH` | 2 | `QOS_CLASS_USER_INITIATED` |
| `DISPATCH_QUEUE_PRIORITY_DEFAULT` | 0 | `QOS_CLASS_DEFAULT` |
| `DISPATCH_QUEUE_PRIORITY_LOW` | -2 | `QOS_CLASS_UTILITY` |
| `DISPATCH_QUEUE_PRIORITY_BACKGROUND` | `INT16_MIN` | `QOS_CLASS_BACKGROUND` |

> The second parameter, flag, of `dispatch_get_global_queue ` is just a reserved field from Apple; we usually pass 0 (you can try passing 1 — the queue creation should fail).

### 3. What Method APIs Does GCD Have

* Queue-related APIs  

	``` objc
	dispatch_get_main_queue(void) //获取主线程队列
	dispatch_get_global_queue(intptr_t identifier, uintptr_t flags) //获取全局队列
	dispatch_queue_create(const char *_Nullable label,dispatch_queue_attr_t _Nullable attr) //创建自定义队列 (一般大家都用域名倒置来区分队列的唯一标识,苹果对标识符是否一致在iOS10后有优化请注意.)
	```
* Execution APIs

	``` objc
	dispatch_async(dispatch_queue_t queue, dispatch_block_t block) //在某队列开启异步线程 block{}花括号内的代码将在某队列异步运行
	dispatch_sync(dispatch_queue_t queue, DISPATCH_NOESCAPE dispatch_block_t block) //在某队列开启同步线程 block{}花括号内的代码将在某队列同步运行
	dispatch_after(dispatch_time_t when, dispatch_queue_t queue, dispatch_block_t block) //GCD定时器 多久后执行 block
	dispatch_once(dispatch_once_t *predicate, DISPATCH_NOESCAPE dispatch_block_t block) //单次操作 (单位时间内只允许一个线程进入操作系统的临界区,一般创建单利时使用)这个变量可以区分冷热启动.
	dispatch_apply(size_t iterations, dispatch_queue_t DISPATCH_APPLY_QUEUE_ARG_NULLABILITY queue, DISPATCH_NOESCAPE void (^block)(size_t)) //向队列中追加任务操作并等待处理执行结束.
	dispatch_barrier_async()  //将自己的任务插入到队列之后，不会等待自己的任务结束，它会继续把后面的任务插入到队列，然后等待自己的任务结束后才执行后面任务
	dispatch_barrier_sync()  //将自己的任务插入到队列的时候，需要等待自己的任务结束之后才会继续插入被写在它后面的任务，然后执行它们
	```
* Dispatch group APIs
	
	``` objc
	dispatch_group_create(void) //创建GCD 调度组
	dispatch_group_async(dispatch_group_t group, dispatch_queue_t queue,dispatch_block_t block) //调度组开启异步线程
	dispatch_group_enter() //调度组信号量 需要和leave成对出现.
	dispatch_group_leave() //调度组信号量 需要和enter成对出现.
	dispatch_group_notify() //调度组任务完成通知调用方 操作(一般都回到主线程)
	dispatch_group_wait() //整个调度组 阻塞操作.只等待不做结束处理
	```
* Semaphore APIs
	
	``` objc
	dispatch_semaphore_create(intptr_t value) //创建信号量 (可以理解为是线程锁)
	dispatch_semaphore_wait(dispatch_semaphore_t dsema, dispatch_time_t timeout) //信号-1
	dispatch_semaphore_signal(dispatch_semaphore_t dsema) //信号+1
	```
* Dispatch source APIs
	
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

### 4. The Relationship Between the GCD Main Thread & the Main Queue

Tasks submitted to the main queue are executed on the main thread.

### 5. How to Achieve Synchronization — Name as Many Ways as You Can

* `dispatch_sync(dispatch_queue_t queue, DISPATCH_NOESCAPE dispatch_block_t block)` — start a synchronous thread on a queue
* dispatch_barrier_sync() — synchronize with a barrier lock
* dispatch_group_create() + dispatch_group_wait()
* dispatch_apply() — jump the queue and append; synchronizes operations
* dispatch_semaphore_create() + dispatch_semaphore_wait() — semaphore lock
* When a serial NSOperationQueue has a concurrency count of 1, [NSOpertaion start] starts the task as a synchronous operation (NSOperationQueue.maxConcurrentOperationCount = 1)
* `pthread_mutex` — low-level lock function
* NSLock — the upper-layer application-level wrapper
* NSRecursiveLock — a recursive lock. This lock can be requested multiple times by the same thread without causing a deadlock. Mainly used in loops or recursive operations.
* NSConditionLock & NSCondition — condition locks
* @synchronized — synchronous operation; only allows one thread into the critical section per unit time
* dispatch_once() — only allows one thread into the critical section per unit time
...

### 6. The Implementation Principle of `dispatch_once`

This question is both silly and profound. Because to explain every step clearly, you'd need to memorize all the code inside.

I think this question should be answered at the operating system level. The core of this question is determined by the state the OS returns: **within a unit of time, the operating system only allows one thread into the critical section, and the thread that enters the critical section gets marked.**

Back to the code, it looks like this:

``` sh
dispatch_once(dispatch_once_t *val, dispatch_block_t block)  
	|_____dispatch_once_f(val, block, _dispatch_Block_invoke(block))  
		|_______&l->dgo_once  // &l->dgo_once 地址中存储的值。显然若该值为DLOCK_ONCE_DONE，即为once已经执行过
```

`dgo_once` is a member variable of `dispatch_once_gate_s`:

``` objc
typedef struct dispatch_once_gate_s {
	union {
		dispatch_gate_s dgo_gate;
		uintptr_t dgo_once;
	};
} dispatch_once_gate_s, *dispatch_once_gate_t;
```

There's an inline function `static inline bool
_dispatch_once_gate_tryenter(dispatch_once_gate_t l)`.

This inline function returns the result of an atomic operation.

``` 
return os_atomic_cmpxchg(&l->dgo_once, DLOCK_ONCE_UNLOCKED,(uintptr_t)_dispatch_lock_value_for_self(), relaxed)
```

It's a compare-and-swap atomic operation. It compares whether the value of `&l->dgo_once` equals `DLOCK_ONCE_UNLOCKED`.

And that's how GCD implements the "execute once" API.

[The low-level implementation of dispatch_once](https://juejin.im/post/6844904143753052174)

### 7. When Does a Deadlock Occur

Deadlocks are mainly caused by asymmetric thread information — a situation where A waits for B while B is also waiting for A.

``` objc
/// Execute this line of code on the main thread
dispatch_sync(dispatch_get_main_queue(), ^{
    NSLog(@"这里死锁了");
});
```

The main thread never finishes executing, so the synchronous task dispatched to the main thread is dead on arrival — it jams the main thread beyond rescue.

Other cases are all caused by resource contention or by calling lock functions without calling unlock — more common with async threads calling in sequence and waiting.


### 8. What Types of Thread Locks Are There? Describe Their Functions and Use Cases

| Lock Type | Use Case | Notes |
| :------| :------: | :------ | 
| `pthread_mutex` | Mutex | `PTHREAD_MUTEX_NORMAL`,`#import <pthread.h>`|
| OSSpinLock | Spin lock | Unsafe; deprecated in iOS 10 |
| `os_unfair_lock ` | Mutex | Replaces OSSpinLock |
| `pthread_mutex`(recursive)  | Recursive lock | `PTHREAD_MUTEX_RECURSIVE`,`#import <pthread.h>`|
| `pthread_cond_t` | Condition variable | `#import <pthread.h>`|
| `pthread_rwlock ` | Read-write lock | Reads can re-enter; writes are mutually exclusive |
| @synchronized | Mutex | Poor performance, and can't lock objects whose memory address changes |
| NSLock | Mutex | Wraps `pthread_mutex` |
| NSRecursiveLock | Recursive lock | Wraps `pthread_mutex`(recursive)|
| NSCondition | Condition lock | Wraps `pthread_cond_t ` | 
| NSConditionLock | Condition lock | Can specify a concrete condition value; wraps `pthread_cond_t ` | 

### 9. The Default Value of maxConcurrentOperationCount in NSOperationQueue

The default value is -1. The operating system sets this value based on the overall resource usage and overhead.

### 10. Pros and Cons of `NSTimer`, `CADisplayLink`, and `dispatch_source_t`

| Timer Type | Advantages | Disadvantages |
| :------| :------: | :------ | 
| NSTimer  | Simple to use  | Depends on Runloop, specifically: unusable without a Runloop, NSRunLoopCommonModes, imprecise |
| CADisplayLink  | Fires based on the screen refresh rate — the most precise; best for UI refreshes | If screen refresh is affected, the events are affected too; the event interval can only be a multiple of the screen refresh duration; if the event takes longer than the trigger interval, several firings are skipped; can't be inherited |
| `dispatch_source_t` | Doesn't depend on Runloop | Depends on thread queues; troublesome to use; easy to crash if used improperly |


# Summary

Today's post on multithreading is also a knowledge summary for an Objective-C developer. Most of the knowledge asked here relates to queues and threads. There's no advanced stuff, though — for example, how to stop a `dispatch_source_t ` timer, or why `dispatch_source` exists at all. In the next post, we'll cover view & image-related articles.

