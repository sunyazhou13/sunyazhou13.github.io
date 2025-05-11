---
layout: post
title: DFS算法扫描上传文件/文件夹
date: 2017-02-10 10:07:55
categories: [iOS]
tags: [iOS, macOS, Objective-C, Swift]
typora-root-url: ..
---

DFS需求背景
--
> 在开发过程中难免会遇到类似 上传文件夹的功能,但是上传文件夹会遇到一种情况
	
	1. 如果文件里面包含子文件夹的N层嵌套
	2. 如何过滤非空文件夹
	3. 如何处理根层文件夹没有文件那么文件目录也需要创建
	
举例例子
![](/assets/images/20170210DFSAlgorithm/DFS1.webp)

这种文件夹如何 `此文件夹为空且是叶子结点` 走上传逻辑(就是发个 http请求 create一下 dir就行了) 我们要的结果是 过滤出这个路径走上传逻辑 创建一下这个最深处目录 那么下次再遇到它的父目录 `/1/` 的话应该就不用创建了.

还有一种情况  
> eg: ~/Downloads/A/B/C/ 里面有个 1.txt    
> 路径是: ~/Downloads/A/B/C/1.txt

一般如果广度优先做上传的话 Downloads、A、B、C分别要发4个http请求
如果深度优先发一个上传这个文件~/Downloads/A/B/C//A/B/C/1.txt就可以了，因为一般server都会做 容错处理发现父目录有没有没有就创建之类的逻辑。


算法
--
> 不要害怕, 很简单
一般我们处理这种问题都是采用自己写的递归算法, 估计是鄙人算法不咋好没搞出来什么好的递归,最后找到了 苹果自带的递归方法

```objc
//搞个点击事件 在这里我拿macOS上的 文件选择面板做一下测试
- (IBAction)dfsAction:(NSButton *)sender
{
    NSOpenPanel *panelPath = [NSOpenPanel openPanel];
    [panelPath setCanChooseFiles:YES];
    [panelPath setCanChooseDirectories:YES];
    [panelPath setTitle:@"上传文件选择"];
    [panelPath setCanCreateDirectories:YES];
    [panelPath setPrompt:@"上传"];
    [panelPath setMessage:@"这就是message"];
    panelPath.allowsMultipleSelection = YES;
    [panelPath beginSheetModalForWindow:self.window completionHandler:^(NSInteger result) {
        if (result == NSFileHandlingPanelOKButton) {
            [self dfsUrls:panelPath.URLs];
        }
    }];
}
```
![](/assets/images/20170210DFSAlgorithm/DFS2.webp)

然后  

```objc
/**
 选择文件夹的目录

 @param urls 所有选中的目录/文件URL
 */
- (void)dfsUrls:(NSArray *)urls
{
	//开一个线程在异步处理这些耗时任务
	dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSLog(@"所有URLs%@",urls);
        if (urls.count == 0) { return; }
        
        NSTimeInterval currentTime = [[NSDate date] timeIntervalSince1970];
        //深度遍历
        NSFileManager *fileManager = [NSFileManager defaultManager];
        NSMutableArray *urlDirFiles = [[NSMutableArray alloc] initWithCapacity:0];
        NSArray *keys = [NSArray arrayWithObjects:NSURLIsDirectoryKey,NSURLParentDirectoryURLKey, nil];
        NSUInteger *total = 0;
        for (NSURL *localUrl in urls) {
            NSDirectoryEnumerator *enumerator = [self enumeratorPathByFileManager:fileManager atURL:localUrl propertiesForKeys:keys options:0];
            
            //这里包含的元素是 有子文件的忽略父路径结点
            //eg: /A/1/2/ (这个就需要移除)   /A/1/2/sun.txt(保留这个文件即可）
            for (NSURL *url in enumerator) {
                total++;
                NSError *error;
                NSNumber *isDirectory = nil;
                if (![url getResourceValue:&isDirectory forKey:NSURLIsDirectoryKey error:&error]) {
                    // handle error
                }
                
                //是否为文件夹
                if ([isDirectory boolValue]) {
                    //方案1
//                    NSDirectoryEnumerator *dirEnumerator = [self enumeratorPathByFileManager:fileManager atURL:url propertiesForKeys:@[NSURLIsDirectoryKey] options:NSDirectoryEnumerationSkipsSubdirectoryDescendants];
//                    if (dirEnumerator.allObjects.count > 0) {
//                        NSLog(@"文件夹内有文件,忽略此条路径 %@",[url path]);
//                    } else {
//                        [urlDirFiles addObject:[url path]];
//                    }
                    
                    //方案2
                    NSError *error = nil;
                    NSArray *listOfFiles = [fileManager contentsOfDirectoryAtPath:[url path] error:nil];
                    if (listOfFiles != nil && listOfFiles.count == 0) {
                        [urlDirFiles addObject:[url path]];
                    } else if (error == nil){
                        NSLog(@"文件夹内有文件,忽略此条路径 %@",[url path]);
                    } else {
                        NSLog(@"文件遍历该层出错:%@",error);
                    }
                } else {
                    [urlDirFiles addObject:[url path]];
                }
            }
            NSLog(@"所有可上传文件列表:\n%@",urlDirFiles);
        }
        NSTimeInterval nowTime = [[NSDate date] timeIntervalSince1970];
        NSLog(@"\n文件数量:%zd 遍历总数:%zd\n耗时:%.2f 秒",urlDirFiles.count,total,(nowTime - currentTime));
        total = 0;
        
        dispatch_async(dispatch_get_main_queue(), ^{
            NSLog(@"scan end");
        });
    });
}


```



接下来就是最核心的代码块  

```objc
- (NSDirectoryEnumerator *)enumeratorPathByFileManager:(NSFileManager *)fileManager
                                                 atURL:(NSURL *)url
                                     propertiesForKeys:(nullable NSArray<NSString *> *)keys
                                               options:(NSDirectoryEnumerationOptions)mask
{
    NSDirectoryEnumerator *enumerator = [fileManager
                                         enumeratorAtURL:url
                                         includingPropertiesForKeys:keys
                                         options:mask
                                         errorHandler:^(NSURL *url, NSError *error) {
                                             // Handle the error.
                                             // Return YES if the enumeration should continue after the error.
                                             NSLog(@"深度遍历出错%@",error);
                                             return YES;
                                         }];
    return enumerator;
}
			

```

`NSDirectoryEnumerator` 是一个路径枚举迭代器 


> talk is cheap, show me the result.  

下面是我扫描本地`下载`目录的结果
![](/assets/images/20170210DFSAlgorithm/DFS3.webp)

![](/assets/images/20170210DFSAlgorithm/Result.webp)

结果还是比较快的 

单从数据上来讲 比广度优先节省至少7万次Http请求

我怀疑是macOS对系统目录有索引或者缓存 第二次扫码速度比较快

总结
--
总体来看，效果还可以，如果你有更好的算法来解决这种问题 欢迎@我 或者发邮件我也学习一下. 
> [最终DFSdemo](https://github.com/sunyazhou13/DFSDemo)


也可学一下:[Swift Depth First Search](https://www.raywenderlich.com/157949/swift-algorithm-club-depth-first-search)