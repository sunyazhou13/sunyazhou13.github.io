---
layout: post
title: Taptic Engine振动反馈
date: 2018-08-13 14:28:04
categories: [iOS]
tags: [iOS, Objective-C, skills]
typora-root-url: ..
---

![](/assets/images/20180813TapticEngineFeedback/TapticEngine.webp)


# 前言

Taptic Engine 是苹果产品上推出的全新震动模块，该元件最早出现在 Apple Watch 中。iPhone 6s 和 iPhone 6s Plus 中，也同样内置了Taptic Engine，在设计上有所升级。

Taptic Engine 振动模块为 Apple Watch 以及 iPhone 6s、iPhone 7 提供了 Force Touch 以及 3D Touch，不同的屏幕操作，可以感受到不同的振动触觉效果，带来更好的用户体验


# 触觉振动体验

## 振动代码(旧方案)

调用这行代码虽然可以振动 但是它属于长振动

``` objc
AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
```

## 振动代码(新方案)

iOS10 引入了一种新的、产生触觉反馈的方式， 帮助用户认识到不同的震动反馈有不同的含义 。这个功能的核心就是由 UIFeedbackGenerator 提供。

`UIFeedbackGenerator` 可以帮助你实现 `haptic feedback`。它的要求是：

* 支持 Taptic Engine 机型 (iPhone 7 以及 iPhone 7 Plus).
* app 需要在前台运行
* 系统 Taptic setting 需要开启

> 下图开启 声音与触感
> 手机 -- 设置 -- 声音与触感 -- 系统触感反馈(打开)
> ![](/assets/images/20180813TapticEngineFeedback/setting.webp)
 

### 调用相关振动代码实现振动功能


`UIFeedbackGenerator` 子类有:

* UIImpactFeedbackGenerator
* UISelectionFeedbackGenerator
* UINotificationFeedbackGenerator


#### UIImpactFeedbackGenerator振动

``` objc
UIImpactFeedbackGenerator *generator = [[UIImpactFeedbackGenerator alloc] initWithStyle: UIImpactFeedbackStyleLight];
[generator impactOccurred];
```

振动style有三种枚举

``` objc
typedef NS_ENUM(NSInteger, UIImpactFeedbackStyle) {
    UIImpactFeedbackStyleLight,
    UIImpactFeedbackStyleMedium,
    UIImpactFeedbackStyleHeavy
};

```

> 基本每次振动相当于创建一个实例调用一次方法就行了,如果觉得性能更好的设计可以搞成成员变量


反馈结果

| UIImpactFeedbackGenerator | UIImpactFeedbackStyleLight | UIImpactFeedbackStyleMedium | UIImpactFeedbackStyleHeavy |
| ------| ------ | ------ | ------ |
| iPhone 7（iOS 10）及以上机型 | 微弱短振 | 中等短振 | 明显短振 |
| iPhone 6s Puls（iOS 9） | 长振 | 长振 | 长振 |
| iPhone 6（iOS 10） | 无振动 | 无振动 | 无振动 |



#### UISelectionFeedbackGenerator振动

这里我试图搞成成员变量模拟手势拖拽 振动

``` objc
@property (nonatomic, strong) UISelectionFeedbackGenerator *feedbackGesGenerator;

```
事件相应

``` objc
- (IBAction)gestrueHandle:(UIGestureRecognizer *)sender {
    switch (sender.state) {
        case UIGestureRecognizerStateBegan:
            
            // Instantiate a new generator.
            self.feedbackGesGenerator = [[UISelectionFeedbackGenerator alloc] init];
            
            // Prepare the generator when the gesture begins.
            [self.feedbackGesGenerator prepare];
            
            break;
            
        case UIGestureRecognizerStateChanged: {
            
            // Check to see if the selection has changed...
           
                // Trigger selection feedback.
                [self.feedbackGesGenerator selectionChanged];
                
                // Keep the generator in a prepared state.
                [self.feedbackGesGenerator prepare];
            
            }
            
            break;
            
        case UIGestureRecognizerStateCancelled:
        case UIGestureRecognizerStateEnded:
        case UIGestureRecognizerStateFailed:
            
            // Release the current generator.
            self.feedbackGesGenerator = nil;
            
            break;
            
        default:
            
            // Do nothing.
            break;
    }
}
```

> 注意: __这里调用了一下`[self.feedbackGesGenerator prepare]`方法让振动引擎准备就绪,方便下次快速启动__这个方法是父类的方法




#### UINotificationFeedbackGenerator振动

``` objc
UINotificationFeedbackGenerator *notifiFeedBack = [[UINotificationFeedbackGenerator alloc] init];
    [notifiFeedBack notificationOccurred:UINotificationFeedbackTypeWarning];

```

同样`UINotificationFeedbackType`也是三种枚举

``` objc
typedef NS_ENUM(NSInteger, UINotificationFeedbackType) {
    UINotificationFeedbackTypeSuccess,
    UINotificationFeedbackTypeWarning,
    UINotificationFeedbackTypeError
};
```


# 总结

几种不同的振动API 可以视情况而使用, 比较常用的是 `UIImpactFeedbackGenerator`, 当然也可以随意使用注意操作系统判断检查。

例如:

``` objc
if (@available(iOS 10.0, *)) {
	//写相关振动代码
}
```


全文完