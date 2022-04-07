---
title: 使用NSAttributeString实现不同颜色大小显示
categories: [ios开发]
tags: [ios]
date: 2018-06-15 10:10:58
---

![](/assets/images/20180615NSAttributeString/richtext.png)
# 前言

最近开发需求遇到一个比较简单但又棘手的问题.先看需求

![](/assets/images/20180615NSAttributeString/NSAttributeString1.png)

一个`UILabel`显示不同大小颜色的字符串,当然我们首先的想到属性字符串,但是注意: 我们这里要处理国际化完成的字符串也就是说：

必须在国际化完成以后才能追加我们的逻辑,而不是一上来就加属性字符串

比如:  `2分14秒` or `2min14secs`

也就是给我们的是一个  `"2分14秒"`字符串 我们需要匹配range来修改或者替换. 带着这个疑问开始今天的文章?

## 实现思路

孔圣贤有云:"举一隅不以三隅反，则不复也。"  
> 出自《论语·第七章·述而篇》

为了不愧对圣贤对我的期待我把 这个问题定位升级成 4个等级

* Level 1  最优解,时间复杂度最低,效率最高
* Level 2  非最优解,时间复杂度最低,效率高
* Level 3  都一般
* Level 4  简单粗暴

我想到了以下至少两种方法

1. 通过计算出来的时间  eg: `分` `秒`   字符串 range去国际化处理完的字符串去匹配修改
2. 用正则匹配数字
3. 用谓词匹配数字
4. level4太业余了不敢想向一个工作好几年的开发者还写出这么打脸的代码

### 准备工作

在工程中拖拽了一个label

``` objc

@interface ViewController ()
@property (weak, nonatomic) IBOutlet UILabel *label;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
 
 	//调用
    NSAttributedString *resultTime = [self formattedCurrentTime:133];
    self.label.attributedText = resultTime;
}

```

### 方案1: 字符串range匹配

``` objc
/**
 返回当前时间格式
 @return 返回组装好的字符串
 */
- (NSAttributedString *)formattedCurrentTime:(NSTimeInterval)timeInterval {
    
    NSUInteger time = (NSUInteger)timeInterval;
    NSInteger minutes = (time / 60) % 60;
    NSInteger seconds = time % 60;
    NSString *minStr = [NSString stringWithFormat:@" %zd ",minutes];
    NSString *secStr = [NSString stringWithFormat:@" %zd ",seconds];
    //假设这就是我们国际化后的字符串
    NSString *localizedFormatString = [NSString stringWithFormat:@"%@分%@秒",minStr,secStr];
    NSMutableAttributedString *attributeStr = [[NSMutableAttributedString alloc] initWithString:localizedFormatString];
    NSRange minRange, secRange;
    if (@available(iOS 9.0, *)) {
        minRange = [localizedFormatString localizedStandardRangeOfString:minStr];
        secRange = [localizedFormatString localizedStandardRangeOfString:secStr];
    } else {
        minRange = [localizedFormatString rangeOfString:minStr];
        secRange = [localizedFormatString rangeOfString:secStr];
    }
    NSDictionary *timeAttrs = @{ NSForegroundColorAttributeName : [UIColor redColor],
                                 NSFontAttributeName : [UIFont systemFontOfSize:40.0f]};
    [attributeStr addAttributes:timeAttrs range:minRange];
    [attributeStr addAttributes:timeAttrs range:secRange];    
    return [[NSAttributedString alloc] initWithAttributedString:attributeStr];;
}
```

看下显示结果

![](/assets/images/20180615NSAttributeString/arrtributestring1.png)

> 是不是看上去很好

但我认为这并不完美,这种搞法虽然简单直接,但是过于依赖`minStr`和`secStr`的原始range,基于iOS9之后提供的API计算`range`

``` objc
if (@available(iOS 9.0, *)) {
    minRange = [localizedFormatString localizedStandardRangeOfString:minStr];
    secRange = [localizedFormatString localizedStandardRangeOfString:secStr];
} else {
    minRange = [localizedFormatString rangeOfString:minStr];
    secRange = [localizedFormatString rangeOfString:secStr];
}
```
> 注意:*API平台区分*

但是这么实现有个Bug 当遇到同样字符串的时候就会匹配错位, 如图

![](/assets/images/20180615NSAttributeString/NSAttributeStringBug1.png)

错误的原因显然大家都了解

