---
layout: post
title: Objective-C中使用正则去除非数字字母汉字
date: 2018-06-25 18:35:17
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
---

# 前言

今天碰到个需求,PM要求输入框中取出非字母数字汉字的输入.

![](/assets/images/20180625FilterString/RegularExpressDemo.gif)

带着这个疑问开始今天的文章

# 准备工作

创建个demo 代码如下

``` objc
@interface ViewController ()
@property (weak, nonatomic) IBOutlet UITextField *input;
@property (weak, nonatomic) IBOutlet UILabel *label;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.input.delegate = self;
    [self.input addTarget:self action:@selector(textChange:) forControlEvents:UIControlEventEditingChanged];
}

//当文本内容改变时调用
- (void)textChange:(UITextField *)textField
{
    //这里调用相关方法过滤字符串显示出来
    self.label.text = //...;
}
```

在网上找了一圈大多都是使用谓词去判断时候包含,没有几个给出相应的处理字符串.

我找到了3种 处理字符串的方式

* 方案1 使用谓词过滤
* 方案2 使用正则过滤增加寻找的字符串长度
* 方案3 使用正则精简过滤字符串


``` objc
方案1
- (NSString *)filterString1:(NSString *)str {
    NSString *regex = @"^[a-zA-Z0-9\u4e00-\u9fa5]+";
    NSPredicate *pred = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", regex];
    NSMutableString * retStr = [NSMutableString string];
    for(NSInteger i=0; i< [str length];i++){
        NSRange range = NSMakeRange(i, 1);
        NSString *character = [str substringWithRange:range];
        if([pred evaluateWithObject:character])
        {
            [retStr appendString:character];
        }
    }
    return retStr;
}
```

> 这种方式虽然能实现 但是代码略显冗长,不过能就解决问题


``` objc
//方案2
- (NSString *)filterString2:(NSString *)str {
    NSString *regex = @"[^a-zA-Z0-9\u4e00-\u9fa5]";
    NSMutableString *mstr = [NSMutableString stringWithFormat:@"%@", str];
    NSUInteger i = [mstr replaceOccurrencesOfString:regex withString:@"" options:NSRegularExpressionSearch range:NSMakeRange(0, mstr.length)];
    return [NSString stringWithFormat:@"%@-长度:%zd",mstr,i];
}
```

> 同样的方法使用正则`replaceOccurrencesOfString:withString:options:range:`方法替换字符串

下面我们精简到2行代码

``` objc
//方案3
- (NSString *)filterString3:(NSString *)str {
    NSString *regex = @"[^a-zA-Z0-9\u4e00-\u9fa5]";
    return [str stringByReplacingOccurrencesOfString:regex withString:@"" options:NSRegularExpressionSearch range:NSMakeRange(0, str.length)];
}
```

> 最终方案3 得到的预期结果还是不错,推荐使用


# 总结

有些问题都是在工作中遇到,希望记录下来一起分享和学习.


全完完

[Demo在这里](https://github.com/sunyazhou13/RegularExpressDemo)



