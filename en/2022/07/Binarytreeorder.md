---
layout: post
title: Preorder, Inorder and Postorder Traversal of a Binary Tree
date: 2022-07-04 17:58 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---


![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This article has a strong personal flavor; if it makes you uncomfortable, please close it right away. This article is only for personal study notes. You're welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for the support!

# As the title says

Given the root node `root` of a binary tree, return its `preorder`, `inorder`, and `postorder` traversals.


#### Example 1

![image](/assets/images/20220704BinaryTreeOrder/1.avif)

``` sh 
输入：root = [1,null,2,3]
输出：[1,2,3]
```

#### Example 2

``` sh 
输入：root = []
输出：[]
```

#### Example 3

``` sh 
输入：root = [1]
输出：[1]
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
    void inorder(TreeNode *root, vector<int> &res) {
        if (!root) {return;}
        
        //Preorder
        res.push_back(root->val);
        preorder(root->left,res);
        preorder(root->right,res);

        //Inorder
        inorder(root->left, res);
        res.push_back(root->val);
        inorder(root->right,res);

        //Postorder
        postorder(root->left, res);
        postorder(root->right, res);
        res.push_back(root->val);
    }

    vector<int> inorderTraversal(TreeNode* root) {
        vector <int> ans;
        inorder(root, ans);
        return ans;
    }
};
```

[144. Binary Tree Preorder Traversal](https://leetcode.cn/problems/binary-tree-preorder-traversal/)  
[94. Binary Tree Inorder Traversal](https://leetcode.cn/problems/binary-tree-inorder-traversal/)  
[145. Binary Tree Postorder Traversal](https://leetcode.cn/problems/binary-tree-postorder-traversal/)  
[Quoted from codetop](https://codetop.cc/home)

