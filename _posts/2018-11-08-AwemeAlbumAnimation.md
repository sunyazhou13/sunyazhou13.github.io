---
title: iOS抖音右下角专辑动画
categories: [ios开发]
tags: [ios, 抖音动画系列]
date: 2018-11-08 11:52:06
---


# 前言

前两天分享了 抖音 上下滑切换 ,今天给和大家分享的是抖音右小角底部的专辑动画

上图看下

![](/assets/images/20181108AwemeAlbumAnimation/final.gif)

再看下抖音的

![](/assets/images/20181108AwemeAlbumAnimation/AlbumAnimation.gif)

# 具体实现思路

首先需要3涨素材 这个在demo中就可以找到哈

在文章底部demo中有

1. ContrainerView
2. Background Layer 
3. Album (UIImageView)

![](/assets/images/20181108AwemeAlbumAnimation/album1.png)

我们首先写个 `MusicAlbumView` 继承自UIView

``` objc
@interface MusicAlbumView : UIView

@property (nonatomic, strong) UIImageView  *album;
// 开始动画 rate 动画时间系数
- (void)startAnimation:(CGFloat)rate;
// 重置视图 删除所有已添加的动画组
- (void)resetView;

@end

```

### 并提供两个接口 

* 一个开始动画
* 一个重置动画

`album` 成员变量 是为了给外部加载网络图片使用 所以暴露在.h中, 例如下面的调用

``` objc
__weak __typeof(self) wself = self;
//加载网络图
[self.musicAlbum.album sd_setImageWithURL:[NSURL URLWithString:@"https://www.sunyazhou.com/images/logo2.jpg"] completed:^(UIImage * _Nullable image, NSError * _Nullable error, SDImageCacheType cacheType, NSURL * _Nullable imageURL) {
    if(!error) {
        wself.musicAlbum.album.image = image;
    }
}];
    
```

### 下面我们来看下内部如何封装

首先我们要创建背景

``` objc
- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        self.noteLayers = [NSMutableArray array];
        //专辑背景容器视图
        self.albumContainer =[[UIView alloc]initWithFrame:self.bounds];
        [self addSubview:self.albumContainer];
    }
    return self;
}
```
> 这里初始化的数组是为下面装动画layer使用 方便 Reset的时候 移除所有layer和动画

一个产品背景容器UIView + 一个产品背景Layer + 一个个人头像背景UIImageView 

我们依次把下面代码写在`[self addSubview:self.albumContainer]`底部

添加唱片背景


``` objc
//添加唱片icon的layer
CALayer *backgroudLayer = [CALayer layer];
backgroudLayer.frame = self.bounds;
backgroudLayer.contents = (id)[UIImage imageNamed:@"music_cover"].CGImage;
[self.albumContainer.layer addSublayer:backgroudLayer];

```

头像视图

``` objc
//放在唱片内部的图片
CGFloat w = CGRectGetWidth(frame) / 2.0f;
CGFloat h = CGRectGetHeight(frame) / 2.0f;
CGRect albumFrame = CGRectMake(w / 2.0f, h / 2.0f, w, h);
self.album = [[UIImageView alloc]initWithFrame:albumFrame];
self.album.contentMode = UIViewContentModeScaleAspectFill;
[self.albumContainer addSubview:self.album];
self.album.layer.cornerRadius = h / 2.0f;
self.album.layer.masksToBounds = YES;
        
```

然后居中对齐.


#### 给`self.albumContainer.layer`加旋转



我们在外部调用startAnimation:方法的时候 给`self.albumContainer.layer`添加旋转动画旋转

``` objc

- (void)startAnimation:(CGFloat)rate {
    CABasicAnimation* rotationAnimation;
    rotationAnimation = [CABasicAnimation animationWithKeyPath:@"transform.rotation.z"];
    rotationAnimation.toValue = [NSNumber numberWithFloat: M_PI * 2.0];
    rotationAnimation.duration = 3.0f;
    rotationAnimation.cumulative = YES;
    rotationAnimation.repeatCount = MAXFLOAT;
    [self.albumContainer.layer addAnimation:rotationAnimation forKey:@"rotationAnimation"];
}
```

加完效果是这样的

