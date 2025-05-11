---
layout: post
title: CFNotification进程间通讯
date: 2024-09-02 12:08 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---



![](/assets/images/20240727Magnificationgesture/SwiftUI.webp)


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 背景

在iOS开发中，应用扩展（App Extensions）与其容器应用（Containing App）在不同的进程中运行。这种隔离带来了一个挑战：当你需要在主应用和它的扩展之间进行通信时。虽然NSNotificationCenter是在同一应用内传递数据给不同视图控制器的常见选择，但在处理进程间通信时就力不从心了。你是否曾想过如何在主应用及其扩展之间传递数据？Darwin通知为这一场景提供了一个强大的解决方案。在本文中，我们将探讨如何实现一个Darwin通知管理器，并使用它来促进主应用和其扩展之间的实时数据传输。

什么是Darwin通知（又称CFNotificationCenterGetDarwinNotifyCenter）？
CFNotificationCenterGetDarwinNotifyCenter是苹果Core Foundation框架中的一个函数，提供了访问Darwin通知中心的权限。这个通知中心被设计用于系统级的通知，允许像你的应用和其扩展这样的不同进程彼此通信。

它是如何工作的？
系统级通信：与仅仅限于应用内部的NSNotificationCenter不同，Darwin通知中心可以发送能够被设备上其他进程观察到的通知。

## Darwin Notifications，也称为CFNotificationCenterGetDarwinNotifyCenter，是什么？

`CFNotificationCenterGetDarwinNotifyCenter`是苹果公司Core
Foundation框架中的一个函数，它提供了对Darwin通知中心的访问权限。该通知中心被设计用于系统级的通告，允许不同进程（例如你的应用及其扩展）彼此通信。

### 它是如何工作的？

**系统级通信**：与仅限于应用进程的NSNotificationCenter不同，Darwin通知中心可以发送能被设备上其他进程观察到的通知。这对于应用间以及应用到扩展的通信来说是一个理想的选择。

**不支持userInfo字典**：一个限制是Darwin通知不支持发送额外的数据（如userInfo字典）。这意味着你只能发送一个简单的通知，没有任何额外信息。这是因为底层机制notify_post()只接受一个字符串标识符作为通知。

### Darwin通知的一个用例是

例如，当广播上传扩展开始或停止时，你可以使用Darwin通知来通知主应用。我看到大多数人使用UserDefaults或Keychain，但我个人认为Darwin通知最适合这个用例。

### 实现Darwin通知管理器

首先，我们将创建一个`DarwinNotificationManager`类，使用`CFNotificationCenter` API来跨进程发布和观察通知。

``` swift
import Foundation

class DarwinNotificationManager {
    
    static let shared = DarwinNotificationManager()
    
    private init() {}
    
    // 1
    private var callbacks: [String: () -> Void] = [:]
    
    // Method to post a Darwin notification
    func postNotification(name: String) {
        let notificationCenter = CFNotificationCenterGetDarwinNotifyCenter()
        CFNotificationCenterPostNotification(notificationCenter, CFNotificationName(name as CFString), nil, nil, true)
    }
    
    // 2
    func startObserving(name: String, callback: @escaping () -> Void) {
        callbacks[name] = callback
        
        let notificationCenter = CFNotificationCenterGetDarwinNotifyCenter()
        
        CFNotificationCenterAddObserver(notificationCenter,
                                        Unmanaged.passUnretained(self).toOpaque(),
                                        DarwinNotificationManager.notificationCallback,
                                        name as CFString,
                                        nil,
                                        .deliverImmediately)
    }
    
    // 3
    func stopObserving(name: String) {
        let notificationCenter = CFNotificationCenterGetDarwinNotifyCenter()
        CFNotificationCenterRemoveObserver(notificationCenter, Unmanaged.passUnretained(self).toOpaque(), CFNotificationName(name as CFString), nil)
        callbacks.removeValue(forKey: name)
    }
    
    // 4
    private static let notificationCallback: CFNotificationCallback = { center, observer, name, _, _ in
        guard let observer = observer else { return }
        let manager = Unmanaged<DarwinNotificationManager>.fromOpaque(observer).takeUnretainedValue()
        
        if let name = name?.rawValue as String?, let callback = manager.callbacks[name] {
            callback()
        }
    }
}
```

#### Darwin通知管理器的解析

``` swift
private var callbacks: [String: () -> Void] = [:]

```

回调`callbacks `函数存储每个通知名称的回调，以便在收到通知时执行。


``` swift
func startObserving(name: String, callback: @escaping () -> Void) {
    callbacks[name] = callback
    
    let notificationCenter = CFNotificationCenterGetDarwinNotifyCenter()
    
    CFNotificationCenterAddObserver(notificationCenter,
                                    Unmanaged.passUnretained(self).toOpaque(),
                                    DarwinNotificationManager.notificationCallback,
                                    name as CFString,
                                    nil,
                                    .deliverImmediately)
}
```

`startObserving`方法为通知注册一个回调，并添加观察者来监听它。当你想开始监听通知时调用这个方法。它通常在视图初始化时被调用。

