---
layout: post
title: UIViewController代码规范
date: 2017-01-13 11:18:07
categories: [iOS]
tags: [iOS, Swift, macOS]
typora-root-url: ..
---

# pragma 标准写法

## Objective-C

```objc
#pragma mark -
#pragma mark - private methods 私有方法

#pragma mark -
#pragma mark - public methods 公有方法

#pragma mark -
#pragma mark - override methods 复写方法

#pragma mark -
#pragma mark - getters and setters 设置器和访问器

#pragma mark -
#pragma mark - UITableViewDelegate

#pragma mark -
#pragma mark - CustomDelegate 自定义的代理

#pragma mark -
#pragma mark - event response 所有触发的事件响应 按钮、通知、分段控件等

#pragma mark -
#pragma mark - life cycle 视图的生命周期

#pragma mark -
#pragma mark - StatisticsLog 各种页面统计Log
```


## Swift

```swift


// MARK: -
// MARK: - override methods 复写方法

// MARK: -
// MARK: - getters and setters 设置器和访问器

// MARK: -
// MARK: - UITableViewDelegate 代理

// MARK: -
// MARK: - CustomDelegate 自定义的代理

// MARK: -
// MARK: - event response 所有触发的事件响应 按钮、通知、分段控件等

// MARK: -
// MARK: - private methods 私有方法

// MARK: -
// MARK: - public methods 公有方法

// MARK: -
// MARK: - life cycle 视图的生命周期

// MARK: -
// MARK: - StatisticsLog 各种页面统计Log


```

---

# UIViewController生命周期方法

在 Objective-C 中，`UIViewController` 的生命周期方法涵盖了视图控制器从创建到销毁的整个过程。以下是这些方法的全面列表，包括它们被调用的时机和一些细节：

1. **初始化和加载视图**
   - `initWithNibName:bundle:`：使用 nib 文件初始化视图控制器。
   - `initWithCoder:`：使用 storyboard 初始化视图控制器。
   - `loadView`：加载视图控制器的视图，如果未设置 `view` 属性，此方法会被自动调用。
   - `viewDidLoad`：视图加载完成后调用，常用于初始化代码。

2. **视图将要出现**
   - `viewWillAppear:`：视图将要显示在屏幕上之前调用，可以在此方法中进行界面更新。
   - `viewWillLayoutSubviews`：在视图的布局将要发生之前调用，可以在此方法中进行子视图的布局。
   - `viewDidLayoutSubviews`：在视图的布局已经完成后调用。

3. **视图已经出现**
   - `viewDidAppear:`：视图已经显示在屏幕上后调用，可以在此方法中进行界面更新。
   - `viewDidDisappear:`：视图从屏幕上消失后调用。

4. **内存警告**
   - `didReceiveMemoryWarning`：当系统内存不足时调用，视图控制器可以释放一些资源。

5. **旋转和大小变化**
   - `willRotateToInterfaceOrientation:duration:`：设备将要旋转到指定方向之前调用（iOS 6 及之前版本）。
   - `willAnimateRotationToInterfaceOrientation:duration:`：设备将要旋转到指定方向时调用，可以进行动画（iOS 6 及之前版本）。
   - `didRotateFromInterfaceOrientation:`：设备从指定方向旋转完成后调用（iOS 6 及之前版本）。
   - `viewWillTransitionToSize:withTransitionCoordinator:`：设备将要旋转或视图控制器的尺寸将要变化时调用（iOS 8 及以后版本）。
   - `viewDidTransitionFromSize:withTransitioningCoordinator:`：设备旋转完成或视图控制器尺寸变化完成后调用（iOS 8 及以后版本）。

6. **交互**
   - `shouldAutorotate`：询问视图控制器是否支持自动旋转（iOS 6 及之前版本）。
   - `supportedInterfaceOrientations`：返回视图控制器支持的界面方向。
   - `preferredInterfaceOrientationForPresentation`：返回视图控制器的首选显示方向。

7. **交互消失**
   - `viewWillDisappear:`：视图将要消失时调用。
   - `viewWillUnload`：视图将要被销毁时调用，iOS 6 以后版本中不再推荐使用。

8. **终止**
   - `dealloc`：视图控制器被销毁时调用。

请注意，从 iOS 6 开始，苹果推荐使用自动旋转支持方法（`shouldAutorotate`、`supportedInterfaceOrientations` 和 `preferredInterfaceOrientationForPresentation`）来处理设备方向变化，而不是使用 `willRotateToInterfaceOrientation:duration:` 等方法。此外，`viewWillUnload` 方法在 iOS 6 及以后的版本中不再被调用，苹果推荐使用 `viewDidDisappear:` 来替代。

这些方法为视图控制器的生命周期提供了丰富的控制点，允许开发者在适当的时机进行资源管理、界面更新和状态保存。

### UIViewController的示例代码如下:

以下是一些示例代码，展示了在 Objective-C 中如何实现 `UIViewController` 生命周期方法：

```objc
// ViewController.h
#import <UIKit/UIKit.h>

@interface ViewController : UIViewController

@end

// ViewController.m
#import "ViewController.h"

@implementation ViewController

// 初始化和加载视图
- (instancetype)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
    self = [super initWithCoder:aDecoder];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)loadView {
    [super loadView];
    // Create your custom view here if not using a nib or storyboard
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Perform additional setup after loading the view, typically from a nib.
}

// 视图将要出现
- (void)viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
    // Prepare your view for display
}

- (void)viewWillLayoutSubviews {
    [super viewWillLayoutSubviews];
    // Layout your subviews here
}

- (void)viewDidLayoutSubviews {
    [super viewDidLayoutSubviews];
    // Perform any additional layout here
}

// 视图已经出现
- (void)viewDidAppear:(BOOL)animated {
    [super viewDidAppear:animated];
    // Update your UI here
}

- (void)viewWillDisappear:(BOOL)animated {
    [super viewWillDisappear:animated];
    // Prepare your view for disappearance
}

- (void)viewDidDisappear:(BOOL)animated {
    [super viewDidDisappear:animated];
    // Clean up after your view disappears
}

// 内存警告
- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Release any cached data, images, etc. that aren't in use
}

// 旋转和大小变化
- (BOOL)shouldAutorotate {
    return YES;
}

- (NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation {
    return UIInterfaceOrientationPortrait;
}

- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator {
    [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
    // Handle the transition to a different size
}

- (void)viewDidTransitionFromSize:(CGSize)fromSize withTransitioningCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator {
    [super viewDidTransitionFromSize:fromSize withTransitioningCoordinator:coordinator];
    // Handle the transition completion
}

@end
```

这段代码展示了 `UIViewController` 生命周期方法的基本实现。在实际应用中，你需要根据具体需求在这些方法中添加相应的逻辑。例如，在 `viewDidLoad` 中初始化视图，在 `viewWillAppear:` 中更新 UI，在 `viewWillDisappear:` 中保存状态等。
