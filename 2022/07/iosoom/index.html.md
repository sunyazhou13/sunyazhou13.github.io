---
layout: post
title: iOS中的OOM
date: 2022-07-11 11:04 +0800
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..

---

![](/assets/images/20220711iOSCrashType/kernel.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

## OOM


在iOS开发中，可能会经常看到app用着用着就崩溃了，而在后台查看崩溃栈的时候，找不到崩溃日志。其实这大多数的可能是系统产生了低内存崩溃，也就是`OOM`(还有一种可能是主线程卡死，导致`watchdog`杀掉了应用)，而低内存崩溃的日志，往往都是以`JetsamEvent`开头的，日志中有内存页大小(`pageSize`)，CPU时间(`cpuTime`)等字段。

#### 什么是OOM？

什么是`OOM`呢，它是`out-of-memory`的缩写，字面意思就是内存超过了限制。它是由于 `iOS` 的`Jetsam`机制造成的一种`另类`Crash，它不同于常规的`Crash`，通过`Signal`捕获等Crash监控方案无法捕获到`OOM`事件。

当然还会有`FOOM`这样的词，代表的是`Foreground-out-of-memory`，是指`App`在前台因消耗内存过多引起系统强杀。这也就是本文要讨论的。后台出现`OOM`不一定都是app本身造成的，大多数是因为当前在前台的App占用内存过大，系统为了保证前台应用正常运行，把后台应用清理掉了。

#### 什么是Jetsam机制?

`Jetsam`机制可以理解为操作系统为了控制内存资源过度使用而采用的一种管理机制。`Jetsam`是一个独立运行的进程，每一个进程都有一个内存阈值，一旦超过这个阈值Jetsam就会立刻杀掉这个进程。

#### 为什么要设计Jetsam机制?

首先设备的内存是有限制的，并不是无限大的，所以内存资源非常重要。系统进程及用户使用的其他`app`的进程都会争抢这个资源。由于`iOS`不支持交换空间，一旦触发低内存事件，`Jetsam`就会尽可能多的释放应用占用的内存，这样在`iOS`系统上出现系统内存不足时，应用就会被系统终止。

####  空间交换 

物理内存不够使用该怎么办呢？像一些桌面操作系统，会有内存`交换空间`，在window上称为`虚拟内存`。它的机制是，在需要时能将物理内存中的一部分交换到硬盘上去，利用硬盘空间扩展内存空间。

#### iOS不支持交换空间

但iOS并不支持`交换空间`，大多数移动设备都不支持`交换空间`。移动设备的大容量存储器通常是闪存，它的读写速度远远小于电脑所使用的硬盘，这就导致在移动设备上就算使用了`交换空间`，也并不能提升性能。其次，移动设备的容量本身就经常短缺、内存的读写寿命也有限，所以在这种情况下还拿闪存来做内存交换，就有点奢侈了。

需要注意的是，网上有少出文章说iOS没有虚拟内存机制，实际上指的是iOS没有`交换空间机制`。

#### 典型app内存类型

当内存不足的时候，系统会按照一定策略来腾出更多空间供使用，比较常见的做法是将一部分低优先级的数据挪到磁盘上，这个操作称为`Page Out`。之后当再次访问到这块数据的时候，系统会负责将它重新搬回内存空间中，这个操作称为`Page In`。

#### Clean Memory

`Clean Memory`是指那些可以用以`Page Out`的内存，只读的内存映射文件，或者是App所用到的`frameworks`。每个`frameworks`都有`_DATA_CONST`段，通常他们都是`Clean`的，但如果用runtime进行swizzling，那么他们就会变`Dirty`。

#### Dirty Memory

`Dirty Memory`是指那些被App写入过数据的内存，包括所有堆区的对象、图像解码缓冲区，同时，类似`Clean memory`，也包括App所用到的`frameworks`。每个`framework`都会有`_DATA`段和`_DATA_DIRTY`段，它们的内存是`Dirty`的。

值得注意的是，在使用`framework`的过程中会产生`Dirty Memory`，使用单例或者全局初始化方法是减少`Dirty Memory`不错的方法，因为单例一旦创建就不会销毁，全局初始化方法会在类加载时执行。

#### Compressed Memory

由于闪存容量和读写寿命的限制，iOS 上没有`交换空间`机制，取而代之使用`Compressed memory`。

`Compressed memory`是在内存紧张时能够将最近使用过的内存占用压缩至原有大小的一半以下，并且能够在需要时解压复用。它在节省内存的同时提高了系统的响应速度，特点总结起来如下：

* Shrinks memory usage 减少了不活跃内存占用
* Improves power efficiency 改善电源效率，通过压缩减少磁盘IO带来的损耗
* Minimizes CPU usage 压缩/解压十分迅速，能够尽可能减少 CPU 的时间开销
* Is multicore aware 支持多核操作

例如，当我们使用`Dictionary`去缓存数据的时候，假设现在已经使用了3页内存，当不访问的时候可能会被压缩为1页，再次使用到时候又会解压成3页。

> 本质上，`Compressed memory`也是`Dirty memory`。
因此， `memory footprint ` = `dirty size` + `compressed size`，这也就是我们需要并且能够尝试去减少的内存占用。

#### Memory Warning

相信对于`MemoryWarning`并不陌生，每一个`UIViewController`都会有一个`didReceivedMemoryWarning`的方法。

当使用的内存是一点点上涨时，而不是一下子直接把内存撑爆。在达到内存临界点之前，系统会给各个正在运行的应用发出内存警告，告知app去清理自己的内存。而内存警告，并不总是由于自身app导致的。

内存压缩技术使得释放内存变得复杂。内存压缩技术在操作系统层面实现，对进程无感知。有趣的是如果当前进程收到了内存警告，进程这时候准备释放大量的误用内存，如果访问到过多的压缩内存，再解压缩内存的时候反而会导致内存压力更大，然后出现`OOM`，被系统杀掉。

> 我们对数据进行缓存的目的是想减少 CPU 的压力，但是过多的缓存又会占用过大的内存。在一些需要缓存数据的场景下，可以考虑使用`NSCache`代替`NSDictionary`，`NSCache`分配的内存实际上是`Purgeable Memory`，可以由系统自动释放。这点在`Effective Objective 2.0`一书中也有推荐`NSCache`与`NSPureableData`的结合使用既能让系统根据情况回收内存，也可以在内存清理的同时移除相关对象。

##### **出现OOM前一定会出现Memory Warning么**？   

答案是不一定，有可能瞬间申请了大量内存，而恰好此时主线程在忙于其他事情，导致可能没有经历过`Memory Warning`就发生了OOM。当然即便出现了多次`Memory Warning`后，也不见得会在最后一次`Memory Warning`的几秒钟后出现`OOM`。之前做`extension`开发的时候，就经常会出现`Memory Warnning`，但是不会出现`OOM`，再操作一两分钟后，才出现`OOM`，而在这一两分钟内，没有再出现过`Memory Warning`。

当然在内存警告时，处理内存，可以在一定程度上避免出现`OOM`。

#### 如何确定OOM的阈值?

不同设备OOM的阈值是不同的。那我们该如何知道OOM的阈值呢？

##### 方法1

当我们的`App`被`Jetsam`机制杀死的时候，在手机中会生成系统日志，在手机`系统设置`-`隐私`-`分析`中，可以得到`JetSamEvent`开头的日志。这些日志中就可以获取到一些关于`App`的内存信息，例如我当前用的iPhone12，在日志中的前部分看到了`pageSize`，而查找`per-process-limit`一项(并不是所有日志都有，可以找有的)，用该项的`rpages * pageSize`即可得到`OOM`的阈值。

``` json
{"bug_type":"298","timestamp":"2022-07-10 01:18:15.51 +0800","os_version":"iPhone OS 15.5 (19F77)","incident_id":"893A5949-F274-434F-938F-96DF562C9486"}
{
  "crashReporterKey" : "1fccb167681199b571738b0f60a42574dace79ac",
  "kernel" : "Darwin Kernel Version 21.5.0: Thu Apr 21 21:51:27 PDT 2022; root:xnu-8020.122.1~1\/RELEASE_ARM64_T8101",
  "product" : "iPhone13,2",
  "incident" : "893A5949-F274-434F-938F-96DF562C9486",
  "date" : "2022-07-10 01:18:15.51 +0800",
  "build" : "iPhone OS 15.5 (19F77)",
  "timeDelta" : 5,
  "memoryStatus" : {
  "compressorSize" : 55911,
  "compressions" : 121377965,
  "decompressions" : 84151972,
  "zoneMapCap" : 1394786304,
  "largestZone" : "APFS_4K_OBJS",
  "largestZoneSize" : 41566208,
  "pageSize" : 16384,
  "uncompressed" : 139405,
  "zoneMapSize" : 242122752,
  "memoryPages" : {
    "active" : 55880,
    "throttled" : 0,
    "fileBacked" : 47550,
    "wired" : 51160,
    "anonymous" : 63802,
    "purgeable" : 489,
    "inactive" : 52901,
    "free" : 8686,
    "speculative" : 2571
  }
},
  "largestProcess" : "WeChat",
  "genCounter" : 0,
  "processes" : [
  {
    "uuid" : "c5bfd6df-d788-3dd4-a585-3ad5aa26b390",
    "states" : [
      "daemon",
      "idle"
    ],
    "purgeable" : 0,
    "age" : 111572686953,
    "fds" : 25,
    "coalition" : 3457,
    "rpages" : 84,
    "priority" : 0,
    "physicalPages" : {
      "internal" : [
        3,
        68
      ]
    },
    "freeze_skip_reason:" : "out-of-budget",
    "pid" : 85307,
    "cpuTime" : 0.007986,
    "name" : "EnforcementService",
    "lifetimeMax" : 87
  }
...
```
那么当前这个MemoryTest的内存阈值就是pageSize * rpages / 1024 / 1024 = xx MB。

##### 方法2

通过Xcode进行DEBUG时，当使用的内存超出限制的时候，系统会抛出 EXC_RESOURCE_EXCEPTION 异常。

##### 方法3

首先，我们可以通过方法得到当前应用程序占用的内存

通过探测系统可用内存的方式 判断

相关代码请各位搜索一下其它网络平台将会比这更全面

##### 方法4（适用于iOS13系统）

iOS13系统`os/proc.h`中提供了新的API，可以查看当前可用内存

``` objc
#import <os/proc.h>
extern size_t os_proc_available_memory(void);
+ (CGFloat)availableSizeOfMemory {
    if (@available(iOS 13.0, *)) {
        return os_proc_available_memory() / 1024.0 / 1024.0;
    }
    // ...
}
```

#### 源码探究Jetsam的具体实现

iOS/MacOS的内核都是XNU，同时XNU是开源的。我们可以在开源的XNU内核源码中

XNU的内核内层为`Mach`层，`Mach`作为微内核，是仅提供基础服务的一个薄层，如处理器管理和调度及IPC(进程间通信)。`XNU`的第二个主要部分是`BSD`层。我们可以将其看成围绕`mach层`的一个外环，`BSD`为最终用户的应用程序提供变成接口，其职责包括进程管理，文件系统和网络。

内存管理中各种常见的`JetSam`时间也是由`BSD`产生的，所以，我们从`bsd_init`这个函数作为入口，来探究一下原理。

`bsd_init`中基本都是在初始化各种子系统，比如虚拟内存管理等等

##### BSD初始化`bsd_init`

跟内存相关的包括如下几步：

``` c
//1. 初始化BSD内存Zone，这个Zone是基于Mach内核的zone
kmeminit();

//2.iOS上独有的特性，内存和进程的休眠的常驻监控线程
#if CONFIG_FREEZE
#ifndef CONFIG_MEMORYSTATUS
    #error "CONFIG_FREEZE defined without matching CONFIG_MEMORYSTATUS"
#endif
	/* Initialise background freezing */
	bsd_init_kprintf("calling memorystatus_freeze_init\n");
	memorystatus_freeze_init();
#endif

//3.iOS独有，JetSAM（即低内存事件的常驻监控线程）
#if CONFIG_MEMORYSTATUS
	/* Initialize kernel memory status notifications */
rticle/details/104004692
```

这里面的`memorystatus_freeze_init()`和`memorystatus_init()`两个方法都是调用`kern_memorystatus.c`里面暴露的接口，主要的作用就是从内核中开启两个优先级最高的线程，来监控整个系统的内存情况。

`CONFIG_FREEZE`涉及到的功能，当启用这个宏时，内核会对进程进行冷冻而不是`Kill`。涉及到进程休眠相关的代码，暂时不在本文讨论范围内。

回到`iOS`的`OOM`崩溃话题上，我们只需要关注`memorystatus_init()`方法即可。

#### 知识点介绍

* 内核里面对于所有的进程都有一个优先级的分布，通过一个数组维护，数组的每一项是一个进程的列表。这个数组的大小则是`JETSAM_PRIORITY_MAX + 1`。  

	``` c
	#define MEMSTAT_BUCKET_COUNT (JETSAM_PRIORITY_MAX + 1)
	typedef struct memstat_bucket {
	    TAILQ_HEAD(, proc) list;    //  一个TAILQ_HEAD的双向链表，用来存放这个优先级下面的进程
	    int count;  //  进程的个数
	} memstat_bucket_t;
	memstat_bucket_t memstat_bucket[MEMSTAT_BUCKET_COUNT];//优先级队列(里面包含不同优先级的结构)
	
	```
* 在`kern_memorystatus.h`中，我们可以找到`JETSAM_PRIORITY_MAX`值以及进程优先级相关的定义：

	``` c  
	#define JETSAM_PRIORITY_REVISION                  2
	
	#define JETSAM_PRIORITY_IDLE_HEAD                -2
	/* The value -1 is an alias to JETSAM_PRIORITY_DEFAULT */
	#define JETSAM_PRIORITY_IDLE                      0
	#define JETSAM_PRIORITY_IDLE_DEFERRED		  1 /* Keeping this around till all xnu_quick_tests can be moved away from it.*/
	#define JETSAM_PRIORITY_AGING_BAND1		  JETSAM_PRIORITY_IDLE_DEFERRED
	#define JETSAM_PRIORITY_BACKGROUND_OPPORTUNISTIC  2
	#define JETSAM_PRIORITY_AGING_BAND2		  JETSAM_PRIORITY_BACKGROUND_OPPORTUNISTIC
	#define JETSAM_PRIORITY_BACKGROUND                3
	#define JETSAM_PRIORITY_ELEVATED_INACTIVE	  JETSAM_PRIORITY_BACKGROUND
	#define JETSAM_PRIORITY_MAIL                      4
	#define JETSAM_PRIORITY_PHONE                     5
	#define JETSAM_PRIORITY_UI_SUPPORT                8
	#define JETSAM_PRIORITY_FOREGROUND_SUPPORT        9
	#define JETSAM_PRIORITY_FOREGROUND               10
	#define JETSAM_PRIORITY_AUDIO_AND_ACCESSORY      12
	#define JETSAM_PRIORITY_CONDUCTOR                13
	#define JETSAM_PRIORITY_HOME                     16
	#define JETSAM_PRIORITY_EXECUTIVE                17
	#define JETSAM_PRIORITY_IMPORTANT                18
	#define JETSAM_PRIORITY_CRITICAL                 19
	
	#define JETSAM_PRIORITY_MAX                      21
	
	/* TODO - tune. This should probably be lower priority */
	#define JETSAM_PRIORITY_DEFAULT                  18
	#define JETSAM_PRIORITY_TELEPHONY                19
	
	```

其中数值越大，优先级越高。后台应用程序优先级`JETSAM_PRIORITY_BACKGROUND`是`3`，低于前台应用程序优先级`JETSAM_PRIORITY_FOREGROUND` 10，而`SpringBoard`(桌面程序)位于`JETSAM_PRIORITY_HOME` 16。

* JetSam出现的原因

``` c
#define JETSAM_REASON_INVALID								0
#define JETSAM_REASON_GENERIC								1
#define JETSAM_REASON_MEMORY_HIGHWATER						2
#define JETSAM_REASON_VNODE									3
#define JETSAM_REASON_MEMORY_VMPAGESHORTAGE					4
#define JETSAM_REASON_MEMORY_PROCTHRASHING					5
#define JETSAM_REASON_MEMORY_FCTHRASHING					6
#define JETSAM_REASON_MEMORY_PERPROCESSLIMIT				7
#define JETSAM_REASON_MEMORY_DISK_SPACE_SHORTAGE			8
#define JETSAM_REASON_MEMORY_IDLE_EXIT						9
#define JETSAM_REASON_ZONE_MAP_EXHAUSTION					10
#define JETSAM_REASON_MEMORY_VMCOMPRESSOR_THRASHING			11
#define JETSAM_REASON_MEMORY_VMCOMPRESSOR_SPACE_SHORTAGE	12

```

##### 源码逻辑流程

1. JetSam线程初始化完毕，从外部接收到内存压力
2. 如果接收到的内存压力是当前物理内存达到限制时，同步触发per-process-limit类型的OOM，退出流程
3. 如果接受到的内存压力是其他类型时，则唤醒`JetSam`线程，判断`kill_under_pressure_cause`值为`kMemorystatusKilledVMThrashing`，`kMemorystatusKilledFCThrashing`，`kMemorystatusKilledZoneMapExhaustion`时，或者当前可用内存`memorystatus_available_pages`小于阈值`memorystatus_available_pages_pressure`时，进入`OOM`逻辑。
4. 遍历优先级最低的每个进程，根据`phys_footprint`，判断当前进程是否高于阈值，如果没有超过阈值的，则据需查找下一个次低优先级的进程，直到找到后，触发`high-water`类型`OOM`
5. 此时先回一个收优先级较低的进程或正常情况下随时可回收的进程，再次走到`4`的判断逻辑
6. 当所有低优先级进程或正常情况下课随时可回收的进程都被杀掉后，如果`memorystatus_available_pages`依然小于阈值，先杀掉后台的进程，每杀掉一个进程，判断一下`memorystatus_available_pages`是否还小于阈值，如果已经小于阈值了，则挂起线程，等待唤醒
7. 当所有后台进程都被杀掉后，调用`memorystatus_kill_top_process_aggressive`，杀掉前台的进程，挂起线程，等待唤醒
8. 如果上面的`memorystatus_kill_top_process_aggressive`没有杀掉任何进程，就通过LRU杀死`Jetsam`队列中的第一个进程，挂起线程，等待唤醒

#### 如何判定发生了OOM

facebook和微信的Matrix都是采用的排除法。在Matrix初始化的时候调用checkRebootType`方法，来判定是否发生了OOM，具体流程如下：

1. 如果当前设备正在DEBUG，则直接返回，不继续执行。
2. 上次打开app是否发生了普通的崩溃，如果不是继续执行
3. 上次打开app后，是用户是否主动退出的应用（监听`UIApplicationWillTerminateNotification`消息），如果不是继续执行
4. 上次打开app后，是否调用`exit`相关的函数（通过`atexit`函数监控），如果不是继续执行
5. 上次打开app后，app是否挂起`suspend`或者执行`backgroundFetch`，如果此时没有被看门狗杀死，则是一种`OOM`，Matrix起名叫`Suspend OOM`，如果不是继续执行
6. app的uuid是否变化了，如果不是继续执行
7. 上次打开app后，系统是否升级了，如果不是继续执行
8. 上次打开app后，设备是否重启了，如果不是继续执行
9. 上次打开app时，app是否处于后台，如果是，则触发了`Background OOM`，如果不是继续执行
10. 上次打开app后，app是否处于前台，是否主线程卡死了，如果没有卡死，则说明触发了`Foreground OOM`。

# 总结

平时我们谈论的大部分都是FOOM,因为如果我们的程序在后台，优先级很低，即便我们不占用大量的内存，也可能会由于前台应用程序占用了大量的内存，而把我们在后台的程序杀掉。这是系统的机制，我们没有太多的办法.针对于FOOM，我们需要着重关注`dirty pages`和`IOKit mappings`，当然注意系统做的缓存，例如图片、字体等。针对于OOM问题监控与解决，可以参考[Matrix](https://github.com/Tencent/matrix)和[OOMDetector](https://github.com/Tencent/OOMDetector)两个开源库



[实践方案 快影iOS端如何实现OOM率下降80%+](https://www.gushiciku.cn/pl/aHa7)