---
layout: post
title: Search in Rotated Sorted Array
date: 2022-07-04 14:53 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---

![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This article carries a strong personal tone. If you find it uncomfortable to read, please close it immediately. This article is intended only as a personal study record. You are welcome to repost or share it within the scope of the license—please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# The Problem

The integer array `nums` is sorted in ascending order, with all values being distinct.

Before being passed to the function, `nums` was rotated at an unknown pivot index `k` (`0 <= k < nums.length`) such that the array becomes `[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]` (0-indexed). For example, `[0,1,2,4,5,6,7]` rotated at index `3` might become `[4,5,6,7,0,1,2]`.

Given the rotated array `nums` and an integer `target`, return the index of `target` if it exists in `nums`, otherwise return `-1`.

You must design an algorithm with `O(log n)` time complexity to solve this problem.

#### Example 1

``` sh 
输入：nums = [4,5,6,7,0,1,2], target = 0
输出：4

```

#### Example 2

``` sh 
输入：nums = [4,5,6,7,0,1,2], target = 3
输出：-1
```

#### Example 3

``` sh 
输入：nums = [1], target = 0
输出：-1
```

## Answer

``` c++
class Solution {
public:
    int search(vector<int>& nums, int target) {
        int n = (int)nums.size();
        if (!n) { return -1; }
        if (n == 1) {
            return nums[0] == target? 0 : -1;
        }
        int left = 0, right = n -1;
        while (left <= right) {
            int mid = (right + left) /2;
            if (nums[mid] == target) {
                return mid;
            }
            if (nums[0] <= nums[mid]) {
                if (nums[0] <= target && target < nums[mid]) {
                    right = mid -1;
                } else {
                    left = mid + 1;
                }
            } else {
                if (nums[mid] < target && target <= nums[n-1]) {
                    left = mid +1;
                } else {
                    right = mid -1;
                }
            }
        }
        return -1;
    }
};
```


[33. Search in Rotated Sorted Array](https://leetcode.cn/problems/search-in-rotated-sorted-array/)  
[Quoted from codetop](https://codetop.cc/home)
