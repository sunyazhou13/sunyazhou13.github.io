---
layout: post
title: iOS抖音滚动字幕
date: 2019-03-21 09:50:20
categories: [iOS]
tags: [iOS, 动画, 抖音动画系列, Objective-C, skills]
typora-root-url: ..
---


![](/assets/images/20190321UIScrollTextDemo/CAGradientCover.webp)

# 前言

很久没更新博客了(家里事情比较多时间太紧迫加上工作时间有限),今天给大家带来的是抖音得滚动字幕,也就是音乐专辑的专辑名称 废话不多说上图

抖音如下  
![](/assets/images/20190321UIScrollTextDemo/scrolltextdemo0.gif)

系统的滚动字幕如下

![](/assets/images/20190321UIScrollTextDemo/scrolltextdemo4.gif)

本篇完成之后如下  
![](/assets/images/20190321UIScrollTextDemo/scrolltextdemo5.gif)


* 支持蒙版渐变模糊 可调节
* 支持富文本字符串用于显示表情或者图片


# 开篇

整个实现比较简单 不超过 200行代码

![](/assets/images/20190321UIScrollTextDemo/scrolltextdemo1.gif)

首先我们要用到两个CALayer

* `CATextLayer` 用于展示文本
* `CAGradientLayer` 用于给文本加蒙版


然后我们新建一个`UIScrollTextView`继承自`UIView`(我这是纯娱乐写成UI前缀大家可自行封装哈.)

``` objc
@interface UIScrollTextView : UIView

@property (nonatomic, copy  ) NSString           *text;   //1
@property (nonatomic, strong) UIColor            *textColor; //2
@property (nonatomic, strong) UIFont             *font;  //3
 
@property (nonatomic, strong) NSAttributedString *attrString; //4

/**
 渐变开始的距离(0~0.5) 推荐 0.0x eg:0.026,
 如果设置成1的时候视图不够长会出现溢出得情况 不推荐超出范围
 */
@property (nonatomic, assign) CGFloat            fade; //5

@end
```

对外暴露的接口 

* 1.显示的文本内容
* 2.文本颜色
* 3.文本字体
* 4.属性字符串 自行可控颜色字体和样式
* 5.蒙版渐变模糊的 渐变长度 

首先大家可以先忽略这些对外暴露的接口 到.m中看实现如下

``` objc
@interface UIScrollTextView ()

@property (nonatomic, strong) CATextLayer  *textLayer; //文本layer  
@property (nonatomic, strong) CAGradientLayer *gradientLayer; //蒙版渐变layer

@property (nonatomic, assign) CGFloat      textSeparateWidth; //文本分割宽度
@property (nonatomic, assign) CGFloat      textWidth;   //文本宽度
@property (nonatomic, assign) CGFloat      textHeight;  //文本高度
@property (nonatomic, assign) CGRect       textLayerFrame; //文本layer的frame
@property (nonatomic, assign) CGFloat      translationX; //文字位置游标

@end
```

在`initWithFrame:`;和`awakeFromNib`方法中 初始化一些成员变量

``` objc
- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        [self configProperty];//初始化成员变量 //1
        [self initLayer]; //2
    }
    return self;
}

- (void)configProperty {
    _text = @"";
    _textColor = [UIColor whiteColor];
    _font = [UIFont systemFontOfSize:14.0];
    self.textSeparateWidth = [kSeparateText calculateSingleLineSizeFromFont:self.font].width;
    _fade = 0.026;
    
}
```

* 1.configProperty方法 初始化默认值
* 2.initLayer方法创建我们需要的2个layer
> configProperty方法 初始化成员变量最好用`_`下划线 这样不会触发`setter`因为我们很多的代码都是写在setter和getter中

#### 初始化Layer


下面我们重点看下`initLayer`

