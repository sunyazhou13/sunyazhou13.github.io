---
layout: post
title: Merge Two Sorted Arrays
date: 2022-07-04 17:25 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---

![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This post carries a strong personal flavor — if it makes you uncomfortable, please close it quickly. This article is only for personal study notes, but you're welcome to repost or share it within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# The Problem

You are given two integer arrays `nums1` and `nums2`, sorted in `non-decreasing order`, and two integers `m` and `n`, representing the number of elements in `nums1` and `nums2` respectively.

`Merge` `nums2` into `nums1` so that the merged array is also sorted in `non-decreasing order`.

> Note: the merged array should not be returned by the function, but instead be stored in the array `nums1`. To accommodate this, `nums1` has an initial length of `m + n`, where the first `m` elements denote the elements that should be merged, and the last `n` elements are set to `0` and should be ignored. `nums2` has a length of `n`.


#### Example 1

``` sh 
输入：nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
输出：[1,2,2,3,5,6]
解释：需要合并 [1,2,3] 和 [2,5,6] 。
合并结果是 [1,2,2,3,5,6] ，其中斜体加粗标注的为 nums1 中的元素。

```

#### Example 2

``` sh 
输入：nums1 = [1], m = 1, nums2 = [], n = 0
输出：[1]
解释：需要合并 [1] 和 [] 。
合并结果是 [1] 。
```

#### Example 3

``` sh 
输入：nums1 = [0], m = 0, nums2 = [1], n = 1
输出：[1]
解释：需要合并的数组是 [] 和 [1] 。
合并结果是 [1] 。
注意，因为 m = 0 ，所以 nums1 中没有元素。nums1 中仅存的 0 仅仅是为了确保合并结果可以顺利存放到 nums1 中.
```

## Implementation

``` c++
class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
        for (int i = 0; i != n; ++i) {
            nums1[m + i] = nums2[i];
        }
        sort(nums1.begin(),nums1.end());
    }
};
```


[88. Merge Sorted Array](https://leetcode.cn/problems/merge-sorted-array/)  
[From codetop](https://codetop.cc/home)
