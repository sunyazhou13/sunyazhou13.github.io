---
title: iOS语言本地化/国际化一些技巧
date: 2017-02-17 10:01:19
categories: [ios开发]
tags: [ios, macos]
---

代码获取国际化语言数组  
--  
获取当前app使用的语言
``` objc
    NSArray *langArr1 = [[NSUserDefaults standardUserDefaults] valueForKey:@"AppleLanguages"];
    NSString *language1 = langArr1.firstObject;
    NSLog(@"模拟器语言：%@",language1);
```

切换语言 `en`代表 英语, `zh-Hans` 简体中文, `zh-Hant` 繁体中文.  

``` objc
    NSArray *lans = @[@"en"];
    [[NSUserDefaults standardUserDefaults] setObject:lans forKey:@"AppleLanguages"];
```
修改scheme切换启动语言
--

![图1](/assets/images/20170217iOSInternationalizationLanguageSkills/AppleLanguages1.png)

![图2](/assets/images/20170217iOSInternationalizationLanguageSkills/AppleLanguages2.png)

> `-AppleLanguages (zh-Hans)` 代表简体中文  
> `-AppleLanguages (zh-Hant)` 代表繁体中文  
> `-AppleLanguages (en)` 代表英文  
> 其它小伙伴们自己总结一下也可以 注意 **空格** 

国际化取不同图片代码
--

``` objc
#import "ViewController.h"

@interface ViewController ()
@property (weak, nonatomic) IBOutlet UIImageView *imageView;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    //xxx 是国际化 图片的名字 例如xxx.png 
    //如果是 xxx.jpg 必须写把xxx 替换成xxx.jpg
    NSString *imageName = NSLocalizedString(@"xxx", nil); 
    self.imageView.image = [UIImage imageNamed:imageName];
}

@end
```

下面是我写的一个[demo](https://github.com/sunyazhou13/LocalizedDemo/tree/master)  
主要完成 如下内容 
1. 工程名称配置plist 国际化  
2. 字符串国际化  
3. 自定义字符串国际化  
4. 图片国际化  

参考 [VV木公子](http://www.jianshu.com/p/88c1b65e3ddb) 

全文完