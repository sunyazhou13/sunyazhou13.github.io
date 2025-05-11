---
layout: post
title: Learning AV Foundation(五)播放视频
date: 2018-03-04 16:56:06
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
---

![](/assets/images/20180304LearningAVFoundationPlayingVideo/5kAirplay.webp)

# 前言

很久没有写Learning AV Foundation相关的文章了,言归正传
本篇介绍一下简单的视频播放

了解视频播放之前我们来看戏`AVPlayer`需要的一些组件模型


![AVPlayer组件模型](/assets/images/20180304LearningAVFoundationPlayingVideo/AVPlayer.webp)


## AVPlayer

`AVPlayer`是一个用来播放基于基于时间的视听媒体的控制对象,支持播放:

* 本地 媒体文件
* 异步下载 媒体文件
* HTTP Live Streaming协议的流媒体 文件

`AVPlayer` 是个 逻辑层组件

(应用可以分为如下几层)
> UI层  
> 业务逻辑层  
> 持久层+网络层  

如果播放`MP3`或`AAC`等音频文件, 是没有啥UI可视化的页面的。要是播放一个`	QuickTime`的电影或一个`MPEG-4`视频, 就会搞得很不适应.  
如果要播放视频等功能设计到UI的话，可以使用`AVPlayerLayer`类。

> 注意: _`AVPlayer`只管理一个单独资源的播放, 如果播放多个可以使用`AVPlayer`的子类`AVQueuePlayer`, 用它来管理一个资源队列, 当需要在一个序列中播放多个条目或者 为音频、视频资源设置播放循环时刻使用这个类_.

## AVPlayerLayer


`AVPlayerLayer`构建于 `Core Animation`之上, 是`AV Foundation`中能找到的位数不多的UI组件. `Core Animation` 是`Mac`和`iOS`平台上负责图形渲染与动画的基础框架,主要用于这些平台的美化和动画流畅度的提升. `Core Animation`本身具有基于时间的属性,并且由于它基于`OpenGL`,所以具有很好的性能.

`AVPlayerLayer`扩展了`Core Animation` 的`CALayer`类, 并通过框架显示视频内容到屏幕上.
我们知道Layer是不响应事件的.

创建`AVPlayerLayer`需要实例化一个`AVPlayer`的对象，`AVPlayerLayer`有一个`videoGravity`属性可以设置三种类似填充模式的东西,用来拉扯和缩放的视频. 下面列举了16:9的视频置于4:3矩形范围来说明不同的`gravity`.

如下图:

__AVLayerVideoGravityResizeAspect__保持缩放比例
![](/assets/images/20180304LearningAVFoundationPlayingVideo/AVLayerVideoGravityResizeAspect.webp)

__AVLayerVideoGravityResizeAspectFill__填充
![](/assets/images/20180304LearningAVFoundationPlayingVideo/AVLayerVideoGravityResizeAspectFill.webp)


__AVLayerVideoGravityResize__拉伸

![](/assets/images/20180304LearningAVFoundationPlayingVideo/AVLayerVideoGravityResize.webp)



## AVPlayerItem

我们需要使用`AVPlayer`播放`AVAsset`,前面我知道`AVAsset`元数据里面有`创建时间`、`元数据`和`时长`等信息.但是并没有媒体中特定位置的方法.

__这是因为`AVAsset`模型只包含媒体资源的静态信息.这些不变的属性用来描述对象的静态信息.这就意味着仅使用`AVAsset`对象是不能实现播放功能的.如果播放我们需要使用`AVPlayerItem`__

__`AVPlayerItem`可以理解成是一个动态的`AVAsset`模型,__  
`AVPlayerItem`有`seekToTime:`方法和`presentationSize:`,`AVPlayerItem`由一个或多个媒体曲目组成.

