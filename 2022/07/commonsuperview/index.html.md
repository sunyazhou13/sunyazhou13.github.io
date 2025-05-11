---
layout: post
title: iOS寻找两个UIView的最近的公共父类
date: 2022-07-05 08:12 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---

![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 实现代码


``` objc

//调用
- (void)viewDidLoad {
    [super viewDidLoad];
    Class commonClass1 = [self commonClass1:[ViewA class] andClass:[ViewC class]];
    NSLog(@"%@",commonClass1);
    // 输出：2022-07-03 17:36:01.868966+0800 两个UIView的最近公共父类[84288:2458900] ViewD
}

// 获取所有父类
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
//我们将一个路径中的所有点先放进NSSet中.因为NSSet的内部实现是一个hash表，所以查询元素的时间的复杂度变成O(1),我们一共有N个节点，所以总时间复杂度优化到了O(N)
- (Class)commonClass2:(Class)classA andClass:(Class)classB{
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


# 总结

本题类似二叉树寻找最近公共父节点,可以参考masonry的实现

[Masonry 算法之 最近公共父视图](https://www.todayios.com/ios-masonry-lca-closest-common-superview/)