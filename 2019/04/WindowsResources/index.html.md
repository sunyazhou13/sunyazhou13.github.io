---
layout: post
title: Windows装机教程
date: 2019-04-24 11:26:34
categories: [系统理论实践]
tags: [win7]
typora-root-url: ..
---


# 前言

为了解决每次都重装windows电脑系统浪费时间,干脆整理一篇文章记录一下,方便后续修电脑总忘记各种工具

### PE安装系统教程

PE工具箱制作

主要步骤：

* 第一步:制作前的软件、硬件准备：8G及以上U盘一个都可以， 一台可正常可上网的电脑
* 第二步:用电脑店U盘启动制作工具制作启动U盘
* 第三步:下载您需要的系统文件并复制到U盘中
* 第四步:进入BIOS设置U盘启动顺序
* 第五步:在进入WIN10 PE模式分区安装系统即可
* 第六步:系统激活问题
* 第七步:安装驱动问题

## 制作工具箱教程
首先先下载一个制作启动工具的软件：  

下载地址:链接：[http://www.usbrun.com/](http://www.usbrun.com/)


![](/assets/images/20190424WindowsResources/1.webp)

下载精简版本好后 先把杀毒软件关掉 ！！  双击安装一下此软件到电脑上 ，安装好软件后打开  ，如果软件提示更新，可以忽略，不需要更新！！
 

把U盘插上 
>【注：U盘会格式化，有资料先拷贝出来保存避免被格式掉了】

要是看不到设备的话， 把U盘重新插一下

![](/assets/images/20190424WindowsResources/2.webp)

点一键制作然后等制作完成就OK！！ 制作完成之后 点一下模拟启动看下U盘能不能启动，能的话就OK。关掉即可


## 下载系统步骤


下面选1个需要的系统版本下载 (U盘容量够大两个系统都可以下载使用 此PE支持原版系统安装)

WIN7 64位（B360B450锐龙二代CPU主板不支持）
系统下载连接：[链接](http://www.jsgho.net/win7/jsy/35178.html)(技术员纯净版)



![](/assets/images/20190424WindowsResources/3.webp)

![](/assets/images/20190424WindowsResources/4.webp)


## WIN7~10 64位

专业版 下载地址：[http://msdn.itellyou.cn/](http://msdn.itellyou.cn/)  

可复制此磁力链接使用迅雷新建下载：

ed2k://|file|cn_windows_10_business_edition_version_1803_updated_sep_2018_x64_dvd_07b164ed.iso|5229189120|5CC3C32DB198D647DCED4B0EB96B8547|/

下载参考：

![](/assets/images/20190424WindowsResources/5.webp)

下载好的系统直接拷贝到您刚刚制作好的的U盘里，随便放什么位置都可以。

![](/assets/images/20190424WindowsResources/6.webp)


## 设置U盘启动步骤

制作好的U盘插上您需要装系统的电脑上，以下主板U盘快捷启动按键
华硕启动快捷键：F8  
技嘉、微星、七彩虹、昂达、华擎、映泰 点击：F11  
品牌机：惠普、惠普、戴尔、联想、神州 点击：F12  

以下华硕主板快捷启动菜单选择进入U盘PE参考图，这是一个开机启动设备选项，我们选择刚刚做好的U盘 ADATA USB Flash Drlve(14800MB)按回车即可  

>（注意：选择不带UEFI的选项）

![](/assets/images/20190424WindowsResources/7.webp)

出现U盘启动界面 如下图选择  启动WIN10 PE X 64 ，别的不用去选择。 

![](/assets/images/20190424WindowsResources/8.webp)


## 分区安装系统步骤

进去PE之后 我们就要对新硬盘 进行一个分区操作了  

>【如果是老硬盘，有分区的 那可以省略这一步 直接按照下面装系统】

这里采用的是一个三星120G的固态硬盘，__一般为了发回固态最大性能，都要在主板预先开启AHCI模式和分区的时候选择4K对齐__，另外3.0的数据线和主板必须支持3.0的接口。

AHCI模式是主板自带的 新主板都支持 ，如果有的老的主板是IDE的预先设置好，华硕技嘉B250等以上主板 默认都是AHCI模式不需要更改 

 就要首先打开DG分区工具箱进行分区处理 ，如下图
 
![](/assets/images/20190424WindowsResources/9.webp)
 
点击分区工具 之后 会看到您的硬盘  这时候 可以选择您的新硬盘之后 点击上面的快速分区 如下图 
 
![](/assets/images/20190424WindowsResources/10.webp)

在新的页面中 你可以选择分几个区  多少容量 都可以自行填写 别的不需要去改变 ，另外右下角 就是4K对齐，只许勾选即可，如下图

> 注：固态硬盘需要选择4K，机械硬盘不用现在 ，选择了会导致进不了系统


![](/assets/images/20190424WindowsResources/11.webp)


分区好后关闭分区接口窗口看下一步操作


##  安装系统镜像步骤


打开桌面上的电脑店一键还原，如下图  

* ①选择系统镜像文件，等待自动识别和挂载后再次选择系统版本。
* ②选择需要安装系统的分区。[可以根据分区容量格式信息来判断分区]
* ③点击执行按钮等待系统安装完成后重启拔掉U盘。

![](/assets/images/20190424WindowsResources/12.webp)
![](/assets/images/20190424WindowsResources/13.webp)
![](/assets/images/20190424WindowsResources/14.webp)
![](/assets/images/20190424WindowsResources/15.webp)
![](/assets/images/20190424WindowsResources/16.webp)
![](/assets/images/20190424WindowsResources/17.webp)

> PS：等进度条走完了  提示重启的时候一定要拔掉U盘   再重启哦！！之后就可以正常进入安装系统过程了，等待大概5-10分钟左右装好重启即可正常使用了  

免责条款
> (本作品仅限网友交流安装系统经验，或可作临时安装测试PC硬件之用，请在安装后24小时内删除，若需要长期使用，请购买正版系统及软件。)


##  激活系统步骤


激活工具箱下载连接： 

`win7`点击这里 链接: `https://pan.baidu.com/s/1iWVZW534JKqAd9mu1B0VzQ` 提取码: `u71b`

`win8`链接: `https://pan.baidu.com/s/1M6t2nGwlBM4qXWT_imcI-A` 提取码: tkhb

`win10` 链接: `https://pan.baidu.com/s/1Tr-0PYBVmQFR0HNvzZ5yjA` 提取码: a3mt

## 华硕主板网卡驱动安装步骤

教程连接：[http://note.youdao.com/noteshare?id=40345f63671ea936740aa771cca2d438](http://note.youdao.com/noteshare?id=40345f63671ea936740aa771cca2d438)


建议上网其他驱动问题下载：[驱动精灵 标准版](http://www.drivergenius.com/)


# 总结

每次装机总忘记一些流程 这里记录下来


[参考 PE安装系统教程](https://note.youdao.com/ynoteshare1/index.html?id=e0f8c30393c4f069555d286020f9d394&type=note)  
[U盘刻录安装原版系统教程](http://05aebac1.wiz03.com/share/s/05HHH13zK4EY2bE37Q00RO3H1CvO101754vQ2bNyFE2nhALV?tdsourcetag=s_pcqq_aiomsg)  
[I tell you神奇的镜像下载网站 绝对纯洁](http://msdn.itellyou.cn/)