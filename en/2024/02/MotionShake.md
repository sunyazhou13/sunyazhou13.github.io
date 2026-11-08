---
layout: post
title: Motion Sensor Shake Detection
date: 2024-02-21 06:56 +0000
categories: [iOS, SwiftUI]
tags: [iOS, macOS,iPadOS,watchOS, SwiftUI]
typora-root-url: ..
math: true
mermaid: false
---

![CM Motion](/assets/images/20240222MotionShake/CMMotion.avif)

# Preface

This article carries strong personal sentiment. If it makes you uncomfortable, please close it as soon as possible. This article is only for personal study records. Reprinting or sharing within the scope of the license is also welcome. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS, so you'll get the latest updates from this site as soon as they're published.


## Background

Recently in development, I received user feedback that when the shake-to-switch-songs feature is enabled, putting the phone in a pants pocket or clothing pocket easily triggers an unwanted song switch. With this problem in mind, I carefully
studied the existing code.

Clearly the shake-to-switch-song sensitivity is far too high. So how do we tune it into a reasonable range?

# Several Ways to Implement the Shake Gesture

* 1. System events
* 2. The CMMotionManager accelerometer API
* 3. UIAccelerometer

## The System's Shake Event

We can write a class that inherits from `UIResponder` and implement the following methods

``` objc
 -(BOOL)canBecomeFirstResponder {
    return YES;
}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    if (event.subtype == UIEventSubtypeMotionShake) {
        NSLog(@"摇晃手势被检测到");
        // Handle the shake gesture event here
    }
}
```

For example, in a UIViewController we can implement the above code


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
        // Handle the shake gesture event here
    }
}
```

This way, shake gesture detection can be implemented in Objective-C.

> However, this pattern doesn't provide an entry point for me to set a threshold to control the shake sensitivity

## CMMotionManager

First, let's clarify what's available here. Here are the common sensors in iOS:

| Type | Function | Notes |
| ------| ------ | ------ |
| Ambient light sensor | Senses ambient light intensity | |
| Proximity sensor	| Senses objects approaching the device screen | |
| Magnetometer | Senses the surrounding magnetic field | |
| Internal temperature sensor	| Senses the internal temperature of the device (not public) | 
| Humidity sensor	| Senses whether the device has water ingress (not a microelectronic sensor) | 
| Gyroscope	| Senses the way the device is held | 
| Accelerometer	| Senses device motion | 

CMMotionManager is the core class of the `Core Motion` framework, responsible for obtaining and processing the phone's motion information. The data it can obtain includes:  

* Acceleration, indicating the device's instantaneous acceleration in three-dimensional space
* Gyroscope, indicating the device's instantaneous rotation around the three principal axes
* Magnetic field information, indicating the device's orientation relative to the Earth's magnetic field
* Device motion data, indicating key motion-related properties, including acceleration caused by the user, attitude, rotation rate, orientation relative to the calibrated magnetic field, and orientation relative to gravity. These data all come from Core Motion's sensor fusion algorithm; you can obtain all three types of data above from this single data interface, so it's widely used. For example, Nike's running shoe app calculates steps relying on this sensor.

[Learn more about CMMotion here](https://www.jianshu.com/p/2f5cca76c5ee)

Before using `CMMotionManager`, we need to make sure to add Privacy – Motion Usage Description to info.plist, so users know why we're using this sensor.

``` xml
<key>NSMotionUsageDescription</key>
<string>请选择“允许”，可为您提供晃动切换歌曲</string>  
```

Below is example usage code

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
            // Handle the shake logic here
            NSLog(@"Device shaken!");
        }
    }];
}

@end
```

### Implementation Principle

Implementation principle: use the acceleration along the x, y, and z axes to calculate the acceleration a in the direction of the shake when the phone is shaken.

$$
\begin{align}  
  g = \sqrt{x^2+y^2+z^2}
\end{align}  
$$


The unit used by the accelerometer is g (gravitational acceleration, 9.8 m/s²). When g > 1.6, count it as one shake. Reference range (2.0~3.0).



``` objc
typedef struct {
	double x;
	double y;
	double z;
} CMAcceleration;
```

