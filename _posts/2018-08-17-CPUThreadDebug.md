---
title: iOS中CPU线程调试高级技巧
categories: [ios开发]
tags: [ios, macos]
date: 2018-08-17 17:19:23
---


# 前言 

最近在开发直播,发现CPU性能被打满后导致CPU降频,发热严重,然后卡顿...

为了定位这个问题我们花费了至少 3天的时间 一点一点跟踪CPU的线程代码,当遇到C++的thread的时候没有符号表,只能看见一坨对象地址,除此以外连个方法名都没有的时候真是手足无措.本篇介绍一个高级调试 方法,使用符号表和相关 指令寻踪 相关代码调用,写的不好 大佬们请轻喷.代码相关过程感谢同事 陈豪的大力支持.


# Talk is cheap show me the code

我们的实现思路是找到动态库的首地址调用从此入手用相关指令恢复


### 前期准备

* build setting中开启符号表

![](/assets/images/20180817CPUThreadDebug/enableDysm.png)




## 1.导入头文件


``` objc
#import <mach-o/dyld.h>
```

这是mac os的可执行文件的动态链接库头文件 内部内建函数有几个我们需要用到

## 2.复制下面代码到你的相关调用的地方

``` objc
//1
uint32_t count = _dyld_image_count();
DDLogInfo(@"Dyld image count %d", count);
//2
for (int i = 0; i < count; i++) {
    char *image_name = (char *)_dyld_get_image_name(i);
    //3
    const struct mach_header *mh = _dyld_get_image_header(i);
    intptr_t vmaddr_slide = _dyld_get_image_vmaddr_slide(i);
    //4
    NSLog(@"Image name %s at address 0x%llx and ASLR slide 0x%lx.\n",
              image_name, (mach_vm_address_t)mh, vmaddr_slide);
}

```

我解释一下以上代码  

* 1.拿出当前镜像数量  
* 2.遍历镜像  
* 3.获取镜像首地址  
* 4.打印  

然后运行你的程序

然后看下控制台 过滤一下 ASLR我们log中的键入内容

![](/assets/images/20180817CPUThreadDebug/consoloDebug.png)


然后 点击 工程中的Product 

![](/assets/images/20180817CPUThreadDebug/products.png)

右键 show in finder

![](/assets/images/20180817CPUThreadDebug/productDir.png)

下一步骤 打开终端 cd 到这这个目录(可以打开终端 输入 cd 空格 拖拽那个文件夹)

![](/assets/images/20180817CPUThreadDebug/dirFinal.png)

然后 `pwd`一下 看看


## 3.控制台搜索相关我们打印log的代码

找到我们第一条首地址

![](/assets/images/20180817CPUThreadDebug/importent.png)

> 注意:__这一步非常重要 如果不好使,请重试几次.__

#### 拿出main函数的首地址 ASLR中搜搜的 首地址然后复制 __回到终端中输入__

``` sh
atos -arch arm64 -o com_kwai_gif.app.dSYM/Contents/Resources/DWARF/com_kwai_gif -l  0x1006b8000
```

> 注意:__这里是符号表路径__,如果不知道在哪里找到请google一下.

我们来测试一下 好不好使

首先在控制台顶部的面板点击

![](/assets/images/20180817CPUThreadDebug/breakpoint1.png)


然后 在 consolo中输入 `bt` 

![](/assets/images/20180817CPUThreadDebug/main.png)



如果看到 如下内容说明已经成功.

![](/assets/images/20180817CPUThreadDebug/mainResult.png)

## 4.真机运行 找出未知线程

首先点击Xcode工程中的Profile运行`instruments`,我这里是运行工程之后 Xcode9.4可以无缝转换到`instruments`

![](/assets/images/20180817CPUThreadDebug/instruments0.png)

我们找到相关线程 没有名称也不知道对象叫什么 就一个十六进制地址

![](/assets/images/20180817CPUThreadDebug/instruments2.png)

我们随便找个地址 在终端中输入 

![](/assets/images/20180817CPUThreadDebug/instruments3.png)


好了 如果有问题 请删除product和符号表重新编译

# 总结

CPU调试的过程非常麻烦,而且中间过程的代码多数都是C++的调用,主要是线程消耗的开销,中有很多收获希望大家多多指教.

全文完








