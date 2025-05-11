---
layout: post
title: 两数之和
date: 2022-07-04 10:03 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---

![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给定一个整数数组`nums`和一个整数目标值`target`，请你在该数组中找出`和为目标值` `target`的那`两个`整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。

你可以按任意顺序返回答案。


#### 示例1

``` sh 
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。

```

#### 示例2

``` sh 
输入：nums = [3,2,4], target = 6
输出：[1,2]
```

#### 示例3

``` sh 
输入：nums = [3,3], target = 6
输出：[0,1]
```

## Answer

``` c++
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        int n = nums.size();
        for (int i = 0; i < n; ++i) {
            for (int j = i+1; j < n; ++j) {
                if (nums[i] + nums[j] == target) {
                    return {i,j};
                }
            }
        }
        return {};
    }
};
```


[1. 两数之和](https://leetcode.cn/problems/two-sum/)  
[引用自codetop](https://codetop.cc/home)