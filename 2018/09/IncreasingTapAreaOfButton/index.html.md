---
layout: post
title: iOS扩大UIButton的点击的响应范围
date: 2018-09-20 09:40:06
categories: [iOS]
tags: [iOS, Objective-C, skills]
typora-root-url: ..
---


# 前言

开发过程中经常遇到`UIButton`点击区域太小 又不想 改动按钮的大小.

今天的文章和大家分享一下解决这种问题的代码


# 实现思路

* 子类话UIButton 复写 它的`hitTest:`方法
* 子类话UIButton 复写 point:inside:withEvent: 方法


## 第一种方式

``` swift
override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
	let biggerButtonFrame = theButton.frame.insetBy(dx: -30, dy: -30) // 1	
	if biggerButtonFrame.contains(point) { // 2
		return theButton // 3
	}		
	return super.hitTest(point, with: event) // 4
}

```


* 1. 让theButton的 x 扩大 30, y 扩大 30 (正数为缩小 负数为放大. 然后宽高 分别是2 * 30和 2 * 30)
* 2. 判断点击的位置是否在放大完的frame内.
* 3. 如果是 就返回button
* 4. 不是的话让事件继续传递


> 注意:_这里没判断 theButton.alpha == 0 和 theButton.userInterface.. ==  YES 还有它是否可见之类的,请自行判断_

## 第二种方式


复写UIView的point:方法

``` swift
override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
	let biggerFrame = bounds.insetBy(dx: -30, dy: -30)

	return biggerFrame.contains(point)
}
```


OC的版本是这样

``` objc
- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event {
	//这里写上 
	
	CGRectInset(<#CGRect rect#>, <#CGFloat dx#>, <#CGFloat dy#>)
	...
}
```


但是 第二种方式 其实 是 hitTest:方法调用之前UIView的判断,它判断当前点击的point是否在这个UIView上.

不过 还是推荐第一种方式


## 核心代码


其实 最核心的代码是


CGRectInset(<#CGRect rect#>, <#CGFloat dx#>, <#CGFloat dy#>)


> CGRect CGRectOffset(CGRect rect, CGFloat dx, CGFloat dy)是以rect为中心，根据dx和dy来实现缩小。

如果dx 和 dy是负数 则放大 ,正数则缩小

但是大家可能很疑惑 那宽度和高度怎么 缩小放大


首先: 我们明确 这个API的含义 只要传入正数 它就缩放 那么 宽高也会适当前传入的dx和dy来决定 缩放比

因为是中心点缩放 所以宽高 __要 X 2__,因为有两侧嘛,左侧缩小30右侧也需要缩小30,上部和底部是一样的.


大家可自行查阅google看下



[参考Increasing the tap area of a UIButton](https://rolandleth.com/increasing-the-tap-area-of-a-uibutton)  
[参考 iOS触摸事件全家桶](https://mp.weixin.qq.com/s/9rvSRt4kfpy7e87EJoaJOQ)

全文完




