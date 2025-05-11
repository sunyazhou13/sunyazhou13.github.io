---
layout: post
title: Learning AV Foundation(四)AVAsset元数据(基础篇)
date: 2017-06-16 10:11:19
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
---

![](/assets/images/20170616LearningAVFoundationAVAssetBasic/AlbumDetail.webp)


# 前言
本篇讲述的`AVAsset`元数据(可以简单理解成 比如一个mp3音频格式的model信息. title:xxxx, art:刘德华, album:专辑 爱你一万年.... 等这些数据的来源). 当然这种意义上的字段信息 属于`AVAsset`的一个属性。`AV Foundation`通过`AVAsset`封装来处理各种音频的元数据, __比如从mp3文件中解析出来封面图(artwork)__等。 本章的具体内容如下:

### __理解资源含义__
### __创建资源__
  * iOS Asset库
  * iOS iPod库
  * macOS iTunes库
  
### __异步载入__
### __媒体元数据__
  * 元数据格式  
     1. QuickTime  
     2. MPEG-4音频和视频(mp4)  
     3. MP3  
     
### __使用元数据__
  * 查询元数据
  * 使用`AVMetadataItem`

### __创建MetaManager Demo__
  * MediaItem(相当于Model)
  * MediaItem实现
  * 数据转换器(model to AVMetadataItem || AVMetadataItem to mode)
  * DefaultMetadata默认转换
  * 转换Artwork(唱片的封面或者专辑图那种)
  * 转换注释
  * 转换音轨数据(track)
  * 转换唱片数据
  * 转换风格数据(genre, eg: blue蓝调, classic古典,pop流行等126种..)
  * 完成最终demo  
  
#### __保存元数据__
---



### __理解`AVAsset`资源含义__  
`AVAsset`是一个不可变的抽象类,定义媒体资源混合呈现方式.里面包含音视频的**曲目**、**格式**、**时长**, 以及**元数据NSData**(二进制的bytes).

`AVAsset`不用考虑媒体资源具有的两个范畴: 
 
* 提供对基本媒体格式的抽象层  
* 不用考虑处理因为不同格式获取内容方式不一样

这意味着无论是处理`Quick Time`影片、`MPEG-4`视频还是`MP3`音频，框架提供统一的接口，我们只需要理解只有资源这个概念。这样做的目的是为了__开发者在面对不同格式的内容时有一个统一的处理方法。不需要care多种编码器和容器格式因为细节不同而带来的困扰__. 当然获取这些其余信息可以通过其它方式实现. `AVAsset`还隐藏了资源位置(GPS定位)信息,当处理一个媒体对象时，通过URL来初始化init. URL可以是Bundle里面 也可以是沙盒的本地文件系统URL.也可以从iPod库中取到的URL。还可以是远程服务器的音频流或视频流的URL。
    
`AVAsset`属于低耦合组件方式的封装 让框架来处理那些繁重的工作, 我们就可以很方便的不用考虑文件位置的前提下获取或者载入媒体。由于不用care文件合适和文件位置等复杂的问题。`AVAsset`为开发者处理`timed media(时基媒体)`提供了一种简单统一的方式.

`AVAsset`本身不是媒体资源. 可以把它理解成承载`timed media(时基媒体)`的容器类。它有很多描述自身元数据的媒体组成. `AVAssetTrack`才是我们真正存储媒体资源的统一媒体类型。并对每个资源建立相应的model.  `AVAssetTrack`最常见的形式就是 音频流和视频流, 但是他还可以用于表示诸如__文本__、__副标题__、__隐藏字幕__等媒体类型. 如下示意图理解`AVAsset` 和 `AVAssetTrack`

![](/assets/images/20170616LearningAVFoundationAVAssetBasic/AVAssetTrack.webp)

_**`AVAsset.tracks`**_ 如下

``` objc 
@property (nonatomic, readonly) NSArray<AVAssetTrack *> *tracks;

```

 资源曲目可通过tracks属性访问到. 该属性返回一个NSArray的数组,这个数组中的元素就是专辑包含的所有曲目. 此外，`AVAsset`还可以通过标识符、媒体类型或媒体特征等信息找到相应的曲目.这使得在未来更高级的处理中我们可以很容易获取一组需要的曲目
 
 
 
#### __创建资源__
    
