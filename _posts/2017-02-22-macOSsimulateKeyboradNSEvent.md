---
title: macOS上模拟发送键盘事件
categories: [macOS开发]
tags: [iOS开发,macOS开发]
date: 2017-02-22 16:17:00
---

![](/assets/images/20170222macOSsimulateKeyboradNSEvent/Cover.png)



最近在开发macOS远程协助功能, 需要模拟从windows传过来的键盘事件映射成macOS `NSEvent`, macOS上模拟事件都是底层的`CoreGraphic`的`class`,下面说下实现的片断代码.


1. 导入`#import <Carbon/Carbon.h>`
2. 创建`CGEventSourceRef` 事件源对象**(注意它不是OC对象,声明的时候对象前边没有`*`,而且需要用`CFRelease()`释放内存)**.
3. 创建`CGEventRef`使用`CGEventCreateKeyboardEvent`, 第三个参数`true`代表`keydown`就是键盘按键的按下状态,如果是`false`则代表`keyup`. 这里用了一个键盘`kVK_ANSI_A ` A键作为例子
4. `CGEventTapLocation` 这个是下一个函数需要的参数 应该是键盘硬件按下的键位信息(如果搞错了欢迎指正,马上修改)  
5. `CGEventPost()`发送`NSEvent`事件 
6. 释放内存

> *talk is cheap, show me the code --LINUS TORVALDS*  

下面是演示代码

``` objc 
#import <Carbon/Carbon.h>

int main(int argc, const char * argv[]) {
    @autoreleasepool {
       CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStatePrivate);
	    CGEventRef A = CGEventCreateKeyboardEvent(source, kVK_ANSI_A, true);
	    CGEventTapLocation location = kCGHIDEventTap;
	    //发送事件
	    CGEventPost(location, A);
	    CFRelease(A);
	    CFRelease(source);
    }
    return 0;
}
```

`CGEventSourceCreate()`里定义了三个**枚举**

``` objc 
typedef CF_ENUM(int32_t, CGEventSourceStateID) {
  kCGEventSourceStatePrivate = -1,
  kCGEventSourceStateCombinedSessionState = 0,
  kCGEventSourceStateHIDSystemState = 1
};
```

> `kCGEventSourceStatePrivate` 代表 专门的应用,如远程控制程序可以生成和跟踪事件源状态独立于其他进程。这些程序应该使用kCGEventSourceStatePrivate值在创建他们的事件源。  
> `kCGEventSourceStateCombinedSessionState` 该状态表反映了所有事件源的组合状态发布到当前用户的登录会话。如果您的程序发布的事件在一个登录会话,您应该使用这个源状态当你创建一个事件源。

> `kCGEventSourceStateHIDSystemState` 该状态表反映了 组合硬件输入源从HID系统硬件层面发送的事件源。生成的事件。 就是外接键盘或者macbook本机键盘以及一些系统定义的按键点击事件 

这里我使用的是第一个恰巧它有说明`remote control`

上面就是今天要分享的模拟发送系统键盘事件全部逻辑, 如有错误欢迎指正, 鄙人定当咨诹善道察纳雅言.


**附* macOS ANSI码 **枚举**

