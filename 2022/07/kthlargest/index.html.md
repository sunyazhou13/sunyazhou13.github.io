---
layout: post
title: 数组中的第K个最大元素
date: 2022-07-01 14:44 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---

![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给定整数数组`nums`和整数`k`，请返回数组中第`k`个最大的元素。

请注意，你需要找的是数组排序后的第`k`个最大的元素，而不是第`k`个不同的元素。

#### 示例1

``` sh
输入: [3,2,1,5,6,4] 和 k = 2
输出: 5
```

#### 示例2

``` sh
输入: [3,2,3,1,2,4,5,5,6] 和 k = 4
输出: 4
```

## Answer

``` c++
class Solution {
public:
   void maxHeapify(vector<int> &nums, int i, int heapsize) {
        int left = i * 2+1, right = i * 2+2, largest = i;
        if (left < heapsize && nums[left] > nums[largest]) {
            largest = left;
        }
        if (right < heapsize && nums[right] > nums[largest]) {
            largest = right;
        }
        if (largest != i) {
            swap(nums[i], nums[largest]);
            maxHeapify(nums, largest, heapsize);
        }
    }

    void buildMaxHeap(vector<int> &nums, int heapsize){
        for (int i = heapsize/2; i >= 0; --i) {
            maxHeapify(nums, i , heapsize);
        }
    }

    //堆化
    int findKthLargest(vector<int> nums, int k){
        int heapsize = nums.size();
        buildMaxHeap(nums, heapsize);
        for (int i = nums.size() - 1; i >= nums.size() - k + 1; --i) {
            swap(nums[0],nums[i]);
            --heapsize;
            maxHeapify(nums, 0, heapsize);
        }
        return nums[0];
    }
};
```



[215. 数组中的第K个最大元素](https://leetcode.cn/problems/kth-largest-element-in-an-array/)  
[引用自codetop](https://codetop.cc/home)