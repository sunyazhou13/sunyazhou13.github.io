---
layout: post
title: SwiftUI第二章学习总结
date: 2023-06-18 18:52 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS, Objective-C, SwiftUI]
typora-root-url: ..
---

![](/assets/images/20230604LearnSwiftUIChapter1/swiftuilogo.avif)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# SwiftUI课程

最近在听B站以为来自祖国宝岛台湾省的一个女博主(声音很嗲dia)讲解SwiftUI课程,讲的不错把学习的内容记录下来:

## 主要内容包含

* @propertyWrapper
* VStack、HStack、ZStack等使用
* 封装extension处理颜色、转场动画、ShapeStyle
* @ViewBuilder、Group容器使用、Grid的行列使用


#### 属性封装器

创建了一个`SwiftUI`的类`SuffixWrapper.swift`

``` swift
//
//  SuffixWrapper.swift
//  FoodPicker
//
//  Created by sunyazhou on 2023/6/18.
//

import Foundation
import SwiftUI

@propertyWrapper struct Suffix: Equatable {
    var wrappedValue: Double
    private let suffix: String
     
    init(wrappedValue: Double, _ suffix: String) {
        self.wrappedValue = wrappedValue
        self.suffix = suffix
    }
    
    var projectedValue : String {
        wrappedValue.formatted() + " \(suffix)"
    }
}
```

> 这里记录一下遇到的坑是`projectedValue `

在使用的代码的时候如果想让左右Double类型的变量提供一个 字符串 以` g`结尾的字符串变量可以使用这个属性封装器.

``` swift
selectedFood.$protein  //用$加变量名称就是访问的projectedValue
```

这个主要看下 Food模型代码大家可以一目了然我说的是什么意思了.

``` swift
import Foundation

struct Food: Equatable {
    var name: String
    var image: String
    
    @Suffix("大卡") var calorie : Double = .zero
    @Suffix("g") var carb      : Double = .zero
    @Suffix("g") var fat       : Double = .zero
    @Suffix("g") var protein   : Double = .zero
    
    static let examples = [
        Food(name: "漢堡", image: "🍔", calorie: 294, carb: 14, fat: 24, protein: 17),
        Food(name: "沙拉", image: "🥗", calorie: 89, carb: 20, fat: 0, protein: 1.8),
        Food(name: "披薩", image: "🍕", calorie: 266, carb: 33, fat: 10, protein: 11),
        Food(name: "義大利麵", image: "🍝", calorie: 339, carb: 74, fat: 1.1, protein: 12),
        Food(name: "雞腿便當", image: "🍗🍱", calorie: 191, carb: 19, fat: 8.1, protein: 11.7),
        Food(name: "刀削麵", image: "🍜", calorie: 256, carb: 56, fat: 1, protein: 8),
        Food(name: "火鍋", image: "🍲", calorie: 233, carb: 26.5, fat: 17, protein: 22),
        Food(name: "牛肉麵", image: "🐄🍜", calorie: 219, carb: 33, fat: 5, protein: 9),
        Food(name: "關東煮", image: "🥘", calorie: 80, carb: 4, fat: 4, protein: 6),
    ]
}
```

> 带@Suffix关键字就是我们自定义的属性封装器,为普通变量提供一个字符串带`g`后缀的字符方法

####  VStack、HStack、ZStack等使用

他们分别是:

* 纵轴
* 横轴
* Z轴

> 注意: 它最多支持10层视图,如果超过了请使用Group圈一下.

这里说几个比较重要的点

当搭配这些视图使用的时候 避免不了子视图之间要用间距,SwiftUI提供了默认的间距对象

``` swift
Spacer().layoutPriority(1)  //注意这里的layoutPriority(1)
```

当我们留有空白大小的位置需要填充时可以使用`Spacer()`,这玩意有个坑就是如果外不各种Stack不给定它大小他将平均取所有Stack中最小的. 需要给它提高优先级让它提前布局知道还剩余多大空间需要撑满,才不会显示异常.所以使用`layoutPriority(1)`为了让它提前推导出它需要的空白大小.

容器的外部设置可以自动被继承给子容器(这里的容器eg: ScrollView、VStack...)

``` swift
ScrollView {
            VStack(spacing: 30) {
                foodImage
                Text("今天吃什么?").bold()
                selectedFoodInfoView
                Spacer().layoutPriority(1)
                selectFoodButton
                cancelButton
            }
            .padding()
            .frame(maxWidth: .infinity, minHeight: UIScreen.main.bounds.height - 100)
            .font(.title)
            .mainButtonStyle()
            .animation(.mySpring, value: shouldShowInfo)
            .animation(.myEase, value: selectedFood)
        }
        .background(.bg2)
```
假设`.background(.bg2)`默认VStack也是`.bg2`颜色的背景

#### 封装extension处理颜色、转场动画、ShapeStyle

SwiftUI里面比objc中使用 扩展更加频繁

