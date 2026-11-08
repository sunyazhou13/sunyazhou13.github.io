---
layout: post
title: Inserting Audio Files in Markdown
date: 2017-12-27 12:04:07
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---




# Preface

I like to play a piece of background music when a blog post opens, but Markdown itself doesn't support inserting audio or video. That question prompted this article.

## Inserting Music in Markdown

`markdown` is actually a syntax for converting to `html`, and internally it also supports writing `html` tags directly. If you're not familiar with the various tags, please click [w3cschool](https://www.w3schools.com/tags/tag_iframe.asp) to see the usage of each API. The tag we need here is `iframe`, as shown in the code below, where

* `div` is used to control the format; without it, the default is left-aligned
* `frameborder` determines whether a border is shown around the frame, 1 for yes, 0 for no
* `marginwidth` and `marginheight` represent the pixel size of the distance from the edge
* `width` and `height` represent the length and width of the player bar
* `src` is the playback link, which can be obtained from the `Generate External Link Player` feature of services such as NetEase Cloud Music, which also gives you the code below and can be modified as you wish; you can also change the audio link to a video link to play videos

> Note that audio and video loop automatically by default, and you can modify the link value to change that.
> In the `src` field, the `auto` value indicates whether to autoplay; when the value is `1` it autoplays, and `0` means it doesn't.
> In the `src` field, some links carry a `height` or `width` value, which indicates the base width and height of the player frame. You can change these values to get the desired player frame size, in which case you don't need to fill in the external `width` and `height`.

``` html
<div align=life> 
<iframe frameborder="no" marginwidth="0" marginheight="0" width=400 height=140 src="https://music.163.com/outchain/player?type=2&id=34341360&auto=0&height=66"></iframe>
</div>
```


<div align=life> 
<iframe frameborder="no" marginwidth="0" marginheight="0" width=400 height=140 src="https://music.163.com/outchain/player?type=2&id=34341360&auto=0&height=66"></iframe>
</div>


## API Explanation

Here you can see that we use

``` 
https://music.163.com/outchain/player?type=2&id=34341360&auto=0&height=66
```

The `id=34341360` in this API is obtained from here:

![markdown Audio](/assets/images/20171227MarkdownAudio/markdownAudio1.avif)

Find `Copy Link`, then open it in a browser.

![markdown Audio](/assets/images/20171227MarkdownAudio/markdownAudio2.avif)

The `id=34341360` at the end is the `id` we need, and then you just replace it in the API.

For more tips, refer to an article I wrote before:
[markdown folding](https://www.sunyazhou.com/2017/10/MarkdownSkill/)    
[markdown table](https://www.sunyazhou.com/2017/09/MarkdownTable/)

End of article.
