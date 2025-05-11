---
layout: post
title: CoreText渲染字体的时如何计算字体所需要的高度?
date: 2024-11-06 02:25 +0000
tags: [iOS, SwiftUI, Swift, Objective-C, skills]
typora-root-url: ..
---


![](/assets/images/20240727Magnificationgesture/SwiftUI.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

主要是使用 `CTFramesetterSuggestFrameSizeWithConstraints` 计算文本的高度和宽度，记得要给`CTFramesetterRef` 设置相关的属性（行间距和自动换行）。以下是使用 CoreText 绘制并计算文本高度的 Objective-C 代码示例:


``` objc
- (void)calculatedHeight:(CGSize)bounds
{
    NSString *text = @"This\nis\nsome\nmulti-line\nsample\ntext.";
    UIFont   *uiFont = [UIFont fontWithName:@"Helvetica" size:17.0];
    CTFontRef ctFont = CTFontCreateWithName((CFStringRef) uiFont.fontName, uiFont.pointSize, NULL);

    // 设置行间距
    CGFloat leading = uiFont.lineHeight - uiFont.ascender + uiFont.descender;
    CTParagraphStyleSetting LineSpacing;
        
    LineSpacing.spec = kCTParagraphStyleSpecifierLineSpacingAdjustment;
    LineSpacing.value = &leading;
    LineSpacing.valueSize = sizeof(CGFloat);
        
    // 设置换行模式
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

    // 设置字体行间距和大小
    CFAttributedStringSetAttribute(string, textRange, kCTFontAttributeName, ctFont);
    CFAttributedStringSetAttribute(string, textRange, kCTParagraphStyleAttributeName, paragraphStyle);

    CTFramesetterRef framesetter = CTFramesetterCreateWithAttributedString(string);
    CFRange fitRange;

    // 计算文本需要的高度
    CGSize frameSize = CTFramesetterSuggestFrameSizeWithConstraints(framesetter, textRange, NULL, bounds, &fitRange);

    CFRelease(framesetter);
    CFRelease(string);
}
```


# 总结

记录一些容易遗忘的代码