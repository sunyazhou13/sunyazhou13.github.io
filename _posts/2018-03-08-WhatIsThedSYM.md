---
title: 什么是符号表?
categories: [ios开发]
tags: [ios, macos]
date: 2018-03-08 11:14:12
---

![](/assets/images/20180308WhatIsThedSYM/homePageLog.jpeg)

# 前言

iOS 开发中经常回定位 bug 通过崩溃堆栈,此时我们需要借助符号表来恢复内存地址对应代码调用信息,为了解开这个大家耳熟能详却总有人问的问题的面纱,我在 bugle 平台和一些文章中收集了相关知识整理出来,以便后续方便记忆.


## 本周主要内容如下

* 什么是符号表？
* 为什么要配置符号表？
* dSYM文件？



### 什么是符号表？

符号表是内存地址与函数名、文件名、行号的映射表。符号表元素如下所示：

`<起始地址>` `<结束地址>` `<函数>` [`<文件名>`:`<行号>`]  


### 为什么要配置符号表？

为了能快速并准确地定位用户APP发生`Crash`的代码`位置`，我们可以使用符号表对APP发生`Crash`的程序`堆栈`进行`解析`和`还原`。

举一个例子：

![](/assets/images/20180308WhatIsThedSYM/stackSymbol.png)


上图是我们通过符号表来解析出来崩溃堆栈的调用



### 什么是dSYM文件？

iOS平台中，`dSYM`文件是指具有调试信息的目标文件，文件名通常为： `com.公司名.dSYM`。如下图所示：

![](/assets/images/20180308WhatIsThedSYM/testdSYM.png)

一般都是和Xcode 工程名的 aget一样的名字

> 为了方便找回Crash对应的dSYM文件和还原堆栈，建议每次构建或者发布APP版本的时候，备份好dSYM文件



#### 如何定位dSYM文件？

一般情况下，项目编译完`dSYM`文件跟`app`文件在同一个目录下，下面以`XCode`作为IDE详细说明定位`dSYM`文件

![](/assets/images/20180308WhatIsThedSYM/dSYM1.png)

![](/assets/images/20180308WhatIsThedSYM/dSYM2.png)


> 这里用 release 模式做的测试 

我们看到 和工程 `target`一样的名称的 `.dSYM`.


#### XCode编译后没有生成dSYM文件?

XCode在 `Release`编译环境下默认会生成`dSYM`文件，而`Debug`编译环境下默认不会生成

如果要在`Debug`对应的`Xcode`配置如下:

`XCode -> Build Settings -> Code Generation -> Generate Debug Symbols -> Yes`  
`XCode -> Build Settings -> Build Option -> Debug Information Format -> DWARF with dSYM File`

![](/assets/images/20180308WhatIsThedSYM/dSYM3.png)  
![](/assets/images/20180308WhatIsThedSYM/dSYM4.png)

#### 开启Bitcode之后需要注意哪些问题?

* 在点`Upload to App Store`上传到`App Store`服务器的时候需要声明符号文件(`dSYM`文件)的生成:

![](/assets/images/20180308WhatIsThedSYM/dSYM5.jpg)

* 在配置符号表文件之前，需要从App Store中把该版本对应的dSYM文件下载回本地,然后用符号表工具生成和上传符号表文件。

这里找回`ipa`版本对应的dSYM文件有两种方式

1. 通过Xcode的归档文件找回dSYM,打开`Xcode` 顶部菜单栏 -> `Window` -> `Organizer` 窗口,如下图:
	![](/assets/images/20180308WhatIsThedSYM/BitcodedSYM2.jpg)  
	打开 `Xcode` 顶部菜单栏，选择`Archive` 标签:   
	![](/assets/images/20180308WhatIsThedSYM/BitcodedSYM3.jpg)  
	找到发布的归档包，右键点击对应归档包，选择`Show in Finder`操作:  
	![](/assets/images/20180308WhatIsThedSYM/BitcodedSYM4.jpg)
	右键选择定位到的归档文件，选择显示包内容操作:  
	![](/assets/images/20180308WhatIsThedSYM/BitcodedSYM5.jpg)  
	选择`dSYMs`目录，目录内即为下载到的 `dSYM` 文件:  
	![](/assets/images/20180308WhatIsThedSYM/BitcodedSYM6.jpg)
	
2. 通过[iTunes Connect](https://itunesconnect.apple.com/)找回
	
	![](/assets/images/20180308WhatIsThedSYM/itunesConnect.png)
	
	在“所有构件版本（All Builds）”中选择某一个版本，点“下载`dSYM`（Download dSYM）”下载dSYM文件.
	
	

> 注意:_一个`Archiver`与`dSYM`文件一一对应,搞错了容易翻译不出来来源码的调用_


参考如下:

[Bugly iOS 符号表配置](https://bugly.qq.com/docs/user-guide/symbol-configuration-ios/?v=1520478187041#dsym_1)  
[App 启动时间：过去，现在和未来](https://techblog.toutiao.com/2017/07/05/session413/)


全文完
  