``` swift
//
//  Extensions.swift
//  FoodPicker
//
//  Created by sunyazhou on 2023/6/18.
//

import Foundation
import SwiftUI

extension View {
    func mainButtonStyle() -> some View {
        buttonStyle(.borderedProminent)
            .buttonBorderShape(.capsule)
            .controlSize(.large)
    }
    
    func roudedRectBackground(radius: CGFloat = 8,
                              fill: some ShapeStyle = .bg ) -> some View {
        background(RoundedRectangle(cornerRadius: radius).fill(fill))
    }
}

extension Animation {
    static let mySpring = Animation.spring(dampingFraction: 0.55)
    static let myEase = Animation.easeInOut(duration: 0.6)
}

extension ShapeStyle where Self == Color {
    static var bg: Color {  Color(.systemBackground) }
    static var bg2: Color { Color(.secondarySystemBackground) }
}

extension AnyTransition {
    static let delayInsertionOpacity = Self.asymmetric(
        insertion:.opacity.animation(.easeInOut(duration: 0.5).delay(0.2)),
        removal:.opacity.animation(.easeInOut(duration: 0.4))
    )
    
    static let moveUpWithOpacity = Self.move(edge: .top).combined(with: .opacity)
}

```

这里说一下这个`extension ShapeStyle where Self == Color`

因为有一个协议叫`ShapeStyle `不单纯是一个颜色或者填充的对象可以设置背景颜色,其它类似渐变的图像也算使用遵守`ShapeStyle `的样式.这里准确来说`Color`只是ShapeStyle的一种.

当我们访问颜色的时候正常用的是

``` swift
Color().bg2  //bg2颜色
```

而符合`ShapeStyle`协议的对象可以直接用

``` swift
.bg2 //设置颜色 省略了输入Color
```

#### @ViewBuilder、Group容器使用、Grid的行列使用

`@ViewBuilder`限制了some View中 例如VStack、HStack等各种Stack的数量最多十层

如果想使用的话需要把多级视图用`Group `或者`Grid`圈起来

这样说你可能理解不了我举个例子:

假设一个ViewBuilder的UIView最多让你`addSubView:`10次,你有很多subview,那么你就需要把你的subview按照你的功能划分或者规则 几个放在一个UIView上,假设它就叫GroupView吧,让后把GroupView的实例add到符合`ViewBuilder `的协议View上.这样就相当于一个Group里面可以放1~9个不等, 但是你最终提供的还是一个UIView的实例add到上去了.

> 这就相当于跳板原理,一个公司有一个局域网、但是交换机最多有10个端口,为了让更多人加入必须通过1拖10的形式增设交换机来满足更多人上网的需求.这样你理解了吧!

至于为啥是10个 我找到了这样的代码

``` swift
@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
extension ViewBuilder {

    public static func buildBlock<C0, C1, C2, C3, C4, C5, C6, C7, C8, C9>(_ c0: C0, _ c1: C1, _ c2: C2, _ c3: C3, _ c4: C4, _ c5: C5, _ c6: C6, _ c7: C7, _ c8: C8, _ c9: C9) -> TupleView<(C0, C1, C2, C3, C4, C5, C6, C7, C8, C9)> where C0 : View, C1 : View, C2 : View, C3 : View, C4 : View, C5 : View, C6 : View, C7 : View, C8 : View, C9 : View
}
```

如果你想让它支持更多你得处理他们的顺序关系,这是它提供最多处理各种层级关系的函数接口没有实现代码.不知道我们自己为它扩展行不行!

#### Group 和 Grid

Group相当于Fultter里面的container.可以当几个视图进去进行统一配置,采用统一管理,内部子视图可以默认使用它的配置也可以覆盖它的配置修改使用自己的配置,总之就是帮开发者做了很多统一管理子视图的容器,想自定义需要自己配置就好.

Grid 使格子布局那种 应该是iOS16以后推出的类似Group一样的容器,主要是负责管理N行N列这种类似Excel表格一样的制表容器.能加分割线

``` swift
VStack {
	    if (shouldShowInfo) {
	        Grid {
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
	.frame(maxWidth: .infinity)
	.clipped()
```
分割线`Divider`

也可以使用下面代码手动加分割

``` swift
HStack {
            VStack(spacing: 12) {
                Text("蛋白质")
                Text(selectedFood!.protein.formatted() + " g")
            }
            Divider().frame(width: 1).padding(.horizontal)
            VStack(spacing: 12) {
                Text("脂肪")
                Text(selectedFood!.fat.formatted() + " g")
            }
            Divider().frame(width: 1).padding(.horizontal)
            VStack(spacing: 12) {
                Text("碳水")
                Text(selectedFood!.carb.formatted() + " g")
            }
        }
        .font(.title3)
        .padding(.horizontal)
        .padding()
        .background(RoundedRectangle(cornerRadius: 8).foregroundColor(Color(.systemBackground)))
```

# 总结

工作时间很紧张,周末有时间记录一些重要容易被遗忘的内容,很水,希望大家不要介意.第二章比较实用一些,希望能记录和分享技术.天气太热了,住在没有空调的北京某出租屋,学习真的是一件汗流浃背,体验酷暑的苦涩经历.


[第二章demo](https://github.com/sunyazhou13/FoodPicker)  
[2-1 排版练习 (1/2) - SwiftUI 新手入门](https://www.bilibili.com/video/BV1pW4y1j7MC/?spm_id_from=333.788&vd_source=9309f71afe97e633abeadc8407870e76)