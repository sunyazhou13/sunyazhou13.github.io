---
layout: post
title: iOS Interview Questions Record
date: 2022-07-14 08:58 +0800
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false


---

# Preface

This post carries strong personal sentiment; if you feel uncomfortable reading it, please close it as soon as possible. This post is only a personal learning record. Reposting or sharing within the license terms is welcome; please respect copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

## NSObject Category Question

If you extend a Category on the NSObject class, will the following code work?

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

The calling code

``` objc
- (void)viewDidLoad {
    [super viewDidLoad];
    [NSObject test];
}
```

The printed result

``` sh
2022-07-14 09:03:41.039406+0800 UIViewTest[1700:16744] 11111
```

#### Answer

Because an object's `isa` pointer ultimately points to the metaclass, and the metaclass is its own instance, the instance method gets called.

## Block Question

What does the following print, and which address pointers are the same?

``` objc
__block int a = 10;
NSLog(@"begin %d, %p",a,&a);
dispatch_async(dispatch_get_main_queue(), ^{
    NSLog(@"in block %d, %p",a,&a);
});
a = 20;
NSLog(@"end %d, %p",a,&a);
```

Results

``` sh
2022-07-14 09:09:04.562941+0800 UIViewTest[2035:23455] begin 10, 0x30998ff08
2022-07-14 09:09:04.563160+0800 UIViewTest[2035:23455] end 20, 0x600003973538
2022-07-14 09:09:04.652175+0800 UIViewTest[2035:23455] in block 20, 0x600003973538

```


## Thread Question

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

Printed result

``` sh
2022-07-14 09:12:46.798861+0800 UIViewTest[2179:26391] 1
2022-07-14 09:12:49.801871+0800 UIViewTest[2179:26296] 2
2022-07-14 09:12:50.804045+0800 UIViewTest[2179:26296] 3
```

Explanation

The order of synchronous tasks depends on which thread the code line containing `dispatch_sync()` runs on. If it's the main thread, the main thread will be blocked waiting for the task to complete. So 1 and 2 are printed first. 3 is printed last because the preceding code block is blocked by the task in the synchronous queue.

# Summary

For detail issues encountered in development, you should be good at investigating their roots and causes. Being good at learning and accumulating knowledge is a necessary condition for becoming an excellent developer.
