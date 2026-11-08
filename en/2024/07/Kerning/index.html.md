---
layout: post
title: Kerning Text Layout Calculation
date: 2024-07-18 07:01 +0000
categories: [iOS, SwiftUI]
tags: [iOS,iPadOS,watchOS, SwiftUI,Masonry]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

This post is strongly colored by personal opinions. If it makes you uncomfortable, please close the page as soon as possible. This post is for personal learning records only. Reposting or sharing within the scope of the license agreement is welcome, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


## A Piece of Code to Solve an iOS Text Layout Issue

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

This code still needs a demo to verify.
