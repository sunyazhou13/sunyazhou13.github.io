---
layout: post
title: "Swift defer Keyword"
date: 2023-02-01 10:10:58 +0800
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This article carries strong personal sentiments. If you find it uncomfortable to read, please close it. This article is for personal learning records only. You're welcome to repost or share it within the scope of the license — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


## The defer Keyword

In Swift, there's a keyword very similar to `finally` in try-catch-finally. After a code block completes execution, it executes final cleanup code to finish some teardown work.

For example:

Cleanup work, resource reclamation.
Similar to the example in the Swift documentation, a great use case for defer is cleanup work. File operations are a perfect example:
Closing files.

``` swift
func foo() {
  let fileDescriptor = open(url.path, O_EVTONLY)
  defer {
    close(fileDescriptor)
  }
  // use fileDescriptor...
}
```

Another example:

Deallocating manually allocated memory, finally destroying it.

``` swift
func foo() {
  let valuePointer = UnsafeMutablePointer<T>.allocate(capacity: 1)
  defer {
    valuePointer.deallocate(capacity: 1)
  }
  // use pointer...
}
```

#### Simple Understanding

You can simply think of the `defer` keyword as the last function to call before return. Whether it's a switch or other condition causing the function to return, if we want to do some cleanup before return, `defer` is a perfect fit.

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

If we use multiple defers, they execute in stack order. Unless necessary, it's not recommended to add multiple `defer` statements.

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

A single scope can have multiple defers, and they execute in reverse order like a stack: each defer is pushed onto a stack, and when the scope ends, the last one pushed executes first. In the code above, it prints in order 1, 2, 3, 4, 5, 6.


## Official Definition

> You use a defer statement to execute a set of statements just before code execution leaves the current block of code. This statement lets you do any necessary cleanup that should be performed regardless of how execution leaves the current block of code—whether it leaves because an error was thrown or because of a statement such as return or break. For example, you can use a defer statement to ensure that file descriptors are closed and manually allocated memory is freed.

> A defer statement defers execution until the current scope is exited. This statement consists of the defer keyword and the statements to be executed later. The deferred statements may not contain any code that would transfer control out of the statements, such as a break or a return statement, or by throwing an error. Deferred actions are executed in the reverse of the order that they're written in your source code. That is, the code in the first defer statement executes last, the code in the second defer statement executes second to last, and so on. The last defer statement in source code order executes first.

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

The example above uses a defer statement to ensure that the `open(_:)` function has a corresponding call to `close(_:)`.

> You can use a defer statement even when no error handling code is involved.


[Specifying Cleanup Actions](https://docs.swift.org/swift-book/LanguageGuide/ErrorHandling.html)

## Summary

In 2023, I can write more Swift now. I hope to record things I often forget, so I can easily look them up when needed.
