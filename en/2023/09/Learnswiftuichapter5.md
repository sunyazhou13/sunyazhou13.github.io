---
layout: post
title: SwiftUI Chapter 5 Study Summary
date: 2023-09-09 15:55 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS, Objective-C, SwiftUI]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This article carries strong personal sentiment. If it makes you uncomfortable, please close it as soon as possible. This article is only for personal study records. Reprinting or sharing within the scope of the license is also welcome. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

## The SwiftUI Course

I've been persisting in learning SwiftUI recently. Over the weekend, when I had free time, I finished Chapter 4. What I mean by "watching" is hands-on practice plus tutorial study. Let me record some content that's easy to forget.

### Main Contents

* Handling the TabBar transparency issue
* Handling unit formatting issues

### The TabBar Transparency Issue

After building various UIs with SwiftUI, I found that the TabBar view was being obscured,

![before](/assets/images/20230805LearnSwiftUIChapter5/before.avif)
![after](/assets/images/20230805LearnSwiftUIChapter5/after.avif)

and you need to use the following function `applyTabbarBackground()` when the app launches.

``` swfit
import SwiftUI

@main
struct AppEntry: App {
    init() {
        applyTabbarBackground()
    }
    
    var body: some Scene {
        WindowGroup {
            HomeScreen()
        }
    }
    
    func applyTabbarBackground() {
        let tabbarAppearence = UITabBarAppearance()
        tabbarAppearence.configureWithTransparentBackground()
        tabbarAppearence.backgroundColor = .secondarySystemBackground.withAlphaComponent(0.3)
        tabbarAppearence.backgroundEffect = UIBlurEffect(style: .systemChromeMaterial)
        UITabBar.appearance().scrollEdgeAppearance = tabbarAppearence
    }
}
```

#### Handling Unit Formatting Issues

The iOS system provides an internationalized unit class, `Measurement`, to handle units like grams, g, pounds, etc.

``` swift
var desciption : String {
        let preferredUnit = Unit.getPreferredUnit(from: store)
        let measureMent = Measurement(value: wrappedValue, unit: unit.dimension)
        let converted = measureMent.converted(to: preferredUnit.dimension)
//        return converted.formatted(.measurement(width: .abbreviated, usage: .asProvided, numberFormatStyle: .number.precision(.fractionLength(0...1))))
        return converted.value.formatted(.number.precision(.fractionLength(0...1))) + " " + preferredUnit.localizedSymbol
    }
```