``` objc
- (void)initLayer {
    //文本layer  1
    if (self.textLayer == nil) {
        self.textLayer = [[CATextLayer alloc] init];
    }
    self.textLayer.alignmentMode = kCAAlignmentNatural; //设置文字对齐模式 自然对齐
    self.textLayer.truncationMode = kCATruncationNone;  //设置截断模式
    self.textLayer.wrapped = NO; //是否折行
    self.textLayer.contentsScale = [UIScreen mainScreen].scale;
    if (self.textLayer.superlayer == nil) {
        [self.layer addSublayer:self.textLayer];
    }
    
    //渐变 2
    self.gradientLayer = [CAGradientLayer layer];
    self.gradientLayer.shouldRasterize = YES;
    self.gradientLayer.rasterizationScale = [UIScreen mainScreen].scale;
    self.gradientLayer.startPoint = CGPointMake(0.0f, 0.5f); //3
    self.gradientLayer.endPoint = CGPointMake(1.0f, 0.5f);  //4
    id transparent = (id)[UIColor clearColor].CGColor; // 5
    id opaque = (id)[UIColor blackColor].CGColor; //5
    self.gradientLayer.colors = @[transparent, opaque, opaque, transparent]; // 6
    self.gradientLayer.locations = @[@0,@(self.fade),@(1-self.fade),@1]; // 7
    self.layer.mask = self.gradientLayer; //8
}
```

代码`1`处 创建`CATextLayer`和我们创建其它CALayer一样没啥好说的,设置折行、对齐、截断...

代码`2`处 这里重点说一下这个`CAGradientLayer`

代码`3`和`4`处是设置蒙版渐变 的开始方向和结束方向. (以屏幕左下角为原点0,0计算 到屏幕右上角1，1)
   
> 如果开始点是(0.0,0.5)结束点是(1.0,0.5)是横向渐变  
> 如果开始点是(0.5,0)结束点是(0.5,1)是纵向渐变  
> 这两个点决定了渐变的方向


我们可以把代码去掉运行看下不加蒙版的效果图 如下:

![](/assets/images/20190321UIScrollTextDemo/scrolltextdemo2.gif)

这里我用cyan颜色区域代表视图的大小,文本不加蒙版实际上超出显示范围的. 

> 注意: 动画不是这个layer自带,是我们自己加的代码,往下看 有代码

代码`5`处代码 是给当前渐变layer加渐变颜色 实现蒙版模糊遮盖的效果

代码`6`处 把对于的颜色的数组中给`gradientLayer.colors`

代码`7`处 对应 代码`6`处 配合使用,就做到了我们两边渐变遮盖的效果

![](/assets/images/20190321UIScrollTextDemo/scrolltextdemo3.gif)

上图就是我们下面代码的效果,我们加了4个点

``` objc
self.gradientLayer.colors = @[transparent, opaque, opaque, transparent]; // 6
self.gradientLayer.locations = @[@0,@(self.fade),@(1-self.fade),@1]; // 7
```

#### 更新layer布局

这里我们要在layoutSubviews方法中计算出正确的布局坐标,因为外部有可能使用autolayout布局.

``` objc
- (void)layoutSubviews {
    [super layoutSubviews];
    
    [CATransaction begin];
    [CATransaction setDisableActions:YES];
    CGFloat textLayerFrameY = CGRectGetHeight(self.bounds)/2 - CGRectGetHeight(self.textLayer.bounds) / 2;
    self.textLayer.frame = CGRectMake(0, textLayerFrameY, CGRectGetWidth(self.textLayerFrame), CGRectGetHeight(self.textLayerFrame));
    self.gradientLayer.frame = self.bounds;
    [CATransaction commit];
}
```
这里代码主要是更新gradientLayer 和textLayer的frame. 并

##### 为什么要用CATransaction? 

