---
layout: post
title: Random Numbers in Swift
date: 2018-06-01 17:30:56
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..
math: false
mermaid: false

---


![Swift Random Numbers](/assets/images/20180601Random/SwiftRandomNumbers.avif)

# Preface


Today is Children's Day, so I'll write a technical article on `random numbers` to commemorate the childhood of "left-behind children (veteran level)".



## Using Random Numbers in Swift

In our development work, we often need random numbers. Today I'll list a few approaches in this article.

## Integer Random Numbers

First, there's arc4random()

> `arc4random()` uses an `arc4` cipher-based `key` `stream` generator and produces a random number in the interval `[0, 2^32)` (note it's a closed-open interval, inclusive on the left, exclusive on the right). This function returns a `UInt32`.

> Tip: _`[` and `]` denote a closed interval on the left and right respectively_,
> _`(` and `)` denote an open interval on the left and right respectively_
> That is, `square brackets` -> denote a closed interval; a closed interval means inclusive.  
> Parentheses -> denote an open interval; an open interval means exclusive.  
> So in the following you'll see

``` swift 
arc4random()   //"4058056034"
```

If we want to generate an integer random number **within a specified range**, we can use `arc4random()` `%` `upper_bound`, where `upper_bound` specifies the upper bound, as in the code below:

Generate a random number below 10

``` swift 
arc4random() % 10  // 0~9 注意没有10哈
```

However, with this approach, when `upper_bound` is not a power of `2`, it produces a so-called `Modulo bias` issue.

You can use `arc4random_uniform()` instead. It takes a `UInt32` parameter, **specifying the upper bound of the random number interval** `upper_bound`, and generates a random number in the range [0, upper_bound), as shown below:

``` swift 
arc4random_uniform(10)		// 5
```

So here's the question: what if I want a random number in a specific interval, like `[10, 200)`?

``` swift 
let maxNum: UInt32 = 200
let minNum: UInt32 = 10
arc4random_uniform(maxNum - minNum) + minNum   // 153
```

As you can see, the result above is `153`.

Swift can also use C functions for randomness, e.g., random() or rand(), but these have the following drawbacks:

* Both functions require an initial seed, usually based on the current time, and are pseudo-random.
* Their upper limit is `RAND_MAX=0X7fffffff` (2147483647), half of `arc4random`'s.
* `rand()` is implemented with a regular low-bit cycling pattern and is easier to predict.

``` c
srand(UInt32(time(nil)))  // 种子,random对应的是srandom
rand()				      // 1,314,695,483
rand() % 10	   			  // 8
```

## 64-bit Integer Random Numbers

We notice that these functions operate mainly on `32`-bit integers. What if we need to generate a `64`-bit integer random number?

We can use the following code:

``` swift 
func arc4random <T: ExpressibleByIntegerLiteral> (type: T.Type) -> T {
    var r: T = 0
    arc4random_buf(&r, MemoryLayout<T>.size)
    return r
}
```
It can be called like this:

``` swift
arc4random(type: UInt64.self) //8021765689869396105
arc4random(type: UInt32.self) //1293034028
arc4random(type: UInt16.self) //29059
arc4random(type: UInt8.self)  //183

```
> Swift 4 syntax

This function uses `arc4random_buf()` to generate the random number.

This function fills a buffer of the length specified by its second parameter with ARC4-cipher-based random numbers. So if we pass sizeof(UInt64), the function generates a random number filling the 8-byte region and returns it to r. You can then implement the 64-bit random number generator like this:

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

Let's try it out:

``` swift
UInt64.random()      //9223372036854775807
```


## Floating-point Random Numbers

If you need a floating-point random number, you can use the drand48 function, which produces a floating-point number in the interval [0.0, 1.0]. Its return value is of type Double. Usage looks like this:


``` swift
srand48(Int(time(nil)))
drand48()  //0.4643666202473504
```

> Note: you must call srand48() first to generate a seed

## Practical Example

How to randomly shuffle an array of 0~9, implementing something like a bank-style dynamic keypad

``` swift
var arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
arr.sort { (s1, s2) -> Bool in
    arc4random() < arc4random()
}

print(arr)
```

In the closure, two random numbers are generated and compared to determine the array's order. Note that in Swift 4, you no longer need to reassign the result.


# Summary

Random number knowledge is easy to forget, so I'm recording these tips here, and I'll aim to publish two articles a month.

[Reference](http://southpeak.github.io/2015/09/26/ios-techset-5/)
