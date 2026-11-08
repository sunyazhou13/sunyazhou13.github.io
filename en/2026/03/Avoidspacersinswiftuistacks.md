---
layout: post
title: Avoid Using Spacer in SwiftUI Stacks
date: 2026-03-16 03:38 +0000
categories: [iOS, SwiftUI]
tags: [skills, iOS, Swift, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

This post is strongly colored by personal opinions. If it makes you uncomfortable, please close the page as soon as possible. This post is for personal learning records only. Reposting or sharing within the scope of the license agreement is welcome, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

This post is translated from


**Author:** Pavel Zak  
**Published:** April 6, 2023  
**Original article:** https://nerdyak.tech/development/2023/04/06/avoid-swiftui-spacers-in-stacks.html  
**Reading time:** about 1 minute

---


While teaching SwiftUI, I found a very common pattern that brings a subtle layout bug.

## Common Pattern

```swift
HStack(spacing: 12) {
    Text(self.text)
    Spacer()
    Image(systemName: "tortoise.fill")
}
```

This is a natural layout idea — using `Spacer()` to separate the text on the left from the icon on the right. But when the text is long, the gap between the text and the icon becomes **much larger than the expected 12pt**.

![Typical view layout example](/assets/images/20260316AvoidSpacersInSwiftUIStacks/14_cell.avif)

---

## Problem Analysis

Replace the views with colors to see the problem clearly:

```swift
HStack(spacing: 12) {
    Color.blue
    Spacer()
    Color.red
}
```

Although `Spacer` itself takes up no width, the Stack still adds a **12pt spacing on each side of it**, making the actual gap 24pt — doubled.

![Expected layout vs. the actual problem](/assets/images/20260316AvoidSpacersInSwiftUIStacks/14_colors.avif)

---

## Solutions

### Option 1: Remove spacing and use padding

Remove the `spacing` parameter from the HStack and manually add padding to the child views.

### Option 2: Replace Spacer with `.frame(maxWidth: .infinity)` (recommended)

```swift
HStack(spacing: 12) {
    Text(self.text)
        .frame(maxWidth: .infinity, alignment: .leading)
    Image(systemName: "tortoise.fill")
}
```

![Comparison of the two solutions](/assets/images/20260316AvoidSpacersInSwiftUIStacks/14_comparison.avif)

---

## Why Recommended

The `.frame(maxWidth: .infinity)` approach is recommended for the following reasons:

- **Cleaner code**: no extra `Spacer()` view needed
- **More flexible alignment**: the `alignment` parameter sets how the stretched view aligns its content (`.leading`, `.center`, `.trailing`, etc.)
- **Safer with optional views**: no unexpected spacing accumulation when the Stack contains optional views

---

## Summary

> In a SwiftUI Stack with `spacing`, `Spacer()` adds an extra spacing on each side, doubling the gap.  
> Use `.frame(maxWidth: .infinity, alignment: .leading)` instead of `Spacer()`.
