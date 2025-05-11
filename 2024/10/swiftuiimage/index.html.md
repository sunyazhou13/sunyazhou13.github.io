---
layout: post
title: SwiftUI中的Image修改器(视图修饰符)有哪些？
date: 2024-10-28 10:35 +0000
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---

![](/assets/images/20240727Magnificationgesture/SwiftUI.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


在SwiftUI中，Image视图可以用来显示图片资源。你可以通过多种修改器（即视图修饰符）来改变Image的外观和行为。以下是一些常用的Image修改器：

* 1.`nterpolation`：设置图片的插值方式，用于定义图片缩放时的渲染质量。  
	
	``` swift
	Image("example")
	    .interpolation(.medium)	
	```
* 2.`resizable`：使图片可拉伸，通常与.aspectRatio结合使用以保持图片的原始宽高比。  

	``` swift
	Image("example")
	    .resizable()
	```

* 3.`aspectRatio`：设置图片的宽高比，可以是固定值或从图片本身继承。

	``` swift
	Image("example")
		.aspectRatio(contentMode: .fit)
	```
* 4.`frame`：设置图片的固定大小。
	
	``` swift
	Image("example")
  		.frame(width: 100, height: 100)
	```
* 5.`clipped`：决定是否裁剪图片以适应指定的尺寸。
	
	``` swift
	Image("example")
		.clipped()
	```
* 6.`antialiased`：设置是否对图片进行抗锯齿处理。

	``` swift
	Image("example")
   		.antialiased()
	```
* 7.`renderingMode`：改变图片的渲染模式，比如.original、.template等。

	``` swift
	Image("example")
	    .renderingMode(.template)
	```
* 8.`opacity`：设置图片的透明度。

	``` swift
	Image("example")
		.opacity(0.5)
	```
* 9.`overlay`：在图片上覆盖另一个视图。

	``` swift
	Image("example")
		.overlay(Circle().foregroundColor(.red))
	```
* 10.`background`：在图片背后设置一个背景颜色或另一个视图。
	
	``` swift
	Image("example")	
		.background(Color.gray)
	```
* 11.`clipShape`：将图片裁剪成特定形状，比如圆形、矩形等。

	``` swift
	Image("example")
		.clipShape(Circle())	
	```
* 12.`mask(shape:)`：使用另一个视图的形状来裁剪图片。
	
	``` swift
	Image("example")
		.mask(Circle())
	```
* 13.`padding`：在图片周围添加内边距。
	
	``` swift
	Image("example")
		.padding()
	```
* 14.`contentShape`：为图片指定一个隐含的轮廓，这在交互设计中很有用。

	``` swift
	Image("example")
		.contentShape(Rectangle())
	```
	
* 15.`onTapGesture`：为图片添加点击手势识别。

	``` swift
	Image("example")
		.onTapGesture {
        	print("Image tapped")
    	}
	```
* 16.`scaledToFit()`：将图片缩放以适应其父视图，同时保持其宽高比。

	``` swift
	Image("example")
		.resizable()
		.frame(width: 100, height: 100)
	```
* 17.`scaledToFill()`：将图片缩放以填充其父视图，可能会裁剪图片的某些部分。

	``` swift
	Image("example")
		.resizable()
		.scaledToFill()
	```
* 18.`cornerRadius(radius:)`：给图片添加圆角。
	
	``` swift
	Image("example")	
		.cornerRadius(10)
	```
* 19.`foregroundColor(color:)`:设置图片的前景色，通常用于模板图片。

	``` swift
	Image("example")
		.renderingMode(.template)
		.foregroundColor(.blue)
	```
	
* 20.`symbolRenderingMode(mode:)`：用于系统图标，设置图标的渲染模式。  
	``` swift
	Image(systemName: "wifi")	
		.symbolRenderingMode(.hierarchical)
		.foregroundColor(.blue)
	```
* 21.`foregroundStyle(style:)`：用于系统图标，设置图标的多层次颜色。

	``` swift
	Image(systemName: "wifi")
		.foregroundStyle(Color.pink, Color.green)
	```
	
* 22.`visualEffect(effect:)`：在不破坏当前布局的情况下，直接在闭包中使用视图的GeometryProxy，并对视图应用某些特定的修饰符。

	``` swift
	Image("example")
		.visualEffect { content, geometryProxy in
        		content.offset(x: geometryProxy.frame(in: .global).origin.y)
    	}
	```
	
# 总结

这些是Image视图最常用的一些修饰符,记录一下
 
 