---
layout: post
title: SwiftUI Chapter 2 Study Summary
date: 2023-06-18 18:52 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS, Objective-C, SwiftUI]
typora-root-url: ..
math: false
mermaid: false

---

![swiftuilogo](/assets/images/20230604LearnSwiftUIChapter1/swiftuilogo.avif)

# Preface

This article is strongly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. You are welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# SwiftUI Course

Recently I've been listening to a female blogger from Taiwan Province on Bilibili (with a very sweet voice) explain a SwiftUI course. She explains it well, so I'm recording what I've learned:

## Main Content Includes

* @propertyWrapper
* Using VStack, HStack, ZStack, etc.
* Wrapping extensions to handle colors, transition animations, and ShapeStyle
* @ViewBuilder, using the Group container, using Grid rows and columns


#### Property Wrapper

Created a `SwiftUI` class `SuffixWrapper.swift`

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

> Here I'll note a pitfall I encountered: `projectedValue`.

When using the code, if you want a Double-typed variable to also provide a string ending with ` g`, you can use this property wrapper.

``` swift
selectedFood.$protein  //用$加变量名称就是访问的projectedValue
```

Let's mainly look at the Food model code, and you'll understand what I mean at a glance.

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

> The `@Suffix` keyword marks our custom property wrapper, providing a string with a `g` suffix for ordinary variables.

#### Using VStack, HStack, ZStack, etc.

They are respectively:

* Vertical axis
* Horizontal axis
* Z axis

> Note: it supports at most 10 layers of views. If you exceed that, wrap them with a Group.

Here are a few important points.

When using these views together, you can't avoid needing spacing between child views. SwiftUI provides a default spacing object.

``` swift
Spacer().layoutPriority(1)  //注意这里的layoutPriority(1)
```

When you have blank space that needs filling, you can use `Spacer()`. There's a pitfall: if the surrounding Stacks don't give it a size, it will average to the smallest of all the Stacks. You need to raise its priority so it lays out early and knows how much remaining space it needs to fill, otherwise the display will be wrong. So `layoutPriority(1)` is used to let it derive the blank size it needs ahead of time.

External settings of a container can be automatically inherited by child containers (the containers here, e.g., ScrollView, VStack...).

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
So with `.background(.bg2)`, the VStack also gets a `.bg2` colored background by default.

#### Wrapping Extensions for Colors, Transition Animations, and ShapeStyle

Extensions are used much more frequently in SwiftUI than in Objective-C.

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

Let me talk about this `extension ShapeStyle where Self == Color`.

There's a protocol called `ShapeStyle`: it's not simply a color; any fillable object that can set a background color — such as gradients — also counts as conforming to `ShapeStyle`. To be precise, `Color` is just one kind of `ShapeStyle`.

When we access a color, normally we use:

``` swift
Color().bg2  //bg2颜色
```

But objects conforming to the `ShapeStyle` protocol can directly use:

``` swift
.bg2 //设置颜色 省略了输入Color
```

#### @ViewBuilder, Using the Group Container, Using Grid Rows and Columns

`@ViewBuilder` limits the number of views in `some View` — e.g., the various Stacks like VStack, HStack — to at most ten layers.

If you want to use more, you need to wrap the nested views in a `Group` or `Grid`.

You may not get it from this explanation, so let me give an example:

Suppose a ViewBuilder UIView lets you call `addSubview:` at most 10 times, but you have many subviews. Then you need to group your subviews — by function or by some rule — several onto one UIView; let's call it GroupView. Then add a GroupView instance to the View conforming to the `ViewBuilder` protocol. So a Group can hold anywhere from 1 to 9 views, but what you ultimately provide is still a single UIView instance being added.

> This is like the "switch hub" principle: a company has one LAN, but a switch has at most 10 ports. To let more people join, you must add switches in a 1-to-10 daisy-chain fashion to satisfy more people's networking needs. Now you get it!

As for why it's 10, I found this code:

``` swift
@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
extension ViewBuilder {

    public static func buildBlock<C0, C1, C2, C3, C4, C5, C6, C7, C8, C9>(_ c0: C0, _ c1: C1, _ c2: C2, _ c3: C3, _ c4: C4, _ c5: C5, _ c6: C6, _ c7: C7, _ c8: C8, _ c9: C9) -> TupleView<(C0, C1, C2, C3, C4, C5, C6, C7, C8, C9)> where C0 : View, C1 : View, C2 : View, C3 : View, C4 : View, C5 : View, C6 : View, C7 : View, C8 : View, C9 : View
}
```

If you want it to support more, you'd have to handle the ordering relationships yourself. This is the most function interface it provides for handling various hierarchies, with no implementation code. I wonder whether we could extend it ourselves!

#### Group and Grid

Group is like the container in Flutter. You can put several views into it for unified configuration and unified management. The inner child views can use its configuration by default, or override it and use their own. In short, it's a container that does a lot of unified child-view management for developers; if you want customization, just configure it yourself.

Grid is a grid-style layout — a container similar to Group, introduced around iOS 16. It mainly manages N-row N-column layouts, like an Excel-style tabular container. It can add dividers.

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
The divider is `Divider`.

You can also manually add separators with the code below:

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

# Summary

Work keeps me busy. On weekends, when I have time, I record some important, easily forgotten content. It's pretty shallow, and I hope you don't mind. Chapter 2 is a bit more practical; I hope to record and share the techniques. The weather is too hot — living in an un-air-conditioned rental room in Beijing, studying is really a sweat-drenched, bitter hot-summer experience.


[Chapter 2 demo](https://github.com/sunyazhou13/FoodPicker)  
[2-1 Layout Practice (1/2) - SwiftUI Beginner's Guide](https://www.bilibili.com/video/BV1pW4y1j7MC/?spm_id_from=333.788&vd_source=9309f71afe97e633abeadc8407870e76)
