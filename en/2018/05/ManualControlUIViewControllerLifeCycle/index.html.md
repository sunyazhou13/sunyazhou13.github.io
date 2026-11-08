---
layout: post
title: Manually Managing the Life Cycle of UIViewController
date: 2018-05-08 12:01:27
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---



# Preface

It's been a long time since I used the less common APIs of UIViewController, and I've gradually lost my memory of them. In iOS apps, pages with multiple childViewControllers are a very common interaction design — think the early NetEase News or Toutiao. This post reviews the old APIs for manually controlling the life cycle of view controllers.

# UIViewController

When using `addChildViewController:`, we run into a question: how to manually control the life cycle of the added controller.

Here's the code:

``` objc
self.vc1 = [[VC1ViewController alloc] init]; //子控制器
self.vc2 = [[VC2ViewController alloc] init]; //子控制器
    
[self addChildViewController:self.vc1]; //添加到父控制器中
[self.view addSubview:self.vc1.view];   //把子控制器的 view 添加到父控制器的 view 上面
self.vc1.view.frame = CGRectMake(0, 0, 100, 100); //设置 frame
[self.vc1 didMoveToParentViewController:self];//子控制器被通知有了一个父控制器


    
[self addChildViewController:self.vc2];
[self.view addSubview:self.vc2.view];
self.vc2.view.frame = CGRectMake(0, 0, 100, 100);
[self.vc2 didMoveToParentViewController:self];//子控制器被通知有了一个父控制器
```

To remove one, use the following code:

``` objc
// Remove a childViewController
[self.vc1 willMoveToParentViewController:nil];//子控制器被通知即将解除父子关系
[self.vc1.view removeFromSuperview];//把子控制器的 view 从到父控制器的 view 上面移除
[self.vc1 removeFromParentViewController];//真正的解除关系,会自己调用 [self.vc1 didMoveToParentViewController:nil]

```


When we add a child to the parent controller, its

``` objc
- (void)viewWillAppear:(BOOL)animated{
    [super viewWillAppear:animated];
}

- (void)viewDidAppear:(BOOL)animated{
    [super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated{
    [super viewWillDisappear:animated];
    
}

- (void)viewDidDisappear:(BOOL)animated{
    [super viewDidDisappear:animated];
}
```
these methods are called automatically by the system.

#### Methods for manually managing the child ViewController's life cycle

You need to override the following method in the parent ViewController and return `NO`:

``` objc
- (BOOL)shouldAutomaticallyForwardAppearanceMethods{
    // Manually manage the child VC's life cycle
    return NO;
}
```

However, note that you must not call methods like `viewWillAppear` or `viewDidAppear` manually. Instead, you should call:

``` objc
- (void)beginAppearanceTransition:(BOOL)isAppearing animated:(BOOL)animated;
- (void)endAppearanceTransition;
```

> Note: _**use these two methods to indirectly trigger the child controller's life cycle, and they must be used in pairs**_

Setting `isAppearing` to `YES` triggers `viewWillAppear:`.

Setting `isAppearing` to `NO` triggers `viewWillDisappear:`.

The `endAppearanceTransition` method will call `viewDidAppear:` and `viewDidDisappear:` based on the `isAppearing` value we passed in.

To test this, I wrote a piece of code:

``` objc
- (IBAction)click:(UIButton *)sender {
    sender.selected = !sender.selected;
    if (sender.selected) {
        [self.vc1 beginAppearanceTransition:NO animated:YES];  //调用vc1的 viewWillDisappear:
        [self.vc2 beginAppearanceTransition:YES animated:YES];  //调用vc2的 viewWillAppear:
        [self.vc1 endAppearanceTransition]; //调用vc1的viewDidDisappear: 
        [self.vc2 endAppearanceTransition]; //调用vc2的viewDidAppear:
    } else {
        [self.vc1 beginAppearanceTransition:YES animated:YES];
        [self.vc2 beginAppearanceTransition:NO animated:YES];
        [self.vc1 endAppearanceTransition];
        [self.vc2 endAppearanceTransition];
    }
}

```

