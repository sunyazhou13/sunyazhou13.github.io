---
layout: post
title: 二叉树的锯齿形层序遍历
date: 2022-07-04 14:19 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---


![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给你二叉树的根节点`root`，返回其节点值的`锯齿形层序遍历`。（即先从左往右，再从右往左进行下一层遍历，以此类推，层与层之间交替进行）。


#### 示例1

![](/assets/images/20220704ZigzagLeveOrder/1.webp)

``` sh 
输入：root = [3,9,20,null,null,15,7]
输出：[[3],[20,9],[15,7]]
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


[103. 二叉树的锯齿形层序遍历](https://leetcode.cn/problems/binary-tree-zigzag-level-order-traversal/)  
[引用自codetop](https://codetop.cc/home)