``` swift
func stopObserving(name: String) {
    let notificationCenter = CFNotificationCenterGetDarwinNotifyCenter()
    CFNotificationCenterRemoveObserver(notificationCenter, Unmanaged.passUnretained(self).toOpaque(), CFNotificationName(name as CFString), nil)
    callbacks.removeValue(forKey: name)
}
```

`stopObserving`方法移除通知的观察者并删除其回调，以停止监听。它通常在视图被释放时调用。

``` swift
private static let notificationCallback: CFNotificationCallback = { center, observer, name, _, _ in
    guard let observer = observer else { return }
    let manager = Unmanaged<DarwinNotificationManager>.fromOpaque(observer).takeUnretainedValue()
    
    if let name = name?.rawValue as String?, let callback = manager.callbacks[name] {
        callback()
    }
}
```

`notificationCallback`在收到相应的通知时执行存储的回调。

#### 在广播扩展中使用管理器

``` swift
import ReplayKit

class SampleHandler: RPBroadcastSampleHandler {
    
    override func broadcastStarted(withSetupInfo setupInfo: [String : NSObject]?) {
        DarwinNotificationManager.shared.postNotification(name: "com.yourapp.BroadcastStarted")
    }
    
    override func broadcastFinished() {
        DarwinNotificationManager.shared.postNotification(name: "com.yourapp.BroadcastStopped")
    }
}
```

#### 在UIKit视图中观察Darwin通知

``` swift
class DashboardViewController: UIViewController { 
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        self.configureCallbacks()
    }


    fileprivate func configureCallbacks() {
        DarwinNotificationManager.shared.startObserving(name: "com.yourapp.BroadcastStarted") {
            print("*******Broadcast has started*******")
            // Handle the event when broadcast starts
        }
        
        DarwinNotificationManager.shared.startObserving(name: "com.yourapp.BroadcastStopped") {
            print("*******Broadcast has stopped*******")
            // Handle the event when broadcast starts
        }

    }
}
```

#### 在SwiftUI视图中观察Darwin通知

``` swift
import SwiftUI
import Foundation

struct BroadcastView: View {
    @State private var broadcastStatus: String = "Not Broadcasting"
    
    var body: some View {
        VStack {
            Text(broadcastStatus)
                .font(.largeTitle)
                .padding()
        
        }
        .onAppear {
            configureCallbacks()
        }
        .onDisappear {
            stopCallbacks()
        }
    }
    
    private func configureCallbacks() {
        DarwinNotificationManager.shared.startObserving(name: "com.yourapp.BroadcastStarted") {
            broadcastStatus = "Broadcasting..."
            print("*******Broadcast has started*******")
        }
        
        DarwinNotificationManager.shared.startObserving(name: "com.yourapp.BroadcastStopped") {
            broadcastStatus = "Not Broadcasting"
            print("*******Broadcast has stopped*******")
        }
    }
    
    private func stopCallbacks() {
        DarwinNotificationManager.shared.stopObserving(name: "com.yourapp.BroadcastStarted")
        DarwinNotificationManager.shared.stopObserving(name: "com.yourapp.BroadcastStopped")
    }
}
```

正如我之前提到的，在`onAppear`中开始观察，在`onDisappear`中停止观察。这将确保你的代码不会导致内存泄漏。

### 关键要点

1.**进程间通信**：Darwin通知为不同进程之间的通信提供了一种强大的机制，如主应用与其扩展之间的通信，克服了`NSNotificationCente`r的限制。

2.**系统级覆盖**：与仅限于单个应用的`NSNotificationCenter`不同，Darwin通知可以被设备上的任何进程观察到，使它们成为应用-扩展通信的理想选择。

3.**不支持有效负载**：Darwin通知不支持发送额外的数据（如`userInfo`字典）。它们仅限于通知观察者事件发生，没有额外的上下文。

4.**高效的通知处理**：通过使用`CFNotificationCenterGetDarwinNotifyCenter`，开发人员可以有效地发布和观察通知，无需管理额外数据的开销。

5.**SwiftUI集成**：`Darwin`通知可以轻松集成到SwiftUI应用程序中，允许在不同应用组件之间进行实时更新和状态管理。

# 总结

我的脑海里总是将这些进程间通知比作彗星穿过我们的地球。正如彗星是罕见且令人敬畏的事件，吸引我们的注意力一样，Darwin通知作为关键的信号，让应用生态系统的不同部分能够无缝通信。这难道不是一个很好的比喻吗？

所以，就是这样了。如果你一直读到这里，我真的很感激。我希望这次对Darwin通知的探索能激发你以新的方式思考进程间通信。我迫不及待想看到你如何在应用中使用Darwin通知。请在下面的评论中告诉我你的想法和经验。你的反馈和想法总是受欢迎的！也别忘了与你的网络分享这篇文章！

[原文链接 Send data Between iOS Apps and Extensions Using Darwin Notifications](https://ohmyswift.com/blog/2024/08/27/send-data-between-ios-apps-and-extensions-using-darwin-notifications/)  
[CFNotificationCenter文档](https://developer.apple.com/documentation/corefoundation/cfnotificationcenter)