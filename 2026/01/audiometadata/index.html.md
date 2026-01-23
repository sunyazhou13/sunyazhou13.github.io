---
layout: post
title: 使用libtag库获取音频metadata元数据
date: 2026-01-23 16:06 +0000
categories: [iOS, SwiftUI]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 背景

![](/assets/images/20260123AudioMetaData/libtagdemo.gif)

最近开发一个功能需要获取音频文件的原始数据,需要支持大部分市面上的音频文件,于是找AI帮忙发现一个叫`[libtag](https://taglib.org/)`目前最新版本是2.1.1,这是一个C++的库,需要objc++混编.

经过一顿操作AI,最后得到了相关产物.a和相关头文件 以及一些常用的方法 

##  示例

``` objc
NSString *filePath = [[NSBundle mainBundle] pathForResource:@"迈腾进行曲_整曲" ofType:@"m4a"];
NSDictionary<NSString *, id> *metadata = [MTTagLibHelper readAudioTag:filePath];
[self printDic:metadata];
```
如下

``` sh
=== 字典内容（共9项）===
fileType	->	m4a
fileSize	->	4474001
bitDepth	->	16
channels	->	2
durationMs	->	184960
duration	->	184
bitrate	->	193
filePath	->	/private/var/containers/Bundle/Application/A4E3C8A0-5F8C-4B7E-8294-C388915BB965/libtagdemo.app/迈腾进行曲_整曲.m4a
sampleRate	->	44100
=== 结束 ===
```

这个库支持如下格式

``` sh
// MPEG Audio
@"mp3", @"mp2", @"mp1",
// MPEG-4 Audio
@"m4a", @"m4b", @"m4p", @"m4r", @"mp4", @"aac",
// FLAC
@"flac",
// Ogg
@"ogg", @"oga", @"opus", @"spx",
// Windows Media
@"wma", @"asf",
// WAV / AIFF
@"wav", @"aiff", @"aif",
// Monkey's Audio
@"ape",
// Musepack
@"mpc", @"mp+", @"mpp",
// WavPack
@"wv",
// TrueAudio
@"tta",
// DSD
@"dsf", @"dff",
// Tracker modules
@"mod", @"s3m", @"it", @"xm"
```

这个库中提供了一些常用的头文件,我已经封装好了一个工具类方便大家使用

