---
layout: post
title: iOS抖音的上下滑实现
date: 2018-11-06 17:55:09
categories: [iOS]
tags: [iOS, 动画, 抖音动画系列, Objective-C, skills]
typora-root-url: ..
---


# 前言 

一直一来都在 研究抖音App做的短视频 上下滑动 的技术实现, 今天写了个demo,方便学习技术技巧和记录知识,


![](/assets/images/20181106AwemeTopBottomScrollDemo/AwemeDemo1.gif)


# 技术实现原理

* UITableView 


其实就是一个UITableView改变上下显示范围. talk is cheap show me the code

我说话不绕弯子,代码如下 实现起来非常简单

``` objc

_tableView = [[UITableView alloc] initWithFrame:CGRectMake(0, -SCREEN_HEIGHT, SCREEN_WIDTH, SCREEN_HEIGHT * 5)];
_tableView.contentInset = UIEdgeInsetsMake(SCREEN_HEIGHT, 0, SCREEN_HEIGHT * 3, 0);

```

1. 初始化的时候,TableView放在屏幕外边.
2. contentInset 显示内容的内边距, 以此是 `上`, `左`, `下`,  `右`, 上边距 距离整好屏幕高度,底部 是 顶部边距(屏幕高度的 3倍) 方便滑动, 左右分别顶到两边 搞定.

我画个图演示一下.

![](/assets/images/20181106AwemeTopBottomScrollDemo/AwemeDemo2.webp)



看到这张图 大家也许 已经明白了，最核心的地方是控制 TableView的上下边距,上边距留够一个屏幕高度,下边距留够下滑3屏左右的缓冲.


# 说一下用到的技巧

创建tableView很简单 如果理解不了 可以下载文章末尾demo

有个小技巧是 如何做到 上下滑动 能够完整的 滑动到对应位置 整好 占满屏幕类似 开启了UIScrollView的 `pagingEnabled`.


## 实现滑动的代理方法

首先需要声明一个当前滑动页码的成员变量

``` objc
@property (nonatomic, assign) NSInteger  currentIndex;
```

然后滑动代理停止的时候  判断一下

``` objc
#pragma mark -
#pragma mark - ScrollView delegate
- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate{
    dispatch_async(dispatch_get_main_queue(), ^{
        CGPoint translatedPoint = [scrollView.panGestureRecognizer translationInView:scrollView];
        //UITableView禁止响应其他滑动手势
        scrollView.panGestureRecognizer.enabled = NO;
        
        if(translatedPoint.y < -50 && self.currentIndex < (kDataSourceCount - 1)) {
            self.currentIndex ++;   //向下滑动索引递增
        }
        if(translatedPoint.y > 50 && self.currentIndex > 0) {
            self.currentIndex --;   //向上滑动索引递减
        }
        [UIView animateWithDuration:0.15
                              delay:0.0
                            options:UIViewAnimationOptionCurveEaseOut animations:^{
                                //UITableView滑动到指定cell
                                [self.tableView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:self.currentIndex inSection:0] atScrollPosition:UITableViewScrollPositionTop animated:NO];
                            } completion:^(BOOL finished) {
                                //UITableView可以响应其他滑动手势
                                scrollView.panGestureRecognizer.enabled = YES;
                            }];
        
    });
}

```


> 这里的 `50` 实际上是你能允许滑动的最大触发区间.可以自己下载demo玩一下就知道了. 

基于滑动区间 做 加减 当前页码控制.然后 做个简单的UIView动画.

> 注意: 开始动画的时候最好不要相应pan手势,结束动画的时候再恢复回去,这样可以避免一些不必要的收拾滑动引起的问题.


### 为什么要滑动页码`self.currentIndex`

因为我们要用KVO 来实现 页面变动驱动滑动的动画

在 viewDidLoad:方法中 我们有个setupView:方法中 有下段代码

``` objc
[self addObserver:self forKeyPath:@"currentIndex" options:NSKeyValueObservingOptionInitial|NSKeyValueObservingOptionNew context:nil];
```

__是的我们要自己监听自己的成员变量去搞些事情__.

``` objc
//观察currentIndex变化
-(void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context {
    if ([keyPath isEqualToString:@"currentIndex"]) {
        //获取当前显示的cell
        AwemeListCell *cell = [self.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:_currentIndex inSection:0]];
        __weak typeof (cell) wcell = cell;
        __weak typeof (self) wself = self;
        //用cell控制相关视频播放
        
    } else {
        return [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
    }
}
```

> demo中有这段代码 其实是为了以后 cell上方palyerView的时候 控制相应暂停或者停止 或者其他操作的行为. 这里后期我们完善


### 点击状态栏滑动到顶部

我们如何监听状态栏的事件?

我们当然可以设置TableView自动滑动到顶部.但是 我们怎么拦截下来这个事件去把我们 相关页码 __置`0`__


为什么置0呢?看下 下面这张图

![](/assets/images/20181106AwemeTopBottomScrollDemo/AwemeDemo3Error.gif)

虽然我们能实现 自动滑动TableView到顶部 但是 我们拦截不到顶部状态栏点击的事件,在这个事件调用的地方 把当前页码置`0`.


#### 监听点击状态栏事件

这里使用的是在AppDelegate 中 复写 touchesBagan:方法

``` objc
- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    [super touchesBegan:touches withEvent:event];
    
    //当触摸状态栏的时候发送触摸通知 这样控制器就收到了点击事件
    CGPoint touchLocation = [[[event allTouches] anyObject] locationInView:self.window];
    CGRect statusBarFrame = [UIApplication sharedApplication].statusBarFrame;
    if (CGRectContainsPoint(statusBarFrame, touchLocation)) {
        [[NSNotificationCenter defaultCenter] postNotificationName:StatusBarTouchBeginNotification object:nil];
    }
}

```

在这里我们判断点击区域是否在状态栏范围内,是的话我们发送通知.


在我们用到TableView的VC里面注册这个通知,然后 置`0`.

``` objc
#pragma mark -
#pragma mark - event response 所有触发的事件响应 按钮、通知、分段控件等
- (void)statusBarTouchBegin {
    _currentIndex = 0; //KVO
}

```

这里我们置`0`处理.

> 这里处理的方式简单粗暴,你有更好的实现方式可以底部评论,非常感谢.


# 总结

以上是简单实现了抖音的上下滑,demo在下方, 下一期给大家演示更多细节,如果可能的话,最终搞出个视频放cell上 实现整个上下滑控制过程视频暂停 播放 停止等等,因为如果完整的实现抖音,需要很长的代码量,为了让大家一起学习,我把每个细节拆成一小节.单独写成文章讨论和学习.


[抖音上下滑Demo](https://github.com/sunyazhou13/AwemeDemo)

参考开源

[抖音个人主页](https://github.com/sshiqiao/douyin-ios-objectc)

