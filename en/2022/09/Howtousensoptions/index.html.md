---
layout: post
title: Using NS_OPTIONS
date: 2022-09-16 17:02 +0800
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false


---


# Preface

This article carries a strong personal flavor. If it makes you uncomfortable, please close it as soon as possible. This article is for personal study notes only. You're welcome to repost or share it within the bounds of the license agreement — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


#### Definition:

``` objc
typedef NS_OPTIONS(NSUInteger, MyOption) {
  MyOptionNone = 0, //二进制0000,十进制0
  MyOption1 = 1 << 0,//0001,1
  MyOption2 = 1 << 1,//0010,2
  MyOption3 = 1 << 2,//0100,4
  MyOption4 = 1 << 3,//1000,8
};
```


#### Usage

``` objc
//Declare and define the enum variable
MyOption option = MyOption1 | MyOption2;//0001 | 0010 = 0011,3

//Check whether an option is included
if (option & MyOption3) { //0011 & 0100 = 0000
     //Includes MyOption3
} else {
     //Does not include MyOption3
}

//Add an option
option = option | MyOption4;//0011 | 1000 = 1011, 11
//Remove an option
option = option & (~MyOption4);//1011 & (~1000) = 1011 & 0111 = 0011, 3

//Restore everything except MyOption2 to the default  
option =  option & MyOption2
// Equivalent to erasing all values except MyOption2, keeping only MyOption2
option &= MyOption2
// Also equivalent to
option = MyOption2


```

#### Example Enum Code Snippet (Copy-Ready)

``` objc
typedef NS_OPTIONS(NSUInteger, YZOptionsFlag) {
    YZOptionsFlagNone            = 0,       //二进制0000,十进制0
    YZOptionsFlagNormal          = 1 <<  0, //0001,1 常规状态 下面以此类推
    YZOptionsFlag1               = 1 <<  1, //0010,2 
    YZOptionsFlag2               = 1 <<  2, // 
    YZOptionsFlag3               = 1 <<  3, // 
    YZOptionsFlag4               = 1 <<  4, // 
    YZOptionsFlag5               = 1 <<  5, // 
    YZOptionsFlag6               = 1 <<  6, // 
    YZOptionsFlag7               = 1 <<  7, // 
//    YZOptionsFlag              = 1 <<  8, //
//    YZOptionsFlag              = 1 <<  9, //
//
//    YZOptionsFlag              = 0 << 16, //
//    YZOptionsFlag              = 1 << 16,
//    YZOptionsFlag              = 2 << 16,
//    YZOptionsFlag              = 3 << 16,
//
//    YZOptionsFlag              = 0 << 20, //
//    YZOptionsFlag              = 1 << 20,
//    YZOptionsFlag              = 2 << 20,
//    YZOptionsFlag              = 3 << 20,
//    YZOptionsFlag              = 4 << 20,
//    YZOptionsFlag              = 5 << 20,
//    YZOptionsFlag              = 6 << 20,
//    YZOptionsFlag              = 7 << 20,
//
//    YZOptionsFlag              = 0 << 24,
//    YZOptionsFlag              = 3 << 24,
//    YZOptionsFlag              = 7 << 24,
} API_AVAILABLE(ios(4.0));

```
