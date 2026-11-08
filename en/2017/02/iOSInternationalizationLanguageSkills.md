---
layout: post
title: Some Tips for iOS Language Localization/Internationalization
date: 2017-02-17 10:01:19
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

Getting the internationalized language array via code  
--  
Getting the language currently used by the app
``` objc
    NSArray *langArr1 = [[NSUserDefaults standardUserDefaults] valueForKey:@"AppleLanguages"];
    NSString *language1 = langArr1.firstObject;
    NSLog(@"模拟器语言：%@",language1);
```

Switching languages: `en` stands for English, `zh-Hans` for Simplified Chinese, `zh-Hant` for Traditional Chinese.  

``` objc
    NSArray *lans = @[@"en"];
    [[NSUserDefaults standardUserDefaults] setObject:lans forKey:@"AppleLanguages"];
```
Switching the launch language by modifying the scheme
--

![Figure 1](/assets/images/20170217iOSInternationalizationLanguageSkills/AppleLanguages1.avif)

![Figure 2](/assets/images/20170217iOSInternationalizationLanguageSkills/AppleLanguages2.avif)

> `-AppleLanguages (zh-Hans)` stands for Simplified Chinese  
> `-AppleLanguages (zh-Hant)` stands for Traditional Chinese  
> `-AppleLanguages (en)` stands for English  
> You can figure out the others yourself. Pay attention to the **space**.

Getting different localized images via code
--

``` objc
#import "ViewController.h"

@interface ViewController ()
@property (weak, nonatomic) IBOutlet UIImageView *imageView;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    //xxx is the localized image name, e.g. xxx.png 
    //if the image is xxx.jpg, replace xxx with xxx.jpg
    NSString *imageName = NSLocalizedString(@"xxx", nil); 
    self.imageView.image = [UIImage imageNamed:imageName];
}

@end
```

Here is a [demo](https://github.com/sunyazhou13/LocalizedDemo/tree/master) I wrote.  
It mainly covers the following:
1. Project name configuration: plist internationalization  
2. String internationalization  
3. Custom string internationalization  
4. Image internationalization  

Reference: [VV木公子](http://www.jianshu.com/p/88c1b65e3ddb) 

End of article