![](/assets/images/20181108AwemeAlbumAnimation/album2.gif)


#### 如何实现弧度动画

好 完成一半了 下面我们来说一下 弧度旋转.

现仔细观察一下动画的音符

![](/assets/images/20181108AwemeAlbumAnimation/album3.gif)


这是一张音符动画 它的运动轨迹大概是这样的

![](/assets/images/20181108AwemeAlbumAnimation/bezier1.png)

我们其实用到的是贝塞尔曲线动画 (我画的不是很好 大家理解这个意思就好)


然后让音符的layer沿着 这个贝塞尔曲线做旋转... 其实是下面的一些列动作组合


这个需要一个动画组 包含如下动作 

* 一个贝塞尔曲线运动的轨迹动画啊
* 旋转弧度 大概半圈 小一些 M_PI * 0.10 ~ M_PI * -0.10 之间旋转的动画
* 透明度 从0 到 1 在到 0 之间运动的透明度动画 
* 缩放动画 从开始 1x 到 2x 之间变化


好我们来解决一下 关键的贝赛尔曲线

首先创建一个动画组 

``` objc
CAAnimationGroup *animationGroup = [[CAAnimationGroup alloc]init];
animationGroup.duration = rate/4.0f;
animationGroup.beginTime = CACurrentMediaTime() + delayTime;
animationGroup.repeatCount = MAXFLOAT;
animationGroup.removedOnCompletion = NO;
animationGroup.fillMode = kCAFillModeForwards;
animationGroup.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
```

> rate 外部传入 delayTime是 动画组开始动画的延迟的时间 我们设置 delayTime 为0就是不延时 下面解释为什么这么写


创建一个 贝赛尔曲线东动画

``` objc
//bezier路径帧动画
CAKeyframeAnimation * pathAnimation = [CAKeyframeAnimation animationWithKeyPath:@"position"];
    
```

然后把下面这坨代码加到 上面代码的底部

``` objc

CGFloat sideXLength = 40.0f;  //X轴左右侧偏移量
CGFloat sideYLength = 100.0f; //Y轴上下偏移量

CGPoint beginPoint = CGPointMake(CGRectGetMidX(self.bounds) - 5,  //贝赛尔曲线开始点CGRectGetMaxY(self.bounds));
CGPoint endPoint = CGPointMake(beginPoint.x - sideXLength, beginPoint.y - sideYLength); //贝塞尔曲线结束点
NSInteger controlLength = 60; //贝塞尔曲线控制点长度
CGPoint controlPoint = CGPointMake(beginPoint.x - sideXLength/2.0f - controlLength, beginPoint.y - sideYLength/2.0f + controlLength); //贝塞尔曲线控制点

UIBezierPath *customPath = [UIBezierPath bezierPath]; //创建贝塞尔轨迹
[customPath moveToPoint:beginPoint];
[customPath addQuadCurveToPoint:endPoint controlPoint:controlPoint]; //核心代码 二次曲线方程式 可以google查一下

pathAnimation.path = customPath.CGPath; //让动画沿着轨迹运动

```

我来解释一下 关键变量

> beginPoint 开始点: 当前视图X坐标中心 向 左偏移 5dp (X轴是左右) Y的坐标是当前视图高度 就是最下面
> endPoint 结束点: 开始点的X 减去 40左侧偏移(就是距离左侧更远) Y也是 减去偏移之后 到了 视图的外部 左上方.
> controlPoint 控制点: 开始点 比如 X是 30 - 60/2.0 - 60 = -60,显然已经跑到最左边了 超出了视图范围, Y 后面是+ controlLength 说明是加大 Y坐标. 

大家可以不用理解这些细节 看下面图就好了 

![](/assets/images/20181108AwemeAlbumAnimation/bezier2.png)

> customPath: 贝塞尔曲线对象

``` objc

[customPath moveToPoint:beginPoint];
//核心代码 二次曲线方程式 可以google查一下
[customPath addQuadCurveToPoint:endPoint controlPoint:controlPoint];
//让动画沿着轨迹运动
pathAnimation.path = customPath.CGPath;

```


这就是 增加开始点 结束点 控制点之后的贝塞尔轨迹,然后 设置轨迹动画的path就完事了.

