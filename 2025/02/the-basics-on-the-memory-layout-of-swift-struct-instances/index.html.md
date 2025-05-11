---
layout: post
title: Swift结构体实例内存布局的基础知识
date: 2025-02-23 12:17 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C]
typora-root-url: ..
---

![](/assets/images/20240727Magnificationgesture/SwiftUI.webp)


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 背景介绍

![](/assets/images/20250223SwiftStructMemoryLayout/VerTexBufferLayout.webp)

2024年学习《Metal.by.Tutorials.4th.2023.12》中有提到swift中的结构体实例的内存布局,我把这些整理了一下.

## 大小、步长和对齐(Size, Stride, Alignment)


Swift 结构体实例内存布局的基础知识
> 2018 年 3 月 12 日 ∙ Swift 内部原理 ∙ 作者：Greg Heo

在内存中处理 Swift 类型时，需要考虑三个属性：大小（Size）、步长（Stride） 和 对齐（Alignment）。

## 大小(Size)

让我们以两个结构体的举例说明

``` swift
struct Year {
  let year: Int
}

struct YearWithMonth {
  let year: Int
  let month: Int
}
```

我的直觉告诉我，YearWithMonth 的实例比 Year 的实例更大——它在内存中占用了更多的空间。但我们是科学家；我们如何用确凿的数据来验证直觉呢？

## 内存布局(Memory Layout)

我们可以使用 `MemoryLayout` 类型来检查我们的类型在内存中的一些属性。

要查找结构体的大小，可以使用 size 属性并结合泛型参数：

``` swift
let size = MemoryLayout<Year>.size
```

如果你有一个类型的实例，可以使用 `size(ofValue:)` 静态函数：

``` swift
let instance = Year(year: 1984)
let size = MemoryLayout.size(ofValue: instance)
```

在这两种情况下，大小都被报告为 **8 字节**。

不出所料，我们的结构体 `YearWithMonth` 的大小是 **16 字节**。

## 回到大小  

结构体的大小似乎非常直观——计算每个属性大小的总和。对于这样的结构体：

``` swift
struct Puppy {
  let age: Int
  let isTrained: Bool
}
```

结构体的大小应该与其属性的大小相匹配：


``` swift
MemoryLayout<Int>.size + MemoryLayout<Bool>.size
// returns 9, from 8 + 1

MemoryLayout<Puppy>.size
// returns 9
```

看起来没问题！[旁白：真的没问题吗？😈]

## 步长（Stride）

当你在处理单个缓冲区（例如数组）中的多个实例时，类型的步长就变得非常重要。

如果我们有一个连续的小狗数组，每只小狗的大小为 9 字节，那么它在内存中会是什么样子呢？

![](/assets/images/20250223SwiftStructMemoryLayout/stride-nopadding.webp)

事实证明，并非如此。❌

`步长 Stride`决定了两个元素之间的距离，它通常大于或等于大小。

``` swift
MemoryLayout<Puppy>.size
// returns 9

MemoryLayout<Puppy>.stride
// returns 16
```

因此，实际的布局看起来是这样的：

![](/assets/images/20250223SwiftStructMemoryLayout/stride-padding.webp)

也就是说，如果你有一个指向第一个元素的字节指针，并希望移动到第二个元素，步长就是你需要将指针前进的字节距离。

为什么大小和步长会不同？这就引出了内存布局的最后一个神奇数字。


## 对齐（Alignment）  

想象一下，计算机一次获取 8 位（即 1 字节）的内存。无论是获取第 1 个字节还是第 7 个字节，所需的时间是相同的。

![](/assets/images/20250223SwiftStructMemoryLayout/alignment-byte8.webp)

然后你升级到了一台 16 位计算机，它以 16 位的字（word）为单位访问数据。你仍然有一些旧的软件希望以字节为单位访问数据，但想象一下这里可能发生的魔法：如果软件请求字节 0 和字节 1，计算机现在可以一次性访问字 0，然后将 16 位的结果拆分。

![](/assets/images/20250223SwiftStructMemoryLayout/alignment-byte16.webp)

在这种理想情况下，字节级的内存访问速度提高了一倍！🎉

现在假设一个不守规矩的程序像这样放入一个 16 位的值：

![](/assets/images/20250223SwiftStructMemoryLayout/alignment-misaligned16.webp)

然后你要求计算机从字节位置 3 读取 16 位的字（word）。问题在于，这个值是对齐不当的。为了读取它，计算机需要读取位置 1 的字，将其切半，再读取位置 2 的字，将其切半，然后将两半拼接在一起。这意味着访问一个 16 位的值需要两次独立的 16 位内存读取——比应有的速度慢了两倍！😭

在某些系统中，未对齐的访问不仅仅是慢的问题——它完全不被允许，并会导致程序崩溃。

## 简单的 Swift 类型  

在 Swift 中，简单类型（如 `Int` 和 `Double`）的对齐值与其大小相同。一个 32 位（4 字节）的整数大小为 4 字节，并且需要对齐到 4 字节。

``` swift
MemoryLayout<Int32>.size
// returns 4
MemoryLayout<Int32>.alignment
// returns 4
MemoryLayout<Int32>.stride
// returns 4
```

步长也是 4，这意味着在连续缓冲区中，值之间相隔 4 字节。不需要填充。

## 复合类型 (Compound Types)

现在回到我们的 `Puppy` 结构体，它有一个 `Int` 和一个 `Bool` 属性。再次考虑值在缓冲区中紧挨在一起的情况：

