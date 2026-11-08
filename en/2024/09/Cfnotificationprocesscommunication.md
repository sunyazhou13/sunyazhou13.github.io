---
layout: post
title: CFNotification Inter-Process Communication
date: 2024-09-02 12:08 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---



![Swift UI](/assets/images/20240727Magnificationgesture/SwiftUI.avif)


# Preface

This post carries strong personal sentiment; if you feel uncomfortable reading it, please close it as soon as possible. This post is only a personal learning record. Reposting or sharing within the license terms is welcome; please respect copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

# Background

In iOS development, app extensions and their containing apps run in different processes. This isolation brings a challenge: when you need to communicate between the main app and its extensions. While `NSNotificationCenter` is the common choice for passing data to different view controllers within the same app, it falls short when it comes to inter-process communication. Have you ever wondered how to pass data between your main app and its extensions? Darwin notifications provide a powerful solution for this scenario. In this article, we'll explore how to implement a Darwin notification manager and use it to facilitate real-time data transfer between the main app and its extensions.

What are Darwin notifications (also known as CFNotificationCenterGetDarwinNotifyCenter)?
`CFNotificationCenterGetDarwinNotifyCenter` is a function in Apple's Core Foundation framework that provides access to the Darwin notification center. This notification center is designed for system-level notifications, allowing different processes — like your app and its extensions — to communicate with each other.

How does it work?
System-level communication: Unlike `NSNotificationCenter`, which is limited to within the app, the Darwin notification center can send notifications that can be observed by other processes on the device.

## What are Darwin Notifications, also known as CFNotificationCenterGetDarwinNotifyCenter?

`CFNotificationCenterGetDarwinNotifyCenter` is a function in Apple's Core
Foundation framework that provides access to the Darwin notification center. This notification center is designed for system-level notifications, allowing different processes (such as your app and its extensions) to communicate with each other.

### How does it work?

**System-level communication**: Unlike `NSNotificationCenter`, which is limited to the app's process, the Darwin notification center can send notifications that can be observed by other processes on the device. This makes it an ideal choice for app-to-app and app-to-extension communication.

**No userInfo dictionary support**: One limitation is that Darwin notifications don't support sending additional data (such as a userInfo dictionary). This means you can only send a simple notification without any extra information. This is because the underlying mechanism, `notify_post()`, only accepts a string identifier as the notification.

### A use case for Darwin notifications

For example, when a broadcast upload extension starts or stops, you can use Darwin notifications to notify the main app. I see most people using UserDefaults or Keychain, but I personally think Darwin notifications are the best fit for this use case.

### Implementing a Darwin notification manager

First, we'll create a `DarwinNotificationManager` class that uses the `CFNotificationCenter` API to post and observe notifications across processes.

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

#### Breaking down the Darwin notification manager

``` swift
private var callbacks: [String: () -> Void] = [:]

```

The `callbacks` function stores a callback for each notification name so it can be executed when a notification is received.


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

The `startObserving` method registers a callback for a notification and adds an observer to listen for it. Call this method when you want to start listening for a notification. It's usually called when a view is initialized.

``` swift
func stopObserving(name: String) {
    let notificationCenter = CFNotificationCenterGetDarwinNotifyCenter()
    CFNotificationCenterRemoveObserver(notificationCenter, Unmanaged.passUnretained(self).toOpaque(), CFNotificationName(name as CFString), nil)
    callbacks.removeValue(forKey: name)
}
```

The `stopObserving` method removes the observer for a notification and deletes its callback to stop listening. It's usually called when a view is deallocated.

``` swift
private static let notificationCallback: CFNotificationCallback = { center, observer, name, _, _ in
    guard let observer = observer else { return }
    let manager = Unmanaged<DarwinNotificationManager>.fromOpaque(observer).takeUnretainedValue()
    
    if let name = name?.rawValue as String?, let callback = manager.callbacks[name] {
        callback()
    }
}
```

`notificationCallback` executes the stored callback when the corresponding notification is received.

#### Using the manager in a broadcast extension

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

#### Observing Darwin notifications in a UIKit view

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

#### Observing Darwin notifications in a SwiftUI view

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

As I mentioned earlier, start observing in `onAppear` and stop observing in `onDisappear`. This will ensure your code doesn't cause memory leaks.

### Key takeaways

1. **Inter-process communication**: Darwin notifications provide a powerful mechanism for communication between different processes, such as the main app and its extensions, overcoming the limitations of `NSNotificationCente`r.

2. **System-level coverage**: Unlike `NSNotificationCenter`, which is limited to a single app, Darwin notifications can be observed by any process on the device, making them ideal for app-extension communication.

3. **No payload support**: Darwin notifications don't support sending additional data (such as a `userInfo` dictionary). They're limited to notifying observers that an event occurred, without any additional context.

4. **Efficient notification handling**: By using `CFNotificationCenterGetDarwinNotifyCenter`, developers can efficiently post and observe notifications without the overhead of managing additional data.

5. **SwiftUI integration**: `Darwin` notifications can be easily integrated into SwiftUI apps, allowing real-time updates and state management across different app components.

# Summary

In my mind, I always compare these inter-process notifications to a comet passing through our planet. Just as comets are rare and awe-inspiring events that capture our attention, Darwin notifications serve as crucial signals that let different parts of the app ecosystem communicate seamlessly. Isn't that a nice metaphor?

So, that's it. If you've read this far, I really appreciate it. I hope this exploration of Darwin notifications inspires you to think about inter-process communication in new ways. I can't wait to see how you use Darwin notifications in your apps. Please tell me your thoughts and experiences in the comments below. Your feedback and ideas are always welcome! And don't forget to share this article with your network!

[Original article: Send data Between iOS Apps and Extensions Using Darwin Notifications](https://ohmyswift.com/blog/2024/08/27/send-data-between-ios-apps-and-extensions-using-darwin-notifications/)  
[CFNotificationCenter documentation](https://developer.apple.com/documentation/corefoundation/cfnotificationcenter)
