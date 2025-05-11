---
layout: post
title: "开源YZ3DMenu导航菜单"
date: 2022-04-13 09:50:00.000000000 +08:00
categories: [iOS, Swift]
tags: [Swift, AVFoundation]
typora-root-url: ..
---

![](/assets/images/20220413YZ3DMenu/3dmenu.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

上图先看效果

![开源项目](/assets/images/20220413YZ3DMenu/3DMenuDemo1.gif) 
![实践完成](/assets/images/20220413YZ3DMenu/3DMenuDemo2.gif)

这个菜单是个3D菜单,之前在一个叫cosmos的app中出现,之前一直想找个时间把这个功能搞出来开源.之后出现了一个类似微博的开源项目[Cosmos](https://github.com/zhnnnnn/ZHNCosmos) 这一阵子有时间 把这个组件重写一遍.

## 实现原理

* 通过tabbar的按钮触发(内部封装pan手势)时机,开始拖拽中、结束或取消...
* 添加新window 并在window上覆盖了 Blur模糊和容器,以及封装的仪表盘菜单视图
* 滑动过程中改动菜单视图(仪表盘菜单)的m34动画属性实现 倾斜滑动.

![内部变量](/assets/images/20220413YZ3DMenu/3DMenuDemo3.gif) 

下面是框架的代码结构设计

![](/assets/images/20220413YZ3DMenu/3DMenuDesign.webp)

代码比较多 我这里没有给大家详细列,我把代码 放在了 [github](https://github.com/sunyazhou13/YZ3DMenu)上感兴趣的可以点击查看一下.



## 总结

之前一直想把这个重写一下,一直没有抽出时间,后续打算用swift重写一个新的轮子,希望这个开源组件能帮到你,有问题可以下方留言, 很久没有写博客了.2022年要坚持写一些硬核技术.

[本文demo地址](https://github.com/sunyazhou13/YZ3DMenu)   

--
摘录来自  
[参考Cosmos](https://github.com/zhnnnnn/ZHNCosmos)   
[中]  zhnnnnn   
本文材料受版权保护



