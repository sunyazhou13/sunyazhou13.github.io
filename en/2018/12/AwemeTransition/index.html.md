---
layout: post
title: iOS Douyin Transition Animation
date: 2018-12-21 10:12:07
categories: [iOS]
tags: [iOS, 动画, 抖音动画系列, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

These past few days have been quite busy. Today I bring you the implementation of Douyin's transition animation. Enough talk — here's the picture.

![transition](/assets/images/20181221AwemeTransition/transition.avif)

This requires the swipe up/down [demo](https://github.com/sunyazhou13/AwemeDemo) from my previous post.

Before studying this post, I recommend reading OneV's Den's [View Controller Transitions in iOS 7](https://onevcat.com/2013/10/vc-transition-in-ios7/)


If you're not very familiar with view controller transitions, learning this may be a bit challenging and confusing.



## Transition Call Code

``` objc

- (void)collectionView:(UICollectionView *)collectionView didSelectItemAtIndexPath:(NSIndexPath *)indexPath {
    AwemeListViewController *awemeVC = [[AwemeListViewController alloc] init];
    awemeVC.transitioningDelegate = self; //0
    
    // 1
    UICollectionViewCell *cell = [collectionView cellForItemAtIndexPath:indexPath];
    // 2
    CGRect cellFrame = cell.frame;
    // 3
    CGRect cellConvertedFrame = [collectionView convertRect:cellFrame toView:collectionView.superview];
    
    // Present transition
    self.presentScaleAnimation.cellConvertFrame = cellConvertedFrame; //4
    
    // Dismiss transition
    self.dismissScaleAnimation.selectCell = cell; // 5
    self.dismissScaleAnimation.originCellFrame  = cellFrame; //6
    self.dismissScaleAnimation.finalCellFrame = cellConvertedFrame; //7
    
    awemeVC.modalPresentationStyle = UIModalPresentationOverCurrentContext; //8
    self.modalPresentationStyle = UIModalPresentationCurrentContext; //9
    
    [self.leftDragInteractiveTransition wireToViewController:awemeVC];
    [self presentViewController:awemeVC animated:YES completion:nil];
}

```

 At `0`, we need to make the current class the transition delegate.  
 `1` Here we grab the cell view.  
 `2` Grab the current cell's frame coordinates.  
 `3` Convert the cell's coordinates to screen coordinates.  
 `4` Set the cell's position on screen needed when presenting.  
 `5` Set the selected cell view needed for the dismiss transition.  
 `6` Set the original cell frame for the dismiss transition.  
 `7` Set the final cell screen coordinates for the dismiss transition, used for the animation that returns to the original position when dismissal completes.  
 `8` Set the modal presentation style of the VC being presented. This is used so that when showing the presented VC, the default background is a blue Gaussian blur at the bottom.  
 `9` Set the current VC's modal presentation style to the current presentation context.  
 
 > I'll cover the dismiss transition animation set up in steps 5–7 below.
 
 Here we're reusing the VC from the previous swipe up/down post. Don't worry about it — just treat it as an ordinary `UIViewController`.
 
 ## Implementing the Delegate Required for Transitions
 
 First, we need to implement the `UIViewControllerTransitioningDelegate` protocol.
 
 ``` objc
 #pragma mark -
#pragma mark - UIViewControllerAnimatedTransitioning Delegate
- (nullable id <UIViewControllerAnimatedTransitioning>)animationControllerForPresentedController:(UIViewController *)presented presentingController:(UIViewController *)presenting sourceController:(UIViewController *)source {
    
    return self.presentScaleAnimation; //present VC
}

- (nullable id <UIViewControllerAnimatedTransitioning>)animationControllerForDismissedController:(UIViewController *)dismissed {
    return self.dismissScaleAnimation; //dismiss VC
}

- (nullable id <UIViewControllerInteractiveTransitioning>)interactionControllerForDismissal:(id <UIViewControllerAnimatedTransitioning>)animator {
    return self.leftDragInteractiveTransition.isInteracting? self.leftDragInteractiveTransition: nil;
}

 ```
 
 Here we can see that we return respectively
 
 * The present animation instance `self.presentScaleAnimation`
 * The dismiss animation instance `self.dismissScaleAnimation`
 * And the `self.leftDragInteractiveTransition` instance, which is responsible for the concrete implementation of the transition
 
 So we need to declare 3 member variables in the current VC and initialize them.
 
 ``` objc
@property (nonatomic, strong) PresentScaleAnimation *presentScaleAnimation;
@property (nonatomic, strong) DismissScaleAnimation *dismissScaleAnimation;
@property (nonatomic, strong) DragLeftInteractiveTransition *leftDragInteractiveTransition;
 ```
 
 And initialize them in `viewDidLoad:`.
 
 ``` objc
 // The two transition animations
self.presentScaleAnimation = [[PresentScaleAnimation alloc] init];
self.dismissScaleAnimation = [[DismissScaleAnimation alloc] init];
self.leftDragInteractiveTransition = [DragLeftInteractiveTransition new];
 ```
 
 Let me explain what each of these three members is responsible for.
 
 First, the `DragLeftInteractiveTransition` class is responsible for the gesture process of the transition. That is, the pan gesture is implemented in this class, which inherits from `UIPercentDrivenInteractiveTransition`. Since iOS 7, the system provides this transition base class, and you must return an instance of this class or a subclass in the `interactionControllerForDismissal:` delegate method. That's why we create a member variable `self.leftDragInteractiveTransition`.
 
 Next are the animation classes for presenting and dismissing. These two classes are actually responsible for the simple animation that runs after the gesture completes.
 
 Both classes inherit from NSObject and implement the `UIViewControllerAnimatedTransitioning` protocol. This protocol requires you to override certain methods to return the concrete animation duration, and the relevant container view and controller's view instances we need during the process. Once we finish executing on our own, we just call the relevant block to tell whether the transition is complete.
 
``` objc
 @implementation PresentScaleAnimation

- (NSTimeInterval)transitionDuration:(id <UIViewControllerContextTransitioning>)transitionContext{
    return 0.3f;
}

- (void)animateTransition:(id <UIViewControllerContextTransitioning>)transitionContext{
    UIViewController *toVC = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];    
    if (CGRectEqualToRect(self.cellConvertFrame, CGRectZero)) {
        [transitionContext completeTransition:YES];
        return;
    }
    CGRect initialFrame = self.cellConvertFrame;

    UIView *containerView = [transitionContext containerView];
    [containerView addSubview:toVC.view];

    CGRect finalFrame = [transitionContext finalFrameForViewController:toVC];
    NSTimeInterval duration = [self transitionDuration:transitionContext];

    toVC.view.center = CGPointMake(initialFrame.origin.x + initialFrame.size.width/2, initialFrame.origin.y + initialFrame.size.height/2);
    toVC.view.transform = CGAffineTransformMakeScale(initialFrame.size.width/finalFrame.size.width, initialFrame.size.height/finalFrame.size.height);

    [UIView animateWithDuration:duration
                          delay:0
         usingSpringWithDamping:0.8
          initialSpringVelocity:1
                        options:UIViewAnimationOptionLayoutSubviews
                     animations:^{
                         toVC.view.center = CGPointMake(finalFrame.origin.x + finalFrame.size.width/2, finalFrame.origin.y + finalFrame.size.height/2);
                         toVC.view.transform = CGAffineTransformMakeScale(1, 1);
                     } completion:^(BOOL finished) {
                         [transitionContext completeTransition:YES];
                     }];
}
@end
```

Pretty simple.

The dismiss animation is similar to the one above.

``` objc
@interface DismissScaleAnimation ()

@end

@implementation DismissScaleAnimation

- (instancetype)init {
    self = [super init];
    if (self) {
        _centerFrame = CGRectMake((ScreenWidth - 5)/2, (ScreenHeight - 5)/2, 5, 5);
    }
    return self;
}

- (NSTimeInterval)transitionDuration:(id <UIViewControllerContextTransitioning>)transitionContext{
    return 0.25f;
}

- (void)animateTransition:(id <UIViewControllerContextTransitioning>)transitionContext{
    UIViewController *fromVC = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
//    UINavigationController *toNavigation = (UINavigationController *)[transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
//    UIViewController *toVC = [toNavigation viewControllers].firstObject;
    
    
    UIView *snapshotView;
    CGFloat scaleRatio;
    CGRect finalFrame = self.finalCellFrame;
    if(self.selectCell && !CGRectEqualToRect(finalFrame, CGRectZero)) {
        snapshotView = [self.selectCell snapshotViewAfterScreenUpdates:NO];
        scaleRatio = fromVC.view.frame.size.width/self.selectCell.frame.size.width;
        snapshotView.layer.zPosition = 20;
    }else {
        snapshotView = [fromVC.view snapshotViewAfterScreenUpdates:NO];
        scaleRatio = fromVC.view.frame.size.width/ScreenWidth;
        finalFrame = _centerFrame;
    }
    
    UIView *containerView = [transitionContext containerView];
    [containerView addSubview:snapshotView];
    
    NSTimeInterval duration = [self transitionDuration:transitionContext];
    
    fromVC.view.alpha = 0.0f;
    snapshotView.center = fromVC.view.center;
    snapshotView.transform = CGAffineTransformMakeScale(scaleRatio, scaleRatio);
    [UIView animateWithDuration:duration
                          delay:0
         usingSpringWithDamping:0.8
          initialSpringVelocity:0.2
                        options:UIViewAnimationOptionCurveEaseInOut
                     animations:^{
                         snapshotView.transform = CGAffineTransformMakeScale(1.0f, 1.0f);
                         snapshotView.frame = finalFrame;
                     } completion:^(BOOL finished) {
                         [transitionContext finishInteractiveTransition];
                         [transitionContext completeTransition:YES];
                         [snapshotView removeFromSuperview];
                     }];
}



@end
```
We mainly need to talk about the transition class `DragLeftInteractiveTransition`, which inherits from `UIPercentDrivenInteractiveTransition` and is responsible for the transition process.

The header file declaration

``` objc
@interface DragLeftInteractiveTransition : UIPercentDrivenInteractiveTransition

/** Whether the user is dragging to go back; whether the interactive transition is in progress */
@property (nonatomic, assign) BOOL isInteracting;


/**
 Sets the VC that needs to be dismissed
 
 @param viewController The controller instance
 */
-(void)wireToViewController:(UIViewController *)viewController;


@end

```

Implementation

``` objc

@interface DragLeftInteractiveTransition ()

@property (nonatomic, strong) UIViewController *presentingVC;
@property (nonatomic, assign) CGPoint viewControllerCenter;
@property (nonatomic, strong) CALayer *transitionMaskLayer;

@end

@implementation DragLeftInteractiveTransition

#pragma mark -
#pragma mark - override methods
-(CGFloat)completionSpeed{
    return 1 - self.percentComplete;
}

- (void)updateInteractiveTransition:(CGFloat)percentComplete {
    NSLog(@"%.2f",percentComplete);
    
}

- (void)cancelInteractiveTransition {
    NSLog(@"转场取消");
}

- (void)finishInteractiveTransition {
    NSLog(@"转场完成");
}


- (CALayer *)transitionMaskLayer {
    if (_transitionMaskLayer == nil) {
        _transitionMaskLayer = [CALayer layer];
    }
    return _transitionMaskLayer;
}

#pragma mark -
#pragma mark - private methods
- (void)prepareGestureRecognizerInView:(UIView*)view {
    UIPanGestureRecognizer *gesture = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handleGesture:)];
    [view addGestureRecognizer:gesture];
}

#pragma mark -
#pragma mark - event response all triggered event responses: buttons, notifications, segmented controls, etc.
- (void)handleGesture:(UIPanGestureRecognizer *)gestureRecognizer {
    UIView *vcView = gestureRecognizer.view;
    CGPoint translation = [gestureRecognizer translationInView:vcView.superview];
    if(!self.isInteracting &&
       (translation.x < 0 ||
        translation.y < 0 ||
        translation.x < translation.y)) {
        return;
    }
    switch (gestureRecognizer.state) {
        case UIGestureRecognizerStateBegan:{
            //Fix the bug when swiping from right to left; avoid starting the transition from the wrong direction before it begins
            CGPoint vel = [gestureRecognizer velocityInView:gestureRecognizer.view];
            if (!self.isInteracting && vel.x < 0) {
                self.isInteracting = NO;
                return;
            }
            self.transitionMaskLayer.frame = vcView.frame;
            self.transitionMaskLayer.opaque = NO;
            self.transitionMaskLayer.opacity = 1;
            self.transitionMaskLayer.backgroundColor = [UIColor whiteColor].CGColor; //必须有颜色不能透明
            [self.transitionMaskLayer setNeedsDisplay];
            [self.transitionMaskLayer displayIfNeeded];
            self.transitionMaskLayer.anchorPoint = CGPointMake(0.5, 0.5);
            self.transitionMaskLayer.position = CGPointMake(vcView.frame.size.width/2.0f, vcView.frame.size.height/2.0f);
            vcView.layer.mask = self.transitionMaskLayer;
            vcView.layer.masksToBounds = YES;
            
            self.isInteracting = YES;
        }
            break;
        case UIGestureRecognizerStateChanged: {
            CGFloat progress = translation.x / [UIScreen mainScreen].bounds.size.width;
            progress = fminf(fmaxf(progress, 0.0), 1.0);
            
            CGFloat ratio = 1.0f - progress*0.5f;
            [_presentingVC.view setCenter:CGPointMake(_viewControllerCenter.x + translation.x * ratio, _viewControllerCenter.y + translation.y * ratio)];
            _presentingVC.view.transform = CGAffineTransformMakeScale(ratio, ratio);
            [self updateInteractiveTransition:progress];
            break;
        }
        case UIGestureRecognizerStateCancelled:
        case UIGestureRecognizerStateEnded:{
            CGFloat progress = translation.x / [UIScreen mainScreen].bounds.size.width;
            progress = fminf(fmaxf(progress, 0.0), 1.0);
            if (progress < 0.2){
                [UIView animateWithDuration:progress
                                      delay:0
                                    options:UIViewAnimationOptionCurveEaseOut
                                 animations:^{
                                     CGFloat w = [UIScreen mainScreen].bounds.size.width;
                                     CGFloat h = [UIScreen mainScreen].bounds.size.height;
                                     [self.presentingVC.view setCenter:CGPointMake(w/2, h/2)];
                                     self.presentingVC.view.transform = CGAffineTransformMakeScale(1.0f, 1.0f);
                                 } completion:^(BOOL finished) {
                                     self.isInteracting = NO;
                                     [self cancelInteractiveTransition];
                                 }];
            }else {
                _isInteracting = NO;
                [self finishInteractiveTransition];
                [_presentingVC dismissViewControllerAnimated:YES completion:nil];
            }
            //Remove the mask
            [self.transitionMaskLayer removeFromSuperlayer];
            self.transitionMaskLayer = nil;
        }
            break;
        default:
            break;
    }
}

#pragma mark -
#pragma mark - public methods
-(void)wireToViewController:(UIViewController *)viewController {
    self.presentingVC = viewController;
    self.viewControllerCenter = viewController.view.center;
    [self prepareGestureRecognizerInView:viewController.view];
}

@end

```


We expose a `wireToViewController:` method for external code that needs to create the transition.

In the code above, we found this:

``` objc
[self.leftDragInteractiveTransition wireToViewController:awemeVC];
[self presentViewController:awemeVC animated:YES completion:nil];
```

Here we pass in the swipe up/down VC instance we want to present. Once it's in, we add a `pan` gesture to the VC's `self.view`.

In the overridden methods, we can see the percent-complete methods for the start, end, and completion process are overridden.

``` objc
#pragma mark -
#pragma mark - override methods
-(CGFloat)completionSpeed{
    return 1 - self.percentComplete;
}

- (void)updateInteractiveTransition:(CGFloat)percentComplete {
    NSLog(@"%.2f",percentComplete);
    
}

- (void)cancelInteractiveTransition {
    NSLog(@"转场取消");
}

- (void)finishInteractiveTransition {
    NSLog(@"转场完成");
}
```

Before the gesture is triggered, we first check whether the following conditions hold.

``` objc
UIView *vcView = gestureRecognizer.view;
CGPoint translation = [gestureRecognizer translationInView:vcView.superview];
if(!self.isInteracting &&
   (translation.x < 0 ||
    translation.y < 0 ||
    translation.x < translation.y)) {
    return;
}
```

Get the view the gesture applies to, then convert the coordinates, and check whether the animation has already started. If it hasn't started, or the x coordinate < y coordinate, that's handling edge cases like whether we're beyond the boundaries, etc.

Note the following when starting.

``` objc
//Fix the bug when swiping from right to left; avoid starting the transition from the wrong direction before it begins
CGPoint vel = [gestureRecognizer velocityInView:gestureRecognizer.view];
if (!self.isInteracting && vel.x < 0) {
    self.isInteracting = NO;
    return;
}
```

Then, when starting, add a mask as `view.mask`. This is to hide the area where the table view extends beyond its `contentSize`.

The rest is the middle process.

__The Key Core Code__

``` objc
[self updateInteractiveTransition:progress];
```

> Update the transition progress. This is a built-in method of this class; just call it.

Finally, when the gesture ends.

``` objc
CGFloat progress = translation.x / [UIScreen mainScreen].bounds.size.width;
progress = fminf(fmaxf(progress, 0.0), 1.0);
if (progress < 0.2){
    [UIView animateWithDuration:progress
                          delay:0
                        options:UIViewAnimationOptionCurveEaseOut
                     animations:^{
                         CGFloat w = [UIScreen mainScreen].bounds.size.width;
                         CGFloat h = [UIScreen mainScreen].bounds.size.height;
                         [self.presentingVC.view setCenter:CGPointMake(w/2, h/2)];
                         self.presentingVC.view.transform = CGAffineTransformMakeScale(1.0f, 1.0f);
                     } completion:^(BOOL finished) {
                         self.isInteracting = NO;
                         [self cancelInteractiveTransition];
                     }];
}else {
    _isInteracting = NO;
    [self finishInteractiveTransition];
    [_presentingVC dismissViewControllerAnimated:YES completion:nil];
}
//Remove the mask
[self.transitionMaskLayer removeFromSuperlayer];
self.transitionMaskLayer = nil;
```

> Here we set a tolerance of 0.2. If you think this should be exposed as an interface, you can wrap it yourself.

If the user cancels, remember to call `cancelInteractiveTransition` to cancel.

When finished, call `finishInteractiveTransition` to complete the transition.


# Summary

The whole process is fairly simple. If you've read OneV's Den's article, you'll have a clearer understanding of the three stages of a transition — namely, the present and dismiss animations, plus an intermediate transition process — all of which we need to be familiar with.

Optimization: in the original open-source project's demo, swiping right during the transition had a bug. I added the following check:

``` objc
//Fix the bug when swiping from right to left; avoid starting the transition from the wrong direction before it begins
CGPoint vel = [gestureRecognizer velocityInView:gestureRecognizer.view];
if (!self.isInteracting && vel.x < 0) {
    self.isInteracting = NO;
    return;
}

```

The `vel` variable is used to determine when we swipe in from the right side to go back, which fixes a bug in the original open-source project.

Also, in the original open-source project, the area outside the table view's `contentSize` was exposed. I used a mask to cover the area shown outside.


The only slight regret is that when swiping left to go back in Douyin, there's a transparent gradient over the background. Due to time constraints and length limits, I didn't spend enough time researching it. I'll refine it later. The writing isn't great, so please give me your feedback.


[The final demo is here](https://github.com/sunyazhou13/AwemeDemoTransition)
