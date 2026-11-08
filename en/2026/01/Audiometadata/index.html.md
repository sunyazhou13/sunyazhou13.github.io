---
layout: post
title: Getting Audio Metadata Using the libtag Library
date: 2026-01-23 16:06 +0000
categories: [iOS, SwiftUI]
tags: [iOS, macOS, Objective-C, AVFoundation, 音视频]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This article contains strong personal opinions. If you find it uncomfortable to read, please close it immediately. This article is for personal learning records only. You are welcome to reproduce or share it within the scope of the license agreement. Please respect copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thank you for your support!

# Background

![libtagdemo](/assets/images/20260123AudioMetaData/libtagdemo.avif)

I was recently developing a feature that needed to get raw data from audio files, with support for most common audio formats on the market. After consulting AI, I found a library called `[libtag](https://taglib.org/)`, currently at version 2.1.1. This is a C++ library that requires ObjC++ mixed compilation.

After a round of AI assistance, I ended up with the relevant .a library, header files, and some commonly used methods.

##  Example

``` objc
NSString *filePath = [[NSBundle mainBundle] pathForResource:@"迈腾进行曲_整曲" ofType:@"m4a"];
NSDictionary<NSString *, id> *metadata = [MTTagLibHelper readAudioTag:filePath];
[self printDic:metadata];
```
Here's the output:

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

This library supports the following formats:

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

This library provides some commonly used header files. I've already wrapped a utility class for easy use:

