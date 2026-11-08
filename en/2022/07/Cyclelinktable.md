---
layout: post
title: Linked List Cycle
date: 2022-07-04 14:09 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---


![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This article carries a strong personal flavor. If it makes you uncomfortable, please close it as soon as possible. This article is for personal study notes only. You're welcome to repost or share it within the bounds of the license agreement — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# Problem Statement

Given the head of a linked list `head`, determine whether the linked list has a cycle in it.

If there is a node in the linked list that can be reached again by continuously following the `next` pointer, then the linked list has a cycle. To represent a cycle in the given linked list, the judge system internally uses the integer `pos` to denote the position (0-indexed) in the linked list where the tail connects to.

> Note: `pos` is not passed as a parameter. It is only used to identify the actual situation of the linked list.

Return `true` if there is a cycle in the linked list. Otherwise, return `false`.

#### Example 1

![image](/assets/images/20220704CycleLinkTable/1.avif)

``` sh 
输入：head = [3,2,0,-4], pos = 1
输出：true
解释：链表中有一个环，其尾部连接到第二个节点。
```

#### Example 2

![image](/assets/images/20220704CycleLinkTable/2.avif)

``` sh 
输入：head = [1,2], pos = 0
输出：true
解释：链表中有一个环，其尾部连接到第一个节点。
```

#### Example 3

![image](/assets/images/20220704CycleLinkTable/3.avif)

``` sh 
输入：head = [1], pos = -1
输出：false
解释：链表中没有环。
```

## Implementation

``` c++
struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(NULL) {}
};

class Solution {
public:
    bool hasCycle(ListNode *head) {
        unordered_set<ListNode *> seen;
        while (head != nullptr) {
            if (seen.count(head)){
                return true;
            } 
            seen.insert(head);
            head = head->next;
        }
        return false;
    }
};
```


[141. Linked List Cycle](https://leetcode.cn/problems/linked-list-cycle/)  
[Source: codetop](https://codetop.cc/home)
