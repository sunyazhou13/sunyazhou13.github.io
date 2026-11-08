---
layout: post
title: Binary Tree Level Order Traversal
date: 2022-07-04 10:10 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---


![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This article contains strong personal opinions. If you find it uncomfortable to read, please close it immediately. This article is for personal learning records only. You are welcome to reproduce or share it within the scope of the license agreement. Please respect copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thank you for your support!

# Problem

Given the root node `root` of a binary tree, return its `level order traversal` (i.e., visit all nodes level by level, from left to right).


#### Example 1

![image](/assets/images/20220704BinaryTreeLevelOrder/1.avif)

``` sh 
输入：root = [3,9,20,null,null,15,7]
输出：[[3],[9,20],[15,7]]

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

## Implementation Code

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
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> ret;
        if(root == nullptr) { return ret; }
        queue <TreeNode *> q;
        q.push(root);
        while(!q.empty()) {
            int levelSize = q.size();
            ret.push_back(vector<int>());
            for (int i = 1; i <= levelSize; ++i) {
                auto node = q.front();
                q.pop();
                ret.back().push_back(node->val);
                if (node->left) {
                    q.push(node->left);
                }
                if (node->right) {
                    q.push(node->right);
                }
            }
        }
        return ret;
    }
};
```


[102. Binary Tree Level Order Traversal](https://leetcode.cn/problems/binary-tree-level-order-traversal/)  
[Quoted from codetop](https://codetop.cc/home)
