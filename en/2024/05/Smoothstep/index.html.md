---
layout: post
title: The Smoothstep Function
date: 2024-05-15 01:42 +0000
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This article is highly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. Reposts and sharing are welcome within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# How do you keep a value inside a range?

## In everyday development we often need to clamp values, like this:

``` c
float a = 某个输入值
float maxValue = 1;
//check  0 < a < the limit, assuming maxValue = 1

if (a <= 0) {
	a = 0;
} else if (a >= maxValue) {
	a = maxValue	
}

return a;

```

This is the kind of code I wrote when I was first learning C.

## Years later, this is how I write it

``` c
//Include the standard library header; the import statement is omitted here...

float a = 某个输入值
float maxValue = 1;
//Elegance never goes out of style
float a = min(max(0, a), maxValue); // 0 <= a <= 1
return a;
```

One line, and it reads much better — the value is clamped between min and max.

I once asked all the senior engineers at my previous company:

**Is there a function that combines min + max to clamp a value within a certain range?**

Most of them didn't know.

## smoothstep() — the Hermite smooth interpolation function

Years later, though, I discovered my version wasn't the last word either. The standard library is full of functions you only find once you go looking.

While reading `Metal by Tutorials`, a fragment shader snippet caught my eye.

``` txt
“smoothstep

smoothstep(edge0, edge1, x) returns a smooth Hermite interpolation between 0 and 1.


Note: edge1 must be greater than edge0, and x should be edge0 <= x <= edge1.”

摘录来自
Metal by Tutorials
此材料可能受版权保护。
```

Here's the fragment shader code:

``` c
float color = smoothstep(0, params.width, in.position.x);
return float4(color, color, color, 1);

```

So the function I'd been using all these years actually has a name: `smoothstep`.

# Summary

The natural next step: wrap `smoothstep()` in a global inline helper.

``` c
inline xx_smoothstep(T minEdge, T maxEdge, value) {
	return smoothstep(minEdge, maxEdge, value); 
}

```

That handles every range-clamping case in real-world code. It turns out what I'd been chasing all these years wasn't fancier techniques — it was simply knowing the right tool exists.
