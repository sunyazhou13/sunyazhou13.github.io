---
layout: post
title: How to Calculate the Frequency of Certain Words in a Text
date: 2021-12-12 08:08:08
categories: [iOS,Swift]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

This article carries a strong personal touch; if it makes you uncomfortable, please close it as soon as possible. This article is only for personal study notes, and you're welcome to reprint or share it within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

I've been learning some Swift syntax recently, and I've taken notes on some of the more interesting bits.

## The Problem

### How do you read a text file, determine the usage frequency of all words, sort them from high to low, and print out a ranked list of all words and their frequencies?

> This question comes from a famous event in the history of computer science. It was a challenge posed by Jon Bentley, author of the "Programming Pearls" column in Communications of the ACM magazine, to computer science pioneer Donald Knuth.

Problem Abstraction

* A text string
* Split it into an array of individual word strings
* Traverse the array, filtering out words that don't need to be counted
* Count word usage frequency and print it

#### Solution Using the Traditional Programming Paradigm

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

Result:

``` sh
["in": 1, "on.": 1, "must": 1, "store": 2, "it.": 1, "blogging": 1, "views": 1, "with": 2, "arguments,": 1, "later": 1, "write": 1, "developing-related": 1, "from": 1, "out": 1, "to": 5, "theories": 1, "my": 6, "keywords": 1, "though": 1, "today": 1, "practice": 1, "more": 1, "can\'t": 1, "been": 1, "oom.": 1, "nothing.": 1, "post": 1, "storing": 1, "i": 8, "look": 1, "yesterday.": 1, "too": 1, "also": 1, "find": 1, "line": 1, "bit": 2, "the": 1, "growth": 1, "browser": 1, "tags": 1, "remembered": 1, "stack,": 1, "skills": 2, "started": 1, "process.": 1, "wasting": 1, "knowledge,": 2, "which": 1, "by": 1, "would": 1, "going": 1, "articles,": 1, "searching": 1, "some": 3, "references,": 1, "google": 1, "tutorials,": 1, "truly.": 1, "sorry": 1, "were": 1, "used": 1, "for": 2, "found": 1, "even": 1, "empty": 1, "blog": 1, "many": 1, "delete": 1, "addition,": 1, "about": 2, "tricks,": 2, "know": 1, "narrow": 1, "filled": 1, "stack": 3, "heap": 1, "related": 1, "code,": 1, "indexing,": 1, "only": 1, "articles": 1, "way,": 1, "way": 1, "record": 1, "later,": 1, "keyword": 1, "ios": 1, "not": 1, "accumulated": 1, "tabs": 1, "have": 2, "skills.": 1, "memory": 3, "them,": 1, "shared": 1, "sometimes": 1, "then": 1, "so": 4, "through": 1, "reference": 1, "poisoned.": 1, "them.": 1, "brain": 1, "ashamed": 1, "immature": 1, "etc.,": 1, "articles.": 1, "overflow,": 1, "people": 1, "is": 3, "made": 1, "otherwise": 1, "time": 1, "they": 1, "are": 2, "few": 1, "doing": 1, "because": 1, "that": 2, "decided": 1, "should": 1, "yours": 1, "like": 2, "use": 1]
```

#### Solution Using the Functional Programming Paradigm

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
Result:

``` sh
["storing": 1, "were": 1, "also": 1, "many": 1, "like": 2, "filled": 1, "used": 1, "process.": 1, "skills.": 1, "more": 1, "find": 1, "record": 1, "tricks,": 2, "found": 1, "oom.": 1, "later": 1, "which": 1, "yours": 1, "ashamed": 1, "tabs": 1, "though": 1, "can\'t": 1, "blog": 1, "way,": 1, "reference": 1, "out": 1, "post": 1, "write": 1, "i": 8, "store": 2, "ios": 1, "is": 3, "they": 1, "brain": 1, "growth": 1, "with": 2, "overflow,": 1, "wasting": 1, "would": 1, "time": 1, "even": 1, "to": 5, "articles,": 1, "tags": 1, "developing-related": 1, "made": 1, "doing": 1, "browser": 1, "then": 1, "people": 1, "later,": 1, "accumulated": 1, "yesterday.": 1, "know": 1, "going": 1, "the": 1, "through": 1, "addition,": 1, "my": 6, "remembered": 1, "theories": 1, "look": 1, "them.": 1, "articles.": 1, "stack": 3, "narrow": 1, "should": 1, "so": 4, "google": 1, "too": 1, "bit": 2, "heap": 1, "articles": 1, "it.": 1, "keyword": 1, "today": 1, "way": 1, "some": 3, "code,": 1, "started": 1, "keywords": 1, "shared": 1, "indexing,": 1, "use": 1, "arguments,": 1, "few": 1, "stack,": 1, "blogging": 1, "nothing.": 1, "are": 2, "views": 1, "must": 1, "references,": 1, "poisoned.": 1, "empty": 1, "decided": 1, "sorry": 1, "searching": 1, "by": 1, "knowledge,": 2, "not": 1, "for": 2, "about": 2, "them,": 1, "been": 1, "delete": 1, "line": 1, "because": 1, "from": 1, "memory": 3, "related": 1, "that": 2, "on.": 1, "truly.": 1, "etc.,": 1, "tutorials,": 1, "in": 1, "have": 2, "practice": 1, "skills": 2, "only": 1, "immature": 1, "otherwise": 1, "sometimes": 1]

```

### Extended Problem

* Find the position of the first character in a string that appears in a given character array. For example, for "Hello， World" and ["a", "e", "i", "o", "u"], "e" is the first character in the string that appears in the array, at position 1, so return 1.
* Hint: the zip function

> This question is the one most frequently asked in interviews!

``` swift
let source = "Hello world"
let target: [Character] = ["a","e","i","o","u"]
zip(0..<source.count, source).forEach { (index, char) in
   if target.contains(char) {
       print(index)
   }
}
```

The result is:

``` sh
1
4
7
```

### What Is the zip Function?

In Swift, the `zip` function isn't for compressing files. Its purpose is to combine the elements of two sequences one-to-one into a new sequence.

eg:

``` swift
let a = [1, 2, 3, 4, 5]
let b = ["a", "b", "c", "d"]
let c = zip(a, b).map { $0 }
print(c)
//输出 [(1, "a"), (2, "b"), (3, "c"), (4, "d")]
```

Or:

``` swift
let b = ["a", "b", "c", "d"]
let c = zip(1..., b).map { $0 }
print(c)
//输出 [(1, "a"), (2, "b"), (3, "c"), (4, "d")]
```

> Reference: [Swift - Detailed Explanation of the zip Function (with examples)](https://www.hangge.com/blog/cache/detail_1829.html)


# Summary

After reading this article, did you learn?

* How to calculate the frequency of words appearing in a text
* How to find the position of the first character in a string that appears in a given character array
* How to use the zip() function in Swift

Technical skills require continuous learning; weekend time shouldn't be wasted. After studying for an afternoon, I've recorded all the important content. If you don't understand it fully, I recommend carefully studying Swift once and you'll get it.
