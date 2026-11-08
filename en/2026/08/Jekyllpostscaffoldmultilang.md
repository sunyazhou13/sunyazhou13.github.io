---
layout: post
title: Jekyll Blog with Hexo-style Post Scaffolds and Multi-language Creation
date: 2026-08-22 06:06 +0000
categories: [iOS, Jekyll]
tags: [Jekyll, Blog, hexo, polyglot, skills]
typora-root-url: ".."
math: false
mermaid: false

---

![cover](/assets/images/20260822Jekyllpostscaffoldmultilang/cover.avif)

# Preface

This post reflects strong personal opinions. If you feel uncomfortable while reading, please close it immediately. This article is for personal learning records only. You are welcome to repost or share it under the license terms — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, consider subscribing via RSS. Thanks for your support!

# Background

Creating posts for this blog has always been a bit awkward. The site runs on Jekyll with the Chirpy theme, and posts are created via the command provided by [jekyll-compose](https://github.com/jekyll/jekyll-compose):

``` sh
bundle exec jekyll post "My New Post"
```

Anyone who migrated from Hexo knows how good its workflow is: `hexo new` creates a post from the `scaffolds/post.md` template, so boilerplate content (like the disclaimer at the top of every post on this site) comes in automatically.

Jekyll has two pain points here:

1. **No body template**: jekyll-compose only generates front matter. The disclaimer paragraph has to be manually pasted every time.
2. **Multi-language unfriendly**: This site is bilingual (Chinese/English) via [jekyll-polyglot](https://github.com/untra/polyglot). Chinese posts live in `_posts/` and English posts in `_posts/en/`, but `jekyll post` only writes to `_posts/` — the English version needs a manual copy and rename.

This time I solved both problems together with a wrapper script that brings Hexo-style scaffolds and one-command multi-language post creation to Jekyll.

# Analysis

Before writing any code, I dug into the jekyll-compose 0.12.0 source and confirmed two things:

## The path is hardcoded

From `lib/jekyll/commands/post.rb`:

``` ruby
class PostFileInfo < Compose::FileInfo
  def path
    "_posts/#{file_name}"
  end
end
```

The destination is hardcoded to `_posts/` with no option or configuration to target a subdirectory. Having the command write directly into `_posts/en/` is impossible — the file can only be moved after creation.

## No body template support

From `lib/jekyll-compose/file_info.rb`:

``` ruby
def content(custom_front_matter = {})
  front_matter = YAML.dump({
    "layout" => params.layout,
    "title"  => params.title,
  }.merge(custom_front_matter))

  front_matter + "---\n"
end
```

The `content` method outputs YAML front matter and stops. There is no logic to read a template file and inject body content. The plugin simply does not offer this capability, so it has to be done at the script level.

The only configuration point is `default_front_matter`, which merges custom fields into the front matter — that becomes useful later.

## How multi-language detection works

The polyglot configuration on this site:

``` yaml
languages: ["zh", "en"]
default_lang: "zh"
lang_from_path: true
```

With `lang_from_path: true`, the language is inferred from the path: posts in the `_posts/` root are the default language (Chinese), and posts under `_posts/en/` are automatically detected as English — **no** `lang: en` needed in front matter.

One critical detail: the Chinese and English versions must share **exactly the same filename**, otherwise polyglot won't treat them as translations of the same post and won't generate hreflang tags or the language switch links.

# Implementation

The overall approach is straightforward: a `tools/newpost.sh` wrapper script that calls jekyll-compose, then handles the directory move and template injection.

## Directory layout

``` sh
tools/
├── newpost.sh              # post creation script
└── scaffolds/              # body templates (like hexo scaffolds)
    ├── post.md             # Chinese template
    └── post.en.md          # English template
```

## Body templates

`tools/scaffolds/post.md` is the standard opening of every post on this site, and `tools/scaffolds/post.en.md` is its English counterpart. To change the boilerplate, just edit the template — all future posts pick it up automatically, exactly like editing `scaffolds/post.md` in Hexo.

## Front matter template

jekyll-compose natively supports default front matter in `_config.yml`:

``` yaml
jekyll_compose:
  default_front_matter:
    posts:
      categories: [iOS]
      tags: []
      typora-root-url: ..
```

**Watch out**: the key must be `posts` (plural). Writing `post` fails silently — the source hardcodes `front_matter_defaults_for("posts")`, which you'd only discover by reading the code.

## The creation script

Core logic of `tools/newpost.sh`:

``` bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EN_DIR="$ROOT/_posts/en"

# If the first arg is zh/en/both followed by a title, use explicit mode;
# otherwise treat it as the title
if [[ "$1" == zh || "$1" == en || "$1" == both ]] && [[ $# -ge 2 ]]; then
  LANG_ARG="$1"
  TITLE="$2"
else
  TITLE="$1"
  # Default mode: bilingual if _posts/en/ exists, Chinese only otherwise
  if [[ -d "$EN_DIR" ]]; then
    LANG_ARG="both"
  else
    LANG_ARG="zh"
  fi
fi

create_post() {
  # Output looks like "New post created at \e[36m_posts/xxx.md\e[0m "
  # Strip the prefix and ANSI color codes, or path checks will fail
  bundle exec jekyll post "$TITLE" 2>&1 \
    | grep "New post created at" \
    | sed -e $'s/\x1b\\[[0-9;]*m//g' \
          -e 's/^New post created at //' \
          -e 's/[[:space:]]*$//'
}

# Append template content to the post body
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
    # Copy the clean English version first (before injecting
    # the Chinese template), then inject each template
    cp "$ROOT/$FILE" "$EN_DIR/$(basename "$FILE")"
    apply_scaffold "$ROOT/$FILE" zh
    apply_scaffold "$EN_DIR/$(basename "$FILE")" en
    ;;
esac
```

# Usage

``` sh
# Most common: just pass the title, bilingual by default
bash tools/newpost.sh "My New Post"

# Chinese only
bash tools/newpost.sh zh "My New Post"

# English only (goes to _posts/en/)
bash tools/newpost.sh en "My New Post"

# Force bilingual (creates _posts/en/ if missing)
bash tools/newpost.sh both "My New Post"

# Also create the image asset directory (--img or -i, flag position is free)
bash tools/newpost.sh --img "My New Post"
```

The default mode checks whether `_posts/en/` exists: if so, both Chinese and English versions are created; if not, only the Chinese one. One command produces:

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

# Preface

This post reflects strong personal opinions. If you feel uncomfortable while reading, please close it immediately. ...
```

The English version gets the English Preface template automatically. Both files share the same filename, so polyglot recognizes them as translations right away.

With `--img` (or the short form `-i`), the script additionally creates an image asset directory, following the site-wide convention: **date without separators + the post slug with a capitalized first letter**. For example, creating `my-new-post` on 2026-08-22 produces:

``` sh
assets/images/20260822MyNewPost/
```

Drop images into that directory and reference them as `![description](/assets/images/20260822MyNewPost/xxx.avif)`. The directory is not created by default — not every post needs images.

# Pitfalls

Every pitfall below was located by reading source code:

1. **ANSI color codes pollute the output**: jekyll prints `New post created at` followed by an `\e[36m` escape sequence. A plain `sed` prefix removal leaves the escape code in front of the path, so the `-f` check always fails. The `\x1b\[[0-9;]*m` sequences must be stripped first.
2. **Plural config key**: under `jekyll_compose.default_front_matter`, the key is `posts`, not `post`. The wrong key produces no error and silently does nothing.
3. **Can't create the same post twice**: bilingual posts must be "create once, then copy" — running `jekyll post` twice with the same title fails on the second run because the file already exists.
4. **Titles must be English**: jekyll-compose's slugification drops all non-ASCII characters, so a Chinese title produces a filename with nothing but the date. My workflow: pass an English title, then edit the `title` field in front matter to Chinese afterwards.

# Summary

The whole change touches only a few files — no theme hacks, no plugin patches, purely at the script level:

| File | Change |
| --- | --- |
| `tools/newpost.sh` | Added: wrapper around jekyll-compose |
| `tools/scaffolds/post.md` | Added: Chinese body template |
| `tools/scaffolds/post.en.md` | Added: English body template |
| `_config.yml` | Added `jekyll_compose.default_front_matter.posts` config |

It's been almost nine years since I migrated from Hexo to Jekyll, and scaffolds were the one thing I kept missing. Now it's finally filled in: creating a post went from "run command + manual copy/rename + paste disclaimer" to a single command, with the bilingual filename consistency guaranteed as well.
