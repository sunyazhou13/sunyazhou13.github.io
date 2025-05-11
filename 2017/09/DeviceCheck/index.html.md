---
layout: post
title: DeviceCheck
date: 2017-09-30 09:45:25
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
---

![](/assets/images/20170930DeviceCheck/DeviceCheck.webp)

# 前言



iOS11 苹果改动了一个比较引开发者关注的亮点

**UDID之类的写到系统 keychain 的唯一标识会随着 app 删除而删除**

这个问题在微博上已经争论好几天

### iOS11新的设备唯一标识 DCDevice

#### 介绍 API

我们首先看看`DCDevice`类都有啥

``` objc
#import <DeviceCheck/DeviceCheck.h>

NS_ASSUME_NONNULL_BEGIN

API_AVAILABLE(ios(11.0), tvos(11.0)) API_UNAVAILABLE(watchos, macos)
@interface DCDevice : NSObject
//当前设备
@property (class, readonly) DCDevice *currentDevice;

//是否支持
@property (getter=isSupported, readonly) BOOL supported;

//生成唯一标识的 token 注意:每call一次就会生成一个新的 token(和前边不同)
- (void)generateTokenWithCompletionHandler:(void(^)(NSData * _Nullable token, NSError * _Nullable error))completion;

@end

NS_ASSUME_NONNULL_END

```
接口简直不能再简单了 **创建实例调方法**

#### 使用 API
下面我们来看下如何使用`DCDevice`

导入头文件

``` objc
#import <DeviceCheck/DeviceCheck.h>
```

check 是否支持 如果支持 的话会在回调以后返回 `token`(NSData)

``` objc
- (void)viewDidLoad {
    [super viewDidLoad];
    
    //下面是调用代码
    if([DCDevice currentDevice].supported){
        [[DCDevice currentDevice] generateTokenWithCompletionHandler:^(NSData * _Nullable token, NSError * _Nullable error) {
            NSLog(@"%@",token);
        }];
    }
}

```

token 是个 2188字节(2k 多点)的二进制流,很小

![](/assets/images/20170930DeviceCheck/DCDeviceCode.webp)

我尝试各种字符串编码最终也不知道里面是啥 没能成功打印出来

![](/assets/images/20170930DeviceCheck/DCDeviceBinary.webp)

谁要是打印出来烦请 share 一下

#### 删除/重装App 如何处理

> DeviceCheck 允许你通过你的服务器与 Apple 服务器通讯，并为单个设备设置2k左右 的数据。
在设备上用 DeviceCheck API 生成一个 2字节的 token (00, 01,10,11)，然后将这个 token 发给自己的服务器，再由自己的服务器与 Apple 的 API 进行通讯，来更新或者查询该设备的值。这两字节 的数据用来追踪用户。比如。借助两个自己的数据，你可以得知用户究竟使用了该 App 多久。
该 API 可以成为：反欺诈领域： 
> 试用7天
Uber、滴滴司机被封号后，防止重新注册账号接单
该用户是否已经领取过首次注册红包
APP防多开
因为传输的是 flag 级别的数据，并不会定位到该设备的使用者，所以相对安全。

> 但是对于购买了二手手机的使用场景，可能会出现一些边界情况，这个在业务中也需要考虑进去。

引自[iOS11开发新特性之实用小tips](https://github.com/ChenYilong/iOS11AdaptationTips/issues/22)


首先要明白我们 的 token 需要发给谁

1. token 需要发送给我们自己公司的`server`做记录
2. 我们公司自己的`server`去`Apple`的`server`查询`token`是否有效,从而来更新或者查询该设备值. 
3. 这`2k 左右的 token`不会因为设备删除 app 而删除 会一直存在苹果的 server(其实我觉得就是苹果自己去获取的设备唯一标识).

那么 怎么查询和更新呢 

##### 查询接口

**https://api.development.devicecheck.apple.com/v1/query_two_bits**

可以用终端自己模拟一下 就当作你自己是自己的服务器访问Apple 的服务器

``` sh
curl -i --verbose -H "Authorization: Bearer <GeneratedJWT>" \
-X POST --data-binary @ValidQueryRequest.json \ 
https://api.development.devicecheck.apple.com/v1/query_two_bits 

```

json 的定义如下:

| 字段 key | 类型 | 说明 | 必须 |   
|:------:|:------:| :------:| :------:| 
| device_token | String | 设备唯一标识 token| 是 |
| transaction_id | String | 服务器产生的一个ID| 是 |
| timestamp | Long | 服务器生成的UTC时间戳| 是 |

它会 返回 如下格式

``` json
{
   "device_token" : "wlkCDA2Hy/CfrMqVAShs1BAR/0sAiuRIUm5jQg0a..."
   "transaction_id" : "5b737ca6-a4c7-488e-b928-8452960c4be9",
   "timestamp" : 1487716472000 
}
```

##### 更新接口

**https://api.development.devicecheck.apple.com/v1/update_two_bits**

``` sh
curl -i --verbose -H "Authorization: Bearer <GeneratedJWT>" \
-X POST --data-binary @ValidUpdateRequest.json \
https://api.development.devicecheck.apple.com/v1/update_two_bits 
```

json 的定义如下:

| 字段 key | 类型 | 说明 | 必须 |   
|:------:|:------:| :------:| :------:| 
| device_token | String | 设备唯一标识 token| 是 |
| transaction_id | String | 服务器产生的一个ID| 是 |
| timestamp | Long | 服务器生成的UTC时间戳| 是 |
| bit0 | Boolean | 新的布尔值1| 否 |
| bit1 | Boolean | 新的布尔值2| 否 |

json 的示例:

``` json
{
   "device_token" : "wlkCDA2Hy/CfrMqVAShs1BAR/0sAiuRIUm5jQg0a..."
   "transaction_id" : "5b737ca6-a4c7-488e-b928-8452960c4be9",
   "timestamp" : 1487716472000,
   "bit0" : true,
   "bit1" : false 
}
```


### 最终的方案


1. iOS11以前版本暂且才用 UUID 等 keychian 方式 
2. iOS11尽量才用新的 api 来适配解决

对于 server 来讲可以 把 token 搞成新的附属字段 比如一个账号下登录多少个设备

那么 一个 UID 下面 就要附属 iOS 版本+ token 

相信过不了多久 很成熟的 token方案会脱颖而出 

*如果本文有误之处还请各路大神指教*

全文完

