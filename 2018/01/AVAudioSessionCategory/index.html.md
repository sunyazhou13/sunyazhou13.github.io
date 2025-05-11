---
layout: post
title: AVAudioSession-Category各种姿势
date: 2018-01-12 10:32:18
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
---

![AVAudioSession](/assets/images/20180112AVAudioSessionCategory/ASPGIntro.webp)
# 前言


2018新年第一篇, 梳理`AVAudioSession`的`Category`,解决音频开发中的各种播放被打断或者首次启动时无声音的问题


## 开篇

由于`iOS`系统的特殊性,所有`App`共用一个`AVAudioSession`所以这个会话是个单例对象.(`macOS`是支持同时播放多路音频文件)

当遇到`插拔耳机`,`接电话`,`调起 siri`,等等,就出现音频会话被系统时间打断等行为表现:

* 是进行录音还是播放？
* 当系统静音键按下时该如何表现？
* 是从扬声器还是从听筒里面播放声音？
* 插拔耳机后如何表现？
* 来电话/闹钟响了后如何表现？
* 其他音频App启动后如何表现？


### Session默认行为

* 可以进行播放，但是不能进行录制。
* 当用户将手机上的静音拨片拨到“静音”状态时，此时如果正在播放音频，那么播放内容会被静音。
* 当用户按了手机的锁屏键或者手机自动锁屏了，此时如果正在播放音频，那么播放会静音并被暂停。
* 如果你的App在开始播放的时候，此时QQ音乐等其他App正在播放，那么其他播放器会被静音并暂停。

`AVAudioSession`默认的行为相当于设置了`Category`为`AVAudioSessionCategorySoloAmbient`

示例代码:

``` objc
- (void)configSession{	
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategorySoloAmbient error:&error];
    if (error) {
        NSLog(@"%@",error);
    }
}
```

### AVAudioSession

上边说了 这个类是个单例

``` objc
+ (AVAudioSession *)sharedInstance;
```

通过上边方法获得单例

虽然系统会在App启动的时候，激活这个唯一的`AVAudioSession`，但是最好还是在自己用的时候再次进行激活：

``` 
- (BOOL)setActive:(BOOL)active error:(NSError * _Nullable *)outError;
```
通过设置`active`为`YES`激活`Session`，设置为`NO`解除`Session`的激活状态。`BOOL`返回值表示是否成功，如果失败的话可以通过`NSError`的`error.localizedDescription`查看出错原因。

> 因为`AVAudioSession`会影响其他`App`的表现，当自己`App`的`Session`被激活，其他`App`的就会被解除激活.

__如何要让自己的`Session`解除激活后恢复其他`App Session`的激活状态呢?__

此时可以使用：

```
- (BOOL)setActive:(BOOL)active withOptions:(AVAudioSessionSetActiveOptions)options error:(NSError * _Nullable *)outError;
```

__这里的`options`传入`AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation`即可.__

当然，也可以通过`otherAudioPlaying`变量来提前判断当前是否有其他App在播放音频。

``` objc
NSLog(@"Current Category:%@", [AVAudioSession sharedInstance].category); //返回当前 category
```

``` sh
Current Category:AVAudioSessionCategorySoloAmbien
```

### 七大Category

下面介绍一下`AVAudioSession`非常重要的七种`Category`.

``` objc
#pragma mark -- Values for the category property --

AVF_EXPORT NSString *const AVAudioSessionCategoryAmbient;

AVF_EXPORT NSString *const AVAudioSessionCategorySoloAmbient;

AVF_EXPORT NSString *const AVAudioSessionCategoryPlayback;

AVF_EXPORT NSString *const AVAudioSessionCategoryRecord;

AVF_EXPORT NSString *const AVAudioSessionCategoryPlayAndRecord;

AVF_EXPORT NSString *const AVAudioSessionCategoryAudioProcessing NS_DEPRECATED_IOS(3_0, 10_0) __TVOS_PROHIBITED __WATCHOS_PROHIBITED;

AVF_EXPORT NSString *const AVAudioSessionCategoryMultiRoute NS_AVAILABLE_IOS(6_0);
```



`AVAudioSession`将使用音频的场景分成七大类，通过设置`Session`为不同的类别，可以控制：

* 当App激活Session的时候，是否会打断其他不支持混音的App声音
* 当用户触发手机上的“静音”键时或者锁屏时，是否相应静音
* 当前状态是否支持录音
* 当前状态是否支持播放
* 每个App启动时都会设置成上面说的默认状态，即其他App会被中断同时相应“静音”键的播放模式。通过下表可以细分每个类别的支持情况：

