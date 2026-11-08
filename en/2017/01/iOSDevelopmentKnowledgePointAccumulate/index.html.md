---
layout: post
title: iOS Development Knowledge Accumulation
date: 2017-01-18 13:44:57
categories: [iOS]
tags: [iOS, macOS, Objective-C, 音视频]
typora-root-url: ..
math: false
mermaid: false

---

> I've been working on iOS development for a long time. In the past, I used my brain to memorize technical articles and the code of technical implementations. But when a person's brain exceeds a certain storage limit, stack overflow occurs (actually, I'm just not that smart). Later, I gradually started to remember which blog was written by whom, or the code of how a technique was implemented... But then I found that not only was the stack overflowing, the heap could barely hold the vast number of iOS technical articles anymore... Sigh. So I kept all the classic article bookmarks and browser URLs in my Chrome. Now I want to organize them and put them in my blog, to make it easy to look up the code of a certain technical implementation (in fact, even my former intern colleagues at Baidu Cloud were amazed at how I could store a certain technique in such detail). OK, let's start the iOS knowledge point technical navigation.

Here are the iOS technical categories:

* Audio
* Camera & Photos
* Graphics & Images
* Animation
* UI Transitions
* ASDK (AsyncDisplayKit)
* Swift-related
* Math & Graphics
* Architecture
* Masonry
* CocoaPods
* File-related

Audio
--

__[iOS Audio Playback (1): Overview](http://msching.github.io/blog/2014/07/07/audio-in-ios/)__  
__[iOS Audio Playback (2): AudioSession](http://msching.github.io/blog/2014/07/08/audio-in-ios-2/)__  
__[iOS Audio Playback (3): AudioFileStream](http://msching.github.io/blog/2014/07/09/audio-in-ios-3/)__  
__[iOS Audio Playback (4): AudioFile](http://msching.github.io/blog/2014/07/19/audio-in-ios-4/)__  
__[iOS Audio Playback (5): AudioQueue](http://msching.github.io/blog/2014/08/02/audio-in-ios-5/)__  
__[iOS Audio Playback (6): Implementation of a Simple Audio Player](http://msching.github.io/blog/2014/08/09/audio-in-ios-6/)__  
__[iOS Audio Playback (7): Playing Songs from the iPod Library](http://msching.github.io/blog/2014/09/07/audio-in-ios-7/)__  
__[iOS Audio Playback (8): NowPlayingCenter and RemoteControl](http://msching.github.io/blog/2014/11/06/audio-in-ios-8/)__  
__[iOS Audio Playback (9): Play While Caching](http://msching.github.io/blog/2016/05/24/audio-in-ios-9/)__

> The above content comes from [码农人生](http://msching.github.io/). I've had exchanges with this guy; his knowledge of low-level audio technology is quite thorough, suitable for beginners and intermediate developers to study, learn, and use.

Graphics Processing
--

__[Basics](https://objccn.io/issue-21-1/)__ a series of tutorials that can be read straight through  
__[GPUImage](https://github.com/BradLarson/GPUImage)__ library   
__[iOS GPUImage Source Code Analysis (1)](http://mp.weixin.qq.com/s/pg2vPYftkfghoQswxJFIvw)__
__Open-Sourcing a Camera App Published on the App Store__

Graphics & Images
--
__Face Recognition Based on OpenCV__  
__[Image Editing](https://github.com/3tinkers/TKImageView)__

Animation
--

__Analysis of the Draggable Unread Bubble Dismissal in QQ__  
__iOS Custom Pull-Down Line Animation__  
__[A Library Covering All iOS Animation Effects](https://github.com/sunyazhou13/Animations)__
__[pop](https://github.com/facebook/pop)__

> To learn animation, the most reliable way is to start with the animation posts of [骑滔(Kitten)](http://kittenyang.com/)  
> Those are the general animation posts, 2 of which are from Kitten  
> Continually updated

Transition Animation
--

__WWDC 2013 Session Notes - ViewController Transitions in iOS 7__ This post by 喵神 is a must-read

__[UIPresentationController Tutorial: Getting Started](https://www.raywenderlich.com/139277/uipresentationcontroller-tutorial-getting-started)__ requires a VPN (翻墙)  
*(By the way, let me explain the term "翻墙" (climbing the wall). The formal term for it is 科学上网 (scientific internet access); in slang it's called 自备梯子 (bring your own ladder), because at first everyone used 云梯VPN to access foreign websites. Our country set up a huge local-area network behind a crappy firewall. Although it has hindered the development of world civilization and technology, it also blocks some unhealthy content — for instance, what if one day you build a lathe and make a submachine gun, haha. So getting over that firewall is commonly known as "翻墙" (wall climbing).)*

__[Custom View Controller Transition Animation and a Small Pull-Down Menu Demo | AppCoda Translation Series](http://wxgbridgeq.github.io/blog/2015/08/10/custom-transition-animation/)__

> You can also search GitHub for __[Transition](https://github.com/search?l=Objective-C&o=desc&q=Transition&s=stars&type=Repositories&utf8=%E2%9C%93)__  
> There are many such transition animations; I won't introduce them one by one.

ASDK (AsyncDisplayKit)
--

__[Official Documentation](http://asyncdisplaykit.org/)__ (requires a VPN)  
__Chinese Translation__  
__[AsyncDisplayKit 2.0 Tutorial: Getting Started](https://www.raywenderlich.com/124311/asyncdisplaykit-2-0-tutorial-getting-started)__  
__[AsyncDisplayKit 2.0 Tutorial: Automatic Layout](https://www.raywenderlich.com/124696/asyncdisplaykit-2-0-tutorial-automatic-layout)__  
__Translation of the Official AsyncDisplayKit Documentation__  
__AsyncDisplayKit Source Code Analysis (1): Outline__  
__AsyncDisplayKit Source Code Analysis (2): Asynchronous Rendering__  
__[Performance Tuning with ASDK - Improving the Rendering Performance of iOS UIs](http://draveness.me/asdk-rendering/)__

> The posts above come from __[raywenderlich](https://www.raywenderlich.com/)__  
> The source code analyses come from __折腾范儿の味精
>__, the blog of a colleague from the Baidu Read team  
> Here I want to share my views on ASDK. I've tried to read the source code and the official documentation, and I found that this is not something you can just start using right away. It's almost like having a beginner learn **UIKit** all over again — integration is quite simple, but just the layout system alone is enough for a developer to study for a while, and you can't use Masonry with it. However, for a page with simple functionality that needs performance tuning, it's worth considering.

Swift-related
--
__[喵神's website](http://swifter.tips/)__ It seems to have stopped updating. In the iOS development field, 喵神 is truly a god-like presence.  
__[Swift Random Numbers](http://southpeak.github.io/2015/09/26/ios-techset-5/)__ from __[南峰子 老驴](http://southpeak.github.io/)__, a former Baidu colleague who now works at JD Finance, I believe. I've had technical exchanges with him; a really impressive guy.  
__[A Must-Read for Swift 3: Understanding the New GCD API Through Use Cases](http://www.jianshu.com/p/fc78dab5736f)__ I haven't gotten to know this guy, but many of his articles are well written. Hope to have a chance to exchange ideas in the future.

> Continually updating...

Math & Graphics
--
__[Mathematics for Graphics](https://jackschaedler.github.io/)__ e.g., Fourier transform

Architecture
--
__[Casa's Blog](http://casatwy.com/)__

> I have to comment on this Casa guy. He's the only iOS architect I truly admire. In my words, this is what a real architect in a programmer's mind looks like, not those so-called architects who merely sound impressive. When I worked at Baidu Cloud (the one you see as Baidu Netdisk), there was a T8 architect sitting right across from me. That architect was so idle every day that I really wanted to kick his ass. He modified the iOS program without even removing the xib references, which eventually caused a crash in production. I actually really want to give him a piece of advice: no matter how awesome your skills are, you should keep writing code every day. Remember the words of Confucius: 『吾尝终日而思矣，不如须臾之所学也』(I once spent all day pondering, but it wasn't as good as a moment of learning).  
> This Casa guy showed me what an architecture engineer and a business engineer are. He's someone who can truly write architecture code and then throw it to the business engineers, saying: follow this approach.

Masonry
--
__[Interesting AutoLayout Examples - Implemented with Masonry](http://tutuge.me/2015/05/23/autolayout-example-with-masonry/)__  
__[Interesting AutoLayout Examples 2 - Implemented with Masonry](http://tutuge.me/2015/08/08/autolayout-example-with-masonry2/)__ 
__[Interesting AutoLayout Examples 3 - Implemented with Masonry](http://tutuge.me/2015/12/14/autolayout-example-with-masonry3/)__ 
__[Interesting AutoLayout Examples 4 - Implemented with Masonry](http://tutuge.me/2016/08/06/autolayout-example-with-masonry4/)__  
__[Interesting AutoLayout Examples 5 - Implemented with Masonry](http://tutuge.me/2017/03/12/autolayout-example-with-masonry5/)__  

__[iOS Auto Layout Framework - Masonry in Detail](http://www.jianshu.com/p/ea74b230c70d)__  
__Masonry — Using Pure Code for Adaptive Auto Layout in iOS Apps__ Chinese translation

> By the way, I personally think that to learn Masonry, you only need to read the Chinese translation first and then go through 土土哥's (Brother Tutu's) tutorial, and you'll get it. 土土哥's Masonry tutorial is basically the Chinese documentation. Very well written.

CocoaPods
--

__[Using CocoaPods for Dependency Management in iOS Programs](http://blog.devtang.com/2014/05/25/use-cocoapod-to-manage-ios-lib-dependency/)__ A must-read article by 巧神

File-related
--

__[File List](https://github.com/sunyazhou13/FileExplorer)__  
__[HYFileManager](https://github.com/sunyazhou13/HYFileManager)__  

Blog List
--

| Blog URL                                     | RSS URL                                    |
| ---------------------------------------- | :--------------------------------------- |
| [OneV's Den](http://onevcat.com)         | <http://onevcat.com/atom.xml>            |
| 破船之家         | <>      |
| NSHipster         | <>           |
| Limboy 无网不剩 | <>       |
| [唐巧的技术博客](http://blog.devtang.com)       | <http://blog.devtang.com/atom.xml>       |
| [Lex iOS notes](http://ios.lextang.com)  | <http://ios.lextang.com/rss>             |
| [念茜的博客](http://nianxi.net)               | <http://nianxi.net/feed.xml>             |
| Xcode Dev      | <>        |
| Ted's Homepage    | <>                |
| txx's blog        | <>           |
| KEVIN BLOG          | <>                  |
| [阿毛的蛋疼地](http://www.xiangwangfeng.com)   | <http://www.xiangwangfeng.com/atom.xml>  |
| [亚庆的 Blog](http://billwang1990.github.io) | <http://billwang1990.github.io/atom.xml> |
| Nonomori   | <>        |
| 言无不尽                | <>             |
| [Wonderffee's Blog](http://wonderffee.github.io) | <http://wonderffee.github.io/atom.xml>   |
| [I'm TualatriX](http://imtx.me)          | <http://imtx.me/feed/latest/>            |
| [vclwei](http://vclwei.com)              | <>            |
| Cocoabit     | <>      |
| nixzhu on scriptogr.am | <>                  |
| [不会开机的男孩](http://studentdeng.github.io)  | <http://studentdeng.github.io/atom.xml>  |
| Nico       | <>     |
| [阿峰的技术窝窝](http://hufeng825.github.io)    | <>    |
| answer_huang | <> |
| webfrogs           | <>               |
| 代码手工艺人              | <>             |
| [Lancy's Blog](http://gracelancy.com)    | <http://gracelancy.com/atom.xml>         |
| I'm Allen      | <>        |
| Travis' Blog           | <>                     |
| [王中周的技术博客](http://wangzz.github.io/)     | <>       |
| [会写代码的猪](http://jiajun.org/)             | <>          |
| [克伟的博客](http://wangkewei.cnblogs.com/)   | <http://feed.cnblogs.com/blog/u/23857/rss> |
| [摇滚诗人](http://cnblogs.com/biosli)        | <http://feed.cnblogs.com/blog/u/35410/rss> |
| [Luke's Homepage](http://geeklu.com/)    | <http://geeklu.com/feed/>                |
| [萧宸宇](http://iiiyu.com/)                 | <http://iiiyu.com/atom.xml>              |
| [Yuan博客](http://www.heyuan110.com/)      | <http://www.heyuan110.com/?feed=rss2>    |
| Shining IO      | <>          |
| [YIFEIYANG--易飞扬的博客](http://www.yifeiyang.net/) | <http://www.yifeiyang.net/feed>          |
| KooFrank's Blog  | <>                |
| hello it works | <>           |
| [码农人生](http://msching.github.io/)        | <http://msching.github.io/atom.xml>      |
| [玉令天下的Blog](http://yulingtianxia.com)    | <http://yulingtianxia.com/atom.xml>      |
| [不掏蜂窝的熊](http://www.hotobear.com/)       | <http://www.hotobear.com/?feed=rss2>     |
| [猫·仁波切](https://andelf.github.io/)       | <>      |
| 煲仔饭            | <>         |
| [里脊串的开发随笔](http://adad184.com)           | <>            |
| Chun Tips           | <>              |
| Why's blog - 汪海的实验室 | <>     |
