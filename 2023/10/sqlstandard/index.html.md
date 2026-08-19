---
layout: post
title: SQL语句的标准
date: 2023-10-31 10:01 +0800
categories: [iOS, SwiftUI]
tags: [iOS, macOS,iPadOS,watchOS, SwiftUI]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


## 背景介绍

最近工作太忙,没有保证博客的产出,今天偶有时间来探讨一下最近看到的一篇文章

[orona技术专题-时序数据分析](https://mp.weixin.qq.com/s/CMgxtw0AisqtNeY1gRgJsQ) 来自于网易云音乐技术团队, 这篇文章简单的阐述了一下做数据统计相关的大数据工作, 不过这不是我今天要介绍的重点,我想介绍的重点来自于这篇文章用到的sql语句


在我上大学时候老师教的SQL语句在当时看来已经很实用且简单.但忽视了一个很重要的内容,代码的整齐划一,代码标准和规范.

今天来到了来自网易云音乐的文章内容中,我观察了一下SQL语句

``` sql
SELECT toStartOfDay(time), avg(degree)
FROM table_temperature
WHERE
    time>='2023-09-01' AND
    time<'2023-10-01' AND
    city='杭州'
GROUP BY toStartOfDay(time)
```

继续观察

``` sql
SELECT toYear(time), model, avg(price)
FROM table_gas
WHERE
    time>='2013-01-01' AND
    time<'2023-01-01'
GROUP BY toYear(time), model
```

顿时让我感觉 这个写法我必须记录一下,真的很标准

``` sql
CREATE CONTINUE QUERY "cq_event" ON "apm_log"
BEGIN
  SELECT SUM("pv") as pv
  INTO "one_year"."cq_hour_event"
  FROM "one_week"."cq_minute_event"
  GROUP BY time(1h), *
END
```

还有下面

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

等等

#### 创建表

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

#### 查询表

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

不知道大家有没有真正观察

* 1.关键字单独一行
* 2.括号换行单独一行并且对其
* 3.字段单独一行用`,`逗号隔开
* 4.开始结束配对
* 5.关键字必须靠前对其首行
* 6.AND和 ASCd等关键字 放后

虽然我总结的过于零散, 但是从上述标准的写法来看,我肤浅的认为这就是SQL应该有的标准,写SQL就应该这样写,给别人提供更好的阅读性.


# 总结

今天简单的介绍了一下SQL的标准写法,这对经常操作数据库的同学可能是家常便饭,也可能大家都认为自己知道就我不知道觉得我可笑,总之 这是我对知识的积累和不断提高自己的认知.为了记录这些好的代码我记录了下来这篇文章


[SQL 参考的 orona技术专题-时序数据分析](https://mp.weixin.qq.com/s/CMgxtw0AisqtNeY1gRgJsQ) 