---
layout: post
title: Learning AV Foundation(三)AVAudioRecorder
date: 2017-03-28 09:40:18
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
---

![](/assets/images/20170328LearningAVFoundationAVAudioRecorder/cover.avif)

前言
--

在`AV Foundation`中使用`AVAudioRecorder`类添加音频录制功能和使用`AVAudioPlayer`一样简单, 都是在`Audio Queue Server`上层构建的.同时支持`macOS`和`iOS`平台.可以从内置麦克风录制音频,也可以支持数字音频接口或USB外接麦克风录制.


主要内容如下:
--
    如何创建AVAudioRecorder  
        1. 音频格式
        2. 采样率
        3. 通道数
    创建Demo
        1. 配置音频会话
        2. 实现录音功能
        3. 使用Audio Metering实现声波视觉显示
    

创建`AVAudioRecorder`之前先了解一下它的方法和成员变量

``` objc
@property (readonly, getter=isRecording) BOOL recording;//是否正在录音
@property (readonly) NSDictionary<NSString *, id> *settings;//录音配置：采样率、音频格式、通道数...
@property (readonly) NSURL *url;//录音文件存放URL
@property (readonly) NSTimeInterval currentTime;//录音时长
@property (getter=isMeteringEnabled) BOOL meteringEnabled;//是否监控声波
```

`AVAudioRecorder`的实例方法:

``` objc
- (BOOL)prepareToRecord;//为录音准备缓冲区
- (BOOL)record;//录音开始，暂停后调用会恢复录音
- (BOOL)recordAtTime:(NSTimeInterval)time;//在指定时间后开始录音
- (BOOL)recordForDuration:(NSTimeInterval) duration;//按指定时长录音
- (BOOL)recordAtTime:(NSTimeInterval)time 
         forDuration:(NSTimeInterval)duration;//上面2个的合体
- (void)pause; //暂停录音
- (void)stop; //停止录音
- (BOOL)deleteRecording;//删除录音，必须先停止录音再删除
```

`AVAudioRecorder`的代理方法:

``` objc
//录音完成后调用
- (void)audioRecorderDidFinishRecording:(AVAudioRecorder *)recorder 
                           successfully:(BOOL)flag;
//录音编码发生错误时调用
- (void)audioRecorderEncodeErrorDidOccur:(AVAudioRecorder *)recorder 
                                   error:(NSError *)error;
```

如何创建`AVAudioRecorder`
--

创建`AVAudioRecorder`对象所需要的参数如下:  

* 音频流录制时写入到本地的路径URL
* `settings`录音配置：采样率、音频格式、通道数...等键值参数字典
* 发生错误的`NSError`指针

如下代码:
  
``` objc
/**
 创建录音器
 */
- (void)createRecorder {
    NSString *directory = NSTemporaryDirectory();
    NSString *filePath = [directory stringByAppendingPathComponent:@"voice1.m4a"];
    NSURL *url = [NSURL fileURLWithPath:filePath];
    
    NSDictionary *setting = @{AVFormatIDKey : @(kAudioFormatMPEG4AAC),
                              AVSampleRateKey: @22050.0f,
                              AVNumberOfChannelsKey: @1};
    NSError *error;
    self.recorder = [[AVAudioRecorder alloc] initWithURL:url
                                                settings:setting
                                                   error:&error];
    if (self.recorder) {
        [self.recorder prepareToRecord];
    } else {
        NSLog(@"Recorder Create Error: %@", [error localizedDescription]);
    }
}
```

