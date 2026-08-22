---
layout: post
title: Jekyll-compose完全指南:你可能不知道的七个命令
date: 2026-08-22 06:24 +0000
categories: [iOS, Jekyll]
tags: [Jekyll, Blog, jekyll-compose, hexo, skills]
typora-root-url: ".."

---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 背景

上一篇[文章](/2026/08/jekyllpostscaffoldmultilang)里给博客做了类 Hexo 的文章模板和多语言创建, 当时为了确认 `bundle exec jekyll post` 的能力边界, 把本机安装的 jekyll-compose 0.12.0 源码从头到尾翻了一遍. 翻完发现这个 gem 的功能比我以为的多得多——大多数人(包括之前的我)只会用 `jekyll post` 一个命令, 其实它有完整的草稿工作流.

索性把源码里挖出来的东西整理成一篇完全指南, 所有内容均基于本机 jekyll-compose 0.12.0 源码, 不是网上二手资料.

# 命令全景

jekyll-compose 一共提供 **7 个子命令**, 覆盖"草稿 → 发布"的完整生命周期:

| 命令 | 语法 | 作用 |
| --- | --- | --- |
| `post` | `jekyll post "标题"` | 在 `_posts/` 创建带 `YYYY-MM-DD-` 前缀的文章 |
| `draft` | `jekyll draft "标题"` | 在 `_drafts/` 创建草稿, **无日期前缀** |
| `publish` | `jekyll publish _drafts/xxx.md` | 草稿转正: 移到 `_posts/`, 文件名加日期前缀, front matter 补 `date` 字段 |
| `unpublish` | `jekyll unpublish _posts/2026-08-22-xxx.md` | 反向操作: 移回 `_drafts/`, 去掉日期前缀, **删除 `date` 字段** |
| `rename` | `jekyll rename _posts/旧文件.md "新标题"` | 改名三件套: 文件名, front matter 的 `title`, 可选改日期 |
| `compose` | `jekyll compose "标题"` | 统一入口, 用 `--post` / `--draft` / `-c 集合名` 指定建到哪, 默认 post |
| `page` | `jekyll page about` | 创建静态页面, 支持 `路径/名称` 形式建子目录页面 |

其中 `draft → publish → unpublish` 这套是它最核心的设计: **先写草稿、写完再转正**, Hexo 的 `hexo publish` 就是学它的. 草稿模式下本地预览用 `jekyll serve --drafts`, 写满意了再 `publish` 转正, 不会出现"半成品直接发布"的尴尬.

# 公共选项

所有命令共享一批选项:

| 选项 | 说明 | 适用命令 |
| --- | --- | --- |
| `-d, --date 日期` | 指定文章日期, 补发旧文很有用 | post / draft / publish / rename |
| `-l, --layout 布局` | 指定 layout, 默认 `post` | 全部 |
| `-x, --extension 扩展名` | 文件扩展名, 默认 `markdown`, 可改 `md` | 全部 |
| `-f, --force` | 同名文件已存在时强制覆盖 | 全部 |
| `--timestamp-format 格式` | 自定义 `date` 字段的时间格式 | post / publish |
| `--config 文件` | 用指定配置文件创建 | 全部 |
| `--now` | rename 专用, 日期改为当前时间 | rename |
| `-c, --collection 集合` | 建到自定义集合, 如 `-c wiki` → `_wiki/` | compose |

## 常用场景示例

补发一篇旧日期的文章:

``` sh
bundle exec jekyll post "OldPost" -d 2026-08-01
```

把去年就该发的草稿转正, 日期就用当时写的:

``` sh
bundle exec jekyll publish _drafts/old-draft.md -d 2025-12-01
```

文章写完想改标题, 文件名和 front matter 一起改:

``` sh
bundle exec jekyll rename _posts/2026-08-22-old-title.md "New Title"
```

# _config.yml 配置项

jekyll-compose 只有两个配置项, 都在 `jekyll_compose` 命名空间下:

## default_front_matter: 按集合注入 front matter

``` yaml
jekyll_compose:
  default_front_matter:
    posts:          # post 命令用
      categories: [iOS]
      tags: []
      typora-root-url: ..
      math: true
    drafts:         # draft 命令用
      layout: draft
    wiki:           # compose -c wiki 用, 键 = 集合名
      foo: bar
```

**注意这里有个大坑**: 配置键是**集合名**, 所以是复数 `posts` 而不是 `post`. 源码里写死了 `front_matter_defaults_for("posts")`, 写成 `post` 不会报任何错, 静默不生效——这是不翻源码根本发现不了的.

## auto_open: 创建后自动打开编辑器

``` yaml
jekyll_compose:
  auto_open: true
```

需要配合环境变量, 优先级 `JEKYLL_EDITOR` > `VISUAL` > `EDITOR`. 比如用 Typora 打开:

``` sh
# ~/.zshrc
export JEKYLL_EDITOR="open -a Typora"
```

配置后 `jekyll post` 创建完文件直接弹出编辑器, 和 `hexo new` 的体验对齐了.

# 源码级行为细节

这几个细节都是翻 `lib/` 目录源码确认的, 每一个都可能坑到人:

## slug 化规则

文件名来自 `Jekyll::Utils.slugify`: 非 ASCII 字符全部丢弃、空格转连字符、统一转小写. 所以**中文标题会生成只有日期前缀的文件名**, 习惯是传英文标题, 建完把 front matter 里的 `title` 改成中文.

## date 是 UTC

`Time.now` 格式化输出带 `+0000`, 也就是说下午两点写的文章, front matter 里是 `06:00 +0000` 这种. 介意的话发布前手动改成 `+0800`.

## front matter 合并顺序

生成顺序是 `{layout, title}` ← `default_front_matter` 配置 ← `date`, 即配置项里什么字段都能加进来, `date` 永远最后写入不会被覆盖.

## 同名文件直接报错

文件已存在会抛异常退出, 不会提示是否覆盖, 除非显式加 `-f`.

## 路径全部硬编码

`_posts/`、`_drafts/` 写死在源码里, 没有任何配置能改. 这就是多语言博客(比如本站 `_posts/en/` 的结构)没法直接用它的原因, 只能靠包装脚本创建后移动——具体方案见上一篇文章.

# 版本现状

0.12.0 发布于 2019 年, 是到目前为止的最后一个版本. 官方仓库 [jekyll/jekyll-compose](https://github.com/jekyll/jekyll-compose) 处于维护停滞状态, 只修 bug 不加功能. 所以别指望它将来原生支持正文模板或语言子目录, 有这类需求趁早在自己博客的 `tools/` 目录里解决.

另外 `rename` 和 `publish` 对多语言目录有个天然缺陷: 它们只在 `_posts/` ↔ `_drafts/` 之间搬文件, `_posts/en/` 里的文件不认识. 多语言站的文章改名, 老老实实 `mv` 两份文件.

# 总结

- jekyll-compose 有 7 个命令, `draft/publish/unpublish` 草稿工作流是最被低估的功能
- 两个配置项: `default_front_matter`(注意键是复数集合名)和 `auto_open`(配合 `JEKYLL_EDITOR` 环境变量)
- 源码级限制: 路径硬编码、无正文模板、slug 丢中文、date 用 UTC
- 项目 2019 年起停止迭代, 深度定制只能靠自己的脚本

工具虽小, 把源码翻一遍能把每个命令的能力边界摸清楚, 用起来心里有底. 这篇和上一篇的模板方案配合, 建站工作流算是彻底理顺了.
