---
layout: post
title: 检查Cell是否滚动出屏幕之外
date: 2022-08-01 22:08 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..

---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 如何检测一个cell滑动到屏幕以外?


``` objc

//判断cell视图是否在屏幕上.不在的话停止播放
- (void)scrollViewDidScroll:(UIScrollView *)scrollView{
    if (_currentPlayIndexPath) {
        CGRect cellR = [self.tableViewrectForRowAtIndexPath:_currentPlayIndexPath];
        if(scrollView.contentOffset.y > cellR.origin.y + cellR.size.height || scrollView.contentOffset.y < cellR.origin.y - scrollView.frame.size.height){
            _currentPlayIndexPath = nil;
            //做一些 滚动出屏幕以外的逻辑代码
        }
        NSLog(@"-------:%@",NSStringFromCGPoint(scrollView.contentOffset));
    }
}

```
