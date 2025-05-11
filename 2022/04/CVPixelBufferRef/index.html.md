---
layout: post
title: "深入理解CVPixelBufferRef"
date: 2022-04-06 09:50:00.000000000 +08:00
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
---

![](/assets/images/20220406CVPixelBufferRef/Cover.webp)

在iOS里，我们经常能看到`CVPixelBufferRef`这个类型，在`Camera`采集返回的数据里得到一个`CMSampleBufferRef`,而每个`CMSampleBufferRef`里则包含一个`CVPixelBufferRef`,在视频硬解码的返回数据里也是一个`CVPixelBufferRef`。

顾名思义,`CVPixelBufferRef`是一种像素图片类型，由于`CV`开头，所以它是属于`CoreVideo`模块的。

iOS喜欢在对象命名前面用缩写表示它属于的模块，比如`CF`代表`CoreFoundation`,`CG`代表`CoreGraphic`，`CM`代表 `CoreMedia`。既然属于`CoreVideo`那么它就和视频处理相关了。

它是一个`C`对象，而不是`Objective-C`对象，所以它不是一个类，而是一个类似`Handle`的东西。从代码头文件的定义来看

`CVPixelBufferRef`就是用`CVBufferRef` `typedef`而来的，而`CVBufferRef`本质上就是一个`void *`，至于这个`void *`具体指向什么数据只有系统才知道了。

所以我们看到 所有对`CVPixelBufferRef`进行操作的函数都是纯`C`函数，这很符合iOS `CoreXXXX`系列`API` 的风格。

比如`CVPixelBufferGetWidth`,`CVPixelBufferGetBytesPerRow`

通过API可以看出来，`CVPixelBufferRef`里包含很多图片相关属性，比较重要的有`width`，`height`，`PixelFormatType`等。

由于可以有不同的`PixelFormatType`，说明他可以支持多种位图格式，除了常见的`RGB32`以外，还可以支持比如`kCVPixelFormatType_420YpCbCr8BiPlanarFullRange`，这种`YUV`多平面的数据格式，这个类型里 `BiPlanar`表示双平面，说明它是一个`NV12`的`YUV`，包含一个Y平面和一个UV平面。通过`CVPixelBufferGetBaseAddressOfPlane`可以得到每个平面的数据指针。在得到`Address`之前需要调用`CVPixelBufferLockBaseAddress`，这说明`CVPixelBufferRef`的内部存储不仅是内存也可能是其它外部存储，比如现存，所以在访问前要`lock`下来实现地址映射，同时`lock`也保证了没有读写冲突。

由于是C对象，它是不受 ARC 管理的，就是说要开发者自己来管理引用计数，控制对象的生命周期，可以用`CVPixelBufferRetain`，`CVPixelBufferRelease`函数用来加减引用计数，其实和`CFRetain`和`CFRelease`是等效的，所以可以用`CFGetRetainCount`来查看当前引用计数。

如果要显示`CVPixelBufferRef`里的内容，通常有以下几个思路。

把`CVPixelBufferRef`转换成`UIImage`，就可以直接赋值给`UIImageView`的`image`属性，显示在UIImageView上，示例代码

``` objc
+ (UIImage*)uiImageFromPixelBuffer:(CVPixelBufferRef)p {
    CIImage* ciImage = [CIImage imageWithCVPixelBuffer:p];
    CIContext* context = [CIContext contextWithOptions:@{kCIContextUseSoftwareRenderer : @(YES)}];
    CGRect rect = CGRectMake(0, 0, CVPixelBufferGetWidth(p), CVPixelBufferGetHeight(p));
    CGImageRef videoImage = [context createCGImage:ciImage fromRect:rect];
    UIImage* image = [UIImage imageWithCGImage:videoImage];
    CGImageRelease(videoImage);
    return image;
}
```

从代码可以看出来，这个转换有点复杂，中间经历了多个步骤，所以性能是很差的，只适合偶尔转换一张图片，用于调试截图等，用于显示视频肯定是不行的。

另一个思路是用OpenGL来渲染，`CVPixelBufferRef`是可以转换成一个`openGL texture`的，方法如下：