`AVPlayerItem`里面有``AVPlayerItemTrack`轨道属性.


## 播放示例

``` objc
- (void)viewDidLoad {
	self.localURL = [[NSBundle mainBundle] URLForResource:@"hubblecast" withExtension:@"m4v"];

    AVAsset *asset = [AVAsset assetWithURL:self.localURL];
    
    AVPlayerItem *item = [AVPlayerItem playerItemWithAsset:asset];
    
    AVPlayer *player = [AVPlayer playerWithPlayerItem:item];
    
    AVPlayerLayer *layer = [AVPlayerLayer playerLayerWithPlayer:player];
    
    [self.view.layer addSublayer:layer];
}
```

这个`AVPlayerItem`并没有任何代理告知我们是否已经开始播放,所以一般的搞法都是使用`KVO`去监听它的一个属性,`AVPlayerItemStatus`

``` objc
typedef NS_ENUM(NSInteger, AVPlayerItemStatus) {
	AVPlayerItemStatusUnknown,
	AVPlayerItemStatusReadyToPlay,
	AVPlayerItemStatusFailed
};
```

当它的`status`变成`AVPlayerItemStatusReadyToPlay`就说明已载入完成准备播放.

## CMTime

使用`CMTime`来处理各种音视频相关的时间操作,他是`CoreMedia`framework中的结构体.专门用于处理精确的时间,我们以前用的`NSTimeInterval`是存在计算不精确的问题(苹果官方说的).


``` objc
typedef struct
{
	CMTimeValue	value;		//分子
	CMTimeScale	timescale; //分母
	CMTimeFlags	flags;		//标记是否失效 eg. kCMTimeFlags_Valid, kCMTimeFlags_PositiveInfinity
	CMTimeEpoch	epoch;		
} CMTime;
```

这个结构体最关键的即使`value`(64位整形)和`timescale`(32位整形).

它表达时间的方式以分数表示比如:

`0.5`秒

``` objc
CMTime halfSecond = CMTimeMake(1, 2); //0.5秒
CMTime fiveSecond = CMTimeMake(5, 1); //5秒
CMTime oneSample = CMTimeMake(1, 44100); //一个抽样的样本
CMTime zeroTime = kCMTimeZero;
```


## 创建自己的播放器

首先需要封装一个`player`,


``` objc
#import <UIKit/UIKit.h>
#import "TransportProtocol.h"
@class AVPlayer;
@interface PlayerView : UIView
@property (nonatomic, readonly) id <TransportProtocol>  transport;
- (id)initWithPlayer:(AVPlayer *)player;
@end

```

.m文件实现

``` objc
#import "PlayerView.h"
#import <AVFoundation/AVFoundation.h>
#import "THOverlayView.h"
@interface PlayerView ()

@property (nonatomic, strong) THOverlayView *overlayView;

@end

@implementation PlayerView
+ (Class)layerClass{
    return [AVPlayerLayer class];
}

- (id)initWithPlayer:(AVPlayer *)player{
    self = [super initWithFrame:CGRectZero];
    if (self) {
        self.backgroundColor = [UIColor blackColor];
        self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
        [(AVPlayerLayer *)[self layer] setPlayer:player];
        [[NSBundle mainBundle] loadNibNamed:@"THOverlayView" owner:self options:nil];
        [self addSubview:self.overlayView];
    }
    return self;
}

- (void)layoutSubviews{
    [super layoutSubviews];
    self.overlayView.frame = self.bounds;
}

- (id <TransportProtocol>)transport{
    return self.overlayView;
}

@end
```

transport 是播放器的视图点击视图代理等集成了 在一起

``` objc
@protocol TransportDelegate <NSObject>
- (void)play;
- (void)pause;
- (void)stop;

- (void)scrubbingDidStart;
- (void)scrubbedToTime:(NSTimeInterval)time;
- (void)scrubbingDidEnd;

- (void)jumpedToTime:(NSTimeInterval)time;

@optional
- (void)subtitleSelected:(NSString *)subtitle;

@end

@protocol TransportProtocol <NSObject>

@property (weak, nonatomic) id <TransportDelegate> delegate;

