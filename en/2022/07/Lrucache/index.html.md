---
layout: post
title: LRU Cache
date: 2022-07-01 14:35 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---

![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This article carries a strong personal touch; if it makes you uncomfortable, please close it as soon as possible. This article is only for personal study notes, and you're welcome to reprint or share it within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# The Problem

Design and implement a data structure that satisfies the `LRU (least recently used) cache` constraints.
Implement the `LRUCache` class:

* `LRUCache(int capacity)` initializes the LRU cache with a `positive integer` `capacity`.
* `int get(int key)` returns the value of the `key` if the key exists in the cache; otherwise, returns `-1`.
* `void put(int key, int value)` updates the `value` of the `key` if it already exists; otherwise, inserts the `key-value` pair into the cache. If the insertion causes the number of keys to exceed `capacity`, it should `evict` the least recently used key.
The `get` and `put` functions must run with an average time complexity of `O(1)`.

#### Example

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



[146. LRU Cache](https://leetcode.cn/problems/lru-cache/)  
[Sourced from codetop](https://codetop.cc/home)
