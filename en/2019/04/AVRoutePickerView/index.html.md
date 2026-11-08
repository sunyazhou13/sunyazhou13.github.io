---
layout: post
title: AVRoutePickerView
date: 2019-04-17 15:19:52
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, AVKit, 音视频]
typora-root-url: ..
math: false
mermaid: false

---

![cover_album](/assets/images/20190417AVRoutePickerView/cover_album.avif)


# Preface


Recently I happened to look at AVKit and found a lot of new content inside. Among it is a UI control called `AVRoutePickerView`, which I planned to study. Actually it's very common — you can see it in the system Control Center by swiping down the screen, when you connect headphones or wireless Bluetooth devices.

![Route Change](/assets/images/20190417AVRoutePickerView/RouteChange2.avif)

Here's a real-world example in NetEase Cloud Music:

![Route Change](/assets/images/20190417AVRoutePickerView/RouteChange1.avif)

This control is mainly used for AirPlay casting and audio route switching.

So today I'll learn about this new control with everyone.

## Code Implementation

Import `#import <AVKit/AVKit.h>`

The rest is just creating an instance and calling methods.

Here I'll use a ViewController as an example:

``` objc
@interface ViewController ()  <AVRoutePickerViewDelegate>

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    if (@available(iOS 11.0, *)) {
        AVRoutePickerView *routerPickerView = [[AVRoutePickerView alloc] initWithFrame:CGRectMake(100, 100, 100, 100)];
        routerPickerView.activeTintColor = [UIColor cyanColor];
        routerPickerView.delegate = self;
        [self.view addSubview:routerPickerView];
    } else {
        // Fallback on earlier versions
    }
    
}

//Callback when the AirPlay route picker is about to appear
- (void)routePickerViewWillBeginPresentingRoutes:(AVRoutePickerView *)routePickerView API_AVAILABLE(ios(11.0)){
    NSLog(@"Airplay视图弹出");
}
//Callback when the AirPlay route picker finishes disappearing
- (void)routePickerViewDidEndPresentingRoutes:(AVRoutePickerView *)routePickerView API_AVAILABLE(ios(11.0)){
    NSLog(@"Airplay视图弹回");
}

@end
```

After adding it, run it and you'll see:

![Route Change](/assets/images/20190417AVRoutePickerView/RouteChange3.avif)

The `AVRoutePickerView` view only exposes two color values in its API — nothing else, and nothing else can be changed. So how do we implement a custom icon like NetEase Cloud Music?

##### Adding a Custom View

``` objc
UIImageView *imageView = [[UIImageView alloc] initWithFrame:routerPickerView.bounds];
        imageView.image = [UIImage imageNamed:@"logo2"];
        [routerPickerView addSubview:imageView];

```

![Route Change](/assets/images/20190417AVRoutePickerView/RouteChange4.avif)

Just add an icon yourself.

# Summary

This control only works on iOS 11 and later. When using it, remember to add availability checks:

``` objc
if (@available(iOS 11.0, *)) {
	//Write the view creation code here
}
```

This control improves the user experience in many scenarios. For example, audio/video apps frequently switch wired headsets or Bluetooth headphones, so if you have such requirements, give it a try. Thanks for your support!


[Click here to download the demo](https://github.com/sunyazhou13/AVRoutePickerViewDemo)
