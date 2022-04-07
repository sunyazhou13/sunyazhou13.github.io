---
title: iOS开发知识点积累
date: 2017-01-18 13:44:57
categories: [iOS开发]
tags: [iOS开发, macOS开发]
---

> 搞了很久iOS开发, 以前都是用脑子记某种技术文章和技术实现的代码,但是当一个人的大脑超过一定存储极限的时候就会出现栈溢出(其实我比较笨)，后来开始逐渐记某博客的是谁写的，或者技巧实现的代码。。。后来发现不但栈溢出，堆也快存不住海量的iOS技术文章了。。。唉于是我的chrome上保留了所有经典的文章标签和浏览器网页地址，现在我想把它整理出来放在博客里，方便查找某技术实现的代码(其实我的原百度云小伙伴实习生都觉得我能对某种技术存储如此详细赶到惊叹).好了 我们开始iOS知识点技术导航

iOS技术分类如下

* 音频
* 相机与照片
* 图形图像
* 动画
* UI转场
* ASDK(AsyncDisplayKit)
* swift相关
* 数学图形
* 架构
* Masonry
* Cocoapods
* 文件相关


音频
--

__[iOS音频播放 (一)：概述](http://msching.github.io/blog/2014/07/07/audio-in-ios/)__  
__[iOS音频播放 (二)：AudioSession](http://msching.github.io/blog/2014/07/08/audio-in-ios-2/)__  
__[iOS音频播放 (三)：AudioFileStream](http://msching.github.io/blog/2014/07/09/audio-in-ios-3/)__  
__[iOS音频播放 (四)：AudioFile](http://msching.github.io/blog/2014/07/19/audio-in-ios-4/)__  
__[iOS音频播放 (五)：AudioQueue](http://msching.github.io/blog/2014/08/02/audio-in-ios-5/)__  
__[iOS音频播放 (六)：简单的音频播放器实现](http://msching.github.io/blog/2014/08/09/audio-in-ios-6/)__  
__[iOS音频播放 (七)：播放iPod Library中的歌曲](http://msching.github.io/blog/2014/09/07/audio-in-ios-7/)__  
__[iOS音频播放 (八)：NowPlayingCenter和RemoteControl](http://msching.github.io/blog/2014/11/06/audio-in-ios-8/)__  
__[iOS音频播放 (九)：边播边缓存](http://msching.github.io/blog/2016/05/24/audio-in-ios-9/)__

> 以上内容来自[码农人生](http://msching.github.io/) 这个哥们我有过交流，感觉底层音频技术比较透彻，适合初学者以及中级开发者研究学习和使用。


图形处理
--

__[基础知识](https://objccn.io/issue-21-1/)__一些列教程可以连续看完  
__[GPUImage](https://github.com/BradLarson/GPUImage)__库   
__[iOS GPUImage源码解读（一）](http://mp.weixin.qq.com/s/pg2vPYftkfghoQswxJFIvw)__
__[开源一个上架 App Store 的相机 App](http://hawk0620.github.io/blog/2017/02/17/zpcamera-opensource-share/)__


图形图像
--
__[基于 OpenCV 的人脸识别](https://www.objccn.io/issue-21-9/)__  
__[图片编辑](https://github.com/3tinkers/TKImageView)__


动画
--

__[QQ中未读气泡拖拽消失的实现分析](http://kittenyang.com/drawablebubble/)__  
__[iOS 自定义下拉线条动画](http://kittenyang.com/curvelineanimation/)__  
__[一个库涵盖了所有iOS动画效果](https://github.com/sunyazhou13/Animations)__
__[pop](https://github.com/facebook/pop)__

> 学动画先从[骑滔(Kitten)](http://kittenyang.com/)的动画搞起最靠谱  
> 以上是普通动画内容2篇来自Kitten  
> 持续更新中


转场动画
--


__[WWDC 2013 Session笔记 - iOS7中的ViewController切换]()__ 喵神的这篇必看  

__[UIPresentationController Tutorial: Getting Started](https://www.raywenderlich.com/139277/uipresentationcontroller-tutorial-getting-started)__ 需要翻墙  
*(话说我解释一下这个词"翻墙",翻墙名词叫科学上网,黑话叫自备梯子,因为大家一开始都用[云梯VPN](https://www.yuntipub.com/)访问国外网站,因为我国搞了个垃圾防火墙的大型局域网,虽然阻碍了世界文明和技术科技的发展但也防范了一些不健康内容，比如万一有一天你搞个车床，制造个微冲出来怎么办哈哈,所以要翻越那个防火墙就俗称翻墙)*  

__[自定义控制器转场动画及下拉菜单的小Demo | AppCoda翻译系列](http://wxgbridgeq.github.io/blog/2015/08/10/custom-transition-animation/)__

>还有可以github搜索__[Transition](https://github.com/search?l=Objective-C&o=desc&q=Transition&s=stars&type=Repositories&utf8=%E2%9C%93)__  
>很多这种转场动画不一一介绍


ASDK(AsyncDisplayKit)
--

__[官方文档](http://asyncdisplaykit.org/)__ (需要翻墙)  
__[中文翻译](http://reactnative.cn/docs/0.46/getting-started.html)__  
__[AsyncDisplayKit 2.0 Tutorial: Getting Started](https://www.raywenderlich.com/124311/asyncdisplaykit-2-0-tutorial-getting-started)__  
__[AsyncDisplayKit 2.0 Tutorial: Automatic Layout](https://www.raywenderlich.com/124696/asyncdisplaykit-2-0-tutorial-automatic-layout)__  
__[AsyncDisplayKit官方文档翻译](http://awhisper.github.io/2016/05/04/AsyncDisplayKit%E5%AE%98%E6%96%B9%E6%96%87%E6%A1%A3%E7%BF%BB%E8%AF%91/)__  
__[AsyncDisplayKit源码分析(一)轮廓梳理](http://awhisper.github.io/2016/05/06/AsyncDisplayKit%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90/)__  
__[AsyncDisplayKit源码分析(二) 异步渲染](http://awhisper.github.io/2016/12/16/AysncDisplayKit%E5%88%86%E6%9E%90-%E4%BA%8C/)__  
__[使用ASDK性能调优-提升iOS界面的渲染性能](http://draveness.me/asdk-rendering/)__


> 以上几篇分别来自 __[raywenderlich](https://www.raywenderlich.com/)__  
> 源码分析来自于 __[折腾范儿の味精
> ](http://awhisper.github.io/)__ 一个百度阅读团队同事的博客  
> 在这里我说一下我对ASDK的看法，我视图读过源码和官方文档，我发现这个不是你想用想用就能马上用的东西，简直可以让一个初学者学习一遍 **UIKit** 一样集成起来倒是很简单，但是就那是那个布局就足够一个开发人员研究一阵子，用不了masonry,但是功能单一的页面需要调优可以考虑一下。




swift相关
--
__[喵神的网站](http://swifter.tips/)__ 目前好像停止了更新 iOS开发领域喵神 真是神一般的存在  
__[swift随机数](http://southpeak.github.io/2015/09/26/ios-techset-5/)__ 来自__[南峰子 老驴](http://southpeak.github.io/)__ 一个百度前同事现在在京东金融貌似， 有过技术交流很NB的一个人.  
__[Swift 3必看：从使用场景了解GCD新API](http://www.jianshu.com/p/fc78dab5736f)__ 这个哥们我没有了解过 不过很多文章写的很好希望以后有机会交流一下

> 持续更新中更新...


数学图形
--
__[图形数学](https://jackschaedler.github.io/)__ eg:傅里叶变换


架构
--
__[Casa博客](http://casatwy.com/)__

> 我必须评价一下这个Casa哥们,iOS架构师我唯一佩服的人,用我的话就是，这才是真正程序员心中的架构师，而不是哪些所谓的听起来很NB的架构师,我在百度个人云(你们看到的是百度网盘)工作时有个T8架构师就坐在我对面，那个架构师每天闲的我真想撅他，改iOS程序 xib的引用没去掉都不知道 最好导致线上崩溃，我其实非常想送他一句话，不管技术多NB 每天都要保持写代码，记得孔子的话：『吾尝终日而思矣，不如须臾之所学也』。  
> 这个Casa的哥们让我看到了什么叫 架构工程师 和业务工程师，这是一个能真正去写架构代码然后扔给业务工程师说：按照这个搞法


Masonry
--
__[](http://tutuge.me/2015/05/23/autolayout-example-with-masonry/)__  
__[有趣的Autolayout示例-Masonry实现](http://tutuge.me/2015/05/23/autolayout-example-with-masonry/)__  
__[有趣的Autolayout示例2-Masonry实现](http://tutuge.me/2015/08/08/autolayout-example-with-masonry2/)__ 
__[有趣的Autolayout示例3-Masonry实现](http://tutuge.me/2015/12/14/autolayout-example-with-masonry3/)__ 
__[有趣的Autolayout示例4-Masonry实现](http://tutuge.me/2016/08/06/autolayout-example-with-masonry4/)__  
__[有趣的Autolayout示例5-Masonry实现](http://tutuge.me/2017/03/12/autolayout-example-with-masonry5/)__  

__[iOS自动布局框架-Masonry详解](http://www.jianshu.com/p/ea74b230c70d)__  
__[Masonry — 使用纯代码进行iOS应用的autolayout自适应布局](http://www.ios122.com/2015/09/masonry/)__ 中文翻译

> 话说 我个人认为学习masonry只需要看看 中文翻译之后 再去看看土土哥的教程就会了。土土哥的masonry教程简直就是中文文档。写的非常好


Cocoapods
--

__[用CocoaPods做iOS程序的依赖管理](http://blog.devtang.com/2014/05/25/use-cocoapod-to-manage-ios-lib-dependency/)__ 巧神的文章必看


文件相关
--

__[文件列表](https://github.com/sunyazhou13/FileExplorer)__  
__[HYFileManager](https://github.com/sunyazhou13/HYFileManager)__  




博客列表
--

| 博客地址                                     | RSS地址                                    |
| ---------------------------------------- | :--------------------------------------- |
| [OneV's Den](http://onevcat.com)         | <http://onevcat.com/atom.xml>            |
| [破船之家](http://beyondvincent.com)         | <http://beyondvincent.com/atom.xml>      |
| [NSHipster](http://nshipster.cn)         | <http://nshipster.cn/feed.xml>           |
| [Limboy 无网不剩](http://blog.leezhong.com/) | <http://feeds.feedburner.com/lzyy>       |
| [唐巧的技术博客](http://blog.devtang.com)       | <http://blog.devtang.com/atom.xml>       |
| [Lex iOS notes](http://ios.lextang.com)  | <http://ios.lextang.com/rss>             |
| [念茜的博客](http://nianxi.net)               | <http://nianxi.net/feed.xml>             |
| [Xcode Dev](http://blog.xcodev.com)      | <http://blog.xcodev.com/atom.xml>        |
| [Ted's Homepage](http://wufawei.com/)    | <http://wufawei.com/feed>                |
| [txx's blog](http://blog.t-xx.me)        | <http://blog.t-xx.me/atom.xml>           |
| [KEVIN BLOG](http://imkevin.me)          | <http://imkevin.me/rss>                  |
| [阿毛的蛋疼地](http://www.xiangwangfeng.com)   | <http://www.xiangwangfeng.com/atom.xml>  |
| [亚庆的 Blog](http://billwang1990.github.io) | <http://billwang1990.github.io/atom.xml> |
| [Nonomori](http://nonomori.farbox.com)   | <http://nonomori.farbox.com/feed>        |
| [言无不尽](http://tang3w.com)                | <http://tang3w.com/atom.xml>             |
| [Wonderffee's Blog](http://wonderffee.github.io) | <http://wonderffee.github.io/atom.xml>   |
| [I'm TualatriX](http://imtx.me)          | <http://imtx.me/feed/latest/>            |
| [vclwei](http://vclwei.com)              | <http://vclwei.com/posts.rss>            |
| [Cocoabit](http://blog.cocoabit.com)     | <http://blog.cocoabit.com/atom.xml>      |
| [nixzhu on scriptogr.am](http://nixzhu.me) | <http://nixzhu.me/feed>                  |
| [不会开机的男孩](http://studentdeng.github.io)  | <http://studentdeng.github.io/atom.xml>  |
| [Nico](http://www.taofengping.com)       | <http://www.taofengping.com/rss.xml>     |
| [阿峰的技术窝窝](http://hufeng825.github.io)    | <http://hufeng825.github.io/atom.xml>    |
| [answer_huang](http://answerhuang.duapp.com) | <http://answerhuang.duapp.com/index.php/feed/> |
| [webfrogs](http://webfrogs.me)           | <http://webfrogs.me/feed/>               |
| [代码手工艺人](http://joeyio.com)              | <http://joeyio.com/atom.xml>             |
| [Lancy's Blog](http://gracelancy.com)    | <http://gracelancy.com/atom.xml>         |
| [I'm Allen](http://www.imallen.com)      | <http://www.imallen.com/atom.xml>        |
| [Travis' Blog](http://imi.im/)           | <http://imi.im/feed>                     |
| [王中周的技术博客](http://wangzz.github.io/)     | <http://wangzz.github.io/atom.xml>       |
| [会写代码的猪](http://jiajun.org/)             | <http://gaosboy.com/feed/atom/>          |
| [克伟的博客](http://wangkewei.cnblogs.com/)   | <http://feed.cnblogs.com/blog/u/23857/rss> |
| [摇滚诗人](http://cnblogs.com/biosli)        | <http://feed.cnblogs.com/blog/u/35410/rss> |
| [Luke's Homepage](http://geeklu.com/)    | <http://geeklu.com/feed/>                |
| [萧宸宇](http://iiiyu.com/)                 | <http://iiiyu.com/atom.xml>              |
| [Yuan博客](http://www.heyuan110.com/)      | <http://www.heyuan110.com/?feed=rss2>    |
| [Shining IO](http://shiningio.com/)      | <http://shiningio.com/atom.xml>          |
| [YIFEIYANG--易飞扬的博客](http://www.yifeiyang.net/) | <http://www.yifeiyang.net/feed>          |
| [KooFrank's Blog](http://koofrank.com/)  | <http://koofrank.com/rss>                |
| [hello it works](http://helloitworks.com) | <http://helloitworks.com/feed>           |
| [码农人生](http://msching.github.io/)        | <http://msching.github.io/atom.xml>      |
| [玉令天下的Blog](http://yulingtianxia.com)    | <http://yulingtianxia.com/atom.xml>      |
| [不掏蜂窝的熊](http://www.hotobear.com/)       | <http://www.hotobear.com/?feed=rss2>     |
| [猫·仁波切](https://andelf.github.io/)       | <https://andelf.github.io/atom.xml>      |
| [煲仔饭](http://ivoryxiong.org/)            | <http://ivoryxiong.org/feed.xml>         |
| [里脊串的开发随笔](http://adad184.com)           | <http://adad184.com/atom.xml>            |
| [Chun Tips](http://chun.tips/)           | <http://chun.tips/atom.xml>              |
| [Why's blog - 汪海的实验室](http://blog.callmewhy.com/) | <http://blog.callmewhy.com/atom.xml>     |

