---
layout: post
title: iOS的dSYM中ARM Thread State寄存器有哪些？
date: 2024-11-04 02:31 +0000
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---

![](/assets/images/20240727Magnificationgesture/SwiftUI.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 背景

很久以前记得很多人经常面试喜欢问 iOS的dSYM中ARM Thread State的寄存器有哪些,分别代表什么意思?

基于一段数据 我们简单记录一下这个问题

``` sh
Thread 0 crashed with ARM Thread State (64-bit):
x0:000000000000000000
x1:000000000000000000
x2:0x000000016bd31ce0
x3:0x000000016bd31d20
x4:0x0000000000000010
x5:0x00000000000022e0
x6:0x00000002817762e0
x7:0x00000000000000f0
x8:0x0000000281f7b930
x9:0x00000000000006bb
x10:0x000000018aa49cf8
x11:0x00ff0001238cf400
x12:0x00000000000000b5
x13:0x00000001238cff40
x14:0x02000001e0ad6c89
x15:0x00000001e0ad6c88
x16:0x00000001d8922e40
x17:0x00000001122301e8
x18:000000000000000000
x19:0x000000016bd31cc0
x20:000000000000000000
x21:000000000000000000
x22:0x000000011222c21a
x23:0x000000018652ddb0
x24:000000000000000000
x25:0x000000028115e880
x26:0x000000010d8ca6ed
x27:0x0000000281328930
x28:0x0000000000000001
fp:0x000000016bd31c60
lr:0x0000000112216898
sp:0x000000016bd31c30
pc:0x00000001d8922e44
cpsr:0x0000000060001000
```

这是一段线程崩溃后的的 主线程crash 的线程状态

## ARM Thread State寄存器含义

在iOS的dSYM中，ARM Thread State寄存器提供了程序崩溃时的上下文信息，以下是一些主要寄存器的含义：

- **x0-x30**：这些是通用寄存器，用于存储临时数据。在函数调用中，x0-x7通常用于传递参数，而x19-x28则用于保存局部变量和函数的返回地址。
- **fp (Frame Pointer)**：帧指针寄存器，通常用于指向当前函数的栈帧，以便于函数调用和返回时栈的管理和访问局部变量。
- **lr (Link Register)**：链接寄存器，存储着函数调用返回后的地址，即下一个要执行的指令地址。
- **sp (Stack Pointer)**：栈指针寄存器，指向当前线程的栈顶。
- **pc (Program Counter)**：程序计数器，指向下一条要执行的指令地址。
- **cpsr (Current Program Status Register)**：当前程序状态寄存器，包含处理器的状态和控制位，如条件标志位、中断使能位等。

在您提供的崩溃日志中，pc寄存器的值为`0x00000001d8922e44`，这通常指向导致崩溃的指令地址。您可以使用`atos`命令结合dSYM文件来解析这个地址对应的代码位置，例如：

``` bash
atos -arch arm64 -o YourApp.app.dSYM/Contents/Resources/DWARF/YourApp -l 0xXXXXXXXX 0xXXXXXXXX
```

其中-arch arm64指定了架构，-o后面跟着的是dSYM文件的路径，-l后面跟着的是线程号和pc寄存器的值。这样可以帮助你找到崩溃发生时正在执行的代码行。

## 如何解析ARM Thread State寄存器中的`pc`值？

解析ARM Thread State寄存器中的`pc`（Program Counter）值通常涉及到以下几个步骤：

1.**获取崩溃时的`pc`值**：
 
 这是导致程序崩溃的指令的内存地址。在你的崩溃日志中，`pc`的值是`0x00000001d8922e44`。

2.**获取应用程序的dSYM文件**：
   
 dSYM文件包含了应用程序的调试信息，包括符号表，这些符号表将内存地址映射到源代码中的函数和行号。确保你有对应崩溃时应用程序版本的dSYM文件。

3.**使用调试工具解析地址**：
 
 你可以使用Xcode的调试工具，或者命令行工具如`atos`（Address to Symbol）来将`pc`值转换为源代码中的函数名和行号。

使用`atos`的命令行示例如下：

``` bash
atos -arch arm64 -o YourApp.app.dSYM/Contents/Resources/DWARF/YourApp -l 0xXXXXXXXXXXXXXXXX 0xXXXXXXXXXXXXXXXX   
```

其中：

* `-arch arm64` 指定了架构类型。
* `-o` 后面跟着的是你的应用程序的dSYM文件路径。
* ` -l` 后面跟着的是线程号和pc寄存器的值。

请将YourApp.app.dSYM/Contents/Resources/DWARF/YourApp替换为你的实际dSYM文件路径，将0xXXXXXXXXXXXXXXXX和0xXXXXXXXXXXXXXXXX替换为你的实际线程号和pc值。

4.分析结果：
atos命令会输出导致崩溃的函数名和行号。例如：

``` bash
0x00000001d8922e44: -[YourViewController yourMethod] (YourViewController.m:123)
```   

这表明崩溃发生在YourViewController类的yourMethod方法中，位于YourViewController.m文件的第123行。

5.调试和修复：
根据解析出的函数名和行号，你可以在源代码中定位到具体的代码位置，进一步分析和修复导致崩溃的问题。

# 总结

记录一下容易被遗忘的内容, 帮助修复工程中crash的问题