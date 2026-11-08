---
layout: post
title: "How to Create Unique Filenames When Creating Files in iOS/macOS"
date: 2017-04-20 16:35:42
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

![Stock Photo](/assets/images/20170420UniqueFilenameInSystem/StockPhoto.avif)

## Preface

Having seen countless times how people always create files using a `timestamp + arc4random()`, I felt deeply frustrated. Doesn't the operating system provide a relevant function? So I found the following code to deal with filename conflicts when creating files.

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

Before use
![before](/assets/images/20170420UniqueFilenameInSystem/before.avif)

During the process
![after](/assets/images/20170420UniqueFilenameInSystem/after.avif)

After completion
![done](/assets/images/20170420UniqueFilenameInSystem/done.avif)

*__Remember that the file suffix needs to include `XXXXXX`__* — each `X` represents one character of `digits + letters`
*Note*: It's best to use 6 X's or more. [See Linux reference](http://man7.org/linux/man-pages/man3/mkstemp.3.html)

The key is to understand the following two functions:

[strdup() is a commonly used string copy function in C](http://baike.baidu.com/item/strdup/5522525)

mkstemp() creates and opens a file with a unique filename in the system

OK, hope this helps

End of article

