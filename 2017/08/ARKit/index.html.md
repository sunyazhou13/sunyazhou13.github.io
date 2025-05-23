---
layout: post
title: ARKit
date: 2017-08-30 14:50:43
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
---


# 前言

![](/assets/images/20170830ARKit/ARKitPreview.webp)

本篇会从广泛介绍到详细介绍,也就是从粗粒度向细粒度逐渐过度讲解.
期间有任何问题请大家集思广益,多多指教. 

# 主要内容

* __AR技术介绍__ 
* __ARKit工作原理及流程介绍__ 
* __ARKit简单代码实现__ 
* __ARKit框架所有API介绍__ 
* __ARScnView介绍__ 
* __ARSession介绍__ 
* __ARCamera介绍__ 
* __ARKit捕捉平地__ 
* __AR代码demo实现__ 

## AR技术介绍

#### AR技术简介
* 增强现实技术（Augmented Reality，简称 AR），是一种实时的计算摄影机影像的位置及角度并加上相应图像、视频、3D模型的技术，这种技术的目标是在屏幕上把虚拟世界套在现实世界并进行互动
* AR场景实现技术要素
	1. 多媒体捕捉现实图像：如摄像头
	2. 三维建模:3D立体模型
	3. 传感器追踪:主要追踪现实世界动态物体的六轴变化，这六轴分别是X、Y、Z轴位移及旋转。其中位移三轴决定物体的方位和大小，旋转三轴决定物体显示的区域
	4. 坐标识别及转换：3D模型显示在现实图像中不是单纯的frame坐标点，而是一个三维的矩阵坐标
	5. AR还可以与虚拟物体进行一些交互(optional)  
![](/assets/images/20170830ARKit/ARDirection.webp)



#### ARKit概述及特点
	
* `ARKit` 框架(framework)提供 两种 AR 技术
	* __基于3D 场景(`SceneKit`) 实现的增强现实__
	* __基于2D 场景(`SpriktKit`) 实现的增强现实__  
	
	>  一般主流都是基于3D 实现,`ARkit`兼容 `SceneKit`和 `SpriktKit` (苹果推出游戏引擎)framework 

* 显示AR 效果为什么依赖 __3D引擎`SceneKit`和 2D 引擎`SpriktKit` 苹果的游戏引擎框架? 原因是游戏引擎才可以加载物体模型。__
>  虽然`ARKit`中的视图**(`ARSCNView`)继承自`SCNView`,`SCNView`继承自`UIView`**,
> 但是目前`ARKit `框架本身只包含相机追踪, 不能直接加载物体模型, 所以只能依赖游戏引擎加载 ARKit (我觉得苹果是在充分利用和整合现有资源并推广自己的 framework 一石二鸟) 因为就目前我没有看到 任何`ARKit`支持 `Unity3D`或者 `Cocoas2D`


#### iOS11 如何支持`ARKit`
	
iOS11虽然推出了 `ARKit` 但不是所有 iOS11系统都支持  
  
* 必须 CPU  A9以上(iPhone 6s 以上 还有 iPhone SE)

开发环境
	
* Xcode版本:Xcode9及以上
* 系统: iOS11及以上
* iOS设备：处理器A9及 以上（6S机型及以上)
* macOS系统: 10.12.4及以上
	

#### Xcode 自带创建模板(多数都不用)

![](/assets/images/20170830ARKit/ARKitModel.webp)

demo 演示

``` objc
@interface ViewController () <ARSCNViewDelegate>
//AR视图：展示3D界面
@property (nonatomic, strong) IBOutlet ARSCNView *sceneView;

@end

    
@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    //场景代理
    self.sceneView.delegate = self;
    
    // 显示帧率
    self.sceneView.showsStatistics = YES;
    
    // 创建一个场景
    SCNScene *scene = [SCNScene sceneNamed:@"art.scnassets/ship.scn"];
    
    // Set the scene to the view
    self.sceneView.scene = scene;
}

- (void)viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
    
    // 世界坐标系配置
    ARWorldTrackingSessionConfiguration *configuration = [ARWorldTrackingSessionConfiguration new];
    
    // 运行3D 场景的 会话
    [self.sceneView.session runWithConfiguration:configuration];
}

- (void)viewWillDisappear:(BOOL)animated {
    [super viewWillDisappear:animated];
    
    // 暂停
    [self.sceneView.session pause];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Release any cached data, images, etc that aren't in use.
}

#pragma mark - ARSCNViewDelegate


//给当前锚点创建一个节点 (node 可以理解成 UIView)
/*
// Override to create and configure nodes for anchors added to the view's session.
- (SCNNode *)renderer:(id<SCNSceneRenderer>)renderer nodeForAnchor:(ARAnchor *)anchor {
    SCNNode *node = [SCNNode new];
 
    // Add geometry to the node...
 
    return node;
}
*/

//会话有错误
- (void)session:(ARSession *)session didFailWithError:(NSError *)error {
    // Present an error message to the user
    
}

//被打断  类似音频播放的时候被打断 eg:前后台切换 来电话  siri
- (void)sessionWasInterrupted:(ARSession *)session {
    // Inform the user that the session has been interrupted, for example, by presenting an overlay
    
}

//会话结束
- (void)sessionInterruptionEnded:(ARSession *)session {
    // Reset tracking and/or remove existing anchors if consistent tracking is required
    
}
```

