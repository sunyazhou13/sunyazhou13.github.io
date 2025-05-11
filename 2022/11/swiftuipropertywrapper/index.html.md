---
layout: post
title: SwiftUI属性包装器:State、Binding、ObservableObject、EnvironmentObject
date: 2022-11-25 18:45 +0800
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---

![](/assets/images/20221125SwiftUIPropertyWrapper/swiftUIPropertyWrappers.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!



## 主要内容

本文主要讲述SwiftUI中的属性包装器，这些包装器都是用来数据绑定的，作为视图的唯一真值来源，四种方式在实现功能上有细微差别。最后会进行总结比较

* State
* Binding
* ObservableObject
* EnvironmentObject

#### 1.@State

SwiftUI管理声明为`state`的存储属性。当值发生变化时，`SwiftUI`会更新视图层次结构中依赖于该值的部分。使用`@State`作为存储在视图层次结构中的给定值的唯一真值来源。

`@State`修饰的属性虽然是存储属性，但是我们可以进行读写操作。  

父视图和子视图进行传递该属性只能是值传递。  

需要在属性名称前加上一个美元符号$来获得这个值。因为它是投影属性

代码：

``` swift
struct ContentView: View {
    @State private var str: String = ""
    var body: some View {
        VStack {
            TextField("Placeholder", text: $str)
            Text("\(str)")
        }
    }
}
```

说明:

1. 在str上设置了@State修饰，那么我在文本输入框中输入的数据，就会传入到str中
2. 同时str又绑定在文本视图上，所以会将文本输入框输入的文本显示到文本视图上
3. 这就是数据绑定的快捷实现。

> 注意:     

> * 不要在视图层次结构中实例化视图的位置初始化视图的状态属性，因为这可能与SwiftUI提供的存储管理冲突。  
> * 为了避免这种情况，总是将state声明为private，并将其放在视图层次结构中需要访问该值的最高视图中。  
> *  然后与任何也需要访问的子视图共享该状态，可以直接用于只读访问，也可以作为读写访问的绑定。


#### 2. Binding

`@State`修饰的属性是值传递，因此在父视图和子视图之间传递属性时。子视图针对属性的修改无法传递到父视图上。  

`Binding`修饰后会将属性会变为一个引用类型，视图之间的传递从值传递变为了引用传递，将父视图和子视图的属性关联起来。这样子视图针对属性的修改，会传递到父视图上。

需要在属性名称前加上一个美元符号$来获得这个值。因为它是投影属性

下面代码在主视图上添加一个`BtnView`视图，视图上添加一个按钮，按钮点击后修改`isShowText`变量。这里的变量通过传入参数与主视图的`isShowText`进行绑定。绑定到主视图的`isShowText`变量上。主视图的变量用来决定文本视图的隐藏和显示。

示例代码:

``` swift
struct BtnView: View {
    @Binding var isShowText: Bool
    
    var body: some View {
        Button {
            isShowText.toggle()
        } label: {
            Text("点击")
        }

    }
}

struct ContentView: View {
    @State private var isShowText: Bool = true
    var body: some View {
        VStack {
            if(isShowText) {
                Text("点击后会被隐藏")
            } else {
                Text("点击后会被显示").hidden()
            }
            BtnView(isShowText: $isShowText)
        }
    }
}
```

说明:

1. 按钮在BtnView视图中，并且通过点击，修改isShowText的值。
2. 将BtnView视图添加到ContentView上作为它的子视图。并且传入isShowText。
3. 此时的传值是指针传递，会将点击后的属性值传递到父视图上。
4. 父视图拿到后也作用在自己的属性，因此他的文本视图会依据该属性而隐藏或显示
5. 如果将`@Binding`改为`@State`，会发现点击后不起作用。这是因为值传递子视图的更改不会反映到父视图上

#### 3.@ObservableObject

对实例进行监听，其用处和@State非常相似，只不过必须是对象，而且这个被监听的对象可以被多个视图使用。需要注意用法

``` swift
class DelayedUpdater: ObservableObject {
    @Published var value = 0
    init() {
        for i in 1...10 {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i)) {
                self.value += 1
            }
        }
    }
}

struct ContentView: View {
    @ObservedObject var updater = DelayedUpdater()
    var body: some View {
        VStack {
            Text("\(updater.value)").padding()
        }
    }
}
```

说明:

1. 绑定的数据是一个对象。
2. 被修饰的对象，其类必须遵守ObservableObject协议
3. 此时这个类中被@Published修饰的属性都会被绑定
4. 使用@ObservedObject修饰这个对象，绑定这个对象。
5. 被@Published修饰的属性发生改变时，SwiftUI就会进行更新。
6. 这里当value值会随着时间发生改变。所以updater对象也会发生改变。此时文本视图的内容就会不断更新。

#### 4.@EnvironmentObject

在多视图中，为了避免数据的无效传递，可以直接将数据放到环境中，供多个视图进行使用。

``` swift
struct EnvView: View {
    @EnvironmentObject var updater: DelayedUpdater
    
    var body: some View {
        Text("\(updater.value)")
    }
}

struct BtnvView: View {
    @EnvironmentObject var updater: DelayedUpdater
    
    var body: some View {
        Text("\(updater.value)")
    }
}
struct ContentView: View {
    let updater = DelayedUpdater()
    var body: some View {
        VStack {
            EnvView().environmentObject(updater)
            BtnvView().environmentObject(updater)
        }
    }
}

```

说明：

* 给属性添加@EnvironmentObject修改，就将其放到了环境中。
* 其他视图中想要获取该属性，可以通过.environmentObject从环境中获取。
* 可以看到分别将EnvView和BtnvView的属性分别放到了环境中
* 之后我们ContentView视图中获取数据时，可以直接通过环境获取。
* 不需要将数据传递到ContentView，而是直接通过环境获取，这样避免了无效的数据传递，更加高效
* 如果是在多层级视图之间进行传递，会有更明显的效果。


# 总结

* @State将属性和视图进行绑定，是唯一真实数据源。子视图和父视图之间是值传递
* @Binding在子视图和父视图之间是指针传递
* @ObservableObject只能监听对象，并且可以在多个视图中监听
* @EnvironmentObject将数据放到环境中，更适用在多视图中

[参考SwiftUI教程（七）属性包装器](https://juejin.cn/post/7112984613102092325)  
[SwiftUI教程系列文章汇总](https://juejin.cn/post/7110918270743478279)
