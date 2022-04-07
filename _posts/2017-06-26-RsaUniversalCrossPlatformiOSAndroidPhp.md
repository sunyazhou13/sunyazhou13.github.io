---
title: iOS Android Php RSA加密解密通配方案
categories: [ios开发]
tags: [ios, macos, 安全]
date: 2017-06-26 10:42:47
---

![](/assets/images/20170626RsaUniversalCrossPlatformiOSAndroidPhp/RSALogo.png)

# 前言

先膜拜一下 RSA的作者

![](/assets/images/20170626RsaUniversalCrossPlatformiOSAndroidPhp/RSATeam.jpg)

RSA非对称加密 原理 各种。。。 请自行百度 


## 弯路

最近开发涉及到如何使用RSA进行鉴权 等技术。。。老实说 我找了一圈根本就找到一个真正能在 iOS、Android、web跑通的代码.
 浪费了好几天开发时间 就没有一个靠谱能好使的 所以我必须发一篇博客
把真正 好使的代码拿出来 share一下 (当时我真的 想骂娘了 我擦 百度搜出来的 一堆垃圾) 


# 代码实现

## 第一步 生成公私钥对


### 命令生成原始 RSA私钥文件 rsa_private_key.pem

``` sh
openssl genrsa -out rsa_private_key.pem 1024
```

### 命令将原始 RSA私钥转换为 pkcs8格式

``` sh
openssl pkcs8 -topk8 -inform PEM -in rsa_private_key.pem -outform PEM -nocrypt -out private_key.pem
```

### 生成RSA公钥 rsa_public_key.pem

``` sh
openssl rsa -in rsa_private_key.pem -pubout -out rsa_public_key.pem
```

> 从上面看出通过私钥能生成对应的公钥，因此我们将私钥`private_key.pem`用在*服务器端*，*公钥*发放给`android`跟`ios`等前端
> 


## 第二步 php代码实现

``` php
<?php
/**
 * @author sunyazhou (http://www.sunyazhou.com/)
 * @version 1.0
 * @created 2017-6-25
 */
 
class Rsa
{
private static $PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----
xxxxxxxxxxxxxxxxxxxxx
/xxxxxxxxxxxxxxxxxxxxx
y4dDpCOn
A4tBsIdpMMoT+w==
-----END PRIVATE KEY-----';
    /**
    *返回对应的私钥
    */
    private static function getPrivateKey(){
    
        $privKey = self::$PRIVATE_KEY;
         
        return openssl_pkey_get_private($privKey);      
    }
 
    /**
     * 私钥加密
     */
    public static function privEncrypt($data)
    {
        if(!is_string($data)){
                return null;
        }           
        return openssl_private_encrypt($data,$encrypted,self::getPrivateKey())? base64_encode($encrypted) : null;
    }
    
    
    /**
     * 私钥解密
     */
    public static function privDecrypt($encrypted)
    {
        if(!is_string($encrypted)){
                return null;
        }
        return (openssl_private_decrypt(base64_decode($encrypted), $decrypted, self::getPrivateKey()))? $decrypted : null;
    }
}
 
?>

```

打开`private_key.pem`，将上面的$PRIVATE_KEY，替换成private_key.pem的内容即可，服务器端我们只需要使用私钥来加密解密。

## 第三步 android端 代码实现

使用java的Cipher类来实现加密解密类，代码如下:

``` java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import javax.crypto.Cipher;
 
import android.util.Base64;
 
/**
 * @author alun (http://alunblog.duapp.com)
 * @version 1.0
 * @created 2013-5-17
 */
public class Rsa {
    private static final String RSA_PUBLICE =
            "xxxxxxxxxxxxxxxxC" + "\r" +
            "Qf/xxxxxxxhVuwdNH6aRFE0ms3bkpp/WL4cfVDgnCO" + "\r" +
            "+W9J6vRVpuTuD/xxxxxxxxbJeO74fYnYqo/mmyJSeLE5iZg4I" + "\r" +
            "Zm5LPWBZWUp3ULCAZQIDAQAB";
    private static final String ALGORITHM = "RSA";
 
    /**
     * 得到公钥
     * @param algorithm
     * @param bysKey
     * @return
     */
    private static PublicKey getPublicKeyFromX509(String algorithm,
            String bysKey) throws NoSuchAlgorithmException, Exception {
        byte[] decodedKey = Base64.decode(bysKey,Base64.DEFAULT);
        X509EncodedKeySpec x509 = new X509EncodedKeySpec(decodedKey);
 
        KeyFactory keyFactory = KeyFactory.getInstance(algorithm);
        return keyFactory.generatePublic(x509);
    }
 
    /**
     * 使用公钥加密
     * @param content
     * @param key
     * @return
     */
    public static String encryptByPublic(String content) {
        try {
            PublicKey pubkey = getPublicKeyFromX509(ALGORITHM, RSA_PUBLICE);
 
            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            cipher.init(Cipher.ENCRYPT_MODE, pubkey);
 
            byte plaintext[] = content.getBytes("UTF-8");
            byte[] output = cipher.doFinal(plaintext);
 
            String s = new String(Base64.encode(output,Base64.DEFAULT));
 
            return s;
 
        } catch (Exception e) {
            return null;
        }
    }
 
    /**
    * 使用公钥解密
    * @param content 密文
    * @param key 商户私钥
    * @return 解密后的字符串
    */
    public static String decryptByPublic(String content) {
        try {
            PublicKey pubkey = getPublicKeyFromX509(ALGORITHM, RSA_PUBLICE);
            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            cipher.init(Cipher.DECRYPT_MODE, pubkey);
            InputStream ins = new ByteArrayInputStream(Base64.decode(content,Base64.DEFAULT));
            ByteArrayOutputStream writer = new ByteArrayOutputStream();
            byte[] buf = new byte[128];
            int bufl;
            while ((bufl = ins.read(buf)) != -1) {
                byte[] block = null;
                if (buf.length == bufl) {
                block = buf;
                } else {
                block = new byte[bufl];
                for (int i = 0; i < bufl; i++) {
                    block[i] = buf[i];
                }
                }
                writer.write(cipher.doFinal(block));
            }
            return new String(writer.toByteArray(), "utf-8");
        } catch (Exception e) {
            return null;
        }
    }
 
}

```

__*注意:*__在初始化`Cipher`对象时，一定要指明使用`"RSA/ECB/PKCS1Padding"`格式如`Cipher.getInstance("RSA/ECB/PKCS1Padding");`
打开`rsa_public_key.pem`文件，将上面代码的`RSA_PUBLICE`替换成其中内容即可.


## 第四步 iOS端代码实现

iOS上没有直接处理RSA加密的API，网上说的大多数也是处理X.509的证书的方法来实现，不过X.509证书是带签名的，在php端`openssl_pkey_get_private`方法获取密钥时，第二个参数需要传签名，而android端实现X.509证书加密解密较为不易，在这里我们利用ios兼容c程序的特点，利用openssl的api实现rsa的加密解密，代码如下：

CRSA.h代码

``` objc
//
//  CRSA.h
//  RSA_C_demo
//
//  Created by sunyazhou on 2017/6/25.
//  Copyright © 2017年 Kingsoft, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <openssl/rsa.h>
#import <openssl/pem.h>
#import <openssl/err.h>


typedef enum {
    KeyTypePublic,
    KeyTypePrivate
}KeyType;

typedef enum {
    RSA_PADDING_TYPE_NONE       = RSA_NO_PADDING,
    RSA_PADDING_TYPE_PKCS1      = RSA_PKCS1_PADDING,
    RSA_PADDING_TYPE_SSLV23     = RSA_SSLV23_PADDING
}RSA_PADDING_TYPE;

@interface CRSA : NSObject{
    RSA *_rsa;
}

@property(nonatomic, copy)NSString *rsaKeyPath; //证书路径

+ (id)shareInstance;
- (BOOL)importRSAKeyFromeStringWithType:(KeyType)type andKey:(NSString *)keyPath;
- (BOOL)importRSAKeyWithType:(KeyType)type;
- (int)getBlockSizeWithRSA_PADDING_TYPE:(RSA_PADDING_TYPE)padding_type;
- (NSString *)encryptByRsa:(NSString*)content withKeyType:(KeyType)keyType;
- (NSString *)decryptByRsa:(NSString*)content withKeyType:(KeyType)keyType;

@end


```

