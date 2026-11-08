---
layout: post
title: Kth Largest Element in an Array
date: 2022-07-01 14:44 +0800
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

Given an integer array `nums` and an integer `k`, return the `k`th largest element in the array.

Note that you need to find the `k`th largest element in the sorted order, not the `k`th distinct element.

#### Example 1

``` sh
Input: [3,2,1,5,6,4] and k = 2
Output: 5
```

#### Example 2

``` sh
Input: [3,2,3,1,2,4,5,5,6] and k = 4
Output: 4
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

    //Heapify
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



[215. Kth Largest Element in an Array](https://leetcode.cn/problems/kth-largest-element-in-an-array/)  
[Reference from codetop](https://codetop.cc/home)
