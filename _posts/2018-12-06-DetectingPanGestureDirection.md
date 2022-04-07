---
title: 探测UIPanGesture的滑动方向
categories: [ios开发]
tags: [ios]
date: 2018-12-06 13:59:46
---

# 前言

这几天遇到一个问题 就是拖动手势作用在一个view上的时候 无法区分方向

于是找到stackOverFlow上的答案 记录一下

``` objc
- (void)panRecognized:(UIPanGestureRecognizer *)rec
{
    CGPoint vel = [rec velocityInView:self.view];
    if (vel.x > 0)
    {
        // user dragged towards the right 向右拖动
    }
    else
    {
        // user dragged towards the left 向左拖动
    }
}

```


[参考](https://stackoverflow.com/questions/11777281/detecting-the-direction-of-pan-gesture-in-ios)