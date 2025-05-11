---
layout: post
title: Flutter的有状态StatefulWidget生命周期
date: 2023-03-12 14:38 +0800
categories: [iOS, Flutter]
tags: [iOS, Dart, Objective-C, skills]
typora-root-url: ..
---

![](/assets/images/20230312FlutterLifeCycle/flutter0.webp)


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## Flutter的声明周期


最近在负责波点音乐的相关开发,由于波点是用flutter写的,所以周末不得不做一些Flutter开发的功课来弥补自己在移动端技术栈的缺失.

Flutter的声明周期主要是`StatefulWidget`和`State`之间配合

下面从祖传的hello world开始

``` dart
import 'package:flutter/material.dart';

///创建
void main () {
  runApp(MyApp());
}

class MyApp extends StatelessWidget  {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "hello flutter",
      home: Scaffold(
        appBar: AppBar(
          title: Text("sunyazhou.com"),
        ),
        body: ContentWidget(),
      ),
    );
  }
}

class ContentWidget extends StatefulWidget
{
  ContentWidget(){
    print("ContentWidget构造函数被调用");
  }
   @override
  State<StatefulWidget> createState() {
     print("createState被调用");
    return ContentWidgetState();
  }
}

class ContentWidgetState extends State<ContentWidget>
{
  int counter = 0;
  ContentWidgetState()
  {
    print("ContentWidgetState构造函数被调用");
  }

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    print("ContentWidgetState的 initState被调用");
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    print("ContentWidgetState的 didChangeDependencies被调用");
  }

  @override
  void didUpdateWidget(covariant ContentWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    print("ContentWidgetState的 didUpdateWidget被调用");
  }

  @override
  Widget build(BuildContext context) {
    print("ContentWidgetState的 build被调用");
    return Center(
        child: Column (
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ElevatedButton(onPressed: (){
             setState(() {
               counter++;
             });
          }, child: Text("计数+1")),
          Text("hello world $counter", style: TextStyle(fontSize: 30),),
        ],
      ),
    );
  }
}

```

![](/assets/images/20230312FlutterLifeCycle/flutter1.webp)

打印如下:

``` sh
flutter: ContentWidget构造函数被调用
flutter: createState被调用
flutter: ContentWidgetState构造函数被调用
flutter: ContentWidgetState的 initState被调用
flutter: ContentWidgetState的 didChangeDependencies被调用
flutter: ContentWidgetState的 build被调用
flutter: ContentWidget构造函数被调用
flutter: ContentWidgetState的 didUpdateWidget被调用
flutter: ContentWidgetState的 build被调用
```

####  didUpdateWidget

`didUpdateWidget()` 这个函数父类更新才会被调用

#### 当点击后的结果

当每次点击就会每次都调用 build

![](/assets/images/20230312FlutterLifeCycle/flutter2.gif)

``` sh
flutter: ContentWidgetState的 build被调用
flutter: ContentWidgetState的 build被调用
flutter: ContentWidgetState的 build被调用
flutter: ContentWidgetState的 build被调用
flutter: ContentWidgetState的 build被调用
flutter: ContentWidgetState的 build被调用
flutter: ContentWidgetState的 build被调用
flutter: ContentWidgetState的 build被调用
```

下面是flutter的生命周期函数图

![](/assets/images/20230312FlutterLifeCycle/flutter3.webp)

> 图片引用自[Flutter(七)之有状态的StatefulWidget](https://zhuanlan.zhihu.com/p/83782208),如果有版权问题请联系我.

# 总结

这个生命周期和iOS中的UIViewController很像.
利用周末的时间学习一些新的技术,  秉承边战斗边学习的态度.

[参考](https://www.geeksforgeeks.org/life-cycle-of-flutter-widgets/)