当为一个现有的媒体资源创建`AVAsset`对象时, 可以通过URL对它的进行的初始化来实现. 一般来说是一个本地文件URL, 也可以是远程的资源URL  

    
``` objc
    NSURL *assetURL = //....
    AVAsset *asset = [AVAsset assetWithURL: assetURL];
```

> ....

`AVAsset`是个抽象类, 它不能直接被实例化. 当使用`assetWithURL:`方法创建实例时,实际上是创建了`AVAsset`的子类`AVURLAsset` 有时候会直接使用这个类, 因为它允许通过传递选项字典来精细调整资源的创建方式, 举个例子,比如创建 用在音频或视频编辑场景中的资源, 可能希望传递一个选项(option)的字典来告诉程序提供更精确的时长和计时等信息 例如:


``` objc

    NSURL *assetURL = //....
    NSDictionary *options = @{AVURLAssetPreferPreciseDurationAndTimingKey:@YES};
    AVAsset *asset = [AVAsset assetWithURL: assetURL];
    
```
  
> ...

这里传递的是希望得到稍长一点的加载事件,来获取更精确的时长及时间信息.很多常见的位置是开发时大家想创建资源对象的地方. 在iOS设备上我们希望在用户的照片库中访问视频文件, 或者在iPod库中访问歌曲. 在Mac上 我们希望从用户的iTunes库中找到媒体项. 借助iOS和macOS中的这些辅助framework我们可以使用上边的媒体资源。下面介绍一下这些要用到的framework的例子

##### iOS Assets库

在iOS上拍照或者通过前置和后置相机捕捉到的音视频,它们保存在用户的照片库中.iOS提供的Assets库框架可以实现从照片库中读写的功能, 下例从用户资源库中的视频创建一个AVAsset:

``` objc
ALAssetsLibrary *library = [[ALAssetsLibrary alloc] init];
    [library enumerateGroupsWithTypes:ALAssetsGroupSavedPhotos usingBlock:^(ALAssetsGroup *group, BOOL *stop) {
        //Filter down to only videos
        [group setAssetsFilter:[ALAssetsFilter allVideos]];
        
        //Grab the first video returned
        [group enumerateAssetsAtIndexes:[NSIndexSet indexSetWithIndex:0] options:0 usingBlock:^(ALAsset *result, NSUInteger index, BOOL *stop) {
            if (result) {
                id representation = [result defaultRepresentation];
                NSURL *url = [representation url];
                AVAsset *asset = [AVAsset assetWithURL:url];
                //创建 调用一些其它API
            }
        }];
        
    } failureBlock:^(NSError *error) {
        NSLog(@"%@", [error localizedDescription]);
    }];
```

上面是如何获取保存在 相册中的视频资源(iOS10.10以后就废弃了上述方式) 获取出筛选结果的第一个视频, 库中的条目全部被建模为`ALAsset`对象, 为默认的呈现方式选用`ALAsset`类型返回一个`ALAssetRepresentation`对象,它提供了一个适用于创建`AVAset`的URL.

##### iOS iPod库

我们获取媒体的一个常见位置就是用户的iPod库. `MediaPlayer` framework 框架提供了API, 用于在iPod库中查询和获取条目. 当找到想获取的item时, 可以得到一个存储的URL并使用这个得到的URL初始化一个资源, 如下例所示:  


``` objc
    //艺术家
    MPMediaPropertyPredicate *artistPredicate = [MPMediaPropertyPredicate predicateWithValue:@"刘德华" forProperty:MPMediaItemPropertyArtist];
    //专辑
    MPMediaPropertyPredicate *albumPredicate = [MPMediaPropertyPredicate predicateWithValue:@"真永远" forProperty:MPMediaItemPropertyAlbumTitle];
    //歌曲名称
    MPMediaPropertyPredicate *songPredicate = [MPMediaPropertyPredicate predicateWithValue:@"爱你一万年" forProperty:MPMediaItemPropertyTitle];
    //查询
    MPMediaQuery *query = [[MPMediaQuery alloc] init];
    [query addFilterPredicate:artistPredicate];
    [query addFilterPredicate:albumPredicate];
    [query addFilterPredicate:songPredicate];
    
    NSArray *result = [query items];
    if (result.count > 0) {
        MPMediaItem *item = result[0];
        NSURL *assetURL = [item valueForProperty:MPMediaItemPropertyAssetURL];
        AVAsset *asset = [AVAsset assetWithURL:assetURL];
        // Asset 信息
    }
```


