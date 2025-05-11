---
layout: post
title: 鸿蒙启动页面开发
date: 2024-01-15 20:55 +0800
categories: [ArkUI, HarmonyOS]
tags: [鸿蒙OS开发, HarmonyOS]
typora-root-url: ..
---

![](/assets/images/20240115HarmonyOSLaunchPage/HarmonyLogo.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 鸿蒙OS开发

2024年技术不能只停留在嘴上,行胜于言,经过几个月的鸿蒙开发的学习,觉得还是要把容易忘记的内容记录下来,今天 带了的第一个简单代码是开启鸿蒙开发的入门篇,做一个简单的闪屏页


### 先看下实现效果

![](/assets/images/20240115HarmonyOSLaunchPage/launch.gif)

### 这里使用的HarmonyOS4.1环境

代码如下:

``` ts
import router from '@ohos.router'

@Entry
@Component
struct Index {
  onPageShow() {
    setTimeout(()=> {
      console.log("闪屏1s结束")
      router.pushUrl({
        url:'pages/Home'
      })
    }, 3000)
  }

  build() {
    Flex({
      direction: FlexDirection.Column,
      alignItems: ItemAlign.Center,
      justifyContent: FlexAlign.Center
    }) {
      Image($r("app.media.sunyazhou"))
        .width(100)
        .height(100)
      Text("迈腾大队长")
        .fontSize(26)
        .fontColor(Color.White)
        .margin({top: 300})
      Text("SUNYAZHOU.COM 版权所有")
        .fontSize(16)
        .textAlign(TextAlign.Center)
        .fontColor(Color.White)
        .margin({top: 10})
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#66CDAA')
  }
}
```

进入首页的基本代码

``` ts  
@Entry
@Component
struct Home {
  build() {
    Column(){
      Text("Home首页")
        .fontSize(26)
        .fontColor(Color.White)
        .margin({top: 300})
    }.width('100%').height('100%').backgroundColor('#00FFFF')
  }
}
```

上述代码比较重要的是`onPageShow()`中的`setTimeout`函数,这个函数自带定时器, 3000代表 3s,  也就是说 3秒后利用路由直接进入Home页.

这里使用的是Flex布局,

* direction: FlexDirection.Column,
* alignItems: ItemAlign.Center,
* justifyContent: FlexAlign.Center

这三个分别代表了Flex主轴方向、内容对齐方向、交叉轴方向.如果有不理解的话请自行反馈[华为开发文档](https://developer.harmonyos.com/cn/develop/)

# 总结

今天的简单的介绍启动闪屏页的简单开发,大家可以基于这个做一些广告和启动页配置.至于复杂的内容有待后续探索,感谢观看.