因为我们要在动画进行中手动改变动画的参数详情参考[设置动画参数](http://jefferyfan.github.io/2016/06/27/programing/iOS/CATransaction/)


### 剩下的主要有3个工作

* 绘制文本layer,就是把想显示的字符串给self.textLayer.string
* 添加滚动动画 
* 成员变量的setter中调用绘制文本layer和滚动动画方法


##### 添加drawTextLayer私有方法

``` objc
//拼装文本
- (void)drawTextLayer {
    self.textLayer.foregroundColor = self.textColor.CGColor;
    CFStringRef fontName = (__bridge CFStringRef)self.font.fontName;
    CGFontRef fontRef = CGFontCreateWithFontName(fontName);
    self.textLayer.font = fontRef;
    self.textLayer.fontSize = self.font.pointSize;
    CGFontRelease(fontRef);
    // 1
    self.textLayer.string = [NSString stringWithFormat:@"%@%@%@%@%@",_text,kSeparateText,_text,kSeparateText,_text];
}
```
这里注意 `1` 处 代码 干了两件事 
 
* 拼接文本
* 给layer.string 

格式拼接 __文本+3个空格+文本+3个空格+文本__

``` objc
NSString * const kSeparateText          = @"   ";   //3个空格
```
> kSeparateText 是个常量  

##### 添加文本滚动动画

``` objc
- (void)startAnimation {
    if ([self.textLayer animationForKey:kTextLayerAnimationKey]) {
        [self.textLayer removeAnimationForKey:kTextLayerAnimationKey];
    }
    CABasicAnimation *animation = [CABasicAnimation animation];
    animation.keyPath = @"transform.translation.x"; //沿着X轴运动
    animation.fromValue = @(self.bounds.origin.x);
    animation.toValue = @(self.bounds.origin.x - self.translationX);
    animation.duration = self.textWidth * 0.035f;
    animation.repeatCount = MAXFLOAT;
    animation.removedOnCompletion = NO;
    animation.fillMode = kCAFillModeForwards;
    animation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
    [self.textLayer addAnimation:animation forKey:kTextLayerAnimationKey];
}
```

这里给`self.textLayer`加一个CABasicAnimation,让它沿着X轴运动,当然如果大家喜欢后续我添加多个方向类似[MarqueeLabel滚动文本](https://github.com/sunyazhou13/MarqueeLabel)一样,不过我觉得[MarqueeLabel滚动文本](https://github.com/sunyazhou13/MarqueeLabel)的实现太复杂,不够接地气,这个简单的动画效果还是要自己写比较靠谱.


> 给self.textLayer添加动画即可,相信大家非常了解iOS动画我就不一一介绍了.

##### 成员变量的setter中调用绘制文本layer和滚动动画方法

``` objc
- (void)setText:(NSString *)text {
    _text = text;
    //计算单行文本大小
    CGSize size = [text calculateSingleLineSizeWithAttributeText:_font];
    _textWidth = size.width;
    _textHeight = size.height;
    _textLayerFrame = CGRectMake(0, 0, _textWidth * 3 + _textSeparateWidth * 2, _textHeight);
    _translationX = _textWidth + _textSeparateWidth;
    [self drawTextLayer];
    [self startAnimation];
}
```

这里每次给当前视图设置相关文本的时候 setter处,就调用一下 渲染文本和动画.这样可以对外部暴露相关接口实时修改实时生效.至于其它的属性字符串,字体等也要最后追加上

``` objc
[self drawTextLayer];
[self startAnimation];
```

因为改动对文本大小有影响

文字的计算大小这里用的是 CoreText,支持多行和单行

属性字符串也一样就不写在这里了. 详细代码demo我已经把它写到文章下方 大家自行加载学习即可


最终效果  
![](/assets/images/20190321UIScrollTextDemo/scrolltextdemo5.gif)

# 总结

由于业余时间有限,没能1个月稳定更新2偏文章,请各位同仁理解,抖音系列动画需要先写demo然后仔细研究,最终才形成文章.制作不易,本篇也参考了开源代码和一些滚动字幕的库.由于演示的不完美,有些类还有可扩展空间,比如 开始动画和结束动画对外暴露接口,比如像系统那样的自然添加动画组. 本篇感谢开源作者[qiaoshi](https://github.com/sshiqiao/douyin-ios-objectc),因为作者写的不是很完美我学习研究一下,增加了渐变效果和属性字符串得支持. 

[本篇demo](https://github.com/sunyazhou13/UIScrollTextDemo)


