---
layout: post
title: "How to Use Charles to Intercept HTTPS Requests"
date: 2017-09-01 23:17:09
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

![Charles Album](/assets/images/20170901CharlesCaptureHttps/CharlesAlbum.avif)

How to use `charles` to intercept `https` requests on iOS devices

## 1. Install Charles

Just [download it from the official website](https://www.charlesproxy.com/download/). As for cracking, Google it yourself. I'm using Charles version 4.1.3, which should be the latest at the moment.

## 2. HTTP Capture Configuration

####  (1) Check your computer's IP

![Wi Fi Ipmac](/assets/images/20170901CharlesCaptureHttps/WiFiIpmac.avif)

#### (2) Configure HTTP proxy on your phone

Connect your phone to your computer, tap "Settings -> Wi-Fi -> connected WiFi", and set the HTTP proxy:
Server: your computer's IP address, e.g. 192.168.1.108
Port: 8888

![Wi Fi Ip Porti Phone](/assets/images/20170901CharlesCaptureHttps/WiFiIpPortiPhone.avif)

Note: *Here I'm using my own computer's IP as an example. The red area — remember to replace it with your own computer's IP*

After setting the proxy, open Charles on your computer. When your phone makes a request, the following popup will appear:

![Charles Allow](/assets/images/20170901CharlesCaptureHttps/CharlesAllow.avif)

Click **Allow** and you're done

### 3. HTTPS Capture

From the top-left menu, select `SSL Proxying Settings`

![Charles Step](/assets/images/20170901CharlesCaptureHttps/CharlesStep1.avif)

Then check `Enable SSL Proxying`

Next, click `Add`

![Charles Step](/assets/images/20170901CharlesCaptureHttps/CharlesStep2.avif)

Then in

`Host`: Enter `*` to match all. If you want to intercept, for example, *.baidu.com, then enter that

`Port`: 443 (default port). Click OK when done
 
![Charles Step](/assets/images/20170901CharlesCaptureHttps/CharlesStep3.avif)

Next, click `Help` -> `SSL Proxying` -> Install Root Certificate

![Charles Step](/assets/images/20170901CharlesCaptureHttps/CharlesStep4.avif)

After installing to Keychain, click on Charles's root certificate and select `Use Trust`

![Charles Cer Root Mac](/assets/images/20170901CharlesCaptureHttps/CharlesCerRootMac.avif)

The next step is to install the root certificate on your phone

![Charles Step](/assets/images/20170901CharlesCaptureHttps/CharlesStep6.avif)

Now, on the phone with the proxy IP configured (on the iPhone), open the URL directly in Safari: chls.pro/ssl

Your phone will soon show this prompt — click **Allow**

![i Phone](/assets/images/20170901CharlesCaptureHttps/iPhone1.avif)

Then install the certificate

![i Phone](/assets/images/20170901CharlesCaptureHttps/iPhone2.avif)

After installation, the last step is **very important**

__You must go to General -> About This Phone -> Certificate Trust Settings__ to trust the certificate

![i Phone](/assets/images/20170901CharlesCaptureHttps/iPhone3.avif)

If you don't trust it, you'll see the following issue when capturing:

![Charles Root Cer Error](/assets/images/20170901CharlesCaptureHttps/CharlesRootCerError.avif)

> Note: *This seems to be required only for iOS 10.3 and above*

Finally, here's a screenshot of a successful capture (Alipay's API)

![Result](/assets/images/20170901CharlesCaptureHttps/Result.avif)

End of article