| 类别 | 当按“静音”或者锁屏是是否静音 | 是否引起不支持混音的App中断 | 是否支持录音和播放 |
| :------: | :------: | :------: | :------: |
| AVAudioSessionCategoryAmbient | 是 | 否 | 只支持播放 |
| AVAudioSessionCategoryAudioProcessing | N/A | 都不支持 | N/A |
| AVAudioSessionCategoryMultiRoute | 否 | 是 | 既可以录音也可以播放 |
| AVAudioSessionCategoryPlayAndRecord | 否 | 默认不引起 | 既可以录音也可以播放 |
| AVAudioSessionCategoryPlayback | 否 | 默认引起 | 只用于播放 |
| AVAudioSessionCategoryRecord | 否 | 是 | 只用于录音 |
| AVAudioSessionCategorySoloAmbient | 是 | 是 | 只用于播放 |


可以看到，其实默认的就是`AVAudioSessionCategorySoloAmbient`类别.  
从表中我们可以总结如下：  

* _`AVAudioSessionCategoryAmbient`:只用于播放音乐时，并且可以和QQ音乐同时播放，比如玩游戏的时候还想听QQ音乐的歌，那么把游戏播放背景音就设置成这种类别。同时，当用户锁屏或者静音时也会随着静音，这种类别基本使用所有App的背景场景。_

* _`AVAudioSessionCategoryAudioProcessing`:主要用于音频格式处理，一般可以配合AudioUnit进行使用._

* _`AVAudioSessionCategoryMultiRoute`:想象一个DJ用的App，手机连着HDMI到扬声器播放当前的音乐，然后耳机里面播放下一曲，这种常人不理解的场景，这个类别可以支持多个设备输入输出._

* _`AVAudioSessionCategoryPlayAndRecord`: 如果既想播放又想录制该用什么模式呢？比如VoIP，打电话这种场景，PlayAndRecord就是专门为这样的场景设计的._

* _`AVAudioSessionCategoryPlayback`:如果锁屏了还想听声音怎么办？用这个类别，比如App本身就是播放器，同时当App播放时，其他类似QQ音乐就不能播放了。所以这种类别一般用于播放器类App._

* _`AVAudioSessionCategoryRecord`:有了播放器，肯定要录音机，比如微信语音的录制，就要用到这个类别，既然要安静的录音，肯定不希望有QQ音乐了，所以其他播放声音会中断。想想微信语音的场景，就知道什么时候用他了._

* _`AVAudioSessionCategorySoloAmbient`:也是只用于播放,但是和`AVAudioSessionCategoryAmbient`不同的是，用了它就别想听QQ音乐了，比如不希望QQ音乐干扰的App，类似节奏大师。同样当用户锁屏或者静音时也会随着静音，锁屏了就玩不了节奏大师了._


了解了这七大类别，我们就可以根据自己的需要进行对应类别的设置了：

``` objc
- (BOOL)setCategory:(NSString *)category error:(NSError **)outError;
```

传入对应的列表枚举即可。如果返回`NO`可以通过`NSError`的`error.localizedDescription`查看原因.

可以通过:

``` objc
@property(readonly) NSArray<NSString *> *availableCategories;
```

属性,查看当前设备支持哪些类别,然后再进行设置,从而保证传入参数的合法,减少错误的可能.

比如使用如下代码:

``` objc
	NSLog(@"Current Category:%@", [AVAudioSession sharedInstance].category);
    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback error:&error];
    if (nil != error) {
        NSLog(@"set Option error %@", error.localizedDescription);
    }
    NSLog(@"Current Category:%@", [AVAudioSession sharedInstance].category);

```

此时在播放音乐的时候，再去按下静音键，会发现，音乐还在继续播放，不会被静音。


### 类别的选项(Category Options)



上面介绍的这个七大类别，可以认为是设定了七种主场景，而这七类肯定是不能满足开发者所有的需求的。`CoreAudio`提供的方法是，__首先定下七种的一种基调,然后在进行微调.`CoreAudio`为每种`Category`都提供了些许选项来进行微调.__


在设置完类别后，可以通过:

``` objc
@property(readonly) AVAudioSessionCategoryOptions categoryOptions;
```

