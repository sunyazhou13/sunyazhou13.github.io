---
layout: post
title: iOS中NSDate是否是今天Today
date: 2023-02-13 19:39 +0800
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..
---

![](/assets/images/20230213NSDateIsToday/date.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!



## 背景

每天的iOS开发过程中经常会出现Check一些逻辑是否每天仅发生一次,一般我们的通用是用NSDate判断是否是今天,然后对NSDate做持久化存储 eg: `MMKV`、或者`NSUserDefault`,但随着工程的日渐庞大,我们逐渐关注一些细节和代码
的耗时.

首先来看一下几种不同的逻辑判断`NSDate`isToday的代码实现

* 1.系统NSCalendar日历

``` objc
NSDate *date = [NSDate date]; //这里取当前日期,正常应该做为参数传入NSDate
BOOL inToday = [[NSCalendar currentCalendar] isDateInToday:date]
```

* 2.增加更多参数调用NSCalendar

``` objc
- (BOOL)isToday {
    NSCalendar *cal = [NSCalendar currentCalendar];
    NSDateComponents *components = [cal components:(NSCalendarUnitEra|NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay) fromDate:[NSDate date]];
    NSDate *today = [cal dateFromComponents:components];
    components = [cal components:(NSCalendarUnitEra|NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay) fromDate:self];
    NSDate *otherDate = [cal dateFromComponents:components];
    return [today isEqualToDate:otherDate];
}
```

* 3.通过比较时间

``` objc
- (BOOL)isTodayWithDate:(NSDate *)date {
    NSDate *selfBegin = [self dateByBeginDay];
    NSDate *dateBegin = [date dateByBeginDay];
    if (fabs([selfBegin timeIntervalSinceDate:dateBegin]) < 1.0e-6) {
        return YES;
    }
    return NO;
}

- (NSDate *)dateByBeginDay {
    //前一天的结束  16:00为结束  8小时时区  今天开始 也就是说 前一天的00:00:00
    unsigned int flags      = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
    NSDateComponents *parts = [[NSCalendar currentCalendar] components:flags fromDate:self];
    [parts setHour:0];
    [parts setMinute:0];
    [parts setSecond:0];
    return [[NSCalendar currentCalendar] dateFromComponents:parts];
}
```

这几种都是检测是否是当天的代码

#### 故事的开始

今天工作中Review代码 对NSDate的检查判断是否是today的耗时问题产生了分歧,工程师解决问题的方式很简单,实践代码证明是否耗时.

我选中了 第一种和第三种做测试.代码如下:

![](/assets/images/20230213NSDateIsToday/result.webp)

``` sh
2023-02-13 19:59:08.855078+0800 NSDateSpeedDemo[1837:197213] NSCalendar耗时:0.011064
2023-02-13 19:59:11.108141+0800 NSDateSpeedDemo[1837:197213] NSDate (YZUtils)耗时:0.030793
```

完整的代码如下:

``` objc
- (IBAction)didSysDateClick:(id)sender {
    NSDate *date = [NSDate date];
    CFTimeInterval startTime = CACurrentMediaTime();
    for (int i = 0; i < 1000; i++) {
        __unused BOOL inToday = [[NSCalendar currentCalendar] isDateInToday:date];
    }
    CFTimeInterval endTime = CACurrentMediaTime();
    NSString *log = [NSString stringWithFormat:@"NSCalendar耗时:%f",endTime - startTime];
    NSLog(@"%@", log);
    self.l1.text = log;
    
}

- (IBAction)didOnCusDateClick:(id)sender {
    NSDate *date = [NSDate date];
    CFTimeInterval startTime = CACurrentMediaTime();
    for (int i = 0; i < 1000; i++) {
        __unused BOOL inToday = [date isTodayWithDate:date];
        self.l2.text = [NSString stringWithFormat:@"SysDate:%d",i];
    }
    CFTimeInterval endTime = CACurrentMediaTime();
    NSString *log = [NSString stringWithFormat:@"NSDate (YZUtils)耗时:%f",endTime - startTime];
    NSLog(@"%@", log);
    self.l2.text = log;
}

```

# 总结

这时间上还是差至少1x左右,如果频繁的操作确实会影响一些性能.


[demo](https://github.com/sunyazhou13/NSDateSpeedDemo)