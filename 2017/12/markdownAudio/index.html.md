---
layout: post
title: Markdown中插入音频文件
date: 2017-12-27 12:04:07
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
---




# 前言

喜欢在博客文章打开的时候 播放一首背景音乐, 但Markdown本身是不支持插入音频视频,带着这个疑问开始这篇文章.


## markdown插入音乐

`markdown`其实就是 一种`html`的转换语法,其实内部也同时支持直接写`html`标签, 如果不了解各种标签请点击[w3cschool](https://www.w3schools.com/tags/tag_iframe.asp)查看各种 API 的用法,此时要用到的标签为`iframe`，代码如下所示，其中

* `div`用于控制格式，若无则默认为居左
* `frameborder`用于规定是否显示框架周围的边框，1为是，0为否
* `marginwidth`及`marginheight`表示距离边缘的像素大小
* `width`及`height`表示播放条的长度和宽度
* `src`为播放链接，可以在如网易云音乐的`生成外链播放器`获取该链接，同时也获得以下代码，并可以自行更改；也可将音频链接改为视频链接，从而播放视频

> 值得注意的是，音频和视频在默认情况下是会自动循环播放的，可以修改链接的值进行修改 
在`src`域中，`auto`值表示是否自动播放，当值为`1`时为自动播放，`0`则不是
在`src`域中，有些链接会附有`height`或`width`值，其表示表示播放框的基本宽高，可以更换其值以获得想要的播放框大小，此时可以不用填写外部的`width`及`height`.

``` html
<div align=life> 
<iframe frameborder="no" marginwidth="0" marginheight="0" width=400 height=140 src="https://music.163.com/outchain/player?type=2&id=34341360&auto=0&height=66"></iframe>
</div>
```


<div align=life> 
<iframe frameborder="no" marginwidth="0" marginheight="0" width=400 height=140 src="https://music.163.com/outchain/player?type=2&id=34341360&auto=0&height=66"></iframe>
</div>


## 接口说明

这里面可以看到 用了 

``` 
https://music.163.com/outchain/player?type=2&id=34341360&auto=0&height=66
```

这个接口的`id=34341360`是从这里获取的

![](/assets/images/20171227MarkdownAudio/markdownAudio1.webp)

找到`复制链接`,然后用浏览器打开.

![](/assets/images/20171227MarkdownAudio/markdownAudio2.webp)

后边的 `id=34341360`就是我们要的 `id` 然后接口替换就可以了


更多技巧可参考以前写的一篇文章  
[markdown折叠](https://www.sunyazhou.com/2017/10/25/20171025markdownSkill/)    
[markdown 表格](https://www.sunyazhou.com/2017/09/29/20170929MarkdownTable/)

全文完
