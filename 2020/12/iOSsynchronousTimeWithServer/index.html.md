---
layout: post
title: 解决iOS系统时间被修改的问题
date: 2020-12-05 21:12:31
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
---


![](/assets/images/20201206iOSsynchronousTimeWithServer/iOSsynchronousTimeWithServerCover.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

本文将用到的科普知识如下:

* GMT:(Greenwich Mean Time)格林尼治标准时间。这是以英国格林尼治天文台观测结果得出的时间，这是英国格林尼治当地时间，这个地方的当地时间过去被当成世界标准的时间。  
* UT:(Universal Time)世界时。根据[原子钟](https://baike.baidu.com/item/%E5%8E%9F%E5%AD%90%E9%92%9F/765460)计算出来的时间
* UTC:(Coordinated Universal Time)太阳所处的位置变化跟地球的自转相关，过去人们认为地球自转的速率是恒定的，但在1960年这一认知被推翻了，人们发现地球自转的速率正变得越来越慢，而时间前进的速率还是恒定的，所以UTC不再被认为可以用来精准的描述时间了。我们需要继续寻找一个匀速前进的值。抬头看天是我们从宏观方向去寻找答案，科技的发展让我们在微观方面取得了更深的认识，于是有聪明人根据微观粒子原子的物理属性，建立了原子钟，以这种原子钟来衡量时间的变化，原子钟50亿年才会误差1秒，这种精读已经远胜于GMT了。这个原子钟所反映的时间，也就是我们现在所使用的UTC（Coordinated Universal Time ）标准时间。

上述摘自: [iOS关于时间的处理](https://mp.weixin.qq.com/s/cSZUNMuqk6DL3-nctyxzcw?)  


## 场景描述

最近开发过程中QA同学提了一个bug, 当手机日期时间修改后 发现页面时间显示异常, 这种问题非常经典, 也就是**iOS关于时间的处理**.

## 我们对时间的认识

**时间是线性的**,即任意一个时刻，这个地球上只有一个绝对时间值存在，只不过因为时区或者文化的差异，处于同一时空的我们对同一时间的表述或者理解不同。比如，北京的20：00和东京的21：00其实是同一个绝对的时间值。 

> 可以理解为 以一个标准点作为标准点.通过时区微调 来实现全球各个国家的日期显示.

## iOS几种获取时间的方式

#### 1.NSDate   

代码实现

``` objc
- (void)timeIntervalSinceReferenceDate {
    NSDate *date = [NSDate date];
    NSLog(@"date = %lf", date.timeIntervalSinceReferenceDate);
}

```

`NSDate`对象封装单个时间点,与任何特定的日历系统或时区无关.日期对象是不可变的,表示相对于绝对参考日期（`2001年1月1日00:00:00 UTC`）的不变时间间隔，它是以UTC为标准的。

NSDate输出结果:  

``` sh
2020-12-06 12:28:55.795929+0800 ZGTimeDemo[12177:134289] date = 628921735.795845
```

下面计算一下：628921735.795845/365/86400 = 19.942977，今年是2020年，距离2001年正好是19年.

如果我们直接打印NSDate

``` objc
NSDate *date = [NSDate date];
NSLog(@"%@",date);
```

则会输出

``` sh
2020-12-06 06:51:04 +0000
```

可见NSDate输出的是绝对的UTC时间，而北京时间的时区为UTC+8，上面的输出+8个小时，刚好就是我当前的时间了。所以正常`UTC + 时区`才是真正的时间日期. 至于时区加减请参考下图. 

![](/assets/images/20201206iOSsynchronousTimeWithServer/iOSsynchronousTimeWithServerZone.webp)


 **注意: NSDate是受手机系统时间控制的,当你修改了手机上的时间显示，NSDate获取当前时间的输出也会随之改变。在我们做App的时候，明白这一点，就知道NSDate并不可靠，因为用户可能会修改它的值**.
 
#### 2.函数CFAbsoluteTimeGetCurrent()
 
 > 官方文档: 绝对时间是相对于绝对参考日期(格林尼治标准时间2001年1月1日00时00分)以秒计算的。正值表示引用日期之后的日期，负值表示引用日期之前的日期。例如，绝对时间-32940326相当于1999年12月16日17:54:34。重复调用这个函数不能保证单调递增的结果。系统时间可能由于与外部时间引用同步或由于显式的用户更改时钟而减少。
 
`CFAbsoluteTimeGetCurrent()`的概念和NSDate非常相似，只不过参考点是：以GMT为标准的，2001年一月一日00：00：00这一刻的时间绝对值。

**注意:CFAbsoluteTimeGetCurrent()也会跟着当前设备的系统时间一起变化,也可能会被用户修改.**


#### 3.`gettimeofday()`

``` objc
int gettimeofday(struct timeval * __restrict, void * __restrict);
```
这个函数获取的是UNIX time.

``` objc
struct timeval now;
struct timezone tz;
gettimeofday(&now, &tz);
NSLog(@"gettimeofday: %ld", now.tv_sec);
```

``` sh
gettimeofday: 1607238723
```

##### UNIX time又是什么呢?

Unix time是以UTC 1970年1月1号 00：00：00为基准时间，当前时间距离基准点偏移的秒数。上述API返回的值是1607238723，表示当前时间距离UTC 1970年1月1号 00：00：00一共过了1607238723秒。

`Unix time`也是平时我们使用较多的一个时间标准，在Mac的终端可以通过以下命令转换成可阅读的时间：

``` sh
date -r 1607238723
```

输出

``` sh
2020年12月 6日 星期日 15时12分03秒 CST
```

**注意:`gettimeofday()`,`NSDate`,`CFAbsoluteTimeGetCurrent`这三个都是受当前设备的系统时间影响.只不过是参考的时间基准点不一样而已。我们和服务器通讯的时候一般使用NIX time.**


#### 5.`mach_absolute_time()`

在我们的iPhone上刚好有一个这样的值存在,它就是CPU的时钟周期数(ticks),这个`tick`的数值可以用来描述时间,而`mach_absolute_time()`返回的就是CPU已经运行的`tick`的数量。将这个`tick`数经过一定的转换就可以变成秒数,或者纳秒数.这样就和时间直接关联了.不过这个`tick`数,在每次手机重启之后,会重新开始计数,而且iPhone锁屏进入休眠之后`tick`也会暂停计数.

**注意: `mach_absolute_time()`不会受系统时间影响,只受设备重启和休眠行为影响**

#### 6.`CACurrentMediaTime()`

`CACurrentMediaTime()`就是将上面`mach_absolute_time()`的CPU`tick`数转化成秒数的结果。以下代码：

``` objc
double mediaTime = CACurrentMediaTime();
NSLog(@"CACurrentMediaTime: %f", mediaTime);
```

``` sh
2020-12-06 15:34:59.808799+0800 ZGTimeDemo[19731:281283] CACurrentMediaTime: 17789.582767
```
返回的就是开机后设备一共运行了(设备休眠不统计在内)多少秒.

这个API等同于下面代码:

``` objc
NSTimeInterval systemUptime = [[NSProcessInfo processInfo] systemUptime];
```

**注意:`CACurrentMediaTime()`也不会受系统时间影响,只受设备重启和休眠行为影响.**

#### 7.sysctl()

iOS系统还记录了上次设备重启的时间。可以通过如下API调用获取:

``` objc
#include <sys/sysctl.h>
- (long)bootTime
{
#define MIB_SIZE 2
    int mib[MIB_SIZE];
    size_t size;    
    struct timeval  boottime;

    mib[0] = CTL_KERN;
    mib[1] = KERN_BOOTTIME;
    size = sizeof(boottime);    
    if (sysctl(mib, MIB_SIZE, &boottime, &size, NULL, 0) != -1)
    {        
        return boottime.tv_sec;
    }    
    return 0;
}
```
返回的值是上次设备重启的Unix time。

**注意:这个API返回的值也会受系统时间影响，用户如果修改时间，值也会随着变化.**

## 客户端和服务器之间的时间同步

一般我们发起请求的时候都是在公参中带上本地时间,如果有一些比较敏感的接口会遇到用户更改系统时间的异常case导致异常.为了防止用户通过断网修改系统时间,来影响客户端的逻辑我们通常都这样做.

* 获取服务器某一时刻`A`的时间;
* 记录获取到时刻`A`时的本地时间`B`;
* 需要用到时间时,获取当前本地时间`C`,当`C`-`B`作为时间间隔`D`,则`A` + `D` 则是当前服务器的时间.


这里要准确做到客户端时间和服务器时间一致,很关键的问题就是`B`和`C`不能受系统时间的影响,要解决这个问题，要依靠iOS的接口--**系统运行时间**

首先: 我们要依靠服务端给一个准确的时间戳.每次同步记录一个得到服务端时间戳B.我们就是要用运行的时间差来解决时间校时问题.

获取系统当前运行了多长时间方法:

``` objc
//get system uptime since last boot
- (NSTimeInterval)uptime
{    
    struct timeval boottime;    
    int mib[2] = {CTL_KERN, KERN_BOOTTIME};
    size_t size = sizeof(boottime);    
    struct timeval now;   
    struct timezone tz;
    gettimeofday(&now, &tz);   
    double uptime = -1;   
    if (sysctl(mib, 2, &boottime, &size, NULL, 0) != -1 && boottime.tv_sec != 0)
    {
        uptime = now.tv_sec - boottime.tv_sec;
        uptime += (double)(now.tv_usec - boottime.tv_usec) / 1000000.0;
    }   
    return uptime;
}
```

**注意:这个函数返回的是秒.和server返回的unix time可能要乘以1000**.(1s = 1000ms)

`gettimeofday()`和`sysctl()`都会受系统时间影响,但他们二者做一个减法所得的值,就和系统时间无关了.这样就可以避免用户修改时间了。当然用户如果关机,过段时间再开机,会导致我们获取到的时间慢与服务器时间,真实场景中,慢于服务器时间往往影响较小,我们一般担心的是客户端时间快于服务器时间.

以下这段代码也可以做到不被修改`local_absolute_n_clock ()`返回秒

``` c++
namespace
{
    mach_timebase_info_data_t init_mach_timebase_info()
    {
        mach_timebase_info_data_t info;
        mach_timebase_info(&info);
        return info;
    }
}

int64_t CTimestamp::local_absolute_n_clock()
{
    static mach_timebase_info_data_t sTimebaseInfo = init_mach_timebase_info();
    int64_t t = mach_absolute_time();
    return t * sTimebaseInfo.numer / sTimebaseInfo.denom;
}
CTimestamp::CTimestamp()
{
    m_base_tm = time(0)*(1000*1000*1000);
    m_base_clock = local_absolute_n_clock();
}

```

# 总结

本篇问题的解决难点的关键在于如果获取本地的时间,我们这里取的是`系统运行时间进行的差值计算法`.我没有尝试过 休眠 退后台等逻辑消耗的时长.但是我认为如果要做好工具类,要尝试计算后台消耗的时间计时时长,可以也可以通过系统运行时间的差值运算得到准确的时间.


本篇重点:  ABCD同步时间算法 主要依赖于服务端给的时间作为基准点. 另一个难点怎么获取系统运行时间做差值计算 来解决系统时间被用户修改后时间不准的问题. 硬核代码 并没有写成相关工具类,小伙伴们可以自行实现比较简单我就不写demo了.本篇文章也是我第一次切换到jekyll 第一次发布文章,如果本文对你有帮助可以收藏


参考:

[iOS关于时间的处理](https://mp.weixin.qq.com/s/cSZUNMuqk6DL3-nctyxzcw?)  
[客户端和服务器的时间同步问题解决](https://www.jianshu.com/p/61e6385f8cf6)
