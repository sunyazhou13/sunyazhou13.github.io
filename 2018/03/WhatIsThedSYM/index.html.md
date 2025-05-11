---
layout: post
title: 什么是符号表?
date: 2018-03-08 11:14:12
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
---

![](/assets/images/20180308WhatIsThedSYM/homePageLog.webp)

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

![](/assets/images/20180308WhatIsThedSYM/stackSymbol.webp)


上图是我们通过符号表来解析出来崩溃堆栈的调用



### 什么是dSYM文件？

iOS平台中，`dSYM`文件是指具有调试信息的目标文件，文件名通常为： `com.公司名.dSYM`。如下图所示：

![](/assets/images/20180308WhatIsThedSYM/testdSYM.webp)

一般都是和Xcode 工程名的 aget一样的名字

> 为了方便找回Crash对应的dSYM文件和还原堆栈，建议每次构建或者发布APP版本的时候，备份好dSYM文件



#### 如何定位dSYM文件？

一般情况下，项目编译完`dSYM`文件跟`app`文件在同一个目录下，下面以`XCode`作为IDE详细说明定位`dSYM`文件

![](/assets/images/20180308WhatIsThedSYM/dSYM1.webp)

![](/assets/images/20180308WhatIsThedSYM/dSYM2.webp)


> 这里用 release 模式做的测试 

我们看到 和工程 `target`一样的名称的 `.dSYM`.


#### XCode编译后没有生成dSYM文件?

XCode在 `Release`编译环境下默认会生成`dSYM`文件，而`Debug`编译环境下默认不会生成

如果要在`Debug`对应的`Xcode`配置如下:

`XCode -> Build Settings -> Code Generation -> Generate Debug Symbols -> Yes`  
`XCode -> Build Settings -> Build Option -> Debug Information Format -> DWARF with dSYM File`

![](/assets/images/20180308WhatIsThedSYM/dSYM3.webp)  
![](/assets/images/20180308WhatIsThedSYM/dSYM4.webp)

#### 开启Bitcode之后需要注意哪些问题?

* 在点`Upload to App Store`上传到`App Store`服务器的时候需要声明符号文件(`dSYM`文件)的生成:

![](/assets/images/20180308WhatIsThedSYM/dSYM5.webp)

* 在配置符号表文件之前，需要从App Store中把该版本对应的dSYM文件下载回本地,然后用符号表工具生成和上传符号表文件。

这里找回`ipa`版本对应的dSYM文件有两种方式

1. 通过Xcode的归档文件找回dSYM,打开`Xcode` 顶部菜单栏 -> `Window` -> `Organizer` 窗口,如下图:
	![](/assets/images/20180308WhatIsThedSYM/BitcodedSYM2.webp)  
	打开 `Xcode` 顶部菜单栏，选择`Archive` 标签:   
	![](/assets/images/20180308WhatIsThedSYM/BitcodedSYM3.webp)  
	找到发布的归档包，右键点击对应归档包，选择`Show in Finder`操作:  
	![](/assets/images/20180308WhatIsThedSYM/BitcodedSYM4.webp)
	右键选择定位到的归档文件，选择显示包内容操作:  
	![](/assets/images/20180308WhatIsThedSYM/BitcodedSYM5.webp)  
	选择`dSYMs`目录，目录内即为下载到的 `dSYM` 文件:  
	![](/assets/images/20180308WhatIsThedSYM/BitcodedSYM6.webp)
	
