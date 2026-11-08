---
layout: post
title: GPU Memory Alignment Algorithm
date: 2025-05-11 07:30 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C]
typora-root-url: ..
math: true
mermaid: false
---


![Swift UI](/assets/images/20240727Magnificationgesture/SwiftUI.avif)

# Introduction

This article carries strong personal sentiment. If you feel uncomfortable reading it, please close it as soon as possible. This article is only used as a personal learning record, and you are also welcome to reprint or share it within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you think this site is helpful to you, you can subscribe to it via RSS. Thanks for your support!

## Background

While studying the GPU shader programming chapter of "Metal", I came across a section about the argument buffer of the GPU resource heap, which needs to send resources from the CPU to the GPU. There I encountered a piece of code that calculates the memory footprint of a resource. It's quite interesting, so I'm writing it down here.

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

The documentation explains it like this

> You calculate the size of the heap using size and correct alignment within the heap.
As long as align is a power of two, (size & (align - 1)) will give you the
remainder when size is divided by alignment. For example, if you have a size of 129
bytes, and you want to align it to memory blocks of 128 bytes, this is the result of
size - (size & (align - 1)) + align:

``` sh
129 - (129 & (128 - 1)) + 128 = 256
```

The expression `129 & (128 - 1)` is essentially an efficient modulo (remainder) operation, but it only holds when the divisor is a power of two. Here is a detailed explanation:

#### 1. Mathematical Principle

When align is a power of two (e.g., 128 = 2⁷), the binary form of align - 1 is all 1s (for example, the binary of 127 is 01111111).
The bitwise AND (&) operation clears the high bits of size, keeping only the value of the low log₂(align) bits, which is the remainder of size % align.

Example calculation
For size = 129, align = 128:

$$
\begin{align*}
\text{余数} &= 129 \ \% \ 128 \\
&= 129 \ \& \ (128 - 1) \\
&= 129 \ \& \ 127 \\
&= \text{二进制} \ 10000001 \ \& \ 01111111 \\
&= 00000001 \quad (\text{即十进制 1})
\end{align*}
$$

#### 2. Comparison with Traditional Modulo Operation


| Method | Expression | Result |	Applicable Condition
| ------| ------ | ------ | ------ | 
| Bitwise AND method | `size & (align - 1)`	 |  1	 | `align` must be a power of two |
| Traditional modulo method	 | `size % align` |  1 |  Any positive integer |

Advantages

* High performance: The hardware execution speed of bitwise operations (&) is usually an order of magnitude faster than modulo operations (%).
* Concise code: Suitable for scenarios that require frequent alignment calculations (such as GPU memory management).

#### 3. Practical Use Cases

When managing heap memory (`MTLHeap`) in Metal, this method is commonly used to calculate the aligned memory size. For example:

``` swift
func alignedSize(size: Int, align: Int) -> Int {
    assert(align.isPowerOfTwo, "Alignment must be a power of two")
    let remainder = size & (align - 1)
    return remainder == 0 ? size : (size - remainder + align)
}

// Example: align 129 bytes to 128 bytes
let aligned = alignedSize(size: 129, align: 128) // 结果为 256
```

#### 4. What If align Is Not a Power of Two?

If `align` is not a power of two (e.g., `align = 100`), the traditional modulo operation must be used:

``` swift
func alignedSizeGeneric(size: Int, align: Int) -> Int {
    let remainder = size % align
    return remainder == 0 ? size : (size - remainder + align)
}

// Example: align 250 to 100
let aligned = alignedSizeGeneric(size: 250, align: 100) // 结果为 300
```

Yes, the expression `129 & (128 - 1)` is essentially an efficient modulo (remainder) operation, but it **only holds when the divisor is a power of two**.

### **Summary**
- `129 & (128 - 1)` **is a modulo operation**, but it only holds when `align` is a power of two.
- **Use cases**: GPU memory alignment, optimizing modulo operations in high-performance computing.
- **Core formula**:  
	
$$
\text{AlignedSize} = \text{size} - (\text{size} \ \% \ \text{align}) + \text{align}
$$

![Aligned Size](/assets/images/20250511MemoryAlignmentAlgorithm/AlignedSize.avif)

Where `%` can be optimized with `& (align - 1)` (when `align` is a power of two).
