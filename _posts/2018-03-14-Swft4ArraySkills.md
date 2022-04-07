---
title: Swift 4 中的数组技巧
categories: [ios开发]
tags: [ios, macos]
date: 2018-03-14 10:17:56
---


# 前言

年前买了本[Swift 进阶](https://objccn.io/products/advanced-swift/)(swift4.0),过完年回来正在一点点学习,不得不说喵神写的东西还是不错的,￥69元对广大程序员来说已经不算啥了.如果感兴趣可以买一本,真心不错

当我从头来学习数组的时候发现好多函数真的太有用了

## Swift 4.0 中的可变数组技巧

我们可用 Xcode 创建playground 来进行练习

__首先创建个数组__

``` swift
let array = NSMutableArray(array: [1, 2, 3, 4 , 5, 6])

```

__for in 循环遍历__

``` swift
for x in array {
    print(x)
}
```

打印

``` sh
1 2 3 4 5 6
```

__想要扣除第一个元素剩余的元素进行迭代遍历呢？__

``` swift 
for x in array.dropFirst(){
    print(x)
}
```

打印

``` sh
2 3 4 5 6
```

> dropFirst() 函数参数是可以添加数值的  for x in array.dropFirst(3) 打印:4 5 6.


有 `first` 的地方基本就有`last`

__想要扣除最后 3 个元素以外的元素进行遍历？__

``` swift
for x in array.dropLast(3){
    print(x)
}
```

打印

``` sh
1 2 3
```

__带下标和数组元素遍历__

``` swift
for (num, element) in array.enumerated() {
    print(num, element)
}
```

打印 左边下标 右边元素

``` sh
0 1
1 2
2 3
3 4
4 5
5 6

```

> 左边下标 右边元素


全文完


