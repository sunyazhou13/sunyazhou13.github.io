---
layout: post
title: Xcode9 New Feature Wireless Debugging on a Real Device
date: 2017-06-16 11:07:46
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills] 
typora-root-url: ..
math: false
mermaid: false

---

### Effect
 
Today my friend (Wang Kecheng) discovered that Xcode has a very convenient feature — you can debug and run on a real device wirelessly.

Take a look at this image.  
![debug](/assets/images/20170616XcodeDebugViaWireless/debug.avif)


### Configuration

Step 1: Select the device option

![setting](/assets/images/20170616XcodeDebugViaWireless/setting1.avif)

Step 2: Check the "via network" box

![setting](/assets/images/20170616XcodeDebugViaWireless/setting2.avif)

The remaining work is just unplugging that white data cable that we absolutely hate but have to use, that costs a fortune and always breaks at the connector.



*Note: the first run is a bit slow; you can plug in the cable and run it once first*
*Running environment: Xcode9 beta*
*Device OS: iOS11 beta*
*Macbook + iPhone are best on the same LAN*

I guess this will be much more usable once Apple ships the official release.

Okay, now we can have fun with it.

