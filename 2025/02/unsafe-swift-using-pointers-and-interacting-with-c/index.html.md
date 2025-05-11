---
layout: post
title: 如何使用unsafe Swift指针类型直接访问内存并与C交互
date: 2025-02-22 14:15 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C]
typora-root-url: ..
---

![](/assets/images/20250222UnsafeSwift/banner.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


### 背景介绍

2024年学习《Metal.by.Tutorials.4th.2023.12》中有提到如何使用`Unsafe Swift` 指针和C交互,主要是在内存中如何标识C的内容,下面这篇文章是书中介绍的英文文章我看了以后觉得消化吸收一下,整理成中文版供各位参考.

在本教程中，您将学习如何使用unsafe Swift 通过各种指针类型直接访问内存。作者：Brody Eller。

> 更新说明：Brody Eller 为 Swift 5.1 更新了本教程。原始版本由 Ray Fix 编写。

默认情况下，Swift 是内存安全的：它防止直接访问内存，并确保在使用之前初始化所有内容。关键短语是“默认情况下”。你也可以使用不安全的 Swift，它允许你通过指针直接访问内存。

本教程将带你快速了解 Swift 中所谓的“不安全”特性。

“不安全”并不意味着代码可能会出错或危险。相反，它指的是需要额外小心的代码，因为它限制了编译器在防止你犯错方面的能力。

如果你需要与不安全的语言（如 C）进行交互、需要提高运行时性能，或者只是想探索 Swift 的内部机制，这些特性会非常有用。在本教程中，你将学习如何使用指针并直接与内存系统交互。

> 注意：虽然这是一个高级主题，但如果你对 Swift 有一定的掌握能力，就可以跟上本教程的内容。如果你需要复习 Swift 技能，请查[ iOS 和 Swift 初学者系列](https://www.kodeco.com/ios/learn)。有 C 语言经验会有所帮助，但不是必需的。


### 开始前可以下载本篇文章涉及到的demo

[Download Materials下载初始项目](https://github.com/sunyazhou13/Using-Pointers-and-Interacting-With-C)。

本教程包含三个空的 Swift Playground 文件：

###  探索Unsafe Swift内存布局
首先打开 UnsafeSwift Playground。由于本教程中的所有代码都是跨平台的，你可以选择任意平台

![](/assets/images/20250222UnsafeSwift/memory1.webp)

不安全的 Swift 直接与内存系统交互。你可以将内存想象成一系列盒子——实际上有数十亿个盒子——每个盒子里都包含一个数字。

每个盒子都有一个唯一的内存地址。最小的可寻址存储单元是一个字节（byte），通常由 8 个比特（bit）组成。

8 比特的字节可以存储 0 到 255 之间的值。处理器还可以高效地访问内存中的字（word），字通常由多个字节组成。

例如，在 64 位系统上，一个字是 8 个字节（64 比特）。为了更直观地理解这一点，你可以使用 `MemoryLayout` 来查看一些原生 Swift 类型的大小和对齐方式。

将以下代码添加到你的 Playground 中：

* 在第一个 Playground 中，你将使用几段简短的代码来探索内存布局，并尝试使用不安全的指针。    
* 在第二个 Playground 中，你将使用一个低级的 C API 来执行流式数据压缩，并将其封装为 Swift 风格的接口。  
* 在最后一个 Playground 中，你将创建一个跨平台的替代 `arc4random` 的随机数生成器。它内部使用了不安全的 Swift，但对用户隐藏了这一细节。

首先打开 **UnsafeSwift** Playground。由于本教程中的所有代码都是跨平台的，你可以选择任意平台。

![](/assets/images/20250222UnsafeSwift/memory2.webp)

不安全的 Swift 直接与内存系统交互。你可以将内存想象成一系列盒子——实际上有数十亿个盒子——每个盒子里都包含一个数字。

每个盒子都有一个唯一的内存地址。最小的可寻址存储单元是一个字节（byte），通常由 8 个比特（bit）组成。

8 比特的字节可以存储 0 到 255 之间的值。处理器还可以高效地访问内存中的字（word），字通常由多个字节组成。

例如，在 64 位系统上，一个字是 8 个字节（64 比特）。为了更直观地理解这一点，你可以使用 `MemoryLayout` 来查看一些原生 Swift 类型的大小和对齐方式。

将以下代码添加到你的 Playground 中：

``` swift
import Foundation

MemoryLayout<Int>.size          // returns 8 (on 64-bit)
MemoryLayout<Int>.alignment     // returns 8 (on 64-bit)
MemoryLayout<Int>.stride        // returns 8 (on 64-bit)

MemoryLayout<Int16>.size        // returns 2
MemoryLayout<Int16>.alignment   // returns 2
MemoryLayout<Int16>.stride      // returns 2

MemoryLayout<Bool>.size         // returns 1
MemoryLayout<Bool>.alignment    // returns 1
MemoryLayout<Bool>.stride       // returns 1

MemoryLayout<Float>.size        // returns 4
MemoryLayout<Float>.alignment   // returns 4
MemoryLayout<Float>.stride      // returns 4

MemoryLayout<Double>.size       // returns 8
MemoryLayout<Double>.alignment  // returns 8
MemoryLayout<Double>.stride     // returns 8

```

`MemoryLayout<Type>` 是一个在编译时评估的泛型类型。它用于确定指定 `Type` 的大小（size）、对齐方式（alignment）和步长（stride），并返回以字节为单位的值。

例如，`Int16` 的大小为 2 个字节，对齐方式也是 2。这意味着它必须从偶数地址开始——即地址可以被 2 整除。

例如，可以在地址 100 分配一个 `Int16`，但不能在地址 101 分配——奇数地址违反了所需的对齐要求。

当你将一堆 `Int16` 打包在一起时，它们会按照步长（stride）的间隔排列。对于这些基本类型，步长与大小是相同的。

### 检查结构体的内存布局  
接下来，通过将以下代码添加到 Playground 中，查看一些用户定义的结构体`user-defined struct`的内存布局：

``` swift
struct EmptyStruct {}

MemoryLayout<EmptyStruct>.size      // returns 0
MemoryLayout<EmptyStruct>.alignment // returns 1
MemoryLayout<EmptyStruct>.stride    // returns 1

struct SampleStruct {
  let number: UInt32
  let flag: Bool
}

MemoryLayout<SampleStruct>.size       // returns 5
MemoryLayout<SampleStruct>.alignment  // returns 4
MemoryLayout<SampleStruct>.stride     // returns 8

```

空结构体的大小为零。由于对齐方式为 1，它可以存在于任何地址，因为所有数字都可以被 1 整除。

有趣的是，步长（`stride`）为 1。这是因为即使 `EmptyStruct` 的大小为零，你创建的每个 `EmptyStruct` 都必须有一个唯一的内存地址。

对于 `SampleStruct`，其大小为 5，但步长为 8。这是因为它的对齐要求它必须位于 4 字节的边界上。在这种情况下，Swift 能做到的最佳打包间隔是 8 个字节。

为了查看类（class）和结构体（struct）在内存布局上的区别，请添加以下代码：

``` swift
class EmptyClass {}

MemoryLayout<EmptyClass>.size      // returns 8 (on 64-bit)
MemoryLayout<EmptyClass>.stride    // returns 8 (on 64-bit)
MemoryLayout<EmptyClass>.alignment // returns 8 (on 64-bit)

class SampleClass {
  let number: Int64 = 0
  let flag = false
}

MemoryLayout<SampleClass>.size      // returns 8 (on 64-bit)
MemoryLayout<SampleClass>.stride    // returns 8 (on 64-bit)
MemoryLayout<SampleClass>.alignment // returns 8 (on 64-bit)

```

类是引用类型，因此 `MemoryLayout` 报告的是引用的大小：8 个字节。

如果你想更详细地探索内存布局，可以查看 Mike Ash 的精彩演讲：[Exploring Swift Memory Layout](https://mikeash.com/pyblog/friday-qa-2014-07-18-exploring-swift-memory-layout.html)。

### Using Pointers in Unsafe Swift在不安全的 Swift 中使用指针   

指针封装了一个内存地址。

涉及直接内存访问的类型会带有 `unsafe` 前缀，因此指针类型的名称为 `UnsafePointer`。

额外的输入可能看起来有些烦人，但它提醒你正在访问编译器未检查的内存。如果操作不当，可能会导致未定义行为，而不仅仅是一个可预测的崩溃。

Swift 并不像 C 语言中的 `char *` 那样，只提供一种非结构化的 `UnsafePointer` 类型来访问内存。Swift 提供了近十种指针类型，每种类型都有不同的功能和用途。

你应该始终根据需求选择最合适的指针类型。这不仅能更好地表达意图，还能减少错误并避免未定义行为。

不安全的 Swift 指针使用一种可预测的命名方案来描述指针的特性：可变的（mutable）或不可变的（immutable）、原始的（raw）或类型化的（typed）、缓冲区风格（buffer style）或非缓冲区风格。总共有八种指针组合。你将在接下来的部分中了解更多关于它们的内容。

![](/assets/images/20250222UnsafeSwift/pointers1.webp)

### Using Raw Pointers 使用原始指针  

在本节中，你将使用不安全的 Swift 指针来存储和加载两个整数。将以下代码添加到你的 Playground 中：

``` swift
// 1
let count = 2
let stride = MemoryLayout<Int>.stride
let alignment = MemoryLayout<Int>.alignment
let byteCount = stride * count

// 2
do {
  print("Raw pointers")
  
  // 3
  let pointer = UnsafeMutableRawPointer.allocate(
    byteCount: byteCount,
    alignment: alignment)
  // 4
  defer {
    pointer.deallocate()
  }
  
  // 5
  pointer.storeBytes(of: 42, as: Int.self)
  pointer.advanced(by: stride).storeBytes(of: 6, as: Int.self)
  pointer.load(as: Int.self)
  pointer.advanced(by: stride).load(as: Int.self)
  
  // 6
  let bufferPointer = UnsafeRawBufferPointer(start: pointer, count: byteCount)
  for (index, byte) in bufferPointer.enumerated() {
    print("byte \(index): \(byte)")
  }
}

```

以下是代码的详细说明：

* 1.这些常量保存了常用的值：
	- `count` 保存要存储的整数的数量。
	- `stride` 保存 `Int` 类型的步长（stride）。
	- `alignment` 保存 `Int` 类型的对齐方式。
	- `byteCount` 保存所需的总字节数。  

* 2.一个 `do` 块添加了一个作用域级别，这样你可以在接下来的示例中重用变量名。

* 3.`UnsafeMutableRawPointer.allocate` 分配所需的字节。此方法返回一个 `UnsafeMutableRawPointer`。该类型的名称告诉你，该指针可以加载和存储（或修改）原始字节。

* 4.`defer` 块确保你正确地释放指针。ARC（自动引用计数）在这里不会帮助你——你需要自己管理内存！你可以在 [官方 Swift 文档](https://docs.swift.org/swift-book/LanguageGuide/ErrorHandling.html#ID514) 中阅读更多关于 `defer` 语句的内容。

* 5.`storeBytes` 和 `load` 方法用于存储和加载字节。你可以通过将指针前进 `stride` 个字节来计算第二个整数的内存地址。由于指针是 `Strideable` 的，你也可以使用指针算术，例如：`(pointer+stride).storeBytes(of: 6, as: Int.self)`。

* 6.`UnsafeRawBufferPointer` 允许你将内存视为字节集合来访问。这意味着你可以迭代字节并使用下标访问它们。你还可以使用像 `filter`、`map` 和 `reduce` 这样的方法。你可以使用原始指针初始化缓冲区指针。

尽管 `UnsafeRawBufferPointer` 是不安全的，但你仍然可以通过将其约束为特定类型来使其更安全。

### Using Typed Pointers 使用类型化的指针

你可以通过使用类型化指针来简化前面的示例。将以下代码添加到你的 Playground 中：

``` swift
do {
  print("Typed pointers")
  
  let pointer = UnsafeMutablePointer<Int>.allocate(capacity: count)
  pointer.initialize(repeating: 0, count: count)
  defer {
    pointer.deinitialize(count: count)
    pointer.deallocate()
  }
  
  pointer.pointee = 42
  pointer.advanced(by: 1).pointee = 6
  pointer.pointee
  pointer.advanced(by: 1).pointee
  
  let bufferPointer = UnsafeBufferPointer(start: pointer, count: count)
  for (index, value) in bufferPointer.enumerated() {
    print("value \(index): \(value)")
  }
}

```

注意以下区别：

1. 你使用 `UnsafeMutablePointer.allocate` 分配内存。泛型参数让 Swift 知道你将使用该指针来加载和存储 `Int` 类型的值。
2. 在使用类型化内存之前，必须先初始化它，并在使用后反初始化它。你可以分别使用 `initialize` 和 `deinitialize` 方法来完成这些操作。反初始化仅对非平凡类型（non-trivial types）是必需的。然而，包含反初始化操作是一种很好的方式，可以确保代码在未来切换到非平凡类型时仍然有效。通常这不会带来任何开销，因为编译器会将其优化掉。
3. 类型化指针有一个 `pointee` 属性，它提供了一种类型安全的方式来加载和存储值。
4. 当推进类型化指针时，你可以简单地指定你想要推进的值的数量。指针可以根据它指向的值的类型计算出正确的步长（stride）。同样，指针算术也适用。你也可以写成 `(pointer+1).pointee = 6`。
5. 对于类型化的缓冲区指针也是如此：它们迭代的是值而不是字节。

接下来，你将学习如何从无约束的 `UnsafeRawBufferPointer` 转换为更安全的、类型约束的 `UnsafeRawBufferPointer`。

### Converting Raw Pointers to Typed Pointers转换原始指针类型到类型化的指针

你并不总是需要直接初始化类型化指针。你也可以从原始指针中派生出它们。

将以下代码添加到你的 Playground 中：

``` swift
do {
  print("Converting raw pointers to typed pointers")
  
  let rawPointer = UnsafeMutableRawPointer.allocate(
    byteCount: byteCount,
    alignment: alignment)
  defer {
    rawPointer.deallocate()
  }
  
  let typedPointer = rawPointer.bindMemory(to: Int.self, capacity: count)
  typedPointer.initialize(repeating: 0, count: count)
  defer {
    typedPointer.deinitialize(count: count)
  }

  typedPointer.pointee = 42
  typedPointer.advanced(by: 1).pointee = 6
  typedPointer.pointee
  typedPointer.advanced(by: 1).pointee
  
  let bufferPointer = UnsafeBufferPointer(start: typedPointer, count: count)
  for (index, value) in bufferPointer.enumerated() {
    print("value \(index): \(value)")
  }
}

```

这个示例与之前的示例类似，不同之处在于它首先创建了一个原始指针。你通过将内存绑定到所需的类型 `Int` 来创建类型化指针。

通过绑定内存，你可以以类型安全的方式访问它。当你创建类型化指针时，内存绑定会在幕后进行。

这个示例的其余部分也与之前的示例相同。一旦你进入类型化指针的领域，就可以使用 `pointee` 等特性。

### 获取实例的字节  
通常，你已经有一个类型的实例，并且想要检查构成它的字节。你可以使用 `withUnsafeBytes(of:)` 方法来实现这一点。

为此，将以下代码添加到你的 Playground 中：

``` swift
do {
  print("Getting the bytes of an instance")
  
  var sampleStruct = SampleStruct(number: 25, flag: true)

  withUnsafeBytes(of: &sampleStruct) { bytes in
    for byte in bytes {
      print(byte)
    }
  }
}

```

这会打印出 `SampleStruct` 实例的原始字节。

`withUnsafeBytes(of:)` 允许你访问一个 `UnsafeRawBufferPointer`，你可以在闭包中使用它。

`withUnsafeBytes` 也可以作为 `Array` 和 `Data` 的实例方法使用。

### Computing a Checksum计算校验和  

使用 `withUnsafeBytes(of:)`，你可以返回一个结果。例如，你可以使用它来计算结构中字节的 32 位校验和。

将以下代码添加到你的 Playground 中：

``` swift
do {
  print("Checksum the bytes of a struct")
  
  var sampleStruct = SampleStruct(number: 25, flag: true)
  
  let checksum = withUnsafeBytes(of: &sampleStruct) { (bytes) -> UInt32 in
    return ~bytes.reduce(UInt32(0)) { $0 + numericCast($1) }
  }
  
  print("checksum", checksum) // prints checksum 4294967269
}

```

`reduce` 调用将字节相加，然后 `~` 翻转位。虽然这不是最强大的错误检测方法，但它展示了这个概念。

现在你已经了解了如何使用不安全的 Swift，接下来是时候学习一些你绝对不应该用它做的事情了。


### 不安全代码的三条规则  
在编写不安全代码时，务必小心避免未定义行为。以下是一些错误代码的示例：

#### 不要从 `withUnsafeBytes` 返回指针！

``` swift
// Rule #1
do {
  print("1. Don't return the pointer from withUnsafeBytes!")
  
  var sampleStruct = SampleStruct(number: 25, flag: true)
  
  let bytes = withUnsafeBytes(of: &sampleStruct) { bytes in
    return bytes // strange bugs here we come ☠️☠️☠️
  }
  
  print("Horse is out of the barn!", bytes) // undefined!!!
}

```

你绝不应该让指针逃逸出 `withUnsafeBytes(of:)` 闭包。即使你的代码现在可以运行，未来也可能会导致奇怪的错误。


#### 一次只绑定一种类型！

``` swift
// Rule #2
do {
  print("2. Only bind to one type at a time!")
  
  let count = 3
  let stride = MemoryLayout<Int16>.stride
  let alignment = MemoryLayout<Int16>.alignment
  let byteCount = count * stride
  
  let pointer = UnsafeMutableRawPointer.allocate(
    byteCount: byteCount,
    alignment: alignment)
  
  let typedPointer1 = pointer.bindMemory(to: UInt16.self, capacity: count)
  
  // Breakin' the Law... Breakin' the Law (Undefined behavior)
  let typedPointer2 = pointer.bindMemory(to: Bool.self, capacity: count * 2)
  
  // If you must, do it this way:
  typedPointer1.withMemoryRebound(to: Bool.self, capacity: count * 2) {
    (boolPointer: UnsafeMutablePointer<Bool>) in
    print(boolPointer.pointee) // See Rule #1, don't return the pointer
  }
}

```

永远不要将内存同时绑定到两种不相关的类型。这被称为 **类型双关（Type Punning）**，而 Swift 不喜欢双关。:]

相反，可以使用 `withMemoryRebound(to:capacity:)` 等方法临时重新绑定内存。

此外，从平凡类型（如 `Int`）重新绑定到非平凡类型（如类）是非法的。不要这样做。


#### 不要越界……哎呀！

``` swift
// Rule #3... wait
do {
  print("3. Don't walk off the end... whoops!")
  
  let count = 3
  let stride = MemoryLayout<Int16>.stride
  let alignment = MemoryLayout<Int16>.alignment
  let byteCount =  count * stride
  
  let pointer = UnsafeMutableRawPointer.allocate(
    byteCount: byteCount,
    alignment: alignment)
  let bufferPointer = UnsafeRawBufferPointer(start: pointer, count: byteCount + 1) 
  // OMG +1????
  
  for byte in bufferPointer {
    print(byte) // pawing through memory like an animal
  }
}

```

在编写不安全代码时，**越界错误**（off-by-one errors）的问题会更加严重。务必小心，仔细检查并测试你的代码！


### 不安全的 Swift 示例 1：压缩  
是时候运用你所学到的知识来封装一个 C API 了。Cocoa 包含一个实现了常见数据压缩算法的 C 模块。这些算法包括：

- **LZ4**：适用于速度至关重要的情况。
- **LZ4A**：适用于需要最高压缩比且不关心速度的情况。
- **ZLIB**：在空间和速度之间取得平衡。
- **LZFSE**：新的开源算法，在空间和速度之间取得了更好的平衡。

现在，打开初始项目中的 **Compression** Playground。

首先，你将使用 `Data` 定义一个纯 Swift API，将 Playground 的内容替换为以下代码：

``` swift
import Foundation
import Compression

enum CompressionAlgorithm {
  case lz4   // speed is critical
  case lz4a  // space is critical
  case zlib  // reasonable speed and space
  case lzfse // better speed and space
}

enum CompressionOperation {
  case compression, decompression
}

/// return compressed or uncompressed data depending on the operation
func perform(
  _ operation: CompressionOperation,
  on input: Data,
  using algorithm: CompressionAlgorithm,
  workingBufferSize: Int = 2000) 
    -> Data?  {
  return nil
}

```

执行压缩和解压缩的函数是 `perform`，目前它被存根化（stubbed out）并返回 `nil`。稍后你将为其添加一些不安全的代码。

接下来，将以下代码添加到 Playground 的末尾：

``` swift
/// Compressed keeps the compressed data and the algorithm
/// together as one unit, so you never forget how the data was
/// compressed.
struct Compressed {
  let data: Data
  let algorithm: CompressionAlgorithm
  
  init(data: Data, algorithm: CompressionAlgorithm) {
    self.data = data
    self.algorithm = algorithm
  }
  
  /// Compresses the input with the specified algorithm. Returns nil if it fails.
  static func compress(
    input: Data,with algorithm: CompressionAlgorithm) 
      -> Compressed? {
    guard let data = perform(.compression, on: input, using: algorithm) else {
      return nil
    }
    return Compressed(data: data, algorithm: algorithm)
  }
  
  /// Uncompressed data. Returns nil if the data cannot be decompressed.
 func decompressed() -> Data? {
    return perform(.decompression, on: data, using: algorithm)
  }
}

```

`Compressed` 结构体存储了压缩后的数据以及用于创建它的算法。这使得在决定使用哪种解压缩算法时，代码更不容易出错。

接下来，将以下代码添加到 Playground 的末尾：

``` swift
/// For discoverability, adds a compressed method to Data
extension Data {
  /// Returns compressed data or nil if compression fails.
  func compressed(with algorithm: CompressionAlgorithm) -> Compressed? {
    return Compressed.compress(input: self, with: algorithm)
  }
}

// Example usage:

let input = Data(Array(repeating: UInt8(123), count: 10000))

let compressed = input.compressed(with: .lzfse)
compressed?.data.count // in most cases much less than original input count

let restoredInput = compressed?.decompressed()
input == restoredInput // true

```

主要的入口点是 `Data` 类型的扩展。你添加了一个名为 `compressed(with:)` 的方法，它返回一个可选的 `Compressed` 结构体。该方法简单地调用了 `Compressed` 上的静态方法 `compress(input:with:)`。

最后有一个示例，但目前它还不能正常工作。是时候修复它了！

滚动到你输入的第一个代码块，并开始实现 `perform(_:on:using:workingBufferSize:)`，在 `return nil` 之前插入以下代码：

``` swift
// set the algorithm
let streamAlgorithm: compression_algorithm
switch algorithm {
case .lz4:   streamAlgorithm = COMPRESSION_LZ4
case .lz4a:  streamAlgorithm = COMPRESSION_LZMA
case .zlib:  streamAlgorithm = COMPRESSION_ZLIB
case .lzfse: streamAlgorithm = COMPRESSION_LZFSE
}
  
// set the stream operation and flags
let streamOperation: compression_stream_operation
let flags: Int32
switch operation {
case .compression:
  streamOperation = COMPRESSION_STREAM_ENCODE
  flags = Int32(COMPRESSION_STREAM_FINALIZE.rawValue)
case .decompression:
  streamOperation = COMPRESSION_STREAM_DECODE
  flags = 0
}

```

这将你的 Swift 类型转换为压缩算法所需的 C 类型。

接下来，将 `return nil` 替换为：

``` swift
// 1: create a stream
var streamPointer = UnsafeMutablePointer<compression_stream>.allocate(capacity: 1)
defer {
  streamPointer.deallocate()
}

// 2: initialize the stream
var stream = streamPointer.pointee
var status = compression_stream_init(&stream, streamOperation, streamAlgorithm)
guard status != COMPRESSION_STATUS_ERROR else {
  return nil
}
defer {
  compression_stream_destroy(&stream)
}

// 3: set up a destination buffer
let dstSize = workingBufferSize
let dstPointer = UnsafeMutablePointer<UInt8>.allocate(capacity: dstSize)
defer {
  dstPointer.deallocate()
}

return nil // To be continued

```

以下是正在发生的事情：

编译器在这里做了一些特殊的事情：它使用了 `in-out` 的 `&` 标记，将你的 `compression_stream` 转换为一个 `UnsafeMutablePointer<compression_stream>` 类型。或者，你也可以直接传递 `streamPointer`，这样就不需要这种特殊的转换了。

分配一个 `compression_stream` 并使用 `defer` 块安排其释放。
然后，通过 `pointee` 属性获取流，并将其传递给 `compression_stream_init` 函数。

编译器在这里做了一些特殊的事情：它使用了 `in-out` 的 `&` 标记，将你的 `compression_stream` 转换为一个 `UnsafeMutablePointer<compression_stream>` 类型。或者，你也可以直接传递 `streamPointer`，这样就不需要这种特殊的转换了。

最后，创建一个目标缓冲区作为你的工作缓冲区。
接下来，通过将最终的 `return nil` 替换为：

``` swift
// process the input
return input.withUnsafeBytes { srcRawBufferPointer in
  // 1
  var output = Data()
  
  // 2
  let srcBufferPointer = srcRawBufferPointer.bindMemory(to: UInt8.self)
  guard let srcPointer = srcBufferPointer.baseAddress else {
    return nil
  }
  stream.src_ptr = srcPointer
  stream.src_size = input.count
  stream.dst_ptr = dstPointer
  stream.dst_size = dstSize
  
  // 3
  while status == COMPRESSION_STATUS_OK {
    // process the stream
    status = compression_stream_process(&stream, flags)
    
    // collect bytes from the stream and reset
    switch status {
      
    case COMPRESSION_STATUS_OK:
      // 4
      output.append(dstPointer, count: dstSize)
      stream.dst_ptr = dstPointer
      stream.dst_size = dstSize
      
    case COMPRESSION_STATUS_ERROR:
      return nil
      
    case COMPRESSION_STATUS_END:
      // 5
      output.append(dstPointer, count: stream.dst_ptr - dstPointer)
      
    default:
      fatalError()
    }
  }
  return output
}

```

这是真正执行工作的地方。以下是它的具体操作：

- 创建一个 `Data` 对象，用于存放输出内容——这可能是压缩后的数据，也可能是解压缩后的数据，具体取决于当前执行的操作。
- 使用你分配的指针及其大小设置源缓冲区和目标缓冲区。
- 在这里，只要 `compression_stream_process` 返回 `COMPRESSION_STATUS_OK`，就会持续调用它。
- 然后，将目标缓冲区的内容复制到输出中，最终从这个函数返回。
- 当最后一个数据包到达时，它会被标记为 `COMPRESSION_STATUS_END`，此时你可能只需要复制目标缓冲区的一部分内容。
- 在这个例子中，你可以看到一个包含 10,000 个元素的数组被压缩到了 153 字节。效果还不错。

### Unsafe Swift 示例 2：随机数生成器

随机数对于许多应用来说非常重要，从游戏到机器学习都有广泛用途。

macOS 提供了 `arc4random`，它可以生成密码学安全的随机数。不幸的是，这个函数在 Linux 上不可用。此外，`arc4random` 只能提供 `UInt32` 类型的随机数。然而，`/dev/urandom` 提供了一个无限的、高质量的随机数来源。

在本节中，你将利用新学到的知识来读取这个文件，并生成类型安全的随机数。

![](/assets/images/20250222UnsafeSwift/hexdump.webp)

首先，创建一个新的 Playground，命名为 RandomNumbers，或者打开项目中的初始 Playground。

确保这次选择的是 macOS 平台。

准备就绪后，将默认内容替换为：

``` swift
import Foundation

enum RandomSource {
  static let file = fopen("/dev/urandom", "r")!
  static let queue = DispatchQueue(label: "random")
  
  static func get(count: Int) -> [Int8] {
    let capacity = count + 1 // fgets adds null termination
    var data = UnsafeMutablePointer<Int8>.allocate(capacity: capacity)
    defer {
      data.deallocate()
    }
    queue.sync {
      fgets(data, Int32(capacity), file)
    }
    return Array(UnsafeMutableBufferPointer(start: data, count: count))
  }
}

```

你将文件变量声明为 `static`，这样系统中就只会存在一个实例。你将依赖系统在进程退出时关闭它。

由于多个线程可能需要随机数，你需要通过一个串行的 GCD 队列来保护对它的访问。

`get` 函数是实际执行工作的地方。

首先，创建一个未分配的存储空间，其大小比你需要的多一个，因为 `fgets` 总是以 `\0`（空字符）结尾。

接下来，在 GCD 队列中操作，从文件中获取数据。

最后，通过将数据包装在 `UnsafeMutableBufferPointer` 中（它可以作为一个序列），将其复制到标准数组中。

到目前为止，这只能安全地为你提供一个 `Int8` 类型的数组。现在，你将对其进行扩展。

在你的 Playground 的末尾添加以下内容：

``` swift
extension BinaryInteger {
  static var randomized: Self {
    let numbers = RandomSource.get(count: MemoryLayout<Self>.size)
    return numbers.withUnsafeBufferPointer { bufferPointer in
      return bufferPointer.baseAddress!.withMemoryRebound(
        to: Self.self,
        capacity: 1) {
        return $0.pointee
      }
    }
  }
}

Int8.randomized
UInt8.randomized
Int16.randomized
UInt16.randomized
Int16.randomized
UInt32.randomized
Int64.randomized
UInt64.randomized

```

这为 `BinaryInteger` 协议的所有子类型添加了一个静态的 `randomized` 属性。关于这方面的更多内容，可以查看我们关于协议导向编程的教程。

首先，你获取随机数。然后，使用返回的数组的字节，将 `Int8` 值重新绑定为请求的类型，并返回一个副本。

至此，一切都完成了！你现在以一种安全的方式生成随机数，而这一切的背后正是利用了 Swift 的不安全特性。

### 下一步要做这么？

恭喜你完成了本教程！你可以通过本教程顶部或底部的“[下载材料](https://github.com/sunyazhou13/Using-Pointers-and-Interacting-With-C)”链接下载完整的项目文件。

如果你想进一步了解 Swift 的不安全特性，还有很多额外的资源可以探索：

- **[Swift Evolution 0107: UnsafeRawPointer API](https://github.com/apple/swift-evolution/blob/master/proposals/0107-unsaferawpointer.md)**  
  这篇文章详细介绍了 Swift 的内存模型，帮助你更好地理解 API 文档。

- **[Swift Evolution 0138: UnsafeRawBufferPointer API](https://github.com/apple/swift-evolution/blob/master/proposals/0138-unsaferawbufferpointer.md)**  
  这篇文章深入探讨了如何处理未类型化的内存，并提供了从中受益的开源项目的链接。

- **[导入的 C 和 Objective-C API](https://developer.apple.com/documentation/swift/imported_c_and_objective-c_apis)**  
  这部分内容可以帮助你了解 Swift 是如何与 C 语言交互的。

希望你喜欢这个教程！如果你有任何问题或想要分享的经验，请随时在论坛中讨论！

# 总结

以上是去年欠下的技术债.今天要还上,这里介绍的额unsafe swift中操作内存的方函数方法 值得大家深入学习,虽然翻译的过于机器化,等抽空我重新整理一下.

[原文链接Unsafe Swift: Using Pointers and Interacting With C](https://www.kodeco.com/7181017-)

