---
layout: post
title: SwiftUI第五章学习总结
date: 2023-09-09 15:55 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS, Objective-C, SwiftUI]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## SwiftUI课程

最近坚持学习swiftUI,周末有空把第四章都看完了,我这里说的看是动手实践+教程学习.记录一些容易遗忘的内容


### 主要内容包括

* 处理tabbar透明问题问题
*  处理单位格式化问题

### tabbar透明问题问题

用SwiftUI写完各种UI后发现 tabbar的视图被遮挡,

![](/assets/images/20230805LearnSwiftUIChapter5/before.avif)
![](/assets/images/20230805LearnSwiftUIChapter5/after.avif)

需要启动app的时候使用如下函数`applyTabbarBackground()`

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

####  处理单位格式化问题

iOS系统提供了国家化的单位类 `Measurement `,帮我们处理 克，g, 英镑, pounds等单位的处理

``` swift
var desciption : String {
        let preferredUnit = Unit.getPreferredUnit(from: store)
        let measureMent = Measurement(value: wrappedValue, unit: unit.dimension)
        let converted = measureMent.converted(to: preferredUnit.dimension)
//        return converted.formatted(.measurement(width: .abbreviated, usage: .asProvided, numberFormatStyle: .number.precision(.fractionLength(0...1))))
        return converted.value.formatted(.number.precision(.fractionLength(0...1))) + " " + preferredUnit.localizedSymbol
    }
```

