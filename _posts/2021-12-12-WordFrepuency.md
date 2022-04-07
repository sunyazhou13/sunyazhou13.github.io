---
title: 如何计算文本中某些单词出现的频率
categories: [iOS,swift]
tags: [iOS, 学习笔记]
date: 2021-12-12 08:08:08
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或使用,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,这样您将能在第一时间获取本站信息.

最近在学习一些Swift中的语法,有些比较有意思的内容我都记了笔记

## 先看问题

### 如何读入一个文本文件，确定所有单词的使用频率并从高到低排序，打印出所有单词及其频率的排序列表？

> 这道题目出自计算机科学史上的著名事件，是当年 Communications of the ACM 杂 志“Programming Pearls”专栏的作者 Jon Bentley 向计算机科学先驱 Donald Knuth 提出的挑战

问题抽象

* 文本字符串
* 切分成单个单词的字符串数组
* 遍历数组,过滤不需要统计的单词
* 统计单词使用频率并打印


#### 传统编程范式解法

``` swift 
import UIKit

let words = "Blogging is about going through a memory stack of searching and storing knowledge, references, keyword indexing, and so on. Because my brain started like a memory stack, from empty stack to stack overflow, later use heap to store knowledge, found that memory is also OOM. Then I used reference tags to store iOS developing-related articles, tutorials, tricks, tricks, practice code, etc., which made my browser tabs look like they were poisoned. Later, I only remembered a few keywords to Google related articles. Sometimes some people post articles and delete them, so I can't find them. In addition, I have accumulated some skills and shared some skills. So I decided to blog about it. My skills are way, way out of line with yours truly. So I should write more and record the bit by bit of my growth process. Even though my views are filled with too many narrow theories and immature arguments, I must know that today is not yesterday. Otherwise I would have been sorry for wasting my time and ashamed for doing nothing."
let NON_WORDS = ["a", "of", "and", "!"]
func wordFrep(word: String) -> [String: Int] {
    var wordDict:[String: Int] = [:]
    let wordList = words.split(separator: " ");
    for word in wordList {
        let lowercaseWord = word.lowercased()
        if !NON_WORDS.contains(lowercaseWord) {
            if let count = wordDict[lowercaseWord] {
                wordDict[lowercaseWord] = count + 1
            } else {
                wordDict[lowercaseWord] = 1
            }
        }
    }
    return wordDict
}
print(wordFrep(word: words))
```

结果:

``` sh
["in": 1, "on.": 1, "must": 1, "store": 2, "it.": 1, "blogging": 1, "views": 1, "with": 2, "arguments,": 1, "later": 1, "write": 1, "developing-related": 1, "from": 1, "out": 1, "to": 5, "theories": 1, "my": 6, "keywords": 1, "though": 1, "today": 1, "practice": 1, "more": 1, "can\'t": 1, "been": 1, "oom.": 1, "nothing.": 1, "post": 1, "storing": 1, "i": 8, "look": 1, "yesterday.": 1, "too": 1, "also": 1, "find": 1, "line": 1, "bit": 2, "the": 1, "growth": 1, "browser": 1, "tags": 1, "remembered": 1, "stack,": 1, "skills": 2, "started": 1, "process.": 1, "wasting": 1, "knowledge,": 2, "which": 1, "by": 1, "would": 1, "going": 1, "articles,": 1, "searching": 1, "some": 3, "references,": 1, "google": 1, "tutorials,": 1, "truly.": 1, "sorry": 1, "were": 1, "used": 1, "for": 2, "found": 1, "even": 1, "empty": 1, "blog": 1, "many": 1, "delete": 1, "addition,": 1, "about": 2, "tricks,": 2, "know": 1, "narrow": 1, "filled": 1, "stack": 3, "heap": 1, "related": 1, "code,": 1, "indexing,": 1, "only": 1, "articles": 1, "way,": 1, "way": 1, "record": 1, "later,": 1, "keyword": 1, "ios": 1, "not": 1, "accumulated": 1, "tabs": 1, "have": 2, "skills.": 1, "memory": 3, "them,": 1, "shared": 1, "sometimes": 1, "then": 1, "so": 4, "through": 1, "reference": 1, "poisoned.": 1, "them.": 1, "brain": 1, "ashamed": 1, "immature": 1, "etc.,": 1, "articles.": 1, "overflow,": 1, "people": 1, "is": 3, "made": 1, "otherwise": 1, "time": 1, "they": 1, "are": 2, "few": 1, "doing": 1, "because": 1, "that": 2, "decided": 1, "should": 1, "yours": 1, "like": 2, "use": 1]
```

#### 函数式编程解法