[Demo](https://github.com/sunyazhou13/VCLifeCycle)


#### Common transition animation

`transitionFromViewController:toViewController:duration:options:animations:completion:` is the "officially recommended" way for a custom container controller to switch between two child controllers. It automatically forwards the appearance life cycle (`viewWill`/`DidAppear`/`Disappear`) for you, so you don't need to manually call `beginAppearanceTransition`/`endAppearanceTransition`.

A minimal working pattern (fromVC is the currently displayed child controller, toVC is the child controller you're switching to):

``` objc
- (void)switchFrom:(UIViewController *)fromVC to:(UIViewController *)toVC 
{
    if (fromVC == toVC) return;

    // 1) Prepare the parent-child relationship
    [fromVC willMoveToParentViewController:nil]; // 即将移除旧的
    [self addChildViewController:toVC];          // 先把新的加为子控制器

    // 2) Prepare the view's size/position (important)
    toVC.view.frame = self.containerView.bounds; // 或者设置自动布局约束
    // If using Auto Layout, usually set the frame first, then add constraints afterwards.

    // 3) Switch (the system handles the appearance life cycle automatically)
    [self transitionFromViewController:fromVC
                      toViewController:toVC
                              duration:0.25
                               options:UIViewAnimationOptionTransitionCrossDissolve
                            animations:^{
                                // Optional: extra animations, such as layout changes, alpha, transform, etc.
                                // [self.containerView layoutIfNeeded];
                            }
                            completion:^(BOOL finished) {
                                // 4) Finalize the parent-child relationship changes
                                [toVC didMoveToParentViewController:self];
                                [fromVC removeFromParentViewController];

                                self.currentVC = toVC;
                            }];
}
```


##### Key Points

**Use Cases**

This is the utility method for switching between two child controllers in a "custom container controller" — for example, custom Tab switching, paged content switching, that kind of thing.

**Life Cycle**

This method automatically calls the appropriate appearance callbacks for fromVC's disappearance and toVC's appearance (`viewWill/DidDisappear/Appear`). Don't manually write `beginAppearanceTransition`/`endAppearanceTransition`, or they'll be triggered twice.

**Order of Parent-Child Relationship Calls**

Before switching: call `willMoveToParentViewController:nil` on the old controller, and `addChildViewController:` on the new controller first.

In the `completion` block: call `didMoveToParentViewController:self` on the new controller, and `removeFromParentViewController` on the old controller.

**View Hierarchy and Size**

Set the final size (frame) of `toVC.view`, or prepare its constraints, before calling. `transitionFrom` inserts `toVC.view` into the superview of `fromVC.view` and removes `fromVC.view` when finished (you don't need to manually call `addSubview`/`removeFromSuperview`).

**If you're using Auto Layout, a common approach:**

Simple solution: switch using frames first, then add/update `toVC.view`'s constraints after completion.
Or use the `UIViewAnimationOptionShowHideTransitionViews` option: add both child views to the same container with constraints in advance; during the switch the system only toggles show/hide. But this requires the views to be installed before the transition.

Common values for options

* UIViewAnimationOptionTransitionCrossDissolve: cross-fade
* UIViewAnimationOptionTransitionFlipFromLeft/Right: flip
* UIViewAnimationOptionCurveEaseInOut etc.: animation curve
* UIViewAnimationOptionShowHideTransitionViews: only toggles the hidden property (both views must be siblings and already in the parent view)

The `animations` block can contain extra layout or visual changes (alpha, transform, `layoutIfNeeded` after constraint changes, etc.). If it's a simple transition, you can also leave it empty.

Pitfalls
`fromVC` must already be a child controller of `self`; `toVC` must be added with `addChild` before calling `transitionFrom`, otherwise it will crash or have no effect.

Don't manually trigger the life cycle

The end.
