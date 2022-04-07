---
title: iOS键盘动画细节
categories: [ios开发]
tags: [ios, macos]
date: 2018-09-18 09:49:58
---


![](/assets/images/20180918KeyboardAnimation/keyboard1.png)


# 前言

很久没写技术文章里,本篇记录了一下一个键盘弹出的小细节动画,像微信一样流程


上图

![](/assets/images/20180918KeyboardAnimation/keyboardAnimation.gif)



# 动画细节代码


细节核心主要是通知中的一些key

* 动画时长
* 动画的出现方式

...

下面的通知是接收 键盘将要出现的通知`UIKeyboardWillShowNotification`



``` objc
[[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveKeyboardShowNotification:)
                                                 name:UIKeyboardWillShowNotification
                                               object:nil];
```

然后是实现的核心代码

``` objc
- (void)didReceiveKeyboardShowNotification:(NSNotification *)noti {
    NSDictionary *userInfo = noti.userInfo;
    NSTimeInterval animationDuration;
    UIViewAnimationCurve animationCurve;
    CGRect keyboardFrame;
    [[userInfo objectForKey:UIKeyboardAnimationCurveUserInfoKey] getValue:&animationCurve];
    [[userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey] getValue:&animationDuration];
    [[userInfo objectForKey:UIKeyboardFrameEndUserInfoKey] getValue:&keyboardFrame];
    
    UIViewAnimationOptions animationOptions = animationCurve << 16;
    
    self.bottomConstrains.offset = -CGRectGetHeight(keyboardFrame);
    [UIView animateWithDuration:animationDuration delay:0. options:animationOptions animations:^{
        [self.view setNeedsUpdateConstraints];
        [self.view layoutIfNeeded];
    } completion:^(BOOL finished) {
        
    }];
}
```

> self.bottomConstrains.offset = -CGRectGetHeight(keyboardFrame); 是我写的约束 详细请参考demo


键盘消失也是一样的 `UIKeyboardWillHideNotification` 接收这个key

``` objc
[[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveKeyboardHideNotification:)
                                                 name:UIKeyboardWillHideNotification
                                               object:nil];
```


消失的时候 把约束偏移量设置`0`即可

``` objc
- (void)didReceiveKeyboardHideNotification:(NSNotification *)noti {
    NSDictionary *userInfo = noti.userInfo;
    NSTimeInterval animationDuration;
    UIViewAnimationCurve animationCurve;
    CGRect keyboardFrame;
    [[userInfo objectForKey:UIKeyboardAnimationCurveUserInfoKey] getValue:&animationCurve];
    [[userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey] getValue:&animationDuration];
    [[userInfo objectForKey:UIKeyboardFrameEndUserInfoKey] getValue:&keyboardFrame];
    
    UIViewAnimationOptions animationOptions = animationCurve << 16;
    self.bottomConstrains.offset = 0;
    [UIView animateWithDuration:animationDuration delay:0. options:animationOptions animations:^{
        [self.view setNeedsUpdateConstraints];
        [self.view layoutIfNeeded];
    } completion:^(BOOL finished) {
        
    }];
}
```

> self.bottomConstrains.offset = 0; //设置偏移量会原来位置



利用Masonry做的动画


最后 别忘记移除通知


``` objc
- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}
```


# 总结


键盘弹出这个微小的细节 很容易被大家忽视,写这篇文章是为了记录知识和技巧,希望各位多多指教


[Demo点击这里下载](https://github.com/sunyazhou13/KeyboardAnimation)

全文完


