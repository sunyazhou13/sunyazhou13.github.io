---
layout: post
title: Pod spec集成第三framework和.a工作记录
date: 2020-10-10 07:52:18
categories: [iOS, Swift]  
tags: [iOS, Swift, Objective-C, Cocoapods,skills]
typora-root-url: ..
---

![](/assets/images/20201010PodSpec/cocoapods.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


最近开发过程经常遇到工程中集成第三方工程中的时候 使用pod的方式集成.总忘记链接 第三方库的方式和podspec的写法.所以记录下来容易忘记的内容


## podspec 创建

我们在测试工程目录下创建一个目录 起名叫 demoframeworks 然后在这个目录下执行如下:

``` sh
pod spec create spec名称
```
> `spec名称` 自己起个名字哈

本地会生成一个spec模板
然后用文本编辑器编译一下spec文件,这里我们拿声网的sdk举例.

``` ruby
Pod::Spec.new do |spec|
  spec.name         = "specdemo"
  spec.version      = "0.0.1"
  spec.summary      = "test pod spec"
  spec.description  = "demo test测试"

  spec.homepage     = "https://www.sunyazhou.com/"
  spec.license      = "MIT"
  spec.author             = { "東引甌越" => "https://www.sunyazhou.com/" }
  spec.source       = { :git => "git@gitee.com:sunyazhou/sunyazhou13.github.io-images.git"}
  #加载第三方framework写法
  spec.vendored_frameworks = 'AgoraRtcCryptoLoader.framework','AgoraRtcEngineKit.framework','AgoraRtmKit.framework','AgoraSigKit.framework'
  #加载第三方.a
  #spec.vendored_libraries = 'libProj4.a', 'libJavaScriptCore.a'
  #系统内置动态库的依赖
  spec.frameworks = 'Photos','PhotosUI','CoreMedia','Foundation','CoreGraphics','CoreMotion','QuartzCore','MobileCoreServices','Security','CoreText','VideoToolbox','CoreTelephony','AudioToolbox','SystemConfiguration','AVFoundation', 'CoreLocation','AdSupport','OpenGLES','CoreML'
  #内置静态库的依赖
  spec.libraries = "iconv", "c++", "z.1.1.3" ,"z","resolv" ,"sqlite3","icucore","z.1.2.5"  
end

```
然后在Podfile内容里面添加

``` sh
target 'PodSpecDemo' do
  # Comment the next line if you don't want to use dynamic frameworks
  use_frameworks!

  # 添加这行
  pod 'specdemo', :path=>'./demoframeworks'
end
```

注意这里的`specdemo`是我们给集成本地pod起的名字 最好和创建的spec名字保持一致.

然后 pod install

最后工程就变成了我们想要的样子

![](/assets/images/20201010PodSpec/cocoapods1.webp)


# 总结

记录经常忘记的知识点 防止着急用的时候各种找,更多spec的写法 [参考官方的api](https://guides.cocoapods.org/syntax/podspec.html#vendored_libraries)


[Demo工程点击这里下载](https://github.com/sunyazhou13/PodSpecDemo) 

工程中移除了framework 因为github不允许上传超过100m以上的文件.很坑 大家下载后看下写法就好了.