``` objc
/**
使用示例:
NSDictionary *tags = [MTTagLibHelper readAudioTag:@"/path/to/song.flac"];
// 音频属性
NSLog(@"比特率: %@ kbps", tags[MTTLMetadataBitrate]);   // 如: 1411 kbps
NSLog(@"位深度: %@ bits", tags[MTTLMetadataBitDepth]);  // 如: 24 bits
NSLog(@"采样率: %@ Hz", tags[MTTLMetadataSampleRate]);  // 如: 96000 Hz
NSLog(@"声道数: %@", tags[MTTLMetadataChannels]);       // 如: 2
*/

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

#pragma mark - 基本标签 (Basic Tags)
FOUNDATION_EXTERN NSString * const MTTLMetadataTitle;           // 标题 eg: "Bohemian Rhapsody"
FOUNDATION_EXTERN NSString * const MTTLMetadataArtist;          // 艺术家 eg: "Queen"
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbum;           // 专辑 eg: "A Night at the Opera"
FOUNDATION_EXTERN NSString * const MTTLMetadataGenre;           // 流派 eg: "Rock", "Pop", "Jazz"
FOUNDATION_EXTERN NSString * const MTTLMetadataComment;         // 评论 eg: "Live version", "Remastered"
FOUNDATION_EXTERN NSString * const MTTLMetadataYear;            // 年份 eg: 1975 (NSNumber)
FOUNDATION_EXTERN NSString * const MTTLMetadataTrack;           // 曲目号 eg: 11 (NSNumber)
FOUNDATION_EXTERN NSString * const MTTLMetadataDiscNumber;      // 碟片号 eg: 1 (NSNumber)

#pragma mark - 扩展标签 (Extended Tags)
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumArtist;     // 专辑艺术家 eg: "The Beatles"
FOUNDATION_EXTERN NSString * const MTTLMetadataComposer;        // 作曲家 eg: "John Lennon"
FOUNDATION_EXTERN NSString * const MTTLMetadataLyricist;        // 作词人 eg: "Paul McCartney"
FOUNDATION_EXTERN NSString * const MTTLMetadataConductor;       // 指挥 eg: "Herbert von Karajan"
FOUNDATION_EXTERN NSString * const MTTLMetadataRemixer;         // 混音师 eg: "David Guetta"
FOUNDATION_EXTERN NSString * const MTTLMetadataBPM;             // BPM eg: 120 (NSNumber)
FOUNDATION_EXTERN NSString * const MTTLMetadataCopyright;       // 版权信息 eg: "© 2023 Sony Music"
FOUNDATION_EXTERN NSString * const MTTLMetadataEncodedBy;       // 编码者 eg: "LAME 3.100"
FOUNDATION_EXTERN NSString * const MTTLMetadataMood;            // 情绪 eg: "Happy", "Sad", "Energetic"
FOUNDATION_EXTERN NSString * const MTTLMetadataMedia;           // 媒体类型 eg: "CD", "Vinyl", "Digital"
FOUNDATION_EXTERN NSString * const MTTLMetadataLabel;           // 唱片公司 eg: "Universal Records"
FOUNDATION_EXTERN NSString * const MTTLMetadataISRC;            // ISRC代码 eg: "USRC17607839"
FOUNDATION_EXTERN NSString * const MTTLMetadataSubtitle;        // 副标题 eg: "Remastered Version"
FOUNDATION_EXTERN NSString * const MTTLMetadataOriginalDate;    // 原始发行日期 eg: "1975-10-31"
FOUNDATION_EXTERN NSString * const MTTLMetadataDate;            // 发行日期 eg: "2023-01-15"
FOUNDATION_EXTERN NSString * const MTTLMetadataBarcode;         // 条形码 eg: "5099923456789"
FOUNDATION_EXTERN NSString * const MTTLMetadataCatalogNumber;   // 目录号 eg: "CDVIR123"

#pragma mark - 排序标签 (Sort Tags)
FOUNDATION_EXTERN NSString * const MTTLMetadataTitleSort;       // 标题排序 eg: "Bohemian Rhapsody"
FOUNDATION_EXTERN NSString * const MTTLMetadataArtistSort;      // 艺术家排序 eg: "Queen"
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumSort;       // 专辑排序 eg: "Night at the Opera, A"
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumArtistSort; // 专辑艺术家排序 eg: "Beatles, The"
FOUNDATION_EXTERN NSString * const MTTLMetadataComposerSort;    // 作曲家排序 eg: "Lennon, John"

#pragma mark - 音频属性 (Audio Properties)
FOUNDATION_EXTERN NSString * const MTTLMetadataDuration;        // 时长(秒) eg: 354 (NSNumber) | 单位:秒
FOUNDATION_EXTERN NSString * const MTTLMetadataDurationMs;      // 时长(毫秒) eg: 354000 (NSNumber) | 单位:毫秒
FOUNDATION_EXTERN NSString * const MTTLMetadataBitrate;         // 比特率(kbps) eg: 320 (NSNumber) | MP3:128/192/256/320 | AAC:128/192/256 | FLAC:800-1400(无损)
FOUNDATION_EXTERN NSString * const MTTLMetadataBitDepth;        // 位深度(bits) eg: 16/24/32 (NSNumber) | 16-bit:CD质量 | 24-bit:高保真 | 32-bit:专业 | MP3:0(无)
FOUNDATION_EXTERN NSString * const MTTLMetadataSampleRate;      // 采样率(Hz) eg: 44100/48000/96000/192000 (NSNumber) | 44100:CD | 48000:专业 | 96000:高保真 | 192000:超高保真
FOUNDATION_EXTERN NSString * const MTTLMetadataChannels;        // 声道数 eg: 1(单声道)/2(立体声)/6(5.1)/8(7.1) (NSNumber) | 1:Mono | 2:Stereo | 6:5.1环绕 | 8:7.1环绕

#pragma mark - 专辑封面 (Album Art)
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumArt;        // 专辑封面 (UIImage) | 格式:JPEG/PNG | 尺寸:500x500/1000x1000像素
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumArtData;    // 专辑封面原始数据 (NSData) | 可用于自定义处理或保存
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumArtMimeType;// 专辑封面MIME类型 eg: "image/jpeg", "image/png" (NSString)

#pragma mark - 文件信息 (File Info)
FOUNDATION_EXTERN NSString * const MTTLMetadataFileType;        // 文件类型 eg: "mp3", "flac", "m4a", "wav" (NSString, 小写)
FOUNDATION_EXTERN NSString * const MTTLMetadataFilePath;        // 文件路径 eg: "/Users/user/Music/song.mp3" (NSString)
FOUNDATION_EXTERN NSString * const MTTLMetadataFileSize;        // 文件大小 eg: 5242880 (NSNumber, 单位:字节) | 1MB=1048576 | 10MB=10485760

#pragma mark - 兼容旧版本 Key (Deprecated - 保持向后兼容)
FOUNDATION_EXTERN NSString * const TLMedtadataTitle      DEPRECATED_MSG_ATTRIBUTE("Use MTTLMetadataTitle instead");
FOUNDATION_EXTERN NSString * const TLMedtadataArtist     DEPRECATED_MSG_ATTRIBUTE("Use MTTLMetadataArtist instead");
FOUNDATION_EXTERN NSString * const TLMedtadataAlbum      DEPRECATED_MSG_ATTRIBUTE("Use MTTLMetadataAlbum instead");
FOUNDATION_EXTERN NSString * const TLMedtadataGenre      DEPRECATED_MSG_ATTRIBUTE("Use MTTLMetadataGenre instead");
FOUNDATION_EXTERN NSString * const TLMedtadataDuration   DEPRECATED_MSG_ATTRIBUTE("Use MTTLMetadataDuration instead");


@interface MTTagLibHelper : NSObject

#pragma mark - 主要方法

/**
 * 读取音频文件的所有元数据
 * @param filepath 音频文件的完整路径
 * @return 包含所有可用元数据的字典，如果文件无法读取则返回 nil
 */
+ (nullable NSDictionary<NSString *, id> *)readAudioTag:(NSString *)filepath;

/**
 * 仅读取基本标签信息（更快，不读取专辑封面）
 * @param filepath 音频文件的完整路径
 * @return 包含基本元数据的字典
 */
+ (nullable NSDictionary<NSString *, id> *)readBasicTag:(NSString *)filepath;

/**
 * 仅读取音频属性（时长、比特率、位深度等）
 * @param filepath 音频文件的完整路径
 * @return 包含音频属性的字典
 */
+ (nullable NSDictionary<NSString *, NSNumber *> *)readAudioProperties:(NSString *)filepath;

/**
 * 读取专辑封面图片
 * @param filepath 音频文件的完整路径
 * @return 专辑封面的 UIImage，如果没有封面则返回 nil
 */
+ (nullable UIImage *)readAlbumArt:(NSString *)filepath;

/**
 * 读取专辑封面原始数据
 * @param filepath 音频文件的完整路径
 * @return 专辑封面的原始 NSData，如果没有封面则返回 nil
 */
+ (nullable NSData *)readAlbumArtData:(NSString *)filepath;

/**
 * 检查文件是否为支持的音频格式
 * @param filepath 文件路径
 * @return 如果是支持的音频格式返回 YES
 */
+ (BOOL)isAudioFileSupported:(NSString *)filepath;

/**
 * 获取支持的音频文件扩展名列表
 * @return 支持的扩展名数组 (如 @["mp3", "m4a", "flac", ...])
 */
+ (NSArray<NSString *> *)supportedFileExtensions;

@end

NS_ASSUME_NONNULL_END

```

