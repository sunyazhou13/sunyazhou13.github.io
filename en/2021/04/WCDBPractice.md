---
layout: post
title: WCDB Practice Notes
date: 2021-04-06 10:58:36
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


![wcdb](/assets/images/20210406WCDBPractice/wcdb.avif)

# Preface

This post carries strong personal opinions; if reading it makes you uncomfortable, please close it right away. This article is only for my personal study notes. You're welcome to repost or share it within the scope of the license — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


### What have I been up to lately?

I've been wrestling with WCDB lately. My company builds an IM product, and we maintain a very old codebase. To lay a solid foundation and solve upper-layer business problems, we decided to migrate from the original FMDB to WCDB in batches.

### The problem I ran into

While using WCDB, I hit a really elementary bug: the condition placed after the `where` clause.

First, let's look at the code and a reproduction of the business problem scenario:

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

![chatlist](/assets/images/20210406WCDBPractice/chatlist.avif)

The `cell` heights look wrong.

After inspecting the database file with the [FLEX tool](https://github.com/FLEXTool/FLEX), I found that the `chatMsgHeight` values in the database were all identical.

![chatlist](/assets/images/20210406WCDBPractice/chatlist2.avif)

After carefully checking all the SQL statements, I found one call like this in the console:

``` sh
UPDATE msg_10003600 SET chatMsgHeight=? WHERE 1.000000 

```

Its correct form should be:

``` sh
SQL: UPDATE msg_10003600 SET chatMsgHeight=? WHERE ((messageId='936542df77de41778139a42b4f4be296') AND (type=2))
```

No need to think twice — the condition after `where` in the `SQL` statement was always `true`, which produced this bug so elementary it couldn't get any more elementary.

Here's the corrected code:

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
The problem was that it should be `SYMessage.type == msg.type`, not `SYMessage.type = msg.type`.

> `==` means strictly equal
> `=` means assignment
> WCDB doesn't flag an error because this isn't an error — it's a normal code assignment, and the C++ compiler won't complain either.

So watch out for this `pitfall`, folks. It was clearly caused by me leaving out an equals sign — after all, WCDB isn't a compiler and can't correct for us the `lexical analysis`, `syntax analysis`, `semantic analysis`, or `grammar analysis` errors covered in compiler theory.

### My honest experience after using WCDB

Fast! Convenient! Clean code!

I migrated all the core modules involved in the chat feature — the conversation list, the message list, all of it — to WCDB.

Another pitfall worth noting for everyone: when migrating from FMDB to WCDB, always remember — `go all the way or don't go at all`: replace everything in one pass, otherwise queue deadlocks and contention can easily occur. Don't believe me? Try it and see.


### Documentation roundup

[WCDB — Tencent's open-source mobile database framework](https://www.bookstack.cn/read/tencent-wcdb/66f893c12ef91f78.md) — this link opens fast in China

[FLEX debugging tool](https://github.com/FLEXTool/FLEX) — lets you inspect in real time all kinds of UIViews, network, objects, memory, sandbox files, and more inside the app.


# Summary

Next I plan to read WCDB's source implementation and share some frequently used techniques. WCDB made me relearn database fundamentals all over again.