CRSA.m

``` obj

//  CRSA.m
//  RSA_C_demo
//
//  Created by sunyazhou on 2017/6/25.
//  Copyright © 2017年 Kingsoft, Inc. All rights reserved.
//

#import "CRSA.h"

#define BUFFSIZE  1024
//#import "NSString+Base64.h"
//#import "NSData+Base64.h"

#define PADDING RSA_PADDING_TYPE_PKCS1
@implementation CRSA

+ (id)shareInstance
{
    static KSYCRSA *_crsa = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _crsa = [[self alloc] init];
    });
    return _crsa;
}
- (BOOL)importRSAKeyWithType:(KeyType)type
{
    FILE *file;
    NSString *keyName = type == KeyTypePublic ? @"public_key" : @"private_key";
    NSString *keyPath = [[NSBundle mainBundle] pathForResource:keyName ofType:@"pem"];
    
    file = fopen([keyPath UTF8String], "rb");
    
    if (NULL != file)
    {
        if (type == KeyTypePublic)
        {
            _rsa = PEM_read_RSA_PUBKEY(file, NULL, NULL, NULL);
            assert(_rsa != NULL);
        }
        else
        {
            _rsa = PEM_read_RSAPrivateKey(file, NULL, NULL, NULL);
            assert(_rsa != NULL);
        }
        
        fclose(file);
        
        return (_rsa != NULL) ? YES : NO;
    }
    
    return NO;
}

- (BOOL)importRSAKeyWithPath:(KeyType)type
{
    FILE *file;
    NSString *keyName = type == KeyTypePublic ? @"public_key.pem" : @"private_key.pem";
    NSString *keyPath = [self.rsaKeyPath stringByAppendingPathComponent:keyName];
    file = fopen([keyPath UTF8String], "rb");
    
    if (NULL != file)
    {
        if (type == KeyTypePublic)
        {
            _rsa = PEM_read_RSA_PUBKEY(file, NULL, NULL, NULL);
            assert(_rsa != NULL);
        }
        else
        {
            _rsa = PEM_read_RSAPrivateKey(file, NULL, NULL, NULL);
            assert(_rsa != NULL);
        }
        
        fclose(file);
        
        return (_rsa != NULL) ? YES : NO;
    }
    
    return NO;
}


- (BOOL)importRSAKeyFromeStringWithType:(KeyType)type andKey:(NSString *)key{
    if (key.length == 0) { return NO; }
    
    
    BIO *keybio ;
    keybio = BIO_new_mem_buf((__bridge void *)(key), -1);
    if (keybio==NULL)
    {
        printf( "Failed to create key BIO");
        return 0;
    }
    if(type == KeyTypePublic)
    {
        _rsa = PEM_read_bio_RSA_PUBKEY(keybio, &_rsa,NULL, NULL);
    }
    else
    {
        _rsa = PEM_read_bio_RSAPrivateKey(keybio, &_rsa,NULL, NULL);
    }
    BIO_free(keybio);
    return (_rsa != NULL) ? YES : NO;
}

- (NSString *) encryptByRsa:(NSString*)content withKeyType:(KeyType)keyType
{
    if (![self importRSAKeyWithPath:keyType])
        return nil;
//    if (![self importRSAKeyWithType:keyType])
//        return nil;
    
    int status;
    NSUInteger length  = [content length];
    unsigned char input[length + 1];
    bzero(input, length + 1);
    int i = 0;
    for (; i < length; i++)
    {
        input[i] = [content characterAtIndex:i];
    }
    
    NSInteger  flen = [self getBlockSizeWithRSA_PADDING_TYPE:PADDING];
    
    char *encData = (char*)malloc(flen);
    bzero(encData, flen);
    
    switch (keyType) {
        case KeyTypePublic:
            status = RSA_public_encrypt(length, (unsigned char*)input, (unsigned char*)encData, _rsa, PADDING);
            break;
            
        default:
            status = RSA_private_encrypt(length, (unsigned char*)input, (unsigned char*)encData, _rsa, PADDING);
            break;
    }
    
    if (status)
    {
        NSData *returnData = [NSData dataWithBytes:encData length:status];
        free(encData);
        encData = NULL;
        
        NSString *ret = [self base64EncodedStringForData:returnData ];
        return ret;
    }
    
    free(encData);
    encData = NULL;
    
    return nil;
}

- (NSString *) decryptByRsa:(NSString*)content withKeyType:(KeyType)keyType
{
    if (![self importRSAKeyWithPath:keyType])
        return nil;
//    if (![self importRSAKeyWithType:keyType])
//        return nil;
    
    int status;
    
    NSData *data = [self base64DecodedDataForString:content];
    NSUInteger length = [data length];
    
    NSInteger flen = [self getBlockSizeWithRSA_PADDING_TYPE:PADDING];
    char *decData = (char*)malloc(flen);
    bzero(decData, flen);
    
    switch (keyType) {
        case KeyTypePublic:
            status = RSA_public_decrypt(length, (unsigned char*)[data bytes], (unsigned char*)decData, _rsa, PADDING);
            break;
            
        default:
            status = RSA_private_decrypt(length, (unsigned char*)[data bytes], (unsigned char*)decData, _rsa, PADDING);
            break;
    }
    
    if (status)
    {
        NSMutableString *decryptString = [[NSMutableString alloc] initWithBytes:decData length:strlen(decData) encoding:NSASCIIStringEncoding];
        free(decData);
        decData = NULL;
        
        return decryptString;
    }
    
    free(decData);
    decData = NULL;
    
    return nil;
}

- (int)getBlockSizeWithRSA_PADDING_TYPE:(RSA_PADDING_TYPE)padding_type
{
    int len = RSA_size(_rsa);
    
    if (padding_type == RSA_PADDING_TYPE_PKCS1 || padding_type == RSA_PADDING_TYPE_SSLV23) {
        len -= 11;
    }
    
    return len;
}


//---------------加密工具方法
- (NSString *)base64EncodedStringForData:(NSData *)data
{
    return [self base64EncodedStringWithWrapWidth:0 data:data];
}

- (NSString *)base64EncodedStringWithWrapWidth:(NSUInteger)wrapWidth data:(NSData *)data
{
    //ensure wrapWidth is a multiple of 4
    wrapWidth = (wrapWidth / 4) * 4;
    
    const char lookup[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    long long inputLength = [data length];
    const unsigned char *inputBytes = [data bytes];
    
    long long maxOutputLength = (inputLength / 3 + 1) * 4;
    maxOutputLength += wrapWidth? (maxOutputLength / wrapWidth) * 2: 0;
    unsigned char *outputBytes = (unsigned char *)malloc(maxOutputLength);
    
    long long i;
    long long outputLength = 0;
    for (i = 0; i < inputLength - 2; i += 3)
    {
        outputBytes[outputLength++] = lookup[(inputBytes[i] & 0xFC) >> 2];
        outputBytes[outputLength++] = lookup[((inputBytes[i] & 0x03) << 4) | ((inputBytes[i + 1] & 0xF0) >> 4)];
        outputBytes[outputLength++] = lookup[((inputBytes[i + 1] & 0x0F) << 2) | ((inputBytes[i + 2] & 0xC0) >> 6)];
        outputBytes[outputLength++] = lookup[inputBytes[i + 2] & 0x3F];
        
        //add line break
        if (wrapWidth && (outputLength + 2) % (wrapWidth + 2) == 0)
        {
            outputBytes[outputLength++] = '\r';
            outputBytes[outputLength++] = '\n';
        }
    }
    
    //handle left-over data
    if (i == inputLength - 2)
    {
        // = terminator
        outputBytes[outputLength++] = lookup[(inputBytes[i] & 0xFC) >> 2];
        outputBytes[outputLength++] = lookup[((inputBytes[i] & 0x03) << 4) | ((inputBytes[i + 1] & 0xF0) >> 4)];
        outputBytes[outputLength++] = lookup[(inputBytes[i + 1] & 0x0F) << 2];
        outputBytes[outputLength++] =   '=';
    }
    else if (i == inputLength - 1)
    {
        // == terminator
        outputBytes[outputLength++] = lookup[(inputBytes[i] & 0xFC) >> 2];
        outputBytes[outputLength++] = lookup[(inputBytes[i] & 0x03) << 4];
        outputBytes[outputLength++] = '=';
        outputBytes[outputLength++] = '=';
    }
    
    //truncate data to match actual output length
    outputBytes = realloc(outputBytes, outputLength);
    NSString *result = [[NSString alloc] initWithBytesNoCopy:outputBytes length:outputLength encoding:NSASCIIStringEncoding freeWhenDone:YES];
    
#if !__has_feature(objc_arc)
    [result autorelease];
#endif
    
    return (outputLength >= 4)? result: nil;
}


- (NSData *)base64DecodedDataForString:(NSString *)string
{
    return [self dataWithBase64EncodedString:string];
}


- (NSData *)dataWithBase64EncodedString:(NSString *)string
{
    const char lookup[] =
    {
        99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 62, 99, 99, 99, 63,
        52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 99, 99, 99, 99, 99, 99,
        99,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 99, 99, 99, 99, 99,
        99, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 99, 99, 99, 99, 99
    };
    
    NSData *inputData = [string dataUsingEncoding:NSASCIIStringEncoding allowLossyConversion:YES];
    long long inputLength = [inputData length];
    const unsigned char *inputBytes = [inputData bytes];
    
    long long maxOutputLength = (inputLength / 4 + 1) * 3;
    NSMutableData *outputData = [NSMutableData dataWithLength:maxOutputLength];
    unsigned char *outputBytes = (unsigned char *)[outputData mutableBytes];
    
    int accumulator = 0;
    long long outputLength = 0;
    unsigned char accumulated[] = {0, 0, 0, 0};
    for (long long i = 0; i < inputLength; i++)
    {
        unsigned char decoded = lookup[inputBytes[i] & 0x7F];
        if (decoded != 99)
        {
            accumulated[accumulator] = decoded;
            if (accumulator == 3)
            {
                outputBytes[outputLength++] = (accumulated[0] << 2) | (accumulated[1] >> 4);
                outputBytes[outputLength++] = (accumulated[1] << 4) | (accumulated[2] >> 2);
                outputBytes[outputLength++] = (accumulated[2] << 6) | accumulated[3];
            }
            accumulator = (accumulator + 1) % 4;
        }
    }
    
    //handle left-over data
    if (accumulator > 0) outputBytes[outputLength] = (accumulated[0] << 2) | (accumulated[1] >> 4);
    if (accumulator > 1) outputBytes[++outputLength] = (accumulated[1] << 4) | (accumulated[2] >> 2);
    if (accumulator > 2) outputLength++;
    
    //truncate data to match actual output length
    outputData.length = outputLength;
    return outputLength? outputData: nil;
}

```
> 这里面我增加了 密钥直接从字符串读取的方法 原来方法是 从`NSBundle`读取private_key.pem和 public_key.pem 但是考虑到被篡改 我增加了 密钥直接搞成字符串(把字符串写到本地沙盒然后加载文件的方式) 这样代码 安全就提高了一些 如果能破译.m的话 拿到的也只能是 publicKey(公钥) 只要不能篡改 就是安全的 

