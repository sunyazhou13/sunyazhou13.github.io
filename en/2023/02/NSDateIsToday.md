---
layout: post
title: Checking Whether an NSDate Is Today in iOS
date: 2023-02-13 19:39 +0800
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

![date](/assets/images/20230213NSDateIsToday/date.avif)

# Preface

This article is strongly personal in tone. If it makes you uncomfortable, please close it immediately. This article is for personal learning records only. You are welcome to repost or share it within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!



## Background

In daily iOS development, we often encounter the need to check whether some logic only happens once a day. Usually the common approach is to use NSDate to determine whether it is today, then persist the NSDate — e.g., in `MMKV` or `NSUserDefault`. But as the project grows larger, we gradually pay attention to some details and code
execution time.

First, let's look at several different implementations of the logic to check whether an `NSDate` is today.

* 1. System NSCalendar

``` objc
NSDate *date = [NSDate date]; //这里取当前日期,正常应该作为参数传入NSDate
BOOL inToday = [[NSCalendar currentCalendar] isDateInToday:date]
```

* 2. Calling NSCalendar with more parameters

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

* 3. By comparing time

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
    // End of the previous day. 16:00 is the end (8-hour time zone). Today begins, i.e. 00:00:00 of the previous day.
    unsigned int flags      = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
    NSDateComponents *parts = [[NSCalendar currentCalendar] components:flags fromDate:self];
    [parts setHour:0];
    [parts setMinute:0];
    [parts setSecond:0];
    return [[NSCalendar currentCalendar] dateFromComponents:parts];
}
```

All of these are code for checking whether a date is today.

#### The Story Begins

Today at work, while reviewing code, we disagreed on the performance cost of checking whether an NSDate is today. The way engineers solve problems is simple: prove it by running the code.

I chose methods 1 and 3 for testing. Here's the code:

![result](/assets/images/20230213NSDateIsToday/result.avif)

``` sh
2023-02-13 19:59:08.855078+0800 NSDateSpeedDemo[1837:197213] NSCalendar耗时:0.011064
2023-02-13 19:59:11.108141+0800 NSDateSpeedDemo[1837:197213] NSDate (YZUtils)耗时:0.030793
```

Here's the full code:

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

# Summary

The difference is still at least around 1x. If such operations are frequent, it can indeed affect performance to some extent.


[demo](https://github.com/sunyazhou13/NSDateSpeedDemo)
