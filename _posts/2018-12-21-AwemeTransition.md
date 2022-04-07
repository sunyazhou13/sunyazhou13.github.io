---
title: iOS抖音的转场动画
categories: [ios开发]
tags: [ios, 抖音动画系列]
date: 2018-12-21 10:12:07
---


# 前言

这几天比较忙,今天给大家带来的是抖音的转场动画实现 废话不多说上图

![](/assets/images/20181221AwemeTransition/transition.gif)

这里需要用到前一篇文章的上下滑[demo](https://github.com/sunyazhou13/AwemeDemo)

学习这篇文章之前推荐看下喵神的[iOS7中的ViewController转场切换](https://onevcat.com/2013/10/vc-transition-in-ios7/) 


如果对转场不是很了解的话可能学习会有一些难度和疑问.



## 转场调用代码

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
    
    //弹窗转场
    self.presentScaleAnimation.cellConvertFrame = cellConvertedFrame; //4
    
    //消失转场
    self.dismissScaleAnimation.selectCell = cell; // 5
    self.dismissScaleAnimation.originCellFrame  = cellFrame; //6
    self.dismissScaleAnimation.finalCellFrame = cellConvertedFrame; //7
    
    awemeVC.modalPresentationStyle = UIModalPresentationOverCurrentContext; //8
    self.modalPresentationStyle = UIModalPresentationCurrentContext; //9
    
    [self.leftDragInteractiveTransition wireToViewController:awemeVC];
    [self presentViewController:awemeVC animated:YES completion:nil];
}

```

 `0` 处代码使我们需要把当前的类做为转场的代理  
 `1` 这里我们要拿出cell这个view  
 `2` 拿出当前Cell的frame坐标  
 `3` cell的坐标转成屏幕坐标  
 `4` 设置弹出时候需要cell在屏幕的位置坐标  
 `5` 设置消失转场需要的选中cell视图  
 `6` 设置消失转场原始cell坐标位置  
 `7` 设置消失转场最终得cell屏幕坐标位置 用于消失完成回到原来位置的动画  
 `8` 设置弹出得vc弹出样式 这个用于显示弹出VC得时候 默认底部使blua的高斯模糊  
 `9` 设置当前VC的模态弹出样式为当前的弹出上下文  
 
 > 5~7 步设置的消失转场动画 下面会讲解
 
 这里我们用的是前面讲上下滑的VC对象 大家不必担心 当它是一个普通的UIViewController即可
 
 ## 实现转场所需要的代理
 
 首先在需要实现`UIViewControllerTransitioningDelegate`这个代理
 
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
 
 这里面我们看到我们分别返回了
 
 * 弹出动画实例`self.presentScaleAnimation`
 * dismiss动画实例`self.dismissScaleAnimation`
 * 以及`self.leftDragInteractiveTransition`实例用于负责转场切换的具体实现

 所以我们需要在 当前的VC中声明3个成员变量 并初始化
 
 ``` objc
@property (nonatomic, strong) PresentScaleAnimation *presentScaleAnimation;
@property (nonatomic, strong) DismissScaleAnimation *dismissScaleAnimation;
@property (nonatomic, strong) DragLeftInteractiveTransition *leftDragInteractiveTransition;
 ```
 
 并在`viewDidLoad:`方法中初始化一下
 
 ``` objc
 //转场的两个动画
self.presentScaleAnimation = [[PresentScaleAnimation alloc] init];
self.dismissScaleAnimation = [[DismissScaleAnimation alloc] init];
self.leftDragInteractiveTransition = [DragLeftInteractiveTransition new];
 ```
 
 这里我说一下这三个成员都负责啥事
 
 首先`DragLeftInteractiveTransition`类负责转场的 手势 过程,就是pan手势在这个类里面实现,并继承自`UIPercentDrivenInteractiveTransition`类,这是iOS7以后系统提供的转场基类必须在`interactionControllerForDismissal:`代理协议中返回这个类或者子类的实例对象,所以我们生成一个成员变量`self.leftDragInteractiveTransition`
 
 其次是弹出present和消失dismiss的动画类,这俩类其实是负责简单的手势完成之后的动画.
 
 这两个类都是继承自NSObject并实现`UIViewControllerAnimatedTransitioning`协议的类,这个协议里面有 需要你复写某些方法返回具体的动画执行时间,和中间过程中我们需要的相关的容器视图以及控制器的视图实例,当我们自己执行完成之后调用相关的block回答告知转场是否完成就行了.
 
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

很简单.

消失的动画 同上边差不多

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
我们重点需要说一下 转场过渡的类`DragLeftInteractiveTransition`继承自`UIPercentDrivenInteractiveTransition`负责转场过程,

头文件的声明

``` objc
@interface DragLeftInteractiveTransition : UIPercentDrivenInteractiveTransition

/** 是否正在拖动返回 标识是否正在使用转场的交互中 */
@property (nonatomic, assign) BOOL isInteracting;


/**
 设置需要返回的VC
 
 @param viewController 控制器实例
 */
-(void)wireToViewController:(UIViewController *)viewController;


@end

```

实现

``` objc

@interface DragLeftInteractiveTransition ()

@property (nonatomic, strong) UIViewController *presentingVC;
@property (nonatomic, assign) CGPoint viewControllerCenter;
@property (nonatomic, strong) CALayer *transitionMaskLayer;

@end

@implementation DragLeftInteractiveTransition

#pragma mark -
#pragma mark - override methods 复写方法
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
#pragma mark - private methods 私有方法
- (void)prepareGestureRecognizerInView:(UIView*)view {
    UIPanGestureRecognizer *gesture = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handleGesture:)];
    [view addGestureRecognizer:gesture];
}

