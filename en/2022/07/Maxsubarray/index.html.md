---
layout: post
title: Maximum Subarray
date: 2022-07-01 15:29 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---


![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This post carries strong personal sentiment; if you feel uncomfortable reading it, please close it as soon as possible. This post is only a personal learning record. Reposting or sharing within the license terms is welcome; please respect copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# The Problem

Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

A `subarray` is a contiguous part of an array.

#### Example 1

``` sh
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The contiguous subarray [4,-1,2,1] has the largest sum, which is 6.
```

#### Example 2

``` sh
Input: nums = [1]
Output: 1
```

#### Example 3

``` sh
Input: nums = [5,4,-1,7,8]
Output: 23
```

## Answer

``` c++
class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int pre = 0, maxAns = nums[0];
        for (const auto &x: nums) {
            pre = max( pre + x, x);
            maxAns = max(maxAns,pre);
        }
        return maxAns;
    }
};
```



[53. Maximum Subarray](https://leetcode.cn/problems/maximum-subarray/)  
[Reference from codetop](https://codetop.cc/home)
