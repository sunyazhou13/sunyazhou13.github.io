---
layout: post
title: Swift4.2中的随机数
date: 2018-06-08 09:18:03
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..
---

![](/assets/images/20180608SwiftRandom/whatisnewinswift.avif)

# 前言

在上一篇文章发布不久WWDC2018就拉开了序幕,让我觉得有一点比较蛋疼的(a bit of pain) 是swift4.2中增加了系统的随机数支持.所以不得不完善的好上一篇文章的缺漏和新技术的研究学习.特此新发一篇新的随机数文章以彰其咎.

## 开发环境

* Xcode10或者更高版本 
* Swift4.2
* 使用Xcode中的Playground


## 生成随机数

在上一篇中我们大部分时间都在围绕[arcrandom()](https://man.openbsd.org/arc4random.3)函数来介绍随机数.当然也有它的一些变种.eg：arc4random_uniform(),rand(),random().但无论如何这些函数多数都是系统级函数。


在swift4.2中 所有的 数字类型(就是普通数据类型中代表数字的)都有一个静态方法`random(in:)`,这个方法将接收一个范围(Range)或者开闭范围,返回一个无序的随机数(a uniform distribution). 这些随机函数将会包含在swift的标准库中,如果跨平台的话标准库函数都是一致的,不像上面介绍的系统随机函数.


``` swift

Int.random(in: 1...1000) //→ 580
Double.random(in: 0..<1) //→ 0.3211009027224093
UInt32.random(in: 0xD800...0xDFFF) //→ 56324
```

### 模偏差(Modulo bias)

以下代码演示了我们常用的取模 方式随机

``` swift
// Wrong! ❌
let between0And5 = UInt8.random() % 6

```

这种随机数 有可能不够均匀分布,这种非均匀分布的方式就叫[`模偏差`](https://www.quora.com/What-is-modulo-bias).

那如何解决这种莫偏差的问题呢?

在swift中就是用我上边介绍的方法.

``` swift
// Correct ✅
let between0And5 = UInt8.random(in: 0..<6) // → 5
```

如果我们需要随机一个`数字数据类型`全范围的随机数的话可以使用 `.min ... .max`来进行范围随机. 如下代码:

``` swift 
let between0And255 = UInt8.random(in: .min ... .max) // → 190
```


### Bool值随机

虽然这种类型完全可以用 %2 ==0 或者 %2==0 来解决,但是swift还是很负责任的帮我们做到了这一点, 举个`抛硬币`场景的随机例子:

``` swift
func coinToss(count tossCount: Int) -> (heads: Int, tails: Int) {
    var result = (heads: 0, tails: 0)
    for _ in 0..<tossCount {
        let toss = Bool.random()
        if toss {
            result.heads += 1
        } else {
            result.tails += 1
        }
    }
    return result
}

let (heads, tails) = coinToss(count: 100)

// → (heads 54, tails 46)
```

> heads → 人头面   
> tails → 背面

### 容器类型的元素随机(Random collection elements)

首先大家可以[`Collection`](https://developer.apple.com/documentation/swift/collection)理解成一个集成`NSObject`的类实现了容器协议的类型.eg: 数组，字典等等。。。。

这些`Collection` 类型都有一个`randomElement()`方法(可以看下上一篇文章末尾介绍的10个字符串的数).这个函数返回一个`Optional`可选类型.因为`Collection`可能为空.

``` swift 
let emptyRange = 10..<10
emptyRange.isEmpty // → true
emptyRange.randomElement() // → nil
```
> 可以看到元素随机为nil

我们举个上一节的例子还测试一下

``` swift
var arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
let randomElement = arr.randomElement()!  // → "8"
```

举个字符串emotion表情的demo

``` swift
let emotions = "😀😂😊😍🤪😎😩😭😡"
let randomEmotion = emotions.randomElement()! // → "😡"
```

### Shuffling 集合随机排列(洗牌算法)

使用[shuffled()](https://developer.apple.com/documentation/swift/sequence/2996816-shuffled)方法去随机排列一个序列或容易.

``` swift
(1...20).shuffled() 
// → numbers is now [16, 9, 2, 18, 5, 13, 8, 11, 17, 3, 6, 1, 14, 7, 10, 15, 20, 19, 12, 4]
```

以上实现了一个类似洗牌算法的排序 1~20 之间的数 注意：左右都是闭区间(闭区间包含本身) 因为这里用的是`...`,不理解大家可以查找一下swift相关区间标识的知识.

## 随机数生成的协议（Random number generators）

`Random number generators`简称`RNG`,以下简称`RNG`.

### 默认的RNG

以上介绍的使用方法都是被定义在swift的标准库中的方法. 叫[Random.default](https://forums.swift.org/t/se-0202-amendment-proposal-rename-random-to-defaultrandomnumbergenerator/12942)

[SE-0202](https://github.com/apple/swift-evolution/blob/master/proposals/0202-random-unification.md) 讨论了这种默认随机的一些问题

我在这里简要一下

> The aspiration is that this RNG should be cryptographically secure, provide reasonable performance, and should be thread safe. If a vendor is unable to provide these goals, they should document it clearly. … if an RNG on a platform has the possibility of failing, then it must fail [i.e. trap] when it is unable to complete its operation.  
> 大概意思就是 高性能,高安全性,线程安全.... 

### 自定义RNGs 

对于大多数简单的用例，缺省的RNG应该是正确的选择。但是，如果您的代码对随机数生成器有特殊的要求，比如特定的算法或用可重复的种子初始化RNG的能力，那么您就可以通过采用随机数生成器协议来实现自己的RNG。协议只有一个要求:`next()`方法，该方法产生`8个新的字节随机数`:

``` swift
public protocol RandomNumberGenerator {
    /// Returns a value from a uniform, independent
    /// distribution of binary data.
    public mutating func next() -> UInt64
}
```

> 注意:协议需要统一的分布。其思想是，需要具有非均匀分布的随机值的用户可以在第二步将期望的分布应用到均匀分布随机性序列里。  
> 就是如果想按照自己的方法随机需要吧next()函数写上,写好泛型函数规则就行了.

### 使用自定义随机RNG

所有用于生成随机值的标准库api都提供了允许用户传入自定义随机数生成器的方法重载。例如，Int类型有以下两种方法:

``` swift
extension Int {
    static func random(in range: Range<Int>) -> Int { ... }
    static func random<T>(in range: Range<Int>,
        using generator: inout T) -> Int
        where T: RandomNumberGenerator { ... }
    // The overloads that take a ClosedRange are not shown
}
```

这个`generator`参数需要总是传入[`inout`](https://docs.swift.org/swift-book/ReferenceManual/Declarations.html#ID545),因为在产生新的随机性时，RNGs通常会改变它们的状态。


下面看下我们怎么调用自定义随机, 我们需要创建一个可变的并且满足inout的要求的方法.

``` swift
var mersenneTwister = MersenneTwisterRNG(...) // assume this exists
Int.random(in: 10..<20, using: &mersenneTwister)
```


### 在自有类型中生成随机值

通过上面我们了解到

自定义随机协议需要满足两个标准库模式的步骤:

* 提供静态随机方法`random() -> Self` 这个方法使用默认的RNG,如果我们规范随机范围的时候这个函数能补充额外参数.以便于我们规范随机的range.  
* 提供第二个方法`random<T: RandomNumberGenerator>(using generator: inout T) -> Self`这个是生成默认随机数的核心方法.


举个扑克游戏中的枚举例子, 这里面我们可以充分利用[`Swift4.2`](https://github.com/apple/swift-evolution/blob/master/proposals/0194-derived-collection-of-enum-cases.md)中的[allCase](https://developer.apple.com/documentation/swift/caseiterable)属性.

``` swift 
enum Suit: String, CaseIterable {
    case diamonds = "♦"
    case clubs = "♣"
    case hearts = "♥"
    case spades = "♠"
    
    static func random() -> Suit {
        return Suit.random(using: &Random.default)
    }
    
    static func random<T: RandomNumberGenerator>
        (using generator: inout T) -> Suit
    {
        // Force-unwrap can't fail as long as the
        // enum has at least one case.
        return allCases.randomElement(using: &generator)!
    }
}

let randomSuit = Suit.random() // → clubs
randomSuit.rawValue // → "♠"
```


## 总结

本篇补充了新版Swift4.2中对标准库中的随机函数支持,也介绍了洗牌函数默认随机均匀排列,希望小伙伴们看完有所收获,有问题还请多多指教

全文完


[参考](https://oleb.net/blog/2018/06/random-numbers-in-swift/)

