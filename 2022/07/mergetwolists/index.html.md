---
layout: post
title: 合并两个有序链表
date: 2022-07-01 15:38 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---

![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

将两个升序链表合并为一个新的`升序`链表并返回。新链表是通过拼接给定的两个链表的所有节点组成的。 

#### 示例1

![](/assets/images/20220701MergeTwoLists/mergelinklist.webp)

``` sh
输入：l1 = [1,2,4], l2 = [1,3,4]
输出：[1,1,2,3,4,4]
```
#### 示例2

``` sh
输入：l1 = [], l2 = []
输出：[]
```
#### 示例3

``` sh
输入：l1 = [], l2 = [0]
输出：[0]
```

## Answer

``` c++
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};
 
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        if (list1 == nullptr) {
            return list2;
        } else if (list2 == nullptr) {
            return list1;
        } else if (list1->val < list2->val) {
            list1->next = mergeTwoLists(list1->next, list2);
            return list1;
        } else {
            list2->next = mergeTwoLists(list2->next, list1);
            return list2;
        }
    }
};
```



[21. 合并两个有序链表](https://leetcode.cn/problems/merge-two-sorted-lists/)  
[引用自codetop](https://codetop.cc/home)