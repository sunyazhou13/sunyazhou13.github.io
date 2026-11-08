---
layout: post
title: "Alibaba & ByteDance: A Set of Efficient iOS Interview Questions - Performance Optimization"
date: 2020-09-22 09:42:48
categories: [iOS, 系统理论实践]
tags: [Algorithm, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

![i OS Interview Questions Album Cover](/assets/images/20200721iOSinterviewAnswers/iOSInterviewQuestionsAlbumCover.avif)

# Preface

This article is strongly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. You are welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

In this article, we'll talk about the performance optimization related questions from [Alibaba & ByteDance: A Set of Efficient iOS Interview Questions](https://mp.weixin.qq.com/s/bDnsaD__ZpdHIk3_So382w).

## Performance Optimization

Here are the main optimizations:

1. How to optimize startup, and how to monitor it
2. How to optimize lag, and how to monitor it
3. How to optimize battery consumption, and how to monitor it
4. How to optimize networking, and how to monitor it

First, optimization must be approached from multiple dimensions to yield significant gains.

Here I recommend carefully analyzing your own project and studying Dai Ming's article [How to Analyze iOS Startup Time Cost](https://ming1016.github.io/2019/12/07/how-to-analyze-startup-time-cost-in-ios/).

You must analyze and approach it from multiple dimensions.

The runtime initialization process is divided into:

* Loading class extensions
* Loading C++ static objects
* Calling +load functions
* Executing the main function
* Application initialization, until applicationDidFinishLaunchingWithOptions finishes executing
Initializing frame rendering, until viewDidAppear finishes executing, when the user can see and interact with the UI.


# Summary

There are no standard answers for performance optimization, so I'm sharing an important article as a starting point and reference. As long as you achieve the intended optimization goals and keep the program stable, that's enough.