这一步搞完 然后 把`pathAnimation` 放到动画组中,然后创建一个 音符的layer添加动画组

``` objc
[animationGroup setAnimations:@[pathAnimation]];
    
CAShapeLayer *layer = [CAShapeLayer layer];
layer.contents = (__bridge id _Nullable)([UIImage imageNamed:imageName].CGImage);
layer.frame = CGRectMake(beginPoint.x, beginPoint.y, 10, 10);
[self.layer addSublayer:layer];
[self.noteLayers addObject:layer];
[layer addAnimation:animationGroup forKey:nil];
```

> `[self.noteLayers addObject:layer];`这行代码是我们前面声明的全局变量 存layer,reset的时候删除相关layer和动画使用

我们来看下 简单一个音符 沿着贝塞尔曲线运动

![](/assets/images/20181108AwemeAlbumAnimation/album4.gif)

好下面的工作就是 加旋转 透明 缩放动画

``` objc
//旋转帧动画
CAKeyframeAnimation * rotationAnimation = [CAKeyframeAnimation animationWithKeyPath:@"transform.rotation"];
//这里实际上是控制动画开始弧度和结束弧度 M_PI(180°) 就是半圆 * 0.10 或者 * -0.10j是为了关键点上下偏移的18°的间隙
[rotationAnimation setValues:@[
                               [NSNumber numberWithFloat:0],
                               [NSNumber numberWithFloat:M_PI * 0.10],
                               [NSNumber numberWithFloat:M_PI * -0.10]]];
//透明度帧动画
CAKeyframeAnimation * opacityAnimation = [CAKeyframeAnimation animationWithKeyPath:@"opacity"];
[opacityAnimation setValues:@[
                              [NSNumber numberWithFloat:0],
                              [NSNumber numberWithFloat:0.2f],
                              [NSNumber numberWithFloat:0.7f],
                              [NSNumber numberWithFloat:0.2f],
                              [NSNumber numberWithFloat:0]]];
//缩放帧动画
CABasicAnimation *scaleAnimation = [CABasicAnimation animation];
scaleAnimation.keyPath = @"transform.scale";
scaleAnimation.fromValue = @(1.0f);
scaleAnimation.toValue = @(2.0f);
```

最后添把所有的动画添加到动画组

``` objc
[animationGroup setAnimations:@[pathAnimation, scaleAnimation,  rotationAnimation,opacityAnimation]];
```

> 注意一下: 为了让音符的图片更生动我们需要把`layer.opacity = 0.0f;` 这个音符透明 从而用透明度帧动画控制透明.


然后封装好方法 把上边我们做的贝塞尔曲线 透明 渐变 缩放  动画组都放在这个方法里面


完整代码如下

