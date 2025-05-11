---
layout: post
title: 反转链表
date: 2022-07-01 12:36 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---

![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给你单链表的头节点`head`，请你反转链表，并返回反转后的链表。  
![](/assets/images/20220701ReverseList/1.webp)

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



[206. 反转链表](https://leetcode-cn.com/problems/reverse-linked-list/)  
[引用自codetop](https://codetop.cc/home)