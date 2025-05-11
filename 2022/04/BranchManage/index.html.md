---
layout: post
title: "开发分支管理模型"
date: 2022-04-14 08:50:00.000000000 +08:00
categories: [iOS, Swift]
tags: [Swift, AVFoundation, Git]
typora-root-url: ..

---

![](/assets/images/20220414BranchManage/git.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 一种适合客户端开发的分支管理模型

![](/assets/images/20220414BranchManage/BranchGuide.webp)

首先`DEV`代表开发分支  
首先`RB`代表发版分支

> 注意此名称和思路借鉴之前快手开发的内部分支管理.

当开发完成提测后自动开出下个版本的RB和DEV分支.这样循环往复.实现迭代的管理

### 大家关心的问题

#### RB的代码修改如果DEV想用如何处理？

RB分支修改后和如何同步给DEV分支,如果常规开发的话在代码Review的前提下.可以从RB 提Merge Reuqest到DEV. eg: `RB1.6.0` Merge to `DEV1.6.1`.

如果只是几个简单的commit 的话 我建议RB上的提交自己手动执行`git  cherry-pick commitIDXXX`的形式到DEV分支.(也就是说你要切到DEVxxx分支 然后执行 `git  cherry-pick commitIDXXX`)

#### 发布完成后 RB分支如何处理

理论上发布完成后需要做2件事

1. 合并到`master`后 并打`tag`.
2. 删除`RBxxx`分支 

> 如果上述操作完成后,RB的修改如果dev想用但是RB分支被删除了的话可以直接从master merge代码到DEV.

#### RB分支的 目的是？

1. 只接受bug的修改
2. 不接受需求开发,不能 合并DEV

> 注意: RB不能合并DEV,只能DEV Merge RB!  
> 注意: RB不能合并DEV,只能DEV Merge RB!  
> 注意: RB不能合并DEV,只能DEV Merge RB!  

## 总结

分支管理各家都有自己的管理方式,没有谁比谁更好,只有那些管理方式更适合.

--
本文撰写自  
[sunyazhou](https://https://www.sunyazhou.com/)   
[中] sunyazhou.com   
此材料受版权保护



