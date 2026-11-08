---
layout: post
title: "SwiftUI Property Wrappers: State, Binding, ObservableObject, EnvironmentObject"
date: 2022-11-25 18:45 +0800
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

![swift UI Property Wrappers](/assets/images/20221125SwiftUIPropertyWrapper/swiftUIPropertyWrappers.avif)

# Preface

This article carries strong personal sentiments. If you find it uncomfortable to read, please close it. This article is for personal learning records only. You're welcome to repost or share it within the scope of the license — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!



## Main Content

This article focuses on property wrappers in SwiftUI. These wrappers are all used for data binding as the single source of truth for views. The four approaches have subtle differences in functionality. A summary and comparison will be provided at the end.

* State
* Binding
* ObservableObject
* EnvironmentObject

#### 1. @State

SwiftUI manages the stored property declared as `state`. When the value changes, `SwiftUI` updates the parts of the view hierarchy that depend on that value. Use `@State` as the single source of truth for a given value stored in the view hierarchy.

Although the property modified by `@State` is a stored property, we can perform read and write operations on it.

When passing this property between parent and child views, only value passing is allowed.

You need to prefix the property name with a dollar sign `$` to access this value, because it is a projected value.

Code:

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

Explanation:

1. With @State modifier on str, any text entered in the text field will be passed into str.
2. Since str is also bound to the text view, the text entered in the text field will be displayed in the text view.
3. This is a quick implementation of data binding.

> Note:

> * Do not initialize a view's state property at the location in the view hierarchy where the view is instantiated, as this may conflict with the storage management provided by SwiftUI.
> * To avoid this, always declare state as private, and place it in the highest view in the view hierarchy that needs access to the value.
> * Then share the state with any child views that also need access — either directly for read-only access, or as a binding for read-write access.


#### 2. Binding

The property modified by `@State` uses value passing, so when passing properties between parent and child views, modifications made by the child view cannot be propagated to the parent view.

When modified with `Binding`, the property becomes a reference type, and the passing between views changes from value passing to reference passing, linking the parent and child view properties together. This way, modifications made by the child view to the property will be propagated to the parent view.

You need to prefix the property name with a dollar sign `$` to access this value, because it is a projected value.

The following code adds a `BtnView` view to the main view. The view has a button that modifies the `isShowText` variable when clicked. Here, the variable is bound to the main view's `isShowText` through a passed parameter. The main view's variable controls the hiding and showing of the text view.

Example code:

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

Explanation:

1. The button is in the BtnView view, and clicking it modifies the value of isShowText.
2. The BtnView view is added to ContentView as a child view, with isShowText passed in.
3. The passing here is by reference, so the modified property value is propagated to the parent view.
4. The parent view then applies it to its own property, so its text view will hide or show based on that property.
5. If you change `@Binding` to `@State`, you'll find that clicking has no effect. This is because with value passing, the child view's changes are not reflected in the parent view.

#### 3. @ObservableObject

Used to listen to instances. Its usage is very similar to @State, except that it must be an object, and the listened object can be used by multiple views. Note the usage:

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

Explanation:

1. The bound data is an object.
2. The class of the modified object must conform to the ObservableObject protocol.
3. All properties in this class modified with @Published will be bound.
4. Use @ObservedObject to modify this object and bind to it.
5. When a property modified with @Published changes, SwiftUI will update accordingly.
6. Here, the value changes over time, so the updater object also changes. The text view content will continuously update.

#### 4. @EnvironmentObject

In multi-view scenarios, to avoid inefficient data passing, you can place data directly in the environment for multiple views to use.

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

Explanation:

* Adding the @EnvironmentObject modifier to a property places it in the environment.
* Other views that want to access this property can retrieve it from the environment via .environmentObject.
* You can see that EnvView and BtnvView's properties are each placed in the environment.
* When we access data in the ContentView, we can retrieve it directly through the environment.
* There's no need to pass data to ContentView — it's retrieved directly through the environment, avoiding inefficient data passing and making it more efficient.
* The effect is more pronounced when passing data between deeply nested view hierarchies.


# Summary

* @State binds a property to a view as the single source of truth. Value passing is used between child and parent views.
* @Binding uses reference passing between child and parent views.
* @ObservableObject can only listen to objects and can be observed across multiple views.
* @EnvironmentObject places data in the environment, making it more suitable for multi-view scenarios.

[Reference: SwiftUI Tutorial (7) Property Wrappers](https://juejin.cn/post/7112984613102092325)  
[SwiftUI Tutorial Series Article Index](https://juejin.cn/post/7110918270743478279)