`MediaPlayer`framework提供了一个为`MPMediaPropertyPredicate`的类,用户帮助用户在iPod库中查找到具体内容所用的查询语句
上边举例一个例子: 在`刘德华`的`真永远`(真永远专辑)  唱片中查找`爱你一万年`这首歌, 执行完查询 会返回这个媒体 条目的资源URL属性(`MPMediaItemPropertyAssetURL`). 并使用这个属性创建`AVAsset`

##### macOS iTunes库

在 macOS(以前叫 OS X)上, iTunes是用户的媒体资源中心. 要识别这个库中的资源, 我们通常要对iTunes音乐目录中的iTunes Music Library.xml 文件进行解析, 从而得到相关数据. 不过在 Mac OS X 10.8山狮之后 有了比较简单的方法--`iTunesLibrary`framework.



``` objc 
ITLibrary *library = [ITLibrary libraryWithAPIVersion:@"1.0" error:nil];
    NSArray *items = library.allMediaItems;
    
    NSString *query = @"artist.name == '刘德华'"
                      "album.title == '真永远'"
                      "title == '爱你一万年'";
    NSPredicate *predicate = [NSPredicate predicateWithFormat:query];
    
    NSArray *songs = [items filteredArrayUsingPredicate:predicate];
    if (songs.count > 0) {
        ITLibMediaItem *item = songs[0];
        AVAsset *asset = [AVAsset assetWithURL:item.location];
        // asset info
    }
    
```


`iTunesLibrary`框架并没有像MediaPlayer框架那样给出具体的查询API. 不过开发者可使用标准的Cocoa NSPredicate(谓词)类来构建一个复杂的查询,当筛出需要的media item集合后，可使用`ITLibMediaItem`的`location`属性得到一个URL并创建`AVAsset`.

#### 异步载入

`AVAsset`具有多种有用的方法和属性, 可以提供有关资源的信息, 比如时长、创建日期、元数据等.
`AVAsset`还包含一些用于获取和使用曲目集合的方法. 不过有一点很重要, 就是当创建时资源就是对基础文件的处理, `AVAsset` 采用一种lazy load的加载方式, 提升了快速创建资源和立即载入的速度. 
__*注意`AVAsset`的属性访问是同步的,如果正在请求的属性没有预先载入,程序就会阻塞,直到它做出响应为止*__这个搞法不是很好,eg: avasset.duration 可能是个比较耗时的操作,如果使用MP3文件时没有在头文件中设置`TLEN`标签,这个标签用于定义duration值,则整个音频曲目都需要进行解析来准确的知道它的duration, 如果在主线程做这样的访问操作就会阻塞主线程,直到相关操作完成为止, APP可能会出现卡顿,导致系统监视器介入,并终止APP运行,如果解决这种问题,我们应该使用异步的 方式来查询资源属性.

``` objc
- (AVKeyValueStatus)statusOfValueForKey:(NSString *)key error:(NSError * _Nullable *)outError;

- (void)loadValuesAsynchronouslyForKeys:(NSArray<NSString *> *)keys completionHandler:(void (^)(void))handler;

```

可以使用statusOfValueForKey:error:方法查询一个给定的属性状态,返回一个`AVKeyValueStatus`的枚举值

``` objc
typedef enum AVKeyValueStatus : NSInteger {
    AVKeyValueStatusUnknown,
    AVKeyValueStatusLoading,
    AVKeyValueStatusLoaded,
    AVKeyValueStatusFailed,
    AVKeyValueStatusCancelled
} AVKeyValueStatus;
```

用于表示当前所请求的属性的状态, 如果状态不是`AVKeyValueStatusLoaded`说明此时这个属性可能导致程序卡顿,要异步载入一个给定的属性loadValuesAsynchronouslyForKeys:completionHandler:方法,参数keys 是一个或多个`资源属性名`的数组和一个callback,当资源处于回应状态时,就会调用这个`completionHandler`

