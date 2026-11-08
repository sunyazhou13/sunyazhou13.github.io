---
layout: post
title: Reverse Linked List
date: 2022-07-01 12:36 +0800
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

Given the head node `head` of a singly linked list, reverse the linked list and return the reversed list.  
![image](/assets/images/20220701ReverseList/1.avif)

``` sh
输入：head = [1,2,3,4,5]
输出：[5,4,3,2,1]
```

## Answer

``` c++
//Definition for singly-linked list.
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};
 
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode *prev = nullptr;
        ListNode *curr = head;
        while (curr){
            ListNode *next = curr->next;
            curr->next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
};
```



[206. Reverse Linked List](https://leetcode-cn.com/problems/reverse-linked-list/)  
[Quoted from codetop](https://codetop.cc/home)
