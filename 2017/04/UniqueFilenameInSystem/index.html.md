---
layout: post
title: 如何在iOS/macOS系统中创建文件时创建唯一的文件名
date: 2017-04-20 16:35:42
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
---

![](/assets/images/20170420UniqueFilenameInSystem/StockPhoto.webp)

## 前言

当我无数次看到大家写代码的时候总是以一个`时间戳+arc4random()`创建某文件的时候 深感心碎,难道操作系统就没有提供相关的函数么 于是 我找到了如下代码 解决大家因为创建文件重名问题.


``` objc
/* Create a recording file */
    NSString *filePath = [@"~/Movies/AVScreenShackRecording_XXXXXX" stringByStandardizingPath];
    char *screenRecordingFileName = strdup([filePath fileSystemRepresentation]);
    if (screenRecordingFileName)
    {
        int fileDescriptor = mkstemp(screenRecordingFileName);
        if (fileDescriptor != -1)
        {
            NSString *filenameStr = [[NSFileManager defaultManager] stringWithFileSystemRepresentation:screenRecordingFileName length:strlen(screenRecordingFileName)];
            
            NSLog(@"唯一的文件名:%@",filenameStr);
            
        }
        remove(screenRecordingFileName);
        free(screenRecordingFileName);
    }
```  

使用前
![](/assets/images/20170420UniqueFilenameInSystem/before.webp)

过程中
![](/assets/images/20170420UniqueFilenameInSystem/after.webp)

完成之后
![](/assets/images/20170420UniqueFilenameInSystem/done.webp)



*__切记文件后缀需要 加上 `XXXXXX`__* 几个`X`就代表几位`数字+字母`混合 
*注意*:最好是6个X或者6个以上 [参考Linux](http://man7.org/linux/man-pages/man3/mkstemp.3.html)

主要的是要明白下面这两个函数

[strdup()用于c语言中常用的一种字符串拷贝](http://baike.baidu.com/item/strdup/5522525)

[mkstemp()函数在系统中以唯一的文件名创建一个文件并打开](http://baike.baidu.com/link?url=wFhfkOVXafm15-4vGfxEQiQynIG7BG2yYAurwzS4uHKmby2C2lfhiO2T6WAqbdc3nOP9mEOVTMaBqxOc2eZps7_JIAsIWI0p11pEIl7Vku_)


OK 希望大家有收获

全文完

