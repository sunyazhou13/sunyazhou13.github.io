---
layout: post
title: "Random Numbers in Swift 4.2"
date: 2018-06-08 09:18:03
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..
math: false
mermaid: false

---

![whatisnewinswift](/assets/images/20180608SwiftRandom/whatisnewinswift.avif)

# Preface

Shortly after my previous article was published, WWDC2018 kicked off. What I found a bit of a pain was that Swift 4.2 added system-level random number support. So I had to fill in the gaps from my previous article and study the new technology. Here's a new article on random numbers to make up for it.

## Development Environment

* Xcode 10 or later
* Swift 4.2
* Use Playground in Xcode

## Generating Random Numbers

In the previous article, we spent most of the time discussing random numbers around the [arc4random()](https://man.openbsd.org/arc4random.3) function. Of course, there are also some variants, e.g., arc4random_uniform(), rand(), random(). But regardless, these are mostly system-level functions.

In Swift 4.2, all numeric types (i.e., the numeric types among the basic data types) have a static method `random(in:)`. This method accepts a range (Range) or a closed/open range and returns a uniformly distributed random number. These random functions are included in Swift's standard library, so they're consistent across platforms, unlike the system random functions introduced above.

``` swift

Int.random(in: 1...1000) //→ 580
Double.random(in: 0..<1) //→ 0.3211009027224093
UInt32.random(in: 0xD800...0xDFFF) //→ 56324
```

### Modulo Bias

The following code demonstrates the modulo approach to random number generation that we commonly use:

``` swift
// Wrong! ❌
let between0And5 = UInt8.random() % 6

```

This kind of random number may not be uniformly distributed. This non-uniform distribution is called `modulo bias`.

So how do we solve this modulo bias problem?

In Swift, we use the method I introduced above.

``` swift
// Correct ✅
let between0And5 = UInt8.random(in: 0..<6) // → 5
```

If we need a random number across the full range of a `numeric data type`, we can use `.min ... .max` for the range. Here's the code:

``` swift 
let between0And255 = UInt8.random(in: .min ... .max) // → 190
```

### Random Bool Values

Although this type can easily be handled with %2 == 0, Swift still responsibly provides this for us. Here's an example of a `coin toss` scenario:

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

> heads → the side with the head
> tails → the reverse side

### Random Collection Elements

First, you can think of [`Collection`](https://developer.apple.com/documentation/swift/collection) as a type that implements the collection protocol, like a class inheriting from `NSObject`. E.g., arrays, dictionaries, etc.

These `Collection` types all have a `randomElement()` method (you can refer to the array of 10 strings introduced at the end of the previous article). This function returns an `Optional` type, because the `Collection` might be empty.

``` swift 
let emptyRange = 10..<10
emptyRange.isEmpty // → true
emptyRange.randomElement() // → nil
```
> As you can see, the random element is nil

Let's use an example from the previous section to test:

``` swift
var arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
let randomElement = arr.randomElement()!  // → "8"
```

Here's a demo with emoji characters:

``` swift
let emotions = "😀😂😊😍🤪😎😩😭😡"
let randomEmotion = emotions.randomElement()! // → "😡"
```

### Shuffling — Random Permutation of Collections (Shuffle Algorithm)

Use the [shuffled()](https://developer.apple.com/documentation/swift/sequence/2996816-shuffled) method to randomly permute a sequence or collection.

``` swift
(1...20).shuffled() 
// → numbers is now [16, 9, 2, 18, 5, 13, 8, 11, 17, 3, 6, 1, 14, 7, 10, 15, 20, 19, 12, 4]
```

That gives you a shuffle-like sorting of numbers from 1 to 20. Note: both sides are closed ranges (closed ranges include the endpoint) because `...` is used here. If you don't understand, you can look up Swift's range notation.

## Random Number Generator Protocols

`Random number generators`, abbreviated as `RNG`, hereafter referred to as `RNG`.

### Default RNG

The methods introduced above are all defined in Swift's standard library. It's called [Random.default](https://forums.swift.org/t/se-0202-amendment-proposal-rename-random-to-defaultrandomnumbergenerator/12942).

[SE-0202](https://github.com/apple/swift-evolution/blob/master/proposals/0202-random-unification.md) discussed some issues with this default random number generator.

Let me summarize briefly:

> The aspiration is that this RNG should be cryptographically secure, provide reasonable performance, and should be thread safe. If a vendor is unable to provide these goals, they should document it clearly. … if an RNG on a platform has the possibility of failing, then it must fail [i.e. trap] when it is unable to complete its operation.  
> The general idea is: high performance, high security, thread safety...

### Custom RNGs

For most simple use cases, the default RNG should be the right choice. However, if your code has special requirements for the random number generator, such as a specific algorithm or the ability to initialize the RNG with a repeatable seed, you can implement your own RNG by adopting the RandomNumberGenerator protocol. The protocol has only one requirement: a `next()` method that produces `8 new bytes of random data`:

``` swift
public protocol RandomNumberGenerator {
    /// Returns a value from a uniform, independent
    /// distribution of binary data.
    public mutating func next() -> UInt64
}
```

> Note: The protocol requires a uniform distribution. The idea is that users who need random values with non-uniform distributions can apply the desired distribution to the sequence of uniformly distributed randomness in a second step.
> In other words, if you want to generate random numbers using your own method, just implement the next() function and define the generic function rules.

### Using a Custom RNG

All standard library APIs for generating random values provide method overloads that allow users to pass in a custom random number generator. For example, the Int type has the following two methods:

``` swift
extension Int {
    static func random(in range: Range<Int>) -> Int { ... }
    static func random<T>(in range: Range<Int>,
        using generator: inout T) -> Int
        where T: RandomNumberGenerator { ... }
    // The overloads that take a ClosedRange are not shown
}
```

The `generator` parameter always needs to be passed as [`inout`](https://docs.swift.org/swift-book/ReferenceManual/Declarations.html#ID545), because RNGs typically change their state when generating new randomness.

Let's see how to call a custom RNG. We need to create a mutable method that satisfies the inout requirement:

``` swift
var mersenneTwister = MersenneTwisterRNG(...) // assume this exists
Int.random(in: 10..<20, using: &mersenneTwister)
```

### Generating Random Values in Your Own Types

From the above, we learned that:

A custom random protocol needs to satisfy two standard library pattern steps:

* Provide a static random method `random() -> Self` that uses the default RNG. When we need to constrain the random range, this function can take additional parameters to specify the range.
* Provide a second method `random<T: RandomNumberGenerator>(using generator: inout T) -> Self` — this is the core method for generating random numbers.

Here's an example using an enum for a card game, where we can fully utilize the [`Swift 4.2`](https://github.com/apple/swift-evolution/blob/master/proposals/0194-derived-collection-of-enum-cases.md) [allCases](https://developer.apple.com/documentation/swift/caseiterable) property.

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

## Summary

This article supplemented the standard library's random function support in the new Swift 4.2, and also introduced the shuffle function's default uniform random permutation. I hope you found this helpful. Please feel free to point out any issues.

End of article

[Reference](https://oleb.net/blog/2018/06/random-numbers-in-swift/)