2. 通过[iTunes Connect](https://itunesconnect.apple.com/)找回
	
	![](/assets/images/20180308WhatIsThedSYM/itunesConnect.webp)
	
	在“所有构件版本（All Builds）”中选择某一个版本，点“下载`dSYM`（Download dSYM）”下载dSYM文件.
	
	

> 注意:_一个`Archiver`与`dSYM`文件一一对应,搞错了容易翻译不出来来源码的调用_

## 还原符号命令 2024年04月03日更新

``` sh
atos -o KWPlayer.app.dSYM/Contents/Resources/DWARF/KWPlayer -arch arm64 -l 0x102100000 0x10720df70 0x10720a5ac 0x10720e13c 0x107211aa0 0x107215574 0x107211aa0 0x10720770c 0x10720772c 0x10720f6ec 0x10720f9e8 0x107208df0 0x1072039b8
```
输出如下:

``` objc
-[LOTLayerContainer display] (in KWPlayer) (LOTLayerContainer.m:385)
-[LOTCompositionContainer displayWithFloatFrame:forceUpdate:] (in KWPlayer) (LOTCompositionContainer.m:107)
-[LOTLayerContainer displayWithFloatFrame:forceUpdate:] (in KWPlayer) (LOTLayerContainer.m:411)
-[LOTRenderGroup updateWithFrame:withModifierBlock:forceLocalUpdate:] (in KWPlayer) (LOTRenderGroup.m:142)
-[LOTTrimPathNode updateWithFrame:withModifierBlock:forceLocalUpdate:] (in KWPlayer) (LOTTrimPathNode.m:62)
-[LOTRenderGroup updateWithFrame:withModifierBlock:forceLocalUpdate:] (in KWPlayer) (LOTRenderGroup.m:142)
-[LOTAnimatorNode updateWithFrame:withModifierBlock:forceLocalUpdate:] (in KWPlayer) (LOTAnimatorNode.m:51)
-[LOTAnimatorNode updateWithFrame:withModifierBlock:forceLocalUpdate:] (in KWPlayer) (LOTAnimatorNode.m:54)
-[LOTPathAnimator performLocalUpdate] (in KWPlayer) (LOTPathAnimator.m:36)
-[LOTPathInterpolator pathForFrame:cacheLengths:] (in KWPlayer) (LOTPathInterpolator.m:0)
-[LOTBezierPath LOT_addCurveToPoint:controlPoint1:controlPoint2:] (in KWPlayer) (LOTBezierPath.m:167)
LOT_PointInCubicCurve (in KWPlayer) (CGGeometry+LOTAdditions.m:366)
```

`-l` 命令后可以接多个地址 可以用 `,`逗号和 空格隔开

原始文件如下

``` sh
Heaviest stack for the target process:
  5  ??? (dyld + 24012) [0x1be4d6dcc]
  5  ??? (KWPlayer + 108397220) [0x1088602a4]
  5  ??? (UIKitCore + 2276456) [0x19dbc0c68]
  5  ??? (UIKitCore + 2278956) [0x19dbc162c]
  5  ??? (GraphicsServices + 13560) [0x1ded1e4f8]
  5  ??? (CoreFoundation + 210040) [0x19b79d478]
  3  ??? (CoreFoundation + 211096) [0x19b79d898]
  3  ??? (CoreFoundation + 215900) [0x19b79eb5c]
  3  ??? (CoreFoundation + 222120) [0x19b7a03a8]
  3  ??? (CoreFoundation + 225580) [0x19b7a112c]
  3  ??? (UIKitCore + 696208) [0x19da3ef90]
  3  ??? (UIKitCore + 696020) [0x19da3eed4]
  3  ??? (UIKitCore + 698340) [0x19da3f7e4]
  3  ??? (UIKitCore + 699596) [0x19da3fccc]
  3  ??? (QuartzCore + 416484) [0x19cddbae4]
  3  ??? (QuartzCore + 417340) [0x19cddbe3c]
  2  ??? (QuartzCore + 445280) [0x19cde2b60]
  2  ??? (QuartzCore + 419644) [0x19cddc73c]
  1  ??? (KWPlayer + 84991856) [0x10720df70]
  1  ??? (KWPlayer + 84977068) [0x10720a5ac]
  1  ??? (KWPlayer + 84992316) [0x10720e13c]
  1  ??? (KWPlayer + 85007008) [0x107211aa0]
  1  ??? (KWPlayer + 85022068) [0x107215574]
  1  ??? (KWPlayer + 85007008) [0x107211aa0]
  1  ??? (KWPlayer + 84965132) [0x10720770c]
  1  ??? (KWPlayer + 84965164) [0x10720772c]
  1  ??? (KWPlayer + 84997868) [0x10720f6ec]
  1  ??? (KWPlayer + 84998632) [0x10720f9e8]
  1  ??? (KWPlayer + 84970992) [0x107208df0]
  1  ??? (KWPlayer + 84949432) [0x1072039b8]

```

参考如下:

[Bugly iOS 符号表配置](https://bugly.qq.com/docs/user-guide/symbol-configuration-ios/?v=1520478187041#dsym_1)  
[App 启动时间：过去，现在和未来](https://techblog.toutiao.com/2017/07/05/session413/)


全文完
  