### 外部调用

``` objc
NSString *publicKey = @"-----BEGIN PUBLIC KEY-----\n此处替换生成的公钥 记得换行 按照一定规则加'\n'  \n-----END PUBLIC KEY-----";
    
    NSString *privateKey = @"-----BEGIN PRIVATE KEY-----\n  此处替换生成的私钥 \n-----END PRIVATE KEY-----";
    
    NSFileManager *fm = [NSFileManager defaultManager];
    
    // 获取Documents目录路径
    NSString *docDir = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
    NSString *bundleIdentifier = [[NSBundle mainBundle] bundleIdentifier];
    NSString *path = [docDir stringByAppendingFormat:@"/%@",bundleIdentifier];
    NSString *publicKeyPath = [path stringByAppendingPathComponent:@"public_key.pem"];
    NSString *privateKeyPath = [path stringByAppendingPathComponent:@"private_key.pem"];
    
    BOOL isDir;
    BOOL exists = [fm fileExistsAtPath:path isDirectory:&isDir];
    if (exists) {
        /* file exists */
        if (isDir) {
            NSError *error = nil;
            BOOL pubResult = [publicKey writeToFile:publicKeyPath atomically:YES encoding:NSUTF8StringEncoding error:&error];
            if (error) {
                NSLog(@"%@",[error localizedDescription]);
            }
            BOOL privateResult = [privateKey writeToFile:privateKeyPath atomically:YES encoding:NSUTF8StringEncoding error:&error];
            if (error) {
                NSLog(@"%@",[error localizedDescription]);
            }
        }
    }else {
        [fm createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:nil];
        NSError *error = nil;
        BOOL pubResult = [publicKey writeToFile:publicKeyPath atomically:YES encoding:NSUTF8StringEncoding error:&error];
        if (error) {
            NSLog(@"%@",[error localizedDescription]);
        }
        BOOL privateResult = [privateKey writeToFile:privateKeyPath atomically:YES encoding:NSUTF8StringEncoding error:&error];
        if (error) {
            NSLog(@"%@",[error localizedDescription]);
        }
    }
    
    rsa.rsaKeyPath = path;
    [rsa importRSAKeyFromeStringWithType:KeyTypePublic andKey:publicKeyPath];
    
    [rsa importRSAKeyFromeStringWithType:KeyTypePrivate andKey:privateKeyPath];
    
    
    NSString *pubDesc = [rsa encryptByRsa:@"需要加密的字符串" withKeyType:KeyTypePrivate];
    NSLog(@"加密内容:%@\n--------\n",encryptString);
    NSLog(@"摘要:\n---------\n%@\n--------\n",pubDesc);
    
    //剩下的大家自己探索一下 没什么难度  
```


