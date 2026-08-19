---
layout: post
title: iOS所有Animation相关可用的Keypath
date: 2018-11-13 11:46:45
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
---


# 前言

在Core Animation中 我们经常使用CABasicAnimation或者它的子类做一些动画

一般情况下我们都要用到Keypath,最近在研究动画,想整理一下所有可用的Keypath在iOS的核心动画中.



# CALayer的相关属性


废话不多说 我们上一段代码演示一下 这篇的主题

``` objc
CABasicAnimation * scaleAnimation = [CABasicAnimation animation];
scaleAnimation.keyPath = @"transform.scale.x";
scaleAnimation.fromValue = @(1.0f);
scaleAnimation.toValue = @(1.0f * ScreenWidth);
```

一般我们给一个View的Layer添加animation

``` objc
[xxxView.layer addAnimation: scaleAnimation forKey:@"testAnimationName"];
```

这里面我们注意到`scaleAnimation.keyPath`它实际上是一个字符串 是一个被外部修改的成员变量的类似的东西,但是我们自己又不能随便想写写啥

这个实际上是一个layer的属性 或者成员变量.

## 全部可修改的keypath有哪些呢？

### CALayer animatable properties 动画有如下这些

``` 
nchorPoint
backgroundColor
backgroundFilters
borderColor
borderWidth
bounds
compositingFilter
contents
contentsRect
cornerRadius
doubleSided
filters
frame
hidden
mask
masksToBounds
opacity
position
shadowColor
shadowOffset
shadowOpacity
shadowPath
shadowRadius
sublayers
sublayerTransform
transform
zPosition

```

剩下的都是继承自CALayer

### CAEmitterLayer animatable properties:

``` 
emitterPosition
emitterZPosition
emitterSize
```

### CAGradientLayer animatable properties

```
colors
locations
endPoint
startPoint

```

### CAReplicatorLayer animatable properties


```
instanceDelay
instanceTransform
instanceRedOffset
instanceGreenOffset
instanceBlueOffset
instanceAlphaOffset

```

### CAShapeLayer animatable properties

``` 
fillColor
lineDashPhase
lineWidth
miterLimit
strokeColor
strokeStart
strokeEnd

```

###  CATextLayer animatable properties

```
fontSize
foregroundColor

```

### CATransform3D Key-Value Coding Extensions(KVC的 Keypath)

```

rotation.x
rotation.y
rotation.z
rotation
scale.x
scale.y
scale.z
scale
translation.x
translation.y
translation.z

```

#### CGPoint keyPaths

```
x
y

```

#### CGSize keyPaths

```
width
height

```

### CGRect keyPaths

```
origin
origin.x
origin.y
size
size.width
size.height
```

> 还有一些附加可[参考](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreAnimation_guide/AnimatableProperties/AnimatableProperties.html), 以及详细内容可以参考[官方文档](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreAnimation_guide/Introduction/Introduction.html#//apple_ref/doc/uid/TP40004514-CH1-SW1),以及一些[结构体](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreAnimation_guide/Key-ValueCodingExtensions/Key-ValueCodingExtensions.html#//apple_ref/doc/uid/TP40004514-CH12-SW2).


以上就是所有我目前找到的全部动画可用的`keypath`.


## 可动画属性介绍

### 几何属性(Geometry Properties)

|可用 Key Path | 示意 |
| ------| ------ |
|transform.rotation.x|按x轴旋转的弧度|
|transform.rotation.y|按y轴旋转的弧度|
|transform.rotation.z|按z轴旋转的弧度|
|transform.rotation|按z轴旋转的弧度, 和transform.rotation.z效果一样|
|transform.scale.x|在x轴按比例放大缩小|
|transform.scale.y|在y轴按比例放大缩小|
|transform.scale.z|在z轴按比例放大缩小|
|transform.scale|整体按比例放大缩小|
|transform.translation.x|沿x轴平移|
|transform.translation.y|沿y轴平移|
|transform.translation.z|沿z轴平移|
|transform.translation| x,y 坐标均发生改变 |
|transform | CATransform3D 4xbounds4矩阵|
|bounds|layer大小|
|position|layer位置|
|anchorPoint|锚点位置|
|cornerRadius| 圆角大小 |
|zPosition |z轴位置 |

> 注意: 这里没有frame,layer的 frame 是不支持动画的，我们可以通过改变position和bounds来代替frame


### Layer内容 (Layer Content)

|可用 Key Path | 示意 |
| ------| ------ |
|contents | Layer内容，呈现在背景颜色之上|

### 阴影属性 (Shadow Properties)

|可用 Key Path | 示意 |
| ------| ------ |
|shadowColor|阴影颜色|
|shadowOffset| 阴影偏移距离 |
|shadowOpacity|阴影透明度|
|shadowRadius|阴影圆角|
|shadowPath|阴影轨迹|

### 透明度 (Opacity Property)

|可用 Key Path | 示意 |
| ------| ------ |
|opacity| 透明度|

### 遮罩 (Mask Properties)

|可用 Key Path | 示意 |
| ------| ------ |
|mask| |

### ShapeLayer属性 (ShapeLayer)

|可用 Key Path | 示意 |
| ------| ------ |
| fillColor | 填充颜色 |
| strokeColor | 描边颜色 |
| strokeStart | 描边颜色开始 从无到有 |
| strokeEnd |  描边颜色结束 从有到无 |
| lineWidth |路径的线宽|
| miterLimit | 相交长度的最大值 |
| lineDashPhase | 虚线样式 |




# 总结

以上是我 搜集整理 到的所有keypath仅供参考

多年前 我走在 辉煌国际到西二旗的大街上 脑袋里还在思考 为什么animation的这种keypath总是搞成字符串 整整就容易写错.今天自己的这篇文章给了答案,答案是 KVC的成员变量并没有直接获取变量名,而是要写成 字符串的变量名.内容通过字符串去做一些事情.

