---
layout: post
title: 二叉树的最近公共祖先
date: 2022-07-04 17:12 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---


![](/assets/images/20220701ReverseList/algorithm.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 如题

给定一个二叉树, 找到该树中两个指定节点的最近公共祖先。

[百度百科](https://baike.baidu.com/item/%E6%9C%80%E8%BF%91%E5%85%AC%E5%85%B1%E7%A5%96%E5%85%88/8918834?fr=aladdin)中最近公共祖先的定义为：“对于有根树 T 的两个节点 p、q，最近公共祖先表示为一个节点 x，满足 x 是 p、q 的祖先且 x 的深度尽可能大（`一个节点也可以是它自己的祖先`）。”

#### 示例1

![](/assets/images/20220704CommonAncestor/1.webp)

``` sh 
输入：root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1
输出：3
解释：节点 5 和节点 1 的最近公共祖先是节点 3 。

```

#### 示例2

![](/assets/images/20220704CommonAncestor/2.webp)

``` sh 
输入：root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4
输出：5
解释：节点 5 和节点 4 的最近公共祖先是节点 5 。因为根据定义最近公共祖先节点可以为节点本身。

```

#### 示例3

``` sh 
输入：root = [1,2], p = 1, q = 2
输出：1
```

## 实现代码

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


[236. 二叉树的最近公共祖先](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/)  
[引用自codetop](https://codetop.cc/home)

