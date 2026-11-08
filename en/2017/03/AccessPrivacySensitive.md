---
layout: post
title: Access privacy-sensitive data  
date: 2017-03-29 10:54:40
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
math: false
mermaid: false

---



Before you access the camera, contacts, and other privacy-sensitive data, you must request authorization. Otherwise, your app will crash when you try to access that private data. Xcode will log something like this:
> This app has crashed because it attempted to access privacy-sensitive data without a usage description. The app's Info.plist must contain an NSContactsUsageDescription key with a string value explaining to the user how the app uses this data.

Open the file named `info.plist` in your project, right-click and select `opening as Source Code`, then paste the code below into it. Alternatively, you can open `info.plist` with the default `Property List` editor, click the add button, and when you type `Privacy` — Xcode will give you autocomplete suggestions; use the up and down arrow keys to select.

The list of frameworks for private data is quite a big one:  
> Contacts Calendars Reminders Photos Bluetooth Sharing Headphones Camera Location Health HomeKit Media Library Motion CallKit Speech Recognition SiriKit TV Provider

Refer to [this great article](https://github.com/ChenYilong/iOS10AdaptationTips)

``` sh
	<!-- 📷 Camera -->
	<key>NSCameraUsageDescription</key>
	<string>用于拍照捕捉视频内容,及拍摄短视频时访问相机</string>
	<!-- 🎤 Microphone -->
	<key>NSMicrophoneUsageDescription</key>
	<string>用于拍摄短视频时访问麦克风收录视频声音</string>
	<!-- 🏞 Photo Library iOS11 new -->
	<key>NSPhotoLibraryAddUsageDescription</key>
	<string>用于保存拍摄完成的视频内容到相册,及选择相册内视频上传</string>
	<!-- 🖼 Photo Library -->
	<key>NSPhotoLibraryUsageDescription</key>
	<string>用于保存拍摄完成的视频内容到相册,及选择相册内视频上传</string> 

```
These are commonly used texts that have passed App Store review

Below are privacy description reminders for convenient debugging

``` objc
    <!-- 🖼 Photo Library -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>$(PRODUCT_NAME) photo use</string>
    
    <!-- 🏞 Photo Library iOS11 new -->
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>$(PRODUCT_NAME) photo album use</string>

    <!-- 📷 Camera -->
    <key>NSCameraUsageDescription</key>
    <string>$(PRODUCT_NAME) camera use</string>

    <!-- 🎤 Microphone -->
    <key>NSMicrophoneUsageDescription</key>
    <string>$(PRODUCT_NAME) microphone use</string>

    <!-- 📍 Location -->
    <key>NSLocationUsageDescription</key>
    <string>$(PRODUCT_NAME) location use</string>

    <!-- 📍 Location When In Use -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>$(PRODUCT_NAME) location use</string>

    <!-- 📍 Location Always -->
    <key>NSLocationAlwaysUsageDescription</key>
    <string>$(PRODUCT_NAME) always uses location </string>

    <!-- 📆 Calendars -->
    <key>NSCalendarsUsageDescription</key>
    <string>$(PRODUCT_NAME) calendar events</string>

    <!-- ⏰ Reminders -->
    <key>NSRemindersUsageDescription</key>
    <string>$(PRODUCT_NAME) reminder use</string>

    <!-- 📒 Contacts -->
    <key>NSContactsUsageDescription</key>
    <string>$(PRODUCT_NAME) contact use</string>

    <!-- 🏊 Motion -->
    <key>NSMotionUsageDescription</key>
    <string>$(PRODUCT_NAME) motion use</string>

    <!-- 💊 Health Update -->
    <key>NSHealthUpdateUsageDescription</key>
    <string>$(PRODUCT_NAME) heath update use</string>

    <!-- 💊 Health Share -->
    <key>NSHealthShareUsageDescription</key>
    <string>$(PRODUCT_NAME) heath share use</string>

    <!-- ᛒ🔵 Bluetooth Peripheral -->
    <key>NSBluetoothPeripheralUsageDescription</key>
    <string>$(PRODUCT_NAME) Bluetooth Peripheral use</string>

    <!-- 🎵 Media Library -->
    <key>NSAppleMusicUsageDescription</key>
    <string>$(PRODUCT_NAME) media library use</string>

    <!-- 📱 Siri -->
    <key>NSSiriUsageDescription</key>
    <string>$(PRODUCT_NAME) siri use</string>

    <!-- 🏡 HomeKit -->
    <key>NSHomeKitUsageDescription</key>
    <string>$(PRODUCT_NAME) home kit use</string>

    <!-- 📻 SpeechRecognition -->
    <key>NSSpeechRecognitionUsageDescription</key>
    <string>$(PRODUCT_NAME) speech use</string>

    <!-- 📺 VideoSubscriber -->
    <key>NSVideoSubscriberAccountUsageDescription</key>
    <string>$(PRODUCT_NAME) tvProvider use</string>
    
    <!-- 📟 NFC reader iOS11  -->
    <key>NFCReaderUsageDescription</key>
    <string>$(PRODUCT_NAME) use the device’s NFC reader</string>
    
```

> Note: _Be sure to replace them with friendly descriptions before going live._
