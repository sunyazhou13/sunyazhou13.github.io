---
layout: post
title: What Registers Are in the ARM Thread State of an iOS dSYM?
date: 2024-11-04 02:31 +0000
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

![Swift UI](/assets/images/20240727Magnificationgesture/SwiftUI.avif)

# Preface

This post carries strong personal opinions; if reading it makes you uncomfortable, please close it right away. This article is only for my personal study notes. You're welcome to repost or share it within the scope of the license — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# Background

A long time ago, I remember many interviewers liked to ask: what registers are in the ARM Thread State of an iOS dSYM, and what do they each mean?

Based on a piece of data, let's briefly record the answer to this question.

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

This is the thread state of the main-thread crash after a thread crashed.

## Meanings of the ARM Thread State Registers

In an iOS dSYM, the ARM Thread State registers provide the context of the program at the time of the crash. Here are the meanings of the main registers:

- **x0-x30**: These are general-purpose registers, used to store temporary data. In function calls, x0-x7 are usually used to pass arguments, while x19-x28 are used to hold local variables and function return addresses.
- **fp (Frame Pointer)**: The frame pointer register, typically pointing to the current function's stack frame, for managing the stack during function calls and returns and for accessing local variables.
- **lr (Link Register)**: The link register, storing the address to return to after a function call — i.e., the address of the next instruction to execute.
- **sp (Stack Pointer)**: The stack pointer register, pointing to the top of the current thread's stack.
- **pc (Program Counter)**: The program counter, pointing to the address of the next instruction to execute.
- **cpsr (Current Program Status Register)**: The current program status register, containing the processor's status and control bits, such as condition flags and interrupt enable bits.

In the crash log shown above, the pc register's value is `0x00000001d8922e44`, which usually points to the instruction address that caused the crash. You can use the `atos` command together with the dSYM file to resolve this address to a code location, for example:

``` bash
atos -arch arm64 -o YourApp.app.dSYM/Contents/Resources/DWARF/YourApp -l 0xXXXXXXXX 0xXXXXXXXX
```

Here, -arch arm64 specifies the architecture, -o is followed by the path to the dSYM file, and -l is followed by the load address and the pc register's value. This helps you find the line of code executing at the time of the crash.

## How to Resolve the `pc` Value in the ARM Thread State Registers?

Resolving the `pc` (Program Counter) value in the ARM Thread State registers usually involves the following steps:

1.**Get the `pc` value at crash time**:

 This is the memory address of the instruction that caused the program to crash. In your crash log, the value of `pc` is `0x00000001d8922e44`.

2.**Get the application's dSYM file**:

 The dSYM file contains the application's debug information, including the symbol tables that map memory addresses to functions and line numbers in the source code. Make sure you have the dSYM file matching the application version at the time of the crash.

3.**Use debugging tools to resolve the address**:

 You can use Xcode's debugging tools, or command-line tools such as `atos` (Address to Symbol), to convert the `pc` value into the function name and line number in the source code.

Here's a command-line example using `atos`:

``` bash
atos -arch arm64 -o YourApp.app.dSYM/Contents/Resources/DWARF/YourApp -l 0xXXXXXXXXXXXXXXXX 0xXXXXXXXXXXXXXXXX   
```

Where:

* `-arch arm64` specifies the architecture type.
* `-o` is followed by the path to your application's dSYM file.
* ` -l` is followed by the load address and the pc register's value.

Please replace YourApp.app.dSYM/Contents/Resources/DWARF/YourApp with your actual dSYM file path, and replace 0xXXXXXXXXXXXXXXXX and 0xXXXXXXXXXXXXXXXX with your actual load address and pc value.

4. Analyze the result:
The atos command outputs the function name and line number where the crash occurred. For example:

``` bash
0x00000001d8922e44: -[YourViewController yourMethod] (YourViewController.m:123)
```   

This indicates the crash happened in the yourMethod method of the YourViewController class, at line 123 of YourViewController.m.

5. Debug and fix:
Based on the resolved function name and line number, you can locate the exact position in the source code, and further analyze and fix the problem that caused the crash.

# Summary

Recording something easily forgotten — it helps with fixing crashes in projects.
