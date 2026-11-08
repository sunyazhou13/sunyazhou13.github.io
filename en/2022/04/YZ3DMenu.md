---
layout: post
title: "Open-Source YZ3DMenu Navigation Menu"
date: 2022-04-13 09:50:00.000000000 +08:00
categories: [iOS, Swift]
tags: [Swift, AVFoundation]
typora-root-url: ..
math: false
mermaid: false

---

![3dmenu](/assets/images/20220413YZ3DMenu/3dmenu.avif)

# Preface

This article is highly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. Reposts and sharing are welcome within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

Check out the effect in the images above.

![Open-source project](/assets/images/20220413YZ3DMenu/3DMenuDemo1.avif) 
![Practical implementation](/assets/images/20220413YZ3DMenu/3DMenuDemo2.avif)

This menu is a 3D menu; it appeared in an app called cosmos. I'd been looking for time to build this feature and open-source it. Later, an open-source project similar to Weibo appeared: [Cosmos](https://github.com/zhnnnnn/ZHNCosmos). I had some time recently, so I rewrote this component.

## Implementation Principle

* Trigger via the tabbar button (with an internal pan gesture wrapper) at the right time — during dragging, on end or cancel...
* Add a new window, overlay a blur effect and a container on it, along with the dashboard menu view we wrapped up.
* During the swipe, modify the `m34` animation property of the menu view (dashboard menu) to achieve the tilted sliding effect.

![Internal variables](/assets/images/20220413YZ3DMenu/3DMenuDemo3.avif) 

Below is the code structure design of the framework.

![3D Menu Design](/assets/images/20220413YZ3DMenu/3DMenuDesign.avif)

There's a lot of code, so I won't list it all in detail here. I put the code on [github](https://github.com/sunyazhou13/YZ3DMenu) — those interested can click and take a look.



## Summary

I'd been wanting to rewrite this for a while but never found the time. Later on, I plan to rewrite a new wheel in Swift. I hope this open-source component can help you. If you have any questions, leave a comment below. It's been a long time since I wrote a blog post. In 2022, I should keep writing some hardcore technical content.

[Demo for this post](https://github.com/sunyazhou13/YZ3DMenu)   

--
Excerpt from  
[Reference: Cosmos](https://github.com/zhnnnnn/ZHNCosmos)   
[zh] zhnnnnn   
This material is protected by copyright.
