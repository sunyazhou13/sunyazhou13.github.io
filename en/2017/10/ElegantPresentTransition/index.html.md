---
layout: post
title: On the Self-Cultivation of an Elegant Modal Transition
date: 2017-10-31 11:32:17
categories: [iOS]
tags: [iOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---




# Preface

During development, although UI work may seem to lack technical depth, sometimes you still need to create special transition effects. This tutorial references [UIPresentationController Tutorial: Getting Started](https://www.raywenderlich.com/139277/uipresentationcontroller-tutorial-getting-started) and provides an Objective-C version translation with some minor modifications.

> Download the Swift [demo](https://koenig-media.raywenderlich.com/uploads/2016/08/Medal_Count_Completed.zip)  
> Click here for the Objective-C [demo](https://github.com/sunyazhou13/SlideInPresentation)


![Elegant Present Transition](/assets/images/20171031ElegantPresentTransition/ElegantPresentTransition.avif)


### Background

Transitions are already very familiar in iOS today, but finding a reliable one with a dimming overlay proved difficult—few of the available options were dependable.

Either this issue or that issue would make it unsuitable.


![demo](/assets/images/20171031ElegantPresentTransition/demo1.avif)


Based on the `Raywenderlich` tutorial, I translated it into an Objective-C version with some minor modifications.



### How to Use

* Import the header file
 
``` objc
#import "SlideInPresentationManager.h"

```

* Declare the property

``` objc
@property (nonatomic, strong) SlideInPresentationManager *slideInTransitioningDelegate;
```

* Use the following code when presenting the modal controller

``` objc
- (IBAction)presentAction:(UIButton *)sender {
    PresentationDirection direction;
    if (sender.tag == 100) {
        NSLog(@"左侧弹出模态转场");
        direction = PresentationDirectionLeft;
    } else if (sender.tag == 101) {
        NSLog(@"上弹出模态转场");
        direction = PresentationDirectionTop;
    } else if (sender.tag == 102) {
        NSLog(@"右弹出模态转场");
        direction = PresentationDirectionRight;
    } else {
        NSLog(@"下弹出模态转场");
        direction = PresentationDirectionBottom;
    }
    
    self.slideInTransitioningDelegate = nil;
    // Control the dimming overlay view transition (core code)
    self.slideInTransitioningDelegate = [[SlideInPresentationManager alloc] init];
    self.slideInTransitioningDelegate.direction = direction;
    self.slideInTransitioningDelegate.disableCompactHeight = NO;
    self.slideInTransitioningDelegate.sliderRate = 1.0/3.0;
    
    // Create controller instance
    PresentController *presentVC = [[PresentController alloc] initWithNibName:@"PresentController" bundle:[NSBundle mainBundle]];
    presentVC.transitioningDelegate = self.slideInTransitioningDelegate;
    presentVC.modalPresentationStyle = UIModalPresentationCustom;
    [self presentViewController:presentVC animated:YES completion:nil];
}


``` 


That's it—enjoy!
