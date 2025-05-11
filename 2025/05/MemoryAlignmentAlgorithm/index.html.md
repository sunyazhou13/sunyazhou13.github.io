---
layout: post
title: GPU内存对齐算法
date: 2025-05-11 07:30 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C]
typora-root-url: ..
---


![](/assets/images/20240727Magnificationgesture/SwiftUI.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

## 背景介绍

在学习《Metal》 GPU着色器编程中 有一章讲解GPU资源堆(Resource Heap)的参数缓冲(Arguements Buffer)中需要从CPU送资源到GPU时遇到一段代码计算资源的内存占用的算法,很有意思,在此记录下来.

``` swift
let sizeAndAligns = descriptors.map { descriptor in
    Renderer.device.heapTextureSizeAndAlign(descriptor: descriptor)
}
heapDescriptor.size = sizeAndAligns.reduce(0) { total, sizeAndAlign in
    let size = sizeAndAlign.size
    let align = sizeAndAlign.align
    return total + size - (size & (align - 1)) + align   //这行代码
}
if heapDescriptor.size == 0 {
    return nil
}
```

文档是这样说明的

> You calculate the size of the heap using size and correct alignment within the heap.
As long as align is a power of two, (size & (align - 1)) will give you the
remainder when size is divided by alignment. For example, if you have a size of 129
bytes, and you want to align it to memory blocks of 128 bytes, this is the result of
size - (size & (align - 1)) + align:

``` sh
129 - (129 & (128 - 1)) + 128 = 256
```

表达式` 129 & (128 - 1) `本质上是一种高效的取模（求余）操作，但仅当除数是 2 的幂次方时成立。以下是详细解释:

#### 1. 数学原理 

当 align 是 2 的幂次方（如 128 = 2⁷），align - 1 的二进制形式是全 1（例如 127 的二进制是 01111111）。
按位与（&）操作会将 size 的高位清零，仅保留低 log₂(align) 位的值，即 size % align 的余数。

示例计算
对于 size = 129，align = 128：

``` math
\begin{align*}
\text{余数} &= 129 \ \% \ 128 \\
&= 129 \ \& \ (128 - 1) \\
&= 129 \ \& \ 127 \\
&= \text{二进制} \ 10000001 \ \& \ 01111111 \\
&= 00000001 \quad (\text{即十进制 1})
\end{align*}
```

#### 2. 与传统模运算的对比


| 方法 | 运算表达式 | 结果 |	适用条件
| ------| ------ | ------ | ------ | 
| 按位与法 | `size & (align - 1)`	 |  1	 | `align`必须是 2 的幂次方 |
| 传统取模法	 | `size % align` |  1 |  任意正整数 |

优势

* 性能高效：位运算（&）的硬件执行速度通常比模运算（%）快一个数量级。
* 代码简洁：适用于需要频繁计算对齐的场景（如 GPU 内存管理）。

#### 3. 实际应用场景

在 Metal 中管理堆内存（`MTLHeap`）时，常用此方法计算对齐后的内存大小。例如：

``` swift
func alignedSize(size: Int, align: Int) -> Int {
    assert(align.isPowerOfTwo, "Alignment must be a power of two")
    let remainder = size & (align - 1)
    return remainder == 0 ? size : (size - remainder + align)
}

// 示例：将 129 字节对齐到 128 字节
let aligned = alignedSize(size: 129, align: 128) // 结果为 256
```

#### 4.非 2 的幂次方如何处理？

若`align`不是 2 的幂次方（如`align = 100`），必须使用传统模运算：

``` swift
func alignedSizeGeneric(size: Int, align: Int) -> Int {
    let remainder = size % align
    return remainder == 0 ? size : (size - remainder + align)
}

// 示例：将 250 对齐到 100
let aligned = alignedSizeGeneric(size: 250, align: 100) // 结果为 300
```

是的，表达式 `129 & (128 - 1)` 本质上是一种高效的取模（求余）操作，但**仅当除数是 2 的幂次方时成立**。

### **总结**
- `129 & (128 - 1)` **是取模操作**，但仅当 `align` 为 2 的幂次方时成立。
- **适用场景**：GPU 内存对齐、高性能计算中优化取模操作。
- **核心公式**：  
	
``` math
  \[
\text{AlignedSize} = \text{size} - (\text{size} \ \% \ \text{align}) + \text{align}
\]  
```

![](/assets/images/20250511MemoryAlignmentAlgorithm/AlignedSize.webp)

其中 `%` 可通过 `& (align - 1)` 优化（当 `align` 是 2 的幂时）。