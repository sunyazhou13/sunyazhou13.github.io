---
layout: post
title: iOS - Finding the Nearest Common Superclass of Two UIViews
date: 2022-07-05 08:12 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false

---

![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This post carries strong personal opinions. If reading it makes you uncomfortable, please close it as soon as possible. This article is only for my personal study records; you are also welcome to repost or share it within the scope of the license. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# Implementation Code

``` objc

// Usage
- (void)viewDidLoad {
    [super viewDidLoad];
    Class commonClass1 = [self commonClass:[ViewA class] andClass:[ViewC class]];
    NSLog(@"%@",commonClass1);
    // 输出：2022-07-03 17:36:01.868966+0800 两个UIView的最近公共父类[84288:2458900] ViewD
}

// Get all superclasses
- (NSArray *)superClasses:(Class)class {
    if (class == nil) {
        return @[];
    }
    NSMutableArray *result = [NSMutableArray array];
    while (class != nil) {
        [result addObject:class];
        class = [class superclass];
    }
    return [result copy];
}
// We first put every node along one path into an NSSet. Since NSSet is backed by a hash table internally, element lookup becomes O(1). With N nodes in total, the overall time complexity is optimized to O(N).
- (Class)commonClass:(Class)classA andClass:(Class)classB{
    NSArray *arr1 = [self superClasses:classA];
    NSArray *arr2 = [self superClasses:classB];
    NSSet *set = [NSSet setWithArray:arr2];
    for (NSUInteger i =0; i<arr1.count; ++i) {
        Class targetClass = arr1[i];
        if ([set containsObject:targetClass]) {
            return targetClass;
        }
    }
    return nil;
}
```

# Summary

This problem is similar to finding the nearest common ancestor in a binary tree. For reference, see Masonry's implementation:

Masonry's Algorithm: The Nearest Common Superview