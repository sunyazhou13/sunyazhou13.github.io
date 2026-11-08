---
layout: post
title: Merging Two Sorted Lists
date: 2022-07-01 15:38 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---

![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This post carries strong personal opinions. If reading it makes you uncomfortable, please close it as soon as possible. This article is only for my personal study records; you are also welcome to repost or share it within the scope of the license. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# As the Title Says

Merge two ascending-sorted linked lists into a new `ascending` linked list and return it. The new list is made by splicing together all the nodes of the two given lists.

#### Example 1

![mergelinklist](/assets/images/20220701MergeTwoLists/mergelinklist.avif)

``` sh
输入：l1 = [1,2,4], l2 = [1,3,4]
输出：[1,1,2,3,4,4]
```
#### Example 2

``` sh
输入：l1 = [], l2 = []
输出：[]
```
#### Example 3

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



[21. Merge Two Sorted Lists](https://leetcode.cn/problems/merge-two-sorted-lists/)  
[Quoted from codetop](https://codetop.cc/home)