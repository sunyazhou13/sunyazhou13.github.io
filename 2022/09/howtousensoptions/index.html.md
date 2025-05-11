---
layout: post
title: NS-OPTIONS的用法
date: 2022-09-16 17:02 +0800
categories: [iOS, Swift]
tags: [iOS, Swift, Objective-C, skills]
typora-root-url: ..

---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


#### 定义:

``` objc
typedef NS_OPTIONS(NSUInteger, MyOption) {
  MyOptionNone = 0, //二进制0000,十进制0
  MyOption1 = 1 << 0,//0001,1
  MyOption2 = 1 << 1,//0010,2
  MyOption3 = 1 << 2,//0100,4
  MyOption4 = 1 << 3,//1000,8
};
```


#### 使用

``` objc
//声明定义枚举变量
MyOption option = MyOption1 | MyOption2;//0001 | 0010 = 0011,3

//检查是否包含某选型
if (option & MyOption3) { //0011 & 0100 = 0000
     //包含MyOption3
} else {
     //不包含MyOption3
}

//增加选项
option = option | MyOption4;//0011 | 1000 = 1011, 11
//减少选项
option = option & (~MyOption4);//1011 & (~1000) = 1011 & 0111 = 0011, 3

//除了MyOption2以外都恢复到默认  
option =  option & MyOption2
// 相当于擦除 MyOption2以外的所有值只保留MyOption2
option &= MyOption2
// 也相当于
option = MyOption2


```

#### 枚举示例代码片段(可复制使用)

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