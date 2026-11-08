---
layout: post
title: Common Commands for Pod Repositories
date: 2023-04-03 17:10 +0800
categories: [iOS]
tags: [iOS, macOS, Objective-C, Cocoapods, skills]
typora-root-url: ..
math: false
mermaid: false

---

![cocoapods](/assets/images/20201010PodSpec/cocoapods.avif)

# Preface

This post carries a strong personal tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only for my personal learning notes. You're welcome to repost or share it within the scope of the license, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


## Adding a Private Specs Repository

``` sh
pod repo add sunyazhou-specs https://www.sunyazhou.com/xxproject/Specs.git --verbose
```

## Updating the Index of a Specific Pod Spec Repository

``` sh 
pod repo update sunyazhou-specs --verbose
```

## Pushing a Local Repo's Podspec to a Remote Private Specs Repository


``` sh
pod repo push sunyazhou-specs xxxxlib.podspec --allow-warnings --use-libraries --verbose --skip-import-validation
```


The push operation here automatically triggers a git push, pushing the podspec to the remote index repository. The bunch of parameters added afterward is to suppress warnings and make compilation pass more easily.

If you do it manually, you need to create the **Library Name**/**Version Number**/**xxxlib.spec** file in the specs repository.
