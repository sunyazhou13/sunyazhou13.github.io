---
layout: post
title: iOS如何让二维码/条形码扫描框跟随二维码移动
date: 2017-02-18 19:08:56
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
---


前言
--

> 开发过程中经常会遇到二维码条形码,但总会有一个比较蛋疼的问题
如何让二维码的扫描框跟随扫码到的二维码移动跟踪呢(就是智能探测扫描的layer.bounds)？  

![](http://www.appcoda.com/wp-content/uploads/2016/11/qrcode-reader-5-1024x637.webp)



这里有一篇文字讲述了开发过程我这里就不赘述了, 如果有小伙伴觉得需要我翻译的话请在底部留言 我会及时更新代码  
> [Building a Barcode and QR Code Reader in Swift 3 and Xcode 8](http://www.appcoda.com/barcode-reader-swift/)



*这里比较核心的代码如下* `AVCaptureMetadataOutputObjectsDelegate`代理
    
```swift  

func captureOutput(_ captureOutput: AVCaptureOutput!, didOutputMetadataObjects metadataObjects: [Any]!, from connection: AVCaptureConnection!) {  
    
    // Check if the metadataObjects array is not nil and it contains at least one object.
    if metadataObjects == nil || metadataObjects.count == 0 {
        qrCodeFrameView?.frame = CGRect.zero
        messageLabel.text = "No QR code is detected"
        return
    }
    
    // Get the metadata object.
    let metadataObj = metadataObjects[0] as! AVMetadataMachineReadableCodeObject
    
    if metadataObj.type == AVMetadataObjectTypeQRCode {
        // If the found metadata is equal to the QR code metadata then update the status label's text and set the bounds
        let barCodeObject = videoPreviewLayer?.transformedMetadataObject(for: metadataObj)
        //核心代码在这
        qrCodeFrameView?.frame = barCodeObject!.bounds
        
        if metadataObj.stringValue != nil {
            messageLabel.text = metadataObj.stringValue
        }
    }
}}
	
```  
`qrCodeFrameView?.frame = barCodeObject!.bounds`
这行代码最核心 就是拿到barCodeObject.bounds 给我们自己创建透明的那个view就行了 **[最终项目](https://github.com/sunyazhou13/QRCodeReader)**

![QRCode 跟踪](/assets/images/20170218ScanBoundsTracking/ScanBoundsTracking.gif)




全文完