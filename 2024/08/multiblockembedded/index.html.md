---
layout: post
title: 在Objective-C中多层block嵌套时如何使用weak self和strong self
date: 2024-08-22 12:32 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---

![](/assets/images/20240822MultiBlockEmbedded/Objective-C.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 开发中遇到的问题

在Objective-C中如何 正确的使用 block的 weakSelf和 strongSelf在 多层blokc

在Objective-C中，`weak self`和`strong self`用于解决循环引用问题。当你在一个方法中使用了`self`作为block的参数时，你需要使用`__weak typeof(self) weakSelf = self;`来创建一个弱引用，以避免循环引用。然后在block内部，你可以使用`strongSelf`来获取一个强引用。

以下是一个示例，展示了如何在三层嵌套的方法中使用`weak self`和`strong self`：

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

在这个示例中，我们在每一层方法中都使用了`__weak typeof(self) weakSelf = self;`来创建弱引用，并在下一层方法中使用`__weak typeof(weakSelf) weakSelf2 = weakSelf;`。最后，在最内层的方法中，我们使用`__strong typeof(weakSelf3) strongSelf = weakSelf3;`来获取一个强引用，以便在该层方法中使用。