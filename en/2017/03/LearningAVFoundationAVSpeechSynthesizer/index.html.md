---
layout: post
title: Learning AV Foundation (Part 1) Chinese Text-to-Speech
date: 2017-03-11 12:38:53
categories: [iOS]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
math: false
mermaid: false

---


![AVSpeechSynthesizer](/assets/images/20170311LearningAVFoundationAVSpeechSynthesizer/Cover.avif)

Preface

> I've been studying the `AV Foundation` framework recently and found a book called
[AV Foundation开发秘籍：实践掌握iOS & OS X 应用的视听处理技术](http://item.jd.com/11742630.html)
Then I Googled and found the English version is called
[Learning AV Foundation: A Hands-on Guide to Mastering the AV Foundation Framework](http://www.informit.com/store/learning-av-foundation-a-hands-on-guide-to-mastering-9780321961808)
Reading the Chinese translation, I couldn't help but sigh: why not just write a book yourself instead of going through all the trouble of translating it, turning something originally full of technical substance into something that, through literal translation, loses all its technical value. Seeing the title "开发秘籍" (Development Secrets), I can't help but think of those books from my college days — from "Development for Beginners" to "Learn xxx in 21 Days" to "Development Guide" to "Development Secrets"... I read `fake books` in college.

Today I'm sharing how to convert Chinese characters into speech on iOS. There's not much technical content to this (experts can skip it).

AVFoundation Overall Architecture
--

Before diving into this feature, let me introduce the overall architecture of `AV Foundation`.

![iOS](/assets/images/20170311LearningAVFoundationAVSpeechSynthesizer/frameworksBlockDiagram.avif)
This is the architecture design on iOS (above).

![iOS](/assets/images/20170311LearningAVFoundationAVSpeechSynthesizer/frameworksBlockDiagramOSX.avif)
This is the architecture design on macOS (above).


Now let's implement this demo with code.
First, import `<AVFoundation/AVFoundation.h>`

Here I need to use `AVSpeechSynthesizer` on iOS, which is called `NSSpeechSynthesizer` on macOS.

``` objc
@property (strong, nonatomic) AVSpeechSynthesizer *synthesizer;
```

`AVSpeechSynthesizer` — its functionality:

* __Add text to speech, i.e., play a piece of text as speech__

Initialization

``` objc
- (void)awakeFromNib {
    [super awakeFromNib];
    // Create speech synthesizer
    self.synthesizer = [[AVSpeechSynthesizer alloc] init];
    self.synthesizer.delegate = self;
    // Languages for playback
    self.voices = @[[AVSpeechSynthesisVoice voiceWithLanguage:@"zh-CN"],[AVSpeechSynthesisVoice voiceWithLanguage:@"en-US"]
                    ];
    self.speechStrings = [[NSMutableArray alloc] init];
    
}
```

Here, `[AVSpeechSynthesisVoice voiceWithLanguage:@"zh-CN"]`
sets up Simplified Chinese speech. A full list of supported speech voices will be provided at the end of the article, so don't worry about getting it wrong.



The delegate methods of `AVSpeechSynthesizer` are listed below — they mainly monitor speech playback status:


``` objc
@protocol AVSpeechSynthesizerDelegate <NSObject>
// Delegate methods
@optional
// Did start speech utterance
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didStartSpeechUtterance:(AVSpeechUtterance *)utterance;
// Did finish speech utterance
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didFinishSpeechUtterance:(AVSpeechUtterance *)utterance;
// Did pause speech utterance
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didPauseSpeechUtterance:(AVSpeechUtterance *)utterance;
// Did continue speech utterance
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didContinueSpeechUtterance:(AVSpeechUtterance *)utterance;
// Did cancel speech utterance
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didCancelSpeechUtterance:(AVSpeechUtterance *)utterance;
// Used to monitor the character range being spoken
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer willSpeakRangeOfSpeechString:(NSRange)characterRange utterance:(AVSpeechUtterance *)utterance;
@end
```

__The main methods of `AVSpeechSynthesizer` are:__


``` objc
/* Add a speech utterance to the speech queue. You can control playback by setting the utterance's properties. */
- (void)speakUtterance:(AVSpeechUtterance *)utterance;

// For stopSpeakingAtBoundary: operations on speech utterances, if interrupted, the queue will be cleared
// Interrupt
- (BOOL)stopSpeakingAtBoundary:(AVSpeechBoundary)boundary;
// Pause
- (BOOL)pauseSpeakingAtBoundary:(AVSpeechBoundary)boundary;
// Resume
- (BOOL)continueSpeaking;  
```

> Here we use the `speakUtterance` method to play text.
speakUtterance:(AVSpeechUtterance *)utterance
1. `AVSpeechUtterance` is an encapsulation of text for speech playback
2. The speech text to be played, which can be understood as a piece of text that needs to be played
Here we set the `AVSpeechUtterance` playback information:


``` objc  
	// Play speech
	NSArray *speechStringsArray = [self buildSpeechStrings]; // buildSpeechStrings returns an array of speech strings
    for (NSUInteger i = 0; i < speechStringsArray.count; i++) {
        // Create AVSpeechUtterance object for the speech text to be played
        AVSpeechUtterance *utterance = [[AVSpeechUtterance alloc] initWithString:speechStringsArray[i]];
        // Set which language to use for playback
        utterance.voice = self.voices[0];
        // The speech rate for this text, should be between AVSpeechUtteranceMinimumSpeechRate and AVSpeechUtteranceMaximumSpeechRate
        utterance.rate = 0.5;
        // Change the pitch when playing specific sentences, typically between 0.5 (low pitch) ~ 2.0 (high pitch)
        utterance.pitchMultiplier = 0.8f;
        // Volume, between 0.0 ~ 1.0
        utterance.volume = 1.0f;
        // Delay after playback, i.e., the pause time after this text finishes playing, default is 0
        utterance.preUtteranceDelay = 0;
        // Delay before playback, i.e., the pause time before this text starts playing, default is 0
        utterance.postUtteranceDelay = 0.1f;
        [self.synthesizer speakUtterance:utterance];
    }
```

Properties of `AVSpeechUtterance`:

``` objc
// Set which language to use for playback
@property(nonatomic, retain, nullable) AVSpeechSynthesisVoice *voice;
// Get the text to be played, read-only property
@property(nonatomic, readonly) NSString *speechString;
// Get the text to be played as attributed string, read-only, available from iOS 10
@property(nonatomic, readonly) NSAttributedString *attributedSpeechString;
// The speech rate for this text, should be between AVSpeechUtteranceMinimumSpeechRate and AVSpeechUtteranceMaximumSpeechRate
@property(nonatomic) float rate;           
// Change the pitch when playing specific sentences, typically between 0.5 (low pitch) ~ 2.0 (high pitch)
@property(nonatomic) float pitchMultiplier; 
// Volume, between 0.0 ~ 1.0
@property(nonatomic) float volume;
// Delay after playback, i.e., the pause time after this text finishes playing, default is 0
@property(nonatomic) NSTimeInterval preUtteranceDelay; 
// Delay before playback, i.e., the pause time before this text starts playing, default is 0
@property(nonatomic) NSTimeInterval postUtteranceDelay;
```

Methods of `AVSpeechUtterance`:

The following are all initialization methods, divided into class methods and instance methods. The attributed string initialization method is only available from iOS 10:


``` objc
+ (instancetype)speechUtteranceWithString:(NSString *)string;
+ (instancetype)speechUtteranceWithAttributedString:(NSAttributedString *)string NS_AVAILABLE_IOS(10_0);
- (instancetype)initWithString:(NSString *)string;
- (instancetype)initWithAttributedString:(NSAttributedString *)string  

```



You can use __`[AVSpeechSynthesisVoice speechVoices]`__ to print out all supported speech languages:

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

> Summary
To learn __`AVFoundation`__, I started with a simple concept. The only regret is that I'm not sure whether this synthesizer supports custom speech playback. I'll research this further and fill in the related learning content.

__Final demo supporting both iOS and macOS: [Learning-AV-Foundation (Part 1) Chinese Text-to-Speech](https://github.com/sunyazhou13/AVSpeechSynthesizerDemo)__


References:
[AV Foundation Apple Official Documentation](https://developer.apple.com/library/content/documentation/AudioVideo/Conceptual/AVFoundationPG/Articles/00_Introduction.html#//apple_ref/doc/uid/TP40010188)
[AVSpeechSynthesizer and AVSpeechUtterance](http://www.jianshu.com/p/acd57725ba4d)
[AVSpeechSynthesizer详解](http://www.jianshu.com/p/a41cb018f0b5)
[AVFoundation](http://www.jianshu.com/p/cc79c45b4ccf)
