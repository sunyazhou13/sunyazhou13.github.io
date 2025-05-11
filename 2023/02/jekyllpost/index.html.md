---
layout: post
title: 如何使用jekyll发布一篇文章
date: 2023-02-02 10:21 +0800
categories: [系统理论实践]
tags: [Linux, shell]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## jekyll 

我的博客开始使用的是hexo,后来[`喵神`](https://onevcat.com/) 把博客换成以jekyll的形式,我还是很喜欢的.可是之前hexo要写一篇文章直接就可以用

``` sh
hexo new "202300202XXXPaper"

```
的形式 通过模版生成一个markdown文件.

> 具体使用一看看[hexo 指令](https://hexo.io/zh-cn/docs/commands.html)


然而新的[https://github.com/cotes2020/jekyll-theme-chirpy/ 主题](https://github.com/cotes2020/jekyll-theme-chirpy/) 在喵大的简化版本里面还是比较简单实用的,唯独缺少了 如何快速写文章的操作.

经过和喵神邮件请教

![](/assets/images/20230202JekyllPost/email.webp)

喵神不但回复了我并表示 他不是很经常写文章,这种操作他都是复制一下原来的也不麻烦.邮件末尾喵神给出来一个非常实用的 stackoverflow的答案.

![](/assets/images/20230202JekyllPost/answer.webp)

在我的博客中有一个`Gemfile`文件 

``` sh
source "https://rubygems.org"

gem "jekyll", ">=3.8.6"

# Official Plugins
group :jekyll_plugins do
  gem "jekyll-paginate"
  gem "jekyll-redirect-from"
  gem "jekyll-seo-tag", "~> 2.6.1"
  gem 'jekyll-compose' //新增这个
end

group :test do
  gem "html-proofer"
end

```

然后执行一次

``` sh
bundle install
```
这样会保证所需要的类库全部load, 这里可以配置 rubychina的镜像或者科学上网

剩下的就是每次发文章执行

``` sh
$ bundle exec jekyll post "My New Post"
```

> `$`这个符号不要复制哈,这是表示你用shell终端执行的命令. 

生成后这玩意会自动标识年月格式

``` sh
bundle exec jekyll post "jekyllpost"
```

![](/assets/images/20230202JekyllPost/post.webp)

### 疑问

这里生成的markdown没有hexo中的模版那样能自定义,我没找到 如果你感兴趣可以一起研究一下.

[Why isn't there a "jekyll post" command to create posts like in hexo?](https://stackoverflow.com/questions/43416113/why-isnt-there-a-jekyll-post-command-to-create-posts-like-in-hexo)

# 总结

这个命令工具非常适合我这种经常发表文章的使用,希望能帮助一些使用jekyll的伙伴.


