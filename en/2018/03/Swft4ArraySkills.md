---
layout: post
title: "Array Techniques in Swift 4"
date: 2018-03-14 10:17:56
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

Before the new year I bought [Advanced Swift](https://objccn.io/products/advanced-swift/) (Swift 4.0), and I've been gradually learning it since coming back. I have to say, what 喵神 writes is quite good. ¥69 is nothing for most programmers. If you're interested, buy a copy — it's genuinely good.

When I started learning arrays from scratch, I found many functions really useful.

## Mutable Array Techniques in Swift 4.0

We can use Xcode to create a playground for practice.

__First, create an array__

``` swift
let array = NSMutableArray(array: [1, 2, 3, 4 , 5, 6])

```

__for-in loop iteration__

``` swift
for x in array {
    print(x)
}
```

Output

``` sh
1 2 3 4 5 6
```

__Want to iterate over all elements except the first one?__

``` swift 
for x in array.dropFirst(){
    print(x)
}
```

Output

``` sh
2 3 4 5 6
```

> The dropFirst() function accepts a numeric parameter. For `for x in array.dropFirst(3)`, the output is: 4 5 6.


Where there's `first`, there's usually `last`

__Want to iterate over all elements except the last 3?__

``` swift
for x in array.dropLast(3){
    print(x)
}
```

Output

``` sh
1 2 3
```

__Iterate with index and element__

``` swift
for (num, element) in array.enumerated() {
    print(num, element)
}
```

Output: index on the left, element on the right

``` sh
0 1
1 2
2 3
3 4
4 5
5 6

```

> Index on the left, element on the right


End of article


