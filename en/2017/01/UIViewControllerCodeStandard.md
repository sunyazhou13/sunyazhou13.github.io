---
layout: post
title: UIViewController Code Standards
date: 2017-01-13 11:18:07
categories: [iOS]
tags: [iOS, Swift, macOS]
typora-root-url: ..
math: false
mermaid: false

---

# Standard Pragma Usage

## Objective-C

```objc
#pragma mark -
#pragma mark - private methods

#pragma mark -
#pragma mark - public methods

#pragma mark -
#pragma mark - override methods

#pragma mark -
#pragma mark - getters and setters

#pragma mark -
#pragma mark - UITableViewDelegate

#pragma mark -
#pragma mark - CustomDelegate

#pragma mark -
#pragma mark - event response All triggered event responses: buttons, notifications, segmented controls, etc.

#pragma mark -
#pragma mark - life cycle View lifecycle

#pragma mark -
#pragma mark - StatisticsLog Various page statistics logs
```


## Swift

```swift


// MARK: -
// MARK: - override methods

// MARK: -
// MARK: - getters and setters

// MARK: -
// MARK: - UITableViewDelegate

// MARK: -
// MARK: - CustomDelegate

// MARK: -
// MARK: - event response All triggered event responses: buttons, notifications, segmented controls, etc.

// MARK: -
// MARK: - private methods

// MARK: -
// MARK: - public methods

// MARK: -
// MARK: - life cycle View lifecycle

// MARK: -
// MARK: - StatisticsLog Various page statistics logs


```

---

# UIViewController Lifecycle Methods

In Objective-C, the lifecycle methods of `UIViewController` cover the entire process of a view controller from creation to destruction. Here's a comprehensive list of these methods, including when they're called and some details:

1. **Initialization and View Loading**
   - `initWithNibName:bundle:`: Initializes the view controller with a nib file.
   - `initWithCoder:`: Initializes the view controller with a storyboard.
   - `loadView`: Loads the view controller's view; if the `view` property is not set, this method is called automatically.
   - `viewDidLoad`: Called after the view has been loaded; commonly used for initialization code.

2. **The View Will Appear**
   - `viewWillAppear:`: Called before the view is about to be displayed on screen; you can update the UI in this method.
   - `viewWillLayoutSubviews`: Called before the view's layout is about to happen; you can lay out subviews in this method.
   - `viewDidLayoutSubviews`: Called after the view's layout has been completed.

3. **The View Has Appeared**
   - `viewDidAppear:`: Called after the view has been displayed on screen; you can update the UI in this method.
   - `viewDidDisappear:`: Called after the view has disappeared from the screen.

4. **Memory Warning**
   - `didReceiveMemoryWarning`: Called when the system is low on memory; the view controller can release some resources here.

5. **Rotation and Size Changes**
   - `willRotateToInterfaceOrientation:duration:`: Called before the device is about to rotate to a specified orientation (iOS 6 and earlier).
   - `willAnimateRotationToInterfaceOrientation:duration:`: Called when the device is about to rotate to a specified orientation; animations can be performed here (iOS 6 and earlier).
   - `didRotateFromInterfaceOrientation:`: Called after the device has finished rotating from a specified orientation (iOS 6 and earlier).
   - `viewWillTransitionToSize:withTransitionCoordinator:`: Called when the device is about to rotate or the view controller's size is about to change (iOS 8 and later).
   - `viewDidTransitionFromSize:withTransitioningCoordinator:`: Called after the device rotation or the view controller size change has completed (iOS 8 and later).

6. **Interaction**
   - `shouldAutorotate`: Asks the view controller whether it supports automatic rotation (iOS 6 and earlier).
   - `supportedInterfaceOrientations`: Returns the interface orientations supported by the view controller.
   - `preferredInterfaceOrientationForPresentation`: Returns the view controller's preferred orientation for presentation.

7. **Interaction Disappearing**
   - `viewWillDisappear:`: Called when the view is about to disappear.
   - `viewWillUnload`: Called when the view is about to be destroyed; no longer recommended in iOS 6 and later.

8. **Termination**
   - `dealloc`: Called when the view controller is destroyed.

Please note that since iOS 6, Apple recommends using the automatic rotation support methods (`shouldAutorotate`, `supportedInterfaceOrientations`, and `preferredInterfaceOrientationForPresentation`) to handle device orientation changes instead of methods like `willRotateToInterfaceOrientation:duration:`. In addition, `viewWillUnload` is no longer called in iOS 6 and later; Apple recommends using `viewDidDisappear:` instead.

These methods provide rich control points for the view controller lifecycle, allowing developers to manage resources, update the UI, and save state at the appropriate times.

### Example Code for UIViewController

Here's some example code showing how to implement `UIViewController` lifecycle methods in Objective-C:

```objc
// ViewController.h
#import <UIKit/UIKit.h>

@interface ViewController : UIViewController

@end

// ViewController.m
#import "ViewController.h"

@implementation ViewController

// Initialization and view loading
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

// The view will appear
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

// The view has appeared
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

// Memory warning
- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Release any cached data, images, etc. that aren't in use
}

// Rotation and size changes
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

This code demonstrates the basic implementation of the `UIViewController` lifecycle methods. In a real application, you need to add the corresponding logic to these methods based on your specific requirements. For example, initialize views in `viewDidLoad`, update the UI in `viewWillAppear:`, and save state in `viewWillDisappear:`.