## ARKit工作原理及流程介绍


### 主要内容

![](/assets/images/20170830ARKit/RenderingARKit.webp)

`ARKit` 并不是一个独立运行的框架 必须要配合`SceneKit`,没有`SceneKit` `ARKit`和普通相机没有任何区别
 
>  _难点:3D坐标的矩阵转换_	 (3D X/Y/Z, 4x4坐标) 

下面是一张图 ARKit 的所有.h 头文件 (没有列出派生的子类)

![](/assets/images/20170830ARKit/ARDefines.webp)

* ARKit框架中的核心类
 * __`ARScnView`__
 * __`ARSession`__
 * __`ARCamera`__
 
* `ARKit`demo 示例 实现

  * 捕捉平面 添加物体

* AR虚拟增强现实就是指在相机捕捉到的现实世界图像中显示一个虚拟的3D模型,这个过程可以分为两个步骤
	1. 相机捕捉现实世界图像 (由ARKit 实现)  
	2. 在图像中现实虚拟3D 模型(由SceneKit 实现)

* `ARKit`与`SceneKit`框架关系图

![](/assets/images/20170830ARKit/ARKitUML.webp)

1. `ARSCNView` --> `SCNView`(SceneKit.framework)-->`UIView`(UIKit.framework)
2. ARSCNView视图容器,它管理一个 `ARSession`
3. 在一个完整的虚拟增强现实体验中,`ARKit`只负责把真实世界画面转变为一个3D 场景, 这个过程主要分为两个环节：
	* ARCamera 负责捕捉摄像头画面
	* ARSession 负责搭建3D 场景
4. 在一个完整的虚拟增强现实体验中,将虚拟物体展现在3D场景中是由`SceneKit`框架来完成的 
 
	>  每一个虚拟的物体都是一个节点SCNNode,每一个节点构成了一个场景SCNScene,无数个场景构成了3D世界
	
	> 可以理解UIViewController 的[view addSubview:xxxView];
	
	
### ARKit工作原理

#### ARSCNView与 ARSession关系

说之前先了解一下这个`Session` 和`Context`命名以及含义

`Session` 直译: 会话  
`Context` 直译: 上下文

_在iOS框架中，凡是带session或者context后缀的，这种类一般自己不干活，作用一般都是两个_:

* __管理其他类，帮助他们搭建沟通桥梁，好处就是解耦__ 
* __负责帮助我们管理复杂环境下的内存__

_`Session` 和`Context`不同点_

* session 有硬件参与的(一般与硬件打交道), eg: 摄像头捕捉 `ARSession`、音频 `AVAudioSession`, 网卡相关的`NSURLSession` .... 等等.
* context 一般没有硬件参与的, eg: `CGGraphicContext`、`EAGLContext` 绘图上下文, 以及自定义转场里面的那个 Context 就不详细列举了.


回到正题, 如上所说 我们要想实现一个

`ARSCNView` 与`ARCamera` 之间相互协同配合
(`ARSCNView` 与`ARCamera` 两者之间没有直接关系)

* __ARSCNView -----> ARCamera 或__   
* __ARSCNView <----- ARCamera__

> __ARSCNView里有个 ARFrame(属性 成员变量), ARFrame 里面包含 ARCamera(属性 成员变量)__

就需要一个沟通的桥梁 进行调度配合协作完成 图像捕捉到视觉渲染的过程__这个桥梁 就是 `ARSession`__

![](/assets/images/20170830ARKit/ARKitSession.webp)


如果想运行一个 `ARSession`会话,必须指定一个叫`会话追踪配置`的对象`ARConfiguration`,`ARConfiguration`主要目的负责追踪相机在3D 世界中的位置以及一些特征场景的捕捉,__比如捕捉平面__,这个类 作用很大

* `ARConfiguration`是个父类,为了更好实现增强现实的效果,苹果建议我们使用派生自它的子类`ARWorldTrackingConfiguration `(这个类仅支持`A9`芯片之后的机型). 

注意: _原来是这个`ARWorldTrackingSessionConfiguration`现在被弃用了._


![](/assets/images/20170830ARKit/ARWorldTrackingConfiguration.webp)