其中openssl api包，我们可以在第一步RSA密钥生成工具openssl的include文件夹中得到


下面我说一下如何集成openssl到 iOS工程 

### 1.下载 openssl library
[openssl ios下载](https://github.com/st3fan/ios-openssl)

### 2.导入到工程中

拖拽 openssl的库 _(包含 `include` & `lib` 的文件夹 )_到工程中 

然后 去 project targets -> `Build Settings`


* 找到 **Header Search Paths**, 添加 `"${SRCROOT}/Libraries/openssl/include"` 为你的工程
* 找到 **Library Search Paths**, 添加 `"${SRCROOT}/Libraries/openssl/lib"` 

然后就可以了如果中间出问题 请检查一下目录是否正确理论上应该是OK的

--


## 最后说一下我遇到RSA加密的坑


在iOS端加密 生成摘要到android的时候 android解析不出来(有时候解析出结果前面 一堆乱码) 这是base64有问题  建议 android使用原生的恩

``` java
import android.util.Base64;
```

如果是iOS 请使用 如下 Base64
[base64来源](https://github.com/nicklockwood/Base64)

上边的ios 的base64和android一一对应 不要理解错了 随便搞个Base64就行了  不信我 你可以试试

base64的代码我已经把代码实现写到`CRSA.m`了 如果像剥离很简单

好 demo我就不写了 已经把所有实现都搞上去了 

希望大家找到 好使的RSA方法实现 如果有问题 随时留言 

最后我说一句 很简单的一个RSA跨平台方案 那些抄袭CSDN的文章小伙伴 少坑点人 连搜索引擎都不会放过你

全文完 

[参考](https://www.lvtao.net/dev/android_ios_php_openssl.html)

