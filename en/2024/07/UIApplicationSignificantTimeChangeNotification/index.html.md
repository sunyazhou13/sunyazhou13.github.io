---
layout: post
title: How to Handle Date Changes Across Days in iOS
date: 2024-07-31 03:17 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


![Swift UI](/assets/images/20240727Magnificationgesture/SwiftUI.avif)


# Preface

This article is strongly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. You are welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

## Background

Recently at work I came across a requirement: when the app is in the foreground and it passes midnight (12 AM), trigger certain logic — and it needs to trigger in the foreground. That is, if the app was suspended in the background, the trigger should happen when the app returns to the foreground. This is generally used for logic like check-ins.

## UIApplicationSignificantTimeChangeNotification

In iOS app development, `UIApplicationSignificantTimeChangeNotification` is a powerful tool that allows developers to receive notifications when significant time changes occur. These changes include a date change, a timezone change, the start or end of daylight saving time (DST), or a carrier time update. This feature is especially useful for apps that need to perform certain tasks at specific times, such as backing up or updating data at `midnight`.

To receive UIApplicationSignificantTimeChangeNotification in your app, you first need to register with the system to receive this notification. This can be done in any part of the app, but is usually done in applicationDidFinishLaunching: or a similar app lifecycle method.

Here is an example of how to register:

``` objc
// Register for the notification
[[NSNotificationCenter defaultCenter] addObserver:self
                                         selector:@selector(significantTimeChangeHandler:)
                                             name:UIApplicationSignificantTimeChangeNotification
                                           object:nil];
...

- (void)significantTimeChangeHandler:(NSNotification *)notification {
    if ([notification.name isEqualToString:UIApplicationSignificantTimeChangeNotification]) {
        // Get the current date
        NSDate *currentDate = [NSDate date];
        // Get yesterday's date
        NSCalendar *calendar = [NSCalendar currentCalendar];
        NSDateComponents *comps = [calendar components:NSCalendarUnitDay fromDate:currentDate];
        comps.day = comps.day - 1;
        NSDate *yesterday = [calendar dateFromComponents:comps];
        
        // Check whether midnight has been crossed
        if ([currentDate compare:yesterday] == NSOrderedDescending) {
            // Perform the operations needed after crossing into a new day, e.g., data backup
            NSLog(@"Crossed midnight, perform necessary actions.");
        }
    }
}

```

This method first confirms that the received notification is the significant time change notification we care about. Then it gets the current date and computes yesterday's date. By comparing the two dates, we can determine whether midnight has been crossed. If so, we can perform any operations needed at the start of a new day, such as data backup or refreshing the user interface.

Here's the official comment for this notification:

``` txt
A notification that posts when there is a significant change in time, for example, change to a new day (midnight), carrier time update, and change to or from daylight savings time.
当时间发生重大变化时发布的通知，例如，更改为新的一天（午夜）、运营商时间更新，以及更改为夏令时。

This notification does not contain a userInfo  dictionary.
此通知不包含userInfo字典。

If your app is currently suspended, this message is queued until your app returns to the foreground, at which point it is delivered. If multiple time changes occur, only the most recent one is delivered.
如果你的应用程序当前处于挂起状态，则此消息将一直排队，直到你的应用程序返回前台，并在前台发送。如果发生多个时间更改，则只发送最近的一个。

```
> [Official documentation](https://developer.apple.com/documentation/uikit/uiapplicationsignificanttimechangenotification)

# Summary

This notification isn't commonly used, but it fully satisfies the requirements for cross-day changes, date modifications, returning to the foreground, and similar logic — and it can also be triggered by DST changes or carrier time updates.
