---
layout: post
title: Check Whether a Cell Has Scrolled Off Screen
date: 2022-08-01 22:08 +0800
categories: [系统理论实践]
tags: [Algorithm, C++]
typora-root-url: ..
math: false
mermaid: false


---


# Preface

This article carries strong personal sentiment. If it makes you uncomfortable, please close it as soon as possible. This article is only for personal study records. Reprinting or sharing within the scope of the license is also welcome. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


## How to detect that a cell has scrolled off screen?


``` objc

//Determine whether the cell view is on screen. If not, stop playback
- (void)scrollViewDidScroll:(UIScrollView *)scrollView{
    if (_currentPlayIndexPath) {
        CGRect cellR = [self.tableViewrectForRowAtIndexPath:_currentPlayIndexPath];
        if(scrollView.contentOffset.y > cellR.origin.y + cellR.size.height || scrollView.contentOffset.y < cellR.origin.y - scrollView.frame.size.height){
            _currentPlayIndexPath = nil;
            //Do something when the cell scrolls off screen
        }
        NSLog(@"-------:%@",NSStringFromCGPoint(scrollView.contentOffset));
    }
}

```
