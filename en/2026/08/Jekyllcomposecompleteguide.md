---
layout: post
title: A Complete Guide to jekyll-compose - Seven Commands You May Not Know
date: 2026-08-22 06:24 +0000
categories: [iOS, Jekyll]
tags: [Jekyll, Blog, jekyll-compose, hexo, skills]
typora-root-url: ".."
math: false
mermaid: false

---

![cover](/assets/images/20260822Jekyllcomposecompleteguide/cover.avif)

# Preface

This post reflects strong personal opinions. If you feel uncomfortable while reading, please close it immediately. This article is for personal learning records only. You are welcome to repost or share it under the license terms — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, consider subscribing via RSS. Thanks for your support!

# Background

In my [previous post](/2026/08/jekyllpostscaffoldmultilang) I added Hexo-style scaffolds and multi-language creation to this blog. To pin down exactly what `bundle exec jekyll post` can and cannot do, I read the entire source of the locally installed jekyll-compose 0.12.0 — and discovered it does far more than I assumed. Most people (my former self included) only ever use `jekyll post`, while the gem actually ships a complete draft workflow.

So here is a complete guide based on reading the actual source, not second-hand documentation.

# Command overview

jekyll-compose provides **7 subcommands** covering the full draft → publish lifecycle:

| Command | Syntax | What it does |
| --- | --- | --- |
| `post` | `jekyll post "Title"` | Creates a post in `_posts/` with a `YYYY-MM-DD-` prefix |
| `draft` | `jekyll draft "Title"` | Creates a draft in `_drafts/`, **no date prefix** |
| `publish` | `jekyll publish _drafts/xxx.md` | Promotes a draft: moves it to `_posts/`, prepends the date, fills in the `date` field |
| `unpublish` | `jekyll unpublish _posts/2026-08-22-xxx.md` | The reverse: moves the post back to `_drafts/`, strips the date prefix, **removes the `date` field** |
| `rename` | `jekyll rename _posts/old-file.md "New Title"` | Renames three things at once: filename, the `title` in front matter, and optionally the date |
| `compose` | `jekyll compose "Title"` | Unified entry point: `--post` / `--draft` / `-c COLLECTION` decides where it goes, default is post |
| `page` | `jekyll page about` | Creates a static page; supports `path/name` for subdirectories |

The `draft → publish → unpublish` trio is its core design: **write a draft first, promote it when it's ready** — Hexo's `hexo publish` borrowed this idea. With drafts, you preview locally via `jekyll serve --drafts` and only publish once satisfied, avoiding the "half-finished post goes live" embarrassment.

# Shared options

All commands share a set of options:

| Option | Description | Applies to |
| --- | --- | --- |
| `-d, --date DATE` | Set the post date — handy for backfilling old posts | post / draft / publish / rename |
| `-l, --layout LAYOUT` | Set the layout, default `post` | all |
| `-x, --extension EXT` | File extension, default `markdown`, can be `md` | all |
| `-f, --force` | Overwrite if the file already exists | all |
| `--timestamp-format FORMAT` | Custom format for the `date` field | post / publish |
| `--config FILE` | Create using a specific config file | all |
| `--now` | rename only: set the date to now | rename |
| `-c, --collection NAME` | Create in a custom collection, e.g. `-c wiki` → `_wiki/` | compose |

## Common scenarios

Backfill a post with an old date:

``` sh
bundle exec jekyll post "OldPost" -d 2026-08-01
```

Publish last year's draft with the date it was meant to have:

``` sh
bundle exec jekyll publish _drafts/old-draft.md -d 2025-12-01
```

Rename a finished post — filename and front matter together:

``` sh
bundle exec jekyll rename _posts/2026-08-22-old-title.md "New Title"
```

# _config.yml configuration

jekyll-compose has exactly two configuration keys, both under the `jekyll_compose` namespace:

## default_front_matter: inject front matter per collection

``` yaml
jekyll_compose:
  default_front_matter:
    posts:          # used by the post command
      categories: [iOS]
      tags: []
      typora-root-url: ..
      math: true
    drafts:         # used by the draft command
      layout: draft
    wiki:           # used by compose -c wiki; the key is the collection name
      foo: bar
```

**Big pitfall here**: the key is the **collection name**, so it's the plural `posts`, not `post`. The source hardcodes `front_matter_defaults_for("posts")` — writing `post` produces no error and silently does nothing. You'd only find out by reading the source.

## auto_open: open the editor after creation

``` yaml
jekyll_compose:
  auto_open: true
```

This needs an environment variable, with priority `JEKYLL_EDITOR` > `VISUAL` > `EDITOR`. For example, to open in Typora:

``` sh
# ~/.zshrc
export JEKYLL_EDITOR="open -a Typora"
```

With that set, `jekyll post` pops the editor open right after creating the file — the same experience as `hexo new`.

# Source-level behavior details

All of the following were confirmed by reading the `lib/` directory, and each one can bite you:

## Slugification

The filename comes from `Jekyll::Utils.slugify`: non-ASCII characters are dropped entirely, spaces become hyphens, everything is lowercased. So a **Chinese title produces a filename with nothing but the date prefix**. The workaround: pass an English title, then edit the `title` field in front matter to Chinese afterwards.

## date is UTC

`Time.now` is formatted with `+0000`, so a post written at 2 PM local time gets `06:00 +0000` in front matter. If that bothers you, change it to `+0800` manually before publishing.

## Front matter merge order

Generation order is `{layout, title}` ← `default_front_matter` config ← `date`. Any field can come in from the config, and `date` is always written last so it never gets overridden.

## Existing files raise an error

If the file already exists, the command aborts with an exception — no overwrite prompt, unless you pass `-f` explicitly.

## Paths are hardcoded

`_posts/` and `_drafts/` are hardcoded in the source with no configuration to change them. That's why multi-language blogs (like this site's `_posts/en/` structure) can't use it directly — you need a wrapper script that moves the file after creation, which is exactly what my previous post covers.

# Project status

0.12.0 was released in 2019 and remains the latest version. The official repository [jekyll/jekyll-compose](https://github.com/jekyll/jekyll-compose) is in maintenance mode — bug fixes only, no new features. Don't expect it to ever support body templates or language subdirectories natively; solve those in your blog's own `tools/` directory instead.

One more limitation for multi-language sites: `rename` and `publish` only move files between `_posts/` and `_drafts/` — they don't know about `_posts/en/`. To rename a bilingual post, honestly just `mv` both files yourself.

# Summary

- jekyll-compose has 7 commands; the `draft/publish/unpublish` workflow is its most underrated feature
- Two config keys: `default_front_matter` (remember the plural collection-name key) and `auto_open` (with the `JEKYLL_EDITOR` environment variable)
- Source-level limits: hardcoded paths, no body templates, slug drops non-ASCII, date in UTC
- The project has been dormant since 2019 — deep customization has to happen in your own scripts

It's a small tool, but reading its source pins down the exact capability boundary of every command, which makes using it a lot more confident. Combined with the scaffold setup from the previous post, my publishing workflow is finally fully sorted.
