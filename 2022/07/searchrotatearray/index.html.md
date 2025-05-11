---
layout: post
title: 搜索旋转排序数组
date: 2022-07-04 14:53 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---

![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

整数数组`nums`按升序排列，数组中的值 互不相同 。

在传递给函数之前，`nums` 在预先未知的某个下标 `k`（`0 <= k < nums.length`）上进行了 `旋转`，使数组变为 `[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]`（下标 `从 0 开始` 计数）。例如， `[0,1,2,4,5,6,7]` 在下标 `3` 处经旋转后可能变为 `[4,5,6,7,0,1,2]` 。

给你 旋转后 的数组 `nums` 和一个整数 `target` ，如果 `nums` 中存在这个目标值 `target` ，则返回它的下标，否则返回 `-1` 。

你必须设计一个时间复杂度为 `O(log n)` 的算法解决此问题。

#### 示例1

``` sh 
输入：nums = [4,5,6,7,0,1,2], target = 0
输出：4

```

#### 示例2

``` sh 
输入：nums = [4,5,6,7,0,1,2], target = 3
输出：-1
```

#### 示例3

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


[33. 搜索旋转排序数组](https://leetcode.cn/problems/search-in-rotated-sorted-array/)  
[引用自codetop](https://codetop.cc/home)