![](/assets/images/20250223SwiftStructMemoryLayout/alignment-nopadding-bytes.webp)

`Bool` 值的位置没有问题，因为它们的对齐值为 1 (`alignment=1`)。但第二个整数是对齐不当的。它是一个 64 位（8 字节）的值，对齐值为 8(`alignment=8`)，而它的字节位置不是 8 的倍数。❌

记住，这种类型的步长是 16，这意味着缓冲区实际上看起来是这样的：

![](/assets/images/20250223SwiftStructMemoryLayout/alignment-padding-bytes.webp)

我们保留了结构体内所有值的对齐要求：第二个整数位于字节 16，这是 8 的倍数。

这就是为什么结构体的步长可以大于其大小：为了添加足够的填充以满足对齐要求。

## 计算对齐  

那么，在我们这段旅程的结尾，`Puppy` 结构体类型的对齐值是多少呢？

``` swift
MemoryLayout<Puppy>.alignment
// returns 8
```

结构体类型的对齐值是其所有属性中最大的对齐值。在 `Int` 和 `Bool` 之间，`Int` 的对齐值更大，为 8，因此结构体使用它。

然后，步长是大小向上取整到对齐值的下一个倍数。在我们的例子中：

- 大小是 9
- 9 不是 8 的倍数
- 9 之后的下一个 8 的倍数是 16
- 因此，步长是 16

## 最后一个复杂点  

考虑我们最初的 `Puppy`，并将其与 `AlternatePuppy` 进行对比：

``` swift
struct Puppy {
  let age: Int
  let isTrained: Bool
} // Int, Bool

struct AlternatePuppy { 
  let isTrained: Bool
  let age: Int
} // Bool, Int

```

`AlternatePuppy` 结构体的对齐值仍然是 8，步长仍然是 16，但：

``` swift
MemoryLayout<AlternatePuppy>.size
// returns 16
```

什么？！我们只是改变了属性的顺序。为什么现在大小不一样了？它应该仍然是9，不是吗？一个布尔值后面跟着一个整数，就像这样：

![](/assets/images/20250223SwiftStructMemoryLayout/alignment-internal-1.webp)

也许你看到了问题所在：8字节的整数不再对齐了！它在内存中实际看起来是这样的：

![](/assets/images/20250223SwiftStructMemoryLayout/alignment-internal-2.webp)

结构体本身必须对齐，结构体内部的属性也必须保持对齐。填充字节会插入到元素之间，整个结构体的大小也会随之扩展。

在这种情况下，步长（stride）仍然是16，因此从`Puppy`到`AlternatePuppy`的实际变化是填充字节的位置。那么这些结构体呢？

``` swift
struct CertifiedPuppy1 {
  let age: Int
  let isTrained: Bool
  let isCertified: Bool
} // Int, Bool, Bool

struct CertifiedPuppy2 {
  let isTrained: Bool
  let age: Int
  let isCertified: Bool
} // Bool, Int, Bool
```

这两个结构体的大小（size）、步长（stride）和对齐方式（alignment）分别是多少呢？🤔（提示）

## 关于闭合大括号

假设你有一个`UnsafeRawPointer`（在C语言中相当于`void *`）。你知道它指向的类型。那么，大小（size）、步长（stride）和对齐方式（alignment）在其中扮演什么角色呢？

- **大小（Size）**：是从指针读取以获取所有数据所需的字节数。
- **步长（Stride）**：是向前移动以到达缓冲区中下一个项目的字节数。
- **对齐方式（Alignment）**：是每个实例必须位于的“能被整除的”数字。如果你正在分配内存以复制数据，你需要指定正确的对齐方式（例如：`allocate(byteCount: 100, alignment: 4)`）。

![](/assets/images/20250223SwiftStructMemoryLayout/size-stride-alignment-summary.webp)


对于我们大多数人来说，大多数时候，我们处理的都是高级集合，比如数组和集合，不需要考虑底层的内存布局。

在其他情况下，你可能需要在平台上使用低级API，或者与C代码进行互操作。如果你有一个Swift结构体数组，并且需要让C代码读取它（或者反过来），那么你就需要担心分配具有正确对齐方式的缓冲区，确保结构体内部的填充字节对齐，以及确保你有正确的步长值，以便正确解释数据。

正如我们所见，即使是计算大小，也没有看起来那么简单——每个属性的大小和对齐方式之间存在相互作用，这决定了结构体的整体大小。因此，理解这三者意味着你正在成为内存管理的高手。

对深入了解感兴趣吗？

- [Wikipedia 上的 “Data structure alignment”](https://en.wikipedia.org/wiki/Data_structure_alignment)  
- [Swift 文档中的 “Type Layout” 文章](https://github.com/apple/swift/blob/master/docs/ABI/TypeLayout.rst)，解释了如何计算结构体的大小（size）、步长（stride）和对齐方式（alignment）。  
- [LLVM 中的 `getAlignOf` 源码](https://github.com/apple/swift-llvm/blob/stable/lib/IR/Constants.cpp#L1800-L1811)
- [Swift 的 `UnsafeMutableRawPointer.allocate(byteCount:alignment:)`，带有大小和对齐参数](https://developer.apple.com/documentation/swift/unsafemutablerawpointer/allocate(bytecount:alignment:))


# 总结

在学习Metal开始的时候要使用swift类型操作内存,对swift中的类型内存布局和对齐了解不是很清楚,整理了这篇文章 希望对你有所帮助

[原文地址The basics on the memory layout of Swift struct instances.
](https://swiftunboxed.com/internals/size-stride-alignment/)