- (void)setTitle:(NSString *)title;
- (void)setCurrentTime:(NSTimeInterval)time duration:(NSTimeInterval)duration;
- (void)setScrubbingTime:(NSTimeInterval)time;
- (void)playbackComplete;
- (void)setSubtitles:(NSArray *)subtitles;
@end
```

THOverlayView文件是顶层视图点击播放等等控件.

``` objc
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
@interface PlayerController : NSObject
@property (nonatomic, strong, readonly) UIView *view;
- (id)initWithURL:(NSURL *)assetURL;
@end
```

播放器的实现文件如下

``` objc
#import "PlayerController.h"
#import <AVFoundation/AVFoundation.h>
#import "TransportProtocol.h"
#import "PlayerView.h"
#import "AVAsset+Additions.h"
#import "UIAlertView+Additions.h"
#import "THThumbnail.h"

// AVPlayerItem's status property
#define STATUS_KEYPATH @"status"

// Refresh interval for timed observations of AVPlayer
#define REFRESH_INTERVAL 0.5f

// Define this constant for the key-value observation context.
static const NSString *PlayerItemStatusContext;

@interface PlayerController () <TransportDelegate>

@property (nonatomic, strong) AVAsset               *asset;
@property (nonatomic, strong) AVPlayerItem          *playerItem;
@property (nonatomic, strong) AVPlayer              *player;
@property (nonatomic, strong) PlayerView            *playerView;
@property (nonatomic, weak) id <TransportProtocol>  transport;
@property (nonatomic, strong) id                    timeObserver;
@property (nonatomic, strong) id                    itemEndObserver;
@property (nonatomic, assign) float                 lastPlaybackRate;
@property (strong, nonatomic) AVAssetImageGenerator *imageGenerator;
@end

@implementation PlayerController

#pragma mark - Setup

- (id)initWithURL:(NSURL *)assetURL {
    self = [super init];
    if (self) {
        _asset = [AVAsset assetWithURL:assetURL];                           // 1
        [self prepareToPlay];
    }
    return self;
}