``` objc
	NSURL *assetURL = [[NSBundle mainBundle] URLForResource:@"384551_1438267683" withExtension:@"mov"];
    AVAsset *asset = [AVAsset assetWithURL:assetURL];
    //异步加在 tracks property
    NSArray *keys = @[@"tracks"];
    [asset loadValuesAsynchronouslyForKeys:keys completionHandler:^{
        //查询tracks的属性状态
        NSError *error = nil;
        AVKeyValueStatus status = [asset statusOfValueForKey:@"tracks" error:&error];
        switch (status) {
            case AVKeyValueStatusLoaded:
                //继续处理后续逻辑
                break;
            case AVKeyValueStatusFailed:
                //有error
                break;
            case AVKeyValueStatusCancelled:
                // 处理意外取消等情况的逻辑
                break;
            
            default:
                break;
        }
    }];

```

这里用bundle中的`QuickTime`电影创建一个AVAsset, 并异步载入该对象的`tracks`属性.在`completionHandler` block中,我们希望通过调用资源的statusOfValueForKey:error:方法来拿出请求属性的状态,NSError用于判断资源包含错误信息. _*注意:`completionHandler:`block可能在任意一个队列中调用,在对UI界面做出相应更新之前,必须先回到主线程队列,否则必被坑！！！*_

> _*注意:上面的demo载入了一个tracks属性,其实可以在一个吊用中请求多个属性,如果请求多个属性的时候需要注意以下两点:*_
> (1) 每次调用 `loadValuesAsynchronouslyForKeys:completionHandler:`方法时只会调用一次`completionHandler`block, 调用这个callback的次数不是根据传递给这个方法的key个数决定的.
> (2) 需要为每个请求的属性调用`statusOfValueForKey:error:`,不能假设所有属性都返回相同的状态值.


### __媒体元数据__
	
