---
layout: post
title: 二叉树的前、中、后序遍历
date: 2022-07-04 17:58 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---


![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给定一个二叉树的根节点`root`，返回 它的`前序`、`中序`、`后序`遍历 。


#### 示例1

![](/assets/images/20220704BinaryTreeOrder/1.webp)

``` sh 
输入：root = [1,null,2,3]
输出：[1,2,3]
```

#### 示例2

``` sh 
输入：root = []
输出：[]
```

#### 示例3

``` sh 
输入：root = [1]
输出：[1]
```

## 实现代码

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
        
        //前序
        res.push_back(root->val);
        preorder(root->left,res);
        preorder(root->right,res);

        //中序
        inorder(root->left, res);
        res.push_back(root->val);
        inorder(root->right,res);

        //后序
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

[144. 二叉树的前序遍历](https://leetcode.cn/problems/binary-tree-preorder-traversal/)  
[94. 二叉树的中序遍历](https://leetcode.cn/problems/binary-tree-inorder-traversal/)  
[145. 二叉树的后序遍历](https://leetcode.cn/problems/binary-tree-postorder-traversal/)  
[引用自codetop](https://codetop.cc/home)

