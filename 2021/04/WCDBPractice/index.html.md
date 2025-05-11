---
layout: post
title: WCDB实践记录
date: 2021-04-06 10:58:36
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
---


![](/assets/images/20210406WCDBPractice/wcdb.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


### 最近在忙啥？

洲哥最近在跟 WCDB 斗智斗勇,公司做 IM,一套很老的代码需要维护,为了打好底层基础,解决上层业务问题决定按批次从原来的 FMDB 迁移到 WCDB.

### 遇到的问题
 
在使用 WCDB 的过程中遇到了一个很低级的错误,就是 `where` 语句后面接的判断条件问题

先来看下代码和 业务问题的场景复现

``` objc
- (BOOL)updateMsgHeight:(SYMessage *)msg toTable:(NSString *)tableName {
    if (tableName.length == 0) { return NO; }
    if (msg.messageId.length == 0) { return NO; }
    BOOL result = [[self dataBase] updateRowsInTable:[self tablenameByID:tableName]
                                          onProperty:SYMessage.chatMsgHeight
                                           withValue:msg.chatMsgHeight
                                               where:{SYMessage.messageId == msg.messageId && 
                                               		  SYMessage.type = msg.type}];
    return result;
}
```

![](/assets/images/20210406WCDBPractice/chatlist.gif)

`cell`的高度不对劲

经过 [FLEX工具](https://github.com/FLEXTool/FLEX) 查看数据库文件,发现数据库中的`chatMsgHeight`值都是一样的.

![](/assets/images/20210406WCDBPractice/chatlist2.gif)

经过我仔细排查了所有 SQL 语句发现有一处这样的调用 在控制台.

``` sh
UPDATE msg_10003600 SET chatMsgHeight=? WHERE 1.000000 

```

它正确的形式应该是这样的

``` sh
SQL: UPDATE msg_10003600 SET chatMsgHeight=? WHERE ((messageId='936542df77de41778139a42b4f4be296') AND (type=2))
```

想都不用想`SQL`语句 `where` 后的条件 一直为 `true` ,才会出现这种低级到不能在低级的错误.

纠正原有代码如下:

``` objc
- (BOOL)updateMsgHeight:(SYMessage *)msg toTable:(NSString *)tableName {
    if (tableName.length == 0) { return NO; }
    if (msg.messageId.length == 0) { return NO; }
    BOOL result = [[self dataBase] updateRowsInTable:[self tablenameByID:tableName]
                                          onProperty:SYMessage.chatMsgHeight
                                           withValue:msg.chatMsgHeight
                                               where:{SYMessage.messageId == msg.messageId && 
                                               		  SYMessage.type == msg.type}];
    return result;
}
```
这个问题出在了`SYMessage.type == msg.type`而不是`SYMessage.type = msg.type`.

> `==` 恒等于  
> `=` 赋值  
> WCDB 并没有提示错误因为这不属于错误,这属于正常的代码赋值,C++编译器也不会报错.

所以这个`坑` 小伙伴们还是注意.虽然明明是我少写了等号导致的,毕竟 WCDB 不是编译器不能为我们纠正`词法分析`以及`语法分析`和`语义分析`亦或是`文法分析`等 编译原理的知识错误.

### 说说使用 WCDB 后的真实体验

快！ 方便！代码简洁! 

我把聊天功能涉及到的聊天会话列表、消息列表、等核心模块全部迁移到 WCDB.

还有个坑需要小伙伴们注意、FMDB 迁移到 WCDB 一定切记 `要做就做彻底`、一次全部替换、否则很容易出现队列的死锁竞争.不信邪的可以试试.


### 开发文档归类

[WCDB - 腾讯开源的移动数据库框架](https://www.bookstack.cn/read/tencent-wcdb/66f893c12ef91f78.md) 这个连接国内打开比较快

[FLEX调试工具](https://github.com/FLEXTool/FLEX) 可以实时查看 app 中各种 UIView、网络、对象、内存、沙盒文件等等.


# 总结

下一步准备看看WCDB源码实现,和分享一些经常使用的技巧, WCDB 让我重新学习了一遍数据库知识.

