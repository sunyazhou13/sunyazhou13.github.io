---
layout: post
title: How to Deprecate a Method in Objective-C
date: 2017-06-16 16:40:26
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---
# Preface
![deprecated](/assets/images/20170616HowToDeprecatedAMothodInObjC/deprecated.avif)


Recently I've been working on SDK development. Sometimes you can't easily remove an API because some people are still using it. So to keep the relevant method while marking it as deprecated, I use the following code:

``` objc
__attribute__((deprecated("此方法已弃用,请使用xxxxx:方法")));
```

### Scenario 1

I want to mark a method as deprecated and suggest passing a parameter in another way.

For example, in a controller, I want to indicate that setting a URL can be done directly via the setter method.


``` objc
@interface VideoEditorViewController : UIViewController

@property(nonatomic, strong)NSURL *videoPath;

-(instancetype)initWithUrl:(NSURL *)path __attribute__((deprecated("使用setVideoPath:方法传入")));

@end
```

This way, calling it shows a warning directly, telling you that passing a URL via this method is deprecated.

![code](/assets/images/20170616HowToDeprecatedAMothodInObjC/code.avif)



For more uses of `__attribute__`, please refer to Apple's official documentation and other blogs.
I'll keep updating with more uses in the future.

End of article



[Reference](http://www.jianshu.com/p/0237c34158f0)
