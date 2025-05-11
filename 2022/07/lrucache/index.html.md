---
layout: post
title: LRU 缓存
date: 2022-07-01 14:35 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---

![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

请你设计并实现一个满足`LRU(最近最少使用)缓存` 约束的数据结构。
实现`LRUCache`类：

*  `LRUCache(int capacity)`以 `正整数` 作为容量`capacity`初始化LRU缓存
* `int get(int key)` 如果关键字 `key` 存在于缓存中，则返回关键字的值，否则返回 `-1`。
* `void put(int key, int value)`如果关键字`key`已经存在，则变更其数据值`value`；如果不存在，则向缓存中插入该组`key-value`。如果插入操作导致关键字数量超过`capacity`，则应该`逐出`最久未使用的关键字。
函数`get`和`put`必须以`O(1)`的平均时间复杂度运行。

#### 示例

``` sh
输入
["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]
输出
[null, null, null, 1, null, -1, null, -1, 3, 4]

解释
LRUCache lRUCache = new LRUCache(2);
lRUCache.put(1, 1); // 缓存是 {1=1}
lRUCache.put(2, 2); // 缓存是 {1=1, 2=2}
lRUCache.get(1);    // 返回 1
lRUCache.put(3, 3); // 该操作会使得关键字 2 作废，缓存是 {1=1, 3=3}
lRUCache.get(2);    // 返回 -1 (未找到)
lRUCache.put(4, 4); // 该操作会使得关键字 1 作废，缓存是 {4=4, 3=3}
lRUCache.get(1);    // 返回 -1 (未找到)
lRUCache.get(3);    // 返回 3
lRUCache.get(4);    // 返回 4

```

## Answer

``` c++
struct DLinkedNode { //基础结构
    int key, value;
    DLinkedNode* prev;
    DLinkedNode* next;
    DLinkedNode(): key(0),value(0), prev(nullptr), next(nullptr) {}
    DLinkedNode(int _key, int _value): key(_key),value(_value), prev(nullptr), next(nullptr) {}
};

class LRUCache {
private: 
    unordered_map<int, DLinkedNode*> cache;
    DLinkedNode* head;
    DLinkedNode* tail;
    int size;
    int capacity;
public:
    LRUCache(int _capacity): capacity(_capacity),size(0) {
        head = new DLinkedNode();
        tail = new DLinkedNode();
        head->next = tail; //后继连接尾部
        tail->prev = head; //前驱连接头部
    }
    
    void addToHead(DLinkedNode* node) {
        node->prev = head;
        node->next = head->next;
        head->next->prev = node;
        head->next = node;
    }

    void moveToHead(DLinkedNode* node) {
        removeNode(node);
        addToHead(node);
    }

    void removeNode(DLinkedNode* node) {
        node->next->prev = node->prev;
        node->prev->next = node->next;
    }

    DLinkedNode* removeTail(){
        DLinkedNode *node = tail->prev;
        removeNode(node);
        return node;
    }

    int get(int key) {
        if (!cache.count(key)) {
            return -1;
        } 
        DLinkedNode* node = cache[key];
        moveToHead(node);
        return node->value;
    }
    
    void put(int key, int value) {
        if (!cache.count(key)) { //如果不存在
            DLinkedNode* node = new DLinkedNode(key,value);
            cache[key] = node;
            addToHead(node);
            ++size;
            if (size > capacity) {
                DLinkedNode *node = removeTail();
                cache.erase(node->key);
                delete node;
                --size;
            }
        } else {
            DLinkedNode *node = cache[key];
            moveToHead(node);
            node->value = value;
        }
    }
};

/**
 * Your LRUCache object will be instantiated and called as such:
 * LRUCache* obj = new LRUCache(capacity);
 * int param_1 = obj->get(key);
 * obj->put(key,value);
 */
```



[146. LRU 缓存](https://leetcode.cn/problems/lru-cache/)  
[引用自codetop](https://codetop.cc/home)