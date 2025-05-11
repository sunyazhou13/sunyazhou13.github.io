---
layout: post
title: Swift中的do catch
date: 2024-08-11 01:55 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---


![](/assets/images/20240727Magnificationgesture/SwiftUI.webp)


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# Swift中的do-catch语句

在Swift中，`do-catch`语句是用于异常处理的机制。它允许你执行可能会抛出错误的代码块（在`do`块中），并捕获这些错误（在`catch`块中）以便处理。这是Swift中处理运行时错误的一种优雅方式。

## 示例


```swift
do {
    // 尝试执行的代码，这里可能会抛出错误
    let number = "这不是一个数字"
    let myNumber = Int(number) // 这行可能会因为转换失败而抛出错误
    
    // 如果上面的代码没有抛出错误，这里的代码将执行
    print("转换成功: \(myNumber)")
} catch let error as NSError {
    // 捕获并处理错误
    print("发生错误: \(error.localizedDescription)")
}
```

## 解释

1. **do块**
   - 在`do`块中，你放置可能会抛出错误的代码。
   - 示例中尝试将一个字符串`"这不是一个数字"`转换为`Int`类型，这通常会失败并抛出一个错误。

2. **catch块**
   - `catch`块紧随`do`块之后。
   - 它用于捕获`do`块中抛出的错误。
   - 你可以根据错误的具体类型（通过模式匹配）来捕获不同类型的错误。在示例中，我们捕获了所有符合`NSError`类型的错误。
   - 一旦捕获到错误，你就可以在`catch`块中编写代码来处理这个错误。

## 注意

- 从Swift 2开始，`NSError`的使用被Swift的错误处理机制所取代，但示例中仍然使用它是因为它展示了如何捕获和处理错误。
- 在最新的Swift版本中，你更可能会看到使用`Error`协议的错误处理，而不是`NSError`。

## 简化的catch块

```swift
do {
    // 尝试执行的代码
} catch {
    // 捕获所有错误
    print("发生错误")
}
```

在这个简化的版本中，我们没有指定错误的具体类型，因此它会捕获`do`块中抛出的任何类型的错误。

# 总结

在Metal学习的demo工程中遇到了之前遗忘的内容,记录一下.

``` swift
do {
	pipelineState = try device.makeRenderPipelineState(descriptor: pipelineDescriptor)
} catch {
  	fatalError(error.localizedDescription)
}
```

