---
title: AVRoutePickerView
categories: [avkit]
tags: [ios, macos]
date: 2019-04-17 15:19:52
---

![](/assets/images/20190417AVRoutePickerView/cover_album.jpg)


# 前言


最近无意中看了一下AVKit发现内部增加了很多新的内容.其中有个`AVRoutePickerView`的UI控件,打算研究一下. 其实这个很常见就在系统的控制中心 下拉屏幕就能看见 当你连接耳机或者无线蓝牙设备的时候.

![](/assets/images/20190417AVRoutePickerView/RouteChange2.gif)

这里网易云音乐中有实践的例子  

![](/assets/images/20190417AVRoutePickerView/RouteChange1.gif)

这个控件主要用于AirPlay投屏 和音频的线路切换

那么我今天就跟大家一起学习一下这个新的控件

## 代码实现

导入`#import <AVKit/AVKit.h>`

剩下的就是创建实例调用方法

这里用ViewController做示例

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

//AirPlay界面弹出时回调
- (void)routePickerViewWillBeginPresentingRoutes:(AVRoutePickerView *)routePickerView API_AVAILABLE(ios(11.0)){
    NSLog(@"Airplay视图弹出");
}
//AirPlay界面结束时回调
- (void)routePickerViewDidEndPresentingRoutes:(AVRoutePickerView *)routePickerView API_AVAILABLE(ios(11.0)){
    NSLog(@"Airplay视图弹回");
}

@end
```

添加完之后运行如下

![](/assets/images/20190417AVRoutePickerView/RouteChange3.gif)

`AVRoutePickerView `这个View提供的API 就两个颜色值剩下的啥都没有,啥都改不了,那怎么才能实现网易云音乐那样自定义图标呢？


##### 添加自定义视图

``` objc
UIImageView *imageView = [[UIImageView alloc] initWithFrame:routerPickerView.bounds];
        imageView.image = [UIImage imageNamed:@"logo2"];
        [routerPickerView addSubview:imageView];

```

![](/assets/images/20190417AVRoutePickerView/RouteChange4.gif)

自己加个图标即可.


# 总结

此控件只适用于iOS11以后,使用的时候 记得加可用性检测API

``` objc
if (@available(iOS 11.0, *)) {
	//这里写创建视图代码
}
```

这个控件在多数场景上提升了用户体验,比如音视频类app经常频繁接线控或者蓝牙耳机,那么对这个有要求的可以试试.感谢支持!


[demo点击这里下载](https://github.com/sunyazhou13/AVRoutePickerViewDemo)