属性,查看当前类别设置了哪些选项,注意这里的返回值是`AVAudioSessionCategoryOptions`,__实际是多个`options`的`|`运算__.  
默认情况下是`0`.

``` objc
typedef NS_OPTIONS(NSUInteger, AVAudioSessionCategoryOptions)
{
	AVAudioSessionCategoryOptionMixWithOthers			= 0x1,
	AVAudioSessionCategoryOptionDuckOthers				= 0x2,
	AVAudioSessionCategoryOptionAllowBluetooth	__TVOS_PROHIBITED __WATCHOS_PROHIBITED		= 0x4,
	AVAudioSessionCategoryOptionDefaultToSpeaker __TVOS_PROHIBITED __WATCHOS_PROHIBITED		= 0x8,
	AVAudioSessionCategoryOptionInterruptSpokenAudioAndMixWithOthers NS_AVAILABLE_IOS(9_0) = 0x11,
	AVAudioSessionCategoryOptionAllowBluetoothA2DP API_AVAILABLE(ios(10.0), watchos(3.0), tvos(10.0)) = 0x20,
	AVAudioSessionCategoryOptionAllowAirPlay API_AVAILABLE(ios(10.0), tvos(10.0)) __WATCHOS_PROHIBITED = 0x40,
} NS_AVAILABLE_IOS(6_0);
```


| 选项 | 适用类别 | 作用 | 
| :------ | :------ | :------: |
| AVAudioSessionCategoryOptionMixWithOthers | AVAudioSessionCategoryPlayAndRecord, AVAudioSessionCategoryPlayback, and AVAudioSessionCategoryMultiRoute | 是否可以和其他后台App进行混音 |
| AVAudioSessionCategoryOptionDuckOthers | AVAudioSessionCategoryAmbient, AVAudioSessionCategoryPlayAndRecord, AVAudioSessionCategoryPlayback, and AVAudioSessionCategoryMultiRoute | 是否压低其他App声音 |
| AVAudioSessionCategoryOptionAllowBluetooth | AVAudioSessionCategoryRecord and AVAudioSessionCategoryPlayAndRecord | 是否支持蓝牙耳机 |
| AVAudioSessionCategoryOptionDefaultToSpeaker | AVAudioSessionCategoryPlayAndRecord  | 是否默认用免提声音 |

> 目前主要的选项有这几种，都有对应的使用场景，除此之外，还有iOS9之后新增加的一些

| 选项 | 适用类别 | 作用 | 最低适用系统 |
| :------ | :------ | :------: | :------|
| AVAudioSessionCategoryOptionInterruptSpokenAudioAndMixWithOthers  | -- | -- | iOS 9|
| AVAudioSessionCategoryOptionAllowBluetoothA2DP  | -- | -- | iOS 10|
| AVAudioSessionCategoryOptionAllowAirPlay  | -- | 支持蓝牙A2DP耳机和AirPlay | iOS 10|


下面介绍一下每个子场景选项的作用:

* _`AVAudioSessionCategoryOptionMixWithOthers`:如果确实用的`AVAudioSessionCategoryPlayback`实现的一个背景音，可是，又想和QQ音乐并存，那么可以在`AVAudioSessionCategoryPlayback`类别下在设置这个选项，就可以实现共存了._

* _`AVAudioSessionCategoryOptionDuckOthers`：在实时通话的场景，比如QQ音乐，当进行视频通话的时候，会发现QQ音乐自动声音降低了，此时就是通过设置这个选项来对其他音乐App进行了压制._

* _`AVAudioSessionCategoryOptionAllowBluetooth`：如果要支持蓝牙耳机电话，则需要设置这个选项._

* _`AVAudioSessionCategoryOptionDefaultToSpeaker`： 如果在VoIP模式下，希望默认打开免提功能，需要设置这个选项._

通过接口:

``` objc
- (BOOL)setCategory:(NSString *)category withOptions:(AVAudioSessionCategoryOptions)options error:(NSError **)outError;
```

来对当前的类别进行选项(options)的设置.

实例代码:

``` objc
- (void)xxxMethod{
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback withOptions:AVAudioSessionCategoryOptionMixWithOthers error:&error];
    if (nil != error) {
        NSLog(@"set Option error %@", error.localizedDescription);
    }
    options = [[AVAudioSession sharedInstance] categoryOptions];
    NSLog(@"Category[%@] has %lu options",  [AVAudioSession sharedInstance].category, options);
}
```