``` objc
- (void)addNotoAnimation:(NSString *)imageName
               delayTime:(NSTimeInterval)delayTime
                    rate:(CGFloat)rate{
    CAAnimationGroup *animationGroup = [[CAAnimationGroup alloc]init];
    animationGroup.duration = rate/4.0f;
    animationGroup.beginTime = CACurrentMediaTime() + delayTime;
    animationGroup.repeatCount = MAXFLOAT;
    animationGroup.removedOnCompletion = NO;
    animationGroup.fillMode = kCAFillModeForwards;
    animationGroup.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
    
    //bezier路径帧动画
    CAKeyframeAnimation * pathAnimation = [CAKeyframeAnimation animationWithKeyPath:@"position"];
    
    //X轴左右侧偏移量
    CGFloat sideXLength = 40.0f;
    //Y轴上下偏移量
    CGFloat sideYLength = 100.0f;
    
    //贝赛尔曲线开始点
    CGPoint beginPoint = CGPointMake(CGRectGetMidX(self.bounds) - 5, CGRectGetMaxY(self.bounds));
    //贝塞尔曲线结束点
    CGPoint endPoint = CGPointMake(beginPoint.x - sideXLength, beginPoint.y - sideYLength);
    //贝塞尔曲线控制点长度
    NSInteger controlLength = 60;
    //贝塞尔曲线控制点
    CGPoint controlPoint = CGPointMake(beginPoint.x - sideXLength/2.0f - controlLength, beginPoint.y - sideYLength/2.0f + controlLength);
    //创建贝塞尔轨迹
    UIBezierPath *customPath = [UIBezierPath bezierPath];
    [customPath moveToPoint:beginPoint];
    //核心代码 二次曲线方程式 可以google查一下
    [customPath addQuadCurveToPoint:endPoint controlPoint:controlPoint];
    //让动画沿着轨迹运动
    pathAnimation.path = customPath.CGPath;
    
    
    //旋转帧动画
    CAKeyframeAnimation * rotationAnimation = [CAKeyframeAnimation animationWithKeyPath:@"transform.rotation"];
    //这里实际上是控制动画开始弧度和结束弧度 M_PI(180°) 就是半圆 * 0.10 或者 * -0.10j是为了关键点上下偏移的18°的间隙
    [rotationAnimation setValues:@[
                                   [NSNumber numberWithFloat:0],
                                   [NSNumber numberWithFloat:M_PI * 0.10],
                                   [NSNumber numberWithFloat:M_PI * -0.10]]];
    //透明度帧动画
    CAKeyframeAnimation * opacityAnimation = [CAKeyframeAnimation animationWithKeyPath:@"opacity"];
    [opacityAnimation setValues:@[
                                  [NSNumber numberWithFloat:0],
                                  [NSNumber numberWithFloat:0.2f],
                                  [NSNumber numberWithFloat:0.7f],
                                  [NSNumber numberWithFloat:0.2f],
                                  [NSNumber numberWithFloat:0]]];
    //缩放帧动画
    CABasicAnimation *scaleAnimation = [CABasicAnimation animation];
    scaleAnimation.keyPath = @"transform.scale";
    scaleAnimation.fromValue = @(1.0f);
    scaleAnimation.toValue = @(2.0f);
    
    [animationGroup setAnimations:@[pathAnimation, scaleAnimation,  rotationAnimation,opacityAnimation]];
    
    CAShapeLayer *layer = [CAShapeLayer layer];
    layer.opacity = 0.0f;
    layer.contents = (__bridge id _Nullable)([UIImage imageNamed:imageName].CGImage);
    layer.frame = CGRectMake(beginPoint.x, beginPoint.y, 10, 10);
    [self.layer addSublayer:layer];
    [self.noteLayers addObject:layer];
    [layer addAnimation:animationGroup forKey:nil];
}

```

在我们对外提供的startAnimation:方法中调用

``` objc
- (void)startAnimation:(CGFloat)rate {
    rate = fabs(rate);  //check 防止 rate输入为负值
    [self resetView];   //首先重置动画
   	//这里调用
	[self addNotoAnimation:@"icon_home_musicnote1" delayTime:0.0f rate:rate];
	//。。。封面的旋转动画    
}
```

写到这里大概就完成了一个音符的动画 
如果像做多个音符动画 就多调用几次 然后控制好开始时间的延时

``` objc
[self addNotoAnimation:@"icon_home_musicnote1" delayTime:0.0f rate:rate];
[self addNotoAnimation:@"icon_home_musicnote2" delayTime:1.0f rate:rate];
[self addNotoAnimation:@"icon_home_musicnote1" delayTime:2.0f rate:rate];
```

__写到这里可以看到我们实际上是 通过delayTime 延时(单位秒) 开控制 每个音符 距离上个音符的间隔时间,通过间隔时间来控制音符之间 交替 出现__.


所以上面的动画组里面有这样一行代码

``` objc
animationGroup.beginTime = CACurrentMediaTime() + delayTime;
```

就是基于当前的时间延迟1秒或者2秒来控制 

完成之后 就是这样了


![](/assets/images/20181108AwemeAlbumAnimation/final.gif)


# 总结


首先感谢开源的小伙伴 的代码,我认真研读了几遍也写了一些代码,有些东西真是 天下大事必做于细 天下难事必做于易的感受.

这里的代码实现主要分开 专辑图旋转和音符动画组的实现即可 

希望和大家分享 技术技巧.写的比较凌乱 我会逐渐提高这方面的能力.希望大家多多指教


[最终的demo](https://github.com/sunyazhou13/MusicAlbumViewDemo)


参考

[iOS高仿抖音app](https://github.com/sunyazhou13/douyin-ios-objectc)


