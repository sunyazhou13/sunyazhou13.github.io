---
title: 自定义NSTableRowView实现鼠标跟踪动态显示选中/非选中颜色
categories: [ios开发]
tags: [ios, macos]
date: 2017-05-10 15:24:20
---

``` objc
#import "BDRowView.h"


#define k_NORMAL_COLOR [NSColor colorFromInt:0xfcfdfe]
#define k_SELECTED_COLOR [NSColor colorFromInt:0xeff1f3]

@interface BDRowView ()
@property(strong) NSTrackingArea *trackingArea;
@property(assign) BOOL isHovering;
@end

@implementation BDRowView

- (void)drawRect:(NSRect)dirtyRect {
    [super drawRect:dirtyRect];
}


- (void)drawSelectionInRect:(NSRect)dirtyRect {
    if (self.selectionHighlightStyle != NSTableViewSelectionHighlightStyleNone) {
        NSRect selectionRect = NSInsetRect(self.bounds, 0, 0);
        [k_SELECTED_COLOR setStroke];
        [k_SELECTED_COLOR setFill];
        NSBezierPath *selectionPath = [NSBezierPath bezierPathWithRoundedRect:selectionRect xRadius:0 yRadius:0];
        [selectionPath fill];
        [selectionPath stroke];
    }
}

-(void)updateTrackingAreas
{
    if(self.trackingArea != nil) {
        [self removeTrackingArea:self.trackingArea];
    }
    
    int opts = (NSTrackingMouseEnteredAndExited | NSTrackingMouseMoved | NSTrackingActiveAlways);
    self.trackingArea = [ [NSTrackingArea alloc] initWithRect:[self bounds]
                                                      options:opts
                                                        owner:self
                                                     userInfo:nil];
    [self addTrackingArea:self.trackingArea];
}

- (void)mouseEntered:(NSEvent *)theEvent {
    self.isHovering = YES;
    [self setBackgroundColor:[self getBackgroundColor:YES]];
}

- (void)mouseExited:(NSEvent *)theEvent {
    self.isHovering = NO;
    [self setBackgroundColor:[self getBackgroundColor:NO]];
}

-(NSColor*)getBackgroundColor:(BOOL)isSelected
{
    if(isSelected) {
        return k_SELECTED_COLOR;
    }else{
        return k_NORMAL_COLOR;
    }
}

@end
```
