---
layout: post
title: 博客的图片资源优化
date: 2023-02-05 17:09 +0800
categories: [系统理论实践]
tags: [Linux, shell]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 背景

最近周末有点时间,对博客的资源图片进行了整体优化,优化后图片资源减少了一半.要不然以目前我写文章的速度,不出几年连同资源很快就会超过1G.如果超过1G的话github pages将停止对仓库提供支持,需要额外购买仓库空间.

前一阵偶然发现自己的博客图片太多了运行起来慢 加载也慢,资源文件优化减负逐渐成为迫在眉睫的焦虑任务.

然后尝试一下webp图片和png对比发现,简直就是降维打击,通用的图片,在webp下27k,在png下80k+,这完全就是几何倍数的优化.再回头看看画质,虽然色彩没有之前鲜艳了不过也不是一些重要的图片,没有必要搞得那么高清.于是萌生优化博客资源的想法.

想法有了 可是面对的是自己写了好多年的资源 难不成要挨个替换吗？

作为NB的工程师必须得用脚本把所有的图片进行批处理,全部转成 webp

于是我使用 brew 安装了 libwebp的库

``` sh
brew install jpeg-turbo
brew install libpng
brew install libtiff
brew install webp
```

经过一顿操作终于安装好了 webp命令

如果把其他图片转webp 应该使用`cwebp`命令(codec 编码),反之`dwebp`就是decodec解码

工具完成后开始整活

`touch` 一个`webp.sh`

遍历所有资源目录 然后执行转码操作,转完后.顺便把之前的`png`,`jpg`等通通删除掉.

``` sh
#!/bin/sh

for dir in `ls .` 
do   
    if [ -d $dir ]   
    then     
        echo $dir     
        cd $dir     
            `for file in *.png *.jp*g *.PNG ; do cwebp -q 80 "$file" -o "${file%.*}.webp"; done`
            rm -rf *.png *.jp*g 
        cd ..   
    fi
done

#读取第一个参数
read_dir $1

#for file in *.png *.jp*g *.PNG ; do cwebp -q 80 "$file" -o "${file%.*}.webp"; done

```

这个脚本放到`/assets/images`目录执行

![](/assets/images/20230205WebpEnhancement/webp1.webp)

剩下的工作就是找到左右post文章的markdown统一更改图片后缀

![](/assets/images/20230205WebpEnhancement/webp2.webp)

然后通过sourceTree进行最后的校对 review一遍改动防止改错,这个过程很快,虽然很多 但是图片的后缀修改十分简单容易识别.
![](/assets/images/20230205WebpEnhancement/webp3.webp)

最后build博客 部署到远端即可

# 总结

就目前这个案例,手动改肯定是十分累并且全是体力活,一定要学会驾驭技术,用技术去解决实际问题.