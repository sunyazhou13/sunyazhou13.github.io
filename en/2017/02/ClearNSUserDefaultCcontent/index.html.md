---
layout: post
title: Delete NSUserDefaults Content Using the Terminal
date: 2017-02-20 19:05:01
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

Preface
--
> Most of you are very familiar with `NSUserDefaults`. Today I'll show you how to clear `NSUserDefaults` information using the terminal  

`NSUserDefaults` is like the registry in Windows development; it's used to store some flag bits
Recently in development, what I needed most was clearing `NSUserDefaults` information without running the code

**$ defaults delete + bundle identifier**  eg: com.baidu.demo 

The following deletes all files with `com.baidu.demo` as the bundle identifier  

``` shell
$ defaults delete com.baidu.demo
```  

> The actual path (replace `my app` and the arrows before and after with your own app's bundle identifier)

For macOS apps without sandbox (see below): `~/Library/Preferences/<my app>.plist  <my app>`  eg:QQ
![Non-sandbox path](/assets/images/20170220ClearNSUserDefaultCcontent/NonSandBoxPermission.avif)

For macOS apps with sandbox (see below):  `~/Library/Containers/<my app>/Data/Library/Preferences/<my app>.plist` eg:qq  

![Sand Box Permission](/assets/images/20170220ClearNSUserDefaultCcontent/SandBoxPermission.avif)


Summary
--

> `defaults` also has other commands, such as setting a `value` for a `key`. You can google it yourself  

Thank you all

The End
