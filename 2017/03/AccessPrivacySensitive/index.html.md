---
layout: post
title: 隐私及敏感数据访问权限(Access privacy-sensitive data)  
date: 2017-03-29 10:54:40
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
---



在你访问照相机、通讯录、等等隐私以及敏感数据之前，你必须请求授权。否则你的app会在你尝试访问这些隐私时崩溃。Xcode会log这些：
> This app has crashed because it attempted to access privacy-sensitive data without a usage description. The app's Info.plist must contain an NSContactsUsageDescription key with a string value explaining to the user how the app uses this data.

打开你工程中名叫 `info.plist` 的文件，右键点击选择 `opening as Source Code`，把下面的代码粘贴进去。或者你可以使用默认的 `Property List` 打开 `info.plist`，点击add按钮，当你输入 `Privacy` - Xcode会给你自动补全的建议，用上下键去选择吧。

私有数据的框架列表可是个不小的东西:  
> 通讯录 日历 提醒 照片 蓝牙共享 耳机 相机 定位 健康 homeKit 多媒体库 运动 callKit 语音识别 SiriKit TV Provider

参考 [这个大神](https://github.com/ChenYilong/iOS10AdaptationTips)

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
以上是常用的并且通过 App Store 审核的文本

下面是方便调试使用的隐私文案提醒

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

> 注意:_上线前务必换成友好的提醒文案._