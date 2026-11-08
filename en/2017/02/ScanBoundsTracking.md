---
layout: post
title: How to Make the QR Code/Barcode Scanning Frame Follow the QR Code on iOS
date: 2017-02-18 19:08:56
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---


Preface
--

> During development, you often encounter QR codes and barcodes, but there's always a tricky problem: how do you make the scanning frame follow the detected QR code (i.e., intelligently detect the scanned layer.bounds)?

![qrcode reader 5](/assets/images/20170218ScanBoundsTracking/qrcode-reader-5.avif)



There's an article that describes the development process, so I won't repeat it here. If anyone needs me to translate it, please leave a comment at the bottom and I'll update the code promptly.
> [Building a Barcode and QR Code Reader in Swift 3 and Xcode 8](http://www.appcoda.com/barcode-reader-swift/)



*Here's the core code*, using the `AVCaptureMetadataOutputObjectsDelegate` delegate:

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
        // Core code here
        qrCodeFrameView?.frame = barCodeObject!.bounds
        
        if metadataObj.stringValue != nil {
            messageLabel.text = metadataObj.stringValue
        }
    }
}}
	
```  
`qrCodeFrameView?.frame = barCodeObject!.bounds`
This is the core line — just get `barCodeObject.bounds` and assign it to the transparent view we created. **[Final Project](https://github.com/sunyazhou13/QRCodeReader)**

![QRCode Tracking](/assets/images/20170218ScanBoundsTracking/ScanBoundsTracking.avif)



End of article