这里的建议调用`[self.recorder prepareToRecord]`方法对录音实例进行预设就像[上一章](http://sunyazhou.com/2017/03/17/Learning-AV-Foundation-AVAudioPlayer/)创建`AVAudioPlayer`类似.都是为了执行底层`Audio Queue`初始化的必要过程.这个`prepareToRecord`方法还在给定的URL参数指定的位置创建一个文件，这样就减少了录制启动时的延时

音频格式
--
`AVFormatIDKey`key指定录制格式,这里的除了`kAudioFormatMPEG4AAC`格式还有下面这些:
  
``` objc
CF_ENUM(AudioFormatID)
{
    kAudioFormatLinearPCM               = 'lpcm',
    kAudioFormatAC3                     = 'ac-3',
    kAudioFormat60958AC3                = 'cac3',
    kAudioFormatAppleIMA4               = 'ima4',
    kAudioFormatMPEG4AAC                = 'aac ',
    kAudioFormatMPEG4CELP               = 'celp',
    kAudioFormatMPEG4HVXC               = 'hvxc',
    kAudioFormatMPEG4TwinVQ             = 'twvq',
    kAudioFormatMACE3                   = 'MAC3',
    kAudioFormatMACE6                   = 'MAC6',
    kAudioFormatULaw                    = 'ulaw',
    kAudioFormatALaw                    = 'alaw',
    kAudioFormatQDesign                 = 'QDMC',
    kAudioFormatQDesign2                = 'QDM2',
    kAudioFormatQUALCOMM                = 'Qclp',
    kAudioFormatMPEGLayer1              = '.mp1',
    kAudioFormatMPEGLayer2              = '.mp2',
    kAudioFormatMPEGLayer3              = '.mp3',
    kAudioFormatTimeCode                = 'time',
    kAudioFormatMIDIStream              = 'midi',
    kAudioFormatParameterValueStream    = 'apvs',
    kAudioFormatAppleLossless           = 'alac',
    kAudioFormatMPEG4AAC_HE             = 'aach',
    kAudioFormatMPEG4AAC_LD             = 'aacl',
    kAudioFormatMPEG4AAC_ELD            = 'aace',
    kAudioFormatMPEG4AAC_ELD_SBR        = 'aacf',
    kAudioFormatMPEG4AAC_ELD_V2         = 'aacg',    
    kAudioFormatMPEG4AAC_HE_V2          = 'aacp',
    kAudioFormatMPEG4AAC_Spatial        = 'aacs',
    kAudioFormatAMR                     = 'samr',
    kAudioFormatAMR_WB                  = 'sawb',
    kAudioFormatAudible                 = 'AUDB',
    kAudioFormatiLBC                    = 'ilbc',
    kAudioFormatDVIIntelIMA             = 0x6D730011,
    kAudioFormatMicrosoftGSM            = 0x6D730031,
    kAudioFormatAES3                    = 'aes3',
    kAudioFormatEnhancedAC3             = 'ec-3'
};

```
这里的`kAudioFormatLinearPCM`会将为压缩的音频流写入到文件中,这就是原始数据,保真度最高,当然文件也最大, 选择ACC`kAudioFormatMPEG4AAC`或者AppleIMA4`kAudioFormatAppleLossless`等格式会显著缩小文件，还能保证音频质量.
> *注意:*
> *指定的音频格式一定要和文件写入的URL文件类型保持一致。如果录制xxx.wav文件格式 是 Waveform Audio File Format(WAVE)的格式要求,即 低字节序、 LinePCM。 如果`AVFormatIDKey`指定的值不是`kAudioFormatLinearPCM`则会发生错误。NSError 会返回如下错误*
> *The operation couldn't be completed. (OSState error 1718449215.)*

采样率
--

上边的代码里`AVSampleRateKey`用于定义录音器的采样率. **采样率定义了对输入的模拟音频信号每一秒内的采样数**. 如果使用**低采样率** 比如8kHz,会导致粗粒度、AM广播类型的录制效果, 不过文件会比较小; 使用**44.1kHz的采样率(CD质量的采样率)**会得到非常高质量的内容, 不过文件比较大. 至于使用什么样的采样率没有明确的定义. 不过开发者应该尽量使用**标准的采样率，比如: 8000Hz、16 000Hz(16kHz)、22050Hz(22.05kHz)或 44100Hz(44.1kHz)、当然还有48000Hz和96000Hz** ,(kHz代表千赫),超过48000或96000的采样对人耳已经没有意义.最终是我们的耳朵在进行判断.（[上一章](http://sunyazhou.com/2017/03/17/Learning-AV-Foundation-AVAudioPlayer/)说了 **人耳所能听到的声音，最低的频率是从20Hz起一直到最高频率20kHz**,录音最好采用 x 2 倍的频率）


通道数
--

`AVNumberOfChannelsKey`用于定义记录音频内容的通道数。**指定默认值1 意味着使用单声道录制**、**设置2意味着使用立体声录制**。除非使用外部硬件进行录制，否则同窗应该创建单声道录音。 这里的通道数是指 录制设备的输入数量 可以理解为 麦克风 内置 或者外接麦克风录制比如 插入Apple耳机 里面的麦克风。


> 以上是全面`AVAudioRecorder`的部分概念,`AVAudioRecorder`支持**无限时长录制**,还可以设置从**未来某一时间点开始录制**或**指定时长录制**


网络流媒体处理
--
    
`AVAudioPlayer`音频播放器只能播放本地文件，并且是一次性加载所有的音频数据，但我们有时候需要边下载边听怎么办？
`AVAudioPlayer`是不支持这种网络流媒体形式的音频播放，要播放这种网络流媒体，我们需要使用`AudioToolbox`框架的音频队列服务`Audio Queue Services`。

__音频队列服务分为3个部分:__
> * 3个缓冲器
> * 1个缓冲队列
> * 1个回调

**1. 下面是录音的音频队列服务的工作原理:**

![](/assets/images/20170328LearningAVFoundationAVAudioRecorder/QueueServiceRecord.avif)

**2. 下面是播放音频的音频队列服务的工作原理;**

![](/assets/images/20170328LearningAVFoundationAVAudioRecorder/QueueServicePlay.avif)

当然处理这些不需要我们自己去写C语言函数实现 有个开源库[FreeStreamer](https://github.com/sunyazhou13/FreeStreamer)

FreeStreamer使用 

``` objc 
#import <FreeStreamer/FreeStreamer.h>

- (void)viewDidLoad {
    [super viewDidLoad];
    [self initAudioStream];
    //播放网络流媒体音频
    [self.audioStream play];
}
/* 初始化网络流媒体对象 */
- (void)initAudioStream{
    NSString *urlStr = @"http://sc1.111ttt.com/2016/1/02/24/195242042236.mp3";
    NSURL *url = [NSURL URLWithString:urlStr];
    //创建FSAudioStream对象
    self.audioStream = [[FSAudioStream alloc] initWithUrl:url];
    //设置播放错误回调Block
    self.audioStream.onFailure = ^(FSAudioStreamError error, NSString *description){
          NSLog(@"播放过程中发生错误，错误信息：%@",description);
    };
    //设置播放完成回调Block
    self.audioStream.onCompletion = ^(){
          NSLog(@"播放完成!");
    };
    [self.audioStream setVolume:0.5];//设置声音大小
}
```
有点跑远了 回到正题 本章将不会把这个写到demo中 请谅解


下面我们来写个`AVAudioRecorder`的Demo 完成上述功能
==

配置会话
--

首先创建以一个AVAudioRecorderDemo工程iOS平台这些相信大家非常熟练了.


在`AppDelegate`里面导入`#import <AVFoundation/AVFoundation.h>` 
写上设置如下代码

``` objc
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    
    AVAudioSession *session = [AVAudioSession sharedInstance];
    NSError *error;
    if (![session setCategory:AVAudioSessionCategoryPlayAndRecord error:&error]) {
        NSLog(@"Category Error: %@",[error localizedDescription]);
    }
    
    //激活会话
    if (![session setActive:YES error:&error]) {
        NSLog(@"Activation Error: %@",[error localizedDescription]);
    }
    
    return YES;
}
```


这`AVAudioSessionCategoryPlayAndRecord`是[上一章](http://sunyazhou.com/2017/03/17/Learning-AV-Foundation-AVAudioPlayer/)说的那几种Category,我们需要__录音+播放__功能

下一步 配置 plist文件访问权限信息 可以参考[Access privacy-sensitive data](http://localhost:4000/2017/03/20/Access-privacy-sensitive-data-private-access-permission/)这篇文章把访问权限需要的 信息填充上.

![plist1](/assets/images/20170328LearningAVFoundationAVAudioRecorder/FillInfo.avif)

然后选择SourceCode 
![plist2](/assets/images/20170328LearningAVFoundationAVAudioRecorder/SourceCode.avif)

填写上

``` xml
<!-- 🎤 Microphone -->
<key>NSMicrophoneUsageDescription</key>
<string>$(PRODUCT_NAME) microphone use</string>
```
上边这些是为了访问本地授权, 记得授权如果第一次被拒就必须让用户手动 到通用-设置里面去配置否则将永远不好使哈。如果不写这种本地授权 程序应该会 crash   

录音代码实现
--

首先我们来封装一个类起名叫`BDRecoder`吧. 这里类我们让它负责所有 音频录制、暂停录制、保存录制文件等功能 并有回调函数等block.  `BDRecoder.h`看起来像下面这样, 这里后续完善的话可以加个代理 表示录制过程中意外中断或者线路切换等逻辑.

``` objc
//
//  BDRecorder.h
//  AVAudioRecorderDemo
//
//  Created by sunyazhou on 2017/3/29.
//  Copyright © 2017年 Baidu, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

@class MemoModel;
//录音停止的回调
typedef void (^BDRecordingStopCompletionHanlder)(BOOL);
//保存录音文件完成的回调
typedef void (^BDRecordingSaveCompletionHanlder)(BOOL, id);

@interface BDRecorder : NSObject

/**
 * 外部获取当前录制的时间
 * 小时:分钟:秒  当然后续可以加微秒和毫秒哈就是格式字符串 00:03:02 这样
 */
@property (nonatomic, readonly) NSString *formattedCurrentTime;

- (BOOL)record; //开始录音

- (void)pause;  //暂停录音

- (void)stopWithCompletionHandler:(BDRecordingStopCompletionHanlder)handler;

- (void)saveRecordingWithName:(NSString *)name
            completionHandler:(BDRecordingSaveCompletionHanlder)handler;

/**
 回放录制的文件

 @param memo 备忘录文件model 放着当前播放的model
 @return 是否播放成功
 */
- (BOOL)playbackURL:(MemoModel *)memo;
@end

```

`BDRecoder.m`

``` objc
//
//  BDRecorder.m
//  AVAudioRecorderDemo
//
//  Created by sunyazhou on 2017/3/29.
//  Copyright © 2017年 Baidu, Inc. All rights reserved.
//

#import "BDRecorder.h"

#import "MemoModel.h"

@interface BDRecorder () <AVAudioRecorderDelegate>

@property (nonatomic, strong) AVAudioPlayer *player;
@property (nonatomic, strong) AVAudioRecorder *recorder;
@property (nonatomic, strong) BDRecordingStopCompletionHanlder completionHandler;

@end

@implementation BDRecorder

- (instancetype)init {
    self = [super init];
    if (self) {
        NSString *temDir = NSTemporaryDirectory();
        NSString *filePath = [temDir stringByAppendingPathComponent:@"test1.caf"];
        NSURL *fileURL = [NSURL fileURLWithPath:filePath];
        
        NSDictionary *setting = @{AVFormatIDKey: @(kAudioFormatAppleIMA4),
                                  AVSampleRateKey: @44100.0f,
                                  AVNumberOfChannelsKey: @1,
                                  AVEncoderBitDepthHintKey: @16,
                                  AVEncoderAudioQualityKey: @(AVAudioQualityMedium)
                                  };
        NSError *error;
        self.recorder = [[AVAudioRecorder alloc] initWithURL:fileURL settings:setting error:&error];
        if (self.recorder) {
            self.recorder.delegate = self;
            [self.recorder prepareToRecord];
        } else {
            NSLog(@"Create Recorder Error: %@",[error localizedDescription]);
        } 
    }
    return self;
}

- (BOOL)record {
    return [self.recorder record];
}

- (void)pause {
    [self.recorder pause];
}

- (void)stopWithCompletionHandler:(BDRecordingStopCompletionHanlder)handler {
    self.completionHandler = handler;
    [self.recorder stop];
}

- (void)saveRecordingWithName:(NSString *)name
            completionHandler:(BDRecordingSaveCompletionHanlder)handler {
    NSTimeInterval timestamp = [NSDate timeIntervalSinceReferenceDate];
    NSString *filename = [NSString stringWithFormat:@"%@-%f.caf", name, timestamp];
    NSString *docDir = [self documentsDirectory];
    NSString *destPath = [docDir stringByAppendingPathComponent:filename];
    NSURL *srcURL = self.recorder.url;
    NSURL *destURL = [NSURL fileURLWithPath:destPath];
    NSError *error;
    BOOL success = [[NSFileManager defaultManager] copyItemAtURL:srcURL toURL:destURL error:&error];
    if (success) {
        MemoModel *model = [MemoModel memoWithTitle:name url:destURL];
        handler(YES, model);
    }
    
    
}

- (NSString *)documentsDirectory {
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    return [paths objectAtIndex:0];
}

- (void)audioRecorderDidFinishRecording:(AVAudioRecorder *)recorder
                           successfully:(BOOL)flag {
    if (self.completionHandler) { self.completionHandler(flag); }
}

@end

```
这里的`self.completionHandler`当外部调用`stopWithCompletionHandler`的时候暂存一下block是为了录音完成时告诉外部通知一下以便于可以弹出一个UIAlertView去显示保存等操作


当停止录音, 进入语音备忘阶段命名阶段时 让外部调用`saveRecordingWithName:completionHandler `传入文件的命名,然后我们通过`self.recorder.url`获取到URL并且copy到tmp里面是目录并命名


下一步要实现`playbackURL:` 这里面有个`MemoModel`参数的对象,
这个`MemoModel`是一个对象model放着 文件name、url...

``` objc
#import <Foundation/Foundation.h>

@interface MemoModel : NSObject <NSCopying>
@property (copy, nonatomic, readonly) NSString *title;
@property (strong, nonatomic, readonly) NSURL *url;
@property (copy, nonatomic, readonly) NSString *dateString;
@property (copy, nonatomic, readonly) NSString *timeString;

+ (instancetype)memoWithTitle:(NSString *)title url:(NSURL *)url;

- (BOOL)deleteMemo;
@end
//具体实现请参考我的最终demo
```

实现播放部分需要创建播放器 这里就简单创建一下`AVAudioPlayer`

``` objc 
/**
 回放录制的文件
 
 @param memo 备忘录文件model 放着当前播放的model
 @return 是否播放成功
 */
- (BOOL)playbackURL:(MemoModel *)memo {
    [self.player stop];
    self.player = [[AVAudioPlayer alloc] initWithContentsOfURL:memo.url error:nil];
    if (self.player) {
        [self.player prepareToPlay];
        return YES;
    }
    return NO;
}
```

这里通过memo.url 给当前播放器播放, 这里就简单实现一下 如果需要复杂实现可以参考我上一章讲解的`AVAudioPlayer` 

最后把显示事件部分的代码加上

``` objc 
/**
 * 外部获取当前录制的时间
 * 小时:分钟:秒  当然后续可以加微秒和毫秒哈就是格式字符串 00:03:02 这样
 */
@property (nonatomic, readonly) NSString *formattedCurrentTime;

```

这里我们需要复写`formattedCurrentTime`get方法获取时间格式例如: 00:00:00


``` objc
/**
 返回当前录制的时间格式 HH:mm:ss

 @return 返回组装好的字符串
 */
- (NSString *)formattedCurrentTime {
    NSUInteger time = (NSUInteger)self.recorder.currentTime;
    NSInteger hours = (time / 3600);
    NSInteger minutes = (time / 60) % 60;
    NSInteger seconds = time % 60;
    
    NSString *format = @"%02i:%02i:%02i";
    return [NSString stringWithFormat:format, hours, minutes, seconds];
}
```
上边大致是封装`BDRecorder`的过程

下面是对`ViewController`UI的设置, 设置好时间格式 我们需要在`ViewController`里 自己搞个定时器去更新录制的时间在UI上的显示, 因为`self.recorder.currentTime`是只读熟悉 没提供set方法 所以我们也无法用KVO监听recorder的属性变化. 

代码如下:

``` objc
//
//  ViewController.m
//  AVAudioRecorderDemo
//
//  Created by sunyazhou on 2017/3/28.
//  Copyright © 2017年 Baidu, Inc. All rights reserved.
//

#import "ViewController.h"

#import <Masonry/Masonry.h>
#import <AVFoundation/AVFoundation.h>

#import "BDRecorder.h"
#import "LevelMeterView.h"
#import "MemoModel.h"
#import "MemoCell.h"
#import "LevelPair.h"

#define MEMOS_ARCHIVE    @"memos.archive"

@interface ViewController () <UITableViewDelegate, UITableViewDataSource>

@property (nonatomic, strong) NSMutableArray <MemoModel *>*memos;
@property (nonatomic, strong) BDRecorder *recorder;

@property (nonatomic, strong) NSTimer *timer;
@property (nonatomic, strong) CADisplayLink *levelTimer;


@property (weak, nonatomic) IBOutlet UIView *containerView;
@property (weak, nonatomic) IBOutlet UIButton *recordButton;
@property (weak, nonatomic) IBOutlet UIButton *stopButton;
@property (weak, nonatomic) IBOutlet UILabel *timeLabel;
@property (weak, nonatomic) IBOutlet LevelMeterView *levelMeterView;
@property (weak, nonatomic) IBOutlet UITableView *tableview;



@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    self.recorder = [[BDRecorder alloc] init];
    self.memos = [NSMutableArray array];
    self.stopButton.enabled = NO;
    
    UIImage *recordImage = [[UIImage imageNamed:@"record"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
    UIImage *pauseImage = [[UIImage imageNamed:@"pause"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
    UIImage *stopImage = [[UIImage imageNamed:@"stop"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
    [self.recordButton setImage:recordImage forState:UIControlStateNormal];
    [self.recordButton setImage:pauseImage forState:UIControlStateSelected];
    [self.stopButton setImage:stopImage forState:UIControlStateNormal];
    
    NSData *data = [NSData dataWithContentsOfURL:[self archiveURL]];
    if (!data) {
        _memos = [NSMutableArray array];
    } else {
        _memos = [NSKeyedUnarchiver unarchiveObjectWithData:data];
    }
    
    
    [self.tableview registerNib:[UINib nibWithNibName:@"MemoCell" bundle:[NSBundle mainBundle]] forCellReuseIdentifier:@"MemoCell"];
    
    
    [self layoutSubveiws];
}

- (void)layoutSubveiws{
    [self.containerView mas_makeConstraints:^(MASConstraintMaker *make) {
        make.top.equalTo(self.view.mas_top).offset(30);
        make.left.equalTo(self.view.mas_left).offset(20);
        make.right.equalTo(self.view.mas_right).offset(-20);
        make.centerX.equalTo(self.view.mas_centerX);
        make.bottom.equalTo(self.tableview.mas_top).offset(-50);
    }];
    
    [self.tableview mas_makeConstraints:^(MASConstraintMaker *make) {
        make.left.right.bottom.equalTo(self.view);
        make.top.equalTo(self.view.mas_top).offset(200);
    }];
    
    
    [self.timeLabel mas_makeConstraints:^(MASConstraintMaker *make) {
        make.top.left.right.equalTo(self.containerView);
        make.centerX.equalTo(self.containerView.mas_centerX);
        make.height.equalTo(@25);
    }];
    
    [self.recordButton mas_makeConstraints:^(MASConstraintMaker *make) {
        make.left.equalTo(self.containerView.mas_left);
        make.bottom.equalTo(self.containerView.mas_bottom);
        make.width.height.equalTo(@71);
    }];
    
    [self.stopButton mas_makeConstraints:^(MASConstraintMaker *make) {
        make.right.equalTo(self.containerView.mas_right);
        make.bottom.equalTo(self.containerView.mas_bottom);
        make.width.height.equalTo(@71);
    }];
    
    [self.levelMeterView mas_makeConstraints:^(MASConstraintMaker *make) {
        make.left.right.equalTo(self.view);
        make.height.equalTo(@30);
        make.bottom.equalTo(self.tableview.mas_top);
    }];
}


- (void)startTimer {
    [self.timer invalidate];
    self.timer = [NSTimer timerWithTimeInterval:0.5
                                         target:self
                                       selector:@selector(updateTimeDisplay)
                                       userInfo:nil
                                        repeats:YES];
    [[NSRunLoop mainRunLoop] addTimer:self.timer forMode:NSRunLoopCommonModes];
}

- (void)stopTimer {
    [self.timer invalidate];
    self.timer = nil;
}

- (void)updateTimeDisplay {
    self.timeLabel.text = self.recorder.formattedCurrentTime;
}

- (void)startMeterTimer {
    [self.levelTimer invalidate];
    self.levelTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateMeter)];
//    if ([self.levelTimer respondsToSelector:@selector(setPreferredFramesPerSecond:)]) {
//        self.levelTimer.preferredFramesPerSecond = 5;
//    } else {
    self.levelTimer.frameInterval = 5;
//    }
    [self.levelTimer addToRunLoop:[NSRunLoop currentRunLoop]
                          forMode:NSRunLoopCommonModes];
    
}


- (void)stopMeterTimer {
    [self.levelTimer invalidate];
    self.levelTimer = nil;
    [self.levelMeterView resetLevelMeter];
}

- (void)updateMeter {
    LevelPair *levels = [self.recorder levels];
    self.levelMeterView.level = levels.level;
    self.levelMeterView.peakLevel = levels.peakLevel;
    [self.levelMeterView setNeedsDisplay];
    
}

#pragma mark -
#pragma mark - UITableViewDelegate
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return self.memos.count;
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    MemoCell *cell = [tableView dequeueReusableCellWithIdentifier:@"MemoCell"];
    cell.model = self.memos[indexPath.row];
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath{
    MemoModel *model = self.memos[indexPath.row];
    [self.recorder playbackURL:model];
}

- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)indexPath {
    return YES;
}

- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath {
    if (editingStyle == UITableViewCellEditingStyleDelete) {
        MemoModel *memo = self.memos[indexPath.row];
        [memo deleteMemo];
        [self.memos removeObjectAtIndex:indexPath.row];
        [self saveMemos];
        [tableView deleteRowsAtIndexPaths:@[indexPath] withRowAnimation:UITableViewRowAnimationAutomatic];
    }
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath {
    return 80;
}
#pragma mark - event response 所有触发的事件响应 按钮、通知、分段控件等
- (IBAction)record:(UIButton *)sender {
    self.stopButton.enabled = YES;
    if ([sender isSelected]) {
        [self stopMeterTimer];
        [self stopTimer];
        [self.recorder pause];
    } else {
        [self startMeterTimer];
        [self startTimer];
        [self.recorder record];
    }
    [sender setSelected:![sender isSelected]];
}

- (IBAction)stopRecording:(UIButton *)sender {
    [self stopMeterTimer];
    self.recordButton.selected = NO;
    self.stopButton.enabled = NO;
    [self.recorder stopWithCompletionHandler:^(BOOL result) {
        double delayInSeconds = 0.01;
        dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t) (delayInSeconds * NSEC_PER_SEC));
        dispatch_after(popTime, dispatch_get_main_queue(), ^{
            [self showSaveDialog];
        });
    }];
}


- (void)showSaveDialog {
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:@"保存录音" message:@"输入名称" preferredStyle:UIAlertControllerStyleAlert];
    [alertController addTextFieldWithConfigurationHandler:^(UITextField * _Nonnull textField) {
       textField.placeholder = @"我的录音";
    }];
    UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:nil];
    UIAlertAction *okAction = [UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
        NSString *filename = [alertController.textFields.firstObject text];
        [self.recorder saveRecordingWithName:filename completionHandler:^(BOOL success, id object) {
            if (success) {
                [self.memos insertObject:object atIndex:0];
                [self saveMemos];
                [self.tableview reloadData];
            } else {
                NSLog(@"Error saving file: %@", [object localizedDescription]);
            }
        }];
    }];
    [alertController addAction:cancelAction];
    [alertController addAction:okAction];
    
    [self presentViewController:alertController animated:YES completion:nil];
}

#pragma mark - Memo Archiving
//保存备忘录model  这里简单用归档的方式存储一下

- (void)saveMemos {
    NSData *fileData = [NSKeyedArchiver archivedDataWithRootObject:self.memos];
    [fileData writeToURL:[self archiveURL] atomically:YES];
}

//存储归档的路径
- (NSURL *)archiveURL {
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *docsDir = [paths objectAtIndex:0];
    NSString *archivePath = [docsDir stringByAppendingPathComponent:MEMOS_ARCHIVE];
    return [NSURL fileURLWithPath:archivePath];
}



- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


@end

```


代码稍稍有点长  我简单说一下 大家可以参照最终的demo

``` objc 
@property (nonatomic, strong) NSMutableArray <MemoModel *>*memos;
@property (nonatomic, strong) BDRecorder *recorder;

```
声明一个数组 存放需要播放的model对象信息 名称 文件url、日期等

``` objc
@property (nonatomic, strong) NSTimer *timer;
@property (nonatomic, strong) CADisplayLink *levelTimer;
```

一个timer用于 刷新录制时间 
`levelTimer`用于刷新录制的视波图也叫`Audio Metering`对音频进行计量

在`BDRecorder`中增加了

``` objc
- (LevelPair *)levels {
    [self.recorder updateMeters];
    float avgPower = [self.recorder averagePowerForChannel:0];
    float peakPower = [self.recorder peakPowerForChannel:0];
    float linearLevel = [self.meterTable valueForPower:avgPower];
    float linearPeak = [self.meterTable valueForPower:peakPower];
    return [LevelPair levelsWithLevel:linearLevel peakLevel:linearPeak];
}
```
这两个方法
       1. averagePowerForChannel取出波谷平均值
       2. peakPowerForChannel取出波峰 
两个方法都会返回一个用于表示声音分贝(dB)等级的浮点值. 这个值的表示范围`0dB(fullscale) ~ -160dB` 0dB最大  -160dB最小

**开启音频计量 (需要在`BDRecorder`中开启, 如下代码) 会带来很多额外的开销，但我觉得还是很划算的 毕竟要显示视觉效果才是王道. 
如果`meteringEnabled`开启则音频录音器就会对捕捉到的音频样本进行分贝计算。**

**开启音频计量(Audio Metering)方法:**

``` objc
self.recorder.meteringEnabled = YES;
```

更新前调用了如下代码

``` objc 
- (LevelPair *)levels {
    [self.recorder updateMeters];
    ...
}
```

每当读取值之前需要调用`[self.recorder updateMeters]`方法才能获取到最新值，否则可能获取的不够精确

然后 使用`MeterTable`类 声明的函数`valueForPower:` 把上边两个阀值 转成线性运算

**就是分贝值从对数形式的`-160 ~ 0`范围转换为线性0到1的形式.**

``` objc 
//
//  MeterTable.m
//  AVAudioRecorderDemo
//
//  Created by sunyazhou on 2017/4/5.
//  Copyright © 2017年 Baidu, Inc. All rights reserved.
//

#import "MeterTable.h"


#define MIN_DB -60.0f
#define TABLE_SIZE 300

@implementation MeterTable {
    float _scaleFactor;
    NSMutableArray *_meterTable;
}

- (id)init {
    self = [super init];
    if (self) {
        float dbResolution = MIN_DB / (TABLE_SIZE - 1);
        
        _meterTable = [NSMutableArray arrayWithCapacity:TABLE_SIZE];
        _scaleFactor = 1.0f / dbResolution;
        
        float minAmp = dbToAmp(MIN_DB);
        float ampRange = 1.0 - minAmp;
        float invAmpRange = 1.0 / ampRange;
        
        for (int i = 0; i < TABLE_SIZE; i++) {
            float decibels = i * dbResolution;
            float amp = dbToAmp(decibels);
            float adjAmp = (amp - minAmp) * invAmpRange;
            _meterTable[i] = @(adjAmp);
        }
    }
    return self;
}

float dbToAmp(float dB) {
    return powf(10.0f, 0.05f * dB);
}

- (float)valueForPower:(float)power {
    if (power < MIN_DB) {
        return 0.0f;
    } else if (power >= 0.0f) {
        return 1.0f;
    } else {
        int index = (int) (power * _scaleFactor);
        return [_meterTable[index] floatValue];
    }
}

@end

```

> **这个类创建了一个数组`_meterTable`保存从计算前的分贝数到使用一定级别分贝解析之后的转换结果, 这里使用的解析率`-0.2dB`, 解析等级可以通过`MIN_DB` `TABLE_SIZE`这两个宏的值来修改,每个分贝值都调用`dbToAmp:`函数转换为线性范围内的值,使其处于`0(-60dB) ~ 1()`范围内, 之后由这些范围内的值构成平行曲线,开平方计算并保存到内部查找表格中. 然后如果外部需要可以调用`valueForPower:`来获取.**



然后保存到`LevelPair`的实例对象返回 这个实例很简单存放两个值一个`level`一个`peakLevel`

``` objc 
@interface LevelPair : NSObject
@property (nonatomic, readonly) float level;
@property (nonatomic, readonly) float peakLevel;

+ (instancetype)levelsWithLevel:(float)level peakLevel:(float)peakLevel;

- (instancetype)initWithLevel:(float)level peakLevel:(float)peakLevel;

@end
```

在`ViewController`中显示相关的UI 

``` objc
- (void)startTimer {
    [self.timer invalidate];
    self.timer = [NSTimer timerWithTimeInterval:0.5
                                         target:self
                                       selector:@selector(updateTimeDisplay)
                                       userInfo:nil
                                        repeats:YES];
    [[NSRunLoop mainRunLoop] addTimer:self.timer forMode:NSRunLoopCommonModes];
}

- (void)stopTimer {
    [self.timer invalidate];
    self.timer = nil;
}

- (void)updateTimeDisplay {
    self.timeLabel.text = self.recorder.formattedCurrentTime;
}

- (void)startMeterTimer {
    [self.levelTimer invalidate];
    self.levelTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateMeter)];
//    if ([self.levelTimer respondsToSelector:@selector(setPreferredFramesPerSecond:)]) {
//        self.levelTimer.preferredFramesPerSecond = 5;
//    } else {
    self.levelTimer.frameInterval = 5;
//    }
    [self.levelTimer addToRunLoop:[NSRunLoop currentRunLoop]
                          forMode:NSRunLoopCommonModes];
    
}


- (void)stopMeterTimer {
    [self.levelTimer invalidate];
    self.levelTimer = nil;
    [self.levelMeterView resetLevelMeter];
}

- (void)updateMeter {
    LevelPair *levels = [self.recorder levels];
    self.levelMeterView.level = levels.level;
    self.levelMeterView.peakLevel = levels.peakLevel;
    [self.levelMeterView setNeedsDisplay];
    
}

```
用于定时器的处理

事件的相关响应

``` objc
#pragma mark - event response 所有触发的事件响应 按钮、通知、分段控件等
- (IBAction)record:(UIButton *)sender {
    self.stopButton.enabled = YES;
    if ([sender isSelected]) {
        [self stopMeterTimer];
        [self stopTimer];
        [self.recorder pause];
    } else {
        [self startMeterTimer];
        [self startTimer];
        [self.recorder record];
    }
    [sender setSelected:![sender isSelected]];
}

- (IBAction)stopRecording:(UIButton *)sender {
    [self stopMeterTimer];
    self.recordButton.selected = NO;
    self.stopButton.enabled = NO;
    [self.recorder stopWithCompletionHandler:^(BOOL result) {
        double delayInSeconds = 0.01;
        dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t) (delayInSeconds * NSEC_PER_SEC));
        dispatch_after(popTime, dispatch_get_main_queue(), ^{
            [self showSaveDialog];
        });
    }];
}

```

这里保存数据使用的是归档方式




`BDRecorder`没有 处理意外中断等情况 比如外接麦克风 和音频意外来电等，如果需要处理 就可以在`BDRecorder`中声明几个代理监听音频回话的那几个通知就可以了 这里出于学习为目的就简单写到这里吧，如果大家需求强烈我可以回头补上并开源。



很多人纠结如何根据波形绘制更好的图 我这里是借助本书作者的demo完成相关波形处理的视图。

``` objc 
#import "LevelMeterView.h"

#import "LevelMeterColorThreshold.h"

@interface LevelMeterView ()

@property (nonatomic) NSUInteger ledCount;
@property (strong, nonatomic) UIColor *ledBackgroundColor;
@property (strong, nonatomic) UIColor *ledBorderColor;
@property (nonatomic, strong) NSArray *colorThresholds;

@end

@implementation LevelMeterView

- (id)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        [self setupView];
    }
    return self;
}

- (id)initWithCoder:(NSCoder *)coder {
    self = [super initWithCoder:coder];
    if (self) {
        [self setupView];
    }
    return self;
}

- (void)setupView {
    
    self.backgroundColor = [UIColor clearColor];
    
    _ledCount = 20;
    
    _ledBackgroundColor = [UIColor colorWithWhite:0.0f alpha:0.35f];
    _ledBorderColor = [UIColor blackColor];
    
    UIColor *greenColor = [UIColor colorWithRed:0.458 green:1.000 blue:0.396 alpha:1.000];
    UIColor *yellowColor = [UIColor colorWithRed:1.000 green:0.930 blue:0.315 alpha:1.000];
    UIColor *redColor = [UIColor colorWithRed:1.000 green:0.325 blue:0.329 alpha:1.000];
    
    _colorThresholds = @[[LevelMeterColorThreshold colorThresholdWithMaxValue:0.5 color:greenColor name:@"green"],
                         [LevelMeterColorThreshold colorThresholdWithMaxValue:0.8 color:yellowColor name:@"yellow"],
                         [LevelMeterColorThreshold colorThresholdWithMaxValue:1.0 color:redColor name:@"red"]];
}

- (void)drawRect:(CGRect)rect {
    
    CGContextRef context = UIGraphicsGetCurrentContext();
    
    CGContextTranslateCTM(context, 0, CGRectGetHeight(self.bounds));
    CGContextRotateCTM(context, (CGFloat) -M_PI_2);
    CGRect bounds = CGRectMake(0., 0., [self bounds].size.height, [self bounds].size.width);
    
    
    CGFloat lightMinValue = 0.0f;
    
    NSInteger peakLED = -1;
    
    if (self.peakLevel > 0.0f) {
        peakLED = self.peakLevel * self.ledCount;
        if (peakLED >= self.ledCount) {
            peakLED = self.ledCount - 1;
        }
    }
    
    for (int ledIndex = 0; ledIndex < self.ledCount; ledIndex++) {
        
        UIColor *ledColor = [self.colorThresholds[0] color];
        
        CGFloat ledMaxValue = (CGFloat) (ledIndex + 1) / self.ledCount;
        
        for (int colorIndex = 0; colorIndex < self.colorThresholds.count - 1; colorIndex++) {
            LevelMeterColorThreshold *currThreshold = self.colorThresholds[colorIndex];
            LevelMeterColorThreshold *nextThreshold = self.colorThresholds[colorIndex + 1];
            if (currThreshold.maxValue <= ledMaxValue) {
                ledColor = nextThreshold.color;
            }
        }
        
        CGFloat height = CGRectGetHeight(bounds);
        CGFloat width = CGRectGetWidth(bounds);
        
        CGRect ledRect = CGRectMake(0.0f, height * ((CGFloat) ledIndex / self.ledCount), width, height * (1.0f / self.ledCount));
        
        // Fill background color
        CGContextSetFillColorWithColor(context, self.ledBackgroundColor.CGColor);
        CGContextFillRect(context, ledRect);
        
        // Draw Light
        CGFloat lightIntensity;
        if (ledIndex == peakLED) {
            lightIntensity = 1.0f;
        } else {
            lightIntensity = clamp((self.level - lightMinValue) / (ledMaxValue - lightMinValue));
        }
        
        UIColor *fillColor = nil;
        if (lightIntensity == 1.0f) {
            fillColor = ledColor;
        } else if (lightIntensity > 0.0f) {
            CGColorRef color = CGColorCreateCopyWithAlpha([ledColor CGColor], lightIntensity);
            fillColor = [UIColor colorWithCGColor:color];
            CGColorRelease(color);
        }
        
        CGContextSetFillColorWithColor(context, fillColor.CGColor);
        UIBezierPath *fillPath = [UIBezierPath bezierPathWithRoundedRect:ledRect cornerRadius:2.0f];
        CGContextAddPath(context, fillPath.CGPath);
        
        // Stroke border
        CGContextSetStrokeColorWithColor(context, self.ledBorderColor.CGColor);
        UIBezierPath *strokePath = [UIBezierPath bezierPathWithRoundedRect:CGRectInset(ledRect, 0.5, 0.5) cornerRadius:2.0f];
        CGContextAddPath(context, strokePath.CGPath);
        
        CGContextDrawPath(context, kCGPathFillStroke);
        
        lightMinValue = ledMaxValue;
    }
}

CGFloat clamp(CGFloat intensity) {
    if (intensity < 0.0f) {
        return 0.0f;
    } else if (intensity >= 1.0) {
        return 1.0f;
    } else {
        return intensity;
    }
}

- (void)resetLevelMeter {
    self.level = 0.0f;
    self.peakLevel = 0.0f;
    [self setNeedsDisplay];
}


@end
```
这里给出了level和peak的阀值 有很多第三方开源的view大家可以自行研究一下 很简单 就是把相关阀值量化的过程。



总结
--
`AVAudioRecorder` 的学习还算完整的搞完了,随时记录一下学习内容和技术知识。

![](/assets/images/20170328LearningAVFoundationAVAudioRecorder/FinalDemo.avif)

__最终[Demo](https://github.com/sunyazhou13/AVAudioRecorderDemo)__

欢迎大家指正错误 全文完