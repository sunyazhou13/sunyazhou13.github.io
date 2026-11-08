---
layout: post
title: How to Use weak self and strong self in Nested Blocks in Objective-C
date: 2024-08-22 12:32 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

![Objective-C](/assets/images/20240822MultiBlockEmbedded/Objective-C.avif)

# Preface

This article is strongly personal in tone. If it makes you uncomfortable, please close it immediately. This article is for personal learning records only. You are welcome to repost or share it within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


## A Problem Encountered in Development

How to correctly use a block's `weakSelf` and `strongSelf` across multiple nested blocks in Objective-C.

In Objective-C, `weak self` and `strong self` are used to break retain cycles. When you use `self` as a parameter of a block, you need to use `__weak typeof(self) weakSelf = self;` to create a weak reference in order to avoid a retain cycle. Then, inside the block, you can use `strongSelf` to obtain a strong reference.

Here's an example showing how to use `weak self` and `strong self` in a three-layer nested method:

``` objc
- (void)outerMethod {
    __weak typeof(self) weakSelf = self;
    [self innerMethod1:^{
        __weak typeof(weakSelf) weakSelf2 = weakSelf;
        [weakSelf2 innerMethod2:^{
            __weak typeof(weakSelf2) weakSelf3 = weakSelf2;
            [weakSelf3 innerMethod3:^{
                __strong typeof(weakSelf3) strongSelf = weakSelf3;
                // 在这里使用strongSelf进行操作
            }];
        }];
    }];
}

- (void)innerMethod1:(void (^)(void))completion {
    // ...
    if (completion) {
        completion();
    }
}

- (void)innerMethod2:(void (^)(void))completion {
    // ...
    if (completion) {
        completion();
    }
}

- (void)innerMethod3:(void (^)(void))completion {
    // ...
    if (completion) {
        completion();
    }
}
```

In this example, we use `__weak typeof(self) weakSelf = self;` to create a weak reference in each layer's method, and in the next layer we use `__weak typeof(weakSelf) weakSelf2 = weakSelf;`. Finally, in the innermost method, we use `__strong typeof(weakSelf3) strongSelf = weakSelf3;` to obtain a strong reference for use within that layer's method.
