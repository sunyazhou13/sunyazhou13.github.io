---
layout: post
title: do-catch in Swift
date: 2024-08-11 01:55 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


![Swift UI](/assets/images/20240727Magnificationgesture/SwiftUI.avif)


# Preface

This article contains strong personal opinions. If you find it uncomfortable to read, please close it immediately. This article is for personal learning records only. You are welcome to reproduce or share it within the scope of the license agreement. Please respect copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thank you for your support!

# The do-catch Statement in Swift

In Swift, the `do-catch` statement is a mechanism for error handling. It allows you to execute code that might throw errors (in the `do` block) and catch those errors (in the `catch` block) for handling. This is an elegant way to handle runtime errors in Swift.

## Example


```swift
do {
    // Code to try executing, which might throw an error here
    let number = "这不是一个数字"
    let myNumber = Int(number) // This line might throw an error due to conversion failure
    
    // If the above code doesn't throw an error, the code here will execute
    print("转换成功: \(myNumber)")
} catch let error as NSError {
    // Catch and handle the error
    print("发生错误: \(error.localizedDescription)")
}
```

## Explanation

1. **do block**
   - In the `do` block, you place code that might throw errors.
   - The example tries to convert a string `"这不是一个数字"` to `Int` type, which typically fails and throws an error.

2. **catch block**
   - The `catch` block follows immediately after the `do` block.
   - It is used to catch errors thrown in the `do` block.
   - You can catch different types of errors based on their specific types (through pattern matching). In the example, we catch all errors that conform to the `NSError` type.
   - Once an error is caught, you can write code in the `catch` block to handle it.

## Notes

- Starting from Swift 2, the use of `NSError` was replaced by Swift's error handling mechanism, but it's still used in the example because it demonstrates how to catch and handle errors.
- In the latest Swift versions, you're more likely to see error handling using the `Error` protocol instead of `NSError`.

## Simplified catch Block

```swift
do {
    // Code to try executing
} catch {
    // Catch all errors
    print("发生错误")
}
```

In this simplified version, we don't specify a particular error type, so it catches any type of error thrown in the `do` block.

# Summary

I encountered previously forgotten content while working on a Metal learning demo, so I'm writing it down here.

``` swift
do {
	pipelineState = try device.makeRenderPipelineState(descriptor: pipelineDescriptor)
} catch {
  	fatalError(error.localizedDescription)
}
```
