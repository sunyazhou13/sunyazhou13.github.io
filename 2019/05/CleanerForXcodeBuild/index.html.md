---
layout: post
title: Cleaner For Xcode编译
date: 2019-05-17 16:37:43
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..
---

![](/assets/images/20190517CleanerForXcodeBuild/CleanerForXcode.webp)

# 前言

最近公司给配发一个最新版的macbook pro, 然后经过一顿折腾以后发现原来的软件 无法 迁移过来或者迁移起来比较费劲.于是就有了这篇文章.


## 背景

由于mac磁盘空间有限,不得不借助一些第三方软件清理磁盘,尤其对于一个iOS开发者来说,固态硬盘128G的mac我只能说公司太抠了,就是能安装个Xcode干活,其余的我觉得我的256G的iPhone X足够应付了


Xcode是占用mac空间最大的app,无论从内存、磁盘io、系统资源 全部都能排第一.因为平时都用真机运行所以Xcode自带的模拟器也排不上用场还占用了一些磁盘空间,几年前有封面的这个软件叫Cleaner For Xcode.

是个开源的并且用React Native写的,我觉得很好用,不过这个开发者不够厚道,在mac的 app store 标价 $0.99。


真的我说这个作者你真不够厚道你都open source 了为啥不打个 release包 广大 mac上的小伙伴用呢.于是 今天有点时间 我配上RN环境 誓死编译出一个app**免费**给大家使用.


## 过程 

话说我真不想装RN  太浪费磁盘空间 还浪费时间,迫不得已 经过一番折腾 遇到好多坑 


#### 填坑经历

0.45以上的RN 需要  boost 库,这个库 翻墙都很费劲 下载。。。Done.

又要安装  yarn、node、npm、看门狗 watchdag。。。 Done.

编辑错误, Xcode10.12.1 目前最新版 各种编译选项 静态分析 Done.



大概过了 30分钟 终于 折腾 出一个app


# 总结


[链接https://pan.baidu.com/s/1BClEjWLHS3htvKXoM11UjQ](https://pan.baidu.com/s/1BClEjWLHS3htvKXoM11UjQ) 提取码: `uhns`


各位拿去不用客气


其实就是了解删除 Xcode每个目录都存储什么缓存 没事删除一下 搞个好看的UI.作者 是有点蛋疼 这么简单的功能 一个shell或者objc几行代码搞定 非要大动干戈用RN. 然后还很不厚道的开源,这种开发者真是蛋疼.




