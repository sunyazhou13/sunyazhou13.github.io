---
layout: post
title: SwiftUI第三章学习总结
date: 2023-08-05 14:13 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS, Objective-C, SwiftUI]
typora-root-url: ..
---

![](/assets/images/20230604LearnSwiftUIChapter1/swiftuilogo.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## SwiftUI课程

最近坚持学习swiftUI已经学习到第三章了,把一些重要的内容都记录下来

### 主要内容包括

* present子VC
* 用enum管理icon
* 注释中可以使用markdown
* extension写法

### present子VC

在swiftUI中不能说是弹出VC而是弹出 some View的视图.

``` swift
var foodDetailView: some View {
        VStack {
            if (shouldShowInfo) {
                Grid(horizontalSpacing: 12, verticalSpacing: 12) {
                    GridRow {
                        Text("蛋白质")
                        Text("脂肪")
                        Text("碳水")
                    }.frame(minWidth: 40)
                    
                    Divider()
                        .gridCellUnsizedAxes(.horizontal)
                        .padding(.horizontal, -10)
                    
                    GridRow {
                        Text(selectedFood!.$protein)
                        Text(selectedFood!.$carb)
                        Text(selectedFood!.$fat)
                    }
                }
                .font(.title3)
                .padding(.horizontal)
                .padding()
                .roudedRectBackground()
                .transition(.moveUpWithOpacity)
            }
        }
        .maxWidth()
        .clipped()
    }
```

其实就是创建一个View就完事了根本不需要复杂的操作,没有 我们在UIKit中的push和pop,或者present和dismiss。这里基本都是一些视图基于状态的监听 show不show改变了我们之前的使用方式.

### 用enum管理icon

当使用icon多了的时候需要用变量来从统一的数据源取图,因为swift的枚举可以声明各种类型,一般都是字符串.所以字符串枚举变量就应声而出 

``` swift
import SwiftUI

enum SFSymbol: String {
    case pencil
    case plus = "plus.circle.fill"
    case chevronUp = "chevron.up"
    case chevronDown = "chevron.down"
    case xmark = "xmark.circle.fill"
    case forkAndKnife = "fork.knife"
    case info = "info.circle.fill"
}

extension SFSymbol : View {
    var body: Image {
        Image(systemName: rawValue)
    }
    
    func resizable() -> Image {
        self.body.resizable()
    }
}

extension Label where Title == Text, Icon == Image {
    init(_ text: String, systemImage: SFSymbol) {
        self.init(text, systemImage: systemImage.rawValue)
    }
}
```

使用的时候

``` swift
var addButton : some View {
        Button {
            sheet = .newFood { food.append($0) }
        } label: {
            SFSymbol.plus  //直接使用
                .font(.system(size: 50))
                .padding()
                .symbolRenderingMode(.palette)
                .foregroundStyle(.white, Color.accentColor.gradient)
        }
    }
```

####  注释中可以使用markdown

先看两个函数

``` swift
/// - Tag:push
func push(to alignment: TextAlignment) -> some View {
    switch alignment {
    case .leading:
        return frame(maxWidth: .infinity, alignment:  .leading)
    case .center:
        return frame(maxWidth: .infinity, alignment:  .center)
    case .trailing:
        return frame(maxWidth: .infinity, alignment:  .trailing)
    }
}
    
/// 使用最大宽度 Shortcut:[push(to:.center)](x-source-tag://push)
func maxWidth() -> some View {
    push(to: .center)
}
```

> 注意: /// 使用最大宽度 Shortcut:\[push(to:.center)\](x-source-tag://push)

你发现没有注释默认支持了markdown

![](/assets/images/20230805LearnSwiftUIChapter3/note1.webp)

蓝色跳转拦截的函数声明 `/// - Tag:push`, `Tag`必须大小写写清楚,不能有空格,使用`x-source-tag`的`scheme`跳转至`push`

![](/assets/images/20230805LearnSwiftUIChapter3/note2.webp)

### extension写法

当给swift工程写很多扩展之后,类会变得越来越多并且越来越不好管理,为了解决不好管理,可读性差问题

我们约定俗成,**当创建swift扩展的时候使用尾部文件追加+号来命名**

如下图:  

![](/assets/images/20230805LearnSwiftUIChapter3/extension.webp)

# 总结

第三章的内容特别漫长,需要有耐心, 中间还讲了一个表单,我没有在这里表述是因为 东西多而且还复杂,需要大家认真看视频比我在这里写总结要更有说服力. 

[第三章课程链接](https://www.bilibili.com/video/BV1A84y147o8/?spm_id_from=333.880.my_history.page.click&vd_source=9309f71afe97e633abeadc8407870e76)  
[工程代码](https://github.com/jane-chao/SwiftUIBeginnerCourse)  
[本文完结代码示例](https://github.com/sunyazhou13/FoodPicker)

