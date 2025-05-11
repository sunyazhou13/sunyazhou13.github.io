---
layout: post
title: 解决如何从鸿蒙手机传文件到macOS
date: 2024-01-16 09:49 +0800
categories: [ArkUI, HarmonyOS]
tags: [鸿蒙OS开发, HarmonyOS]
typora-root-url: ..
---  

![](/assets/images/20240116HarmonyPhoneSendFileTomacOS/harmonyOS.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 问题描述

最近学习中遇到了一个问题,用mac电脑开发鸿蒙, 公司内部的测试机是HUAWEI Mate 60 Pro, 安装的是HarmonyOS NEXT Developer Preview. 

对于一个新式手机需要和它进行内部文件互传成了痛点,最近开发总需要从手机录屏中获取mp4视频文件和截图,因为鸿蒙是完全脱离了Android, 找了一些手机助手根本识别不到此手机,包括官方推荐使用的[HiSuite华为手机助手](https://consumer.huawei.com/cn/support/hisuite/)

![](/assets/images/20240116HarmonyPhoneSendFileTomacOS/HiSuite.webp)

鸿蒙系统并不想苹果电脑, 一套通用的AirDrop可以 自由传输于 自家生态下的大部分设备,鸿蒙目前的阶段还实现不了,鸿蒙的AirDrop叫 `华为共享`, 也需要华为生态体系下的设备才能共享文件无缝传输,但是macOS显然不是华为生态下的产品,那怎么解决此问题呢?

## 使用android传统的hdc方式

#### hdc

hdc（HarmonyOS Device Connector）是HarmonyOS为开发人员提供的用于调试的命令行工具，通过该工具可以在windows/linux/mac系统上与真实设备进行交互。

> [hdc官方文档](https://developer.harmonyos.com/cn/docs/documentation/doc-guides-V2/ide-command-line-hdc-0000001237908229-V2#section116322265308)

#### 准备工作

通过usb数据线连接到mac电脑,
下面是我电脑的配置
![](/assets/images/20240116HarmonyPhoneSendFileTomacOS/systeminfo.webp)

然后安装hdc环境到电脑上,上述文档都有说明这里不再赘述,假设你成功安装并运行.

输入`hdc -v`

``` sh
Ver: 1.2.0a
```

#### 开始连接设备 传文件


查看端口所有设备

``` sh
输入:  hdc list targets -v

start server at tcp:7035
FMR0223823025245		USB	Connected	localhost	hd
```

然后 挂载设备  

``` sh
输入：hdc target mount

Mount finish
```
授予设备端hdc后台服务进程root权限

``` sh
hdc smode
```

连接设备时，若仅有一台，无需指定设备标识。若有多台，一次仅能连接一台，每次连接时需要指定连接设备的标识，命令格式如下

``` sh
hdc -t FMR0223823025245 shell
```
然后输出如下

``` sh
#  
```
> 这样就进入了交互式终端开始使用shell通讯了.

接下来我们找到我们要copy的文件目录,如果找不到使用如下命令查看文件大小的方式

``` sh
du -sh *
```

鸿蒙 的文件目录 比如 相册 是存在于`/storage/media/100/local/files/Photo`目录下.

如果不对基本都大同小异.

我们先查看一下我们要从手机 copy到电脑的文件使用  `du -sh *`命令看看大小

``` sh
# du -sh *
3.5K	1
3.5K	16
13M	2
1.5M	3
1.7M	4
```
 
 数字是文件目录的名称,我们 找到相关目录文件 后使用pwd打印一下当前工作目录,拼接上想要copy的文件即可实现copy.
 
 假设我们获取的文件绝对路径是`/storage/media/100/local/files/Photo/4/VID_1705287805_004.mp4`
 
这时候我们新开一个终端.并输入如下命令.(参考文档可以找到更多关于文件操作的指令)

``` sh
hdc file recv /storage/media/100/local/files/Photo/4/VID_1705287805_004.mp4 ~/Downloads/
```

输出

``` sh
[I][2024-01-16 11:11:29] HdcFile::TransferSummary success
FileTransfer finish, Size:1823388, File count = 1, time:140ms rate:13024.20kB/s
```

![](/assets/images/20240116HarmonyPhoneSendFileTomacOS/file.webp)

通过上述操作我们就从华为的鸿蒙手机中把相应的文件传到了我们的macOS上了


## 其它操作

比如把文件 从macOS上传到鸿蒙手机上 这里就不一一测试了,这样操作非常方便,完全命令行式的方式


## 使用IDE 设备文件浏览工具(2024年3月2日更新)


在最新版本的Dev-Eco Studio(DevEco Studio NEXT Developer Preview2)中,加入了新的设备信息浏览工具

位置在IDE的右下角
![](/assets/images/20240116HarmonyPhoneSendFileTomacOS/DeviceFileBrowserEntry.webp),
![](/assets/images/20240116HarmonyPhoneSendFileTomacOS/DeviceFileBrowser.webp)

这里拿截图举个例子,上述是截图的图片保存路径.

## 更新新版本hdc工具的环境变量配置

``` sh
export PATH=$PATH:~/Library/Huawei/sdk/HarmonyOS-NEXT-DP2/base/toolchains
export HDC_SERVER_PORT=7035
export OHPM_HOME=~/Library/Huawei/ohpm
export PATH=${OHPM_HOME}/bin:${PATH}
```

我用的`.zshrc`的文件,所以环境变量写到了`.zshrc`里面.

# 总结

不得不说 这个功能对于现在的环境来说非常必要开发一个图形页面app来传手机上的文件到其它端,包括兼容现在的macOS,iOS,iPadOS等等苹果生态以及Android生态的下的设备进行组网,实现近场通信互传文件,这样的app非常必要.


