---
title: 如何使用Charles截获https请求
categories: [ios开发,网络代理,https]
tags: [ios, macos, 技巧]
date: 2017-09-01 23:17:09
---


# 前言

![](/assets/images/20170901CharlesCaptureHttps/CharlesAlbum.png)

如何使用`charles`在iOS设备上截获`https`的请求 


## 1.安装Charles

[官网下载](https://www.charlesproxy.com/download/)就行了 至于破解之类的 自行google吧  我这里使用的是Charles 4.1.3版本 目前应该是最新的 


## 2.HTTP抓包配置

####  (1) 查看电脑IP

![](/assets/images/20170901CharlesCaptureHttps/WiFiIpmac.png)

#### (2) 设置手机HTTP代理

手机连上电脑，点击“设置->无线局域网->连接的WiFi”，设置HTTP代理：
服务器为电脑IP地址：如192.168.1.108
端口：8888

![](/assets/images/20170901CharlesCaptureHttps/WiFiIpPortiPhone.png)


注意:*这里用我自己电脑的IP举例 红色区域 记得替换成你自己的电脑的IP*


设置代理后，需在在电脑上打开Charles,这个时候 如果手机有请求就会弹出如下图:

![](/assets/images/20170901CharlesCaptureHttps/CharlesAllow.png)

点击**Allow** 就可以了

### 3. HTTPS抓包

左上角菜单中 选择`SSL Proxying Settings`

![](/assets/images/20170901CharlesCaptureHttps/CharlesStep1.png)

然后 勾选`Enable SSL Proxying` 

紧接着点击 `Add`

![](/assets/images/20170901CharlesCaptureHttps/CharlesStep2.png)

再然后在

`Host`: 输入 `*` 代表通配所有 如果你要截获 比如 *.baidu.com那就写上

`Port`: 443 默认端口 填完 点击OK
 
![](/assets/images/20170901CharlesCaptureHttps/CharlesStep3.png)


紧接着 点击`Help` -> `SSL Proxying` -> 安装根证书

![](/assets/images/20170901CharlesCaptureHttps/CharlesStep4.png)

安装到钥匙串后 点击charles的root证书 选择 `使用信任`

![](/assets/images/20170901CharlesCaptureHttps/CharlesCerRootMac.png)

下一步 是安装手机的root证书 

![](/assets/images/20170901CharlesCaptureHttps/CharlesStep6.png)


这时 需要在 设置 代理ip的手机上 (iPhone上)用 Safari 直接打开网址: [chls.pro/ssl](chls.pro/ssl)

此时手机一会儿就弹出这样的 提示 点击**允许**


![](/assets/images/20170901CharlesCaptureHttps/iPhone1.png)

然后 安装证书

![](/assets/images/20170901CharlesCaptureHttps/iPhone2.png)

安装完 最后一步**非常重要**

__必须到 通用->关于本机->证书信任设置__去信任 证书 

![](/assets/images/20170901CharlesCaptureHttps/iPhone3.png)


如果不信任 就会抓取的时候出现下图这样的问题

![](/assets/images/20170901CharlesCaptureHttps/CharlesRootCerError.png)

> 注意:*iOS10.3以上版本 貌似才需要*

最后放上一张截获成功的图 (支付宝的接口)

![](/assets/images/20170901CharlesCaptureHttps/Result.png)





全文完