Use the `CMAcceleration` struct returned by the sensor to check against the threshold we specify: check whether the accelerometer's x, y, and z values are each greater than the threshold we set. If any one of them exceeds the threshold we specified, it means we've detected a `shake motion`, which can be understood as a shake.

``` objc
double threshold = 2.45; //指定灵敏度阈值
if (fabs(acceleration.x) > threshold || fabs(acceleration.y) > threshold || fabs(acceleration.z) > threshold) {
    	...
}
```

The `threshold` value can refer to the following:  
* **For general shake functions, the threshold can be between 1.0 and 2.0**.  
* **If you need higher sensitivity, choose a smaller threshold, e.g., 0.5 to 1.0**.  
* **If you need lower sensitivity, choose a larger threshold, e.g., 2.0 to 3.0**.

`2.45` is the ideal value I arrived at through testing: it suits the shaking strength of most people's hands while avoiding triggering from slight movement.

### Queue Control

When using `CMMotionManager`, note that it's best to put it on a separate queue, mainly because putting it on the main thread could affect main-thread performance.

``` objc
//Note: customeMotionOperationQueue here
[self.motionManager startAccelerometerUpdatesToQueue:customeMotionOperationQueue withHandler:..];
```

### Frequency Optimization

Because according to the principle above we can use the x, y, z axis acceleration to detect whether there's a shake, but if the shaking motion is too fast, the detection may be triggered multiple times. To control the problem of intervals between triggers being too short, we control the frequency with the following code

``` objc
@property (nonatomic, assign) CFAbsoluteTime beforeTime; //记得初始化赋值.
...

// Shake detected
CFAbsoluteTime afterTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑后的时间
CFTimeInterval timeDifference = afterTime - self.beforeTime; // 计算时间差 单位秒 s
CFTimeInterval intervalSenonds = 1.0;  
if (timeDifference >= intervalSenonds) { //控制检测前后间隔
    //NSLog(@"Shake detected, time since last detection: f seconds", timeDifference);
    self.beforeTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑前的时间
    if (self.didAcceleratorDectecdBlock) {
        self.didAcceleratorDectecdBlock();
    }
} else {
    //NSLog(@"Shake detected, interval does not meet f seconds, ignoring this detection!", intervalSenonds);
}

```

This controls the problem of the accelerometer triggering callbacks too frequently from repeated detections.

### Writing a Utility Class - Updated 2024-03-26, optimizing the shake algorithm to prevent false triggers

Then write a utility class, putting all the above content into one utility class for everyone to use. We'll write an MTCMMotionTool class to wrap up the accelerometer sensor implementation

//.h file

``` objc
typedef NS_ENUM(NSUInteger, MTAccelerationAlgorithm) {
    MTAccelerationAlgorithmNormal = 0,  //常规算法摇一摇
    MTAccelerationAlgorithmLPF    = 1,  //低通滤波器来平滑加速度 减少误触
};

/**
 Use the facade pattern to expose a unified interface
 */
@interface MTCMMotionTool : NSObject

/**
 1. For general shake functions, the threshold can be between 1.0 and 2.0.
   If you need higher sensitivity, choose a smaller threshold, e.g., 0.5 to 1.0.
   If you need lower sensitivity, choose a larger threshold, e.g., 2.0 to 3.0.
 2. For the LPF low-pass filter smoothing algorithm, the threshold reference range is 0.33~0.88
*/
@property (nonatomic, assign) CGFloat accelerateThreshold; //加速计灵敏度阈值,Normal算法默认 2.45, LPF算法0.38(建议控制在0.33~0.88)
@property (nonatomic, assign) CGFloat accelerateDetectedInterval; //加速计检查动作后的前后两次间隔时间,防止频繁检测执行 单位秒Senonds.default 1s.
@property (nonatomic, copy) void (^didAcceleratorDectecdBlock)(void);
@property (nonatomic, assign) MTAccelerationAlgorithm accelerationAlgorithm; //使用加速计 检测摇一摇算法类型

//Start the accelerometer
- (void)startAccelerometer;
//Stop the accelerometer
- (void)stopAccelerometer;

@end
```

//.m file