当创建一个媒体应用程序时,了解该媒体的组织格式非常重要, 简单的展示一堆文件名也许在文件不多的时候还能接受, 如果大规模批量的文件需要展示就比较蛋疼了, 我们真正需要的是 _找到一种方法对媒体进行描述,当用户可以方便的找到、识别和组织这些媒体._ 我们所使用的`AV Foundation`中的主要媒体格式(*.mp4、*.mp3、*.mov、*.mkv.....)都可以嵌入描述其内容的元数据.因为各种媒体格式的描述不尽相同,要搞一套通用的策略去解析各种媒体的格式文件,这要求我们对底层技术有一些了解.不过`AV Foundation`让这些变得简单,因为它使开发者不需要考虑大多数特定格式的细节; 在处理媒体元数据方面, AV Foundation`提供了一套统一的方法.

#### 元数据格式

虽然存在多种格式的媒体资源,但是我们在Apple环境下遇到的媒体类型主要有4种, 分别是:`QuickTime(mov)`、`MPEG-4 video(mp4和m4v)`、`MPEG-4 audio(m4a)`和`MPEG-Layer Ⅲ audio(mp3)`. 虽然`AV Foundation`处理这些文件中嵌入的元数据时都使用一个接口, 但是理解这些不同类型资源的元数据如何存储及存储位置仍然很有价值. 这里只做概述, 但是如果深入研究这些都是必学的基础.

1. __QuickTime__
	`QuickTime`是苹果自己开发的一种跨平台媒体架构, 其中一部分是Quick File Format规范, 定义了 .mov文件的内部结构.`QuickTime`文件由一种称为`atom`的数据结构组成. 一般规则是这样的:
	一个`atom`包含了描述媒体资源的某一方面的数据, 或者嵌套包含其它`atom`,但不能两者都包含.有时候苹果自己的方法实现可能会违背这一规则.`atom`以一种复杂的树状结构组合在一起, 详细的对布局、音频样本格式、视频帧信息乃至需要呈现的元数据信息(作者,版权等)做了描述.   

	![](/assets/images/20170616LearningAVFoundationAVAssetBasic/atom.webp)
	*为了能记住`atom`我把它戏称为`阿童木`哈哈-跟阿童木压根没啥关系*.  
	
	了解`QuickTime`的一个好办法是用十六进制编辑器中打开一个.mov格式的文件.(常见的十六进制编辑器有Hex Fiend或Synalyze It! Pro).典型的十六进制工具会将一个真实的`QuickTime`文件的数据显示出来,但其中的结构和`atom`间的关系不是很直观能理解,推荐苹果有一个`Atom Inspector`工具.这个工具将atom结构以`NSOutlineView`(树形UI控件类似UITableView)方式显示.所以`atom`的树形瓜西会很清晰的看到,这个工具还提供一个小型的十六进制查看器,可以从中查看到__实际字节布局__.
	
	![](/assets/images/20170616LearningAVFoundationAVAssetBasic/AtomInspector.webp)
	
	下载地址:[Atom Inspector 猛击这里](http://adcdownload.apple.com/QuickTime/atom_inspector/atom_inspector.dmg)  貌似需要登录开发者帐号
	下载中心:[苹果官方软件下载中心](https://developer.apple.com/download/more/)  貌似需要登录开发者帐号 
	
	下图就是atom格式
	![](/assets/images/20170616LearningAVFoundationAVAssetBasic/QuickTimeAtomStructureNew.webp)
	
	*atom格式*
	
	__`QuickTime`文件最少包含三个高级的`atom`__
	
	* __用于描述文件类型和兼容类型的`fypy`__
	* __包含实际音频和视频媒体的`mdat`__
	* __moov atom(moo-vee) 媒体资源的所有细节做了完整描述包括原始的二进制数据__
	
	下图是我实际测试一个mov文件的atom
	![](/assets/images/20170616LearningAVFoundationAVAssetBasic/QuickTimeAtomStructureReal.webp)
	*实测*
	
	当处理QuickTime电影时会遇到两种类型的元数据. 标准的`QuickTime`元数据由`Final Cut Pro X`这样的工具编写, 位于/moov/meta/plist中, 它的key几乎都具有com.apple.quicktime前缀. 其它类型的数据被认为是`QuickTime`用户数据, 保存在/moov/udta/中.`QuickTime`用户数据可以包含播放器需要查找的标准数据,eg: 歌曲的演唱者或版权信息, 除此之外还可以包含任何对应用程序有帮助的信息.  上述两种元数据类型在	`AV Foundation`中都是可以读写的.  
	如果想了解更多`QuickTime`细节可以查看[Quick Time Format Specification](https://developer.apple.com/library/content/documentation/QuickTime/QTFF/QTFFPreface/qtffPreface.html)官方文档(400多页).  
	掌握moov atom的核心知识很重要,有助于我们更好的了解`AV Foundation`是如何使用这些数据的.
	
2. __MPEG-4 (MP4)音频和视频__

	MPEG-4 Part 14是定义MP4文件格式的规范. `MP4`直接派生自`QuickTime`文件格式,所以`MP4`文件格式与`QuickTime`文件结构很类似. 其实有时候能解析一种文件类型的工具也适用于其它文件类型.`MP4`文件也由成为`atom`的数据结构组成.技术上讲,`MPEG-4`规范将这些称为`boxes`,因为其大部分来自于`QuickTime`所以大家都还是把它成为`atom`.  
	![](/assets/images/20170616LearningAVFoundationAVAssetBasic/mp4AtomBook.webp)
	*MPEG-4 atom结构*
	
	![](/assets/images/20170616LearningAVFoundationAVAssetBasic/mp4Atom.webp)
	*MPEG-4 atom结构 实测结果*
	
	`MPEG-4`文件的元数据保存在`/moov/udat/meta/ilst`中. 对于`atom`中使用key没有标准, 大家都墨守成规的遵循苹果尚未发布的iTunes元数据规范中对key的定义. 虽然没有正式的发布,但iTunes元数据格式的相关文档已经在网上广为人知了(我就很纳闷 这算是发了版本还是没发,发了怎么还是尚未公布,没发怎么又广为人知...). 可以参考[mp4v2库](https://code.google.com/archive/p/mp4v2/wikis/iTunesMetadata.wiki)文档了解更多mp4内容.
	
	`mp4`是对MPEG-4媒体的标准扩展.eg: `.m4v`、`.m4a`、`.m4p`、`.m4b`.这些变体使用的都是`MPEG-4`容器格式,也有些包含了附加的扩展功能.  
	大家只需要记住几点:
	* __`M4V`__ 文件是带有苹果公司针对__`FairPlay`__加密及__`AC3-audio`__扩展的`MPEG-4`视频格式
	* __`MP4`__ 如果不涉及`FairPlay`加密及`AC3-audio`扩展,`M4V`就仅仅是扩展名不一样而已
	* __`M4A`__ 专门针对音频,使用这种扩展名的目的是让大家知道这种格式的文件只带有音频资源
	* __`M4P`__ 苹果很古老的iTunes格式,使用其`FairPlay`扩展
	* __`M4B`__ 用于有声读物,同窗包含章节标签以及提供书签功能,让读者可以返回到指定位置开始阅读(类似有声小说)
	
3. __MP3__
	
	`MP3`文件和`MPEG-4 (.mp4)`、`QuickTime(.mov)`有显著区别,`MP3`不使用容器格式,而使用__编码音频数据__,文件开头通常包含可选元数据的结构块.`mp3`文件使用一种称为ID3v2的格式来保存关于音频内容的描述信息,包含: artist(艺术家)、演唱者、album(所属专辑)、音乐风格等.  
	`ID3`数据很easy,`mp3`前10个字节带有嵌入的元数据, 这10个字节定义了`ID3`块的头部.10个字节中的前三个字节始终为'49 44 33'(ID3,用于表示一个`ID3v2标签`,后面两个字姐用于定义主版本信息,既`2、3、4`和版本号.剩余字节用于定义标志集合及ID3快的大小.
	![](/assets/images/20170616LearningAVFoundationAVAssetBasic/ID3Header.webp)
	*ID3 header*
	
	`ID3`块中剩下的数据都是用于描述不同元数据的的key-value键值对的帧.每一帧都有一个__实际标签名称的10字节的头__,之后的4字节表示尺寸,再之后的两个字节用来定义选项标志.

	
	 id3 | version(2字节) | revision (剩余字节)| flag(2字节)| size(4字节) |
	
	帧剩下的字节包含了实际的元数据值.如果值是文本类型tag中的第一个字节包含了实际的元数据值.如果值是文本类型,tag中的第一个字节用来定义编码类型. eg:Ox00, 代表:`ISO-8859=1`,也支持其它类型的编码。如下图ID3结构示意图.
	__`AV Foundation`支持读取`ID3v2`标签的的所有版本, 但不支持写入.MP3格式收到专利限制.所以`AV Foundation`无法支持对MP3或ID3数据进行编码.__ 不过最近听说德国的MP3专利研究所说专利打算撤销因为`AAC`格式将有更好的效果相对于MP3而言.看看后续苹果API变动会不会增加修改MP3的数据吧.
	
	![](/assets/images/20170616LearningAVFoundationAVAssetBasic/ID3Structure.webp)
	*ID3v2 结构图*
	
> `AV Foundation`支持所有`ID3v2`标签格式的读取操作,但是`ID3v2`是要加星号的.`ID3v2.2`的布局和`ID3v2.3`及之后版本的布局不同. 需要注意:有些标签由3个字符组成,而不是4个字符, 比如一首歌曲的标注信息, 当标签为`ID3v2.2`时,是被保存到COM帧中,但当同一首歌使用`ID3v2.3`标签或更新版本的标签时,歌曲的标注信息会被保存在COMM帧中,框架定义的字符常量只适用于`ID3v2.3`及以后版本,后续demo中我们通过代码演示如何向前兼容`ID3v2.2`.


### __使用元数据__


`AVAsset`和`AVAssetTrack`可以实现查询元数据功能  

* `AVAsset` 大部分情况下会使用
* `AVAssetTrack` 获取曲目一级元数据

读取具体资源元数据的接口可以使用`AVMetadataItem`类提供的方法访问`QuickTime`、`MPEG-4 atom`和`ID3`帧中的元数据进行访问. 
`AVAsset`和`AVAssetTrack`提供了两种方法可以获取相关元数据.但是有各自的适用范围.了解适用范围之前首先要知道 __键空间__(key space)的含义. `AV Foundation`使用__键空间(key space)__作为将相关键组合在一起的方法, 可以实现对`AVMetadataItem`实例集合的筛选.每个资源至少包含两个键空间,以便从中获取元数据.
![](/assets/images/20170616LearningAVFoundationAVAssetBasic/keyspace.webp)

`Common`键空间用来定义所有支持媒体类型的键, 包括: 曲名、歌手、插图信息等常见元素. 这提供了一种对所有支持的媒体格式进行一定级别的元数据标准化过程.我们可以从`Common`键空间查询 资源或者曲目的`commonMetadata`属性来获取元数据 这个属性会返回一个包含所有可用元数据的数组

访问指定格式的元数据需要在资源或曲目上调用`metadataForFormat:`方法.这个方法返回一个包含所有相关元数据信息的数组.`AVMetadataFormat.h`为不同的元数据格式提供对应的字符串常量. 由于不同格式的元数据导致key value对应类型不一致,我们可以利用
`availableMetadataFormats`(AVAsset的属性)获取到信息.如下代码:

``` objc

	NSURL *url = [NSURL fileURLWithPath:@"xxx.mp4"];//给个路径地址
    //创建元数据
    AVAset *asset = [AVAsset assetWithURL:url];
    NSArray *keys = @[@"availableMetadataFormats"];
    [asset loadValuesAsynchronouslyForKeys:keys completionHandler:^{
        NSMutableArray *metadata = [NSMutableArray array];
        for (NSString *format in asset.availableMetadataFormats){
            [metadata addObjectsFromArray:[asset metadataForFormat:format]];
        }
        
        //处理metadata (AVMetadataItems)
    }];