此时，如果打开QQ音乐播放器，然后再开始进行播放，会发现，QQ和我们的实例都在播放，并且进行了自动混音。

### 七大模式

通过上面的`七大类别`:

``` objc
#pragma mark -- Values for the mode property --

AVF_EXPORT NSString *const AVAudioSessionModeDefault NS_AVAILABLE_IOS(5_0);

AVF_EXPORT NSString *const AVAudioSessionModeVoiceChat NS_AVAILABLE_IOS(5_0);

AVF_EXPORT NSString *const AVAudioSessionModeGameChat NS_AVAILABLE_IOS(5_0);

AVF_EXPORT NSString *const AVAudioSessionModeVideoRecording NS_AVAILABLE_IOS(5_0);

AVF_EXPORT NSString *const AVAudioSessionModeMeasurement NS_AVAILABLE_IOS(5_0);

AVF_EXPORT NSString *const AVAudioSessionModeMoviePlayback NS_AVAILABLE_IOS(6_0);

AVF_EXPORT NSString *const AVAudioSessionModeVideoChat NS_AVAILABLE_IOS(7_0);

AVF_EXPORT NSString *const AVAudioSessionModeSpokenAudio NS_AVAILABLE_IOS(9_0);
```


我们基本覆盖了常用的__主场景__，在每个主场景中可以通过`Option`进行__微调__。为此`CoreAudio`提供了七大比较常见微调后的子场景。叫做`各个类别的模式`.

| 模式Mode | 适用的类别 | 场景 | 
| :------ | :------ | :------: |
| AVAudioSessionModeDefault | 所有类别 | 默认的模式 |
| AVAudioSessionModeVoiceChat | AVAudioSessionCategoryPlayAndRecord  | VoIP |
| AVAudioSessionModeGameChat | AVAudioSessionCategoryPlayAndRecord | 游戏录制，由GKVoiceChat自动设置，无需手动调用 |
| AVAudioSessionModeVideoRecording | AVAudioSessionCategoryPlayAndRecord AVAudioSessionCategoryRecord | 录制视频时|
| AVAudioSessionModeMoviePlayback | AVAudioSessionCategoryPlayback | 视频播放|
| AVAudioSessionModeMeasurement | AVAudioSessionCategoryPlayAndRecord AVAudioSessionCategoryRecord AVAudioSessionCategoryPlayback | 最小系统 |
| AVAudioSessionModeVideoChat | AVAudioSessionCategoryPlayAndRecord | 视频通话 |

每个模式有其适用的类别，所以，并不是有“七七 四十九”种组合。如果当前处于的类别下没有这个模式，那么是设置不成功的。  

设置完Category后可以通过如下代码:

``` objc
@property(readonly) NSArray<NSString *> *availableModes;

```

这个属性,查看其支持哪些属性，做合法性校验。


下面说一下具体应用场景:


* __`AVAudioSessionModeDefault`： 每种类别默认的就是这个模式，所有要想还原的话，就设置成这个模式。__

* __`AVAudioSessionModeVoiceChat`：主要用于VoIP场景，此时系统会选择最佳的输入设备，比如插上耳机就使用耳机上的麦克风进行采集。此时有个副作用，他会设置类别的选项为`AVAudioSessionCategoryOptionAllowBluetooth`从而支持蓝牙耳机。__

* __`AVAudioSessionModeVideoChat` ： 主要用于视频通话，比如QQ视频、FaceTime。时系统也会选择最佳的输入设备，比如插上耳机就使用耳机上的麦克风进行采集并且会设置类别的选项为`AVAudioSessionCategoryOptionAllowBluetooth`和`AVAudioSessionCategoryOptionDefaultToSpeaker`。__

* __`AVAudioSessionModeGameChat` ： 适用于游戏App的采集和播放，比如“GKVoiceChat”对象，一般不需要手动设置.__

> 另外几种和音频APP关系不大，一般我们只需要关注VoIP或者视频通话即可。


通过调用：

``` objc
- (BOOL)setMode:(NSString *)mode error:(NSError **)outError;
```

可以在设置`Category`之后再设置模式。

当然，这些模式只是`CoreAduio`总结的，不一定完全满足要求，对于具体的模式，在`iOS10`中还是可以微调的。  

通过接口:  

``` objc

- (BOOL)setCategory:(NSString *)category mode:(NSString *)mode options:(AVAudioSessionCategoryOptions)options error:(NSError **)outError;

```