``` objc
#define kFilteringFactor 0.1  // 初始化低通滤波器

@interface MTCMMotionTool() <UIAccelerometerDelegate>

@property (nonatomic, strong) CMMotionManager *motionManager;
@property (nonatomic, strong) NSOperationQueue *cmMotionOperationQueue;
@property (nonatomic, assign) CFAbsoluteTime beforeTime;

/// Temporary values for the traditional accelerometer
@property (nonatomic, assign) UIAccelerationValue accelerationX;
@property (nonatomic, assign) UIAccelerationValue accelerationY;
@property (nonatomic, assign) double currentRawReading;

/// Accelerometer used for low-pass filter smoothing
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
#pragma mark - private methods
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
        //Implement shake detection with other algorithms
    }
}

- (void)normalDetectShake:(CMAcceleration)acceleration
{
    double threshold = self.accelerateThreshold;
    if (fabs(acceleration.x) > threshold || fabs(acceleration.y) > threshold || fabs(acceleration.z) > threshold) {
        // Shake detected
        CFAbsoluteTime afterTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑后的时间
        CFTimeInterval timeDifference = afterTime - self.beforeTime; // 计算时间差 单位秒 s
        CFTimeInterval intervalSenonds = self.accelerateDetectedInterval;
        if (timeDifference >= intervalSenonds) { //控制检测前后间隔
            //NSLog(@"Shake detected, time since last detection: 1f seconds", timeDifference);
            self.beforeTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑前的时间
            if (self.didAcceleratorDectecdBlock) {
                self.didAcceleratorDectecdBlock();
            }
        } else {
            //NSLog(@"Shake detected, interval does not meet 1f seconds, ignoring this detection!", intervalSenonds);
        }
    }
}

//The low-pass filter smooths the acceleration data and calculates the acceleration change rate. By adjusting kFilteringFactor and the threshold to fit specific needs, the possibility of false triggers can be reduced
- (void)lpfDetectShake:(CMAcceleration)acceleration
{
    // Apply the low-pass filter
    CMAcceleration filteredAcceleration;
    filteredAcceleration.x = (acceleration.x * kFilteringFactor) + (self.previousAcceleration.x * (1.0 - kFilteringFactor));
    filteredAcceleration.y = (acceleration.y * kFilteringFactor) + (self.previousAcceleration.y * (1.0 - kFilteringFactor));
    filteredAcceleration.z = (acceleration.z * kFilteringFactor) + (self.previousAcceleration.z * (1.0 - kFilteringFactor));

    // Calculate the acceleration change rate
    double deltaX = fabs(filteredAcceleration.x - self.previousAcceleration.x);
    double deltaY = fabs(filteredAcceleration.y - self.previousAcceleration.y);
    double deltaZ = fabs(filteredAcceleration.z - self.previousAcceleration.z);

    // Update the previous acceleration
    self.previousAcceleration = filteredAcceleration;

    // Determine whether a shake occurred
    double threshold = self.accelerateThreshold;
    if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
        // Shake detected
        CFAbsoluteTime afterTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑后的时间
        CFTimeInterval timeDifference = afterTime - self.beforeTime; // 计算时间差 单位秒 s
        CFTimeInterval intervalSenonds = self.accelerateDetectedInterval;
        if (timeDifference >= intervalSenonds) { //控制检测前后间隔
            //NSLog(@"LFP algorithm detected a shake, time since last detection: 1f seconds", timeDifference);
            self.beforeTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑前的时间
            if (self.didAcceleratorDectecdBlock) {
                self.didAcceleratorDectecdBlock();
            }
            //NSLog(@"LFP algorithm detected a shake, {2f,2f,2f}", deltaX, deltaY, deltaZ);
        } else {
            //NSLog(@"LFP algorithm detected a shake, interval does not meet 1f seconds, ignoring this detection!", intervalSenonds);
        }
    }
}

#pragma mark -
#pragma mark - public methods
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
#pragma mark - life cycle
- (void)dealloc
{
    if (self.cmMotionOperationQueue) {
        [self.cmMotionOperationQueue cancelAllOperations];
        self.cmMotionOperationQueue = nil;
    }
}

@end

```

That's the implementation code for the CMMotionManager approach.

## UIAccelerometer

This class is a solution from ancient times, the way of iOS 2.0~iOS 5.0. We're now in the iOS 17 era, and I think it should be collecting its pension, but it persists, still standing at its post and still doing its job.

