---
layout: post
title: 三数之和
date: 2022-07-01 14:55 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---


![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给你一个包含`n`个整数的数组`nums`，判断`nums`中是否存在三个元素`a`，`b`，`c` ，使得 `a + b + c = 0`？请你找出所有和为`0`且不重复的三元组。

> 注意：答案中不可以包含重复的三元组。

#### 示例1

``` sh 
输入：nums = [-1,0,1,2,-1,-4]
输出：[[-1,-1,2],[-1,0,1]]
```

#### 示例2

``` sh 
输入：nums = []
输出：[]
```

#### 示例3

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


[15. 三数之和](https://leetcode.cn/problems/3sum/)  
[引用自codetop](https://codetop.cc/home)