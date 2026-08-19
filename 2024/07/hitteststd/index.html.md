---
layout: post
title: hitTest标准写法
date: 2024-07-02 08:01 +0000
categories: [iOS]
tags: [Objective-C]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# HitTest标准写法


``` objc
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    if (!self.isUserInteractionEnabled || self.isHidden || self.alpha <= 0.01)
    {
        return nil;
    }
    if ([self pointInside:point withEvent:event])
    {
        for (UIView *subview in [self.subviews reverseObjectEnumerator])
        {
            CGPoint convertedPoint = [subview convertPoint:point fromView:self];
            UIView *hitTestView = [subview hitTest:convertedPoint withEvent:event];
            if (hitTestView)
            {
                if (hitTestView.superview == self)
                {
                    // self的所有子view都不应该响应事件
                    return nil;
                }
                return hitTestView;
            }
        }
        return nil;
    }
    return nil;
}
```

# 总结

代码review出现问题记录以下,hittest的标准写法