#### ARFrame 与 ARWorldTrackingConfiguration

`ARSession` 搭建沟通的桥梁的参与者有两个

1. ARFrame
2. ARWorldTrackingConfiguration

`ARWorldTrackingConfiguration` （3D世界追踪配置) 的作用是跟踪设备的__方向、位置、检测摄像头捕捉到的内容__.

它的内部实现了一系列庞大的算法和调用iPhone 上必要的传感器来检测手机的 __移动、旋转、平移__(六轴位置方向变化) 

当`ARWorldTrackingConfiguration`计算出相机在3D 世界中的位置时,会把这个**位置数据** 交个`ARSession`去管理, 而相机的**位置数据**对应的类就是`ARFrame` 

> `ARSession`类一个属性叫`currentFrame` 就是 ARFrame 的实例变量

`ARCamera`只负责捕捉图像,不参与数据的处理. 它属于3D 场景中的一个环节,
每个3D Scene 都会有一个 Camera, 这个 Camera 决定了我们看到物体的视野.

这三者关系如下:

![](/assets/images/20170830ARKit/RelationshipARFrame.webp)


> `ARFrame`里面有我们需要的`CVPixelBufferRef`(capturedImage) 和 `ARCamera` 也就是我们需要的图像的原始数据

__ARCamera在3D世界的位置__

![](/assets/images/20170830ARKit/Coordinate.webp)


### ARKit 工作流程