.m文件如下

``` objc
#import "MTTagLibHelper.h"

// TagLib 核心头文件
#import <taglib/taglib.h>
#import <taglib/fileref.h>
#import <taglib/tag.h>
#import <taglib/tpropertymap.h>
#import <taglib/audioproperties.h>

// 格式特定头文件 (用于读取专辑封面和位深度)
#import <taglib/mpegfile.h>
#import <taglib/id3v2tag.h>
#import <taglib/attachedpictureframe.h>
#import <taglib/flacfile.h>
#import <taglib/flacpicture.h>
#import <taglib/flacproperties.h>
#import <taglib/mp4file.h>
#import <taglib/mp4tag.h>
#import <taglib/mp4coverart.h>
#import <taglib/mp4properties.h>
#import <taglib/wavfile.h>
#import <taglib/wavproperties.h>
#import <taglib/aifffile.h>
#import <taglib/aiffproperties.h>
#import <taglib/trueaudiofile.h>
#import <taglib/trueaudioproperties.h>
#import <taglib/wavpackfile.h>
#import <taglib/wavpackproperties.h>
#import <taglib/apefile.h>
#import <taglib/apeproperties.h>
#import <taglib/dsffile.h>
#import <taglib/dsfproperties.h>
#import <taglib/dsdifffile.h>
#import <taglib/dsdiffproperties.h>

#pragma mark - 基本标签 Key 定义
NSString * const MTTLMetadataTitle           = @"title";
NSString * const MTTLMetadataArtist          = @"artist";
NSString * const MTTLMetadataAlbum           = @"album";
NSString * const MTTLMetadataGenre           = @"genre";
NSString * const MTTLMetadataComment         = @"comment";
NSString * const MTTLMetadataYear            = @"year";
NSString * const MTTLMetadataTrack           = @"track";
NSString * const MTTLMetadataDiscNumber      = @"discNumber";

#pragma mark - 扩展标签 Key 定义
NSString * const MTTLMetadataAlbumArtist     = @"albumArtist";
NSString * const MTTLMetadataComposer        = @"composer";
NSString * const MTTLMetadataLyricist        = @"lyricist";
NSString * const MTTLMetadataConductor       = @"conductor";
NSString * const MTTLMetadataRemixer         = @"remixer";
NSString * const MTTLMetadataBPM             = @"bpm";
NSString * const MTTLMetadataCopyright       = @"copyright";
NSString * const MTTLMetadataEncodedBy       = @"encodedBy";
NSString * const MTTLMetadataMood            = @"mood";
NSString * const MTTLMetadataMedia           = @"media";
NSString * const MTTLMetadataLabel           = @"label";
NSString * const MTTLMetadataISRC            = @"isrc";
NSString * const MTTLMetadataSubtitle        = @"subtitle";
NSString * const MTTLMetadataOriginalDate    = @"originalDate";
NSString * const MTTLMetadataDate            = @"date";
NSString * const MTTLMetadataBarcode         = @"barcode";
NSString * const MTTLMetadataCatalogNumber   = @"catalogNumber";

#pragma mark - 排序标签 Key 定义
NSString * const MTTLMetadataTitleSort       = @"titleSort";
NSString * const MTTLMetadataArtistSort      = @"artistSort";
NSString * const MTTLMetadataAlbumSort       = @"albumSort";
NSString * const MTTLMetadataAlbumArtistSort = @"albumArtistSort";
NSString * const MTTLMetadataComposerSort    = @"composerSort";

#pragma mark - 音频属性 Key 定义
NSString * const MTTLMetadataDuration        = @"duration";
NSString * const MTTLMetadataDurationMs      = @"durationMs";
NSString * const MTTLMetadataBitrate         = @"bitrate";
NSString * const MTTLMetadataBitDepth        = @"bitDepth";
NSString * const MTTLMetadataSampleRate      = @"sampleRate";
NSString * const MTTLMetadataChannels        = @"channels";

#pragma mark - 专辑封面 Key 定义
NSString * const MTTLMetadataAlbumArt        = @"albumArt";
NSString * const MTTLMetadataAlbumArtData    = @"albumArtData";
NSString * const MTTLMetadataAlbumArtMimeType = @"albumArtMimeType";

#pragma mark - 文件信息 Key 定义
NSString * const MTTLMetadataFileType        = @"fileType";
NSString * const MTTLMetadataFilePath        = @"filePath";
NSString * const MTTLMetadataFileSize        = @"fileSize";

#pragma mark - 兼容旧版本 Key (Deprecated)
NSString * const TLMedtadataTitle          = @"title";
NSString * const TLMedtadataArtist         = @"artist";
NSString * const TLMedtadataAlbum          = @"album";
NSString * const TLMedtadataGenre          = @"genre";
NSString * const TLMedtadataDuration       = @"duration";


#pragma mark - PropertyMap Key 映射表
// TagLib PropertyMap 使用的标准 Key 名称
static NSDictionary<NSString *, NSString *> *propertyKeyMapping() {
    static NSDictionary *mapping = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        mapping = @{
            // 基本标签
            @"TITLE":           MTTLMetadataTitle,
            @"ARTIST":          MTTLMetadataArtist,
            @"ALBUM":           MTTLMetadataAlbum,
            @"GENRE":           MTTLMetadataGenre,
            @"COMMENT":         MTTLMetadataComment,
            @"DATE":            MTTLMetadataDate,
            @"TRACKNUMBER":     MTTLMetadataTrack,
            @"DISCNUMBER":      MTTLMetadataDiscNumber,
            
            // 扩展标签
            @"ALBUMARTIST":     MTTLMetadataAlbumArtist,
            @"COMPOSER":        MTTLMetadataComposer,
            @"LYRICIST":        MTTLMetadataLyricist,
            @"CONDUCTOR":       MTTLMetadataConductor,
            @"REMIXER":         MTTLMetadataRemixer,
            @"BPM":             MTTLMetadataBPM,
            @"COPYRIGHT":       MTTLMetadataCopyright,
            @"ENCODEDBY":       MTTLMetadataEncodedBy,
            @"MOOD":            MTTLMetadataMood,
            @"MEDIA":           MTTLMetadataMedia,
            @"LABEL":           MTTLMetadataLabel,
            @"ISRC":            MTTLMetadataISRC,
            @"SUBTITLE":        MTTLMetadataSubtitle,
            @"ORIGINALDATE":    MTTLMetadataOriginalDate,
            @"BARCODE":         MTTLMetadataBarcode,
            @"CATALOGNUMBER":   MTTLMetadataCatalogNumber,
            
            // 排序标签
            @"TITLESORT":       MTTLMetadataTitleSort,
            @"ARTISTSORT":      MTTLMetadataArtistSort,
            @"ALBUMSORT":       MTTLMetadataAlbumSort,
            @"ALBUMARTISTSORT": MTTLMetadataAlbumArtistSort,
            @"COMPOSERSORT":    MTTLMetadataComposerSort,
        };
    });
    return mapping;
}


@implementation MTTagLibHelper

#pragma mark - 辅助方法

/// 将 TagLib::String 转换为 NSString
static NSString * _Nullable NSStringFromTagLibString(const TagLib::String &str) {
    if (str.isEmpty()) {
        return nil;
    }
    return [NSString stringWithUTF8String:str.toCString(true)];
}

/// 将 TagLib::StringList 转换为 NSString (取第一个值)
static NSString * _Nullable NSStringFromTagLibStringList(const TagLib::StringList &list) {
    if (list.isEmpty()) {
        return nil;
    }
    return NSStringFromTagLibString(list.front());
}

/// 检查文件是否存在且可读
static BOOL isFileReadable(NSString *filepath) {
    if (!filepath || filepath.length == 0) {
        return NO;
    }
    NSFileManager *fm = [NSFileManager defaultManager];
    return [fm fileExistsAtPath:filepath] && [fm isReadableFileAtPath:filepath];
}

/// 获取文件扩展名（小写）
static NSString *fileExtension(NSString *filepath) {
    return [[filepath pathExtension] lowercaseString];
}

/// 从不同格式文件读取位深度 (bitsPerSample)
static int readBitDepth(const char *path, NSString *ext) {
    // FLAC
    if ([ext isEqualToString:@"flac"]) {
        TagLib::FLAC::File flacFile(path);
        if (flacFile.isValid() && flacFile.audioProperties()) {
            return flacFile.audioProperties()->bitsPerSample();
        }
    }
    // WAV
    else if ([ext isEqualToString:@"wav"]) {
        TagLib::RIFF::WAV::File wavFile(path);
        if (wavFile.isValid() && wavFile.audioProperties()) {
            return wavFile.audioProperties()->bitsPerSample();
        }
    }
    // AIFF
    else if ([ext isEqualToString:@"aiff"] || [ext isEqualToString:@"aif"]) {
        TagLib::RIFF::AIFF::File aiffFile(path);
        if (aiffFile.isValid() && aiffFile.audioProperties()) {
            return aiffFile.audioProperties()->bitsPerSample();
        }
    }
    // M4A/MP4/AAC (通常是 16-bit，但 Apple Lossless 可能是 16/24-bit)
    else if ([ext isEqualToString:@"m4a"] || [ext isEqualToString:@"mp4"] || [ext isEqualToString:@"aac"]) {
        TagLib::MP4::File mp4File(path);
        if (mp4File.isValid() && mp4File.audioProperties()) {
            return mp4File.audioProperties()->bitsPerSample();
        }
    }
    // TrueAudio
    else if ([ext isEqualToString:@"tta"]) {
        TagLib::TrueAudio::File ttaFile(path);
        if (ttaFile.isValid() && ttaFile.audioProperties()) {
            return ttaFile.audioProperties()->bitsPerSample();
        }
    }
    // WavPack
    else if ([ext isEqualToString:@"wv"]) {
        TagLib::WavPack::File wvFile(path);
        if (wvFile.isValid() && wvFile.audioProperties()) {
            return wvFile.audioProperties()->bitsPerSample();
        }
    }
    // APE (Monkey's Audio)
    else if ([ext isEqualToString:@"ape"]) {
        TagLib::APE::File apeFile(path);
        if (apeFile.isValid() && apeFile.audioProperties()) {
            return apeFile.audioProperties()->bitsPerSample();
        }
    }
    // DSD (DSF)
    else if ([ext isEqualToString:@"dsf"]) {
        TagLib::DSF::File dsfFile(path);
        if (dsfFile.isValid() && dsfFile.audioProperties()) {
            return dsfFile.audioProperties()->bitsPerSample();
        }
    }
    // DSD (DSDIFF/DFF)
    else if ([ext isEqualToString:@"dff"]) {
        TagLib::DSDIFF::File dffFile(path);
        if (dffFile.isValid() && dffFile.audioProperties()) {
            return dffFile.audioProperties()->bitsPerSample();
        }
    }
    // MP3 等有损格式通常没有位深度概念，返回 0
    return 0;
}

/// 从 MP3 文件读取专辑封面
static NSData * _Nullable readAlbumArtFromMP3(const char *path) {
    TagLib::MPEG::File mpegFile(path);
    if (!mpegFile.isValid()) return nil;
    
    TagLib::ID3v2::Tag *id3v2Tag = mpegFile.ID3v2Tag();
    if (!id3v2Tag) return nil;
    
    TagLib::ID3v2::FrameList frames = id3v2Tag->frameListMap()["APIC"];
    if (frames.isEmpty()) return nil;
    
    auto *pictureFrame = dynamic_cast<TagLib::ID3v2::AttachedPictureFrame *>(frames.front());
    if (!pictureFrame) return nil;
    
    TagLib::ByteVector pictureData = pictureFrame->picture();
    if (pictureData.isEmpty()) return nil;
    
    return [NSData dataWithBytes:pictureData.data() length:pictureData.size()];
}

/// 从 FLAC 文件读取专辑封面
static NSData * _Nullable readAlbumArtFromFLAC(const char *path) {
    TagLib::FLAC::File flacFile(path);
    if (!flacFile.isValid()) return nil;
    
    const TagLib::List<TagLib::FLAC::Picture *> &pictures = flacFile.pictureList();
    if (pictures.isEmpty()) return nil;
    
    TagLib::FLAC::Picture *picture = pictures.front();
    if (!picture) return nil;
    
    TagLib::ByteVector pictureData = picture->data();
    if (pictureData.isEmpty()) return nil;
    
    return [NSData dataWithBytes:pictureData.data() length:pictureData.size()];
}

/// 从 M4A/MP4 文件读取专辑封面
static NSData * _Nullable readAlbumArtFromMP4(const char *path) {
    TagLib::MP4::File mp4File(path);
    if (!mp4File.isValid()) return nil;
    
    TagLib::MP4::Tag *mp4Tag = mp4File.tag();
    if (!mp4Tag) return nil;
    
    TagLib::MP4::ItemMap itemMap = mp4Tag->itemMap();
    if (!itemMap.contains("covr")) return nil;
    
    TagLib::MP4::CoverArtList coverArtList = itemMap["covr"].toCoverArtList();
    if (coverArtList.isEmpty()) return nil;
    
    TagLib::ByteVector pictureData = coverArtList.front().data();
    if (pictureData.isEmpty()) return nil;
    
    return [NSData dataWithBytes:pictureData.data() length:pictureData.size()];
}

/// 使用通用方法读取专辑封面 (TagLib 2.0+ complexProperties)
static NSData * _Nullable readAlbumArtGeneric(TagLib::FileRef &fileRef) {
    TagLib::Tag *tag = fileRef.tag();
    if (!tag) return nil;
    
    TagLib::StringList keys = tag->complexPropertyKeys();
    bool hasPicture = false;
    for (const auto &key : keys) {
        if (key == "PICTURE") {
            hasPicture = true;
            break;
        }
    }
    if (!hasPicture) return nil;
    
    TagLib::List<TagLib::VariantMap> pictures = tag->complexProperties("PICTURE");
    if (pictures.isEmpty()) return nil;
    
    const TagLib::VariantMap &picture = pictures.front();
    auto it = picture.find("data");
    if (it == picture.end()) return nil;
    
    TagLib::ByteVector data = it->second.toByteVector();
    if (data.isEmpty()) return nil;
    
    return [NSData dataWithBytes:data.data() length:data.size()];
}


#pragma mark - 公共方法

+ (NSDictionary<NSString *, id> *)readAudioTag:(NSString *)filepath {
    if (!isFileReadable(filepath)) {
        NSLog(@"[MTTagLibHelper] 文件不存在或不可读: %@", filepath);
        return nil;
    }
    
    const char *cFilePath = [filepath fileSystemRepresentation];
    TagLib::FileRef fileRef(cFilePath);
    
    if (fileRef.isNull()) {
        NSLog(@"[MTTagLibHelper] 无法打开文件: %@", filepath);
        return nil;
    }
    
    NSMutableDictionary *metadata = [NSMutableDictionary dictionary];
    
    // ========== 1. 读取基本标签 ==========
    TagLib::Tag *tag = fileRef.tag();
    if (tag) {
        // 基本字段
        NSString *title = NSStringFromTagLibString(tag->title());
        NSString *artist = NSStringFromTagLibString(tag->artist());
        NSString *album = NSStringFromTagLibString(tag->album());
        NSString *genre = NSStringFromTagLibString(tag->genre());
        NSString *comment = NSStringFromTagLibString(tag->comment());
        
        if (title.length > 0)   metadata[MTTLMetadataTitle] = title;
        if (artist.length > 0)  metadata[MTTLMetadataArtist] = artist;
        if (album.length > 0)   metadata[MTTLMetadataAlbum] = album;
        if (genre.length > 0)   metadata[MTTLMetadataGenre] = genre;
        if (comment.length > 0) metadata[MTTLMetadataComment] = comment;
        
        // 年份和曲目号
        unsigned int year = tag->year();
        unsigned int track = tag->track();
        if (year > 0)  metadata[MTTLMetadataYear] = @(year);
        if (track > 0) metadata[MTTLMetadataTrack] = @(track);
    }
    
    // ========== 2. 读取扩展标签 (通过 PropertyMap) ==========
    TagLib::PropertyMap properties = fileRef.file()->properties();
    NSDictionary *keyMapping = propertyKeyMapping();
    
    for (const auto &prop : properties) {
        NSString *tagLibKey = NSStringFromTagLibString(prop.first);
        NSString *mappedKey = keyMapping[tagLibKey];
        
        if (mappedKey && !metadata[mappedKey]) {
            NSString *value = NSStringFromTagLibStringList(prop.second);
            if (value.length > 0) {
                metadata[mappedKey] = value;
            }
        }
    }
    
    // ========== 3. 读取音频属性 ==========
    NSString *ext = fileExtension(filepath);
    
    TagLib::AudioProperties *audioProps = fileRef.audioProperties();
    if (audioProps) {
        int duration = audioProps->lengthInSeconds();
        int durationMs = audioProps->lengthInMilliseconds();
        int bitrate = audioProps->bitrate();
        int sampleRate = audioProps->sampleRate();
        int channels = audioProps->channels();
        
        if (duration > 0)   metadata[MTTLMetadataDuration] = @(duration);
        if (durationMs > 0) metadata[MTTLMetadataDurationMs] = @(durationMs);
        if (bitrate > 0)    metadata[MTTLMetadataBitrate] = @(bitrate);
        if (sampleRate > 0) metadata[MTTLMetadataSampleRate] = @(sampleRate);
        if (channels > 0)   metadata[MTTLMetadataChannels] = @(channels);
    }
    
    // 读取位深度 (需要针对特定格式)
    int bitDepth = readBitDepth(cFilePath, ext);
    if (bitDepth > 0) {
        metadata[MTTLMetadataBitDepth] = @(bitDepth);
    }
    
    // ========== 4. 读取专辑封面 ==========
    
    NSData *artData = nil;
    if ([ext isEqualToString:@"mp3"]) {
        artData = readAlbumArtFromMP3(cFilePath);
    } else if ([ext isEqualToString:@"flac"]) {
        artData = readAlbumArtFromFLAC(cFilePath);
    } else if ([ext isEqualToString:@"m4a"] || [ext isEqualToString:@"mp4"] || [ext isEqualToString:@"aac"]) {
        artData = readAlbumArtFromMP4(cFilePath);
    } else {
        // 尝试通用方法
        artData = readAlbumArtGeneric(fileRef);
    }
    
    if (artData) {
        metadata[MTTLMetadataAlbumArtData] = artData;
        UIImage *image = [UIImage imageWithData:artData];
        if (image) {
            metadata[MTTLMetadataAlbumArt] = image;
        }
    }
    
    // ========== 5. 添加文件信息 ==========
    metadata[MTTLMetadataFilePath] = filepath;
    metadata[MTTLMetadataFileType] = ext;
    
    NSError *error = nil;
    NSDictionary *attrs = [[NSFileManager defaultManager] attributesOfItemAtPath:filepath error:&error];
    if (attrs) {
        NSNumber *fileSize = attrs[NSFileSize];
        if (fileSize) {
            metadata[MTTLMetadataFileSize] = fileSize;
        }
    }
    
    return [metadata copy];
}

+ (NSDictionary<NSString *, id> *)readBasicTag:(NSString *)filepath {
    if (!isFileReadable(filepath)) {
        return nil;
    }
    
    const char *cFilePath = [filepath fileSystemRepresentation];
    TagLib::FileRef fileRef(cFilePath);
    
    if (fileRef.isNull()) {
        return nil;
    }
    
    NSMutableDictionary *metadata = [NSMutableDictionary dictionary];
    
    TagLib::Tag *tag = fileRef.tag();
    if (tag) {
        NSString *title = NSStringFromTagLibString(tag->title());
        NSString *artist = NSStringFromTagLibString(tag->artist());
        NSString *album = NSStringFromTagLibString(tag->album());
        NSString *genre = NSStringFromTagLibString(tag->genre());
        NSString *comment = NSStringFromTagLibString(tag->comment());
        
        if (title.length > 0)   metadata[MTTLMetadataTitle] = title;
        if (artist.length > 0)  metadata[MTTLMetadataArtist] = artist;
        if (album.length > 0)   metadata[MTTLMetadataAlbum] = album;
        if (genre.length > 0)   metadata[MTTLMetadataGenre] = genre;
        if (comment.length > 0) metadata[MTTLMetadataComment] = comment;
        
        unsigned int year = tag->year();
        unsigned int track = tag->track();
        if (year > 0)  metadata[MTTLMetadataYear] = @(year);
        if (track > 0) metadata[MTTLMetadataTrack] = @(track);
    }
    
    TagLib::AudioProperties *audioProps = fileRef.audioProperties();
    if (audioProps) {
        int duration = audioProps->lengthInSeconds();
        if (duration > 0) metadata[MTTLMetadataDuration] = @(duration);
    }
    
    return [metadata copy];
}

+ (NSDictionary<NSString *, NSNumber *> *)readAudioProperties:(NSString *)filepath {
    if (!isFileReadable(filepath)) {
        return nil;
    }
    
    const char *cFilePath = [filepath fileSystemRepresentation];
    TagLib::FileRef fileRef(cFilePath);
    
    if (fileRef.isNull()) {
        return nil;
    }
    
    NSMutableDictionary *properties = [NSMutableDictionary dictionary];
    
    TagLib::AudioProperties *audioProps = fileRef.audioProperties();
    if (audioProps) {
        properties[MTTLMetadataDuration] = @(audioProps->lengthInSeconds());
        properties[MTTLMetadataDurationMs] = @(audioProps->lengthInMilliseconds());
        properties[MTTLMetadataBitrate] = @(audioProps->bitrate());
        properties[MTTLMetadataSampleRate] = @(audioProps->sampleRate());
        properties[MTTLMetadataChannels] = @(audioProps->channels());
    }
    
    // 读取位深度
    NSString *ext = fileExtension(filepath);
    int bitDepth = readBitDepth(cFilePath, ext);
    if (bitDepth > 0) {
        properties[MTTLMetadataBitDepth] = @(bitDepth);
    }
    
    return [properties copy];
}

+ (UIImage *)readAlbumArt:(NSString *)filepath {
    NSData *data = [self readAlbumArtData:filepath];
    if (data) {
        return [UIImage imageWithData:data];
    }
    return nil;
}

+ (NSData *)readAlbumArtData:(NSString *)filepath {
    if (!isFileReadable(filepath)) {
        return nil;
    }
    
    const char *cFilePath = [filepath fileSystemRepresentation];
    NSString *ext = fileExtension(filepath);
    
    if ([ext isEqualToString:@"mp3"]) {
        return readAlbumArtFromMP3(cFilePath);
    } else if ([ext isEqualToString:@"flac"]) {
        return readAlbumArtFromFLAC(cFilePath);
    } else if ([ext isEqualToString:@"m4a"] || [ext isEqualToString:@"mp4"] || [ext isEqualToString:@"aac"]) {
        return readAlbumArtFromMP4(cFilePath);
    } else {
        TagLib::FileRef fileRef(cFilePath);
        if (!fileRef.isNull()) {
            return readAlbumArtGeneric(fileRef);
        }
    }
    
    return nil;
}

+ (BOOL)isAudioFileSupported:(NSString *)filepath {
    if (!isFileReadable(filepath)) {
        return NO;
    }
    
    NSString *ext = fileExtension(filepath);
    NSArray *supported = [self supportedFileExtensions];
    return [supported containsObject:ext];
}

+ (NSArray<NSString *> *)supportedFileExtensions {
    static NSArray *extensions = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        extensions = @[
            // MPEG Audio
            @"mp3", @"mp2", @"mp1",
            // MPEG-4 Audio
            @"m4a", @"m4b", @"m4p", @"m4r", @"mp4", @"aac",
            // FLAC
            @"flac",
            // Ogg
            @"ogg", @"oga", @"opus", @"spx",
            // Windows Media
            @"wma", @"asf",
            // WAV / AIFF
            @"wav", @"aiff", @"aif",
            // Monkey's Audio
            @"ape",
            // Musepack
            @"mpc", @"mp+", @"mpp",
            // WavPack
            @"wv",
            // TrueAudio
            @"tta",
            // DSD
            @"dsf", @"dff",
            // Tracker modules
            @"mod", @"s3m", @"it", @"xm"
        ];
    });
    return extensions;
}

@end

```

