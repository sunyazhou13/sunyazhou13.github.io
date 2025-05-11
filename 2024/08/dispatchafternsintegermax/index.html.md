---
layout: post
title: NSIntegerMax整数溢出问题记录
date: 2024-08-19 01:50 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 开发中遇到的问题

![](/assets/images/20240819dispatchafterNSIntegermax/popup.gif)

最近开发 测试同学提了一个bug, 首页底部tab的气泡一闪而过瞬间消失,认真追踪代码后发现,配置后台下发`-1`,客户端同学把这个`-1`替换成了NSIntegerMax

如下代码,是控制一个气泡 从展示到结束的代码实现.

``` objc
NSInteger delaySeconds = NSIntegerMax;
NSLog(@"%@,展示前,%zd",[NSDate date],delaySeconds);
dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delaySeconds * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    NSLog(@"%@,展示后,%zd",[NSDate date],delaySeconds);
});
```

假设气泡展示10秒后调用结束的代码移除气泡,但是这段代码 会立即执行.

``` sh
2024-08-19 02:03:16 +0000,展示前,9223372036854775807
2024-08-19 02:03:16 +0000,展示后,9223372036854775807
```

### 为什么会立即执行?

![](/assets/images/20240819dispatchafterNSIntegermax/NSIntegerMax1.webp)

 `NSIntegerMax * NSEC_PER_SEC`= -10亿

负数当然会触发 `dispatch_after()`立即执行.


当你遇到 `NSIntegerMax * NSEC_PER_SEC` 结果为负数的情况时，这通常意味着发生了整数溢出。`NSIntegerMax` 表示 `NSInteger` 类型的最大值，当它与 `NSEC_PER_SEC`（每秒的纳秒数，等于 `1,000,000,000`）相乘时，结果可能会超出 `NSInteger` 能够表示的范围。

在32位系统上，`NSInteger` 是一个32位整数，其最大值是 `2,147,483,647`。而 `NSEC_PER_SEC` 是一个非常大的数，所以当它们相乘时，结果会超过32位整数的最大值，导致溢出。

在64位系统上，`NSInteger` 是一个64位整数，其最大值是 `9,223,372,036,854,775,807`。尽管64位整数的表示范围要大得多，但当它与 `NSEC_PER_SEC` 相乘时，结果仍然可能超出 `NSInteger` 的范围，因为 `NSInteger` 实际上是一个有符号整数，其最大值是 `9,223,372,036,854,775,807`，而 `NSEC_PER_SEC` 乘以 `NSIntegerMax` 会得到一个大于这个值的数字。

整数溢出通常发生在两种情况下：

1. **无符号整数溢出**：当一个无符号整数达到其最大值并继续增加时，它会回绕到0并从0开始重新计数。
2. **有符号整数溢出**：当一个有符号整数达到其最大值并继续增加时，它将变成一个负数。

在这种情况下，由于 `NSInteger` 是有符号的，当它与 `NSEC_PER_SEC` 相乘的结果超出其表示范围时，结果会变为负数。

为了避免这种情况，你应该使用更大的数据类型，比如 `uint64_t` 或 `int64_t`，这些类型可以安全地存储更大的数值。例如：

```objective-c
uint64_t delayInNanoseconds = (uint64_t)NSIntegerMax * NSEC_PER_SEC;
```

使用 `uint64_t` 可以确保乘法操作不会导致负数，因为 `uint64_t` 是一个无符号的64位整数。

### 解决方式

* 定义两个时间最大长度的宏来替代最大值

``` objc
#define SECONDS_IN_A_YEAR 31536000LL // 非闰年
#define SECONDS_IN_A_LEAP_YEAR 31622400LL // 闰年
#define SECONDS_IN_A_MONTH 2629746LL  //一个月最大秒数
#define SECONDS_IN_A_DAY 86400  //一天最大秒数
```


在 Objective-C 中，没有一个标准的宏直接表示一天中的最大秒数。但是，你可以使用一些基本的时间单位宏来计算一天的总秒数。

一天有 24 小时，每小时有 60 分钟，每分钟有 60 秒。所以，一天的总秒数可以通过以下公式计算得出：

\[ \text{一天的总秒数} = 24 \times 60 \times 60 \]

一天的总秒数 = 24 *  60* 60

这等于 86,400 秒。

如果你需要在 Objective-C 代码中使用这个值，你可以定义一个宏或者常量来表示它：

```objective-c
#define SECONDS_IN_A_DAY 86400
```

或者使用 `const` 常量：

```objective-c
const int64_t SecondsInADay = 86400LL;
```

使用 `int64_t` 类型可以确保这个常量足够大，即使在 32 位系统上也能正确表示一天的总秒数。`LL` 后缀确保了这个数字被解释为长长整型（`long long`）常量。

在实际编程中，你可以根据需要使用这个值来进行时间计算。

一个月和一年中的天数不是固定的，因为它们依赖于特定的日历规则。不过，我们可以给出一些近似值和计算方法。

### 一个月的秒数

对于一个月份，我们通常使用平均值来近似计算。一个月平均大约有 30.44 天（考虑了不同月份的天数和闰年的影响）。因此，一个月的总秒数可以近似为：

\[ \text{一个月的总秒数} \approx 30.44 \times 24 \times 60 \times 60 \]

计算结果大约是：

\[ 2,629,746 \text{ 秒} \]

在 Objective-C 中，你可以这样定义一个月的秒数：

```objective-c
#define SECONDS_IN_A_MONTH 2629746LL
```

### 一年的秒数

对于一年，我们通常假设它有 365 天，除非是闰年，那时会有 366 天。因此，一年的总秒数可以这样计算：

- 非闰年：
  \[ \text{一年的总秒数} = 365 \times 24 \times 60 \times 60 \]
- 闰年：
  \[ \text{一年的总秒数} = 366 \times 24 \times 60 \times 60 \]

非闰年：   
一年的总秒数 = 365 × 24 × 60 × 60  
闰年：   
一年的总秒数 = 366 × 24 × 60 × 60

计算结果大约是：

- 非闰年：31,536,000 秒
- 闰年：31,622,400 秒

在 Objective-C 中，你可以这样定义一年的秒数：

```objective-c
#define SECONDS_IN_A_YEAR 31536000LL // 非闰年
#define SECONDS_IN_A_LEAP_YEAR 31622400LL // 闰年
```

请注意，这些值是基于近似计算的，实际的月份和年份长度可能会有所不同。在处理具体的日期和时间计算时，通常需要考虑更复杂的日历规则。在 Objective-C 中，你可以使用 `NSCalendar` 类和 `NSDate` 类来更准确地处理日期和时间。

# 总结

这里的核心问题是不要用一个 NSIntegerMax 去乘以 `一个值` 得出的解决超过了 NSInteger能表示的最大范围,开发中一定要注意.

