---
layout: post
title: "Development Branch Management Model"
date: 2022-04-14 08:50:00.000000000 +08:00
categories: [iOS, Swift]
tags: [Swift, AVFoundation, Git]
typora-root-url: ..
math: false
mermaid: false

---

![git](/assets/images/20220414BranchManage/git.avif)

# Preface

This article carries strong personal sentiment. If it makes you uncomfortable, please close it as soon as possible. This article is only for personal study records. Reprinting or sharing within the scope of the license is also welcome. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

## A Branch Management Model Suitable for Client Development

![Branch Guide](/assets/images/20220414BranchManage/BranchGuide.avif)

First, `DEV` represents the development branch  
First, `RB` represents the release branch

> Note: this naming and approach borrow from the internal branch management previously used at Kuaishou.

When development is complete and the build is submitted for testing, the next version's RB and DEV branches are automatically created. This cycle repeats, enabling iterative management.

### Questions People Care About

#### How to handle RB code changes that DEV wants to use?

After the RB branch is modified, how do you sync it to the DEV branch? Under normal development, given code review, you can raise a Merge Request from RB to DEV. e.g., `RB1.6.0` Merge to `DEV1.6.1`.

If it's just a few simple commits, I suggest manually executing `git cherry-pick commitIDXXX` to bring the RB commits to the DEV branch. (That is, you need to switch to the DEVxxx branch, then run `git cherry-pick commitIDXXX`.)

#### How to handle the RB branch after release?

In theory, after release, 2 things need to be done:

1. Merge into `master` and then tag.
2. Delete the `RBxxx` branch.

> If after the above operations, DEV wants to use the RB changes but the RB branch has been deleted, you can directly merge code from master to DEV.

#### What is the purpose of the RB branch?

1. Only accepts bug fixes
2. Doesn't accept feature development; can't merge from DEV

> Note: RB cannot merge DEV; only DEV can merge into RB!  
> Note: RB cannot merge DEV; only DEV can merge into RB!  
> Note: RB cannot merge DEV; only DEV can merge into RB!  

## Summary

Every team has its own way of managing branches. No approach is inherently better than another; it's only about which management style fits better.

--
This article was written by  
sunyazhou   
[CN] sunyazhou.com   
This material is protected by copyright

