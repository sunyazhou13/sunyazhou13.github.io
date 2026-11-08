---
layout: post
title: The Standard Way to Write hitTest
date: 2024-07-02 08:01 +0000
categories: [iOS]
tags: [Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This article carries strong personal feelings. If you feel uncomfortable reading it, please close it as soon as possible. This article is only for personal learning records. Reposting or sharing within the scope of the license is welcome. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you think this site can help you, you can subscribe to this site via RSS. Thanks for your support!

# The Standard Way to Write HitTest


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
                    // None of self's subviews should respond to events
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

# Summary

Noting a problem that came up in code review — this is the standard way to write hitTest.