``` c
CVOpenGLESTextureRef pixelBufferTexture;
CVOpenGLESTextureCacheCreateTextureFromImage(kCFAllocatorDefault,
                                             _textureCache,
                                             pixelBuffer,
                                             NULL,
                                             GL_TEXTURE_2D,
                                             GL_RGBA,
                                             width,
                                             height,
                                             GL_BGRA,
                                             GL_UNSIGNED_BYTE,
                                             0,
                                             &pixelBufferTexture);
```

其中，`_textureCache`代表一个`Texture`缓存，每次生产的`Texture`都是从缓存获取的，这样可以省掉反复创建`Texture`的开销，`_textureCache`要实现创建好，创建方法如下

``` c
CVOpenGLESTextureCacheCreate(kCFAllocatorDefault, NULL, _context, NULL, &_textureCache);
```

其中`_context`是`openGL`的 `context`，在`iOS`里就是 `EAGLContext *`

`pixelBufferTexture`还不是`openGL`的`Texture`，调用`CVOpenGLESTextureGetName`才能获得在`openGL`可以使用的`Texture ID`。

当获得了 `Texture ID`后就可以用`openGL`来绘制了，这里推荐用 `GLKView`来做绘制

``` c
glUseProgram(_shaderProgram);
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, textureId);
glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glDrawArrays(GL_TRIANGLE_FAN, 0, 4);
```

当然这不是全部代码，完整的绘制`openGL`代码还有很多，`openGL`是著名的啰嗦冗长，还有`openGL` `Context`创建`shader`编译`DataBuffer`加载等。

本质上这段代码是为了把`Texture`的内容绘制到 `openGL的frame buffer`里，然后再把`frame buffer`贴到 `CAEAGLayer`。

这个从`CVPixelBufferRef`获取的`texture`，和原来的`CVPixelBufferRef`对象共享同一个存储，就是说如果改变了`Texture`的内容，那么`CVPixelBufferRef`的内容也会改变。利用这一点我们就可可以用`openGL`的绘制方法向`CVPixelBufferRef`对象输出内容了。比如可以给`CVPixelBufferRef`的内容加图形特效打水印等。

除了从系统API里获得`CVPixelBufferRef`外，我们也可以自己创建`CVPixelBufferRef`

``` objc
+(CVPixelBufferRef)createPixelBufferWithSize:(CGSize)size {
    const void *keys[] = {
        kCVPixelBufferOpenGLESCompatibilityKey,
        kCVPixelBufferIOSurfacePropertiesKey,
    };
    const void *values[] = {
        (__bridge const void *)([NSNumber numberWithBool:YES]),
        (__bridge const void *)([NSDictionary dictionary])
    };
    
    OSType bufferPixelFormat = kCVPixelFormatType_32BGRA;
    
    CFDictionaryRef optionsDictionary = CFDictionaryCreate(NULL, keys, values, 2, NULL, NULL);
    
    CVPixelBufferRef pixelBuffer = NULL;
    CVPixelBufferCreate(kCFAllocatorDefault,
                        size.width,
                        size.height,
                        bufferPixelFormat,
                        optionsDictionary,
                        &pixelBuffer);
    
    CFRelease(optionsDictionary);
    
    return pixelBuffer;
}
```

创建一个`BGRA`格式的`PixelBuffer`，注意`kCVPixelBufferOpenGLESCompatibilityKey`和`kCVPixelBufferIOSurfacePropertiesKey`这两个属性，这是为了实现和`openGL`兼容，另外有些地方要求`CVPixelBufferRef`必须是`IO Surface`。

`CVPixelBufferRef`是iOS视频采集处理编码流程的重要中间数据媒介和纽带，理解`CVPixelBufferRef有助于写出高性能可靠的视频处理。

要进一步理解`CVPixelBufferRef`还需要学习`YUV`，`color range`，`openGL`等知识。

引用自[深入理解CVPixelBufferRef](https://zhuanlan.zhihu.com/p/24762605?utm_source=ZHShareTargetIDMore&utm_medium=social&utm_oi=28280635785216)

