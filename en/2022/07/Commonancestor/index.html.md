---
layout: post
title: Lowest Common Ancestor of a Binary Tree
date: 2022-07-04 17:12 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---


![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This post carries strong personal opinions; if reading it makes you uncomfortable, please close it right away. This article is only for my personal study notes. You're welcome to repost or share it within the scope of the license — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# The Problem

Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree.

Per [Baidu Baike](https://baike.baidu.com/item/%E6%9C%80%E8%BF%91%E5%85%AC%E5%85%B1%E7%A5%96%E5%85%88/8918834?fr=aladdin), the definition of the lowest common ancestor is: "For two nodes p and q of a rooted tree T, the LCA is defined as a node x such that x is an ancestor of both p and q and x has the greatest depth possible (`a node can be an ancestor of itself`)."

#### Example 1

![image](/assets/images/20220704CommonAncestor/1.avif)

``` sh 
输入：root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1
输出：3
解释：节点 5 和节点 1 的最近公共祖先是节点 3 。

```

#### Example 2

![image](/assets/images/20220704CommonAncestor/2.avif)

``` sh 
输入：root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4
输出：5
解释：节点 5 和节点 4 的最近公共祖先是节点 5 。因为根据定义最近公共祖先节点可以为节点本身。

```

#### Example 3

``` sh 
输入：root = [1,2], p = 1, q = 2
输出：1
```

## Implementation

``` c++

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};
 
class Solution {
public:
    unordered_map<int, TreeNode *> father;
    unordered_map<int, bool> vis; //周游过的

    void dfs(TreeNode *root) {
        if (root->left != nullptr) {
            father[root->left->val] = root;
            dfs(root->left);
        }
        if (root->right != nullptr) {
            father[root->right->val] = root;
            dfs(root->right);
        }
    }

    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        father[root->val] = nullptr;
        dfs(root);
        while (p != nullptr) {
            vis[p->val] = true;
            p = father[p->val];
        }
        while (q != nullptr) {
            if (vis[q->val]) {
                return q;
            }
            q = father[q->val];
        }
        return nullptr;
    }
};
```


[236. Lowest Common Ancestor of a Binary Tree](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/)  
[Quoted from codetop](https://codetop.cc/home)

