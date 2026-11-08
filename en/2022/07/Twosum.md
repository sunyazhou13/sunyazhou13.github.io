---
layout: post
title: Two Sum
date: 2022-07-04 10:03 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---

![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This article carries a strong personal flavor. If it makes you uncomfortable, please close it as soon as possible. This article is for personal study notes only. You're welcome to repost or share it within the bounds of the license agreement — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# Problem Statement

Given an array of integers `nums` and an integer target value `target`, find the `two` integers in the array whose `sum equals the target value` `target`, and return their array indices.

You may assume that each input would have exactly one solution. However, the same element in the array may not appear twice in the answer.

You may return the answer in any order.


#### Example 1

``` sh 
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。

```

#### Example 2

``` sh 
输入：nums = [3,2,4], target = 6
输出：[1,2]
```

#### Example 3

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


[1. Two Sum](https://leetcode.cn/problems/two-sum/)  
[Source: codetop](https://codetop.cc/home)