但是在`iOS9`及以下就只能在`Category`上调了，其实本质是一样的，可以认为是个API语法糖，接口封装.

### 系统中断响应

上面说的这些`Categorg`、`Option`以及`Mode`都是对自己作为播放主体时的表现，但是假设，现在正在播放着，突然来电话了、闹钟响了或者你在后台放歌但是用户启动其他App用上面的方法影响的时候，我们的App该如何表现呢？最常用的场景当然是先暂停，待恢复的时候再继续。那我们的App要如何感知到这个终端以及何时恢复呢？

`AVAudioSession`提供了多种`Notifications`来进行此类状况的通知。其中将来电话、闹铃响等都归结为一般性的中断

用`AVAudioSessionInterruptionNotification`来通知。其回调回来的`userInfo`主要包含两个键：

* _`AVAudioSessionInterruptionTypeKey`： 取值为`AVAudioSessionInterruptionTypeBegan`表示中断开始，我们应该暂停播放和采集，取值为`AVAudioSessionInterruptionTypeEnded`表示中断结束，我们可以继续播放和采集。_

* _`AVAudioSessionInterruptionOptionKey`： 当前只有一种值`AVAudioSessionInterruptionOptionShouldResume`表示此时也应该恢复继续播放和采集。_

__而将其他`App`占据`AudioSession`的时候用`AVAudioSessionSilenceSecondaryAudioHintNotification`来进行通知。其回调回来的__`userInfo`键为:

``` objc
AVAudioSessionSilenceSecondaryAudioHintTypeKey
```

可能包含的值:

* `AVAudioSessionSilenceSecondaryAudioHintTypeBegin`： 表示其他`App`开始占据`Session`.

* `AVAudioSessionSilenceSecondaryAudioHintTypeEnd`: 表示其他`App`开始释放`Session`.


### 外设改变

除了其他`App`和系统服务，会对我们的`App`产生影响以外，用户的手也会对我们产生影响。默认情况下，`AudioSession`会在`App`启动时选择一个最优的输出方案，比如插入耳机的时候，就用耳机。但是这个过程中，用户可能拔出耳机，我们App要如何感知这样的情况呢？


同样`AVAudioSession`也是通过`Notifications`来进行此类状况的通知。

假设有这样的App
![](/assets/images/20180112AVAudioSessionCategory/RouteChange.webp)

最开始在录音时，用户插入和拔出耳机我们都停止录音，这里通过`Notification`来通知有新设备了，或者设备被退出了，然后我们控制停止录音。或者在播放时，当耳机被拔出出时，`Notification`给了通知，我们先暂停音乐播放，待耳机插回时，在继续播放。

在`NSNotificationCenter`中对`AVAudioSessionRouteChangeNotification`进行注册。在其`userInfo`中有键：

* `AVAudioSessionRouteChangeReasonKey` : 表示改变的原因
* `AVAudioSessionSilenceSecondaryAudioHintTypeKey`： 和上面的中断意义意义一样。


| 枚举值 | 意义 |
| :------ | :------: | 
| AVAudioSessionRouteChangeReasonUnknown  | 未知原因 |
| AVAudioSessionRouteChangeReasonNewDeviceAvailable  | 有新设备可用 |
| AVAudioSessionRouteChangeReasonOldDeviceUnavailable  | 老设备不可用 |
| AVAudioSessionRouteChangeReasonCategoryChange  | 类别改变了 |
| AVAudioSessionRouteChangeReasonOverride  | App重置了输出设置 |
| AVAudioSessionRouteChangeReasonWakeFromSleep  | 从睡眠状态呼醒 |
| AVAudioSessionRouteChangeReasonNoSuitableRouteForCategory  | 当前Category下没有合适的设备 |
| AVAudioSessionRouteChangeReasonRouteConfigurationChange  | Rotuer的配置改变了 |


# 总结

`AVAudioSession`构建了一个音频使用生命周期的上下文。当前状态是否可以录音、对其他App有怎样的影响、是否响应系统的静音键、如何感知来电话了等都可以通过它来实现。尤为重要的是`AVAudioSession`不仅可以和`AVFoundation`中的`AVAudioPlyaer`/`AVAudioRecorder`配合，其他录音/播放工具比如`AudioUnit`、`AudioQueueService`也都需要他进行录音、静音等上下文配合。


[参考](https://www.jianshu.com/p/3e0a399380df)  
[参考2](http://cinvoke.me/?p=37)

全文完