``` objc
UIKIT_EXTERN API_DEPRECATED("UIAcceleration has been replaced by the CoreMotion framework", ios(2.0, 5.0)) API_UNAVAILABLE(visionos) API_UNAVAILABLE(tvos) NS_SWIFT_UI_ACTOR
```

It's quite simple and crude to use.

``` objc
if (enableShake) {
	[[UIAccelerometer sharedAccelerometer] setDelegate:nil];
	[[UIAccelerometer sharedAccelerometer] setDelegate:self];
	[[UIAccelerometer sharedAccelerometer] setUpdateInterval:0.1];
} else {
	[[UIAccelerometer sharedAccelerometer] setDelegate:nil];
}
```

Then implement the delegate.

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

The `UIAcceleration` class was a class before iOS 6

``` objc
@interface UIAcceleration : NSObject

@property(nonatomic,readonly) NSTimeInterval timestamp;
@property(nonatomic,readonly) UIAccelerationValue x;
@property(nonatomic,readonly) UIAccelerationValue y;
@property(nonatomic,readonly) UIAccelerationValue z;

@end
```

In later sensor consolidation, it became a struct.

If I had to say what advantage UIAcceleration has, it's that it can obtain user sensor data without adding a privacy description to the plist. Not sure if there are any adaptation issues when not adding the privacy description.

### Update on March 26, 2024

Added a low-pass filter smoothing algorithm to prevent false triggers from shaking.

``` objc

//The low-pass filter smooths the acceleration data and calculates the acceleration change rate. By adjusting kFilteringFactor and the threshold to fit specific needs, the possibility of false triggers can be reduced
- (void)lpfDetectShake:(CMAcceleration)acceleration
{
    // Apply the low-pass filter
    CMAcceleration filteredAcceleration;
    filteredAcceleration.x = (acceleration.x * kFilteringFactor) + (self.previousAcceleration.x * (1.0 - kFilteringFactor));
    filteredAcceleration.y = (acceleration.y * kFilteringFactor) + (self.previousAcceleration.y * (1.0 - kFilteringFactor));
    filteredAcceleration.z = (acceleration.z * kFilteringFactor) + (self.previousAcceleration.z * (1.0 - kFilteringFactor));

    // Calculate the acceleration change rate
    double deltaX = fabs(filteredAcceleration.x - self.previousAcceleration.x);
    double deltaY = fabs(filteredAcceleration.y - self.previousAcceleration.y);
    double deltaZ = fabs(filteredAcceleration.z - self.previousAcceleration.z);

    // Update the previous acceleration
    self.previousAcceleration = filteredAcceleration;

    // Determine whether a shake occurred
    double threshold = self.accelerateThreshold;
    if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
        // Shake detected
        CFAbsoluteTime afterTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑后的时间
        CFTimeInterval timeDifference = afterTime - self.beforeTime; // 计算时间差 单位秒 s
        CFTimeInterval intervalSenonds = self.accelerateDetectedInterval;
        if (timeDifference >= intervalSenonds) { //控制检测前后间隔
            //NSLog(@"LFP algorithm detected a shake, time since last detection: 1f seconds", timeDifference);
            self.beforeTime = CFAbsoluteTimeGetCurrent(); // 记录执行摇晃检测逻辑前的时间
            if (self.didAcceleratorDectecdBlock) {
                self.didAcceleratorDectecdBlock();
            }
            //NSLog(@"LFP algorithm detected a shake, {2f,2f,2f}", deltaX, deltaY, deltaZ);
        } else {
            //NSLog(@"LFP algorithm detected a shake, interval does not meet 1f seconds, ignoring this detection!", intervalSenonds);
        }
    }
}

```


# Summary

Those are the code examples for several different ways to detect shake-like or shake-to-activate functions. Take what you need: for something more complex, choose CMMotionManager; if you just want a simple shake, just use the system event; use UIAcceleration in non-standard cases.

Of course, you can also wrap all three approaches and use an internal switch to control which one is used.

That's the implementation and optimization of the motion sensor's accelerometer in applications. A humble post, forgive me.

[Reference: CMDeviceMotion](https://nshipster.com/cmdevicemotion/)  
[Swift – Implementing the Shake Feature](https://badgameshow.com/steven/swift/https-badgameshow-com-steven-195/)  

