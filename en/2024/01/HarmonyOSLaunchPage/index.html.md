---
layout: post
title: HarmonyOS Launch Page Development
date: 2024-01-15 20:55 +0800
categories: [ArkUI, HarmonyOS]
tags: [鸿蒙OS开发, HarmonyOS]
typora-root-url: ..
math: false
mermaid: false

---

![Harmony Logo](/assets/images/20240115HarmonyOSLaunchPage/HarmonyLogo.avif)

# Preface

This article is strongly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. You are welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


## HarmonyOS Development

In 2024, technology can't just stay on our lips — actions speak louder than words. After a few months of learning HarmonyOS development, I feel I should record the easily forgotten content. Today, the first simple code I bring is the entry-level piece of HarmonyOS development: building a simple splash screen.


### First, Let's See the Result

![launch](/assets/images/20240115HarmonyOSLaunchPage/launch.avif)

### The Environment Used Here Is HarmonyOS 4.1

Here's the code:

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

The basic code to enter the home page:

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

In the code above, the important part is the `setTimeout` function in `onPageShow()`. This function has a built-in timer; 3000 means 3 seconds, i.e., after 3 seconds the router directly navigates to the Home page.

Here a Flex layout is used:

* direction: FlexDirection.Column,
* alignItems: ItemAlign.Center,
* justifyContent: FlexAlign.Center

These three represent the Flex main axis direction, the content alignment direction, and the cross axis direction respectively. If you don't understand, please refer to the [Huawei Developer Documentation](https://developer.harmonyos.com/cn/develop/).

# Summary

Today's article briefly introduces the simple development of a launch splash screen. You can build on this for ad and launch page configurations. More complex content is left for future exploration. Thanks for watching.
