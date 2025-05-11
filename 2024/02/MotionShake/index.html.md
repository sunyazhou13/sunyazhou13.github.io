---
layout: post
title: 运动传感器摇晃检测
date: 2024-02-21 06:56 +0000
categories: [iOS, SwiftUI]
tags: [iOS, macOS,iPadOS,watchOS, SwiftUI]
typora-root-url: ..
---

![](/assets/images/20240222MotionShake/CMMotion.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或引用,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,这样您将能在第一时间获取本站信息.


## 背景说明

最近开发遇到用户反馈,开启晃动手机切换歌曲时,放裤兜或者衣服口袋中,很容易触发主动切换歌曲,带着这个问题,我仔
细研究了一下固有代码.

很显然用户使用摇一摇手机切换歌曲的灵敏度太高了.那怎么调整灵敏度到一个合理区间呢？

# 实现摇晃动作的几种方式

* 1.系统事件
* 2.CMMotionManager加速计api
* 3.UIAccelerometer

## 系统的摇一摇事件

我们可以写一个继承自`UIResponder`的类,实现如下方法

``` objc
 -(BOOL)canBecomeFirstResponder {
    return YES;
}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    if (event.subtype == UIEventSubtypeMotionShake) {
        NSLog(@"摇晃手势被检测到");
        // 在这里处理摇晃手势事件
    }
}
```

比如在UIViewController中我们 实现上述代码


``` objc
- (void)viewDidLoad {
    [super viewDidLoad];
    [self becomeFirstResponder];
}

- (BOOL)canBecomeFirstResponder {
    return YES;
}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    if (event.subtype == UIEventSubtypeMotionShake) {
        NSLog(@"摇晃手势被检测到");
        // 在这里处理摇晃手势事件
    }
}
```

就可以在Objective-C中实现摇晃手势检测了

> 然而这种模式没有入口让我设置阈值控制摇一摇的灵敏度

## CMMotionManager

首先先搞清楚这里有啥,iOS 中常见传感器如下所示:

| 类型 | 作用 | 备注 |
| ------| ------ | ------ |
| 环境光传感器 | 感应光照强度 | |
| 距离传感器	| 感应靠近设备屏幕的物体 | |
| 磁力计传感器 | 感应周边磁场 | |
| 内部温度传感器	| 感应设备内部温度（非公开） | 
| 湿度传感器	| 感应设备是否进水（非微电子传感器） | 
| 陀螺仪	| 感应持握方式 | 
| 加速计	| 感应设备运动 | 

CMMotionManager 是 `Core Motion` 库的核心类，负责获取和处理手机的运动信息，它可以获取的数据有:  

* 加速度，标识设备在三维空间中的瞬时加速度
* 陀螺仪，标识设备在三个主轴上的瞬时旋转
* 磁场信息，标识设备相对于地球磁场的方位
* 设备运动数据，标识关键的运动相关属性，包括设备用户引起的加速度、姿态、旋转速率、相对于校准磁场的方位以及相对于重力的方位等，这些数据均来自于 Core Motion 的传感器融合算法，从这一个数据接口即可获取以上三种数据，因此使用较为广泛.比如nike的跑鞋app 计算步数就是依赖于这个传感器.

[了解更多CMMotion可以参考这里](https://www.jianshu.com/p/2f5cca76c5ee)

使用这个`CMMotionManager `之前我们要保证在info.plist中加入Privacy – Motion Usage Description.让用户知道我们为什么要用这个传感器.

``` xml
<key>NSMotionUsageDescription</key>
<string>请选择“允许”，可为您提供晃动切换歌曲</string>  
```

下面是使用的示例代码

``` objc
#import <CoreMotion/CoreMotion.h>

@interface ShakeDetector : NSObject
@property (nonatomic, strong) CMMotionManager *motionManager;
- (void)startShakeDetection;

@end

#import "ShakeDetector.h"

@implementation ShakeDetector  

- (void)startShakeDetection {
    self.motionManager = [[CMMotionManager alloc] init];
    self.motionManager.deviceMotionUpdateInterval = 1.0/60.0;
    [self.motionManager startDeviceMotionUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMDeviceMotion *motion, NSError *error) {
        CMAcceleration userAcceleration = motion.userAcceleration;
        double accelerationThreshold = 0.30;
        if (fabs(userAcceleration.x) > accelerationThreshold || fabs(userAcceleration.y) > accelerationThreshold || fabs(userAcceleration.z) > accelerationThreshold) {
            // 在这里处理摇晃动作的逻辑
            NSLog(@"Device shaken!");
        }
    }];
}

@end
```

### 实现原理

实现原理：通过x、y、z三个轴的方向的加速度计算出摇动手机时，手机摇动方向的加速度a,

$$
\begin{align}  
  g = \sqrt{x^2+y^2+z^2}
\end{align}  
$$


加速计中的单位为：g(重力加速度9.8米/秒), 当g > 1.6, 记录一次摇动.参考范围(2.0~3.0).



``` objc
typedef struct {
	double x;
	double y;
	double z;
} CMAcceleration;
```

通过传感器返回的`CMAcceleration `结构体,和我们指定的阈值做检测,通过加速计的x, y, z分别check是否大于我们设置的阈值.如果其中任何一个值大于我们指定的阈值,就说明我们检测到了`摇晃动作`可以理解为摇一摇.

``` objc
double threshold = 2.45; //指定灵敏度阈值
if (fabs(acceleration.x) > threshold || fabs(acceleration.y) > threshold || fabs(acceleration.z) > threshold) {
    	...
}
```

`threshold`阈值这里需要可以参考如下:  
* **对于一般的摇一摇功能，阈值大小可以在1.0到2.0之间**.  
* **如果需要更高的灵敏度，可以选择较小的阈值，例如0.5到1.0**.  
* **如果需要较低的灵敏度，可以选择较大的阈值，例如2.0到3.0**.

`2.45`是我测试出来比较适合大部分人手摇晃的力量,并且避免轻微晃动触发得出的理想值.

### 队列控制

当我使用`CMMotionManager`时注意,最好是放在一个单独的队列中.主要是担心放主线程影响主线程性能.

``` objc
//注意这里 customeMotionOperationQueue
[self.motionManager startAccelerometerUpdatesToQueue:customeMotionOperationQueue withHandler:..];
```

### 频率优化

因为根据上述原理介绍我们可以通过x, y, z轴的加速度来检测当前是否是摇晃,但是有可能 上下操作过快会导致检测触发多次,为了控制 多次之间的间隙太短问题,我们通过如下代码控制频率

``` objc
@property (nonatomic, assign) CFAbsoluteTime beforeTime; //记得初始化赋值.
...

// 检测到摇晃动作
CFAbsoluteTime afterTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑后的时间
CFTimeInterval timeDifference = afterTime - self.beforeTime; // 计算时间差 单位秒 s
CFTimeInterval intervalSenonds = 1.0;  
if (timeDifference >= intervalSenonds) { //控制检测前后间隔
    //NSLog(@"检测到摇晃动作,距离上次检测: f seconds", timeDifference);
    self.beforeTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑前的时间
    if (self.didAcceleratorDectecdBlock) {
        self.didAcceleratorDectecdBlock();
    }
} else {
    //NSLog(@"检测到摇晃动作,间隔不满足 f seconds,忽略本次检测!",intervalSenonds);
}

```

这样就控制了加速计多次检测触发频率比较频繁的回调问题.

### 编写工具类 20240326更新,优化晃动算法,防止误触

然后写个工具类,把上述的内容全部放到一个工具类中供大家使用, 我们写一个MTCMMotionTool类用于封装加速计传感器的实现

//.h文件

``` objc
typedef NS_ENUM(NSUInteger, MTAccelerationAlgorithm) {
    MTAccelerationAlgorithmNormal = 0,  //常规算法摇一摇
    MTAccelerationAlgorithmLPF    = 1,  //低通滤波器来平滑加速度 减少误触
};

/**
 利用门面模式,对外暴露统一接口
 */
@interface MTCMMotionTool : NSObject

/**
 1.对于一般的摇一摇功能，阈值大小可以在1.0到2.0之间。
   如果需要更高的灵敏度，可以选择较小的阈值，例如0.5到1.0。
   如果需要较低的灵敏度，可以选择较大的阈值，例如2.0到3.0。
 2.对于LPF低通录波器平滑算法,阈值大小参考范围 0.33~0.88
*/
@property (nonatomic, assign) CGFloat accelerateThreshold; //加速计灵敏度阈值,Normal算法默认 2.45, LPF算法0.38(建议控制在0.33~0.88)
@property (nonatomic, assign) CGFloat accelerateDetectedInterval; //加速计检查动作后的前后两次间隔时间,防止频繁检测执行 单位秒Senonds.default 1s.
@property (nonatomic, copy) void (^didAcceleratorDectecdBlock)(void);
@property (nonatomic, assign) MTAccelerationAlgorithm accelerationAlgorithm; //使用加速计 检测摇一摇算法类型

//启动加速计
- (void)startAccelerometer;
//停止加速计
- (void)stopAccelerometer;

@end
```

//.m文件

``` objc
#define kFilteringFactor 0.1  // 初始化低通滤波器

@interface MTCMMotionTool() <UIAccelerometerDelegate>

@property (nonatomic, strong) CMMotionManager *motionManager;
@property (nonatomic, strong) NSOperationQueue *cmMotionOperationQueue;
@property (nonatomic, assign) CFAbsoluteTime beforeTime;

/// 传统加速计暂存值
@property (nonatomic, assign) UIAccelerationValue accelerationX;
@property (nonatomic, assign) UIAccelerationValue accelerationY;
@property (nonatomic, assign) double currentRawReading;

/// 低通滤波器平滑用到加速计
@property (nonatomic, assign) CMAcceleration previousAcceleration;

@end

@implementation MTCMMotionTool

- (instancetype)init
{
    self = [super init];
    if (self) {
        self.accelerateThreshold = 0.0f;
        self.accelerateDetectedInterval = 1; //1s
        CMAcceleration acceleration;
        acceleration.x = 0;
        acceleration.y = 0;
        acceleration.z = 0;
        self.previousAcceleration = acceleration;
        self.beforeTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑前的时间
    }
    return self;
}

#pragma mark -
#pragma mark - private methods 私有方法
//Note that when the updates are stopped, all operations in the given NSOperationQueue will be cancelled
- (void)createOperationQueueIfNeeded
{
    if (self.cmMotionOperationQueue == nil) {
        self.cmMotionOperationQueue = [[NSOperationQueue alloc] init];
    }
}

- (void)startAccelerometerUpdates {
    [self createOperationQueueIfNeeded]; //按需创建队列,当队里中的各种传感器stop时 会自动移除operation.
    if (self.motionManager == nil) {
        self.motionManager = [[CMMotionManager alloc] init];
    }
    if (self.motionManager.isAccelerometerAvailable) {
        self.motionManager.accelerometerUpdateInterval = 0.2;
        __weak typeof(self) weakSelf = self;
        [self.motionManager startAccelerometerUpdatesToQueue:self.cmMotionOperationQueue
                                                 withHandler:^(CMAccelerometerData *accelerometerData, NSError *error) {
            __strong typeof(weakSelf) strongSelf = weakSelf;
            if (accelerometerData) {
                [self detectShake:accelerometerData.acceleration];
            }
        }];
    }
}

- (void)stopAccelerometerUpdates
{
    if (self.motionManager) {
        [self.motionManager stopAccelerometerUpdates];
        self.motionManager = nil;
    }
}

- (void)detectShake:(CMAcceleration)acceleration {
    if (self.accelerationAlgorithm == MTAccelerationAlgorithmNormal) {
        [self normalDetectShake:acceleration];
    } else if (self.accelerationAlgorithm == MTAccelerationAlgorithmLPF) {
        [self lpfDetectShake:acceleration];
    } else {
        //使用其它算法实现摇一摇
    }
}

- (void)normalDetectShake:(CMAcceleration)acceleration
{
    double threshold = self.accelerateThreshold;
    if (fabs(acceleration.x) > threshold || fabs(acceleration.y) > threshold || fabs(acceleration.z) > threshold) {
        // 检测到摇晃动作
        CFAbsoluteTime afterTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑后的时间
        CFTimeInterval timeDifference = afterTime - self.beforeTime; // 计算时间差 单位秒 s
        CFTimeInterval intervalSenonds = self.accelerateDetectedInterval;
        if (timeDifference >= intervalSenonds) { //控制检测前后间隔
            //NSLog(@"检测到摇晃动作,距离上次检测: 1f seconds", timeDifference);
            self.beforeTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑前的时间
            if (self.didAcceleratorDectecdBlock) {
                self.didAcceleratorDectecdBlock();
            }
        } else {
            //NSLog(@"检测到摇晃动作,间隔不满足 1f seconds,忽略本次检测!",intervalSenonds);
        }
    }
}

//低通滤波器来平滑加速度数据，并计算加速度变化率。通过调整 kFilteringFactor 和阈值来适应具体需求，可以减少误触的可能性
- (void)lpfDetectShake:(CMAcceleration)acceleration
{
    // 应用低通滤波器
    CMAcceleration filteredAcceleration;
    filteredAcceleration.x = (acceleration.x * kFilteringFactor) + (self.previousAcceleration.x * (1.0 - kFilteringFactor));
    filteredAcceleration.y = (acceleration.y * kFilteringFactor) + (self.previousAcceleration.y * (1.0 - kFilteringFactor));
    filteredAcceleration.z = (acceleration.z * kFilteringFactor) + (self.previousAcceleration.z * (1.0 - kFilteringFactor));

    // 计算加速度变化率
    double deltaX = fabs(filteredAcceleration.x - self.previousAcceleration.x);
    double deltaY = fabs(filteredAcceleration.y - self.previousAcceleration.y);
    double deltaZ = fabs(filteredAcceleration.z - self.previousAcceleration.z);

    // 更新上一次加速度
    self.previousAcceleration = filteredAcceleration;

    // 判断是否发生了摇晃
    double threshold = self.accelerateThreshold;
    if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
        // 检测到摇晃动作
        CFAbsoluteTime afterTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑后的时间
        CFTimeInterval timeDifference = afterTime - self.beforeTime; // 计算时间差 单位秒 s
        CFTimeInterval intervalSenonds = self.accelerateDetectedInterval;
        if (timeDifference >= intervalSenonds) { //控制检测前后间隔
            //NSLog(@"LFP算法检测到摇晃动作,距离上次检测: 1f seconds", timeDifference);
            self.beforeTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑前的时间
            if (self.didAcceleratorDectecdBlock) {
                self.didAcceleratorDectecdBlock();
            }
            //NSLog(@"LFP算法检测到摇晃动,{2f,2f,2f}",deltaX, deltaY, deltaZ);
        } else {
            //NSLog(@"LFP算法检测到摇晃动作,间隔不满足 1f seconds,忽略本次检测!",intervalSenonds);
        }
    }
}

#pragma mark -
#pragma mark - public methods 公有方法
- (void)startAccelerometer
{
    [self startAccelerometerUpdates];
}

- (void)stopAccelerometer
{
    [self stopAccelerometerUpdates];
}

#pragma mark -
#pragma mark - UIAccelerometerDelegate
#pragma mark- shake change song
CGFloat KWCMMgrRadiansToDegrees(CGFloat radians) {return radians * 180/M_PI;}
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
-(void)accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration{
    static double shakeDate = 0.0f;
    self.accelerationX = acceleration.x * kFilteringFactor + self.accelerationX * (1.0 - kFilteringFactor);
    self.accelerationY = acceleration.y * kFilteringFactor + self.accelerationY * (1.0 - kFilteringFactor);
    if (fabs(acceleration.x) >= self.self.accelerateThreshold||
        fabs(acceleration.y) >= self.accelerateThreshold ) {
        if ([NSDate timeIntervalSinceReferenceDate] - shakeDate > self.accelerateDetectedInterval) {
            self.accelerationX = acceleration.x * kFilteringFactor + self.accelerationX * (1.0 - kFilteringFactor);
            self.accelerationY = acceleration.y * kFilteringFactor + self.accelerationY * (1.0 - kFilteringFactor);
            self.currentRawReading =atan2(self.accelerationY, self.accelerationX);
            float rotation = -KWCMMgrRadiansToDegrees(self.currentRawReading);
            if (fabsf(rotation) > 70.0 ) {
                if (self.didAcceleratorDectecdBlock) {
                    self.didAcceleratorDectecdBlock();
                }
                shakeDate = [NSDate timeIntervalSinceReferenceDate];
            }
        }
    }
}

#pragma mark -
#pragma mark - life cycle 视图的生命周期
- (void)dealloc
{
    if (self.cmMotionOperationQueue) {
        [self.cmMotionOperationQueue cancelAllOperations];
        self.cmMotionOperationQueue = nil;
    }
}

@end

```

以上就是 CMMotionManager方案的实现代码.

## UIAccelerometer

这个类远古时期的方案,从iOS2.0~iOS5.0的方式, 现在都iOS17时代了,我觉得它应该领退休金了,可是它坚持依然坚守岗位,依然在发挥作用.

``` objc
UIKIT_EXTERN API_DEPRECATED("UIAcceleration has been replaced by the CoreMotion framework", ios(2.0, 5.0)) API_UNAVAILABLE(visionos) API_UNAVAILABLE(tvos) NS_SWIFT_UI_ACTOR
```

使用起来比较简单粗暴.

``` objc
if (enableShake) {
	[[UIAccelerometer sharedAccelerometer] setDelegate:nil];
	[[UIAccelerometer sharedAccelerometer] setDelegate:self];
	[[UIAccelerometer sharedAccelerometer] setUpdateInterval:0.1];
} else {
	[[UIAccelerometer sharedAccelerometer] setDelegate:nil];
}
```

然后实现代理后.

``` objc
- (void)accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration
{
	 acceleration.x  ...
	 acceleration.y ...
	 acceleration.z ...
	 ...	 
	 做和之前CMMotionManager回调中同样逻辑check就好.
	 ...
}

```

这个`UIAcceleration`类在iOS6之前是一个class

``` objc
@interface UIAcceleration : NSObject

@property(nonatomic,readonly) NSTimeInterval timestamp;
@property(nonatomic,readonly) UIAccelerationValue x;
@property(nonatomic,readonly) UIAccelerationValue y;
@property(nonatomic,readonly) UIAccelerationValue z;

@end
```

在后来的传感器整合中 变成了结构体,

如果非要说UIAcceleration有啥优势的话,莫过于它不用在plist中添加隐私描述就能拿到用户传感器数据,不知道有没有啥适配问题如果不加隐私描述.

### 2024年3月26日更新

增加低通滤波器平滑算法,防止摇晃导致误触.

``` objc

//低通滤波器来平滑加速度数据，并计算加速度变化率。通过调整 kFilteringFactor 和阈值来适应具体需求，可以减少误触的可能性
- (void)lpfDetectShake:(CMAcceleration)acceleration
{
    // 应用低通滤波器
    CMAcceleration filteredAcceleration;
    filteredAcceleration.x = (acceleration.x * kFilteringFactor) + (self.previousAcceleration.x * (1.0 - kFilteringFactor));
    filteredAcceleration.y = (acceleration.y * kFilteringFactor) + (self.previousAcceleration.y * (1.0 - kFilteringFactor));
    filteredAcceleration.z = (acceleration.z * kFilteringFactor) + (self.previousAcceleration.z * (1.0 - kFilteringFactor));

    // 计算加速度变化率
    double deltaX = fabs(filteredAcceleration.x - self.previousAcceleration.x);
    double deltaY = fabs(filteredAcceleration.y - self.previousAcceleration.y);
    double deltaZ = fabs(filteredAcceleration.z - self.previousAcceleration.z);

    // 更新上一次加速度
    self.previousAcceleration = filteredAcceleration;

    // 判断是否发生了摇晃
    double threshold = self.accelerateThreshold;
    if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
        // 检测到摇晃动作
        CFAbsoluteTime afterTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑后的时间
        CFTimeInterval timeDifference = afterTime - self.beforeTime; // 计算时间差 单位秒 s
        CFTimeInterval intervalSenonds = self.accelerateDetectedInterval;
        if (timeDifference >= intervalSenonds) { //控制检测前后间隔
            //NSLog(@"LFP算法检测到摇晃动作,距离上次检测: 1f seconds", timeDifference);
            self.beforeTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑前的时间
            if (self.didAcceleratorDectecdBlock) {
                self.didAcceleratorDectecdBlock();
            }
            //NSLog(@"LFP算法检测到摇晃动,{2f,2f,2f}",deltaX, deltaY, deltaZ);
        } else {
            //NSLog(@"LFP算法检测到摇晃动作,间隔不满足 1f seconds,忽略本次检测!",intervalSenonds);
        }
    }
}

```


# 总结

以上就是几种不同方式检测类似摇晃、摇一摇功能的代码,按需索取,复杂一些就选择CMMotionManager,如果就简单想实现摇一摇就选择系统的事件就好了, 非常规情况下使用UIAcceleration.

当然大家也可以把三种方案都封装一下内部可以通过选择来控制使用哪种.

以上就是运动传感器的加速计在应用中的实现优化,水文见笑见笑.

[参考CMDevice​Motion](https://nshipster.com/cmdevicemotion/)  
[Swift – 實現搖一搖功能](https://badgameshow.com/steven/swift/https-badgameshow-com-steven-195/)  

