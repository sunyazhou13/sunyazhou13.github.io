---
layout: post
title: Detecting the Direction of a UIPanGesture
date: 2018-12-06 13:59:46
categories: [iOS, Swift]
tags: [iOS, Objective-C, Swift, skills]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

These past few days I ran into a problem: when a pan gesture is applied to a view, I couldn't distinguish its direction.

So I found the answer on StackOverflow and documented it here.

``` objc
- (void)panRecognized:(UIPanGestureRecognizer *)rec
{
    CGPoint vel = [rec velocityInView:self.view];
    if (vel.x > 0)
    {
        // user dragged towards the right
    }
    else
    {
        // user dragged towards the left
    }
}

```


[Reference](https://stackoverflow.com/questions/11777281/detecting-the-direction-of-pan-gesture-in-ios)
