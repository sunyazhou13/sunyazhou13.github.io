---
layout: post
title: 使用Masonry约束实现简单的高级拖拽视图
date: 2019-09-26 20:05:20
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, Swift, Masonry]
typora-root-url: ..
---


![](/assets/images/20190926MasonryPanViewDemo/panviewdemo.avif)


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!



## 背景

最近开发遇到一个上图的需求,做一个挂件能四处拖动并且上边还时不时的展示一个tips气泡的`Label`,在尽量使用少的代码来实现这个功能,作为我手一名iOS开发人员必须严格考究这个需求,显然这有点麻烦,一贯懒惰我的实在不想计算哪个边哪个角甚至滑动到哪里的`frame`,计算frame这既听起来可笑又觉的没什么技术含量. 为了让代码量少并且能满足需求,我选择使用Masonry来实现这个功能


## 开搞

首先我搞起之前我建议大家看下[土土哥](http://tutuge.me/)的[有趣的Autolayout示例1~5Masonry实现文章](http://tutuge.me/tags/Masonry/),本文也是参考土土哥的文章学习写出的,见笑了各位,个人认为土土哥的文章简直就是Masonry自动布局的样板教程,强烈建议入门的小伙伴或者高手经常复写.


下面的图是土土哥实现的demo  
![](/assets/images/20190926MasonryPanViewDemo/tutugeMasonry1.avif)

![](/assets/images/20190926MasonryPanViewDemo/tutugeMasonry2.avif)


但我的问题是怎么保证那个tip的气泡label左右拖拽能辗转腾挪的允许logo图像之间有`旷量移动`

## 代码实现旷量移动


首先我们创建一个demo,很简单VC的demo就行 创建相关绿色背景视图和图像imageView以及tipLabel的气泡视图,具体代码我贴了出来,我就不啰嗦如何创建其它视图了xib拖拽一下就行了.

``` objc
#import "ViewController.h"
#import <Masonry/Masonry.h>

@interface ViewController ()
@property (weak, nonatomic  ) IBOutlet UIView        *greenView;
@property (weak, nonatomic  ) IBOutlet UIImageView   *widgetView;
@property (weak, nonatomic  ) IBOutlet UILabel       *bubbleTitleLabel;

@property (nonatomic, strong) MASConstraint *leftConstraint; //左侧约束变量
@property (nonatomic, strong) MASConstraint *topConstraint;  //顶部约束变量

@end


```

这里可以看到有两个`leftConstraint `和`topConstraint `的约束全局变量,这两个就是实现拖拽的时候改变约束的偏移量来实现的.具体代码如下


``` objc
CGFloat screenWidth = [UIScreen mainScreen].bounds.size.width;
CGFloat screenHeight = [UIScreen mainScreen].bounds.size.height;
[self.widgetView mas_makeConstraints:^(MASConstraintMaker *make) {
    // 设置边界条件约束，保证内容可见，优先级1000
    make.left.greaterThanOrEqualTo(self.greenView.mas_left);
    make.right.lessThanOrEqualTo(self.greenView.mas_right);
    make.top.greaterThanOrEqualTo(self.greenView.mas_top);
    make.bottom.lessThanOrEqualTo(self.greenView.mas_bottom);
    
    self.leftConstraint = make.centerX.equalTo(self.greenView.mas_left).with.offset(screenWidth - 20).priorityHigh(); // 优先级要比边界条件低
    self.topConstraint = make.centerY.equalTo(self.greenView.mas_top).with.offset(screenHeight - 100).priorityHigh(); // 优先级要比边界条件低
    make.width.height.mas_equalTo(@100);
}];
```
上边的`greaterThanOrEqualTo`和`lessThanOrEqualTo`都是限制挂件的可滑动范围,而最后的`make.centerX/Y.equalTo`是限制挂件的默认位置,我让它默认在右下角,所以通过偏移量移动过去

> 注意:这里有个坑就是因为这个东西能四处滑动 所以基本需要锁定`left`和`top`,我发现只有通过offset移动才能确定最初位置,如果equalTo直接写成xxxview的bottom或者right是滑动不了的,仔细思考一下masonry就知道为啥了.

然后添加手势并实现相关滑动事件即可实现滑动

``` objc
UIPanGestureRecognizer *pan = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(panWithGesture:)];
[self.greenView addGestureRecognizer:pan];

...

- (void)panWithGesture:(UIPanGestureRecognizer *)pan {
    CGPoint touchPoint = [pan locationInView:self.greenView];
    self.leftConstraint.offset = touchPoint.x;
    self.topConstraint.offset = touchPoint.y;
}
        
```


#### 旷量Label的约束

``` objc
[self.bubbleTitleLabel mas_remakeConstraints:^(MASConstraintMaker *make) {
	make.height.equalTo(@26);
	make.bottom.equalTo(self.widgetView.mas_top);
	make.left.greaterThanOrEqualTo(self.greenView.mas_left).offset(0);
	make.right.lessThanOrEqualTo(self.greenView.mas_right).offset(0);
	make.centerX.lessThanOrEqualTo(self.widgetView.mas_right).offset(10);
	make.centerX.greaterThanOrEqualTo(self.widgetView.mas_left).offset(-10);
}];
```

想要实现旷量移动必须增加更多的约束限制

这里就增加了

``` objc
make.centerX.lessThanOrEqualTo(self.widgetView.mas_right).offset(10);
make.centerX.greaterThanOrEqualTo(self.widgetView.mas_left).offset(-10);
```

这样就实现了 左右超过滑动便宜还依然控制着tip的label左右移动范围.


# 总结

经过工作中遇到的问题实例,学习了一些Masonry的技巧,希望和大家分享,demo我已放到下面 喜欢自行下载学习.


[demo下载](https://github.com/sunyazhou13/PanViewDemo)