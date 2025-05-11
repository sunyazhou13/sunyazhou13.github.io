---
layout: post
title: iOS卡顿监控代码
date: 2024-10-22 05:01 +0000
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


监控原理是注册runloop观察者，检测耗时，记录调用栈，上报后台分析。长时间卡顿后，若未进入下一个活跃状态，则标记为卡死崩溃上报。

以下是一个 iOS 卡死监控的代码示例：

``` objc
//
//  MTHangMonitor.h
//  HangTest
//
//  Created by sunyazhou on 2024/10/22.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <execinfo.h>
#import <sys/time.h>

NS_ASSUME_NONNULL_BEGIN

// 定义 Runloop 模式的枚举
typedef enum {
    eRunloopDefaultMode,  // 默认模式
    eRunloopTrackingMode  // 追踪模式
} RunloopMode;

// 全局变量，用于记录 Runloop 的活动状态和模式
static CFRunLoopActivity g_runLoopActivity;
static RunloopMode g_runLoopMode;
static BOOL g_bRun = NO;  // 标记 Runloop 是否在运行
static struct timeval g_tvRun;  // 记录 Runloop 开始运行的时间

// HangMonitor 类，用于监控卡死情况
@interface MTHangMonitor : NSObject

@property (nonatomic, assign) CFRunLoopObserverRef runLoopBeginObserver;  // Runloop 开始观察者
@property (nonatomic, assign) CFRunLoopObserverRef runLoopEndObserver;    // Runloop 结束观察者
@property (nonatomic, strong) dispatch_semaphore_t semaphore;  // 信号量，用于同步
@property (nonatomic, assign) NSTimeInterval timeoutInterval;  // 超时时间

+ (instancetype)sharedInstance;

- (void)addRunLoopObserver;  // 添加 Runloop 观察者的方法
- (void)startMonitor;  // 启动监控的方法
- (void)logStackTrace;  // 记录调用栈的方法
- (void)reportHang;  // 上报卡死的方法

@end

@implementation MTHangMonitor

// 单例模式，确保 HangMonitor 只有一个实例
+ (instancetype)sharedInstance {
    static MTHangMonitor *instance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[MTHangMonitor alloc] init];
    });
    return instance;
}

// 初始化方法
- (instancetype)init {
    self = [super init];
    if (self) {
        _timeoutInterval = 6.0;  // 设置超时时间为6秒
        _semaphore = dispatch_semaphore_create(0);  // 创建信号量
        [self addRunLoopObserver];  // 添加 Runloop 观察者
        [self startMonitor];  // 启动监控
    }
    return self;
}

// 添加 Runloop 观察者的方法
- (void)addRunLoopObserver {
    NSRunLoop *curRunLoop = [NSRunLoop currentRunLoop];  // 获取当前 Runloop

    // 创建第一个观察者，监控 Runloop 是否处于运行状态
    CFRunLoopObserverContext context = {0, (__bridge void *) self, NULL, NULL, NULL};
    CFRunLoopObserverRef beginObserver = CFRunLoopObserverCreate(kCFAllocatorDefault, kCFRunLoopAllActivities, YES, LONG_MIN, &myRunLoopBeginCallback, &context);
    CFRetain(beginObserver);  // 保留观察者，防止被释放
    self.runLoopBeginObserver = beginObserver;

    // 创建第二个观察者，监控 Runloop 是否处于睡眠状态
    CFRunLoopObserverRef endObserver = CFRunLoopObserverCreate(kCFAllocatorDefault, kCFRunLoopAllActivities, YES, LONG_MAX, &myRunLoopEndCallback, &context);
    CFRetain(endObserver);  // 保留观察者，防止被释放
    self.runLoopEndObserver = endObserver;

    // 将观察者添加到当前 Runloop 中
    CFRunLoopRef runloop = [curRunLoop getCFRunLoop];
    CFRunLoopAddObserver(runloop, beginObserver, kCFRunLoopCommonModes);
    CFRunLoopAddObserver(runloop, endObserver, kCFRunLoopCommonModes);
}

// 第一个观察者的回调函数，监控 Runloop 是否处于运行状态
void myRunLoopBeginCallback(CFRunLoopObserverRef observer, CFRunLoopActivity activity, void *info) {
    MTHangMonitor *monitor = (__bridge MTHangMonitor *)info;
    g_runLoopActivity = activity;  // 更新全局变量，记录当前的 Runloop 活动状态
    g_runLoopMode = eRunloopDefaultMode;  // 更新全局变量，记录当前的 Runloop 模式
    switch (activity) {
        case kCFRunLoopEntry:
            g_bRun = YES;  // 标记 Runloop 进入运行状态
            break;
        case kCFRunLoopBeforeTimers:
        case kCFRunLoopBeforeSources:
        case kCFRunLoopAfterWaiting:
            if (g_bRun == NO) {
                gettimeofday(&g_tvRun, NULL);  // 记录 Runloop 开始运行的时间
            }
            g_bRun = YES;  // 标记 Runloop 处于运行状态
            break;
        case kCFRunLoopAllActivities:
            break;
        default:
            break;
    }
    dispatch_semaphore_signal(monitor.semaphore);  // 发送信号量
}

// 第二个观察者的回调函数，监控 Runloop 是否处于睡眠状态
void myRunLoopEndCallback(CFRunLoopObserverRef observer, CFRunLoopActivity activity, void *info) {
    MTHangMonitor *monitor = (__bridge MTHangMonitor *)info;
    g_runLoopActivity = activity;  // 更新全局变量，记录当前的 Runloop 活动状态
    g_runLoopMode = eRunloopDefaultMode;  // 更新全局变量，记录当前的 Runloop 模式
    switch (activity) {
        case kCFRunLoopBeforeWaiting:
            gettimeofday(&g_tvRun, NULL);  // 记录 Runloop 进入睡眠状态的时间
            g_bRun = NO;  // 标记 Runloop 进入睡眠状态
            break;
        case kCFRunLoopExit:
            g_bRun = NO;  // 标记 Runloop 退出运行状态
            break;
        case kCFRunLoopAllActivities:
            break;
        default:
            break;
    }
    dispatch_semaphore_signal(monitor.semaphore);  // 发送信号量
}

// 启动监控的方法
- (void)startMonitor {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
        while (YES) {
            long result = dispatch_semaphore_wait(self.semaphore, dispatch_time(DISPATCH_TIME_NOW, self.timeoutInterval * NSEC_PER_SEC));
            if (result != 0) {
                if (g_runLoopActivity == kCFRunLoopBeforeSources || g_runLoopActivity == kCFRunLoopAfterWaiting) {
                    [self logStackTrace];  // 记录调用栈
                    [self reportHang];  // 上报卡死
                }
            }
        }
    });
}

// 记录调用栈的方法
- (void)logStackTrace {
    void *callstack[128];
    int frames = backtrace(callstack, 128);
    char **strs = backtrace_symbols(callstack, frames);
    NSMutableString *stackTrace = [NSMutableString stringWithString:@"\n"];
    for (int i = 0; i < frames; i++) {
        [stackTrace appendFormat:@"%s\n", strs[i]];
    }
    free(strs);
    NSLog(@"%@", stackTrace);
}

// 上报卡死的方法
- (void)reportHang {
    // 在这里实现上报后台分析的逻辑
    NSLog(@"检测到卡死崩溃，进行上报");
}


NS_ASSUME_NONNULL_END

```

以上代码中 HangMonitor 类会在主线程的 RunLoop 活动中检测是否有长时间的卡顿，并在检测到卡顿时记录调用栈并上报后台进行分析。超时时间设定为 6 秒，以覆盖大部分用户感知场景并减少性能损耗。

使用示例代码:

``` objc
#import <UIKit/UIKit.h>
#import "AppDelegate.h"
#import "MTHangMonitor.h"

int main(int argc, char * argv[]) {
    NSString * appDelegateClassName;
    @autoreleasepool {
        __unused MTHangMonitor *monitor = [MTHangMonitor sharedInstance];  // 获取 HangMonitor 单例
        // Setup code that might create autoreleased objects goes here.
        appDelegateClassName = NSStringFromClass([AppDelegate class]);
    }
    return UIApplicationMain(argc, argv, nil, appDelegateClassName);
}

```

# 总结

卡顿监控代码

[代码引用自 二刷 iOS 性能与编译，简单点说
](https://mp.weixin.qq.com/s/X96VdTsskmNVCoqMzZjbgg)