这里推荐看一下官方的WWDC20视频[Formatters: Make data human-friendly](https://developer.apple.com/videos/play/wwdc2020/10160/)

影片中介紹了能把日期、單位、數字和文字等等資料，根據使用者 Locale 進行格式化的工具



# 总结

其实第五章讲的比较多的是属性封装器的高度封装,我看篇幅实在太大,与其我在这记录一下不如大家亲自看一下[教程视频](https://www.bilibili.com/video/BV1bA411y71h/?spm_id_from=333.788&vd_source=9309f71afe97e633abeadc8407870e76),讲的比较透彻。

其次大篇讲述单元测试, 这里由于本人不太愿意写单元测试直接跳过。。。

一直跟进这门课程希望有所收获,下面是整理的一对课程资料 请查阅

# SwiftUI 入門課程
放置 [SwiftUI 入門課程](https://www.youtube.com/playlist?list=PLXM8k1EWy5khONZ9M9ytK8mMrcEOXvGsE) 的相關檔案，以及每一章節的相關連結、延伸閱讀。

### Chapter 1：基本介紹
介紹 Xcode 介面和 SwiftUI 的基本架構。

##### 相關連結
* [1-1 展示的手機版本、升級趨勢網站](https://mixpanel.com/trends)
* [1-3 使用的盤子圖片來源](https://www.flaticon.com/free-sticker/dinner_7603521)
* [1-5 展示的裝置資訊網站](https://iosref.com/res)
* [1-5 排版類型延伸閱讀](http://defagos.github.io/understanding_swiftui_layout_behaviors/)
* 如果你從 UIKit 過來可能會問 AppDelegate 去哪了。
請搭配[這個 property wrapper](https://developer.apple.com/documentation/swiftui/uiapplicationdelegateadaptor) 使用。
不過，如果只是要啟動時進行一些操作，在 App 的 init 中進行即可；如果是畫面切換相關事件，請用 [ScenePhase](https://developer.apple.com/documentation/swiftui/scenephase)。

---

### Chapter 2：排版
練習排版和基本的重構程式碼。

##### 相關連結
* [在 SwiftUI 中实现视图居中的若干种方法](https://www.fatbobman.com/posts/centering_the_View_in_SwiftUI/)
* 除了影片中搭配計算屬性使用 **@ViewBuilder**，你可能也會[在啟動或 closure 中使用它](https://swiftontap.com/viewbuilder)。

---

### Chapter 3：屬性包裝
介紹 SwiftUI 中常用的屬性包裝：State、Binding 和 Environment；練習建立清單、表單，並使用 enum 整理程式碼。

##### 相關連結
* [EnvironmentValues 環境變數](https://developer.apple.com/documentation/swiftui/environmentvalues)
* 影片中提到的「**在 result builder 中，local 變數會被當作建造的 block**」，詳細的資訊可以在這個 [evolution 記錄](https://github.com/apple/swift-evolution/blob/main/proposals/0289-result-builders.md#the-result-builder-transform)中了解，在 *The result builder transform* 的分類下可以認識 result builder 對不同語句的判斷。

---

### Chapter 4：資料持久化
介紹 iOS 環境原生的資料持久化方式以及編碼的概念介紹，並實作一個設定畫面，使用 AppStorage 儲存布林、enum 和 Array 的資料。

##### 相關連結
* [官方的資料持久化文件](https://developer.apple.com/documentation/swiftui/persistent-storage)
* [會新增 Presentation 的調整器](https://developer.apple.com/documentation/swiftui/view-presentation)
* 影片中提到可以嘗試**建立自己的 AppStorage 屬性包裝**，如果有興趣可以參考 [SwiftLee 的這篇文章](https://www.avanderlee.com/swift/appstorage-explained/
)，不過這個是個相對進階的內容，你會需要有基本 Combine 概念、了解 ObservableObject 和 DynamicProperty 。
* 使用 FileManager 時，你可能會需要知道[如何取得檔案 URL](https://chaocode.co/blog/getting-url)。

---

### Chapter 5：測試
介紹測試的基本概念、Xcode 的測試介面並實作一個測試，以及使用 Measurement 進行單位轉換並且根據使用者 Locale 顯示在地化的單位字串。

##### 相關連結
* [WWDC20: 在地化的格式化工具](https://developer.apple.com/videos/play/wwdc2020/10160/)，影片中介紹了能把日期、單位、數字和文字等等資料，根據使用者 Locale 進行格式化的工具。
* [WWDC19: 測試、Test Plan、CICD 介紹](https://developer.apple.com/wwdc19/403)
* 了解 [Locale](https://developer.apple.com/documentation/foundation/locale)，Locale 並不單指語言，而是結合語言加上地區，提供更精確的慣用法。例如同樣是英文，在不同國家寫日期的順序依然會有所不同。
    - 在你的 app 沒有做其他語言之前，**Locale 會被設定成你的專案的 base language**，詳細的介紹可以看[這篇文章](https://medium.com/swlh/know-your-language-locale-in-swift-beae4fcc5174)，裡面也提供了`取得使用者偏好 / 正在使用的語言的方法`，在你還沒做多語言之前，你可以嘗試取得這些值來強制修改 Locale。
  
* [在 iOS16 加上工具列的背景色](https://sarunw.com/posts/swiftui-tabview-color/)：文章是針對 TabBar 介紹，不過這個調整器 `toolbarBackground` 也能用來修改 Navigation Bar。
* 你可能會發現 TabBar 在 iOS14 以前長得不一樣 🥲，如果你想要全部統一的話可以參考[這篇文章中的程式碼](https://blog.personal-factory.com/2021/12/29/ios15-transparent-navigationbar-and-tabbar-by-default/)做修改。

---

### Chapter 6：網路呼叫
介紹基本的網路概念和 Codable 的進一步應用，並且建立一個串接 [The Cat API](https://thecatapi.com/) 的新專案。
新專案的實作內容包含：
- 建立一個專門處理網路的 Manager。
- 處理錯誤和顯示 alert。
- **觀察 reference type**的`ObservableObject`。
- 自動載入更多內容的 Infinite Scroll。
- 認識`.task` 調整器和建立一個新的`Task`的差別。

##### 相關連結
* 6-2 [常見 HTTP 狀態碼](https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Status)
* 6-2 [MIME 類型名稱對照](https://www.iana.org/assignments/media-types/media-types.xhtml)
* 6-2 [判斷是否使用 Cache 資料的流程圖](https://developer.apple.com/documentation/foundation/nsurlrequest/cachepolicy/useprotocolcachepolicy)
* 6-3 影片中提到的[將回傳加入 cache 的條件](https://developer.apple.com/documentation/foundation/urlsessiondatadelegate/1411612-urlsession)
* 6-5 影片中使用的[快速產生 JSON 解析程式碼的網站](https://app.quicktype.io/)。要記得用自動產生的程式碼的時候，不管多簡單的資料都要自己再檢查一遍哦
* 6-8 [StateObject 的文件](https://developer.apple.com/documentation/swiftui/stateobject)：這個文件簡單介紹了搭配 `ObservableObject` 的三個屬性包裝器，以及它們的更新時機。建議大概閱讀啟動和更新的部分，當未來遇到 StateObject 重複被啟動或是沒有如預期的更新的時候再次回來閱讀。
* 6-8 如果對 **StateObject 和 ObservedObject** 的差別有疑惑，可以參考 onevcat 的[這篇文章](https://onevcat.com/2020/06/stateobject/)。
* 6-11 [onAppear 和 task 調整器的差別](https://byby.dev/swiftui-task-vs-onappear)，這篇文章提到的差別我覺得都蠻重要的，除了影片中提過的，還有額外講到 task 搭配 id 的用法。
* 6-11 如果對於使用`Task`和`Task.detached`的時機不太確定，可以參考[這篇文章](https://www.donnywals.com/understanding-unstructured-and-detached-tasks-in-swift/)裡面的 **When to use unstructured tasks** 和 **When to use detached tasks**。
  ###### 另外，目前主流的做法是避免使用 detached，這並不是因為它不好，而是沒有什麼非得要用的原因（i.e. 沒必要讓自己的程式碼變複雜）。不過，我個人覺得 detached 的 explicit 對於初期掌握自己的程式碼在做什麼很有幫助，還有因為它沒有繼承而產生的一些報錯和警告也對初期學習很有幫助。
* 6-11 如果想瞭解更多關於`onAppear`出現的時機，可以看這篇關於 [View 的生命週期](https://www.vadimbulavin.com/swiftui-view-lifecycle/) 的文章。
* 6-11 影片中提到的，ObservableObject 會讓整個 View 進到 MainActor，[這篇文章](https://oleb.net/2022/swiftui-task-mainactor/)詳細講了關於 View struct 神秘的 @MainActor 情況。再一次強調，我覺得不用太在意這個，遇到這個錯誤就直接改進 MainActor 中就好。.