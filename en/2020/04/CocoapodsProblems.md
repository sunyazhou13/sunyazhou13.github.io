---
layout: post
title: CocoaPods Tsinghua Mirror
date: 2020-04-10 07:13:59
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills, Cocoapods]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

This post carries strong personal sentiment; if you feel uncomfortable reading it, please close it as soon as possible. This post is only a personal learning record. Reposting or sharing within the license terms is welcome; please respect copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

## CocoaPods Troubleshooting

I kept hitting tricky problems these past few days because I upgraded my CocoaPods to 1.9.1, which caused all sorts of issues and even got me censored. In desperation, I found the following solutions for various CocoaPods problems.


For older versions of CocoaPods, you can use the TUNA mirror like this:

``` sh
$ pod repo remove master
$ pod repo add master https://mirrors.tuna.tsinghua.edu.cn/git/CocoaPods/Specs.git
$ pod repo update
```

Newer versions of CocoaPods no longer allow adding the master repo directly with `pod repo add`, but you can still:

``` sh
$ cd ~/.cocoapods/repos 
$ pod repo remove master
$ git clone https://mirrors.tuna.tsinghua.edu.cn/git/CocoaPods/Specs.git master
```

Finally, go into your own project and add this line at the top of your project's `PodFile`:

``` ruby
source 'https://mirrors.tuna.tsinghua.edu.cn/git/CocoaPods/Specs.git'
```


# Summary


I wrestled with it for a long time, but the trick is simply finding the right place.

[Reference: CocoaPods mirror usage help](https://mirrors.tuna.tsinghua.edu.cn/help/CocoaPods/)
