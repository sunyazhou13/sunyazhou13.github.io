---
layout: post
title: Finding Subsets of a Set in Swift
date: 2021-10-16 08:30:00
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

This post carries a strong personal flavor — if it makes you uncomfortable, please close it quickly. This article is only for personal study notes, but you're welcome to repost or share it within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

I've been learning some Swift syntax lately, and I've taken notes on some interesting bits.

## Problem: Given a Set, How Many Subsets Does It Have?

#### Method 1

``` swift
import UIKit

func getSubSets<T>(set: Set<T>) -> Array<Set<T>> {
    let count = 1 << set.count //set.count 不能超过64 否则将超过int最大数限制
    let elements = Array(set)
    var subsets = [Set<T>]()
    for i in 0..<count {
        var subset = Set<T>()
        for j in 0..<elements.count {
            if ((i >> j) & 1) == 1 {
                subset.insert(elements[j])
            }
        }
        subsets.append(subset)
    }
    return subsets
}

let testSet: Set = ["S","Y","Z"]
for subSet in getSubSets(set: testSet) {
    print(subSet)
}

```

The result:

``` sh
[]
["Y"]
["Z"]
["Y", "Z"]
["S"]
["Y", "S"]
["S", "Z"]
["Z", "Y", "S"]
```

#### Method 2

``` swift 
func getSubSets<T>(_ set: Set<T>) -> Array<Set<T>> {
    let elements = Array(set)
    return getSubSetsDetail(elements, index: elements.count - 1, count: elements.count)
}

func getSubSetsDetail<T>(_ elements: Array<T>, index: Int, count: Int) -> Array<Set<T>> {
    var subSets = Array<Set<T>>()
    if index == 0 {
        subSets.append(Set<T>())
        var subset = Set<T>()
        subset.insert(elements[0])
        subSets.append(subset)
        return subSets
    }
    subSets = getSubSetsDetail(elements, index: index - 1, count: count)
    for subset in subSets {
        var currentSubset = Set(subset)
        currentSubset.insert(elements[index])
        subSets.append(currentSubset)
    }
    return subSets
}

let testSet: Set = ["S","Y","Z"]
for subSet in getSubSets(testSet) {
    print(subSet)
}

```
Output:

``` sh
[]
["Y"]
["Z"]
["Y", "Z"]
["S"]
["S", "Y"]
["S", "Z"]
["S", "Y", "Z"]
```


# Summary

Recording some knowledge I've learned to prevent forgetting.
