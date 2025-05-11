---
layout: post
title: 平滑阶梯函数smoothstep
date: 2024-05-15 01:42 +0000
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如何控制一个值 在某个区间内,使其不超过最大区间极限和最小区间的极限？

## 在开发中我们经常计算一些区间值,:如下

``` c
float a = 某个输入值
float maxValue = 1;
//check  0 < a <极限值 假设maxValue   = 1

if (a <= 0) {
	a = 0;
} else if (a >= maxValue) {
	a = maxValue	
}

return a;

```

显然这是刚学C语言时候的我写出来的毫无技术含量的代码.

## 工作多年后的写法

``` c
//引入标准库头文件 这里省略导入头文件过程...

float a = 某个输入值
float maxValue = 1;
//优雅永不过时
float a = min(max(0, a), maxValue); // 0 <= a <= 1
return a;
```

这种写法虽然一行代码搞定,显得NB多了,控制了这个值的最小和最大区间不超过范围.

曾经还因为这个问题问过前公司的所有技术同学,我的提问如下 

**有没有一个函数能把min + max 合成一下 控制一个值在某个区间范围内.**

答复是很多人都不清楚.擦


## smoothste() 埃尔米特(Hermite)平滑插值函数

然而多年后 我发现自己并不优雅. 标准库中有很多函数需要自己提高认知才知道它是做什么的.

当我阅读到 `Metal by Tutorials`,这本书时有一段片元着色器的代码引起了我的注意.

``` txt
“smoothstep

smoothstep(edge0, edge1, x) returns a smooth Hermite interpolation between 0 and 1.


Note: edge1 must be greater than edge0, and x should be edge0 <= x <= edge1.”

摘录来自
Metal by Tutorials
此材料可能受版权保护。
```

以下是片元着色器的代码.

``` c
float color = smoothstep(0, params.width, in.position.x);
return float4(color, color, color, 1);

```

是的 这么多年我用的这个函数它其实叫做 `平滑阶梯函数`.

# 总结

显然 接下来的操作是: 定义一个全局内联函数 封装 smoothstep()

``` c
inline xx_smoothstep(T minEdge, T maxEdge, value) {
	return smoothstep(minEdge, maxEdge, value); 
}

```
这种思路解决工程中所以范围值问题.原来这么多年追求的技术源于认知的提升.



