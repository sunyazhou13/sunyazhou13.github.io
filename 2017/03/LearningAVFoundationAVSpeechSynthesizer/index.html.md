---
layout: post
title: Learning AV Foundation(一)汉字语音朗读
date: 2017-03-11 12:38:53
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
---


![AVSpeechSynthesizer](/assets/images/20170311LearningAVFoundationAVSpeechSynthesizer/Cover.webp)

前言

> 最近在研究`AV Foundation` 框架 发现有一本书叫做  
[AV Foundation开发秘籍：实践掌握iOS & OS X 应用的视听处理技术](http://item.jd.com/11742630.html)  
然后google查了一下英文版叫  
[Learning AV Foundation: A Hands-on Guide to Mastering the AV Foundation Framework](http://www.informit.com/store/learning-av-foundation-a-hands-on-guide-to-mastering-9780321961808)  
看着国人的翻译不仅慨叹的想说一句话: 为啥不自己写一本书 何必这么费劲翻译它搞得原来很有技术含量 这么直译就没技术含量了。看着开发秘籍这名字不禁想起大学时那些书 从开发到入门... 21天学会xxx... 开发指南... 开发秘籍... 我大学读的都是`假书`

今天给大家分享的是 iOS上如何 把汉字转换成语音朗读, 当然这个没什么技术含量(大神可以飞过).

AVFoundation整体架构
--

研究这个功能之前先介绍一下`AV Foundation`整体架构

![iOS](/assets/images/20170311LearningAVFoundationAVSpeechSynthesizer/frameworksBlockDiagram.webp)  
这是iOS上的架构设计 (上图)  

![iOS](/assets/images/20170311LearningAVFoundationAVSpeechSynthesizer/frameworksBlockDiagramOSX.webp)  
这是macOS上的架构设计(上图)


看完之后我们就来用代码实现这个demo  
首先导入`<AVFoundation/AVFoundation.h>`

这我需要使用的是iOS上的`AVSpeechSynthesizer`,macOS上叫`NSSpeechSynthesizer `

``` objc
@property (strong, nonatomic) AVSpeechSynthesizer *synthesizer;
```

`AVSpeechSynthesizer` 它的功能
  	
* __将文字添加到语音, 就是用语音播放一段文字__

初始化

``` objc
- (void)awakeFromNib {
    [super awakeFromNib];
    //创建语音合成器
    self.synthesizer = [[AVSpeechSynthesizer alloc] init];
    self.synthesizer.delegate = self;
    //播放的国家的语言
    self.voices = @[[AVSpeechSynthesisVoice voiceWithLanguage:@"zh-CN"],[AVSpeechSynthesisVoice voiceWithLanguage:@"en-US"]
                    ];
    self.speechStrings = [[NSMutableArray alloc] init];
    
}
```

这里的`[AVSpeechSynthesisVoice voiceWithLanguage:@"zh-CN"]`
设置的是简体中文语音 文章末尾会列出所有语音播放信息不用担心写错.



`AVSpeechSynthesizer`的delegate方法如下 主要是对语音播放状态的监听


``` objc
@protocol AVSpeechSynthesizerDelegate <NSObject>
// 代理方法
@optional
// 开始播放 语音单元
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didStartSpeechUtterance:(AVSpeechUtterance *)utterance;
// 完成播放 语音单元
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didFinishSpeechUtterance:(AVSpeechUtterance *)utterance;
// 暂停播放 语音单元
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didPauseSpeechUtterance:(AVSpeechUtterance *)utterance;
// 继续播放 语音单元
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didContinueSpeechUtterance:(AVSpeechUtterance *)utterance;
// 取消播放 语音单元
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didCancelSpeechUtterance:(AVSpeechUtterance *)utterance;
// 这里 指的是 又来监听 播放 字符范围
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer willSpeakRangeOfSpeechString:(NSRange)characterRange utterance:(AVSpeechUtterance *)utterance;
@end
```

__这里的`AVSpeechSynthesizer`主要的方法有__  


``` objc
/* 添加 播放话语 到 播放语音 队列, 可以设置utterance的属性来控制播放 */
- (void)speakUtterance:(AVSpeechUtterance *)utterance;

// 对于 stopSpeakingAtBoundary: 语音单元的操作, 如果中断, 会清空队列
// 中断
- (BOOL)stopSpeakingAtBoundary:(AVSpeechBoundary)boundary;
// 暂停
- (BOOL)pauseSpeakingAtBoundary:(AVSpeechBoundary)boundary;
// 继续
- (BOOL)continueSpeaking;  
```

> 这里我们用的`speakUtterance`方法来播放文字
speakUtterance:(AVSpeechUtterance *)utterance  
1. `AVSpeechUtterance`是对文字朗读的封装
2. 被播放的语音文字, 可以理解为一段需要播放的文字  
这里我们设置`AVSpeechUtterance`朗读播放的信息  


``` objc  
	//播放语音
	NSArray *speechStringsArray = [self buildSpeechStrings]; //buildSpeechStrings播放字符串的数组
    for (NSUInteger i = 0; i < speechStringsArray.count; i++) {
        //创建AVSpeechUtterance 对象 用于播放的语音文字
        AVSpeechUtterance *utterance = [[AVSpeechUtterance alloc] initWithString:speechStringsArray[i]];
        //设置使用哪一个国家的语言播放
        utterance.voice = self.voices[0];
        //本段文字播放时的 语速, 应介于AVSpeechUtteranceMinimumSpeechRate 和 AVSpeechUtteranceMaximumSpeechRate 之间
        utterance.rate = 0.5;
        //在播放特定语句时改变声音的声调, 一般取值介于0.5(底音调)~2.0(高音调)之间
        utterance.pitchMultiplier = 0.8f;
        //声音大小, 0.0 ~ 1.0 之间
        utterance.volume = 1.0f;
        //播放后的延迟, 就是本次文字播放完之后的停顿时间, 默认是0
        utterance.preUtteranceDelay = 0;
        //播放前的延迟, 就是本次文字播放前停顿的时间, 然后播放本段文字, 默认是0
        utterance.postUtteranceDelay = 0.1f;
        [self.synthesizer speakUtterance:utterance];
    }
```

`AVSpeechUtterance`的属性如下

``` objc
// 设置使用哪一个国家的语言播放
@property(nonatomic, retain, nullable) AVSpeechSynthesisVoice *voice;
// 获取当前需要播放的文字, 只读属性
@property(nonatomic, readonly) NSString *speechString;
// 获取当前需要播放的文字 - 富文本, 只读属性, iOS10以后可用
@property(nonatomic, readonly) NSAttributedString *attributedSpeechString;
// 本段文字播放时的 语速, 应介于AVSpeechUtteranceMinimumSpeechRate 和 AVSpeechUtteranceMaximumSpeechRate 之间
@property(nonatomic) float rate;           
// 在播放特定语句时改变声音的声调, 一般取值介于0.5(底音调)~2.0(高音调)之间
@property(nonatomic) float pitchMultiplier; 
// 声音大小, 0.0 ~ 1.0 之间
@property(nonatomic) float volume;
// 播放后的延迟, 就是本次文字播放完之后的停顿时间, 默认是0
@property(nonatomic) NSTimeInterval preUtteranceDelay; 
// 播放前的延迟, 就是本次文字播放前停顿的时间, 然后播放本段文字, 默认是0
@property(nonatomic) NSTimeInterval postUtteranceDelay;
```

`AVSpeechUtterance`的方法如下  

以下全部都是初始化方法, 分为 类方法 和 对象方法, 富文本的初始化方法要在iOS10以后才可以用  


``` objc
+ (instancetype)speechUtteranceWithString:(NSString *)string;
+ (instancetype)speechUtteranceWithAttributedString:(NSAttributedString *)string NS_AVAILABLE_IOS(10_0);
- (instancetype)initWithString:(NSString *)string;
- (instancetype)initWithAttributedString:(NSAttributedString *)string  

```
  

可以使用__`[AVSpeechSynthesisVoice speechVoices]`__代码打印出支持朗读语言的国家  

```
ar-SA  沙特阿拉伯（阿拉伯文）

en-ZA, 南非（英文）

nl-BE, 比利时（荷兰文）

en-AU, 澳大利亚（英文）

th-TH, 泰国（泰文）

de-DE, 德国（德文）

en-US, 美国（英文）

pt-BR, 巴西（葡萄牙文）

pl-PL, 波兰（波兰文）

en-IE, 爱尔兰（英文）

el-GR, 希腊（希腊文）

id-ID, 印度尼西亚（印度尼西亚文）

sv-SE, 瑞典（瑞典文）

tr-TR, 土耳其（土耳其文）

pt-PT, 葡萄牙（葡萄牙文）

ja-JP, 日本（日文）

ko-KR, 南朝鲜（朝鲜文）

hu-HU, 匈牙利（匈牙利文）

cs-CZ, 捷克共和国（捷克文）

da-DK, 丹麦（丹麦文）

es-MX, 墨西哥（西班牙文）

fr-CA, 加拿大（法文）

nl-NL, 荷兰（荷兰文）

fi-FI, 芬兰（芬兰文）

es-ES, 西班牙（西班牙文）

it-IT, 意大利（意大利文）

he-IL, 以色列（希伯莱文，阿拉伯文）

no-NO, 挪威（挪威文）

ro-RO, 罗马尼亚（罗马尼亚文）

zh-HK, 香港（中文）

zh-TW, 台湾（中文）

sk-SK, 斯洛伐克（斯洛伐克文）

zh-CN, 中国（中文）

ru-RU, 俄罗斯（俄文）

en-GB, 英国（英文）

fr-FR, 法国（法文）

hi-IN  印度（印度文）
```

> 总结
为了学习__`AVFoundation`__我先从一个简单的知识点入手,唯一觉得遗憾的是我不太确定是否这个合成器支持自定义语音朗读,这个后续研究一下,把相关学习内容填补上.

__最终的demo 支持iOS和macOS:[Learning-AV-Foundation(一)汉字语音朗读](https://github.com/sunyazhou13/AVSpeechSynthesizerDemo)__


参考:  
[AV Foundation Apple 官方文档](https://developer.apple.com/library/content/documentation/AudioVideo/Conceptual/AVFoundationPG/Articles/00_Introduction.html#//apple_ref/doc/uid/TP40010188)  
[AVSpeechSynthesizer 和 AVSpeechUtterance](http://www.jianshu.com/p/acd57725ba4d)  
[AVSpeechSynthesizer详解](http://www.jianshu.com/p/a41cb018f0b5)  
[AVFoundation](http://www.jianshu.com/p/cc79c45b4ccf)






