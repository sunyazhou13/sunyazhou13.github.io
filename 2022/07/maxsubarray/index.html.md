---
layout: post
title: 最大子数组和
date: 2022-07-01 15:29 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---


![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给你一个整数数组`nums`，请你找出一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。

`子数组`是数组中的一个连续部分。

#### 示例1

``` sh
输入：nums = [-2,1,-3,4,-1,2,1,-5,4]
输出：6
解释：连续子数组 [4,-1,2,1] 的和最大，为 6 。
```

#### 示例2

``` sh
输入：nums = [1]
输出：1
```

#### 示例3

``` sh
输入：nums = [5,4,-1,7,8]
输出：23
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



[53. 最大子数组和](https://leetcode.cn/problems/maximum-subarray/)  
[引用自codetop](https://codetop.cc/home)