``` objc
/*
 *  Summary:
 *    Virtual keycodes
 *  
 *  Discussion:
 *    These constants are the virtual keycodes defined originally in
 *    Inside Mac Volume V, pg. V-191. They identify physical keys on a
 *    keyboard. Those constants with "ANSI" in the name are labeled
 *    according to the key position on an ANSI-standard US keyboard.
 *    For example, kVK_ANSI_A indicates the virtual keycode for the key
 *    with the letter 'A' in the US keyboard layout. Other keyboard
 *    layouts may have the 'A' key label on a different physical key;
 *    in this case, pressing 'A' will generate a different virtual
 *    keycode.
 */
enum {
  kVK_ANSI_A                    = 0x00,
  kVK_ANSI_S                    = 0x01,
  kVK_ANSI_D                    = 0x02,
  kVK_ANSI_F                    = 0x03,
  kVK_ANSI_H                    = 0x04,
  kVK_ANSI_G                    = 0x05,
  kVK_ANSI_Z                    = 0x06,
  kVK_ANSI_X                    = 0x07,
  kVK_ANSI_C                    = 0x08,
  kVK_ANSI_V                    = 0x09,
  kVK_ANSI_B                    = 0x0B,
  kVK_ANSI_Q                    = 0x0C,
  kVK_ANSI_W                    = 0x0D,
  kVK_ANSI_E                    = 0x0E,
  kVK_ANSI_R                    = 0x0F,
  kVK_ANSI_Y                    = 0x10,
  kVK_ANSI_T                    = 0x11,
  kVK_ANSI_1                    = 0x12,
  kVK_ANSI_2                    = 0x13,
  kVK_ANSI_3                    = 0x14,
  kVK_ANSI_4                    = 0x15,
  kVK_ANSI_6                    = 0x16,
  kVK_ANSI_5                    = 0x17,
  kVK_ANSI_Equal                = 0x18,
  kVK_ANSI_9                    = 0x19,
  kVK_ANSI_7                    = 0x1A,
  kVK_ANSI_Minus                = 0x1B,
  kVK_ANSI_8                    = 0x1C,
  kVK_ANSI_0                    = 0x1D,
  kVK_ANSI_RightBracket         = 0x1E,
  kVK_ANSI_O                    = 0x1F,
  kVK_ANSI_U                    = 0x20,
  kVK_ANSI_LeftBracket          = 0x21,
  kVK_ANSI_I                    = 0x22,
  kVK_ANSI_P                    = 0x23,
  kVK_ANSI_L                    = 0x25,
  kVK_ANSI_J                    = 0x26,
  kVK_ANSI_Quote                = 0x27,
  kVK_ANSI_K                    = 0x28,
  kVK_ANSI_Semicolon            = 0x29,
  kVK_ANSI_Backslash            = 0x2A,
  kVK_ANSI_Comma                = 0x2B,
  kVK_ANSI_Slash                = 0x2C,
  kVK_ANSI_N                    = 0x2D,
  kVK_ANSI_M                    = 0x2E,
  kVK_ANSI_Period               = 0x2F,
  kVK_ANSI_Grave                = 0x32,
  kVK_ANSI_KeypadDecimal        = 0x41,
  kVK_ANSI_KeypadMultiply       = 0x43,
  kVK_ANSI_KeypadPlus           = 0x45,
  kVK_ANSI_KeypadClear          = 0x47,
  kVK_ANSI_KeypadDivide         = 0x4B,
  kVK_ANSI_KeypadEnter          = 0x4C,
  kVK_ANSI_KeypadMinus          = 0x4E,
  kVK_ANSI_KeypadEquals         = 0x51,
  kVK_ANSI_Keypad0              = 0x52,
  kVK_ANSI_Keypad1              = 0x53,
  kVK_ANSI_Keypad2              = 0x54,
  kVK_ANSI_Keypad3              = 0x55,
  kVK_ANSI_Keypad4              = 0x56,
  kVK_ANSI_Keypad5              = 0x57,
  kVK_ANSI_Keypad6              = 0x58,
  kVK_ANSI_Keypad7              = 0x59,
  kVK_ANSI_Keypad8              = 0x5B,
  kVK_ANSI_Keypad9              = 0x5C
};

/* keycodes for keys that are independent of keyboard layout*/
enum {
  kVK_Return                    = 0x24,
  kVK_Tab                       = 0x30,
  kVK_Space                     = 0x31,
  kVK_Delete                    = 0x33,
  kVK_Escape                    = 0x35,
  kVK_Command                   = 0x37,
  kVK_Shift                     = 0x38,
  kVK_CapsLock                  = 0x39,
  kVK_Option                    = 0x3A,
  kVK_Control                   = 0x3B,
  kVK_RightCommand              = 0x36,
  kVK_RightShift                = 0x3C,
  kVK_RightOption               = 0x3D,
  kVK_RightControl              = 0x3E,
  kVK_Function                  = 0x3F,
  kVK_F17                       = 0x40,
  kVK_VolumeUp                  = 0x48,
  kVK_VolumeDown                = 0x49,
  kVK_Mute                      = 0x4A,
  kVK_F18                       = 0x4F,
  kVK_F19                       = 0x50,
  kVK_F20                       = 0x5A,
  kVK_F5                        = 0x60,
  kVK_F6                        = 0x61,
  kVK_F7                        = 0x62,
  kVK_F3                        = 0x63,
  kVK_F8                        = 0x64,
  kVK_F9                        = 0x65,
  kVK_F11                       = 0x67,
  kVK_F13                       = 0x69,
  kVK_F16                       = 0x6A,
  kVK_F14                       = 0x6B,
  kVK_F10                       = 0x6D,
  kVK_F12                       = 0x6F,
  kVK_F15                       = 0x71,
  kVK_Help                      = 0x72,
  kVK_Home                      = 0x73,
  kVK_PageUp                    = 0x74,
  kVK_ForwardDelete             = 0x75,
  kVK_F4                        = 0x76,
  kVK_End                       = 0x77,
  kVK_F2                        = 0x78,
  kVK_PageDown                  = 0x79,
  kVK_F1                        = 0x7A,
  kVK_LeftArrow                 = 0x7B,
  kVK_RightArrow                = 0x7C,
  kVK_DownArrow                 = 0x7D,
  kVK_UpArrow                   = 0x7E
};


```  

全文完
