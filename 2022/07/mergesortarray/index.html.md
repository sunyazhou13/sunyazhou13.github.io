---
layout: post
title: 合并两个有序数组
date: 2022-07-04 17:25 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---

![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给你两个按`非递减顺序`排列的整数数组`nums1`和`nums2`，另有两个整数`m`和`n` ，分别表示`nums1`和`nums2`中的元素数目。

请你`合并` `nums2` 到`nums1`中，使合并后的数组同样按`非递减顺序`排列。

> 注意：最终，合并后数组不应由函数返回，而是存储在数组`nums1`中。为了应对这种情况，`nums1`的初始长度为`m + n`，其中前`m`个元素表示应合并的元素，后`n`个元素为 `0`，应忽略。`nums2`的长度为`n`。


#### 示例1

``` sh 
输入：nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
输出：[1,2,2,3,5,6]
解释：需要合并 [1,2,3] 和 [2,5,6] 。
合并结果是 [1,2,2,3,5,6] ，其中斜体加粗标注的为 nums1 中的元素。

```

#### 示例2

``` sh 
输入：nums1 = [1], m = 1, nums2 = [], n = 0
输出：[1]
解释：需要合并 [1] 和 [] 。
合并结果是 [1] 。
```

#### 示例3

``` sh 
输入：nums1 = [0], m = 0, nums2 = [1], n = 1
输出：[1]
解释：需要合并的数组是 [] 和 [1] 。
合并结果是 [1] 。
注意，因为 m = 0 ，所以 nums1 中没有元素。nums1 中仅存的 0 仅仅是为了确保合并结果可以顺利存放到 nums1 中.
```

## 实现代码

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


[88. 合并两个有序数组](https://leetcode.cn/problems/merge-sorted-array/)  
[引用自codetop](https://codetop.cc/home)