```


### __查找元数据__

当我们拿到一个包含元数据项的数组(上文中的metadata (AVMetadataItems))时,我们通常通过遍历取出里面的数据值. 元数据(AVAsset)提供一个AVMetadataItem的遍历方法, 例如我们相得到一个M4A的音频文件演奏者和唱片的元数据. 如下:

``` objc

	NSArray *metaData = //AVMetadataItems数组
    NSString *keySpace = AVMetadataKeySpaceiTunes;
    NSString *artistKey= AVMetadataiTunesMetadataKeyArtist;
    NSString *albumKey = AVMetadataiTunesMetadataKeyAlbum;
    
    NSArray *artistMetadata = [AVMetadataItem metadataItemsFromArray:metaData withKey:artistKey keySpace:keySpace];
    NSArray *albumMetadata = [AVMetadataItem  metadataItemsFromArray:metaData withKey:albumKey keySpace:keySpace];
    
    AVMetadataItem *artistItem, *albumItem;
    
    if (artistMetadata.count > 0) {
        artistItem = artistMetadata[0];
    }
    
    if (albumMetadata.count > 0) {
        albumItem = albumMetadata[0];
    }

```

这里通过下面的方法来拿出匹配key 和 keySpace的标准对象 通常情况下这个数组就只有一个实例对象

``` objc
+ (NSArray<AVMetadataItem *> *)metadataItemsFromArray:(NSArray<AVMetadataItem *> *)metadataItems withKey:(id)key keySpace:(AVMetadataKeySpace)keySpace;
```


### 使用AVMetadataItem

AVMetadataItem 可以理解成它是一个 专用于元数据的 字典(key: value) 类型, 唯一的区别是 它的key 有可能是 数字(NSNumber), 它提供了 转 字符串(stringValue) 和numberValue以及 dataValue 的转换  

举个例子： 如果输出的key是  145238391  .... 我觉得大家肯定不知道这代表啥意思

为了解决这个问题 需要对`AVMetadataItem`进行category扩展 把这种语义不清楚的整形key换成字符串的key就好理解了 代码如下:

``` objc
#import "AVMetadataItem+Additions.h"

