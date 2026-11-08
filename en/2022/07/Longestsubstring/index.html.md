---
layout: post
title: Longest Substring Without Repeating Characters
date: 2022-07-01 13:21 +0800
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

Given a string `s`, find the length of the longest substring without repeating characters.

#### Example 1

``` sh
输入: s = "abcabcbb"
输出: 3 
解释: 因为无重复字符的最长子串是 "abc"，所以其长度为 3。
```

#### Example 2

``` sh
输入: s = "bbbbb"
输出: 1
解释: 因为无重复字符的最长子串是 "b"，所以其长度为 1。
```

#### Example 3

``` sh
输入: s = "pwwkew"
输出: 3
解释: 因为无重复字符的最长子串是 "wke"，所以其长度为 3。
     请注意，你的答案必须是 子串 的长度，"pwke" 是一个子序列，不是子串。

```

## Answer

``` c++
class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_set<char> charSets;//哈希集合，记录每个字符是否出现过
        int n = s.size();
        int rk = -1, ans = 0;//右指针，初始值为 -1，相当于我们在字符串的左边界的左侧，还没有开始移动
        for (int i = 0; i < n; ++i) {//枚举左指针的位置，初始值隐性地表示为 -1
            if (i != 0) {
                charSets.erase(s[i-1]);// 左指针向右移动一格，移除一个字符
            }
            while (rk + 1 < n && !charSets.count(s[rk +1 ])) {
                charSets.insert(s[rk + 1]);// 不断地移动右指针
                ++rk;
            }
            ans = max(ans, rk - i + 1);// 第 i 到 rk 个字符是一个极长的无重复字符子串
        }
        return ans;
    }
};
```



[3. Longest Substring Without Repeating Characters](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)  
[Quoted from codetop](https://codetop.cc/home)
