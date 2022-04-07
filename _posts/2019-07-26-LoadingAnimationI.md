---
title: 做一个简单的Loading动画
categories: [ios开发]
tags: [ios, 动画]
date: 2019-07-26 11:13:44
---


![](/assets/images/20190726LoadingAnimationI/CircleLoadingAnimation.png)


# 前言


由于最近工作忙到坐地铁回家都能睡着,博客没能及时更新,今天抽个时间写个加载动画,废话不多说上图.

![](/assets/images/20190726LoadingAnimationI/CircleLoadingAnimation.gif)


(颜色可以自定义哈,非常简单,小白自己可以随便改)




# 开始


创建一个UIView的子类`UILoadingView`(名字最好不要带`UI`开头哈,我这是为了玩 大家理解就行),然后添加两个接口


``` objc

@interface UILoadingView : UIView

- (void)startLoading; //1
- (void)stopLoading;  //2

@end
```

> 1. 开始动画
> 2. 结束动画


实现的.m文件中我们需要用到`CAReplicatorLayer`,主要是看上边的小圆点比较多,用`CAReplicatorLayer`可以帮助我们自动创建多个小圆点实例.

``` objc
@interface UILoadingView ()

@property(nonatomic, strong) CAReplicatorLayer *replicatorLayer;

@end

@implementation UILoadingView

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        [self setupSubviews];
    }
    return self;
}

- (void)awakeFromNib {
    [super awakeFromNib];
    [self setupSubviews];
}

- (void)setupSubviews {
	//这里要补全代码 创建需要的视图 继续往下看
}

@end
```

### 创建子视图

首先我们需要创建一个replicatorLayer的实例对象,然后向这个对象上添加一个圆点的,并错开角度.这里用到的知识点基本就是position和bounds啥关系.这里我不想啰嗦了大家自行google就行了.上代码

``` objc
- (void)setupSubviews {
    if (self.replicatorLayer == nil) {
        self.replicatorLayer = [CAReplicatorLayer layer];
        self.replicatorLayer.backgroundColor = [UIColor clearColor].CGColor;
        [self.layer addSublayer:self.replicatorLayer];
        self.replicatorLayer.bounds = self.bounds;
        self.replicatorLayer.position = self.center;
        NSInteger instanceCount = 15;  //1
        self.replicatorLayer.instanceCount = instanceCount; //
        self.replicatorLayer.instanceTransform = CATransform3DMakeRotation(M_PI * 2 / instanceCount, 0, 0, 1); //2
        self.replicatorLayer.instanceDelay = 1 / (instanceCount * 1.0); //2
        
    }
    //圆点
    CALayer *circle = [CALayer layer];
    circle.bounds = CGRectMake(0, 0, 10, 10);
    circle.cornerRadius = 5;
    circle.position = CGPointZero;
    circle.backgroundColor = [self randomColor].CGColor;
    circle.name = kCircleName; //3  设置layer的唯一标识 
    [self.replicatorLayer addSublayer:circle];
    //小技巧 刚开始的动画不是很自然，那是因为小圆点的初始比例是1,让小圆点的初始比例为0.01
    circle.transform = CATransform3DMakeScale(0.01, 0.01, 0.01); //5
}
```

> 1. 1处的代码是让`CAReplicatorLayer`帮我们创建指定数量的实例对象(我们添加的原点就是它需要的也就是说它帮你创建了instanceCount个实例对象)
> 2. 2处代码 是设置错开的角度（2π 是 360°, 如果需要一圈创建指定数量的圆点 那么 instanceCount/2π 就是每个圆的角度,这里很重要 认真学习一下.）
> 3. 3处代码是给这个layer设置一个唯一标识 一会儿要通过方法找到它,如果 不这样做你就要搞个成员变量去存一下,如果用成员变量存储的话注意内存引用关系,我这里不推荐成员变量的搞法.
> 4. 4处代码主要是解决动画不自然,因为添加动画的圆点的初始比例是1,只有第一次开始的时候很愣.


#### 找到圆点layer

``` objc
- (CALayer *)findCircleLayer {
    for (CALayer *layer in [self.replicatorLayer sublayers]) {
        if ([[layer name] isEqualToString:kCircleName]) {
            return layer;
        }
    }
    return nil;
}
```

我们用的时候调用这个方法 找一下我们添加上去的layer即可


#### 实现对外暴露的方法

``` objc
- (void)startLoading {
    CALayer *circleLayer = [self findCircleLayer];
    if (circleLayer && ![[circleLayer animationKeys] containsObject:kScaleAnimationKey]) {
        //加动画
        CABasicAnimation *scale = [CABasicAnimation animationWithKeyPath:@"transform.scale"];
        scale.fromValue = @(1);
        scale.toValue = @(0.1);
        scale.duration = 1;
        scale.repeatCount = HUGE;
        [circleLayer addAnimation:scale forKey:kScaleAnimationKey];
    }
}

- (void)stopLoading {
    CALayer *circleLayer = [self findCircleLayer];
    if (circleLayer && [[circleLayer animationKeys] containsObject:kScaleAnimationKey]) {
        [circleLayer removeAnimationForKey:kScaleAnimationKey];
    }
}
```

> kScaleAnimationKey 常量自行定义即可.


#### 支持AutoLayout

目前大家用的比较多的是`Masonry`,所以这里使用`Masonry`自动布局, 使用自动布局主要是是为了方便外部调用的时候外部视图使用了自动布局,那么内部就需要更新相关`layer`的`frame`.具体代码如下

``` objc
- (void)layoutSubviews {
    [super layoutSubviews];
    
    [CATransaction begin];
    [CATransaction setDisableActions:YES];
    self.replicatorLayer.bounds = self.bounds;
    self.replicatorLayer.position = CGPointMake(CGRectGetWidth(self.bounds)/2, CGRectGetHeight(self.bounds)/2);
    
    CALayer *circleLayer = [self findCircleLayer];
    if (circleLayer) {
        circleLayer.position = CGPointMake(self.frame.size.width / 2, self.frame.size.height/2 - 40); //距离圆心 40pt
    }
    [CATransaction commit];
    [self.replicatorLayer layoutSublayers];
}
```

这里使用了 隐式动画和显式动画相关的知识

``` objc
[CATransaction begin];
[CATransaction setDisableActions:YES];

//... 这里修改相关动画参数 

[CATransaction commit];

```

因为有可能layer在动画中,如果在动画中一般在这里需要加上`事务`修改这样才会更顺畅自然. 可以看到我上边的代码注释写的`40pt`的距离 实际上是圆心距离我们上边做的原点layer的的距离,大家可自行修改.

# 总结


由于最近在研究一[音频波形](https://juejin.im/post/5c1bbec66fb9a049cb18b64c)的动画效果,想实现一个类似网易云音乐的黑胶唱片效果,可是用到的知识有点忘记,用此片文章来回顾复习一下动画的知识,也是为了很久没更新的博客更新一下,记录一下经常忘记的小技巧

Demo我给在下面也把相关的文章参考 放在下方,有兴趣大家可以学习一下.




[loading动画Demo](https://github.com/sunyazhou13/UILoadingView)


[参考](http://www.devtalking.com/articles/calayer-animation-replicator-animation/)