![](/assets/images/20170830ARKit/ARWorkflow.webp) 图片来自:[坤小](http://www.jianshu.com/p/0492c7122d2f)

1. `ARSCNView`加载场景`SCNScene`
2. `SCNScene` 启动相机`ARCamera`开始捕捉场景
3. `ARCamera` 捕捉场景后 `ARSCNView`开始将场景数据给`ARSession`
4. `ARSession` 通过`ARConfiguration`(或者它的派生子类) 实现场景的追踪并返回一个`ARFrame`.
5. 给`ARSCNView`的 scene 添加一个子节点(3D物体模型)

> `ARConfiguration` 捕捉相机的位置的目的是__能够在添加的3D 物体模型的时候计算出3D 物体模型相对于相机的真实矩阵位置__

注意:__在3D坐标系统中__
 
 * 世界坐标系 相当于 UIView 的 `Frame`
 * 本地坐标系 相当于 UIView 的 `bounds`

> 坐标系的转换在 ARKit 中是比较难部分 


## ARKit简单代码实现

[代码ARKitDemo1](https://github.com/sunyazhou13/ARDemos/blob/master/ARDemo1.zip)

``` objc
- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event{
    //1. 使用场景加载 scn 文件
    
    SCNScene *scene = [SCNScene sceneNamed:@"Models.scnassets/vase/vase.scn"];
    SCNNode *plantNode = scene.rootNode.childNodes[0];
    
    //2. 调整位置 将节点添加到当前屏幕中
    plantNode.position = SCNVector3Make(0, -1, -1);
    
    
    //3. 将飞机节点添加到当前屏幕
    [self.arSceneView.scene.rootNode addChildNode:plantNode];
    
}
```

这里需要补充一点 

> 我们先抛开`ARSCNView`和 `UIViewController` 以及`UIView`的关系

__我们只说一下`ARSCNView`,`scene`,`node`啥关系__

`ARSCNView` 是个集成自 UIView 的视图

`ARSCNView` 有个属性(成员变量)叫`scene` 这就相当于 VC

`scene`有 `rootNode` 相当于 VC 有`self.view`

__可以把`scene`理解为 VC__  
__把`rootNode`理解为 `self.view`__

我们知道 self.view 可以添加 子 view 通过 

``` objc
[self.view addSubview:xxx];
```

 那么 node 也就有了相应的方法
 
 ``` objc
[scene.rootNode addChildNode:xxxNode];
 ```

> 注意:*__所有的场景有且只有一个根节点，其他所有节点都是根节点的子节点__*


## ARKit框架所有API介绍


![](/assets/images/20170830ARKit/ARDefines.webp)

还是拿上边这张图说一下 这里我们诉求剖析所有 API 从而达到大家都了解 ARKit的内容

#### ARAnchor

`ARAnchor`表示一个物体在3D 空间的位置和方向(ARAnchor 俗称 3D 锚点, 类似 UIKit 框架中 CALayer的 Anchor)

``` objc
@interface ARAnchor : NSObject <NSCopying>

//锚点唯一标识
@property (nonatomic, readonly) NSUUID *identifier;

//锚点的旋转变换矩阵，定义了锚点的旋转、位置、缩放。是一个4x4的矩阵
@property (nonatomic, readonly) matrix_float4x4 transform;

//构造方法,一般我们无需构造。因为添加一个3D物体时ARKit会有代理告知我们物体的锚点
- (instancetype)initWithTransform:(matrix_float4x4)transform;

```

> `ARFrame`表示的也是物体的位置和方向,但是`ARFrame`通常标识的是 AR 相机的**位置**和**方向**以及追踪相机的时间戳,还有捕捉到相机的图片帧(CVPixelBufferRef)

#### ARError

`ARError` 错误描述类, eg: 设备不支持, 常驻后台的会话中断...等


``` objc
FOUNDATION_EXTERN NSString *const ARErrorDomain;

typedef NS_ERROR_ENUM(ARErrorDomain, ARErrorCode) {
    /** Unsupported session configuration. */
    ARErrorCodeUnsupportedConfiguration   = 100,
    
    /** A sensor required to run the session is not available. */
    ARErrorCodeSensorUnavailable          = 101,
    
    /** A sensor failed to provide the required input. */
    ARErrorCodeSensorFailed               = 102,
    
    /** App does not have permission to use the camera. The user may change this in settings. */
    ARErrorCodeCameraUnauthorized         = 103,
    
    /** World tracking has encountered a fatal error. */
    ARErrorCodeWorldTrackingFailed        = 200,
};
```

#### ARFrame

`ARFrame` 主要是追踪当前的状态 eg: 图片帧, 时间戳,位置方向等参数.

``` objc
@interface ARFrame : NSObject <NSCopying>

//时间戳
@property (nonatomic, readonly) NSTimeInterval timestamp;

//图片帧
@property (nonatomic, readonly) CVPixelBufferRef capturedImage;

//相机（表示这个ARFrame是哪一个相机的，iPhone7plus有两个摄像机）
@property (nonatomic, copy, readonly) ARCamera *camera;

//返回当前相机捕捉到的锚点数据（当一个3D虚拟模型加入到ARKit中时，锚点值得就是这个模型在AR中的位置）
@property (nonatomic, copy, readonly) NSArray<ARAnchor *> *anchors;

//灯光 指的是灯光强度 一般是0-2000，系统默认1000
@property (nonatomic, strong, nullable, readonly) ARLightEstimate *lightEstimate;

//特征点（应该是捕捉平地或者人脸的，比较苹果有自带的人脸识别功能） 仅限 world 的追踪配置可用
@property (nonatomic, strong, nullable, readonly) ARPointCloud *rawFeaturePoints;

//根据2D坐标点搜索3D模型，这个方法通常用于，当我们在手机屏幕点击某一个点的时候，可以捕捉到这一个点所在的3D模型的位置，至于为什么是一个数组非常好理解。手机屏幕一个是长方形，这是一个二维空间。而相机捕捉到的是一个由这个二维空间射出去的长方体，我们点击屏幕一个点可以理解为在这个长方体的边缘射出一条线，这一条线上可能会有多个3D物体模型
point：2D坐标点（手机屏幕某一点）
ARHitTestResultType：捕捉类型  点还是面
(NSArray<ARHitTestResult *> *)：追踪结果数组

- (NSArray<ARHitTestResult *> *)hitTest:(CGPoint)point types:(ARHitTestResultType)types;

//相机窗口的的坐标变换（可用于相机横竖屏的旋转适配）
-(CGAffineTransform)displayTransformWithViewportSize:(CGSize)viewportSize orientation:(UIInterfaceOrientation)orientation;

@end
```

这里说一下一个技巧 如果在一个类里面我们不想提供`init:`方法的话 该如何写？

我们都知道`OC`里面所有的`class`都是继承 自`NSObject`,`NSObject`里面有`init:`、`dealloc:`等方法.


``` objc
@interface ARAnchor (Unavailable)

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;
@end
```

> 这里用到的技巧就是 写个 Category 并复写该方法后边标注为`NS_UNAVAILABLE`


#### ARHitTestResult

`ARHitTestResult` 点击回调结果,这个类主要用于AR 技术中 __现实世界与3D 场景中虚拟物体的交互.__ eg:在相机中移动、拖拽3D 虚拟物体,都可以通过这个类来获取 ARKit 所捕捉的结果.

``` objc
typedef NS_OPTIONS(NSUInteger, ARHitTestResultType) {
    //点
    ARHitTestResultTypeFeaturePoint              = (1 << 0),
	//水平面 y为0.    
    ARHitTestResultTypeEstimatedHorizontalPlane  = (1 << 1),
    
    //已结存在的平面
    ARHitTestResultTypeExistingPlane             = (1 << 3),
    
    //已结存在的锚点和平面
    ARHitTestResultTypeExistingPlaneUsingExtent  = (1 << 4),
} NS_SWIFT_NAME(ARHitTestResult.ResultType);

@interface ARHitTestResult : NSObject

//捕捉类型
@property (nonatomic, readonly) ARHitTestResultType type;

//3D虚拟物体与相机的距离（单位：米）
@property (nonatomic, readonly) CGFloat distance;

//本地坐标矩阵（世界坐标指的是相机为场景原点的坐标，而每一个3D物体自身有一个场景，本地坐标就是相对于这个场景的坐标）类似于frame和bounds的区别
@property (nonatomic, readonly) matrix_float4x4 localTransform;

//世界坐标矩阵
@property (nonatomic, readonly) matrix_float4x4 worldTransform;

//锚点（3D虚拟物体，在虚拟世界有一个位置，这个位置参数是SceneKit中的SCNVector3：三维矢量），而锚点anchor是这个物体在AR现实场景中的位置，是一个4x4的矩阵
@property (nonatomic, strong, nullable, readonly) ARAnchor *anchor;

@end
```

这里需要了解一下:

* **matrix_float4x4** __worldTransform__; 世界坐标系 __以相机为场景的原点开始(0,0,0,0)__ 也就是以相机为圆心向外,参照这个原点 3D 物体的位置信息. 这就相当于2D 的 UIView 的 frame (绝对坐标)

* **matrix_float4x4**  __localTransform__; 本地坐标系 以一个 node 为父节点为参照,相当于距离这个父场景的坐标.

* **matrix_float4x4** [4x4 矩阵请参考这里](http://www.opengl-tutorial.org/cn/beginners-tutorials/tutorial-3-matrices/) 

#### ARLightEstimate

`ARLightEstimate`

``` objc
@interface ARLightEstimate : NSObject

//环境灯光强度  范围0-2000 默认1000
@property (nonatomic, readonly) CGFloat ambientIntensity;

//环境光温度
@property (nonatomic, readonly) CGFloat ambientColorTemperature;

@end

```

#### ARPlaneAnchor

`ARPlaneAnchor`派生自`ARAnchor`的子类, 平面锚点.`ARKit`能自动识别平地,并且添加一个锚点到场景中,当然要想看到真实世界中的平地效果需要我们自己使用 `SCNNode`渲染一个锚点.
> 锚点只是一个位置

``` objc
@interface ARPlaneAnchor : ARAnchor

//平地类型，目前只有一个，就是水平面 
@property (nonatomic, readonly) ARPlaneAnchorAlignment alignment;

//3轴矢量结构体，表示平地的中心点  x/y/z
@property (nonatomic, readonly) vector_float3 center;

//3轴矢量结构体，表示平地的大小（宽度和高度）  x/y/z
@property (nonatomic, readonly) vector_float3 extent;

@end
```


#### ARPointCloud

`ARPointCloud` 点状渲染  

``` objc
@interface ARPointCloud : NSObject <NSCopying>

//点数
@property (nonatomic, readonly) NSUInteger count;

//每一个点的位置的集合（结构体带*表示的是结构体数组）
@property (nonatomic, readonly) const vector_float3 *points;

@end
```


#### ARConfiguration

`ARConfiguration` 会话追踪配置

``` objc
//追踪对其方式
typedef NS_ENUM(NSInteger, ARWorldAlignment) {
    /* 相机位置 vector (0, -1, 0) /
    ARWorldAlignmentGravity,
    /* 相机位置及方向. vector (0, -1, 0)    heading ：(0, 0, -1) */
    ARWorldAlignmentGravityAndHeading,
    /* 相机方向. */
    ARWorldAlignmentCamera
} ;

typedef NS_OPTIONS(NSUInteger, ARPlaneDetection) {
    ARPlaneDetectionNone        = 0,
    ARPlaneDetectionHorizontal  = (1 << 0), //探测平面是水平横向
} ;


@interface ARConfiguration : NSObject <NSCopying>

//当前设备是否支持，一般A9芯片以下设备不支持
@property(class, nonatomic, readonly) BOOL isSupported;

//世界坐标的对齐方式 
@property (nonatomic, readwrite) ARWorldAlignment worldAlignment;

//是否需要自适应灯光效果，默认是YES
@property (nonatomic, readwrite, getter=isLightEstimationEnabled) BOOL lightEstimationEnabled;

@end

//世界会话追踪配置，苹果建议我们使用这个类，这个子类只有一个属性，也就是可以帮助我们追踪相机捕捉到的平地
@interface ARWorldTrackingSessionConfiguration : ARConfiguration

//探测的类型
@property (nonatomic, readwrite) ARPlaneDetection planeDetection;

@end
```

> 会话配置的恩子类:ARWorldTrackingSessionConfiguration，它们在同一个API文件中


#### ARSKView

`ARSKView`是2D 的 AR 视图 这个基本就不需要讲了 和 `ARSCNView`一样,就不重复介绍了

#### ARScnView 重点介绍

``` objc
@interface ARSCNView : SCNView

//代理
@property (nonatomic, weak, nullable) id<ARSCNViewDelegate> delegate;

//AR 会话
@property (nonatomic, strong) ARSession *session;

//场景
@property(nonatomic, strong) SCNScene *scene;

//是否自动适应灯光
@property(nonatomic) BOOL automaticallyUpdatesLighting;

//返回对应节点的锚点，节点是一个3D虚拟物体，它的坐标是虚拟场景中的坐标，而锚点ARAnchor是ARKit中现实世界的坐标
- (nullable ARAnchor *)anchorForNode:(SCNNode *)node;

//返回对应锚点的物体
- (nullable SCNNode *)nodeForAnchor:(ARAnchor *)anchor;

/**


 */
- (NSArray<ARHitTestResult *> *)hitTest:(CGPoint)point types:(ARHitTestResultType)types;

@end

```
> 根据2D坐标点搜索3D模型，这个方法通常用于，当我们在手机屏幕点击某一个点的时候，可以捕捉到这一个点所在的3D模型的位置，至于为什么是一个数组非常好理解。手机屏幕一个是长方形，这是一个二维空间。而相机捕捉到的是一个由这个二维空间射出去的长方体，我们点击屏幕一个点可以理解为在这个长方体的边缘射出一条线，这一条线上可能会有多个3D物体模型,point：2D坐标点（手机屏幕某一点）
ARHitTestResultType：捕捉类型  点还是面
(NSArray<ARHitTestResult *> *)：追踪结果数组  详情见本章节ARHitTestResult类介绍
数组的结果排序是由近到远

代理方法

``` objc
//代理的内部实现了SCNSceneRendererDelegate：scenekit代理 和ARSessionObserver：ARSession监听（KVO机制）
#pragma mark - ARSCNViewDelegate
@protocol ARSCNViewDelegate <SCNSceneRendererDelegate, ARSessionObserver>
@optional

//自定义节点的锚点
- (nullable SCNNode *)renderer:(id <SCNSceneRenderer>)renderer nodeForAnchor:(ARAnchor *)anchor;

//当添加节点是会调用，我们可以通过这个代理方法得知我们添加一个虚拟物体到AR场景下的锚点（AR现实世界中的坐标）
- (void)renderer:(id <SCNSceneRenderer>)renderer didAddNode:(SCNNode *)node forAnchor:(ARAnchor *)anchor;

//将要刷新节点
- (void)renderer:(id <SCNSceneRenderer>)renderer willUpdateNode:(SCNNode *)node forAnchor:(ARAnchor *)anchor;

//已经刷新节点
- (void)renderer:(id <SCNSceneRenderer>)renderer didUpdateNode:(SCNNode *)node forAnchor:(ARAnchor *)anchor;

//移除节点
- (void)renderer:(id <SCNSceneRenderer>)renderer didRemoveNode:(SCNNode *)node forAnchor:(ARAnchor *)anchor;

@end
```

#### ARSesson 重点介绍

![](/assets/images/20170830ARKit/SessionBridge.webp)

`ARSesson` 是一个连接底层与 AR 视图之间的桥梁, `ARSCNView`里的所有方法都是又`ARSession`提供的


__`ARSesson`获取相机位置数据主要由两种方式__

* push 通过实现 Session 的代理`session:didUpdateFrame:`告知用户
* pull 用户想要可主动去取 `ARSession`的`currentFrame`属性

``` objc
@interface ARSession : NSObject

//代理
@property (nonatomic, weak) id <ARSessionDelegate> delegate;

//指定代理执行的线程（主线程不会有延迟，子线程会有延迟），不指定的话默认主线程
@property (nonatomic, strong, nullable) dispatch_queue_t delegateQueue;

//相机当前的位置（是由会话追踪配置计算出来的）
@property (nonatomic, copy, nullable, readonly) ARFrame *currentFrame;

//会话配置
@property (nonatomic, copy, nullable, readonly) ARConfiguration *configuration;

//运行会话（这行代码就是开启AR的关键所在）
- (void)runWithConfiguration:(ARConfiguration *)configuration NS_SWIFT_UNAVAILABLE("Use run(_:options:) instead");

//运行会话，只是多了一个参数ARSessionRunOptions：作用就是会话断开重连时的行为。
- (void)runWithConfiguration:(ARConfiguration *)configuration options:(ARSessionRunOptions)options NS_SWIFT_NAME(run(_:options:));

//暂停会话
- (void)pause;

//添加锚点
- (void)addAnchor:(ARAnchor *)anchor NS_SWIFT_NAME(add(anchor:));

//移除锚点
- (void)removeAnchor:(ARAnchor *)anchor NS_SWIFT_NAME(remove(anchor:));

@end

```

> 运行会话__runWithConfiguration:options:__ options 是个`ARSessionRunOptions`枚举  
> 这个方法的作用就是会话断开重连时的行为

``` objc
typedef NS_OPTIONS(NSUInteger, ARSessionRunOptions) {
	 //表示重置追踪
    ARSessionRunOptionResetTracking           = (1 << 0),
    
    //移除现有锚点
    ARSessionRunOptionRemoveExistingAnchors   = (1 << 1)
};
```

下面来看下`ARSession`的代理

`ARSession` 分 两种

* KVO 观察者 ARSessionObserver
* delegate 委托代理 ARSessionDelegate

> 看到这我也很奇怪这个玩法 

ARSessionObserver如下

``` objc
@protocol ARSessionObserver <NSObject>

@optional

//session 失败
- (void)session:(ARSession *)session didFailWithError:(NSError *)error;

//相机追踪状态发生改变
- (void)session:(ARSession *)session cameraDidChangeTrackingState:(ARCamera *)camera;

//session 意外断开（如果开启ARSession之后，APP退到后台就有可能导致会话断开）
- (void)sessionWasInterrupted:(ARSession *)session;

//session 会话断开后 恢复(短时间退到后台再进入APP会自动恢复）
- (void)sessionInterruptionEnded:(ARSession *)session;

//session 已经输出了一个 音频数据 `CMSampleBufferRef` 
- (void)session:(ARSession *)session didOutputAudioSampleBuffer:(CMSampleBufferRef)audioSampleBuffer;

@end
```

ARSessionDelegate 如下

``` objc
相机位置发生改变 就是相机的位置有变动
- (void)session:(ARSession *)session didUpdateFrame:(ARFrame *)frame;

// 已添加锚点
- (void)session:(ARSession *)session didAddAnchors:(NSArray<ARAnchor*>*)anchors;

//刷新锚点
- (void)session:(ARSession *)session didUpdateAnchors:(NSArray<ARAnchor*>*)anchors;

//移除锚点
- (void)session:(ARSession *)session didRemoveAnchors:(NSArray<ARAnchor*>*)anchors;

@end
```

以上是 `ARSession`

#### ARCamera 重点介绍

`ARCamera`是个相机, 它是链接虚拟场景和现实场景的之间的枢纽. 

在`ARKit`中,它是捕捉现实图像的相机,在 SceneKit 中它是3D 虚拟世界中的相机

> 游戏里一般第一人称3D 游戏, 英雄就是一个3D 相机, 我们电脑屏幕看到的画面就是这个相机捕捉到的画面

一般情况下我们不需要自己去创建一个`ARCamera`实例, 因为每次初始化一个 `ARSCNView`的时候,它会默认为我们创建一个`ARCamera`实例,而且这个相机就是摄像头的位置,同时也是3D 世界中的原点所在 __(0,0,0)__ 

至于`ARCamera` 的 api 一般我们也不用 care,`ARKit`默认会配置好.

``` objc
@interface ARCamera : NSObject <NSCopying>

//4x4矩阵表示相机位置 跟锚点类似
@property (nonatomic, readonly) matrix_float4x4 transform;

//相机方向（旋转）的矢量欧拉角 分别是x/y/z
@property (nonatomic, readonly) vector_float3 eulerAngles;

//相机追踪状态（在下方会有枚举值介绍）
@property (nonatomic, readonly) ARTrackingState trackingState NS_REFINED_FOR_SWIFT;

//追踪运动类型
@property (nonatomic, readonly) ARTrackingStateReason trackingStateReason NS_REFINED_FOR_SWIFT;

//相机曲率 3x3矩阵  
@property (nonatomic, readonly) matrix_float3x3 intrinsics;

//摄像头分辨率
@property (nonatomic, readonly) CGSize imageResolution;

//投影矩阵
@property (nonatomic, readonly) matrix_float4x4 projectionMatrix;


//创建相机 使用x,y,z 位置 
- (CGPoint)projectPoint:(vector_float3)point orientation:(UIInterfaceOrientation)orientation viewportSize:(CGSize)viewportSize;
 
//创建相机投影矩阵 近面距离  远面距离
- (matrix_float4x4)projectionMatrixForOrientation:(UIInterfaceOrientation)orientation viewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;

//创建相机投影矩阵
- (matrix_float4x4)viewMatrixForOrientation:(UIInterfaceOrientation)orientation;

@end
```

> 上边提到的远面和近面距离 ![](/assets/images/20170830ARKit/distance.webp)  可以参考这张图 摘自[投影变换](http://www.jianshu.com/p/bc151ff65cef)
> ![](/assets/images/20170830ARKit/distance2.webp)
>  这属于 OpenGL的学习范畴.有兴趣可以学习一下

``` objc
//相机追踪状态枚举
typedef NS_ENUM(NSInteger, ARTrackingState) {
	 /* 不被允许 */
    ARTrackingStateNotAvailable,
    
    /* 最小 */
    ARTrackingStateLimited,
    
    /* 正常. */
    ARTrackingStateNormal,
};

//追踪运动类型
typedef NS_ENUM(NSInteger, ARTrackingStateReason) {
    /* 无. */
    ARTrackingStateReasonNone,
    
    //初始化
    ARTrackingStateReasonInitializing,
    
    /* 运动. */
    ARTrackingStateReasonExcessiveMotion,
    
    /** 脸部捕捉. */
    ARTrackingStateReasonInsufficientFeatures,
}
```

> 这里面涉及到的 一个叫做`eulerAngles`[欧拉角](https://zh.wikipedia.org/wiki/%E6%AC%A7%E6%8B%89%E8%A7%92) 
> ![](/assets/images/20170830ARKit/EulerAngles.webp)
> 这个欧拉角是解决3D物体的 旋转矩阵 等取向问题, 就有有一个平面 是静止不动的 一个平面是动的 根据圆心距离两个平面相交的 角度或者 sin cos 来解决一些夹角标记、旋转矩阵等问题 具体可以参考维基百科的解释 (我研究了一阵 还是云里雾里 见笑见笑) 


#### ARKit捕捉平地

![](/assets/images/20170830ARKit/PlaneDetective.gif)

[探测平地demo](https://github.com/sunyazhou13/ARDemos/blob/master/ARDemoPlaneDetective.zip)

贴一下核心代码

添加节点时候调用（当开启平地捕捉模式之后，如果捕捉到平地，ARKit会自动添加一个平地节点）

``` objc
#pragma mark -
#pragma mark - ARSCNViewDelegate 代理

- (void)renderer:(id <SCNSceneRenderer>)renderer didAddNode:(SCNNode *)node forAnchor:(ARAnchor *)anchor{
    if ([anchor isMemberOfClass:[ARPlaneAnchor class]]) {
        NSLog(@"捕捉到平地");
        //添加一个3D 平面模型,ARKit 只有捕捉能力,锚点是一个空间位置,要想更加清楚的看到这个空间,我们需要给空间添加一个平地的3D模型来渲染他
        //1. 获取扑捉到的平地锚点
        ARPlaneAnchor *planeAnchor = (ARPlaneAnchor *)anchor;
        //2. 创建一个3D物体模型 (系统捕捉到的平地是一个不规则大小的长方形，这里我们将其变成一个长方形，并且对平地做一次缩放）
        //创建长方形  参数:长,宽,高,圆角
        SCNBox *plane = [SCNBox boxWithWidth:planeAnchor.extent.x * 0.3 height:0 length:planeAnchor.extent.x * 0.3 chamferRadius:0];
        //3. 使用Material渲染3D模型 默认模型是白色的
        plane.firstMaterial.diffuse.contents = [UIColor cyanColor];
        
        //4. 创建一个基于3D 物体模型的节点
        SCNNode *planeNode = [SCNNode nodeWithGeometry:plane];
        //5. 设置节点的位置为捕捉到的平地的锚点和中心位置 SceneKit框架中节点的位置position是一个基于3D坐标系的矢量坐标SCNVector3Make
        planeNode.position = SCNVector3Make(planeAnchor.center.x, 0, planeAnchor.center.z);
        
        [node addChildNode:planeNode];
        
        //6. 当捕捉到平地时，2s之后开始在平地上添加一个3D模型
        
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            //1.创建一个花瓶场景
            SCNScene *scene = [SCNScene sceneNamed:@"Models.scnassets/vase/vase.scn"];
            //2.获取花瓶节点（一个场景会有多个节点，此处我们只写，花瓶节点则默认是场景子节点的第一个）
            //所有的场景有且只有一个根节点，其他所有节点都是根节点的子节点
            SCNNode *vaseNode = scene.rootNode.childNodes[0];
            
            //4.设置花瓶节点的位置为捕捉到的平地的位置，如果不设置，则默认为原点位置，也就是相机位置
            vaseNode.position = SCNVector3Make(planeAnchor.center.x, 0, planeAnchor.center.z);
            
            //5.将花瓶节点添加到当前屏幕中
            //!!!此处一定要注意：花瓶节点是添加到代理捕捉到的节点中，而不是AR试图的根节点。因为捕捉到的平地锚点是一个本地坐标系，而不是世界坐标系
            [node addChildNode:vaseNode];
        });
    }
}

```

#### AR代码demo实现



[所有相关的 demos 仓库](https://github.com/sunyazhou13/ARDemos)


参考文献 

[Using ARKit with Metal](http://metalkit.org/2017/07/29/using-arkit-with-metal.html)  

[坤小1~10篇](http://www.jianshu.com/p/c97b230fa391)
