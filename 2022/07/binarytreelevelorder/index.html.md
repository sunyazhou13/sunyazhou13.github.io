---
layout: post
title: 二叉树的层序遍历
date: 2022-07-04 10:10 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---


![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给你二叉树的根节点`root`，返回其节点值的`层序遍历`.（即逐层地，从左到右访问所有节点）.


#### 示例1

![](/assets/images/20220704BinaryTreeLevelOrder/1.webp)

``` sh 
输入：root = [3,9,20,null,null,15,7]
输出：[[3],[9,20],[15,7]]

```

#### 示例2

``` sh 
输入：root = [1]
输出：[[1]]
```

#### 示例3

``` sh 
输入：root = []
输出：[]
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


[102. 二叉树的层序遍历](https://leetcode.cn/problems/binary-tree-level-order-traversal/)  
[引用自codetop](https://codetop.cc/home)
