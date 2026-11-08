---
layout: post
title: The Standard of SQL Statements
date: 2023-10-31 10:01 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS,iPadOS,watchOS, SwiftUI]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This article is highly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. Reposts and sharing are welcome within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


## Background

I've been too busy with work lately to keep up with blog output. Today I have some spare time to discuss an article I recently read.

[Orona technical topic — Time-Series Data Analysis](https://mp.weixin.qq.com/s/CMgxtw0AisqtNeY1gRgJsQ) is from the NetEase Cloud Music technical team. The article briefly describes big-data work on data statistics, but that's not the focus of my introduction today. What I want to focus on is the SQL statements used in that article.

When I was in college, the SQL our teacher taught us seemed practical and simple at the time. But it overlooked something very important: uniform code style, code standards, and conventions.

Now, looking at the article from NetEase Cloud Music, I observed the SQL statements:

``` sql
SELECT toStartOfDay(time), avg(degree)
FROM table_temperature
WHERE
    time>='2023-09-01' AND
    time<'2023-10-01' AND
    city='杭州'
GROUP BY toStartOfDay(time)
```

Continuing to observe:

``` sql
SELECT toYear(time), model, avg(price)
FROM table_gas
WHERE
    time>='2013-01-01' AND
    time<'2023-01-01'
GROUP BY toYear(time), model
```

I suddenly felt this style was something I had to record — it's really standard.

``` sql
CREATE CONTINUE QUERY "cq_event" ON "apm_log"
BEGIN
  SELECT SUM("pv") as pv
  INTO "one_year"."cq_hour_event"
  FROM "one_week"."cq_minute_event"
  GROUP BY time(1h), *
END
```

And also this:

``` sql
SELECT
   TUMBLE_START(PROCTIME(), INTERVAL '1' MINUTE) as wTime,
   count(os) as pv,
   os as osName,
   moduleName as moduleName
FROM performance_log
WHERE
    props['mspm'] = 'ReactNativeApplication'
GROUP BY
    TUMBLE(PROCTIME(), INTERVAL '1' MINUTE),
    os,
    props['moduleName']
```

You get the idea.

#### Creating a table

``` sql
CREATE TABLE rn_monitor_cold_boot_stage_local
(
    `appName` String, -- 应用名，如 云音乐
    `osName` String, -- 操作系统名
    `appVersion` String, -- 应用版本
    `rnModuleName` String, -- ReactNative 模块名
    `deviceTag` String, -- 设备性能分档
    `uploadTime` DateTime, -- 日志到达服务端时间
    `uid` String, -- 用户 uid
    `stageName` String, -- 阶段名
    `stageCost` Float32, -- 阶段耗时
)
ENGINE = MergeTree
PARTITION BY (appName, osName, toYYYYMMDD(uploadTime))
ORDER BY (rnModuleName, uploadTime)
TTL uploadTime + toIntervalDay(90)
SETTINGS index_granularity = 8192, use_minimalistic_part_header_in_zookeeper = 1
```

#### Querying a table

``` sql
SELECT
 toStartOfDay(uploadTime) as "time",
 avg(stageCost) AS "avg",
 quantiles(0.5, 0.9)(stageCost) AS "quantiles",
 count() AS "pv",
 uniq(uid) AS "uv"
FROM rn_monitor_cold_boot_stage_shard
WHERE
   uploadTime>=1682006400 AND
   uploadTime<=1682611199 AND
   stageName='render' AND
   rnModuleName='rn-playlistrank'
GROUP BY toStartOfDay(uploadTime)
ORDER BY toStartOfDay(uploadTime) ASC
```

I wonder if everyone has actually observed:

* 1. Keywords on their own line
* 2. Parentheses on their own line and aligned
* 3. Each field on its own line, separated by `,` commas
* 4. Start and end paired up
* 5. Keywords must be at the front, aligned with the first line
* 6. Keywords like `AND` and `ASC` at the end

My summary may be a bit scattered, but based on the standard style above, I naively believe this is what SQL should look like. SQL should be written this way to give others better readability.


# Summary

Today I briefly introduced the standard way of writing SQL. For people who work with databases often, this may be nothing special — everyone might think they know it and only I didn't, finding me ridiculous. Regardless, this is my accumulation of knowledge and the continuous improvement of my own understanding. I wrote this article to record these good code examples.


[SQL reference — Orona technical topic: Time-Series Data Analysis](https://mp.weixin.qq.com/s/CMgxtw0AisqtNeY1gRgJsQ)
