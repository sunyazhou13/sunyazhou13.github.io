---
layout: post
title: Swift中的defer关键字
date: 2023-02-01 10:10:58 +0800
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## defer关键字

在swift中有一个关键字非常 类似 try catch finally中的`finally`,在一个代码块中执行完成后 执行最后的收尾代码完成一些收尾工作.

例如: 

清理工作、回收资源
跟 swift 文档举的例子类似，defer一个很适合的使用场景就是用来做清理工作。文件操作就是一个很好的例子：
关闭文件

``` swift
func foo() {
  let fileDescriptor = open(url.path, O_EVTONLY)
  defer {
    close(fileDescriptor)
  }
  // use fileDescriptor...
}
```

在例如：

dealloc 手动分配的空间,最后销毁内存

``` swift
func foo() {
  let valuePointer = UnsafeMutablePointer<T>.allocate(capacity: 1)
  defer {
    valuePointer.deallocate(capacity: 1)
  }
  // use pointer...
}
```

#### 简单理解

我可以简单的把`defer`关键字理解为 return之前要调用的最后一个函数.无论是switch还是其它条件导致函数return返回,如果我们想在return之前做一些收尾工作那么`defer`非常合适.

``` swift
func foo() {
	...
	defer {
		//这里代码块在return之前调用
	}
	...
	return;
}
```

如果我们使用多个defer的话 会按照 defer压栈顺序执行.非不要不建议要加多个`defer`

``` swift 
func foo() {
  print("1")
  defer {
    print("6")
  }
  print("2")
  defer {
    print("5")
  }
  print("3")
  defer {
    print("4")
  }
}
```

一个 scope 可以有多个 defer，顺序是像栈一样倒着执行的：每遇到一个 defer 就像压进一个栈里，到 scope 结束的时候，后进栈的先执行。如下面的代码，会按 1、2、3、4、5、6 的顺序 print 出来。


## 官方定义

> You use a defer statement to execute a set of statements just before code execution leaves the current block of code. This statement lets you do any necessary cleanup that should be performed regardless of how execution leaves the current block of code—whether it leaves because an error was thrown or because of a statement such as return or break. For example, you can use a defer statement to ensure that file descriptors are closed and manually allocated memory is freed.

> A defer statement defers execution until the current scope is exited. This statement consists of the defer keyword and the statements to be executed later. The deferred statements may not contain any code that would transfer control out of the statements, such as a break or a return statement, or by throwing an error. Deferred actions are executed in the reverse of the order that they’re written in your source code. That is, the code in the first defer statement executes last, the code in the second defer statement executes second to last, and so on. The last defer statement in source code order executes first.

``` swift
func processFile(filename: String) throws {
    if exists(filename) {
        let file = open(filename)
        defer {
            close(file)
        }
        while let line = try file.readline() {
            // Work with the file.
        }
        // close(file) is called here, at the end of the scope.
    }
}
```

The above example uses a defer statement to ensure that the `open(_:)` function has a corresponding call to `close(_:)`.

> You can use a defer statement even when no error handling code is involved.


[Specifying Cleanup Actions](https://docs.swift.org/swift-book/LanguageGuide/ErrorHandling.html)

## 总结

2023年swift能多写一些了,希望记录一些经常忘记的内容,方便使用时及时翻阅查找.