本文使用了一个文件选择器,可以从 手机的 `文件` app选择相关音频文件进行获取元数据.

以下是尝试使用`文件`app获取的结果

``` objc
📁 协调后的文件路径: /var/mobile/Containers/Data/Application/553CD270-11FE-4F8D-B288-45FDAAD4A207/tmp/com.sunyazhou.libtagdemo.libtagdemo-Inbox/迈腾进行曲_整曲.m4a
=== 字典内容（共9项）===
fileType	->	m4a
fileSize	->	4474001
bitDepth	->	16
channels	->	2
durationMs	->	184960
duration	->	184
bitrate	->	193
filePath	->	/var/mobile/Containers/Data/Application/553CD270-11FE-4F8D-B288-45FDAAD4A207/tmp/com.sunyazhou.libtagdemo.libtagdemo-Inbox/迈腾进行曲_整曲.m4a
sampleRate	->	44100
=== 结束 ===

```

> 迈腾进行曲_整曲.m4a 是我用AI创作的歌曲,仅限大家在测试功能使用.版权归属sunyazhou.


最后我整理好了[demo点击去下载](https://github.com/sunyazhou13/libtagdemo)

libtag的库我是以本地pod的形式集成的,功能完好,需要使用自取.

# 总结

2026年还是要坚持写博客.这篇文件介绍一下 音频元数据的工具类.善于积累细节,工作中一定用得到.