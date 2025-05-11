---
layout: post
title: iOS面试问题记录
date: 2022-07-14 08:58 +0800
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..

---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

## NSObject Category问题

如果一个给NSObject对象扩展Category, 下面的代码能调用吗？

``` objc
#import <Foundation/Foundation.h>

@interface NSObject (Test)

+ (void)test;

@end

@implementation NSObject (Test)

- (void)test {
    NSLog(@"11111");
}

@end

```

调用代码

``` objc
- (void)viewDidLoad {
    [super viewDidLoad];
    [NSObject test];
}
```

打印结果

``` sh
2022-07-14 09:03:41.039406+0800 UIViewTest[1700:16744] 11111
```

#### 答案

因为对象的`isa`指针最终指向元类,元类也就是自己的实例,所以会调用到实例方法。

## Block问题

下面打印结果是什么样的,地址指针谁和谁相同.

``` objc
__block int a = 10;
NSLog(@"begin %d, %p",a,&a);
dispatch_async(dispatch_get_main_queue(), ^{
    NSLog(@"in block %d, %p",a,&a);
});
a = 20;
NSLog(@"end %d, %p",a,&a);
```

结果

``` sh
2022-07-14 09:09:04.562941+0800 UIViewTest[2035:23455] begin 10, 0x30998ff08
2022-07-14 09:09:04.563160+0800 UIViewTest[2035:23455] end 20, 0x600003973538
2022-07-14 09:09:04.652175+0800 UIViewTest[2035:23455] in block 20, 0x600003973538

```


## 线程问题

``` objc
- (void)viewDidLoad {
    [super viewDidLoad];
    dispatch_queue_t queue = dispatch_queue_create("test", DISPATCH_QUEUE_SERIAL);
    dispatch_async(queue, ^{
        sleep(5);
        NSLog(@"1");
    });
    dispatch_sync(queue, ^{
        sleep(3);
        NSLog(@"2");
    });
    sleep(1);
    NSLog(@"3");
}
```

打印结果

``` sh
2022-07-14 09:12:46.798861+0800 UIViewTest[2179:26391] 1
2022-07-14 09:12:49.801871+0800 UIViewTest[2179:26296] 2
2022-07-14 09:12:50.804045+0800 UIViewTest[2179:26296] 3
```

解答

同步任务的顺序会依据dispatch_sync()函数所在的代码行属于那个线程.如果是主线程则会阻塞主线程等待任务执行完成.所以会打印 1和2. 最后打印 3 因为 前面的代码块被同步队列中的任务所阻塞.

# 总结

开发中的细节问题要善于研其根究其本, 善于学习和积累是成为一个优秀开发者的必要条件.