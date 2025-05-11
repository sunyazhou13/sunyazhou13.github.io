---
layout: post
title: Picking-and-Hit-Testing-in-Metal
date: 2024-08-13 01:55 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


![](/assets/images/20240813PickingAndHitTestinginMetal/picking.gif)


# 最近学习Metal

当学习到第十二的时候遇到了一个之前想解决却从未找到答案的方式。如何检测 一个3D场景中某个元素的点击问题,比如引入一个3D场景在手机端或者PC端, 通过手指触摸或者鼠标点击能知道 我点击是哪个3D模型

在Metal.by.Tutorials.4th.2023.12.pdf这本书中我找到了答案-`Object Picking`

![](/assets/images/20240813PickingAndHitTestinginMetal/Metal.by.Tutorials.4th.2023.12.webp)


``` txt
To get started with multipass rendering, you’ll create a simple render pass that adds object picking to your app. When you click a model in your scene, that model will render in a slightly different shade.
There are several ways to hit-test rendered objects. For example, you could do the math to convert the 2D touch location to a 3D ray and then perform ray intersection to see which object intersects the ray. Warren Moore describes this method in his Picking and Hit-Testing in Metal (https://bit.ly/3rlzm9b) article. Alternatively, you could render a texture where each object is rendered in a different color or object ID. Then, you calculate the texture coordinate from the screen touch location and read the texture to see which object was hit.
You’re going to store the model’s object ID into a texture in one render pass. You’ll then send the touch location to the fragment shader in the second render pass and read the texture from the first pass. If the fragment being rendered is from the selected object, you’ll render that fragment in a different color.

```

这篇文章解决了我探索很久的问题.如何解决 2D空间点击3D空间元素的问题,其核心是采用一种叫做**3D射和物体求交集的方式**.

下面的文章解决了此问题,除了这种方式以外还有一种是**利用颜色ID来区分物体点击**.

一下是picking技术的文章精选 

[Picking and Hit-Testing in Metal](https://bit.ly/3rlzm9b)  
[Picking and Hit-Testing in Metal Demo](https://github.com/metal-by-example/metal-picking)

# 总结

和之前图形学同事探讨,他给我一些学习vulkan的方向资料,我整理到这里 

``` txt
https://github.com/KhronosGroup/Vulkan-Guide
https://github.com/KhronosGroup/Khronosdotorg/blob/main/api/vulkan/resources.md

Tutorial:
https://gavinkg.github.io/ILearnVulkanFromScratch-CN/
https://vulkan-tutorial.com/
https://software.intel.com/content/www/us/en/develop/articles/api-without-secrets-introduction-to-vulkan-preface.html
https://renderdoc.org/vulkan-in-30-minutes.html
https://www.fasterthan.life/blog/2017/7/11/i-am-graphics-and-so-can-you-part-1
``` 

