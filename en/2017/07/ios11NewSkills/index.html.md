---
layout: post
title: What's New in iOS 11
date: 2017-07-13 10:55:15
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

![whatisnewsinios](/assets/images/20170713ios11NewSkills/whatisnewsinios11.avif)

## Availability Checking API

In Swift code, you often see that a certain API is available since iOS 10.0

Like the following code

``` swift
	if (@available(iOS 11, *)) {
		//Available on iOS 11
	} else {
		//Legacy API
	}

```
In Xcode 9, the compiler adds Objective-C version of API availability checking

##### Mark method availability with the `API_AVAILABLE` macro

``` objc
@interface ViewController : UIViewController
- (void)xxxMethodA API_AVAILABLE(ios(11.0));
- (void)xxxMethodB API_AVAILABLE(ios(8.0), macos(10.10), watchos(2.0), tvos(9.0));
@end

```

> Remember that `macos`, `ios`, `watchos`, `tvos` must all be lowercase

By using this approach for availability checks, the editor won't produce warnings, and at runtime the corresponding code is executed based on the iOS system version.

##### Mark the availability of an entire `class` with the `API_AVAILABLE` macro

``` objc
API_AVAILABLE(ios(11.0))
@interface A : NSObject
- (void)xxxMothod;
@end
```

Looking at this, you might think it's all for Objective-C code. Is there anything for C/C++? There certainly is

##### C/C++ code can use ``

To check availability

``` c++

if (__builtin_available(iOS 11, macOS 10.13, *)) {
     xxxxFunc();
}
```

``` c++
// Import the header file
#include <os/availability.h> 

// Availability check for declaring functions
void myFunctionForiOS11OrNewer(int i) API_AVAILABLE(ios(11.0), macos(10.13));  

// Availability check for class XXXClassA
class API_AVAILABLE(ios(11.0), macos(10.13)) XXXClassA;  
```

By default, `API_AVAILABLE()` only takes effect for APIs on `iOS 11` / `tvOS 11` / `macOS 10.13` / `watchOS 4` and later

If your project wants to use this new LLVM feature, you need to modify the `Unguarded availability` in `build settings`, as shown below:

![availability](/assets/images/20170713ios11NewSkills/availability.avif)

## Static Analysis

In an earlier article I talked about [Static Analysis](https://www.sunyazhou.com/2017/06/EnableStaticAnalyer/)

Here I'll talk about the changes

### NSNumber/CFNumberRed Static Analysis Delay

When we mistakenly judge an NSNumber, static analysis gives us a hint

![error](/assets/images/20170713ios11NewSkills/error.avif)
 

In Xcode 9, you can directly change such ignored problems into errors

![static](/assets/images/20170713ios11NewSkills/static.avif)

## Enable LTO and Set It to Incremental Mode

Link-time optimization (hereafter `LTO`) is an optimization feature of LLVM. Its main principle is:

*Use the intermediate format obtained from some optimizations of object files to perform deep optimization at the link stage, including analysis at the code logic level, removing functions, variables, and even local code fragments that aren't actually used, thereby reducing the installation package size while improving runtime efficiency.*

For LTO, the improvement Xcode 9 makes is mainly further optimizing the compile speed. The example Apple demonstrated used a large C++ project as a reference: for a full link, Xcode 9 is 35% faster than Xcode 8; for an incremental link, Xcode 9 is nearly 60% faster than Xcode 8.

![lto](/assets/images/20170713ios11NewSkills/lto1.avif)

![lto](/assets/images/20170713ios11NewSkills/lto2.avif)

Enable LTO

![LTO](/assets/images/20170713ios11NewSkills/LTO.avif)

It's said to optimize the package size and runtime speed by about 10%

## GCD Unified Queue Identifier

The unified queue identifier refers to queues created in various places scattered around the project. If the queue identifiers are the same, they will be bound together in the kernel, which can improve efficiency by 30%. Apple hasn't told us how the kernel does this, but it provides this suggestion: if a category of operations are similar in importance or other attributes, or if the developer wants scattered code in the project to be controlled in the same queue, then we can specify a common identifier when creating the queue. The system will then bind queues with the same identifier together in the kernel for management

As in the following code, if the app uses the same string everywhere, efficiency can be improved by 30%

``` objc
	dispatch_queue_t queue = dispatch_queue_create("com.sunyazhou.demo.queue", DISPATCH_QUEUE_CONCURRENT);
    dispatch_async(queue, ^{
       //Write asynchronous code here
    });
```

> Honestly speaking, in a project it's unavoidable to have file uploads/downloads or time-consuming tasks. Making everything one queue clearly doesn't fit the business requirements. If you want to keep queues with a single identifier as much as possible, you can only do it based on business categories. It's worth trying when you get the chance

End

Reference
