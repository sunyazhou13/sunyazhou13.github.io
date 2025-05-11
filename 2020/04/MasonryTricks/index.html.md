---
layout: post
title: 使用Masonry处理UIView的safeArea边界布局问题
date: 2020-04-07 11:54:39
categories: [iOS]
tags: [iOS, macOS, Objective-C, Masonry]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 背景

iOS11之后推出的safeArea 用于处理刘海屏幕的问题.如果自己处理起来可能比较 麻烦  又需要判断 版本又需要判断  API的可用性. 清明假期 在家没事写个demo  解决如何更快捷处理屏幕的边界问题,比如 视图要布局在iOS导航栏底部 和 `Home Indicator`. 先看下图:

![](/assets/images/20200407MasonryTricks/SafeArea1.gif)

如果使用更少的代码实现在安全区域内部 展示某个View.


## 代码实现

这里我们借助Masonry最新库提供的支持API

``` objc
- (void)viewDidLoad {
    [super viewDidLoad];
    
    [self.subViewA mas_makeConstraints:^(MASConstraintMaker *make) {
        if (@available(iOS 11.0, *)) {
            make.top.equalTo(self.view.mas_safeAreaLayoutGuideTop);
            make.left.equalTo(self.view.mas_safeAreaLayoutGuideLeft);
            make.bottom.equalTo(self.view.mas_safeAreaLayoutGuideBottom);
            make.right.equalTo(self.view.mas_safeAreaLayoutGuideRight);
        } else {
            make.top.equalTo(self.mas_topLayoutGuideBottom);
            make.left.right.equalTo(self.view);
            make.bottom.equalTo(self.mas_bottomLayoutGuideTop);
        }        
    }];
}

```

> 这里看到safeArea仅仅支持 iOS11以上 那么 iOS11一下 我们可以借出如上述代码
> `self.mas_topLayoutGuideBottom`和`self.mas_bottomLayoutGuideTop` 这个是`self`指的是`UIViewController`

下面我们不用SafeArea来使用一下 如下api

1. 顶部区域

	* `mas_topLayoutGuide`和`mas_topLayoutGuideBottom`都是 顶到屏幕 刘海屏底部 也就是说和 safeAreaTop一样,如下图:    
	![](/assets/images/20200407MasonryTricks/mas_topLayoutGuide&mas_topLayoutGuideBottom.webp)
	
	* `mas_topLayoutGuideTop` 顶到屏幕顶部(忽略刘海屏,也就是说被刘海盖住),如下图示:
	![](/assets/images/20200407MasonryTricks/mas_topLayoutGuideTop.webp)

2. 底部区域

	* `mas_bottomLayoutGuide`和`mas_bottomLayoutGuideTop` 都是在`Home条`的上面 ,如下图:  
	![](/assets/images/20200407MasonryTricks/mas_bottomLayoutGuide&mas_bottomLayoutGuideTop.webp)
	
	* `mas_bottomLayoutGuideBottom` 直接推底,撑到屏幕边缘,如下图:  
	![](/assets/images/20200407MasonryTricks/mas_bottomLayoutGuideBottom.webp)
	

#### 如果想实现和safeArea一样的搞法 可以这样写


``` objc
[self.subViewA mas_makeConstraints:^(MASConstraintMaker *make) {
        make.top.equalTo(self.mas_topLayoutGuide);
        make.left.right.equalTo(self.view);
        make.bottom.equalTo(self.mas_bottomLayoutGuide);
}];
```

> !!!注意 LayoutGuide 紧紧适用于` ios(7.0,11.0)`,也就是说11之后 必须使用safeArea才精准.

附上一张搞完的效果图

![](/assets/images/20200407MasonryTricks/LayoutGuideFullsceen.webp)



# 总结

借入Masory 可以更加方便快捷的实现我们想要的布局效果并且不用写宏区分是否是刘海屏或者其他屏幕,因为我们操控的实际上就是 安全区内部的范围. 没事得多关注开源代码时长写个demo实验一下.

所以想实现上文中最佳实践的代码应该是

``` objc
[self.subViewA mas_makeConstraints:^(MASConstraintMaker *make) {
    if (@available(iOS 11.0, *)) {
        make.top.equalTo(self.view.mas_safeAreaLayoutGuideTop);
        make.left.equalTo(self.view.mas_safeAreaLayoutGuideLeft);
        make.bottom.equalTo(self.view.mas_safeAreaLayoutGuideBottom);
        make.right.equalTo(self.view.mas_safeAreaLayoutGuideRight);
    } else {
        make.top.equalTo(self.mas_topLayoutGuideBottom);
        make.left.right.equalTo(self.view);
        make.bottom.equalTo(self.mas_bottomLayoutGuideTop);
    }        
}];

```



[本文Demo](https://github.com/sunyazhou13/MasonryTrickDemo)