#pragma mark -
#pragma mark - event response 所有触发的事件响应 按钮、通知、分段控件等
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
            //修复当从右侧向左滑动的时候的bug 避免开始的时候从又向左滑动 当未开始的时候
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
            //移除 遮罩
            [self.transitionMaskLayer removeFromSuperlayer];
            self.transitionMaskLayer = nil;
        }
            break;
        default:
            break;
    }
}

#pragma mark -
#pragma mark - public methods 公有方法
-(void)wireToViewController:(UIViewController *)viewController {
    self.presentingVC = viewController;
    self.viewControllerCenter = viewController.view.center;
    [self prepareGestureRecognizerInView:viewController.view];
}

@end

```


我们对外提供了一个`wireToViewController:`方法用于外部需要创建转场使用.

前面的代码我们发现有一处

``` objc
[self.leftDragInteractiveTransition wireToViewController:awemeVC];
[self presentViewController:awemeVC animated:YES completion:nil];
```

这里就是需要把我们要弹出的上下滑VC实例传进来,进来之后为VC的`self.view`加个`pan`手势,

复写方法中我们可以看到相关开始结束 完成过程的百分比相关方法复写

``` objc
#pragma mark -
#pragma mark - override methods 复写方法
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

看是手势 出发前 先检查一下是否如下条件

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

拿出手势作用的视图,然后坐标转换,判断当前是否已经开始了动画,如果没开始 或者x坐标 < y坐标是判断当前是否是超过边界范围等等异常case处理.

开始的时候需要注意下

``` objc
//修复当从右侧向左滑动的时候的bug 避免开始的时候从又向左滑动 当未开始的时候
CGPoint vel = [gestureRecognizer velocityInView:gestureRecognizer.view];
if (!self.isInteracting && vel.x < 0) {
    self.isInteracting = NO;
    return;
}
```

然后 开始的时候加个蒙版做为view.mask 这样是为了解决tableView 超出contentSize的范围要隐藏

剩下的就是中间过程 

__关键的核心代码__

``` objc
[self updateInteractiveTransition:progress];
```

> 更新转场的进度 这是这个类的自带方法,调用就行了

最后 手势结束

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
//移除 遮罩
[self.transitionMaskLayer removeFromSuperlayer];
self.transitionMaskLayer = nil;
```

> 这里设置0.2的容差 如果你觉得这个应该开放接口设置可自行封装.

当用户取消的话记得调用`cancelInteractiveTransition`方法取消

完成的话调用`finishInteractiveTransition`完成转场


# 总结

整个过程还是比较简单的 如果看过喵神的文章将会更加清晰的了解转场的三个过程
就是 弹出和消失动画 以及一个中间转场过程需要我们熟悉.

优化点: 在原开源工程中的demo转场右滑是有bug的,我做了一下如下判断

``` objc
//修复当从右侧向左滑动的时候的bug 避免开始的时候从又向左滑动 当未开始的时候
CGPoint vel = [gestureRecognizer velocityInView:gestureRecognizer.view];
if (!self.isInteracting && vel.x < 0) {
    self.isInteracting = NO;
    return;
}

```

`vel`这个变量 其实是判断当我们从右侧划入返回.修复了原来开源的一个bug

还有 原来开源中`tableView`的`contentSize`以外 区域露在外部,我用了一个mask的蒙版遮住了显示在外的区域.


唯一有些许遗憾的地方是抖音的左滑返回时候,有背景遮盖透明的渐变.这里由于时间关系和篇幅限制我没有花足够的时间调研.后续完善,写的不好请大家多多指教


[最终得Demo在这里](https://github.com/sunyazhou13/AwemeDemoTransition)
