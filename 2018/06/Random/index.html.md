---
layout: post
title: Swift中的随机数
date: 2018-06-01 17:30:56
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..
---


![](/assets/images/20180601Random/SwiftRandomNumbers.webp)

# 前言


今天儿童节,写一篇`随机数`技术文章纪念`留守儿童(资深)`的童年.



## swift中的随机数使用

在我们开发的过程中，经常用到求取一些随机数,今天列举几种写篇文章

## 整型随机数

首先是这个arc4random()

> `arc4random()`使用了`arc4`密码加密的`key` `stream`生成器，产生一个`[0, 2^32)`区间的随机数(注意是左闭右开区间)。这个函数的返回类型是`UInt32`

> 提示: _`[`和`]` 分别代表左右闭区间_,
> _`(`和`)`代表左右开区间_
> 也就是`中括号` -> 代表 闭区间, 闭区间代表包含.  
> 小括号 -> 代表开区间, 开区间代表不包含.  
> 所以以下看到

``` swift 
arc4random()   //"4058056034"
```

如果我们想生成一个**指定范围内**的整型随机数，则可以使用`arc4random()` `%` `upper_bound`的方式，其中`upper_bound`指定的是上边界，如下代码:

求一个10以内的随机数

``` swift 
arc4random() % 10  // 0~9 注意没有10哈
```

不过使用这种方法，在`upper_bound`不是`2`的幂次方时，会产生一个所谓`Modulo bias`(模偏差)的问题。

可以使用`arc4random_uniform()`，它接受一个`UInt32`类型的参数，**指定随机数区间的上边界**`upper_bound`，该函数生成的随机数范围是[0, upper_bound)，如下所示：

``` swift 
arc4random_uniform(10)		// 5
```

那问题来了？我想指定区间随机 比如: `[10, 200)`.

``` swift 
let maxNum: UInt32 = 200
let minNum: UInt32 = 10
arc4random_uniform(maxNum - minNum) + minNum   // 153
```

可以看到上述结果 是 `153`.

swift也可以用C函数中的随机 eg: random() 或者 rand(),但是这些有下面缺点:

* 这两个函数都需要初始种子，通常是以当前时间来确定,属于伪随机.
* 这两个函数的上限在`RAND_MAX=0X7fffffff`(2147483647)，是`arc4random`的一半.
* `rand()`函数以有规律的低位循环方式实现，更容易预测

``` c
srand(UInt32(time(nil)))  // 种子,random对应的是srandom
rand()				      // 1,314,695,483
rand() % 10	   			  // 8
```

## 64位整型随机数

我们发现这些函数主要都是针对`32`位整型数来操作的.如果需要生成一个`64`位的整型随机数呢?

可以使用如下代码:

``` swift 
func arc4random <T: ExpressibleByIntegerLiteral> (type: T.Type) -> T {
    var r: T = 0
    arc4random_buf(&r, MemoryLayout<T>.size)
    return r
}
```
可以像下面这样调用 

``` swift
arc4random(type: UInt64.self) //8021765689869396105
arc4random(type: UInt32.self) //1293034028
arc4random(type: UInt16.self) //29059
arc4random(type: UInt8.self)  //183

```
> swift 4 语法

这个函数中使用了`arc4random_buf()`来生成随机数。

这个函数使用ARC4加密的随机数来填充该函数第二个参数指定的长度的缓存区域。因此，如果我们传入的是sizeof(UInt64)，该函数便会生成一个随机数来填充8个字节的区域，并返回给r。那么64位的随机数生成方法便可以如下实现：

``` swift 
extension UInt64 {
    static func random(lower: UInt64 = min, upper: UInt64 = max) -> UInt64 {
        var m: UInt64
        let u = upper - lower
        var r = arc4random(type: UInt64.self)
        if u > UInt64(Int64.max) {
            m = 1 + ~u
        } else {
            m = ((max - (u * 2)) + 1) % u
        }
        while r < m {
            r = arc4random(type: UInt64.self)
        }
        return (r % u) + lower
    }
}
```

我们来试用一下：

``` swift
UInt64.random()      //9223372036854775807
```


## 浮点型随机数

如果需要一个浮点值的随机数，则可以使用drand48函数，这个函数产生一个[0.0, 1.0]区间中的浮点数。这个函数的返回值是Double类型。其使用如下所示：


``` swift
srand48(Int(time(nil)))
drand48()  //0.4643666202473504
```

> 注意:需要先调用srand48()生成种子

## 示例实践

如何生成一个0~9 这几个数组做个随机排序,实现类似银行类动态键盘的功能

``` swift
var arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
arr.sort { (s1, s2) -> Bool in
    arc4random() < arc4random()
}

print(arr)
```

在闭包中，随机生成两个数，比较它们之间的大小，来确定数组的排序.注意不需要重新赋值了在swift4上.


# 总结

随机数相关的知识容易忘记,特此记录一些技巧,争取每个月发布两篇文章.

[参考](http://southpeak.github.io/2015/09/26/ios-techset-5/)