Here I recommend checking out the official WWDC20 video [Formatters: Make data human-friendly](https://developer.apple.com/videos/play/wwdc2020/10160/)

The video introduces tools that can format data such as dates, units, numbers, and text according to the user's Locale.

# Summary

Actually, Chapter 5 talks a lot about the high-level wrapping of property wrappers. I think the content is too long; rather than me writing it all out here, you're better off watching the [tutorial video](https://www.bilibili.com/video/BV1bA411y71h/?spm_id_from=333.788&vd_source=9309f71afe97e633abeadc8407870e76) yourself — the explanations are quite thorough.

Secondly, a large portion covers unit testing. Since I'm not too keen on writing unit tests myself, I'll skip it directly...

I've been following this course and hope to gain something from it. Below are the course materials I've organized. Please take a look.

# SwiftUI Introductory Course
Place the related files of SwiftUI 入門課程 here, along with related links and further reading for each chapter.

### Chapter 1: Basic Introduction
Introduces the Xcode interface and the basic architecture of SwiftUI.

##### Related Links
* [1-1 Website showing phone versions and upgrade trends](https://mixpanel.com/trends)
* [1-3 Source of the plate image used](https://www.flaticon.com/free-sticker/dinner_7603521)
* [1-5 Website showing device information](https://iosref.com/res)
* [1-5 Further reading on layout types](http://defagos.github.io/understanding_swiftui_layout_behaviors/)
* If you're coming from UIKit, you might ask where AppDelegate went.
Pair it with [this property wrapper](https://developer.apple.com/documentation/swiftui/uiapplicationdelegateadaptor).
However, if you just need to do some operations at launch, doing them in the App's init is enough; for screen transition-related events, use [ScenePhase](https://developer.apple.com/documentation/swiftui/scenephase).

---

### Chapter 2: Layout
Practice layout and basic code refactoring.

##### Related Links
* [Several ways to center a view in SwiftUI](https://www.fatbobman.com/posts/centering_the_View_in_SwiftUI/)
* Besides using **@ViewBuilder** with computed properties as shown in the video, you might also [use it in init or closures](https://swiftontap.com/viewbuilder).

---

### Chapter 3: Property Wrappers
Introduces the commonly used property wrappers in SwiftUI: State, Binding, and Environment; practices creating lists and forms, and uses enums to organize code.

##### Related Links
* [EnvironmentValues environment variables](https://developer.apple.com/documentation/swiftui/environmentvalues)
* The "**in a result builder, local variables are treated as the block being built**" mentioned in the video — you can learn more in this [evolution proposal](https://github.com/apple/swift-evolution/blob/main/proposals/0289-result-builders.md#the-result-builder-transform). Under the section *The result builder transform*, you can learn how result builders judge different statements.

---

### Chapter 4: Data Persistence
Introduces iOS's native data persistence methods and the concept of encoding, and implements a settings screen that uses AppStorage to store Boolean, enum, and Array data.

##### Related Links
* [Official data persistence documentation](https://developer.apple.com/documentation/swiftui/persistent-storage)
* [Modifiers that add Presentation](https://developer.apple.com/documentation/swiftui/view-presentation)
* The video mentions you can try to **build your own AppStorage property wrapper**. If interested, refer to [this article by SwiftLee](https://www.avanderlee.com/swift/appstorage-explained/
), but this is relatively advanced content — you'll need basic Combine concepts and an understanding of ObservableObject and DynamicProperty.
* When using FileManager, you might need to know how to get file URLs.

---

### Chapter 5: Testing
Introduces basic testing concepts, Xcode's testing interface, implements a test, and uses Measurement for unit conversion and displaying localized unit strings according to the user's Locale.

##### Related Links
* [WWDC20: Localized formatting tools](https://developer.apple.com/videos/play/wwdc2020/10160/), the video introduces tools that can format data such as dates, units, numbers, and text according to the user's Locale.
* [WWDC19: Introduction to Testing, Test Plans, and CI/CD](https://developer.apple.com/wwdc19/403)
* Understanding [Locale](https://developer.apple.com/documentation/foundation/locale) — Locale doesn't refer only to language, but combines language and region to provide more precise conventions. For example, even in the same English language, the order of writing dates still differs between countries.
    - If your app doesn't support other languages yet, **Locale will be set to your project's base language**. For a detailed introduction, see this article, which also provides `methods for getting the user's preferred / currently used language`. Before you do localization, you can try getting these values to force-modify the Locale.
  
* [Adding a background color to the toolbar in iOS 16](https://sarunw.com/posts/swiftui-tabview-color/): the article focuses on the TabBar, but this `toolbarBackground` modifier can also modify the Navigation Bar.
* You might notice that the TabBar looks different before iOS 14 🥲. If you want to unify it, you can refer to [the code in this article](https://blog.personal-factory.com/2021/12/29/ios15-transparent-navigationbar-and-tabbar-by-default/) to make the changes.

---

### Chapter 6: Network Calls
Introduces basic networking concepts and further applications of Codable, and builds a new project that integrates [The Cat API](https://thecatapi.com/).
The implementation of the new project includes:
- Creating a Manager dedicated to handling networking.
- Handling errors and showing alerts.
- Observing reference types using `ObservableObject`.
- Infinite Scroll that automatically loads more content.
- Understanding the difference between the `.task` modifier and creating a new `Task`.

##### Related Links
* 6-2 [Common HTTP status codes](https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Status)
* 6-2 [MIME type name lookup](https://www.iana.org/assignments/media-types/media-types.xhtml)
* 6-2 [Flowchart for deciding whether to use cached data](https://developer.apple.com/documentation/foundation/nsurlrequest/cachepolicy/useprotocolcachepolicy)
* 6-3 [The conditions for adding a response to the cache](https://developer.apple.com/documentation/foundation/urlsessiondatadelegate/1411612-urlsession) mentioned in the video
* 6-5 [The website for quickly generating JSON parsing code](https://app.quicktype.io/) used in the video. Remember, when using auto-generated code, always double-check it yourself, no matter how simple the data is.
* 6-8 [StateObject documentation](https://developer.apple.com/documentation/swiftui/stateobject): this document briefly introduces the three property wrappers used with `ObservableObject` and their update timing. I suggest reading the init and update parts; come back to it when you encounter StateObject being initialized repeatedly or not updating as expected.
* 6-8 If you have doubts about the difference between **StateObject and ObservedObject**, refer to onevcat's [this article](https://onevcat.com/2020/06/stateobject/).
* 6-11 The difference between onAppear and the task modifier. I think the differences mentioned in this article are all quite important; besides what's mentioned in the video, it also covers using task with an id.
* 6-11 If you're unsure about when to use `Task` and `Task.detached`, refer to the **When to use unstructured tasks** and **When to use detached tasks** sections of [this article](https://www.donnywals.com/understanding-unstructured-and-detached-tasks-in-swift/).
  ###### Additionally, the mainstream approach nowadays is to avoid using detached — not because it's bad, but because there's no strong reason to use it (i.e., no need to make your code more complex). However, I personally feel that detached's explicitness is very helpful for initially understanding what your code does, and the errors and warnings arising from its lack of inheritance are also helpful for early learning.
* 6-11 If you want to learn more about when `onAppear` fires, check out this article on [View lifecycle](https://www.vadimbulavin.com/swiftui-view-lifecycle/).
* 6-11 As mentioned in the video, ObservableObject puts the entire View on the MainActor. [This article](https://oleb.net/2022/swiftui-task-mainactor/) explains in detail the mysterious @MainActor situation of View structs. Once again, I don't think you need to worry too much about this; when you encounter this error, just move it into the MainActor.
