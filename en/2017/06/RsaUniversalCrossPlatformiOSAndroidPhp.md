---
layout: post
title: iOS Android Php RSA Encryption Decryption Universal Solution
date: 2017-06-26 10:42:47
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

![RSA Logo](/assets/images/20170626RsaUniversalCrossPlatformiOSAndroidPhp/RSALogo.avif)

# Preface

First, let me pay tribute to the authors of RSA

![RSA Team](/assets/images/20170626RsaUniversalCrossPlatformiOSAndroidPhp/RSATeam.avif)

For the principles of RSA asymmetric encryption and all that..., please Baidu it yourself

## The Detour

Recently my development work involved how to use RSA for authentication and other techniques... Honestly, I searched around and simply couldn't find a single piece of code that truly works across iOS, Android, and the web.
It wasted several days of development time — there wasn't a single reliable solution that works. So I have to write a blog post
and share the code that actually works. (Honestly, I really wanted to curse at the time — the results Baidu served up were a pile of garbage.)

# Implementation

## Step 1: Generate a Key Pair

### Generate the raw RSA private key file rsa_private_key.pem

``` sh
openssl genrsa -out rsa_private_key.pem 1024
```

### Convert the raw RSA private key to PKCS8 format

``` sh
openssl pkcs8 -topk8 -inform PEM -in rsa_private_key.pem -outform PEM -nocrypt -out private_key.pem
```

### Generate the RSA public key rsa_public_key.pem

``` sh
openssl rsa -in rsa_private_key.pem -pubout -out rsa_public_key.pem
```

> As you can see above, the corresponding public key can be generated from the private key. Therefore, we use the private key `private_key.pem` on the *server side* and distribute the *public key* to frontends such as `android` and `ios`

## Step 2: PHP Implementation

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
    *Return the corresponding private key
    */
    private static function getPrivateKey(){
    
        $privKey = self::$PRIVATE_KEY;
         
        return openssl_pkey_get_private($privKey);      
    }
 
    /**
     * Private key encryption
     */
    public static function privEncrypt($data)
    {
        if(!is_string($data)){
                return null;
        }           
        return openssl_private_encrypt($data,$encrypted,self::getPrivateKey())? base64_encode($encrypted) : null;
    }
    
    
    /**
     * Private key decryption
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

Open `private_key.pem` and replace the $PRIVATE_KEY above with the content of private_key.pem. On the server side, we only need to use the private key for encryption and decryption.

## Step 3: Android Implementation

Use Java's Cipher class to implement the encryption/decryption class. Here's the code:

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
     * Get the public key
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
     * Encrypt with the public key
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
    * Decrypt with the public key
    * @param content the ciphertext
    * @param key the merchant's private key
    * @return the decrypted string
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

__*Note:*__ When initializing the `Cipher` object, be sure to specify the `"RSA/ECB/PKCS1Padding"` format, e.g., `Cipher.getInstance("RSA/ECB/PKCS1Padding");`
Open the `rsa_public_key.pem` file and replace `RSA_PUBLICE` in the code above with its content.

## Step 4: iOS Implementation

iOS doesn't provide a direct API for RSA encryption. Most approaches found online also rely on handling X.509 certificates. However, X.509 certificates are signed — when the `openssl_pkey_get_private` method in PHP obtains the key, the signature must be passed as the second parameter, and implementing X.509 certificate encryption/decryption on Android is not easy either. Here, we take advantage of iOS's compatibility with C programs and use the openssl API to implement RSA encryption and decryption. Here's the code:

CRSA.h code

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

//---------------encryption utility methods
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
> Here I added a method to read the key directly from a string. The original approach read private_key.pem and public_key.pem from `NSBundle`. But considering the risk of tampering, I added the ability to pass the key as a string directly (write the string to the local sandbox and then load the file). This improves security somewhat. Even if someone reverse-engineers the .m file, the only thing they can obtain is the publicKey (public key). As long as it can't be tampered with, it's safe.

### External Usage

``` objc
NSString *publicKey = @"-----BEGIN PUBLIC KEY-----\n此处替换生成的公钥 记得换行 按照一定规则加'\n'  \n-----END PUBLIC KEY-----";
    
    NSString *privateKey = @"-----BEGIN PRIVATE KEY-----\n  此处替换生成的私钥 \n-----END PRIVATE KEY-----";
    
    NSFileManager *fm = [NSFileManager defaultManager];
    
    // get the Documents directory path
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
    
    // explore the rest yourself, it's not difficult  
```

The openssl API package can be obtained from the include folder of the openssl tool used in Step 1 to generate the RSA keys.

Let me explain how to integrate openssl into an iOS project:

### 1. Download the openssl library
[openssl for iOS download](https://github.com/st3fan/ios-openssl)

### 2. Import into the project

Drag the openssl library _(the folder containing `include` & `lib`)_ into the project

Then go to project targets -> `Build Settings`

* Find **Header Search Paths**, add `"${SRCROOT}/Libraries/openssl/include"` for your project
* Find **Library Search Paths**, add `"${SRCROOT}/Libraries/openssl/lib"` 

Then it should work. If you run into problems in the middle, check whether the directory is correct — theoretically it should be fine.

--

## Finally, the pitfalls I encountered with RSA encryption

When encrypting on iOS and generating the digest for Android, Android couldn't parse it (sometimes the parsed result started with a bunch of garbled characters). This is a base64 problem. I recommend Android use the native one.

``` java
import android.util.Base64;
```

For iOS, use the following Base64:
[base64 source](https://github.com/nicklockwood/Base64)

The iOS base64 above corresponds one-to-one with Android. Don't misunderstand and just grab any Base64 implementation. If you don't believe me, you can try it.

I've already written the base64 implementation into `CRSA.m`. If you want to strip it out, it's simple.

OK, I won't write a demo since all the implementations are already included above.

I hope everyone can find a working RSA implementation. If you have any questions, feel free to leave a comment.

One last thing: this is a very simple cross-platform RSA solution. To those who copy articles from CSDN, stop misleading people — even the search engines won't let you get away with it.

The End

Reference
