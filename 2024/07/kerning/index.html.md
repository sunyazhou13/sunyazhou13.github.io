---
layout: post
title: Kerning文字排版计算
date: 2024-07-18 07:01 +0000
categories: [iOS, SwiftUI]
tags: [iOS,iPadOS,watchOS, SwiftUI,Masonry]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 记录一段代码用于解决iOS文字排版的技术问题

``` objc
CFAttributedStringRef attributedString;
CTTypesetterRef typesetter = CTTypesetterCreateWithAttributedString(attributedString);
CTLineRef line = CTTypesetterCreateLine(typesetter, CFRangeMake(0, 0));
NSArray *runs = (__bridge NSArray *)CTLineGetGlyphRuns(line);

CTRunRef run = (__bridge CTRunRef)runs[runIdx];

const CFIndex glyphCount = CTRunGetGlyphCount(run);
CGPoint *glyphPositions = malloc(sizeof(CGPoint) * glyphCount);
CTRunGetPositions(run, CFRangeMake(0, 0), glyphPositions);

CGRect bounds = CTRunGetImageBounds(run, NULL, CFRangeMake(0, 0));

CGGlyph *glyphs = malloc(sizeof(CGGlyph) * glyphCount);
CTRunGetGlyphs(run, CFRangeMake(0, 0), glyphs);

NSDictionary *runAttributes = (__bridge NSDictionary *)CTRunGetAttributes(run);
CTFontRef font = (__bridge CTFontRef)runAttributes[NSFontAttributeName];

CGSize size;
CTFontGetAdvancesForGlyphs(font, 0, &glyphs[glyphIdx], &size, 1);
            
CTFontGetBoundingRectsForGlyphs()

CTRunGetPositions(run, CFRangeMake(0, 0), glyphPositions);//这个应该拿到的就是带Kerning信息的position
```

以上代码需要写demo验证.