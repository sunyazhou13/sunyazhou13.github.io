---
layout: post
title: 学习如何在visionOS上开发APP
date: 2023-06-09 17:08 +0800
categories: [iOS, visionOS]
tags: [visionOS, Swift, SwiftUI]
typora-root-url: ..
---

![](/assets/images/20230609LearnAboutVisionOS/visionos.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 初识visionOS

visionOS 可以理解为新的运行在苹果头显上的iOS系统, 用苹果的话就是各种高大上什么空间技术...。里面会用到SwiftUI, UIKit, RealityKit和ARKit框架，在visionOS上开发APP的话最好是拥有以上各种Kit开发经验,如果不了解还是希望你学学.或者直接从SwiftUI开始.

* SwiftUI 相当于之前的UIKit只不过是新的写UI的框架系统用于swift开发
* UIKit是原始Objective-C的UI系统
* RealityKit增强现实框架
* ARKit虚拟现实框架

## spatial computing(空间计算)

了解构成空间计算的基础—窗口(windows)、体积(volumes )和空间(spaces)—并了解如何使用这些元素来构建引人入胜的沉浸式体验。我们将带您了解用于为visionOS创建应用程序的框架，并向您展示如何设计深度，规模和沉浸感。探索如何使用来自Apple的工具，如Xcode和新的Reality Composer Pro，以及如何制作适合每个人的空间计算应用程序。

*  windows 这玩意很重要,就是我们之前现实UIView之类的window,一般用于显示2D的内容视图容器,
*  volumes 这个是对window的扩充和增强容器,用于容纳2D和3D内容
*  spaces 相当于摄影机,也就是我们人眼的位置,用于显示款贯穿和全屏以及3D大屏曲面模式的一种类型.

![](/assets/images/20230609LearnAboutVisionOS/visionos0.webp)

官方的解释如下:

* windows
你可以在你的visionOS应用中创建一个或多个窗口。它们是用SwiftUI构建的，包含传统的视图和控件，你可以通过添加3D内容来增加体验的深度。

* volumes
使用3D体积为你的应用添加深度。卷是SwiftUI场景，可以使用RealityKit或Unity展示3D内容，创建可从共享空间或应用程序的完整空间的任何角度查看的体验。
* spaces
默认情况下，应用程序启动到共享空间，它们并排存在，就像Mac桌面上的多个应用程序一样。应用程序可以使用窗口和卷来显示内容，用户可以在他们喜欢的任何地方重新定位这些元素。为了获得更身临其境的体验，应用程序可以打开一个专门的Full Space，只显示该应用程序的内容。在Full Space中，应用程序可以使用窗口和卷，创建无限的3D内容，打开通往不同世界的门户，甚至让人完全沉浸在一个环境中。

了解构成空间计算的基础—窗口、体积和空间—并了解如何使用这些元素来构建引人入胜的沉浸式体验。我们将带您了解用于为visionOS创建应用程序的框架，并向您展示如何设计深度，规模和沉浸感。探索如何使用来自Apple的工具，如Xcode和新的Reality Composer Pro，以及如何制作适合每个人的空间计算应用程序。

这里有了解这个的4个视频

![](/assets/images/20230609LearnAboutVisionOS/MeetSpatialComputing1.webp)

* [Get started with building apps for spatial computing](https://developer.apple.com/videos/play/wwdc2023/10260/)
* [Principles of spatial design](https://developer.apple.com/videos/play/wwdc2023/10072/)
* [Create accessible spatial experiences](https://developer.apple.com/videos/play/wwdc2023/10034/)
* [Develop your first immersive app](https://developer.apple.com/videos/play/wwdc2023/10203/)

一旦您熟悉了visionOS的基础知识，就可以进一步了解支持该平台的框架。参观一下visionOS的SwiftUI，了解如何为窗口和卷添加深度，以及如何使用Full Space让人们以前所未有的方式体验您的应用程序。我们还将向您介绍用于空间计算的UIKit，并分享如何与SwiftUI一起使用它。

![](/assets/images/20230609LearnAboutVisionOS/MeetSpatialComputing2.webp)

[Meet SwiftUI for spatial computing](https://developer.apple.com/videos/play/wwdc2023/10109/)
[Meet UIKit for spatial computing](https://developer.apple.com/videos/play/wwdc2023/111215/)

这俩是UIKit和SwiftKit的内容

## 探索SwiftUI和 RealityKit

要更深入地了解SwiftUI和RealityKit，请探索专注于SwiftUI场景类型的专门系列会议，以帮助您跨窗口、卷和空间构建出色的体验。了解Model 3D API，了解如何在应用程序中添加深度和维度，并了解如何使用RealityView渲染3D内容。我们将帮助您准备好进入ImmersiveSpace—一种新的SwiftUI场景类型，可以让您为visionOS创造出色的沉浸式体验。学习管理场景类型的最佳实践，增加沉浸感，并建立一个“走出这个世界”的体验。

![](/assets/images/20230609LearnAboutVisionOS/ExploreSwiftUIandRealityKit1.webp)

* [Elevate your windowed app for spatial computing](https://developer.apple.com/videos/play/wwdc2023/10110/)
* [Take SwiftUI to the next dimension](https://developer.apple.com/videos/play/wwdc2023/10113/)
* [Go beyond the window with SwiftUI](https://developer.apple.com/videos/play/wwdc2023/10111/)

在我们的第二个系列中，了解如何使用RealityKit为您的应用程序带来引人入胜的沉浸式内容。开始使用RealityKit实体，组件和系统，并了解如何将3D模型和效果添加到项目中。我们将向您展示如何将您的内容嵌入到实体层次结构中，使用锚将虚拟内容和现实世界混合在一起，将粒子效果带入您的应用程序，添加视频内容，并通过门户创建更身临其境的体验。

![](/assets/images/20230609LearnAboutVisionOS/ExploreSwiftUIandRealityKit2.webp)

* [Enhance your spatial computing app with RealityKit](https://developer.apple.com/videos/play/wwdc2023/10081/)
* [Build spatial experiences with RealityKit](https://developer.apple.com/videos/play/wwdc2023/10080/)

## 重新学习ARKit

最后，我们将帮助您了解visionOS上的ARKit。该平台使用ARKit算法来处理持久性、世界映射、分割、抠图和环境照明等功能。这些算法一直在运行，允许应用程序和游戏在共享空间中自动受益于ARKit。一旦你的应用打开了一个专用的Full Space，它就可以利用ARKit api并将虚拟内容与现实世界融合在一起。

我们将分享这个框架是如何完全重新构想的，让你在保护隐私的同时建立互动体验。了解如何制作与某人房间交互的3D内容-无论您是想将虚拟球从地板上弹起还是将虚拟油漆扔到墙上。探索ARKit API的最新更新，并跟随我们演示如何在应用程序中利用手跟踪和场景几何。
 
 ![](/assets/images/20230609LearnAboutVisionOS/RediscoverARKit.webp)
 
 * [Meet ARKit for spatial computing](https://developer.apple.com/videos/play/wwdc2023/10082/)
 * [Evolve your ARKit app for spatial experiences](https://developer.apple.com/videos/play/wwdc2023/10091/)
 
## 设计同学需要关注的visionOS

了解如何为空间计算设计出色的应用程序、游戏和体验。发现全新的输入和组件。潜入深度和规模。增加沉浸的时刻。创建空间音频音景。寻找合作和联系的机会。并帮助人们在探索全新世界的同时保持对周围环境的脚踏实地。无论这是您第一次设计空间体验，还是您多年来一直在构建完全沉浸式的应用程序，了解如何使用visionOS创建神奇的英雄时刻，迷人的音景，以人为中心的UI等等。

![](/assets/images/20230609LearnAboutVisionOS/DesignforvisionOS.webp)

* [Principles of spatial design](https://developer.apple.com/videos/play/wwdc2023/10072/)
* [Design for spatial user interfaces](https://developer.apple.com/videos/play/wwdc2023/10076/)
* [Design for spatial input](https://developer.apple.com/videos/play/wwdc2023/10073/)
* [Explore immersive sound design](https://developer.apple.com/videos/play/wwdc2023/10271/)
* [Design considerations for vision and motion](https://developer.apple.com/videos/play/wwdc2023/10078/)

## visionOS开发工具包

Apple提供了一套全面的工具来帮助您为visionOS构建出色的应用程序、游戏和体验。了解如何在Xcode中开始您的第一个visionOS项目，探索工具和测试的更新，了解如何在您的3D开发工作流程中利用Reality Composer Pro，并了解如何使用Unity的创作工具为空间计算创造出色的体验。

## Xcode开发需要关注的

用Xcode开始为visionOS开发。我们将向您展示如何将visionOS目的地添加到您现有的项目或构建一个全新的应用程序，在Xcode预览中的原型，并从Reality Composer Pro导入内容。我们还将分享如何使用visionOS模拟器来评估您对各种模拟场景和照明条件的体验。了解如何创建测试和可视化，以探索空间内容的碰撞、遮挡和场景理解，并优化该内容的性能和效率。

![](/assets/images/20230609LearnAboutVisionOS/ExploredevelopertoolsforvisionOS.webp)

* [What's new in Xcode 15](https://developer.apple.com/videos/play/wwdc2023/10165/)
* [Develop your first immersive app](https://developer.apple.com/videos/play/wwdc2023/10203/)
* [Meet RealityKit Trace](https://developer.apple.com/videos/play/wwdc2023/10099/)
* [Explore rendering for spatial computing](https://developer.apple.com/videos/play/wwdc2023/10095/)
* [Optimize app power and performance for spatial computing
](https://developer.apple.com/videos/play/wwdc2023/10100/)
* [Meet Core Location for spatial computing](https://developer.apple.com/videos/play/wwdc2023/10146/)

## Reality Composer Pro

发现预览和准备3D内容的新方法为您的visionOS应用程序。本月晚些时候，现实作曲家专业利用美元的力量来帮助您撰写，编辑和预览资产，如3D模型，材料和声音。我们将向您展示如何利用此工具为您的应用程序创建身临其境的内容，向对象添加材料，并将您的现实作曲家Pro内容带入Xcode中。我们还将带您了解Apple平台上通用场景描述(USD)的最新更新。

![](/assets/images/20230609LearnAboutVisionOS/MeetRealityComposerPro.webp)

* [Meet Reality Composer Pro](https://developer.apple.com/videos/play/wwdc2023/10083/)
* [Explore materials in Reality Composer Pro](https://developer.apple.com/videos/play/wwdc2023/10202/)
* [Work with Reality Composer Pro content in Xcode](https://developer.apple.com/videos/play/wwdc2023/10273/)
* [Explore the USD ecosystem](https://developer.apple.com/videos/play/wwdc2023/10086/)

## 学习Unity

![](/assets/images/20230609LearnAboutVisionOS/GetstartedwithUnity.webp)

## TestFlight and App Store Connect

![](/assets/images/20230609LearnAboutVisionOS/LearnaboutTestFlightandAppStoreConnect.webp)

[Explore App Store Connect for spatial computing](https://developer.apple.com/videos/play/wwdc2023/10012/)

## 游戏和音视频多媒体

了解如何使用visionOS在游戏和媒体体验中创造真正身临其境的时刻。游戏和媒体可以利用全方位的沉浸感来讲述令人难以置信的故事，并以一种新的方式与人们建立联系。我们将向您展示可用的途径，让您开始与visionOS的游戏和叙事开发。学习使用RealityKit有效渲染3D内容的方法，探索视觉和运动的设计考虑因素，并了解如何创建完全身临其境的体验，将人们带入一个新的世界

![](/assets/images/20230609LearnAboutVisionOS/Buildgamesandmediaexperiences1.webp)  

* [Build great games for spatial computing](https://developer.apple.com/videos/play/wwdc2023/10096/)
* [Explore rendering for spatial computing](https://developer.apple.com/videos/play/wwdc2023/10095/)
* [Design considerations for vision and motion](https://developer.apple.com/videos/play/wwdc2023/10078/)
* [Create immersive Unity apps](https://developer.apple.com/videos/play/wwdc2023/10088/)
* [Bring your Unity VR app to a fully immersive space
](https://developer.apple.com/videos/play/wwdc2023/10093/)
* [Discover Metal for immersive apps](https://developer.apple.com/videos/play/wwdc2023/10089/)

声音也可以极大地增强你的visionOS应用程序和游戏的体验-无论你添加一个效果的按钮按下或创建一个完全身临其境的音景。了解Apple设计师如何选择声音和构建声景，在窗口、体量和空间中创造富有质感的沉浸式体验。我们将分享如何在您的应用程序中丰富声音的基本交互，当您在空间上放置音频线索时，变化重复的声音，并在您的应用程序中构建声音愉悦的时刻。

![](/assets/images/20230609LearnAboutVisionOS/Buildgamesandmediaexperiences2.webp)  

* [Explore immersive sound design](https://developer.apple.com/videos/play/wwdc2023/10271/)

如果您的应用程序或游戏具有媒体内容，我们有一系列的会议，旨在帮助您更新您的视频管道，并为visionOS建立一个伟大的播放体验。了解如何扩展交付管道以支持3D内容，并获得应用程序中空间媒体流的提示和技术。我们还将向您展示如何使用为visionOS提供视频播放的框架和api创建引人入胜和身临其境的播放体验。

![](/assets/images/20230609LearnAboutVisionOS/Buildgamesandmediaexperiences3.webp)  

* [Deliver video content for spatial experiences](https://developer.apple.com/videos/play/wwdc2023/10071/)
* [Create a great spatial playback experience](https://developer.apple.com/videos/play/wwdc2023/10070/)

## 协作、共享和生产力

共享和协作是visionOS的核心部分，通过在应用程序和游戏中提供体验，让人们感觉仿佛置身于同一个空间。默认情况下，人们可以通过FaceTime通话与他人共享任何应用程序窗口，就像他们在Mac上一样。但是当你采用GroupActivities框架时，你可以创建下一代协作体验。

通过了解您可以在应用程序中创建的共享活动类型，开始在Apple Vision Pro上设计和构建SharePlay。了解如何在体验中的参与者之间建立共享上下文，并了解如何通过支持空间人物角色在应用程序中支持更有意义的交互。
 
![](/assets/images/20230609LearnAboutVisionOS/Buildforcollaborationsharingandproductivity.webp)

* [Design spatial SharePlay experiences](https://developer.apple.com/videos/play/wwdc2023/10075/)
* [Build spatial SharePlay experiences](https://developer.apple.com/videos/play/wwdc2023/10087/) 

## web相关和创建3D模型相关

![](/assets/images/20230609LearnAboutVisionOS/Buildwebexperiences1.webp)
![](/assets/images/20230609LearnAboutVisionOS/Buildwebexperiences2.webp)

## 如果让我们的运行在iPhone和iPad的app运行在visionOS上

了解如何在visionOS中运行现有的ipad和iOS应用程序。探索iPad和iOS应用程序如何在这个平台上运行，了解框架依赖关系，并了解专为iPad设计的应用程序交互。当您准备好将现有应用程序提升到一个新的水平时，我们将向您展示如何优化共享空间的iPad和iPhone应用程序体验，并帮助您改善视觉效果。

![](/assets/images/20230609LearnAboutVisionOS/RunyouriPadandiPhoneappsinvisionOS.webp)

* [Run your iPad and iPhone apps in the Shared Space](https://developer.apple.com/videos/play/wwdc2023/10090/)
* [Enhance your iPad and iPhone apps for the Shared Space](https://developer.apple.com/videos/play/wwdc2023/10094/)

上边这里作为一个iOS开发必看


# 总结 

整理了一些学习visionOS的全部资料和视频,希望大家能在新的visionOS上开辟新的世界,就像我们在iOS起步的时候那样.

[Learn about visionOS官方地址](https://developer.apple.com/visionos/learn/)