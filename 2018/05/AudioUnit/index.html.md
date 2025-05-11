---
layout: post
title: AudioUnit
date: 2018-05-07 14:59:41
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
---




![](/assets/images/20180507AudioUnit/auHostApp.webp)

# 前言


声音的渲染在iOS平台上回直接使用`AudioUnit`的API来完成.用来实现一些类似`大叔`,`KTV`,`耳返等效果`....

今天带领大家深入了解和学习一下这些音效.


## 实现iOS变声的背景

声音变声一般都是发生在 一端采集录制另一端播放音频, 忽略中间的转码过程,在输入输出的中间过程中进行相应的音频参数就实现了变声. 

下图是AVAudioSession的工作流
![](/assets/images/20180507AudioUnit/ASPGIntro.webp)

大家常用的变声方案有很多:

1. FFMpeg提供内部效果器 eg:EQ均衡器  
2. AVFoundation底层的`Audio Unit` eg: 混响reverb
3. SoundTouch
4. 其它方案...


这里我们选用iOS AVFoundation本身提供的音频处理单元`Audio Unit`. 

`Audio Unit`提供如下功能:

* 低延迟的音频I/O eg:voip
* 多路声音的合成并回放 eg:游戏中的音乐合成器
* Audio Unit 自身提供 eg：回声消除、Mix两轨音频、均衡器、压缩器、混响效果器等.
* 需要图状的结构来处理音频. eg: 有点类似PC时代的主播经常用的一种叫KX 驱动. 

下图是KX 驱动连线图 windows平台 

![](/assets/images/20180507AudioUnit/kx.webp)

## AudioUnit介绍


#### iOS层级架构图

![](/assets/images/20180507AudioUnit/iPhone0sAudioArchitecture.webp)

![](/assets/images/20180507AudioUnit/AboutAudioUnitHosting.webp)

> 声音的处理过程, 首先需要认识一下`AUGraph`

![](/assets/images/20180507AudioUnit/simpleAuChain.webp)

> **audio processing graph**:  A representation of a signal chain comprising an interconnection of audio units. Also called an AUGraph or graph. Core Audio represents such an interconnected network as a software object of typeAUGraph. Audio processing graphs must end in an output unit. See also audio unit.  
> 一种信号链的表示，包括音频单元的互连。也称为AUGraph或graph。Core Audio代表着这样一个相互连接的网络，它是一个`AUGraph`类型的对象。



#### audio unit 结构图(工作流)

![](/assets/images/20180507AudioUnit/auArchitecture.webp)

#### Audio Unit 构成图

![](/assets/images/20180507AudioUnit/AudioUnitScopes.webp)

Unit 一般 分为 Element0 和  Element1


下面我们举Remote I/O Unit为例:  

RemoteIO 这个Unit是和硬件IO相关的Unit，它分为输入端和输出端, 输入端一般指麦克风,输出端一般指扬声器.


> `Element0` 控制输出  
> `Element1` 控制输入   
> 图中Element 也叫 bus；  
> 音频流从输入域（input scope）输入， 从输出域（output scope）输出
> 整个Render过程就是一次RenderCycle
  

![](/assets/images/20180507AudioUnit/IOUnit.webp)

__同时每个Element分为Input Scope 和 Output Scope.如果我们想使用扬声器的声音播放功能,必须需将这个Unit的`Element0`的`OutputScope`和Speak进行连接. 如果想使用麦克风录音功能,那么必须将这个Unit的`Element1`的`InputScope`和麦克风进行连接.__


### 构建Audio Unit

首先需要启用音频会话 这些大家自己配置就好 了 

``` 
	//配置会话相关伪代码
	[[AVAudioSession sharedInstance].xxxxx xxxxx];
```

如何用代码构建一个Audio Unit？ 这里我们以Remote I/O Unit 为例:

创建AudioUnit有两种方式

1. 直接使用AudioUnit裸创建 
2. 使用AUGraph和AUNode来构建



* 第一种 裸创建

