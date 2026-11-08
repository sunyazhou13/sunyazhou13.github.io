---
layout: post
title: 3Sum
date: 2022-07-01 14:55 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---


![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This article is strongly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. You are welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# The Problem

Given an array `nums` of `n` integers, determine whether there are three elements `a`, `b`, `c` in `nums` such that `a + b + c = 0`. Find all unique triplets that sum to `0`.

> Note: The solution set must not contain duplicate triplets.

#### Example 1

``` sh 
输入：nums = [-1,0,1,2,-1,-4]
输出：[[-1,-1,2],[-1,0,1]]
```

#### Example 2

``` sh 
输入：nums = []
输出：[]
```

#### Example 3

``` sh 
输入：nums = [0]
输出：[]
```

## Answer

``` c++
class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        int n = nums.size();
        sort(nums.begin(),nums.end());
        vector<vector<int>> ans;
        for (int first = 0; first < n; ++first) {
            //check
            if (first > 0 && nums[first] == nums[first - 1]) {
                continue;
            }
            int third = n -1;
            int target = -nums[first];
            for (int second = first + 1; second < n; ++second) {
                if (second > first + 1 && nums[second] == nums[second - 1]) {
                    continue;
                }
                while (second < third && nums[second] + nums[third] > target) {
                    --third;
                }

                if (second == third) {
                    break;
                }
                if (nums[second] + nums[third] == target) {
                    ans.push_back({nums[first],nums[second],nums[third]});
                }
            }
        }
        return ans;
    }
};
```


[15. 3Sum](https://leetcode.cn/problems/3sum/)  
[Quoted from codetop](https://codetop.cc/home)
