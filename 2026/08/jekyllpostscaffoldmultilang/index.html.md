---
layout: post
title: Jekyll博客支持类Hexo的文章模板与多语言创建
date: 2026-08-22 06:06 +0000
categories: [iOS, Jekyll]
tags: [Jekyll, Blog, hexo, polyglot, skills]
typora-root-url: ".."

---

![cover](/assets/images/20260822Jekyllpostscaffoldmultilang/cover.avif)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 背景

写博客这几年,建文章的流程一直有点别扭. 本站基于 Jekyll + Chirpy 主题,创建文章用的是 [jekyll-compose](https://github.com/jekyll/jekyll-compose) 提供的命令:

``` sh
bundle exec jekyll post "My New Post"
```

之前从 Hexo 转过来的朋友都知道, Hexo 有个非常好用的机制: `hexo new` 会从 `scaffolds/post.md` 模板创建文章,模板里的通用文案(比如本站每篇文章开头那段"前言"声明)自动带出来,不用每次手打或复制.

而 Jekyll 这边有两个痛点:

1. **没有正文模板**: jekyll-compose 只生成 front matter,正文空的,每篇文章开头那段声明要手动粘贴
2. **多语言不友好**: 本站用 [jekyll-polyglot](https://github.com/untra/polyglot) 做了中英双语,中文文章放 `_posts/`,英文文章放 `_posts/en/`,但 `jekyll post` 命令只往 `_posts/` 里建,英文版要手动复制改名

这次把这两个问题一起解决了, 用一个包装脚本实现了类 Hexo 的模板机制 + 一条命令创建多语言文章.

# 现状分析

动手之前先翻了 jekyll-compose 0.12.0 的源码,确认了两件事:

## 路径写死,无法指定语言目录

`lib/jekyll/commands/post.rb` 里:

``` ruby
class PostFileInfo < Compose::FileInfo
  def path
    "_posts/#{file_name}"
  end
end
```

创建路径硬编码为 `_posts/`,没有任何参数或配置可以指定子目录. 想让命令直接建到 `_posts/en/` 是不可能的,只能创建后移动.

## 不支持正文模板

`lib/jekyll-compose/file_info.rb` 里:

``` ruby
def content(custom_front_matter = {})
  front_matter = YAML.dump({
    "layout" => params.layout,
    "title"  => params.title,
  }.merge(custom_front_matter))

  front_matter + "---\n"
end
```

`content` 方法只输出 YAML front matter 就结束了, 没有任何读取模板文件注入正文的逻辑. 也就是说插件层面根本不提供这个能力, 只能在脚本层做.

唯一可配置的是 `default_front_matter`, 往 front matter 里合并自定义字段, 这个后面会用到.

## 多语言的识别机制

本站的 polyglot 配置:

``` yaml
languages: ["zh", "en"]
default_lang: "zh"
lang_from_path: true
```

`lang_from_path: true` 表示从路径推断语言: `_posts/` 根目录是默认语言中文, `_posts/en/` 下的文章自动识别为英文, **不需要**在 front matter 里手写 `lang: en`.

还有一个关键点: 中英文两个版本必须**文件名完全一致**, polyglot 才会把它们识别为同一篇文章的互译, 生成 hreflang 标签和语言切换链接.

# 实现方案

整体思路很直接: 写一个 `tools/newpost.sh` 包装脚本, 调用 jekyll-compose 创建文章后, 自动处理目录移动和模板注入.

## 目录结构

``` sh
tools/
├── newpost.sh              # 文章创建脚本
└── scaffolds/              # 正文模板目录(类 hexo scaffolds)
    ├── post.md             # 中文模板
    └── post.en.md          # 英文模板
```

## 正文模板

`tools/scaffolds/post.md`, 就是本站每篇文章的标准开头:

``` markdown
# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!
```

`tools/scaffolds/post.en.md` 是对应的英文版. 想改通用文案, 直接改模板文件即可, 对之后所有新文章生效, 和 Hexo 改 `scaffolds/post.md` 一个体验.

## front matter 模板

jekyll-compose 原生支持在 `_config.yml` 里配置默认 front matter:

``` yaml
jekyll_compose:
  default_front_matter:
    posts:
      categories: [iOS]
      tags: []
      typora-root-url: ..
```

**注意这里有个坑**: 配置键必须是 `posts`(复数), 写成 `post` 会静默不生效. 源码里写死了 `front_matter_defaults_for("posts")`, 不翻源码根本发现不了.

## 创建脚本

`tools/newpost.sh` 核心逻辑:

``` bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EN_DIR="$ROOT/_posts/en"

# 解析参数: 第一个参数若是 zh/en/both 且后面还有标题, 则按显式模式; 否则视为标题
if [[ "$1" == zh || "$1" == en || "$1" == both ]] && [[ $# -ge 2 ]]; then
  LANG_ARG="$1"
  TITLE="$2"
else
  TITLE="$1"
  # 默认模式: _posts/en/ 存在则双语, 否则只建中文
  if [[ -d "$EN_DIR" ]]; then
    LANG_ARG="both"
  else
    LANG_ARG="zh"
  fi
fi

create_post() {
  # 输出形如 "New post created at \e[36m_posts/xxx.md\e[0m "
  # 需去掉前缀和 ANSI 颜色码, 否则路径判断会失败
  bundle exec jekyll post "$TITLE" 2>&1 \
    | grep "New post created at" \
    | sed -e $'s/\x1b\\[[0-9;]*m//g' \
          -e 's/^New post created at //' \
          -e 's/[[:space:]]*$//'
}

# 将模板内容追加到文章正文
apply_scaffold() {
  local file="$1" lang="$2" s
  if [[ "$lang" == "en" ]]; then
    s="$ROOT/tools/scaffolds/post.en.md"
  else
    s="$ROOT/tools/scaffolds/post.md"
  fi
  [[ -f "$s" ]] || return 0
  printf '\n' >> "$file"
  cat "$s" >> "$file"
}

FILE=$(create_post)

case "$LANG_ARG" in
  zh)
    apply_scaffold "$ROOT/$FILE" zh
    ;;
  en)
    [[ -d "$EN_DIR" ]] || mkdir -p "$EN_DIR"
    mv "$ROOT/$FILE" "$EN_DIR/"
    apply_scaffold "$EN_DIR/$(basename "$FILE")" en
    ;;
  both)
    [[ -d "$EN_DIR" ]] || mkdir -p "$EN_DIR"
    # 先复制干净的英文版(未注入中文模板), 再分别注入各自模板
    cp "$ROOT/$FILE" "$EN_DIR/$(basename "$FILE")"
    apply_scaffold "$ROOT/$FILE" zh
    apply_scaffold "$EN_DIR/$(basename "$FILE")" en
    ;;
esac
```

# 使用方法

``` sh
# 最常用: 直接传标题, 默认创建双语
bash tools/newpost.sh "My New Post"

# 只建中文
bash tools/newpost.sh zh "My New Post"

# 只建英文(自动建到 _posts/en/)
bash tools/newpost.sh en "My New Post"

# 强制双语(_posts/en/ 不存在时也会创建目录)
bash tools/newpost.sh both "My New Post"

# 同时创建配图资源目录(--img 或 -i, 参数位置随意)
bash tools/newpost.sh --img "My New Post"
```

默认模式的逻辑: 检测 `_posts/en/` 目录, 存在就同时建中英两份, 不存在就只建中文. 一条命令下去, 生成效果:

``` markdown
---
layout: post
title: My New Post
date: 2026-08-22 06:06 +0000
categories: [iOS]
tags: []
typora-root-url: ".."
math: true
mermaid: true
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!
```

英文版自动换成英文 Preface 模板, 中英文文件名一致, polyglot 直接识别为互译.

带 `--img`(或简写 `-i`)时, 会额外创建配图资源目录, 命名规则沿用全站惯例: **日期无分隔符 + 文章 slug 首字母大写**, 比如 2026-08-22 创建 `my-new-post` 这篇文章, 对应生成:

``` sh
assets/images/20260822MyNewPost/
```

图片直接丢进这个目录, 文章里用 `![描述](/assets/images/20260822MyNewPost/xxx.avif)` 引用即可. 默认不创建这个目录, 毕竟不是每篇文章都有配图.

# 踩坑记录

这次踩的坑都记录一下, 每一个都是翻源码才定位到的:

1. **ANSI 颜色码污染输出**: jekyll 输出的 `New post created at` 后面带着 `\e[36m` 颜色转义序列, 直接 sed 去前缀后路径前面残留转义符, `-f` 判断永远失败, 解析时必须先把 `\x1b\[[0-9;]*m` 剥掉
2. **配置键复数**: `jekyll_compose.default_front_matter` 下面的键是 `posts` 不是 `post`, 写错没有任何报错, 静默不生效
3. **同一篇文章不能建两次**: 双语版必须"先建一份再复制", 连续跑两次 `jekyll post` 同名会报文件已存在
4. **标题只能用英文**: jekyll-compose 的 slug 化会丢弃所有非 ASCII 字符, 中文标题会生成只有日期的文件名. 习惯是传英文标题, 建完再把 front matter 里的 `title` 改成中文

# 总结

整个改动只涉及三个文件, 不动主题不改插件, 完全脚本层解决:

| 文件 | 改动内容 |
| --- | --- |
| `tools/newpost.sh` | 新增, 包装 jekyll-compose 的创建脚本 |
| `tools/scaffolds/post.md` | 新增, 中文正文模板 |
| `tools/scaffolds/post.en.md` | 新增, 英文正文模板 |
| `_config.yml` | 新增 `jekyll_compose.default_front_matter.posts` 配置 |

从 Hexo 迁移到 Jekyll 快九年了, scaffolds 这个机制一直是念叨的缺失项, 这次算是补齐了. 建文章从"跑命令 + 手动复制改名 + 粘贴前言"变成一条命令, 双语文章文件名一致性也有保证了.
