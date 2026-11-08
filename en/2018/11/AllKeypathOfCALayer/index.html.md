---
layout: post
title: All Animatable Keypaths in iOS
date: 2018-11-13 11:46:45
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

In Core Animation, we often use CABasicAnimation or its subclasses to create animations.

In most cases we have to use a keypath. I've been studying animations recently and want to organize all the available keypaths in iOS Core Animation.



# CALayer Properties


Without further ado, here's a code snippet demonstrating the topic of this post:

``` objc
CABasicAnimation * scaleAnimation = [CABasicAnimation animation];
scaleAnimation.keyPath = @"transform.scale.x";
scaleAnimation.fromValue = @(1.0f);
scaleAnimation.toValue = @(1.0f * ScreenWidth);
```

We usually add an animation to a view's layer like this:

``` objc
[xxxView.layer addAnimation: scaleAnimation forKey:@"testAnimationName"];
```

Notice that `scaleAnimation.keyPath` is actually a string — something like a member variable that can be modified from outside. But we can't just write anything we want.

It's actually a property, or member variable, of the layer.

## What Are All the Modifiable Keypaths?

### CALayer animatable properties — the following can be animated:

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

The rest are inherited from CALayer

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

### CATransform3D Key-Value Coding Extensions (KVC keypaths)

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

> There are also additional animatable properties you can [refer to](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreAnimation_guide/AnimatableProperties/AnimatableProperties.html), and for more details you can check the [official documentation](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreAnimation_guide/Introduction/Introduction.html#//apple_ref/doc/uid/TP40004514-CH1-SW1), as well as some [structs](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreAnimation_guide/Key-ValueCodingExtensions/Key-ValueCodingExtensions.html#//apple_ref/doc/uid/TP40004514-CH12-SW2).


Those are all the animation-related `keypath`s I've found so far.


## Animatable Property Descriptions

### Geometry Properties

|Available Key Path | Description |
| ------| ------ |
|transform.rotation.x|The rotation angle in radians around the x-axis|
|transform.rotation.y|The rotation angle in radians around the y-axis|
|transform.rotation.z|The rotation angle in radians around the z-axis|
|transform.rotation|The rotation angle in radians around the z-axis, same effect as transform.rotation.z|
|transform.scale.x|Scale up/down along the x-axis|
|transform.scale.y|Scale up/down along the y-axis|
|transform.scale.z|Scale up/down along the z-axis|
|transform.scale|Scale the whole layer up/down|
|transform.translation.x|Translate along the x-axis|
|transform.translation.y|Translate along the y-axis|
|transform.translation.z|Translate along the z-axis|
|transform.translation|Both the x and y coordinates change|
|transform | The CATransform3D 4x4 matrix|
|bounds|The layer's size|
|position|The layer's position|
|anchorPoint|The anchor point position|
|cornerRadius|The corner radius|
|zPosition |The position on the z-axis|

> Note: there's no frame here. A layer's frame is not animatable; we can change position and bounds instead of frame.


### Layer Content

|Available Key Path | Description |
| ------| ------ |
|contents |The layer's content, rendered on top of the background color|

### Shadow Properties

|Available Key Path | Description |
| ------| ------ |
|shadowColor|The shadow color|
|shadowOffset|The shadow offset distance|
|shadowOpacity|The shadow opacity|
|shadowRadius|The shadow blur radius|
|shadowPath|The shadow path|

### Opacity Property

|Available Key Path | Description |
| ------| ------ |
|opacity|The opacity|

### Mask Properties

|Available Key Path | Description |
| ------| ------ |
|mask| |

### ShapeLayer Properties

|Available Key Path | Description |
| ------| ------ |
| fillColor | The fill color |
| strokeColor | The stroke color |
| strokeStart | The stroke starts, from none to full |
| strokeEnd |  The stroke ends, from full to none |
| lineWidth |The line width of the path|
| miterLimit | The maximum length of the intersection |
| lineDashPhase | The dashed line style |




# Summary

That's every keypath I've collected so far; hope it saves you some time.

Years ago, walking down the street from Huihuang International to Xi'erqi, I kept wondering why animation keypaths are always strings and so easy to typo. Today this post of mine provides the answer: KVC member variables don't let you access the variable name directly; instead, you have to write the variable name as a string, and the content is manipulated through the string.