``` objc
#import "ViewController.h"
#import <AudioUnit/AudioUnit.h>
@interface ViewController ()
{
    AudioUnit ioUnitInstance; //声明一变量
}

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    //首先构造出要用到创建Unit的结构体
    AudioComponentDescription ioUnitDescription;
    ioUnitDescription.componentType = kAudioUnitType_Output;
    ioUnitDescription.componentSubType = kAudioUnitSubType_RemoteIO;
    ioUnitDescription.componentManufacturer = kAudioUnitManufacturer_Apple;
    ioUnitDescription.componentFlags = 0;
    ioUnitDescription.componentFlagsMask = 0;
    
    AudioComponent ioUnitRef = AudioComponentFindNext(NULL, &ioUnitDescription);
    //创建AudioUnit实例
    AudioComponentInstanceNew(ioUnitRef, &ioUnitInstance);
}
```


* 第二种使用AUGraph和AUNode

``` objc
#import "ViewController.h"
#import <AudioUnit/AudioUnit.h>
#import <AudioToolbox/AudioToolbox.h>
@interface ViewController ()
{
    AUGraph     processingGraph;
    AUNode      ioNode;
    AudioUnit   ioUnit;
}

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    //首先构造出要用到创建Unit的结构体
    AudioComponentDescription ioUnitDescription;
    ioUnitDescription.componentType = kAudioUnitType_Output;
    ioUnitDescription.componentSubType = kAudioUnitSubType_RemoteIO;
    ioUnitDescription.componentManufacturer = kAudioUnitManufacturer_Apple;
    ioUnitDescription.componentFlags = 0;
    ioUnitDescription.componentFlagsMask = 0;
    
    //1 new
    NewAUGraph(&processingGraph);
    AUGraphAddNode(processingGraph, &ioUnitDescription, &ioNode);
    
    //2 open
    AUGraphOpen(processingGraph);
    
    //3 从相应的Node中获得AudioUnit
    AUGraphNodeInfo(processingGraph, ioNode, NULL, &ioUnit);
    
}

```

> 推荐使用第二种因为这种创建扩展性更高一些  
> 注意:__*AUNode必须和AudioUnit成对出现*__



如下图 ：Remote I/O Unit 

![](/assets/images/20180507AudioUnit/IOUnit.webp)

> 麦克风或者扬声器在Audio Unit中有相应的枚举.  
> 直播中的`耳返`就是用的这个把麦克风采集的数据直接扔给扬声器 这样就能做到 低延迟的实时听到麦克风的声音.  
> 直播中一般使用`Remote I/O` unit来进行采集工作

使用AudioUnit连接扬声器

``` objc
OSStatus status = noErr;
UInt32 onFlag = 1;
UInt32 busZero = 0; //Element0  就是bus0
status = AudioUnitSetProperty(remoteIOUnit, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Output, busZero, &onFlag, sizeof(onFlag));
CheckStatus(status, @"不能连接扬声器", YES);
    
```

> 注意: kAudioUnitScope_Output 就是连接扬声器的key

连接麦克风

``` objc
OSStatus status = noErr;
UInt32 busOne = 1; //Element1 就是bus1 接麦克风输入
UInt32 oneFlag = 1;
status =  AudioUnitSetProperty(remoteIOUnit, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Input, busOne, &oneFlag, sizeof(oneFlag));
CheckStatus(status, @"不能连接麦克风", YES);
```

可以使用如下代码检查每一步执行出错debug  

``` objc
static void CheckStatus(OSStatus status, NSString *message, BOOL fatal) {
    if (status != noErr) {
        char fourCC[16];
        *(UInt32 *)fourCC = CFSwapInt32HostToBig(status);
        fourCC[4] = '\0';
        if (isprint(fourCC[0]) && isprint(fourCC[1]) &&
            isprint(fourCC[2]) && isprint(fourCC[4])) {
            NSLog(@"%@:%s",message, fourCC);
        } else {
            NSLog(@"%@:%d",message, (int)status);
        }
        
        if (fatal) {
            exit(-1);
        }
    }
}
```