``` objc
/**
使用示例:
NSDictionary *tags = [MTTagLibHelper readAudioTag:@"/path/to/song.flac"];
// Audio properties
NSLog(@"比特率: %@ kbps", tags[MTTLMetadataBitrate]);   // 如: 1411 kbps
NSLog(@"位深度: %@ bits", tags[MTTLMetadataBitDepth]);  // 如: 24 bits
NSLog(@"采样率: %@ Hz", tags[MTTLMetadataSampleRate]);  // 如: 96000 Hz
NSLog(@"声道数: %@", tags[MTTLMetadataChannels]);       // 如: 2
*/

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

#pragma mark - Basic Tags
FOUNDATION_EXTERN NSString * const MTTLMetadataTitle;           // 标题 eg: "Bohemian Rhapsody"
FOUNDATION_EXTERN NSString * const MTTLMetadataArtist;          // 艺术家 eg: "Queen"
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbum;           // 专辑 eg: "A Night at the Opera"
FOUNDATION_EXTERN NSString * const MTTLMetadataGenre;           // 流派 eg: "Rock", "Pop", "Jazz"
FOUNDATION_EXTERN NSString * const MTTLMetadataComment;         // 评论 eg: "Live version", "Remastered"
FOUNDATION_EXTERN NSString * const MTTLMetadataYear;            // 年份 eg: 1975 (NSNumber)
FOUNDATION_EXTERN NSString * const MTTLMetadataTrack;           // 曲目号 eg: 11 (NSNumber)
FOUNDATION_EXTERN NSString * const MTTLMetadataDiscNumber;      // 碟片号 eg: 1 (NSNumber)

#pragma mark - Extended Tags
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

#pragma mark - Sort Tags
FOUNDATION_EXTERN NSString * const MTTLMetadataTitleSort;       // 标题排序 eg: "Bohemian Rhapsody"
FOUNDATION_EXTERN NSString * const MTTLMetadataArtistSort;      // 艺术家排序 eg: "Queen"
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumSort;       // 专辑排序 eg: "Night at the Opera, A"
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumArtistSort; // 专辑艺术家排序 eg: "Beatles, The"
FOUNDATION_EXTERN NSString * const MTTLMetadataComposerSort;    // 作曲家排序 eg: "Lennon, John"

#pragma mark - Audio Properties
FOUNDATION_EXTERN NSString * const MTTLMetadataDuration;        // 时长(秒) eg: 354 (NSNumber) | 单位:秒
FOUNDATION_EXTERN NSString * const MTTLMetadataDurationMs;      // 时长(毫秒) eg: 354000 (NSNumber) | 单位:毫秒
FOUNDATION_EXTERN NSString * const MTTLMetadataBitrate;         // 比特率(kbps) eg: 320 (NSNumber) | MP3:128/192/256/320 | AAC:128/192/256 | FLAC:800-1400(无损)
FOUNDATION_EXTERN NSString * const MTTLMetadataBitDepth;        // 位深度(bits) eg: 16/24/32 (NSNumber) | 16-bit:CD质量 | 24-bit:高保真 | 32-bit:专业 | MP3:0(无)
FOUNDATION_EXTERN NSString * const MTTLMetadataSampleRate;      // 采样率(Hz) eg: 44100/48000/96000/192000 (NSNumber) | 44100:CD | 48000:专业 | 96000:高保真 | 192000:超高保真
FOUNDATION_EXTERN NSString * const MTTLMetadataChannels;        // 声道数 eg: 1(单声道)/2(立体声)/6(5.1)/8(7.1) (NSNumber) | 1:Mono | 2:Stereo | 6:5.1环绕 | 8:7.1环绕

#pragma mark - Album Art
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumArt;        // 专辑封面 (UIImage) | 格式:JPEG/PNG | 尺寸:500x500/1000x1000像素
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumArtData;    // 专辑封面原始数据 (NSData) | 可用于自定义处理或保存
FOUNDATION_EXTERN NSString * const MTTLMetadataAlbumArtMimeType;// 专辑封面MIME类型 eg: "image/jpeg", "image/png" (NSString)

#pragma mark - File Info
FOUNDATION_EXTERN NSString * const MTTLMetadataFileType;        // 文件类型 eg: "mp3", "flac", "m4a", "wav" (NSString, 小写)
FOUNDATION_EXTERN NSString * const MTTLMetadataFilePath;        // 文件路径 eg: "/Users/user/Music/song.mp3" (NSString)
FOUNDATION_EXTERN NSString * const MTTLMetadataFileSize;        // 文件大小 eg: 5242880 (NSNumber, 单位:字节) | 1MB=1048576 | 10MB=10485760

#pragma mark - Deprecated Keys (Maintain backward compatibility)
FOUNDATION_EXTERN NSString * const TLMedtadataTitle      DEPRECATED_MSG_ATTRIBUTE("Use MTTLMetadataTitle instead");
FOUNDATION_EXTERN NSString * const TLMedtadataArtist     DEPRECATED_MSG_ATTRIBUTE("Use MTTLMetadataArtist instead");
FOUNDATION_EXTERN NSString * const TLMedtadataAlbum      DEPRECATED_MSG_ATTRIBUTE("Use MTTLMetadataAlbum instead");
FOUNDATION_EXTERN NSString * const TLMedtadataGenre      DEPRECATED_MSG_ATTRIBUTE("Use MTTLMetadataGenre instead");
FOUNDATION_EXTERN NSString * const TLMedtadataDuration   DEPRECATED_MSG_ATTRIBUTE("Use MTTLMetadataDuration instead");


@interface MTTagLibHelper : NSObject

#pragma mark - Main Methods

/**
 * Read all metadata from an audio file
 * @param filepath Full path to the audio file
 * @return A dictionary containing all available metadata, or nil if the file cannot be read
 */
+ (nullable NSDictionary<NSString *, id> *)readAudioTag:(NSString *)filepath;

/**
 * Read only basic tag information (faster, does not read album art)
 * @param filepath Full path to the audio file
 * @return A dictionary containing basic metadata
 */
+ (nullable NSDictionary<NSString *, id> *)readBasicTag:(NSString *)filepath;

/**
 * Read only audio properties (duration, bitrate, bit depth, etc.)
 * @param filepath Full path to the audio file
 * @return A dictionary containing audio properties
 */
+ (nullable NSDictionary<NSString *, NSNumber *> *)readAudioProperties:(NSString *)filepath;

/**
 * Read album art image
 * @param filepath Full path to the audio file
 * @return UIImage of the album art, or nil if no cover is available
 */
+ (nullable UIImage *)readAlbumArt:(NSString *)filepath;

/**
 * Read raw album art data
 * @param filepath Full path to the audio file
 * @return Raw NSData of the album art, or nil if no cover is available
 */
+ (nullable NSData *)readAlbumArtData:(NSString *)filepath;

/**
 * Check if the file is a supported audio format
 * @param filepath File path
 * @return YES if the file format is supported
 */
+ (BOOL)isAudioFileSupported:(NSString *)filepath;

/**
 * Get the list of supported audio file extensions
 * @return Array of supported extensions (e.g. @["mp3", "m4a", "flac", ...])
 */
+ (NSArray<NSString *> *)supportedFileExtensions;

@end

NS_ASSUME_NONNULL_END

```