``` swift
import UIKit

let words = "Blogging is about going through a memory stack of searching and storing knowledge, references, keyword indexing, and so on. Because my brain started like a memory stack, from empty stack to stack overflow, later use heap to store knowledge, found that memory is also OOM. Then I used reference tags to store iOS developing-related articles, tutorials, tricks, tricks, practice code, etc., which made my browser tabs look like they were poisoned. Later, I only remembered a few keywords to Google related articles. Sometimes some people post articles and delete them, so I can't find them. In addition, I have accumulated some skills and shared some skills. So I decided to blog about it. My skills are way, way out of line with yours truly. So I should write more and record the bit by bit of my growth process. Even though my views are filled with too many narrow theories and immature arguments, I must know that today is not yesterday. Otherwise I would have been sorry for wasting my time and ashamed for doing nothing."
let NON_WORDS = ["a", "of", "and", "!"]
func wordFrep2(words: String) -> [String: Int] {
    var wordDict: [String: Int] = [:]
    let wordList = words.split(separator: " ")
    wordList.map { $0.lowercased()}
            .filter{ !NON_WORDS.contains($0)}
            .forEach { wordDict[$0] = (wordDict[$0] ?? 0) + 1 }
    return wordDict
}
print(wordFrep2(words: words))
```
结果:

``` sh
["storing": 1, "were": 1, "also": 1, "many": 1, "like": 2, "filled": 1, "used": 1, "process.": 1, "skills.": 1, "more": 1, "find": 1, "record": 1, "tricks,": 2, "found": 1, "oom.": 1, "later": 1, "which": 1, "yours": 1, "ashamed": 1, "tabs": 1, "though": 1, "can\'t": 1, "blog": 1, "way,": 1, "reference": 1, "out": 1, "post": 1, "write": 1, "i": 8, "store": 2, "ios": 1, "is": 3, "they": 1, "brain": 1, "growth": 1, "with": 2, "overflow,": 1, "wasting": 1, "would": 1, "time": 1, "even": 1, "to": 5, "articles,": 1, "tags": 1, "developing-related": 1, "made": 1, "doing": 1, "browser": 1, "then": 1, "people": 1, "later,": 1, "accumulated": 1, "yesterday.": 1, "know": 1, "going": 1, "the": 1, "through": 1, "addition,": 1, "my": 6, "remembered": 1, "theories": 1, "look": 1, "them.": 1, "articles.": 1, "stack": 3, "narrow": 1, "should": 1, "so": 4, "google": 1, "too": 1, "bit": 2, "heap": 1, "articles": 1, "it.": 1, "keyword": 1, "today": 1, "way": 1, "some": 3, "code,": 1, "started": 1, "keywords": 1, "shared": 1, "indexing,": 1, "use": 1, "arguments,": 1, "few": 1, "stack,": 1, "blogging": 1, "nothing.": 1, "are": 2, "views": 1, "must": 1, "references,": 1, "poisoned.": 1, "empty": 1, "decided": 1, "sorry": 1, "searching": 1, "by": 1, "knowledge,": 2, "not": 1, "for": 2, "about": 2, "them,": 1, "been": 1, "delete": 1, "line": 1, "because": 1, "from": 1, "memory": 3, "related": 1, "that": 2, "on.": 1, "truly.": 1, "etc.,": 1, "tutorials,": 1, "in": 1, "have": 2, "practice": 1, "skills": 2, "only": 1, "immature": 1, "otherwise": 1, "sometimes": 1]

```

### 问题引申

* 找到一个字符串里面某个字符数组里面第一个出现的字符的位置。比如“Hello， World”，[“a”, “e”, “i”, “o”, “u”]，那 e 是在字符串第一个出现的字符，位置是 1， 返回 1
* 提示:zip函数

> 这个问题面试中问的最多!


``` swift
let source = "Hello world"
let target: [Character] = ["a","e","i","o","u"]
zip(0..<source.count, source).forEach { (index, char) in
   if target.contains(char) {
       print(index)
   }
}
```

得出结果

``` sh
1
4
7
```

### 啥是zip函数？

swift中这个 zip 函数可不是用来压缩文件的，其作用是将两个序列的元素，一一对应合并生成一个新序列

eg:

``` swift
let a = [1, 2, 3, 4, 5]
let b = ["a", "b", "c", "d"]
let c = zip(a, b).map { $0 }
print(c)
//输出 [(1, "a"), (2, "b"), (3, "c"), (4, "d")]
```

又或者

``` swift
let b = ["a", "b", "c", "d"]
let c = zip(1..., b).map { $0 }
print(c)
//输出 [(1, "a"), (2, "b"), (3, "c"), (4, "d")]
```

> 参考[Swift - zip函数使用详解（附样例）](https://www.hangge.com/blog/cache/detail_1829.html)


# 总结

经过本篇文章学习你学会了？

* 如何解决文本中计算单词出现的频率
* 如何找到一个字符串里面某个字符数组里面第一个出现的字符的位置
* swift中的zip()函数使用

技术要求我们不断学习,周末的时光不能浪费. 学习了一个下午,把重要的内容都记录了下来,如果你看的不是很懂建议认真学习一遍swift就会了.