> 由于status每次报错都打印 相关数字大家可能不理解可以点击[OSStatus](https://www.osstatus.com/) 查询相关错误码

#### AVAudioMix

我们一般都在采集、录制或编辑音视频相应的类中使用AVAudioMixer.

举个例子:我们变声实现的流程大概是这个样子 __AVAudioPlayer -> AVPlayerItem -> AVAudioMixer-> AUGraph -> AUNode + AudioUnit__


![](/assets/images/20180507AudioUnit/AVAudioMixClass.webp)

#### AudioStreamBasicDescription 配置麦克风输入的参数

当我们控制Remote IO Unit的时候想告诉麦克风 各种input的参数 可以通过 一个叫ASBD 格式的结构体数据描述来设置给相应的Unit


##### Audio Stream Format 描述ASBD

``` objc
UInt32 bytePerSample = sizeof(Float32);
AudioStreamBasicDescription asbd;
bzero(&asbd, sizeof(asbd));
asbd.mFormatID = kAudioFormatLinearPCM;
asbd.mSampleRate = 44100;
asbd.mChannelsPerFrame = channels;
asbd.mFramesPerPacket = 1;
asbd.mFormatFlags = kAudioFormatFlagsNativeFloatPacked | kAudioFormatFlagIsNonInterleaved;
asbd.mBitsPerChannel = 8 * bytePerSample;
asbd.mBytesPerFrame = bytePerSample;
asbd.mBytesPerPacket = bytePerSample;
    
```

> 上边代码展示了如何填充ASBD结构体,这个描述音视频的具体格式.


下面具体介绍一下各个参数的意思

* mFormatID 可用来指定编码格式 eg:PCM
* mSampleRate 采样率
* mChannelsPerFrame 每个Frame有几个channel
* mFramesPerPacket 每个Packet有几Frame
* mFormatFlags 这个是用来描述声音格式表示格式的参数,上面代码我们指定的是每个sample的表示格式为Float格式,有点类似SInt16,如果后边是NonInterleaved代表非交错的,对于这个音频来讲就是左右声道的是非交错存放的,实际的音频数据会存储在一个AudioBufferList结构中的变量mBuffers中,如果mFormatFlags指定的是NonInterleaved,那么左声道就在会在mBuffers[0]里面,右声道就在mBuffers[1]里面.
* mBitsPerChannel 表示一个声道的音频数据用多少位来表示,上面我们用的是Float来表示, 所以这里使用的是 8 乘以 每个采样的字节数来赋值.
* mBytesPerFrame 和 mBytesPerPacket 这两个的赋值需要根据mFormatFlags 的值来进行分配,如果是NonInterleaved非交错的情况下, 就赋值bytePerSample(因为左右声道是分开的).但如果是Interleaved的话,那就应该是 bytePerSample * channels (因为左右声道是交错存放),这样才能表示一个Frame里面到底有多少byte.

讲了这么多 那我们怎么把这个ASDB给 Unit?

如下代码 设置ASBD给相应的Audio Unit

``` objc
AudioUnitSetProperty(remoteIOUnit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Output, 1, &asbd, sizeof(asbd));
```

完整的代码如下

``` objc
//设置ASBD
AudioStreamBasicDescription inputFormat;
inputFormat.mSampleRate = 44100;
inputFormat.mFormatID = kAudioFormatLinearPCM;
inputFormat.mFormatFlags = kAudioFormatFlagIsSignedInteger | kAudioFormatFlagIsNonInterleaved;
inputFormat.mFramesPerPacket = 1;
inputFormat.mChannelsPerFrame = 1;
inputFormat.mBytesPerPacket = 2;
inputFormat.mBytesPerFrame = 2;
inputFormat.mBitsPerChannel = 16;
//设置给输入端 配置麦克风输出的数据是什么格式
OSStatus status = noErr;
status = AudioUnitSetProperty(audioUnit,
                              kAudioUnitProperty_StreamFormat,
                              kAudioUnitScope_Output,
                              InputBus,
                              &inputFormat,
                              sizeof(inputFormat));
CheckStatus(status, @"AudioUnitGetProperty bus1 output ASBD error", YES);
```


### Audio Unit 分类

``` objc
CF_ENUM(UInt32) {
	kAudioUnitType_Output					= 'auou',
	kAudioUnitType_MusicDevice				= 'aumu',
	kAudioUnitType_MusicEffect				= 'aumf',
	kAudioUnitType_FormatConverter			= 'aufc',
	kAudioUnitType_Effect					= 'aufx',
	kAudioUnitType_Mixer					= 'aumx',
	kAudioUnitType_Panner					= 'aupn',
	kAudioUnitType_Generator				= 'augn',
	kAudioUnitType_OfflineEffect			= 'auol',
	kAudioUnitType_MIDIProcessor			= 'aumi'
};
```

| 分类 | 功能/作用 |类型 |
| :------ | :------ | :------ |
| Effect Unit | 提供声音特效处理| kAudioUnitType_Effect |
| Mixer Units | 提供Mix多路声音的功能 | kAudioUnitType_Mixer|
| I/O Units | I/O 采集音频与播放音频功能| kAudioUnitType_Output |
| AUConverter Units | 格式转换 eg:采样格式Float转SInt16、交错或平铺、单双声道的转换| kAudioUnitType_FormatConverter |
| Generator Units | 提供播放器功能 | kAudioUnitType_Generator |


``` objc
CF_ENUM(UInt32) {
	kAudioUnitSubType_PeakLimiter			= 'lmtr',
	kAudioUnitSubType_DynamicsProcessor		= 'dcmp',
	kAudioUnitSubType_LowPassFilter			= 'lpas',
	kAudioUnitSubType_HighPassFilter		= 'hpas',
	kAudioUnitSubType_BandPassFilter		= 'bpas',
	kAudioUnitSubType_HighShelfFilter		= 'hshf',
	kAudioUnitSubType_LowShelfFilter		= 'lshf',
	kAudioUnitSubType_ParametricEQ			= 'pmeq',
	kAudioUnitSubType_Distortion			= 'dist',
	kAudioUnitSubType_Delay					= 'dely',
	kAudioUnitSubType_SampleDelay			= 'sdly',
	kAudioUnitSubType_NBandEQ				= 'nbeq'
};


CF_ENUM(UInt32) {
	kAudioUnitSubType_Reverb2				= 'rvb2',
	kAudioUnitSubType_AUiPodEQ				= 'ipeq'
};

```


#### Effect Unit 子类型及用途说明

| 子类型 | 用途说明 | 子枚举类型 |
| :------ | :------ | :------ |
|均衡效果器 | 为声音的某些[频带](https://baike.baidu.com/item/%E9%A2%91%E5%B8%A6)增强或衰减能量，效果器需要指定多个频带,然后为各频带设置增益最终改变声音在音域上的能量分布 | kAudioUnitSubType_NBandEQ|
| 压缩效果器 | 当声音较小或较大通过设置阀值来提高或降低声音能量 eg:作用时间、释放时间、以及触发值从而最终控制声音在时域上的能量范围 | kAudioUnitSubType_DynamicsProcessor |
| 混响效果器 | 通过声音反射的延迟控制声音效果 | kAudioUnitSubType_Reverb2 |

> Effect Unit 下最常用的效果器就上边这三种, 像高通(High Pass)、低通(Low Pass)、带通(Band Pass)、延迟(Delay)、压限(Limiter) 等这些不是很常用,如果大家对这个很熟悉可以试试使用一下.

#### Mixer Units 子类型及用途说明

| 子类型 | 用途说明 | 子枚举类型 |
| :------ | :------ | :------ |
| 3D Mixer | 仅支持 macOS | |
| MultiChannelMixer | 多路声音混音效果器,可以接受多路音频输入,还可以分别调整每一路的音频增益和开关,并将多路音频合成一路 | kAudioUnitSubType_MultiChannelMixer |

#### I/O Units 子类型及用途说明

| 子类型 | 用途说明 | 子枚举类型 |
| :------ | :------ | :------ |
| Remote I/O | 采集音频与播放音频,在Audio Unit中使用麦克风和扬声器的时候会用到这个Unit | kAudioUnitType_Output |
| Generic Output | 进行离线处理,或者说AUGraph中不使用扬声器来驱动整个数据流,而希望使用一个输出(可以放入内存队列或者磁盘I/O操作)来驱动数据流时 | kAudioUnitSubType_GenericOutput |

#### AUConverter Units 子类型及用途说明

| 子类型 | 用途说明 | 子枚举类型 |
| :------ | :------ | :------ |
| AUConverter | 格式转换,当某些效果器对输入的音频格式有明确要求时,或者我们将音频数据输入给一些其它的编码器进行编码。。。  |kAudioUnitSubType_AUConverter|
|Time Pitch|变速变调效果器,调整声音音高. eg:会说话的Tom猫 |kAudioUnitSubType_NewTimePitch

> 注意: AUConverter  如果由FFMpeg解码出来的PCM 是SInt16格式 如果要用格式转换效果器unit必须转成Float32格式表示的数据.

#### Generator Units 子类型及用途说明


| 子类型 | 用途说明 | 子枚举类型 |
| :------ | :------ | :------ |
|AudioFilePlayer | 接收裸PCM 播放 一般大家可以用这个配合Remote I/O 做播放器 |	kAudioUnitSubType_AudioFilePlayer | 


相关shell命令 __将音频文件转成pcm__

``` sh
ffmpeg -i test.mp3 -acodec pcm_s16le -f s16le output.pcm
```

> brew install ffmpeg

[Demo实现耳返功能](https://github.com/sunyazhou13/AduioUnitDemo)  
[Demo2实现耳返+伴奏播放](https://github.com/sunyazhou13/AudioUnitDemo2)


#### 下面我分享一个变声中混响效果代码

``` objc

//声明部分  .h
@interface KSYAudioReverbFilter : NSObject


-(instancetype)init;

- (void)setupWithAUGraph:(AUGraph)auGraph asbd:(const AudioStreamBasicDescription *)asbd maxFrame:(CMItemCount)max;

// Global, CrossFade, 0->100, 100
@property (nonatomic) double dryWetMix;
// Global, Decibels, -20->20, 0dB.
@property (nonatomic) double gain;
// Global, Secs, 0.0001->1.0, 0.008
@property (nonatomic) double minDelayTime;
// Global, Secs, 0.0001->1.0, 0.050
@property (nonatomic) double maxDelayTime;
// Global, Secs, 0.001->20.0, 1.0
@property (nonatomic) double decayTimeAt0Hz;
// Global, Secs, 0.001->20.0, 0.5
@property (nonatomic) double decayTimeAtNyquist;
// Global, Integer, 1->1000, 1
@property (nonatomic) double randomizeReflections;

@end


//实现部分

//通用的宏
#define RC_CHECK(rc, str) if (rc != noErr) \
{ \
NSLog(@"Err :%@ %@ %@", @(rc), str, @(__func__)); \
}

@implementation KSYAudioReverbFilter

-(instancetype)init{
    self = [super init];
    if (self){
        self.acDes = (AudioComponentDescription){kAudioUnitType_Effect, kAudioUnitSubType_Reverb2, kAudioUnitManufacturer_Apple, 0, 0};
    }
    
    return self;
}

- (void)setupWithAUGraph:(AUGraph)auGraph asbd:(const AudioStreamBasicDescription *)asbd maxFrame:(CMItemCount)maxFrame
{
    //
    OSStatus status = noErr;
    NSAssert(auGraph != nil, @"auGraph is null");
    audioGraph = auGraph;
    NSLog(@"setup :%@", NSStringFromCode(_acDes.componentSubType));
    status = AUGraphAddNode(auGraph, &_acDes, &_node);
    
    if (noErr != status){
        
        NSString *error = [NSString stringWithFormat:@"add node with type %u failed", _acDes.componentType];
        NSLog(@"%@", error);
        return ;
    }
    status = AUGraphNodeInfo(auGraph, _node, NULL, &_audioUnit);
    if (noErr != status){
        NSLog(@"create audiouinit failed err:%@", @(status));
        return ;
    }
    
    RC_CHECK(AudioUnitSetProperty(_audioUnit,
                                  kAudioUnitProperty_StreamFormat,
                                  kAudioUnitScope_Input, 0, asbd, sizeof(AudioStreamBasicDescription)),
             @"kAudioUnitProperty_StreamFormat kAudioUnitScope_Input err");
    
    RC_CHECK(AudioUnitSetProperty(_audioUnit,
                                  kAudioUnitProperty_StreamFormat,
                                  kAudioUnitScope_Output, 0, asbd, sizeof(AudioStreamBasicDescription)),
             @"kAudioUnitProperty_StreamFormat kAudioUnitScope_Output err");
    
    // Set audio unit maximum frames per slice to max frames.
    RC_CHECK(AudioUnitSetProperty(_audioUnit,
                                  kAudioUnitProperty_MaximumFramesPerSlice,
                                  kAudioUnitScope_Global, 0, &maxFrame, (UInt32)sizeof(UInt32)),
             @"set kAudioUnitProperty_MaximumFramesPerSlice err");
}

#pragma mark - Setters

- (void)setDryWetMix:(double)dryWetMix
{
    [self setGlobalParam:kReverb2Param_DryWetMix value:dryWetMix];
}

- (void)setGain:(double)gain
{
    [self setGlobalParam:kReverb2Param_Gain value:gain];
}

- (void)setMinDelayTime:(double)minDelayTime
{
    [self setGlobalParam:kReverb2Param_MinDelayTime value:minDelayTime];
}

- (void)setMaxDelayTime:(double)maxDelayTime
{
    [self setGlobalParam:kReverb2Param_MaxDelayTime value:maxDelayTime];
}

- (void)setDecayTimeAt0Hz:(double)decayTimeAt0Hz
{
    [self setGlobalParam:kReverb2Param_DecayTimeAt0Hz value:decayTimeAt0Hz];
}

- (void)setDecayTimeAtNyquist:(double)decayTimeAtNyquist
{
    [self setGlobalParam:kReverb2Param_DecayTimeAtNyquist value:decayTimeAtNyquist];
}

- (void)setRandomizeReflections:(double)randomizeReflections
{
    [self setGlobalParam:kReverb2Param_RandomizeReflections value:randomizeReflections];
}

//通用方法
- (void)setGlobalParam:(AudioUnitParameterID)paramId value:(AudioUnitParameterValue)value
{

    RC_CHECK(AudioUnitSetParameter(_audioUnit,
                                   paramId,
                                   kAudioUnitScope_Global, 0, value, 0),
             ([NSString stringWithFormat:@"set %u value %f err", paramId, value]));
}

@end



```

外部调用的话就是这样的

``` objc
AURenderCallbackStruct renderCallbackStruct;
renderCallbackStruct.inputProc = ksyme_RenderCallback;
renderCallbackStruct.inputProcRefCon = (void *)self.apt;
    
if (!_reverbFilter){
    _reverbFilter = [[KSYAudioReverbFilter alloc] init];
    [_reverbFilter setupWithAUGraph:auGraph asbd:format maxFrame:max];
    _reverbFilter.renderCallBack = renderCallbackStruct;
}
```

### 连接node

``` objc
AUGraphClearConnections(auGraph);
NSMutableArray *array = [[NSMutableArray alloc] init];
[array addObject:@(_mixFilter.node)];

[array addObjectsFromArray:@[@(_reverbFilter.node),@(_delayFilter.node),@(_pitchFilter.node)]];
for (int i = 0; i < array.count -1; i++) {
    AUGraphConnectNodeInput(auGraph,[array[i] intValue], 0,[array[i+1] intValue], 0);
}
    
```

核心代码就是如何连接Node

``` objc
AUGraphConnectNodeInput(auGraph,reverbNode, 0, remoteIONode, 0)
```

> 0代表 bus0

系统定义的API是这样的

``` objc
extern OSStatus
AUGraphConnectNodeInput(	AUGraph			inGraph,
						AUNode			inSourceNode,
						UInt32			inSourceOutputNumber,
						AUNode			inDestNode,
						UInt32			inDestInputNumber)		__OSX_AVAILABLE_STARTING(__MAC_10_0,__IPHONE_2_0);
```


## 总结


Audio Unit的相关技术学习点比较多大家灵活掌握运用,不懂没关系从简单的Unit开始学起.


全文完


参考列表:  
[iOS Audio相关术语(Glossary)](https://developer.apple.com/library/content/documentation/MusicAudio/Reference/CoreAudioGlossary/Glossary/core_audio_glossary.html#//apple_ref/doc/uid/TP40004453-CH210-SW1)  
[参考](https://developer.apple.com/library/content/documentation/MusicAudio/Conceptual/AudioUnitHostingGuide_iOS/Introduction/Introduction.html)  
[如何自己制作一个Audio Unit](https://developer.apple.com/library/content/documentation/MusicAudio/Conceptual/AudioUnitProgrammingGuide/Tutorial-BuildingASimpleEffectUnitWithAGenericView/Tutorial-BuildingASimpleEffectUnitWithAGenericView.html#//apple_ref/doc/uid/TP40003278-CH5-SW4)  
[金山云直播音效实现](https://www.jianshu.com/p/05cae433faea)  
[Audio Unit官方文档](https://developer.apple.com/library/content/documentation/MusicAudio/Conceptual/AudioUnitHostingGuide_iOS/AudioUnitHostingFundamentals/AudioUnitHostingFundamentals.html#//apple_ref/doc/uid/TP40009492-CH3-SW12)

