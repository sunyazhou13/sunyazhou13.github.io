---
layout: post
title: iOS Hang Monitor Code
date: 2024-10-22 05:01 +0000
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This article contains strong personal opinions. If you find it uncomfortable to read, please close it immediately. This article is for personal learning records only. You are welcome to reproduce or share it within the scope of the license agreement. Please respect copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thank you for your support!


The monitoring principle is to register RunLoop observers, detect time-consuming operations, record call stacks, and report to the backend for analysis. After a prolonged hang, if the system doesn't enter the next active state, it's marked as a hang crash and reported.

Below is a code example for iOS hang monitoring:

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

// Enum for defining Runloop modes
typedef enum {
    eRunloopDefaultMode,  // 默认模式
    eRunloopTrackingMode  // 追踪模式
} RunloopMode;

// Global variables for recording Runloop activity state and mode
static CFRunLoopActivity g_runLoopActivity;
static RunloopMode g_runLoopMode;
static BOOL g_bRun = NO;  // 标记 Runloop 是否在运行
static struct timeval g_tvRun;  // 记录 Runloop 开始运行的时间

// HangMonitor class for monitoring hang conditions
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

// Singleton pattern, ensures HangMonitor has only one instance
+ (instancetype)sharedInstance {
    static MTHangMonitor *instance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[MTHangMonitor alloc] init];
    });
    return instance;
}

// Initialization method
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

// Method for adding Runloop observers
- (void)addRunLoopObserver {
    NSRunLoop *curRunLoop = [NSRunLoop currentRunLoop];  // 获取当前 Runloop

    // Create the first observer, monitoring whether Runloop is running
    CFRunLoopObserverContext context = {0, (__bridge void *) self, NULL, NULL, NULL};
    CFRunLoopObserverRef beginObserver = CFRunLoopObserverCreate(kCFAllocatorDefault, kCFRunLoopAllActivities, YES, LONG_MIN, &myRunLoopBeginCallback, &context);
    CFRetain(beginObserver);  // 保留观察者，防止被释放
    self.runLoopBeginObserver = beginObserver;

    // Create the second observer, monitoring whether Runloop is sleeping
    CFRunLoopObserverRef endObserver = CFRunLoopObserverCreate(kCFAllocatorDefault, kCFRunLoopAllActivities, YES, LONG_MAX, &myRunLoopEndCallback, &context);
    CFRetain(endObserver);  // 保留观察者，防止被释放
    self.runLoopEndObserver = endObserver;

    // Add observers to the current Runloop
    CFRunLoopRef runloop = [curRunLoop getCFRunLoop];
    CFRunLoopAddObserver(runloop, beginObserver, kCFRunLoopCommonModes);
    CFRunLoopAddObserver(runloop, endObserver, kCFRunLoopCommonModes);
}

// First observer's callback function, monitoring whether Runloop is running
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

// Second observer's callback function, monitoring whether Runloop is sleeping
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

// Method for starting monitoring
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

// Method for logging stack trace
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

// Method for reporting hang
- (void)reportHang {
    // Implement backend reporting and analysis logic here
    NSLog(@"检测到卡死崩溃，进行上报");
}


NS_ASSUME_NONNULL_END

```

In the above code, the HangMonitor class detects prolonged hangs in the main thread's RunLoop activities. When a hang is detected, it records the call stack and reports it to the backend for analysis. The timeout is set to 6 seconds to cover most user-perceivable scenarios while minimizing performance overhead.

Usage example code:

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

# Summary

Hang monitoring code

[Code quoted from A Second Pass Through iOS Performance and Compilation, Simply Put](https://mp.weixin.qq.com/s/X96VdTsskmNVCoqMzZjbgg)