字符串 "0" 的range相同了,但就解决这个问题而言,简单判断一下range然后截取字符串向后跳跃length继续截取获取能实现,但这显然很啰嗦,万一有一天 你遇到的是 "`0小时0分12秒`"这种字符串那该如何写呢？

是不是要递归的遍历一遍然后挨个取`Range` 做属性修改?

这样的结果显然不但代码啰嗦 实现起来成本还是比较高的,对代码阅读性都有很大影响(写得好的代码除外哈). 


##### 那怎么不啰嗦呢?

有一种搞法就是 用两个不同的字符占位.然后 国际化完成之后取Range,再然后替换文字,搞法虽然low点,但是时间复杂度降低了不少,还是可以考虑的.代码我就不写了 我怕小伙伴review代码的时候会虐我.继续往下看

**评级: Level 2**

那如何不依赖range解决这种问题呢？

### 方案2: 正则匹配

``` objc
/**
 返回当前时间格式
 @return 返回组装好的字符串
 */
- (NSAttributedString *)formattedCurrentTime:(NSTimeInterval)timeInterval {
    
    NSUInteger time = (NSUInteger)timeInterval;
    NSInteger minutes = (time / 60) % 60;
    NSInteger seconds = time % 60;
    NSString *minStr = [NSString stringWithFormat:@" %zd ",minutes];
    NSString *secStr = [NSString stringWithFormat:@" %zd ",seconds];
    //假设这就是我们国际化后的字符串
    NSString *localizedFormatString = [NSString stringWithFormat:@"%@分%@秒",minStr,secStr];
    NSMutableAttributedString *attributeStr = [[NSMutableAttributedString alloc] initWithString:localizedFormatString];
    NSDictionary *timeAttrs = @{ NSForegroundColorAttributeName : [UIColor redColor],
                                 NSFontAttributeName : [UIFont systemFontOfSize:40.0f]};    
    /** 方案2 **/
    NSError *error = nil;
    NSRegularExpression *reg = [NSRegularExpression regularExpressionWithPattern:@"[0-9]+" options:NSRegularExpressionCaseInsensitive error:&error];
    if (error == nil) {
        NSArray *matches = [reg matchesInString:localizedFormatString options:NSMatchingReportCompletion range:NSMakeRange(0, localizedFormatString.length)];
        for (NSTextCheckingResult *match in matches) {
            for (NSUInteger i = 0; i < match.numberOfRanges; i++) {
                NSRange range = [match rangeAtIndex:i];
                if (range.location != NSNotFound) {
                    [attributeStr addAttributes:timeAttrs range:range];
                }
            }
        }
    }
    return [[NSAttributedString alloc] initWithAttributedString:attributeStr];;
}

```

看下显示结果

![](/assets/images/20180615NSAttributeString/attributestring2.png)

完美实现

> 这种方案缺点就是,时间复杂度高了一些,需要每次正则遍历
> 有点是扩展性好一点,万一有一天PM又提了需求要做成 `A1` `B2` `C3 ` `XXX#话题`这种，那一定会出坑

但我第一次这么实现被小伙伴嘲笑很业余.确实很业余,但它能避免方案1中的bug.而且相当精确.

**评级: Level 2**

### 方案3: 谓词匹配

这种搞法我没尝试,估计会比 方案1和方案2都快一些和简单直接一些,时间太紧张算了,期待评论轻喷吧！

### 方案4: 简单粗暴

就搞 4个label. 我都想象到了被实习生嘲讽+打脸的搞法发生在一个工作好几年开发者身上是多么惨痛的画面. 放弃这种low的搞法

# 总结

最终解决问题的方案还是方案2:正则匹配比较靠谱,而且一劳永逸

本篇主要蛋疼的问题是 国际化后的字符串返回结果后,对返回的结果进行加工处理.

没有做到Level 1级的做法很是遗憾,愧对圣贤. 希望小伙伴多提提建议.

[Demo](https://github.com/sunyazhou13/NSAttributeStringDemo)在这里找到

## 补充

格式化时间的代码

``` objc
/**
 返回时间格式 HH:mm:ss
 @return 返回组装好的字符串
 */
- (NSString *)formattedCurrentTime {
    NSUInteger time = (NSUInteger)self.recorder.currentTime;
    NSInteger hours = (time / 3600);
    NSInteger minutes = (time / 60) % 60;
    NSInteger seconds = time % 60;
    
    NSString *format = @"%02i:%02i:%02i";
    return [NSString stringWithFormat:format, hours, minutes, seconds];
}

```

全文完
