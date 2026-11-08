---
layout: post
title: Expanding the Tap Area of a UIButton on iOS
date: 2018-09-20 09:40:06
categories: [iOS]
tags: [iOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

During development, I often encounter a `UIButton` whose tap area is too small, but I don't want to change the button's size.

Today's article shares the code that solves this problem.

# Implementation Approach

* Subclass UIButton and override its `hitTest:` method
* Subclass UIButton and override the `point:inside:withEvent:` method

## The First Approach

``` swift
override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
	let biggerButtonFrame = theButton.frame.insetBy(dx: -30, dy: -30) // 1	
	if biggerButtonFrame.contains(point) { // 2
		return theButton // 3
	}		
	return super.hitTest(point, with: event) // 4
}

```

* 1. Expand theButton's x by 30 and y by 30 (positive values shrink, negative values expand. The width and height then become 2 * 30 and 2 * 30 respectively)
* 2. Check whether the tap position is inside the expanded frame.
* 3. If so, return the button.
* 4. If not, let the event continue to propagate.

> Note: _the code doesn't check whether theButton.alpha == 0, theButton.userInterface... == YES, or whether it's visible — add those checks yourself_

## The Second Approach

Override UIView's point: method

``` swift
override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
	let biggerFrame = bounds.insetBy(dx: -30, dy: -30)

	return biggerFrame.contains(point)
}
```

The Objective-C version looks like this:

``` objc
- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event {
	//Write it here 
	
	CGRectInset(<#CGRect rect#>, <#CGFloat dx#>, <#CGFloat dy#>)
	...
}
```

However, the second approach is actually the UIView judgment made before the hitTest: method is called — it checks whether the tapped point is on this UIView.

Still, the first approach is recommended.

## Core Code

Actually, the most core code is:

CGRectInset(<#CGRect rect#>, <#CGFloat dx#>, <#CGFloat dy#>)

> CGRect CGRectOffset(CGRect rect, CGFloat dx, CGFloat dy) shrinks the rect around its center based on dx and dy.

If dx and dy are negative, it expands; if positive, it shrinks.

But you might be puzzled about how the width and height scale down or up.

First: let's clarify the meaning of this API. As long as you pass in positive values it shrinks, so the width and height are also scaled based on the dx and dy you pass in.

Because the scaling is centered, the width and height __must be multiplied by 2__ — there are two sides, after all. Shrinking the left side by 30 also requires shrinking the right side by 30, and the same goes for the top and bottom.

You can look it up on Google yourself.

Reference: Increasing the tap area of a UIButton  
[Reference: iOS touch events full guide](https://mp.weixin.qq.com/s/9rvSRt4kfpy7e87EJoaJOQ)

End of article

