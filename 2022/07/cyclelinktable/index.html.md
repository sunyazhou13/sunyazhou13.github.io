---
layout: post
title: 环形链表
date: 2022-07-04 14:09 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---


![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给你一个链表的头节点`head`，判断链表中是否有环。

如果链表中有某个节点，可以通过连续跟踪`next`指针再次到达，则链表中存在环。 为了表示给定链表中的环，评测系统内部使用整数`pos`来表示链表尾连接到链表中的位置（索引从 0 开始）.

> 注意：`pos`不作为参数进行传递 。仅仅是为了标识链表的实际情况。

如果链表中存在环 ，则返回`true`。 否则，返回`false`。

#### 示例1

![](/assets/images/20220704CycleLinkTable/1.webp)

``` sh 
输入：head = [3,2,0,-4], pos = 1
输出：true
解释：链表中有一个环，其尾部连接到第二个节点。
```

#### 示例2

![](/assets/images/20220704CycleLinkTable/2.webp)

``` sh 
输入：head = [1,2], pos = 0
输出：true
解释：链表中有一个环，其尾部连接到第一个节点。
```

#### 示例3

![](/assets/images/20220704CycleLinkTable/3.webp)

``` sh 
输入：head = [1], pos = -1
输出：false
解释：链表中没有环。
```

## 实现代码

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


[141. 环形链表](https://leetcode.cn/problems/linked-list-cycle/)  
[引用自codetop](https://codetop.cc/home)
