---
layout: post
title: "Understanding CVPixelBufferRef in Depth"
date: 2022-04-06 09:50:00.000000000 +08:00
categories: [iOS, Swift]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
math: false
mermaid: false

---

![Cover](/assets/images/20220406CVPixelBufferRef/Cover.avif)

In iOS, we often see the `CVPixelBufferRef` type. From the data returned by `Camera` capture, we get a `CMSampleBufferRef`, and each `CMSampleBufferRef` contains a `CVPixelBufferRef`. The data returned by hardware video decoding is also a `CVPixelBufferRef`.

As the name suggests, `CVPixelBufferRef` is a pixel image type. Since it starts with `CV`, it belongs to the `CoreVideo` module.

iOS likes to prefix object names with abbreviations indicating which module they belong to. For example, `CF` stands for `CoreFoundation`, `CG` stands for `CoreGraphic`, and `CM` stands for `CoreMedia`. Since it belongs to `CoreVideo`, it's related to video processing.

It's a `C` object rather than an `Objective-C` object, so it's not a class but something like a `Handle`. Looking at its definition in the header file,

`CVPixelBufferRef` is `typedef`'d from `CVBufferRef`, and `CVBufferRef` is essentially a `void *`. As for what this `void *` actually points to, only the system knows.

So we can see that all functions that operate on `CVPixelBufferRef` are pure `C` functions, which is very much in line with the style of the iOS `CoreXXXX` series `API`s.

For example, `CVPixelBufferGetWidth`, `CVPixelBufferGetBytesPerRow`.

As can be seen from the API, `CVPixelBufferRef` contains many image-related properties, the most important of which are `width`, `height`, `PixelFormatType`, etc.

Since it can have different `PixelFormatType`s, it supports multiple bitmap formats. Besides the common `RGB32`, it can also support formats like `kCVPixelFormatType_420YpCbCr8BiPlanarFullRange`, a multi-plane `YUV` data format. In this type, `BiPlanar` means two planes, indicating it's an `NV12` `YUV`, containing one Y plane and one UV plane. Through `CVPixelBufferGetBaseAddressOfPlane`, you can get the data pointer of each plane. Before getting the `Address`, you need to call `CVPixelBufferLockBaseAddress`. This means the internal storage of `CVPixelBufferRef` isn't only in memory but may also be external storage, such as video memory, so you need to `lock` it before access to implement address mapping. The `lock` also ensures there are no read/write conflicts.

Since it's a C object, it isn't managed by ARC, meaning developers must manage the reference count themselves and control the object's lifecycle. You can use the `CVPixelBufferRetain` and `CVPixelBufferRelease` functions to increment and decrement the reference count, which are actually equivalent to `CFRetain` and `CFRelease`. So you can use `CFGetRetainCount` to check the current reference count.

To display the content of a `CVPixelBufferRef`, there are usually several approaches.

Convert the `CVPixelBufferRef` to a `UIImage`, and then you can directly assign it to a `UIImageView`'s `image` property to display it on the UIImageView. Sample code:

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

As can be seen from the code, this conversion is a bit complex and goes through multiple steps, so performance is very poor. It's only suitable for occasionally converting an image, such as for debug screenshots. It definitely can't be used to display video.

Another approach is to render with OpenGL. `CVPixelBufferRef` can be converted into an `openGL texture` like this:

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

Here, `_textureCache` represents a `Texture` cache. Each `Texture` produced is obtained from the cache, which avoids the overhead of repeatedly creating `Texture`s. `_textureCache` must be created in advance; here's how:

``` c
CVOpenGLESTextureCacheCreate(kCFAllocatorDefault, NULL, _context, NULL, &_textureCache);
```

Here `_context` is the `openGL` `context`, which in `iOS` is `EAGLContext *`.

`pixelBufferTexture` isn't yet an `openGL` `Texture`. Only by calling `CVOpenGLESTextureGetName` can you get the `Texture ID` usable in `openGL`.

Once you have the `Texture ID`, you can draw with `openGL`. Here I recommend using `GLKView` for drawing.

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

Of course, this isn't all the code. There's much more to the complete `openGL` drawing code. `openGL` is famously verbose and tedious — there's also the `openGL` `Context` creation, `shader` compilation, `DataBuffer` loading, and more.

Essentially, this code draws the content of the `Texture` into the `openGL`'s frame buffer, and then attaches the frame buffer to a `CAEAGLayer`.

This `texture` obtained from `CVPixelBufferRef` shares the same storage as the original `CVPixelBufferRef` object. That is, if you change the content of the `Texture`, the content of the `CVPixelBufferRef` also changes. Taking advantage of this, we can use `openGL`'s drawing methods to output content to the `CVPixelBufferRef` object. For example, you can add graphic effects like watermarks to the content of a `CVPixelBufferRef`.

Besides obtaining `CVPixelBufferRef` from system APIs, we can also create our own `CVPixelBufferRef`.

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

This creates a `PixelBuffer` in `BGRA` format. Note the two properties `kCVPixelBufferOpenGLESCompatibilityKey` and `kCVPixelBufferIOSurfacePropertiesKey` — they're used to achieve `openGL` compatibility. In addition, some places require that the `CVPixelBufferRef` be an `IO Surface`.

`CVPixelBufferRef` is an important intermediate data medium and link in the iOS video capture, processing, and encoding pipeline. Understanding `CVPixelBufferRef` helps you write high-performance, reliable video processing code.

To further understand `CVPixelBufferRef`, you also need to learn about `YUV`, `color range`, `openGL`, and other knowledge.

Referenced from [Understanding CVPixelBufferRef in Depth](https://zhuanlan.zhihu.com/p/24762605?utm_source=ZHShareTargetIDMore&utm_medium=social&utm_oi=28280635785216)