Here's the .m file:

``` objc
#import "MTTagLibHelper.h"

// TagLib core header files
#import <taglib/taglib.h>
#import <taglib/fileref.h>
#import <taglib/tag.h>
#import <taglib/tpropertymap.h>
#import <taglib/audioproperties.h>

// Format-specific header files (for reading album art and bit depth)
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

#pragma mark - Basic Tag Key Definitions
NSString * const MTTLMetadataTitle           = @"title";
NSString * const MTTLMetadataArtist          = @"artist";
NSString * const MTTLMetadataAlbum           = @"album";
NSString * const MTTLMetadataGenre           = @"genre";
NSString * const MTTLMetadataComment         = @"comment";
NSString * const MTTLMetadataYear            = @"year";
NSString * const MTTLMetadataTrack           = @"track";
NSString * const MTTLMetadataDiscNumber      = @"discNumber";

#pragma mark - Extended Tag Key Definitions
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

#pragma mark - Sort Tag Key Definitions
NSString * const MTTLMetadataTitleSort       = @"titleSort";
NSString * const MTTLMetadataArtistSort      = @"artistSort";
NSString * const MTTLMetadataAlbumSort       = @"albumSort";
NSString * const MTTLMetadataAlbumArtistSort = @"albumArtistSort";
NSString * const MTTLMetadataComposerSort    = @"composerSort";

#pragma mark - Audio Property Key Definitions
NSString * const MTTLMetadataDuration        = @"duration";
NSString * const MTTLMetadataDurationMs      = @"durationMs";
NSString * const MTTLMetadataBitrate         = @"bitrate";
NSString * const MTTLMetadataBitDepth        = @"bitDepth";
NSString * const MTTLMetadataSampleRate      = @"sampleRate";
NSString * const MTTLMetadataChannels        = @"channels";

#pragma mark - Album Art Key Definitions
NSString * const MTTLMetadataAlbumArt        = @"albumArt";
NSString * const MTTLMetadataAlbumArtData    = @"albumArtData";
NSString * const MTTLMetadataAlbumArtMimeType = @"albumArtMimeType";

#pragma mark - File Info Key Definitions
NSString * const MTTLMetadataFileType        = @"fileType";
NSString * const MTTLMetadataFilePath        = @"filePath";
NSString * const MTTLMetadataFileSize        = @"fileSize";

#pragma mark - Legacy Keys (Deprecated)
NSString * const TLMedtadataTitle          = @"title";
NSString * const TLMedtadataArtist         = @"artist";
NSString * const TLMedtadataAlbum          = @"album";
NSString * const TLMedtadataGenre          = @"genre";
NSString * const TLMedtadataDuration       = @"duration";


#pragma mark - PropertyMap Key Mapping Table
// Standard Key names used by TagLib PropertyMap
static NSDictionary<NSString *, NSString *> *propertyKeyMapping() {
    static NSDictionary *mapping = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        mapping = @{
            // Basic tags
            @"TITLE":           MTTLMetadataTitle,
            @"ARTIST":          MTTLMetadataArtist,
            @"ALBUM":           MTTLMetadataAlbum,
            @"GENRE":           MTTLMetadataGenre,
            @"COMMENT":         MTTLMetadataComment,
            @"DATE":            MTTLMetadataDate,
            @"TRACKNUMBER":     MTTLMetadataTrack,
            @"DISCNUMBER":      MTTLMetadataDiscNumber,
            
            // Extended tags
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
            
            // Sort tags
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

#pragma mark - Helper Methods

/// Convert TagLib::String to NSString
static NSString * _Nullable NSStringFromTagLibString(const TagLib::String &str) {
    if (str.isEmpty()) {
        return nil;
    }
    return [NSString stringWithUTF8String:str.toCString(true)];
}

/// Convert TagLib::StringList to NSString (takes the first value)
static NSString * _Nullable NSStringFromTagLibStringList(const TagLib::StringList &list) {
    if (list.isEmpty()) {
        return nil;
    }
    return NSStringFromTagLibString(list.front());
}

/// Check if file exists and is readable
static BOOL isFileReadable(NSString *filepath) {
    if (!filepath || filepath.length == 0) {
        return NO;
    }
    NSFileManager *fm = [NSFileManager defaultManager];
    return [fm fileExistsAtPath:filepath] && [fm isReadableFileAtPath:filepath];
}

/// Get file extension (lowercase)
static NSString *fileExtension(NSString *filepath) {
    return [[filepath pathExtension] lowercaseString];
}

/// Read bit depth (bitsPerSample) from different file formats
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
    // M4A/MP4/AAC (typically 16-bit, but Apple Lossless may be 16/24-bit)
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
    // Lossy formats like MP3 typically don't have a bit depth concept, return 0
    return 0;
}

/// Read album art from MP3 file
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

/// Read album art from FLAC file
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

/// Read album art from M4A/MP4 file
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

/// Read album art using generic method (TagLib 2.0+ complexProperties)
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


#pragma mark - Public Methods

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
    
    // ========== 1. Read basic tags ==========
    TagLib::Tag *tag = fileRef.tag();
    if (tag) {
        // Basic fields
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
        
        // Year and track number
        unsigned int year = tag->year();
        unsigned int track = tag->track();
        if (year > 0)  metadata[MTTLMetadataYear] = @(year);
        if (track > 0) metadata[MTTLMetadataTrack] = @(track);
    }
    
    // ========== 2. Read extended tags (via PropertyMap) ==========
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
    
    // ========== 3. Read audio properties ==========
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
    
    // Read bit depth (requires format-specific handling)
    int bitDepth = readBitDepth(cFilePath, ext);
    if (bitDepth > 0) {
        metadata[MTTLMetadataBitDepth] = @(bitDepth);
    }
    
    // ========== 4. Read album art ==========
    
    NSData *artData = nil;
    if ([ext isEqualToString:@"mp3"]) {
        artData = readAlbumArtFromMP3(cFilePath);
    } else if ([ext isEqualToString:@"flac"]) {
        artData = readAlbumArtFromFLAC(cFilePath);
    } else if ([ext isEqualToString:@"m4a"] || [ext isEqualToString:@"mp4"] || [ext isEqualToString:@"aac"]) {
        artData = readAlbumArtFromMP4(cFilePath);
    } else {
        // Try generic method
        artData = readAlbumArtGeneric(fileRef);
    }
    
    if (artData) {
        metadata[MTTLMetadataAlbumArtData] = artData;
        UIImage *image = [UIImage imageWithData:artData];
        if (image) {
            metadata[MTTLMetadataAlbumArt] = image;
        }
    }
    
    // ========== 5. Add file info ==========
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
    
    // Read bit depth
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

This article uses a file picker that can select audio files from the phone's `Files` app to retrieve metadata.

Below are the results of trying to use the `Files` app:

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

> 迈腾进行曲_整曲.m4a is a song I created using AI, intended only for testing purposes. Copyright belongs to sunyazhou.


Finally, I've prepared a [demo for download](https://github.com/sunyazhou13/libtagdemo).

The libtag library is integrated as a local pod, fully functional. Feel free to use it as needed.

# Summary

In 2026, I need to keep writing blog posts. This article introduces a utility class for audio metadata. Accumulating details is worthwhile — it will definitely come in handy at work.
