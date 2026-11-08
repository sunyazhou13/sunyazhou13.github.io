---
layout: post
title: "Binary Tree Zigzag Level Order Traversal"
date: 2022-07-04 14:19 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---


![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This article carries strong personal sentiments. If you find it uncomfortable to read, please close it. This article is for personal learning records only. You're welcome to repost or share it within the scope of the license — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# The Problem

Given the root of a binary tree `root`, return the `zigzag level order traversal` of its node values. (i.e., first left to right, then right to left for the next level, alternating between levels).


#### Example 1

![image](/assets/images/20220704ZigzagLeveOrder/1.avif)

``` sh 
输入：root = [3,9,20,null,null,15,7]
输出：[[3],[20,9],[15,7]]
```

#### Example 2

``` sh 
输入：root = [1]
输出：[[1]]
```

#### Example 3

``` sh 
输入：root = []
输出：[]
```

## Implementation

``` c++
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

class Solution {
public:
    vector<vector<int>> zigzagLevelOrder(TreeNode* root) {
        vector<vector<int>> ans;
        if (root == nullptr) { return ans; }
        queue<TreeNode *> nodeQueue;
        nodeQueue.push(root);
        bool isOrderLeft = true;
        while(!nodeQueue.empty()) {
            deque<int> levelList;
            int n = nodeQueue.size();
            for (int i = 0; i < n; i++) {
                auto node = nodeQueue.front();
                nodeQueue.pop();
                if (isOrderLeft) {
                    levelList.push_back(node->val);
                } else {
                    levelList.push_front(node->val);
                }
                if (node->left) {
                    nodeQueue.push(node->left);
                }
                if (node->right) {
                    nodeQueue.push(node->right);
                }
            }
            ans.emplace_back(vector<int>{levelList.begin(),levelList.end()});
            isOrderLeft = !isOrderLeft;
        }
        return ans;
    }
};
```


[103. Binary Tree Zigzag Level Order Traversal](https://leetcode.cn/problems/binary-tree-zigzag-level-order-traversal/)  
[Quoted from codetop](https://codetop.cc/home)
