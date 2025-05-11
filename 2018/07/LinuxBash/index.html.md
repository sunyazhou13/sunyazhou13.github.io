---
layout: post
title: Linux 终端 Bash 常用快捷键介绍及经验
date: 2018-07-18 09:29:39
categories: [Linux]
tags: [系统理论实践, macOS, skills]
typora-root-url: ..
---

![](/assets/images/20180718LinuxBash/20130520LinuxLogoOnCentos5.webp)


# bash及其特性

* [bash](http://cn.linux.vbird.org/linux_basic/0320bash.php)实质上是一个可执行程序，一个用户的工作环境。
* 在每一个shell下可以再打开一个shell，新打开的shell可以称为子shell，每一个shell之间是相互独立的。
* 可以使用pstree命令查看当前shell下的子shell个数。

### 1. 最重要的自动补全

| 命令 | 解释 |
| ----- | ----- |
| Tab | 自动补全 |

### 2. 编辑跳转

| 命令	| 解释 |
| ----- | ----- |
| Ctrl + A | 跳转到当前行首 |
|Ctrl + E | 跳转到当前行末 |
|Alt + F | 将光标在当前行上向后移动一个单词 |
|Alt + B | 将光标在当前行上向前移动一个单词 |
|Ctrl + W	| 删除当前光标前的一个单词 |
|Ctrl + K	| 删除当前光标后的内容 |
|Ctrl + U | 清除整行 |
|Ctrl + L	| 清屏，类似于 clear 命令 |
|Ctrl + H	| 退格，类似于 backspace 键 |
|Ctrl + T	| 将当前光标前的两个字符互换位置 |
|Esc + T	| 将当前光标前的两个单词互换位置 |

`Ctrl + W` 和 `Ctrl + U` 相当常用。拼写错是很常见的事。

`Ctrl + L` 也不用多说。

### 3. 进程相关

| 命令	| 解释 |
| ----- | ----- |
| Ctrl + C | 终止当前进程 |
| Ctrl + Z | 将当前进程在后台挂起
| Ctrl + D | 退出当前 Shell，类似于 exit 命令 | 


`Ctrl + C` 是向当前运行的进程发送 SIGINT 信号，终止进程。

> SIGINT - This signal is the same as pressing ctrl-c. On some systems, "delete" + "break" sends the same signal to the process. The process is interrupted and stopped. However, the process can ignore this signal.


`Ctrl + Z` 并不结束进程，而是挂起在后台。之后仍然可以通过 `fg`命令恢复。对应的信号是 SIGTSTP。

### 3. 搜索使用过的命令（特别推荐）

| 命令	| 解释 |
| ----- | ----- |
| Ctrl + R | 用于搜索之前使用过的命令 |

我经常用 `history` 查看历史命令，其实已经有现成的快捷键可以用。

按下 `Ctrl + R` 之后，输入查询的关键字，如果不符合，可以继续按 `Ctrl + R` 进行遍历。

这个命令其实也是通过 `history` 记录来查询的。如果不喜欢这种方式，可以直接 `history | grep xxx` 也是不错的。


[参考 Linux公社](https://www.linuxidc.com/Linux/2017-11/148262.htm)



# 总结

这些命令对工作效率提升很显著,需要反复学习牢记,文章最后推荐大家关注`Linux公社`这个具有历史人文精神的Linux社区, 它让我学到不少东西.