@implementation AVMetadataItem (Additions)

- (NSString *)keyString {
    if ([self.key isKindOfClass:[NSString class]]) {                        // 1
        return (NSString *)self.key;
    }
    else if ([self.key isKindOfClass:[NSNumber class]]) {

        UInt32 keyValue = [(NSNumber *) self.key unsignedIntValue];         // 2
        
        // Most, but not all, keys are 4 characters ID3v2.2 keys are
        // only be 3 characters long.  Adjust the length if necessary.
        
        size_t length = sizeof(UInt32);                                     // 3
        if ((keyValue >> 24) == 0) --length;
        if ((keyValue >> 16) == 0) --length;
        if ((keyValue >> 8) == 0) --length;
        if ((keyValue >> 0) == 0) --length;
        
        long address = (unsigned long)&keyValue;
        address += (sizeof(UInt32) - length);

        // keys are stored in big-endian format, swap
        keyValue = CFSwapInt32BigToHost(keyValue);                          // 4

        char cstring[length];                                               // 5
        strncpy(cstring, (char *) address, length);
        cstring[length] = '\0';

        // Replace '©' with '@' to match constants in AVMetadataFormat.h
        if (cstring[0] == '\xA9') {                                         // 6
            cstring[0] = '@';
        }

        return [NSString stringWithCString:(char *) cstring                 // 7
                                  encoding:NSUTF8StringEncoding];

    }
    else {
        return @"<<unknown>>";
    }
}

@end

```

基础篇部分讲解到这里 下一篇 会写个demo演示一下元数据的各种不同格式如何统一解析


全文完
