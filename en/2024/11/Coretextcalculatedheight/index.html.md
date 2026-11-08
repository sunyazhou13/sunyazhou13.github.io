---
layout: post
title: How to Calculate the Font Height Needed When Rendering with CoreText?
date: 2024-11-06 02:25 +0000
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


![Swift UI](/assets/images/20240727Magnificationgesture/SwiftUI.avif)

# Introduction

This article carries strong personal sentiment. If you feel uncomfortable reading it, please close it as soon as possible. This article is only used as a personal learning record, and you are also welcome to reprint or share it within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you think this site is helpful to you, you can subscribe to it via RSS. Thanks for your support!

The main idea is to use `CTFramesetterSuggestFrameSizeWithConstraints` to calculate the height and width of the text. Remember to set the related properties (line spacing and automatic line wrapping) for the `CTFramesetterRef`. Here's an Objective-C example that uses CoreText to draw text and calculate its height:

``` objc
- (void)calculatedHeight:(CGSize)bounds
{
    NSString *text = @"This\nis\nsome\nmulti-line\nsample\ntext.";
    UIFont   *uiFont = [UIFont fontWithName:@"Helvetica" size:17.0];
    CTFontRef ctFont = CTFontCreateWithName((CFStringRef) uiFont.fontName, uiFont.pointSize, NULL);

    // Set line spacing
    CGFloat leading = uiFont.lineHeight - uiFont.ascender + uiFont.descender;
    CTParagraphStyleSetting LineSpacing;
        
    LineSpacing.spec = kCTParagraphStyleSpecifierLineSpacingAdjustment;
    LineSpacing.value = &leading;
    LineSpacing.valueSize = sizeof(CGFloat);
        
    // Set line break mode
    CTParagraphStyleSetting lineBreakMode;
    CTLineBreakMode lineBreak = kCTLineBreakByCharWrapping;
    lineBreakMode.spec = kCTParagraphStyleSpecifierLineBreakMode;
    lineBreakMode.value = &lineBreak;
    lineBreakMode.valueSize = sizeof(CTLineBreakMode);

    CTParagraphStyleSetting paragraphSettings[] = {lineBreakMode,LineSpacing};

    CTParagraphStyleRef  paragraphStyle = CTParagraphStyleCreate(paragraphSettings, 2);
    CFRange textRange = CFRangeMake(0, text.length);

    CFMutableAttributedStringRef string = CFAttributedStringCreateMutable(kCFAllocatorDefault, text.length);
    CFAttributedStringReplaceString(string, CFRangeMake(0, 0), (CFStringRef) text);

    // Set font line spacing and size
    CFAttributedStringSetAttribute(string, textRange, kCTFontAttributeName, ctFont);
    CFAttributedStringSetAttribute(string, textRange, kCTParagraphStyleAttributeName, paragraphStyle);

    CTFramesetterRef framesetter = CTFramesetterCreateWithAttributedString(string);
    CFRange fitRange;

    // Calculate the height needed by the text
    CGSize frameSize = CTFramesetterSuggestFrameSizeWithConstraints(framesetter, textRange, NULL, bounds, &fitRange);

    CFRelease(framesetter);
    CFRelease(string);
}
```


# Summary

Recording some easily forgotten code
