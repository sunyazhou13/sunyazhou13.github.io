---
layout: post
title: Longest Palindromic Substring
date: 2022-07-04 17:41 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---

![algorithm](/assets/images/20220701ReverseList/algorithm.avif)

# Preface

This post carries a strong personal tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only for my personal learning notes. You're welcome to repost or share it within the scope of the license, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# The Problem

Given a string `s`, find the longest palindromic substring in `s`.

#### Example 1

``` sh 
输入：s = "babad"
输出："bab"
解释："aba" 同样是符合题意的答案。
```

#### Example 2

``` sh 
输入：s = "cbbd"
输出："bb"
```

## Implementation

``` c++
// Center expansion algorithm
class Solution {
public:
    pair<int, int> expandAroundCenter(const string& s, int left, int right) {
        while (left >= 0 && right < s.size() && s[left] == s[right]) {
            --left;
            ++right;
        }
        return {left + 1, right - 1};
    }

    string longestPalindrome(string s) {
        int start = 0, end = 0;
        for (int i = 0; i < s.size(); ++i) {
            auto [left1, right1] = expandAroundCenter(s, i, i);
            auto [left2, right2] = expandAroundCenter(s, i, i + 1);
            if (right1 - left1 > end - start) {
                start = left1;
                end = right1;
            }
            if (right2 - left2 > end - start) {
                start = left2;
                end = right2;
            }
        }
        return s.substr(start, end - start + 1);
    }
};
```


[5. Longest Palindromic Substring](https://leetcode.cn/problems/longest-palindromic-substring/)  
[Referenced from CodeTop](https://codetop.cc/home)
