---
layout: post
title: swift中求一个集合中子集
date: 2021-10-16 08:30:00
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

最近在学习一些Swift中的语法,有些比较有意思的内容我都记了笔记

## 问题 给定一个集合,求这个集合中有多少真子集？

#### 方法一

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

得出结果

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

#### 方法二

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
输出

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


# 总结

记录一些学习知识,防止遗忘.