- (void)prepareToPlay {
    NSArray *keys = @[
                      @"tracks",
                      @"duration",
                      @"commonMetadata",
                      @"availableMediaCharacteristicsWithMediaSelectionOptions"
                      ];
    self.playerItem = [AVPlayerItem playerItemWithAsset:self.asset          // 2
                           automaticallyLoadedAssetKeys:keys];
    
    [self.playerItem addObserver:self                                       // 3
                      forKeyPath:STATUS_KEYPATH
                         options:0
                         context:&PlayerItemStatusContext];
    
    self.player = [AVPlayer playerWithPlayerItem:self.playerItem];          // 4
    
    self.playerView = [[PlayerView alloc] initWithPlayer:self.player];    // 5
    self.transport = self.playerView.transport;
    self.transport.delegate = self;
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context {
    
    if (context == &PlayerItemStatusContext) {
        
        dispatch_async(dispatch_get_main_queue(), ^{                        // 1
            
            [self.playerItem removeObserver:self forKeyPath:STATUS_KEYPATH];
            
            if (self.playerItem.status == AVPlayerItemStatusReadyToPlay) {
                
                // Set up time observers.                                   // 2
                [self addPlayerItemTimeObserver];
                [self addItemEndObserverForPlayerItem];
                
                CMTime duration = self.playerItem.duration;
                
                // Synchronize the time display                             // 3
                [self.transport setCurrentTime:CMTimeGetSeconds(kCMTimeZero)
                                      duration:CMTimeGetSeconds(duration)];
                
                // Set the video title.
                [self.transport setTitle:self.asset.title];                 // 4
                
                [self.player play];                                         // 5
                
                [self loadMediaOptions];
                [self generateThumbnails];
                
            } else {
                [UIAlertView showAlertWithTitle:@"Error"
                                        message:@"Failed to load video"];
            }
        });
    }
}

- (void)loadMediaOptions {
    NSString *mc = AVMediaCharacteristicLegible;                            // 1
    AVMediaSelectionGroup *group =
    [self.asset mediaSelectionGroupForMediaCharacteristic:mc];          // 2
    if (group) {
        NSMutableArray *subtitles = [NSMutableArray array];                 // 3
        for (AVMediaSelectionOption *option in group.options) {
            [subtitles addObject:option.displayName];
        }
        [self.transport setSubtitles:subtitles];                            // 4
    } else {
        [self.transport setSubtitles:nil];
    }
}

- (void)subtitleSelected:(NSString *)subtitle {
    NSString *mc = AVMediaCharacteristicLegible;
    AVMediaSelectionGroup *group =
    [self.asset mediaSelectionGroupForMediaCharacteristic:mc];          // 1
    BOOL selected = NO;
    for (AVMediaSelectionOption *option in group.options) {
        if ([option.displayName isEqualToString:subtitle]) {
            [self.playerItem selectMediaOption:option                       // 2
                         inMediaSelectionGroup:group];
            selected = YES;
        }
    }
    if (!selected) {
        [self.playerItem selectMediaOption:nil                              // 3
                     inMediaSelectionGroup:group];
    }
}


#pragma mark - Time Observers

- (void)addPlayerItemTimeObserver {
    
    // Create 0.5 second refresh interval - REFRESH_INTERVAL == 0.5
    CMTime interval =
    CMTimeMakeWithSeconds(REFRESH_INTERVAL, NSEC_PER_SEC);              // 1
    
    // Main dispatch queue
    dispatch_queue_t queue = dispatch_get_main_queue();                     // 2
    
    // Create callback block for time observer
    __weak PlayerController *weakSelf = self;                             // 3
    void (^callback)(CMTime time) = ^(CMTime time) {
        NSTimeInterval currentTime = CMTimeGetSeconds(time);
        NSTimeInterval duration = CMTimeGetSeconds(weakSelf.playerItem.duration);
        [weakSelf.transport setCurrentTime:currentTime duration:duration];  // 4
    };
    
    // Add observer and store pointer for future use
    self.timeObserver =                                                     // 5
    [self.player addPeriodicTimeObserverForInterval:interval
                                              queue:queue
                                         usingBlock:callback];
}

- (void)addItemEndObserverForPlayerItem {
    
    NSString *name = AVPlayerItemDidPlayToEndTimeNotification;
    
    NSOperationQueue *queue = [NSOperationQueue mainQueue];
    
    __weak PlayerController *weakSelf = self;                             // 1
    void (^callback)(NSNotification *note) = ^(NSNotification *notification) {
        [weakSelf.player seekToTime:kCMTimeZero                             // 2
                  completionHandler:^(BOOL finished) {
                      [weakSelf.transport playbackComplete];                          // 3
                  }];
    };
    
    self.itemEndObserver =                                                  // 4
    [[NSNotificationCenter defaultCenter] addObserverForName:name
                                                      object:self.playerItem
                                                       queue:queue
                                                  usingBlock:callback];
}

#pragma mark - THTransportDelegate Methods

- (void)play {
    [self.player play];
}

- (void)pause {
    self.lastPlaybackRate = self.player.rate;
    [self.player pause];
}

- (void)stop {
    [self.player setRate:0.0f];
    [self.transport playbackComplete];
}

- (void)jumpedToTime:(NSTimeInterval)time {
    [self.player seekToTime:CMTimeMakeWithSeconds(time, NSEC_PER_SEC)];
}

- (void)scrubbingDidStart {                                                 // 1
    self.lastPlaybackRate = self.player.rate;
    [self.player pause];
    [self.player removeTimeObserver:self.timeObserver];
    self.timeObserver = nil;
}

- (void)scrubbedToTime:(NSTimeInterval)time {                               // 2
    [self.playerItem cancelPendingSeeks];
    [self.player seekToTime:CMTimeMakeWithSeconds(time, NSEC_PER_SEC) toleranceBefore:kCMTimeZero toleranceAfter:kCMTimeZero];
}

- (void)scrubbingDidEnd {                                                   // 3
    [self addPlayerItemTimeObserver];
    if (self.lastPlaybackRate > 0.0f) {
        [self.player play];
    }
}


#pragma mark - Thumbnail Generation

- (void)generateThumbnails {
    
    self.imageGenerator =                                                   // 1
    [AVAssetImageGenerator assetImageGeneratorWithAsset:self.asset];
    
    // Generate the @2x equivalent
    self.imageGenerator.maximumSize = CGSizeMake(200.0f, 0.0f);             // 2
    
    CMTime duration = self.asset.duration;
    
    NSMutableArray *times = [NSMutableArray array];                         // 3
    CMTimeValue increment = duration.value / 20;
    CMTimeValue currentValue = 2.0 * duration.timescale;
    while (currentValue <= duration.value) {
        CMTime time = CMTimeMake(currentValue, duration.timescale);
        [times addObject:[NSValue valueWithCMTime:time]];
        currentValue += increment;
    }
    
    __block NSUInteger imageCount = times.count;                            // 4
    __block NSMutableArray *images = [NSMutableArray array];
    
    AVAssetImageGeneratorCompletionHandler handler;                         // 5
    
    handler = ^(CMTime requestedTime,
                CGImageRef imageRef,
                CMTime actualTime,
                AVAssetImageGeneratorResult result,
                NSError *error) {
        
        if (result == AVAssetImageGeneratorSucceeded) {                     // 6
            UIImage *image = [UIImage imageWithCGImage:imageRef];
            id thumbnail =
            [THThumbnail thumbnailWithImage:image time:actualTime];
            [images addObject:thumbnail];
        } else {
            NSLog(@"Error: %@", [error localizedDescription]);
        }
        
        // If the decremented image count is at 0, we're all done.
        if (--imageCount == 0) {                                            // 7
            dispatch_async(dispatch_get_main_queue(), ^{
                NSString *name = THThumbnailsGeneratedNotification;
                NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
                [nc postNotificationName:name object:images];
            });
        }
    };
    
    [self.imageGenerator generateCGImagesAsynchronouslyForTimes:times       // 8
                                              completionHandler:handler];
}


#pragma mark - Housekeeping

- (UIView *)view {
    return self.playerView;
}

- (void)dealloc {
    if (self.itemEndObserver) {                                             // 5
        NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
        [nc removeObserver:self.itemEndObserver
                      name:AVPlayerItemDidPlayToEndTimeNotification
                    object:self.player.currentItem];
        self.itemEndObserver = nil;
    }
}

@end

```

这里说一下如何监听时间从而得知播放时间回调

### 监听时间

当播放器播放的时候我们无法得知播放到播放器的哪个位置,为了解决这个问题`AVPlayerItem`添加了两个监听播放的方法以及具体的用法`API`.

#### 定期监听

``` objc
- (id)addPeriodicTimeObserverForInterval:(CMTime)interval
                                   queue:(nullable dispatch_queue_t)queue
                              usingBlock:(void (^)(CMTime time))block;
```

这里主要是为了随着时间的变化移动播放器seek位置更新时间显示,通过`AVPlayer`的`addPeriodicTimeObserverForInterval:queue:usingBlock:` 来监听播放时间的变化

* `interv`_监听周期的间隔`CMTime`_
* `queue` _通知发送的顺序调度队列,一般我们都放在主线程回掉.(注意这里不能放在并行队列中)_
* `block` _指定周期的时间回调._


下面是示例代码


``` objc
- (void)addPlayerItemTimeObserver {
    
    // Create 0.5 second refresh interval - REFRESH_INTERVAL == 0.5
    CMTime interval =
    CMTimeMakeWithSeconds(REFRESH_INTERVAL, NSEC_PER_SEC);              // 1
    
    // Main dispatch queue
    dispatch_queue_t queue = dispatch_get_main_queue();                     // 2
    
    // Create callback block for time observer
    __weak PlayerController *weakSelf = self;                             // 3
    void (^callback)(CMTime time) = ^(CMTime time) {
        NSTimeInterval currentTime = CMTimeGetSeconds(time);
        NSTimeInterval duration = CMTimeGetSeconds(weakSelf.playerItem.duration);
        [weakSelf.transport setCurrentTime:currentTime duration:duration];  // 4
    };
    
    // Add observer and store pointer for future use
    self.timeObserver =                                                     // 5
    [self.player addPeriodicTimeObserverForInterval:interval
                                              queue:queue
                                         usingBlock:callback];
}
```


#### 边界监听

什么叫边界监听呢?就是播放器播放到某个时间的触发的 时间位置.

``` objc
- (id)addBoundaryTimeObserverForTimes:(NSArray<NSValue *> *)times
                                queue:(nullable dispatch_queue_t)queue
                           usingBlock:(void (^)(void))block;
```

* `times` _CMTime值组成一个`NSArray`,这里面定义的一个时间点的数组.eg: 25% 50% 75%等时间点._
* `queue` _通知发送的顺序调度队列,一般我们都放在主线程回掉.(注意这里不能放在并行队列中)_
* `block` _指定周期的时间回调._


### 显示字幕

`AVPlayerLayer`里有两个类来处理字幕

* AVMediaSelectionGroup
* AVMediaSelectionOption

`AVMediaSelectionOption` 用于表示`AVAsset`备用媒体显示.在前几篇中我讲过一个媒体元数据中有`音频轨`、`视频轨`、`字幕轨`,`备用相机角度`等.

我们如果想找出字幕的话需要用到`AVAsset`的`availableMediaCharacteristicsWithMediaSelectionOptions`属性.

``` objc
@property (nonatomic, readonly) NSArray<AVMediaCharacteristic> *availableMediaCharacteristicsWithMediaSelectionOptions NS_AVAILABLE(10_8, 5_0);
```

这个属性会返回一个数组的`字符串`,这些`字符串`用于表示保存在资源中可用选项的媒体特征,其实数组中包含的字符串的值为如下：

* AVMediaCharacteristicVisual 视频
* AVMediaCharacteristicAudible 音频
* AVMediaCharacteristicLegible 字幕或隐藏式字幕


``` objc

- (nullable AVMediaSelectionGroup *)mediaSelectionGroupForMediaCharacteristic:(AVMediaCharacteristic)mediaCharacteristic NS_AVAILABLE(10_8, 5_0);

```

请求可用媒体特性数据后,调用`AVAsset`的`mediaSelectionGroupForMediaCharacteristic:`方法.为其传递要检索的选项的特定媒体特征.这个方法返回一个`AVMediaSelectionGroup`,它作为一个或多个互斥的`AVMediaSelectionGroup`实例的容器.

``` objc
- (void)loadMediaOptions {
    NSString *mc = AVMediaCharacteristicLegible;                            // 1
    AVMediaSelectionGroup *group =
        [self.asset mediaSelectionGroupForMediaCharacteristic:mc];          // 2
    if (group) {
        NSMutableArray *subtitles = [NSMutableArray array];                 // 3
        for (AVMediaSelectionOption *option in group.options) {
            [subtitles addObject:option.displayName];
        }
        [self.transport setSubtitles:subtitles];                            // 4
    } else {
        [self.transport setSubtitles:nil];
    }
}
```




## AirPlay

AirPlay相信大部分iOS开发者都耳熟能详,这个东西是用于无线方式将流媒体音频/视频内容在`Apple TV`上播放.或者将纯音频内容在多种第三方音频系统中播放(如汽车中内置的CarPlay).如果大家有`Apple TV`或其它音频系统中的一个,就会觉得这个功能实在太实用了.其实把这个功能整合到我们的APP中十分容易.

`AVPlayer`有一个属性是`allowsExternalPlayback`,允许启用或者禁用`AirPlay`播放功能.该属性默认是`YES`,即在不做任何额外编码的情况下,播放器应用程序也会自动支持`AirPlay`功能.

``` objc
@property (nonatomic) BOOL allowsExternalPlayback NS_AVAILABLE(10_11, 6_0);
```

不过从iOS11之后才有专门针对AirPlay的framework功能API,在以前我们使用`Media Player`中的`MPVolumeView`来实现.

示例代码:

```
	MPVolumeView *volumeView = [[MPVolumeView alloc] init];
    volumeView.showsVolumeSlider = NO;
    [volumeView sizeToFit];
    [transportView addSubview:volumeView];
```

当AirPlay可用时,而且WIFI 网络启用时才会显示线路选择按钮.这两个条件只有一个不满足, MPVolumeView 就会自动隐藏按钮.



## 总结

本章讲述了 如何使用AVPlayer以及AVPlayerItem 的一些属性 监听播放进度回调,取 字幕等等.

[详细demo请参考](https://github.com/sunyazhou13/Learning-AV-Foundation-Demos)