---
layout: post
title: NLP Tokenization Word Embedding
date: 2018-02-04 12:24:30
categories: [系统理论实践]
tags: [python]
typora-root-url: ..
math: false
mermaid: false

---

![wordembeding](/assets/images/20180204WordEmbeding/wordembeding.avif)

# Preface

Recording some Python code during the learning process

``` python
#!/usr/bin/env python
# coding:utf8

import sys
reload(sys)
sys.setdefaultencoding('utf8')

# Load packages
from gensim.models import Word2Vec
from gensim.models.word2vec import LineSentence

# Train model
# sentences = LineSentence('wiki.zh.word.text')
# size: dimension of word vectors
# window: context window size
# min_count: ignore words with frequency below min_count
# model = Word2Vec(sentences, size=128, window=5, min_count=5, workers=4)

# Save model
# model.save('word_embedding_128')

# If the model has already been saved, you can load it directly
# The training and saving code above can all be skipped
model = Word2Vec.load("word_embedding_128")

# Use the model
# Returns multiple most similar words and their corresponding similarity scores
items = model.most_similar(u'中国')
for item in items:
	# Word content, word similarity
	print item[0], item[1]

# Returns the similarity between two words
model.similarity(u'男人',  u'女人')

```
   
Tokenization references:  

HIT-SCIR LTP Tokenization  
[jieba Tokenization](https://github.com/fxsjy/jieba)  
[Stanford Tokenization](https://nlp.stanford.edu/software/segmenter.shtml)
