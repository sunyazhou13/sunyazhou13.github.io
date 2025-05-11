---
layout: post
title: 简单了解LLDB调试工具chisel
date: 2019-12-06 11:09:25
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, skills]
typora-root-url: ..
---

![](/assets/images/20191206Chisel/lldb1.webp)


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


最近比较懒 Xcdeo每次启动的时候都会报一个找不到某某python文件的log在lldb中,为了一探究竟,花了点时间简单修复了


# chisel是啥？

这个问题我要是回答完都会被iOS开发者笑话死,这个工具facebook都开源很久了,只是自己以前研究过,换个电脑懒得布置环境.一直没当回事,这几天开发遇到了控制台问题顺手看到了,想来整理一下.


首先这个工具的的地址在[https://github.com/facebook/chisel](https://github.com/facebook/chisel)


这里面提供的安装方法如下:

``` sh
brew update
brew install chisel
```

> 通过 brew 安装完就行了

然后它会告诉你看下用户home目录有个隐藏文件 `.lldbinit`如果没有就创建一下

``` sh
touch .lldbinit 
open .lldbinit   

```

![](/assets/images/20191206Chisel/lldbinit.webp)

创建完 把脚本命令搞进去  这里我就不说官方的写法了 跟屎一样一点不好使


我贴一下我的添加方法.

![](/assets/images/20191206Chisel/lldb2.webp)

这是我用本地电脑安装完成之后的路径图

``` sh
### Chisel LLDB add by sunyazhou
command script import /usr/local/Cellar/chisel/1.8.1/libexec/fblldb.py

```

本地的 .lldbinit 文件中加入上代码 记得必须对应上路径.然后重启Xcode运行即可在控制台使用无问题

由于这个文件会被Reveal改动 所以经常会有各种lldb工具修改这个文件

``` sh
### Chisel LLDB add by sunyazhou
command script import /usr/local/Cellar/chisel/1.8.1/libexec/fblldb.py
###

### LLDB https://github.com/DerekSelander/LLDB
command script import /Users/sunyazhou/LLDB-master/lldb_commands/dslldb.py
###

### Reveal LLDB commands support - DO NOT MODIFY
command script import /Users/sunyazhou/Library/Application\ Support/Reveal/RevealServerCommands.py
### 

```



## chisel用法


* `pvc`：查看当前控制器状态   
* `pviews`：查看UIWindow及其子视图层级关系  
* `presponder`：打印一个对象的响应链关系  
* `pclass`:根据内存地址打印相关信息  
* `visualize`：使用mac系统preview程序查看UIImage、CGImage、UIView、CALayer、NSData(of an UIImage)、UIColor、CIColor。  
* `show`/`hide`：显示or隐藏一个UIView  
* `mask`/`umask`：给一个UIView或CALayer添加一个半透明蒙版  
* `border`/`unborder`：给指定的UIView或CALayer添加边框或移除边框用于调试，记得执行后紧接着执行caflush   
* `caflush`：刷新界面UI，类似于前面介绍的flush  
* `bmessage`：添加一个断点，即使这个函数在子类没有实现（比如说在UIViewController中想在viewWillAppear中打断点，但是很可能没有实现父类方法，就可以通过bmessage [UIViewController viewWillAppear:]添加）  
* `wivar`：相当于kvo，监听一个变量，例如wivar self _subviews  
* `taplog`：开启点击log功能，当点击某个控件时会打印相关控件的信息  
* `paltrace`： 打印指定view的自动布局信息,比如:paltrace self.view  
* `ptv`：打印当前界面中的UITableView，相对应的还有pcells打印当前界面中的UITableViewCell
* `pdata`：Data的string解码
* `vs`：搜索指定的view并加上半透明蒙版（包含子命令），例如：vs 0x13a9efe00 就可以标注出对应的控件
* `slowanim`/`unslowanim`：降低(或取消)动画速度,默认0.1 ，可以在任意断点或Xcode暂定执行slowanim即可，方便动画调试  



演示效果

![](/assets/images/20191206Chisel/lldb3_chisel.webp)

##  其它调试lldb有哪些？

[lldb_commands](https://github.com/DerekSelander/LLDB) 是另一个第三方的lldb扩展库，其中提供了很多实用的文件操作

`ls`：显示指定路径的目录或文件列表
`pexecutable`：打印当前可执行文件所在位置
`dumpenv`：查看环境信息，比如说沙盒地址
`yoink`：拷贝指定目录的文件到mac的临时目录
`keychain`：查看keychain信息


# 总结

工欲善其事 必先利其器,作为一个iOS开发如果想做到极致就需要我们好的工具都需要试试,这样能不断提高生产效率


[参考 iOS开发调试概览](https://www.cnblogs.com/kenshincui/p/11953536.html)