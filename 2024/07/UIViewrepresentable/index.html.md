---
layout: post
title: 使用UIViewRepresentable  在SwiftUI中桥接 UIKit 视图
date: 2024-07-26 14:28 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---


![](/assets/images/20240726UIViewrepresentable/UIViewRepresentable.webp)


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

## UIViewRepresentable介绍

`UIViewRepresentable` 是 SwiftUI 框架中的一个协议，它主要用于在 SwiftUI 环境中封装 UIKit 视图（`UIView` 及其子类）。SwiftUI 是 Apple 推出的一个用于构建跨平台用户界面的现代框架，它支持 iOS、macOS、watchOS 和 tvOS。然而，由于 SwiftUI 是在相对较新的时间点上推出的，许多现有的 UIKit 视图和控件尚未被直接集成到 SwiftUI 中。

`UIViewRepresentable` 协议允许开发者将 UIKit 视图桥接到 SwiftUI 视图系统中，使得在 SwiftUI 应用中能够利用 UIKit 强大的功能和现有的 UIKit 组件。通过使用 `UIViewRepresentable`，开发者可以创建一个 SwiftUI 视图，该视图内部封装了一个或多个 UIKit 视图，并在 SwiftUI 的视图中进行管理。

## 如何使用 UIViewRepresentable

* **定义一个遵循`UIViewRepresentable`的`SwiftUI`视图**：你需要创建一个 SwiftUI 视图，该视图遵循`UIViewRepresentable`协议。
* **实现协议要求的两个方法：**

	* `makeUIView(context: Context) -> UIView`：这个方法用于创建并返回一个 UIKit 视图实例。这个视图将被封装在 SwiftUI 视图内部。
	*  `updateUIView(_ uiView: UIViewType, context: Context)`：当 SwiftUI 视图需要更新其内部封装的 UIKit 视图时，会调用这个方法。你可以在这里设置 UIKit 视图的属性或添加子视图等。
* **在 SwiftUI 视图层次结构中使用你的封装视图**：创建并初始化你的封装视图后，就可以像使用其他 SwiftUI 视图一样在界面中使用它了。

#### 示例

以下是一个简单的示例，展示了如何使用`UIViewRepresentable`来封装一个 UIKit 的 `UIButton`：

``` swift
import SwiftUI  
import UIKit  
  
struct MyButton: UIViewRepresentable {  
    func makeUIView(context: Context) -> UIButton {  
        let button = UIButton()  
        button.setTitle("Click Me", for: .normal)  
        button.addTarget(context.coordinator, action: #selector(Coordinator.buttonPressed), for: .touchUpInside)  
        button.backgroundColor = .blue  
        return button  
    }  
  
    func updateUIView(_ uiView: UIButton, context: Context) {  
        // 这里可以根据需要更新按钮  
    }  
  
    class Coordinator: NSObject {  
        @objc func buttonPressed() {  
            print("Button was pressed!")  
        }  
    }  
  
    func makeCoordinator() -> Coordinator {  
        return Coordinator()  
    }  
}
```

在这个示例中，`MyButton` 是一个封装了 `UIButton` 的 SwiftUI 视图。我们设置了按钮的标题、颜色，并添加了一个点击事件的处理器。点击事件通过`Coordinator`类来处理，这是`UIViewRepresentable`协议的一个常见模式，用于处理 UIKit 视图中的事件。


### `UIViewRepresentable` 中的 `makeCoordinator` 方法调用时机  
  
在 SwiftUI 的 `UIViewRepresentable` 协议中，`makeCoordinator` 方法扮演着重要的角色，尤其是在处理 UIKit 视图中的事件和回调时。以下是关于 `makeCoordinator` 方法调用时机的详细说明。  
  
## 调用时机  
  
### 1. 视图创建与渲染  
  
- 当 SwiftUI 需要渲染 `UIViewRepresentable` 视图时，这通常发生在该视图首次被添加到视图层次结构中，或者当 SwiftUI 决定需要重新渲染该视图（例如，由于状态变化或布局更新）时。  
  
### 2. `makeUIView` 调用  
  
- 在 `UIViewRepresentable` 视图准备将其内部的 UIKit 视图添加到视图层次结构之前，`makeUIView` 方法会被调用。这个方法负责创建并返回一个 UIKit 视图实例。  
  
### 3. `makeCoordinator` 调用  
  
- 紧接着 `makeUIView` 方法之后（或者在某些情况下，可能几乎同时），`makeCoordinator` 方法会被调用。这个方法的目的是创建一个协调器（coordinator）对象，该对象通常用于处理 UIKit 视图中的事件或回调。  
  
### 4. 协调器与 UIKit 视图交互  
  
- 在 `makeUIView` 中，你可能会设置 UIKit 视图的一些属性或事件监听器，这些监听器可以指向协调器中的方法。这样，当 UIKit 视图中的事件发生时（如按钮点击），相应的协调器方法就会被调用。  
  
### 5. `updateUIView` 的可能调用  
  
- 在 `UIViewRepresentable` 视图的生命周期中，如果其状态发生变化，并且这些变化需要反映在其内部的 UIKit 视图上，那么 `updateUIView` 方法可能会被调用。这个方法允许你根据 `UIViewRepresentable` 视图的状态更新其内部的 UIKit 视图。  
  
## 关键点  
  
- `makeCoordinator` 方法在 `UIViewRepresentable` 视图实例的生命周期中只会被调用一次（除非视图被重新创建，例如，由于内存回收和重新加载）。  
- 一旦协调器对象被创建，它就会通过 `Context` 参数与 `UIViewRepresentable` 视图保持关联，直到视图被销毁。  
- 你可以将 `makeCoordinator` 方法视为初始化 `UIViewRepresentable` 视图时设置事件处理和回调逻辑的一部分。  
  
通过理解 `makeCoordinator` 的调用时机，你可以更有效地在 SwiftUI 应用中桥接 UIKit 视图，并处理它们之间的事件和交互。