---
title: UICollectionViewCell添加KVO
categories: [ios开发]
tags: [ios]
date: 2017-12-15 17:05:10
---


![](/assets/images/20171215CellAddKVO/UICollectionViewCell.png)


# 前言

都一个多月没更新博客了,这一段时间太忙了. 这篇带来的分享内容是**如何正确的给一个`UICollectionViewCell`添加`KVO`监听**.


## 开篇

由于目前在开发[短视频](https://github.com/ksvc/KSYMediaEditorKit_iOS)相关的SDK,面向的多数都是小白开发者,为了能让小白以最低的成本看懂 SDK 的代码以及用法,这就要求我们以小白最容易理解的方式开发代码,比如最低级的`MVC`模式,最直白的`Objective-C`(老实说我都烦透了 OC 这种超级长看着都难受的编程语言,早想用 swift 来玩一把了),所以在开发的技术选型和代码编写过程中都是达到小白最低的理解能力的开发模式,但有时候不得不面对在*小白能理解*和*功能的高级实现*之间做妥协.最近开发遇到个问题,如下:

> PM 有个需求 要实现在一个屏幕内多个 cell 上随意切换 录制视图并且能随意点击取消,再加上录制完成的视频如果不在选中状态就显示封面,如果在选中状态就继续预览,如果没有录制完的视频并且不在预览的 CELL要显示添加功能.

听完这个需求是不是都晕了,我们来看张我实现完成的图.

![](/assets/images/20171215CellAddKVO/RecordDemo.gif)

1. 录制完的视频取出封面
2. 正在预览的随时准备录制
3. 随意能切换 cell 不影响录制视图
4. 未录制的并且没有已录制完视频文件的 cell 显示 添加按钮

第一眼看着没啥技术含量都 UI 是吧

好我们来玩点有技术含量的


#### 问题1

如果使用传统MVC 模式的话`Cell`上边显示数据,那`model`里面是不是要放一个`record`的实例对象 告诉它 啥时候开始啥时候结束,当然你有更好的方式我就不说了我其实也知道.

#### 问题2

取出封面很简单让 cell里面存储一下录制完的 URL 就可以了,然后每次调用 UICollectonView 的 `reload:`方法

#### 问题3

我们实现录制视图的方式是放在 cell 的一个 subview 上, 正在录制的视图如果 reload 的话 应该会瞬间没了.就算吭哧吭哧实现完开始录制、暂停录制、恢复录制、结束录制... 这活我觉得问题和隐患应该非常多.别想了 不能这么玩

#### 问题4

cell的选中和非选中问题,你有没有发现 如果正在录制的 cell 上的 view 是选中的有个红色的框代表当前属于 焦点状态.
那录制完成呢.是不是需要重新 reload cell 告诉它当前谁 选中 谁取消,如果点击的是同一个 cell 还要取反操作.如果正在预览是不是再次选中说明要停止预览显示加号或者封面图,想着想着你发现这玩意是个状态机.必须要想好 model 构造,要让model 的参数足够多去控制当前 cell 的选中状态、非选中状态、预览状态、非预览状态、录制状态、非录制状态、录完状态、停止录制状态... 想着想着 太麻烦了 于是我整理出一个状态机的表格 如下:


| Cell Status | 当前cell显示内容 |其它 cell 显示内容| 点击当前 | 点击其它选中 |
| :------: | :------: | :------: | :------: | :------: |
| 无预览状态 | 显示加号/封面图 | 显示加号/或者封面 | 开始预览 | 切换预览视图 |
| 正在预览状态 | 预览视频 | 显示加号/或者封面 | 显示加号/或者封面 | 切换预览视图 |
| 正在录制状态 | 预览视频/播放视频 | (显示加号或播放视频)/(显示加号或预览视频) | 无操作(上锁) | 无操作(上锁) |


> _这些不重要,有这个印象就行了不用仔细看_

并不是我把问题复杂化,是 PM 的需求太复杂.不得不完整列出所有状态,精简,再精简,让小白开发者也能看懂的 SDK 才是好 SDK.


其实 其它的问题还有好多 我就不列出来了,好 现在我们来依次解决问题



**其实,综合上述信息来看,归根结底的原因是,实现这个录制随意切换功能等等的交互并不适用于`MVC`这种传统的玩法.
更像是一个`MVVM`的搞法**,于是我想到了 MVVM 里面的精髓所在.要用**数据驱动视图**.

上面的4个主要问题不就是因为 model 的状态修改了要通知 cell 变化嘛.那我们使用 model 的状态来控制

> 注意:_如果使用 MVVM 的玩法就不要再去调用 collectionview 的 reload:方法了_

目前开发实现`MVVM`的方式主流两种

* RAC
* KVO

显然`RAC`太大并不适用于我们 demo,用 KVO 搞一把.(代码有删减)

#### 第一步定义 model

``` objc
typedef void (^CompletionHandler)(UIImage * image); //取出 Image 给 Cell 显示的回调

typedef NS_ENUM(NSUInteger,KSYMultiCanvasModelStatus){
    KSYMultiCanvasModelStatusNOPreview = 0,//无预览状态
    KSYMultiCanvasModelStatusINPreview = 1,//正在预览状态
    KSYMultiCanvasModelStatusRecording = 2 //正在录制状态
};

@interface KSYCanvasModel : NSObject 
@property (nonatomic, strong) NSURL  *videoURL; //存放录制完视频 URL
@property (nonatomic, assign) BOOL   isSelected;//是否是选中
@property (nonatomic, assign) KSYMultiCanvasModelStatus modelStatus; //重要!!!:模型状态用它控制 cell 显示
- (void)gengrateImageBySize:(CGSize)size
          completionHandler:(CompletionHandler)handler;

@end

@interface KSYCanvasModel ()

@property(nonatomic, strong)AVAssetImageGenerator *imageGenerator;
@end

@implementation KSYCanvasModel

- (void)gengrateImageBySize:(CGSize)size
          completionHandler:(CompletionHandler)handler{
    if (self.videoURL == nil) { handler(nil); }
    
    AVURLAsset *asset = [AVURLAsset assetWithURL:self.videoURL];
    self.imageGenerator = nil;
    self.imageGenerator = [AVAssetImageGenerator assetImageGeneratorWithAsset:asset];
    self.imageGenerator.maximumSize = size;
    
    NSError *error=nil;
    CMTime time= kCMTimeZero;//CMTime是表示电影时间信息的结构体，第一个参数表示是视频第几秒，第二个参数表示每秒帧数.(如果要活的某一秒的第几帧可以使用CMTimeMake方法)
    CMTime actualTime;
    CGImageRef cgImage= [self.imageGenerator copyCGImageAtTime:time actualTime:&actualTime error:&error];
    if(error){
        NSLog(@"截取视频缩略图时发生错误，错误信息：%@",error.localizedDescription);
        handler(nil);
        return;
    }
    CMTimeShow(actualTime);
    UIImage *image = [UIImage imageWithCGImage:cgImage];//转化为UIImage
    CGImageRelease(cgImage);
    handler(image);
}
@end

```


ok model 大概是这样 .m 文件主要是从视频中取封面图


#### 第二步定义 cell

``` objc
#import <UIKit/UIKit.h>
#import "KSYCanvasModel.h"

static const NSString *KSYModelKVOStatusContext;
static NSString *KSYKeyPathForModelStatus = @"modelStatus";
static NSString *KSYKeyPathForIsSelected = @"isSelected";

@interface KSYCanvasCell : UICollectionViewCell
@property (weak, nonatomic) IBOutlet UIView *canvasImageView;
@property (weak, nonatomic) IBOutlet UIImageView *addImageView;
@property (weak, nonatomic) IBOutlet UIImageView *boundsView;

@property (nonatomic, strong) KSYCanvasModel *model;

//注册和移除观察接口
- (void)addObserver:(NSObject *)observer
         forKeyPath:(NSString *)keyPath
            options:(NSKeyValueObservingOptions)options
            context:(void *)context;
- (void)removeObserver:(NSObject *)observer
            forKeyPath:(NSString *)keyPath 
               context:(void *)context;

@end

@interface KSYCanvasCell()
// 使用 ObservableKeys 保存 keyPath 观察状态，避免重复注册和重复移除（重复移除会导致 crash）
@property (nonatomic, strong) NSMutableSet *observableKeySets;
@end

@implementation KSYCanvasCell

- (void)awakeFromNib {
    [super awakeFromNib];
    
    //千万别把 KOV 监听写在这里
}

//.,,此处省略了不太相关的代码

- (void)addObserver:(NSObject *)observer
         forKeyPath:(NSString *)keyPath
            options:(NSKeyValueObservingOptions)options
            context:(void *)context{
    if ([self.observableKeySets containsObject:keyPath]) { return; }
    
    if (self.observableKeySets == nil) {
        self.observableKeySets = [NSMutableSet set];
    }
    
    [self.observableKeySets addObject:keyPath];
    
    [self.model addObserver:observer
                 forKeyPath:keyPath
                    options:options
                    context:context];
}

- (void)removeObserver:(NSObject *)observer
            forKeyPath:(NSString *)keyPath
               context:(void *)context{
    if (![self.observableKeySets containsObject:keyPath]) { return; }
    
    [self.model removeObserver:observer
                    forKeyPath:keyPath
                       context:context];
    [self.observableKeySets removeObject:keyPath];
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSKeyValueChangeKey,id> *)change
                       context:(void *)context{
    if ([KSYKeyPathForModelStatus isEqualToString:keyPath]) {
        KSYMultiCanvasModelStatus modelStatus = [[change objectForKey:NSKeyValueChangeNewKey] integerValue];
        NSLog(@"当前状态:%zd",modelStatus);
		 //拿到模型状态然后做适当的处理
    } else if([KSYKeyPathForIsSelected isEqualToString:keyPath]){
        //处理是否显示边框
    }
}

@end

```


> 这里要在.h 里面复写 下面这俩个方法 因为要再 ViewController 里面拿到 cell 调用这个方法

* `addObserver:forKeyPath:options:context:` 这个方法是系统方法需要复写并对外暴露接口
* `removeObserver:forKeyPath:context:` 这个方法是系统方法需要复写并对外暴露接口


这里定义了一个上下文对象用于找到识别这个在 cell的监听还有两个要监听的属性(KSYCanvasCell.h 顶部)

``` objc
static const NSString *KSYModelKVOStatusContext;
static NSString *KSYKeyPathForModelStatus = @"modelStatus";
static NSString *KSYKeyPathForIsSelected = @"isSelected";

```

> 注意:**为了防止 cell 重复注册导致复用的时候崩溃,这里用`NSMutableSet`让 model 的观察者只注册一次**

``` objc
@interface KSYCanvasCell()
// 使用 ObservableKeys 保存 keyPath 观察状态，避免重复注册和重复移除（重复移除会导致 crash）
@property (nonatomic, strong) NSMutableSet *observableKeySets;
@end
```

添加的时候做一次check

``` objc
- (void)addObserver:(NSObject *)observer
         forKeyPath:(NSString *)keyPath
            options:(NSKeyValueObservingOptions)options
            context:(void *)context{
    if ([self.observableKeySets containsObject:keyPath]) { return; }
    
    if (self.observableKeySets == nil) {
        self.observableKeySets = [NSMutableSet set];
    }
    
    [self.observableKeySets addObject:keyPath];
    
    ...
}
```

移除的时候要做一次 check

``` objc
- (void)removeObserver:(NSObject *)observer
            forKeyPath:(NSString *)keyPath
               context:(void *)context{
    if (![self.observableKeySets containsObject:keyPath]) { return; }
    
    [self.model removeObserver:observer
                    forKeyPath:keyPath
                       context:context];
    [self.observableKeySets removeObject:keyPath];
}
```

ok cell 大概是这个意思

#### 第三步在 ViewController里面 适当的位置 注册/移除监听 并在ViewController控制器的生命周期内也做好相关监听的移除和添加

这里我们需要实现`UICollectionViewDelegate`的代理协议来调用 cell 的添加 cell 和移除 cell

``` objc
- (void)collectionView:(UICollectionView *)collectionView willDisplayCell:(UICollectionViewCell *)cell forItemAtIndexPath:(NSIndexPath *)indexPath{
    KSYCanvasCell *canvasCell = (KSYCanvasCell *)cell;
    [canvasCell addObserver:canvasCell
                 forKeyPath:KSYKeyPathForModelStatus
                    options:NSKeyValueObservingOptionNew
                    context:&KSYModelKVOStatusContext];
    [canvasCell addObserver:canvasCell
                 forKeyPath:KSYKeyPathForIsSelected
                    options:NSKeyValueObservingOptionNew
                    context:&KSYModelKVOStatusContext];

}

- (void)collectionView:(UICollectionView *)collectionView didEndDisplayingCell:(UICollectionViewCell *)cell forItemAtIndexPath:(NSIndexPath *)indexPath{
    KSYCanvasCell *canvasCell = (KSYCanvasCell *)cell;
    //状态变化
    [canvasCell removeObserver:canvasCell
                    forKeyPath:KSYKeyPathForModelStatus
                       context:&KSYModelKVOStatusContext];
    //选中变化
    [canvasCell removeObserver:canvasCell
                    forKeyPath:KSYKeyPathForIsSelected
                       context:&KSYModelKVOStatusContext];
}
```

你是不是会问为啥写这 

我来告诉我我遇到的一个坑

如果你在 下面的方法里写注册 后果不堪设想,因为 cell 是复用的,每次复写 KVO 都是在创建新的对象

``` objc
- (__kindof UICollectionViewCell *)collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath{
    KSYCanvasCell *cell = [collectionView dequeueReusableCellWithReuseIdentifier:[KSYCanvasCell className] forIndexPath:indexPath];
    cell.model = [self.models objectAtIndex:indexPath.row];
    //如果写在这里
    return cell;
}
```

KVO的实现原理很简单,就是把这个对象的监听属性在底层复写一下,监听两个值之间的变化.KVO 原理相关的就不多废话了,这都是家常便饭了

我一开始写在了 cell 的 awakeFromNib: 因为都是 cell 拖拽的控件,但是麻烦真是接踵而至,各种崩溃

``` objc
- (void)awakeFromNib {
    [super awakeFromNib];
	 //别写在这里    
}
```

如果你不信邪可以试试.


最后我们在控制器的适当位置修改 model 的状态这样就做到了实时更新 cell



``` objc

- (void)collectionView:(UICollectionView *)collectionView didSelectItemAtIndexPath:(NSIndexPath *)indexPath{
    //------------处理点击-----------
    KSYCanvasModel *lastModel = [self.models objectAtIndex:self.lastSelectedIndexPath.row];
    KSYCanvasModel *selectedModel = [self.models objectAtIndex:indexPath.row];
    BOOL clickSameCell = (self.lastSelectedIndexPath == indexPath);
    if (clickSameCell) {
        //选择同一个cell
        selectedModel.isSelected = !selectedModel.isSelected;
    } else {
        lastModel.isSelected = NO;
        selectedModel.isSelected = YES;   
    }
    selectedModel.modelStatus = KSYMultiCanvasModelStatusRecording; //这就会出发 cell的 KVO 了
}

```


最后别忘了在ViewController的生命周期添加和移出观察者

``` objc
- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
    [self.canvasCollectionView.visibleCells enumerateObjectsUsingBlock:^(KSYCanvasCell *cell, NSUInteger idx, BOOL * _Nonnull stop) {
        [cell removeObserver:cell
                  forKeyPath:KSYKeyPathForModelStatus
                     context:&KSYModelKVOStatusContext];
    }];
}

```

这样的实现过程就 解决了 上边提到的 问题 1、2、3、4


这也是最精简的实现方式,以小白的开发视角 来看也需要熟悉一点 MVVM 了.这都是成了 iOS 最标配了.


## 总结

这种偏向MVVM模式开发的方式 我个人觉得还是不错的,虽然现在各种MVVM格式早已经烂大街了,但只要想起来,用起来,能用简单直白的方式解决问题,它就是好的开发设计模式.当然本章也主要讲了一些技巧而已,不足之处还请各位指正.


demo我就不写了 可以参考[我们的短视频 demo](https://github.com/ksvc/KSYMediaEditorKit_iOS) multicanvas target


全文完

