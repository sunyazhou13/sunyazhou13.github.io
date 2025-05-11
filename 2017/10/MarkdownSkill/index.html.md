---
layout: post
title: markdown嵌入折叠标签
date: 2017-10-25 16:10:35
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
---


# 前言

> 这几天一直在开十九大,导致我的梯子翻墙不好使了,就在此时[喵神发表了一篇博文 关于 Swift Error 的分类](https://onevcat.com/2017/10/swift-error-category/)  

每次看喵神的文章就像诸葛亮跟周瑜聊天一样如饮美酒,我不能自比诸葛孔明和周公瑾.

当我仔细看喵神博客的时候发现 原来`markdown`支持很多`html`标签的小技巧


比如:

![喵神文章中的](/assets/images/20171025MarkdownSkill/MarkdownSkill.gif)


第一眼我震撼了 原来 markdown 里面还能嵌入这么多好玩的 就这个问题 问了一下喵神


![与喵神对话](/assets/images/20171025MarkdownSkill/MarkdownQuestion.webp)


[简单的 summary tag 而已..](https://www.w3schools.com/tags/tag_summary.asp)

于是我测试了一下代码


``` html
<details>
  <summary>点击时的区域标题</summary>
  <p> - 测试 测试测试</p>
  <p> 测试二 测试三 。。。。。 .</p>
</details>
```


下面我们来玩一下试试


<details>
  <summary>这是孙先生的博客 点击查看更多内容.</summary>
  <p> 666666 昨天程序员节 是不是被 PM 虐了 QA 提个很多 bug 不想 fix.</p>
  <p> 昨天一不小心驾照考下来了 耗时2个月 快不快。。。。.</p>
</details>


还可以嵌入图片

<details>
  <summary>书法</summary>
  <p><img src="/assets/images/aboutme/about_read_books.webp" alt=""> </p>
  <p> </p>
</details>


``` html
<details>
  <summary>书法</summary>
  <p><img src="/assets/images/aboutme/about_read_books.webp" alt=""> </p>
  <p> </p>
</details>
```

OK 上边就是我们用到的几行代码 很简单直接嵌入 markdown 编辑器里面就马上出效果

感谢[喵神的指导](https://onevcat.com/)

更多标签相关 可参考[w3schools](https://www.w3schools.com/tags/tag_summary.asp)

markdown如何改字体颜色, 如下代码:


<font color=#0099ff size=12 face="黑体">黑体带颜色</font> 

``` html
<font color=#0099ff size=12 face="黑体">黑体带颜色</font>  
``` 

20201012更新 



全文完 