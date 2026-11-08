---
layout: post
title: ARKit
date: 2017-08-30 14:50:43
categories: [iOS]
tags: [iOS, macOS, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---


# Preface

![AR Kit Preview](/assets/images/20170830ARKit/ARKitPreview.avif)

This article starts with a broad introduction and gradually narrows down to detailed specifics — in other words, it moves from coarse-grained to fine-grained. If you have any questions along the way, let's pool our wisdom and I'd appreciate your corrections.

# Main Content

* __Introduction to AR Technology__
* __How ARKit Works and Its Workflow__
* __Simple ARKit Code Implementation__
* __Overview of All ARKit Framework APIs__
* __ARSCNView Introduction__
* __ARSession Introduction__
* __ARCamera Introduction__
* __Capturing Planes with ARKit__
* __AR Code Demo Implementation__

## Introduction to AR Technology

#### AR Technology at a Glance
* Augmented Reality (AR) is a technology that computes the position and angle of a camera's image in real time and overlays corresponding images, videos, and 3D models. The goal of this technology is to superimpose the virtual world onto the real world on the screen and enable interaction.
* The technical elements needed to implement an AR scene:
	1. Multimedia capture of real-world images: e.g., a camera
	2. 3D modeling: three-dimensional models
	3. Sensor tracking: mainly tracks the six-axis changes of moving objects in the real world. The six axes are X, Y, and Z displacement and rotation. The three displacement axes determine an object's orientation and size, while the three rotation axes determine the region in which the object is displayed.
	4. Coordinate recognition and transformation: a 3D model isn't displayed in the real-world image as a plain frame coordinate point, but as a three-dimensional matrix coordinate.
	5. AR can also support some interaction with virtual objects (optional)
![AR Direction](/assets/images/20170830ARKit/ARDirection.avif)



#### ARKit Overview and Features
	
* The `ARKit` framework provides two AR technologies:
	* __Augmented reality based on 3D scenes (`SceneKit`)__
	* __Augmented reality based on 2D scenes (`SpriktKit`)__  
	
	>  Generally, the mainstream approach is 3D-based. `ARkit` is compatible with the `SceneKit` and `SpriktKit` frameworks (Apple's game engines).

* Why does displaying AR effects depend on __Apple's game engine frameworks — the 3D engine `SceneKit` and the 2D engine `SpriktKit`? Because only a game engine can load object models.__
>  Although the view in `ARKit` (**`ARSCNView`**) inherits from `SCNView`, and `SCNView` inherits from `UIView`,
> the `ARKit` framework itself currently only contains camera tracking and cannot directly load object models, so it has to rely on a game engine to load ARKit content. (I think Apple is fully leveraging and consolidating its existing resources while promoting its own frameworks — killing two birds with one stone.) Also, so far I haven't seen any `ARKit` support for `Unity3D` or `Cocoas2D`.


#### How iOS 11 Supports `ARKit`
	
Although iOS 11 introduced `ARKit`, not all iOS 11 systems support it.  
  
* Requires CPU A9 or later (iPhone 6s and later, plus iPhone SE)

Development environment
	
* Xcode version: Xcode 9 or later
* System: iOS 11 or later
* iOS device: A9 processor or later (iPhone 6s and later)
* macOS: 10.12.4 or later
	

#### Xcode's Built-in Template (Mostly Unused)

![AR Kit Model](/assets/images/20170830ARKit/ARKitModel.avif)

Demo

``` objc
@interface ViewController () <ARSCNViewDelegate>
//AR view: displays the 3D interface
@property (nonatomic, strong) IBOutlet ARSCNView *sceneView;

@end

    
@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    //Scene delegate
    self.sceneView.delegate = self;
    
    // Display frame rate
    self.sceneView.showsStatistics = YES;
    
    // Create a scene
    SCNScene *scene = [SCNScene sceneNamed:@"art.scnassets/ship.scn"];
    
    // Set the scene to the view
    self.sceneView.scene = scene;
}

- (void)viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
    
    // World coordinate system configuration
    ARWorldTrackingSessionConfiguration *configuration = [ARWorldTrackingSessionConfiguration new];
    
    // Run the 3D scene session
    [self.sceneView.session runWithConfiguration:configuration];
}

- (void)viewWillDisappear:(BOOL)animated {
    [super viewWillDisappear:animated];
    
    // Pause
    [self.sceneView.session pause];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Release any cached data, images, etc that aren't in use.
}

#pragma mark - ARSCNViewDelegate


// Create a node for the current anchor (think of a node as a UIView)
/*
// Override to create and configure nodes for anchors added to the view's session.
- (SCNNode *)renderer:(id<SCNSceneRenderer>)renderer nodeForAnchor:(ARAnchor *)anchor {
    SCNNode *node = [SCNNode new];
 
    // Add geometry to the node...
 
    return node;
}
*/

//Session error
- (void)session:(ARSession *)session didFailWithError:(NSError *)error {
    // Present an error message to the user
    
}

//Interrupted, similar to audio playback being interrupted, e.g., foreground/background switching, phone calls, Siri
- (void)sessionWasInterrupted:(ARSession *)session {
    // Inform the user that the session has been interrupted, for example, by presenting an overlay
    
}

//Session ended
- (void)sessionInterruptionEnded:(ARSession *)session {
    // Reset tracking and/or remove existing anchors if consistent tracking is required
    
}
```

## How ARKit Works and Its Workflow


### Main Content

![Rendering AR Kit](/assets/images/20170830ARKit/RenderingARKit.avif)

`ARKit` is not a framework that runs standalone; it must work together with `SceneKit`. Without `SceneKit`, `ARKit` is no different from an ordinary camera.
 
>  _The tricky part: the matrix transformation of 3D coordinates_ (3D X/Y/Z, 4x4 coordinates)

Below is a diagram of all of ARKit's .h header files (derived subclasses not listed).

![AR Defines](/assets/images/20170830ARKit/ARDefines.avif)

* Core classes in the ARKit framework:
 * __`ARScnView`__
 * __`ARSession`__
 * __`ARCamera`__
 
* `ARKit` demo example implementation:

  * Detect planes and add objects

* AR — augmented reality — means displaying a virtual 3D model in the real-world image captured by the camera. This process can be divided into two steps:
	1. The camera captures the real-world image (implemented by ARKit)  
	2. Display the virtual 3D model in the image (implemented by SceneKit)

* The relationship between the `ARKit` and `SceneKit` frameworks

![AR Kit UML](/assets/images/20170830ARKit/ARKitUML.avif)

1. `ARSCNView` --> `SCNView`(SceneKit.framework)-->`UIView`(UIKit.framework)
2. ARSCNView is a view container that manages an `ARSession`.
3. In a complete AR experience, `ARKit` is only responsible for transforming the real-world view into a 3D scene. This process mainly consists of two stages:
	* ARCamera is responsible for capturing the camera's view.
	* ARSession is responsible for building the 3D scene.
4. In a complete AR experience, displaying virtual objects in the 3D scene is done by the `SceneKit` framework.
 
	>  Every virtual object is a node (SCNNode), every node makes up a scene (SCNScene), and countless scenes form the 3D world.
	
	>  Think of it as UIViewController's `[view addSubview:xxxView];`
	
	
### How ARKit Works

#### The Relationship Between ARSCNView and ARSession

Before that, let's first understand the naming and meaning of `Session` and `Context`.

`Session`, literally translated: session  
`Context`, literally translated: context

_In the iOS frameworks, classes with a session or context suffix generally don't do the work themselves. Their role is usually twofold_:

* __Managing other classes and helping them build communication bridges — the benefit is decoupling__
* __Taking charge of helping us manage memory in complex environments__

_The difference between `Session` and `Context`_

* A session involves hardware (generally dealing with hardware), e.g., camera capture `ARSession`, audio `AVAudioSession`, network-related `NSURLSession`, etc.
* A context generally doesn't involve hardware, e.g., `CGGraphicContext`, `EAGLContext` drawing contexts, and the Context in custom transitions — not going to enumerate them all.


Back to the main topic. As mentioned above, to make

`ARSCNView` and `ARCamera` work together in coordination
(`ARSCNView` and `ARCamera` have no direct relationship with each other)

* __ARSCNView -----> ARCamera or__   
* __ARSCNView <----- ARCamera__

> __`ARSCNView` has an `ARFrame` (a property/member variable), and `ARFrame` contains `ARCamera` (a property/member variable)__

we need a communication bridge to schedule and coordinate the process from image capture to visual rendering. __This bridge is `ARSession`.__

![AR Kit Session](/assets/images/20170830ARKit/ARKitSession.avif)


To run an `ARSession`, you must specify a "session tracking configuration" object, `ARConfiguration`. `ARConfiguration`'s main purpose is to track the camera's position in the 3D world and capture feature scenes — __such as detecting planes__. This class plays a big role.

* `ARConfiguration` is a parent class. To achieve better AR effects, Apple recommends using its subclass `ARWorldTrackingConfiguration` (this class only supports devices with the `A9` chip or later).

Note: _The former `ARWorldTrackingSessionConfiguration` is now deprecated._


![AR World Tracking Configuration](/assets/images/20170830ARKit/ARWorldTrackingConfiguration.avif)

#### ARFrame and ARWorldTrackingConfiguration

There are two participants in the bridge `ARSession` builds:

1. ARFrame
2. ARWorldTrackingConfiguration

`ARWorldTrackingConfiguration` (3D world tracking configuration) is responsible for tracking the device's __orientation, position, and detecting what the camera captures__.

Internally, it implements a large set of algorithms and invokes the necessary sensors on the iPhone to detect the phone's __movement, rotation, and translation__ (six-axis position/orientation changes).

When `ARWorldTrackingConfiguration` computes the camera's position in the 3D world, it hands this **position data** to `ARSession` for management. The class corresponding to the camera's **position data** is `ARFrame`.

> `ARSession` has a property called `currentFrame`, which is an instance of `ARFrame`.

`ARCamera` is only responsible for capturing images; it doesn't participate in data processing. It's one part of the 3D scene. Every 3D Scene has a Camera, and this Camera determines the field of view in which we see objects.

Here's the relationship among the three:

![Relationship AR Frame](/assets/images/20170830ARKit/RelationshipARFrame.avif)


> `ARFrame` contains the `CVPixelBufferRef` (capturedImage) and `ARCamera` we need — that is, the raw data of the image we need.

__ARCamera's position in the 3D world__

![Coordinate](/assets/images/20170830ARKit/Coordinate.avif)


### ARKit Workflow


![AR Workflow](/assets/images/20170830ARKit/ARWorkflow.avif) Image source: [坤小](http://www.jianshu.com/p/0492c7122d2f)

1. `ARSCNView` loads the scene `SCNScene`.
2. `SCNScene` starts the camera `ARCamera`, which begins capturing the scene.
3. After `ARCamera` captures the scene, `ARSCNView` starts passing the scene data to `ARSession`.
4. `ARSession` tracks the scene via `ARConfiguration` (or its subclass) and returns an `ARFrame`.
5. Add a child node (3D object model) to the `ARSCNView`'s scene.

> `ARConfiguration` tracks the camera's position for the purpose of __computing the 3D object model's real matrix position relative to the camera when adding the 3D object model__.

Note: __In the 3D coordinate system__:
 
 * The world coordinate system corresponds to a UIView's `Frame`.
 * The local coordinate system corresponds to a UIView's `bounds`.

> Coordinate system transformation is one of the harder parts of ARKit.


## Simple ARKit Code Implementation

[Code ARKitDemo1](https://github.com/sunyazhou13/ARDemos/blob/master/ARDemo1.zip)

``` objc
- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event{
    //1. Use the scene to load the scn file
    
    SCNScene *scene = [SCNScene sceneNamed:@"Models.scnassets/vase/vase.scn"];
    SCNNode *plantNode = scene.rootNode.childNodes[0];
    
    //2. Adjust the position and add the node to the current screen
    plantNode.position = SCNVector3Make(0, -1, -1);
    
    
    //3. Add the airplane node to the current screen
    [self.arSceneView.scene.rootNode addChildNode:plantNode];
    
}
```

One more thing to add here:

> Let's set aside the relationships among `ARSCNView`, `UIViewController`, and `UIView` for now.

__Let's only talk about the relationships among `ARSCNView`, `scene`, and `node`__.

`ARSCNView` is a view that inherits from UIView.

`ARSCNView` has a property (member variable) called `scene`, which is like the VC.

`scene` has `rootNode`, just as a VC has `self.view`.

__Think of `scene` as the VC.__  
__Think of `rootNode` as `self.view`.__

We know that self.view can add subviews via:

``` objc
[self.view addSubview:xxx];
```

So node has the corresponding method:

 ``` objc
[scene.rootNode addChildNode:xxxNode];
 ```

> Note: *__Every scene has one and only one root node; all other nodes are children of the root node.__*


## Overview of All ARKit Framework APIs


![AR Defines](/assets/images/20170830ARKit/ARDefines.avif)

Let's use the same diagram above. Here we aim to dissect all the APIs so everyone understands what ARKit contains.

#### ARAnchor

`ARAnchor` represents an object's position and orientation in 3D space. (ARAnchor is commonly known as a 3D anchor, similar to CALayer's Anchor in the UIKit framework.)

``` objc
@interface ARAnchor : NSObject <NSCopying>

//Unique identifier of the anchor
@property (nonatomic, readonly) NSUUID *identifier;

//The anchor's rotation/transform matrix, defining the anchor's rotation, position, and scale. A 4x4 matrix.
@property (nonatomic, readonly) matrix_float4x4 transform;

//Initializer — generally we don't need to call it. When adding a 3D object, ARKit notifies us of the object's anchor via its delegate
- (instancetype)initWithTransform:(matrix_float4x4)transform;

```

> `ARFrame` also represents an object's position and orientation, but `ARFrame` typically denotes the AR camera's **position** and **orientation**, the timestamp of camera tracking, and the captured camera image frame (CVPixelBufferRef).

#### ARError

`ARError` is an error description class, e.g., unsupported device, session interruption when running in the background, etc.


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

`ARFrame` mainly tracks the current state, e.g., image frame, timestamp, position, orientation, and other parameters.

``` objc
@interface ARFrame : NSObject <NSCopying>

//Timestamp
@property (nonatomic, readonly) NSTimeInterval timestamp;

//Image frame
@property (nonatomic, readonly) CVPixelBufferRef capturedImage;

//Camera (indicates which camera this ARFrame belongs to — the iPhone 7 Plus has two cameras)
@property (nonatomic, copy, readonly) ARCamera *camera;

//Returns the anchor data captured by the current camera (when a 3D virtual model is added to ARKit, the anchor is the model's position in AR)
@property (nonatomic, copy, readonly) NSArray<ARAnchor *> *anchors;

//Lighting, referring to light intensity, generally 0–2000, default 1000
@property (nonatomic, strong, nullable, readonly) ARLightEstimate *lightEstimate;

//Feature points (should be for detecting planes or faces — Apple has built-in face recognition). Only available with world tracking configuration
@property (nonatomic, strong, nullable, readonly) ARPointCloud *rawFeaturePoints;

//Searches for a 3D model based on a 2D coordinate point. This method is typically used when we tap a point on the phone screen to capture the 3D model at that point. Why does it return an array? Easy to understand: the phone screen is a rectangle — a 2D space — while the camera captures a rectangular frustum projected outward from this 2D space. Tapping a point on the screen is like shooting a ray from the edge of this frustum, and there may be multiple 3D object models along that ray.
point：2D坐标点（手机屏幕某一点）
ARHitTestResultType：捕捉类型  点还是面
(NSArray<ARHitTestResult *> *)：追踪结果数组

- (NSArray<ARHitTestResult *> *)hitTest:(CGPoint)point types:(ARHitTestResultType)types;

//Coordinate transform of the camera's window (can be used to adapt to camera rotation in portrait/landscape)
-(CGAffineTransform)displayTransformWithViewportSize:(CGSize)viewportSize orientation:(UIInterfaceOrientation)orientation;

@end
```

Here's a tip: how do you write a class if you don't want to provide an `init:` method?

We all know that every `class` in Objective-C inherits from `NSObject`, and `NSObject` has methods like `init:` and `dealloc:`.


``` objc
@interface ARAnchor (Unavailable)

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;
@end
```

> The trick used here is to write a Category, override the method, and mark it with `NS_UNAVAILABLE`.


#### ARHitTestResult

`ARHitTestResult` is the result of a tap callback. This class is mainly used for __interaction between the real world and virtual objects in the 3D scene__ in AR technology. For example, moving or dragging 3D virtual objects in the camera — you can use this class to get the results captured by ARKit.

``` objc
typedef NS_OPTIONS(NSUInteger, ARHitTestResultType) {
    //Point
    ARHitTestResultTypeFeaturePoint              = (1 << 0),
	//Horizontal plane, y is 0.    
    ARHitTestResultTypeEstimatedHorizontalPlane  = (1 << 1),
    
    //Existing plane
    ARHitTestResultTypeExistingPlane             = (1 << 3),
    
    //Existing anchor and plane
    ARHitTestResultTypeExistingPlaneUsingExtent  = (1 << 4),
} NS_SWIFT_NAME(ARHitTestResult.ResultType);

@interface ARHitTestResult : NSObject

//Capture type
@property (nonatomic, readonly) ARHitTestResultType type;

//Distance between the 3D virtual object and the camera (in meters)
@property (nonatomic, readonly) CGFloat distance;

//Local coordinate matrix (world coordinates are relative to the camera as the scene origin, while each 3D object has its own scene, and local coordinates are relative to that scene). Similar to the difference between frame and bounds
@property (nonatomic, readonly) matrix_float4x4 localTransform;

//World coordinate matrix
@property (nonatomic, readonly) matrix_float4x4 worldTransform;

//Anchor (a 3D virtual object has a position in the virtual world, given by SCNVector3: a 3D vector in SceneKit), while the anchor is the object's position in the AR real scene — a 4x4 matrix
@property (nonatomic, strong, nullable, readonly) ARAnchor *anchor;

@end
```

Here's what you need to understand:

* **matrix_float4x4** __worldTransform__: the world coordinate system, __with the camera as the scene's origin (0,0,0,0)__ — i.e., radiating outward from the camera as the center, the 3D object's position is referenced to this origin. This is equivalent to a 2D UIView's frame (absolute coordinates).

* **matrix_float4x4** __localTransform__: the local coordinate system, referenced to a node as the parent, equivalent to the coordinates relative to this parent scene.

* **matrix_float4x4**: [For the 4x4 matrix, see here](http://www.opengl-tutorial.org/cn/beginners-tutorials/tutorial-3-matrices/)

#### ARLightEstimate

`ARLightEstimate`

``` objc
@interface ARLightEstimate : NSObject

//Ambient light intensity, range 0–2000, default 1000
@property (nonatomic, readonly) CGFloat ambientIntensity;

//Ambient color temperature
@property (nonatomic, readonly) CGFloat ambientColorTemperature;

@end

```

#### ARPlaneAnchor

`ARPlaneAnchor` is a subclass derived from `ARAnchor` — a plane anchor. `ARKit` can automatically recognize flat surfaces and add an anchor to the scene. Of course, to actually see the plane effect in the real world, we need to render an anchor ourselves using `SCNNode`.

> An anchor is just a position.

``` objc
@interface ARPlaneAnchor : ARAnchor

//Plane type — currently only one: the horizontal plane 
@property (nonatomic, readonly) ARPlaneAnchorAlignment alignment;

//3-axis vector struct, the center point of the plane  x/y/z
@property (nonatomic, readonly) vector_float3 center;

//3-axis vector struct, the size of the plane (width and height)  x/y/z
@property (nonatomic, readonly) vector_float3 extent;

@end
```


#### ARPointCloud

`ARPointCloud` is point-cloud rendering.

``` objc
@interface ARPointCloud : NSObject <NSCopying>

//Point count
@property (nonatomic, readonly) NSUInteger count;

//The collection of each point's position (a struct with * means an array of structs)
@property (nonatomic, readonly) const vector_float3 *points;

@end
```


#### ARConfiguration

`ARConfiguration` is the session tracking configuration.

``` objc
//Tracking alignment
typedef NS_ENUM(NSInteger, ARWorldAlignment) {
    /* Camera position vector (0, -1, 0) /
    ARWorldAlignmentGravity,
    /* Camera position and orientation. vector (0, -1, 0)    heading: (0, 0, -1) */
    ARWorldAlignmentGravityAndHeading,
    /* Camera orientation. */
    ARWorldAlignmentCamera
} ;

typedef NS_OPTIONS(NSUInteger, ARPlaneDetection) {
    ARPlaneDetectionNone        = 0,
    ARPlaneDetectionHorizontal  = (1 << 0), //探测平面是水平横向
} ;


@interface ARConfiguration : NSObject <NSCopying>

//Whether the current device supports it — generally devices below the A9 chip don't
@property(class, nonatomic, readonly) BOOL isSupported;

//World coordinate alignment 
@property (nonatomic, readwrite) ARWorldAlignment worldAlignment;

//Whether to enable adaptive lighting, default is YES
@property (nonatomic, readwrite, getter=isLightEstimationEnabled) BOOL lightEstimationEnabled;

@end

//World session tracking configuration. Apple recommends using this class. It has only one property, which helps us track planes captured by the camera
@interface ARWorldTrackingSessionConfiguration : ARConfiguration

//Detection type
@property (nonatomic, readwrite) ARPlaneDetection planeDetection;

@end
```

> The configuration's subclass: ARWorldTrackingSessionConfiguration, in the same API file.


#### ARSKView

`ARSKView` is the 2D AR view. This basically doesn't need much explanation — it's the same as `ARSCNView`, so I won't repeat the introduction.

#### ARSCNView — Key Introduction

``` objc
@interface ARSCNView : SCNView

//Delegate
@property (nonatomic, weak, nullable) id<ARSCNViewDelegate> delegate;

//AR session
@property (nonatomic, strong) ARSession *session;

//Scene
@property(nonatomic, strong) SCNScene *scene;

//Whether to automatically adapt lighting
@property(nonatomic) BOOL automaticallyUpdatesLighting;

//Returns the anchor for the corresponding node. A node is a 3D virtual object whose coordinates are in the virtual scene, while the ARAnchor is the real-world coordinate in ARKit
- (nullable ARAnchor *)anchorForNode:(SCNNode *)node;

//Returns the node for the corresponding anchor
- (nullable SCNNode *)nodeForAnchor:(ARAnchor *)anchor;

/**


 */
- (NSArray<ARHitTestResult *> *)hitTest:(CGPoint)point types:(ARHitTestResultType)types;

@end

```
> Searching for 3D models based on 2D coordinate points. This method is typically used when we tap a point on the phone screen and want to capture the 3D model at that point. Why does it return an array? Easy to understand: the phone screen is a rectangle — a two-dimensional space — while the camera captures a rectangular frustum projected outward from this 2D space. Tapping a point on the screen can be understood as shooting a ray from the edge of this frustum, and there may be multiple 3D object models along that ray. point: the 2D coordinate point (a point on the phone screen).
ARHitTestResultType: the capture type — point or plane.
(NSArray<ARHitTestResult *> *): the array of tracking results — see the ARHitTestResult class introduction in this chapter.
The results in the array are sorted from near to far.

Delegate methods

``` objc
//The delegate internally implements SCNSceneRendererDelegate (the SceneKit delegate) and ARSessionObserver (ARSession observation, KVO mechanism)
#pragma mark - ARSCNViewDelegate
@protocol ARSCNViewDelegate <SCNSceneRendererDelegate, ARSessionObserver>
@optional

//The anchor for a custom node
- (nullable SCNNode *)renderer:(id <SCNSceneRenderer>)renderer nodeForAnchor:(ARAnchor *)anchor;

//Called when a node is added. Through this delegate method, we can learn the anchor (AR real-world coordinate) where a virtual object is added to the AR scene
- (void)renderer:(id <SCNSceneRenderer>)renderer didAddNode:(SCNNode *)node forAnchor:(ARAnchor *)anchor;

//The node is about to be updated
- (void)renderer:(id <SCNSceneRenderer>)renderer willUpdateNode:(SCNNode *)node forAnchor:(ARAnchor *)anchor;

//The node has been updated
- (void)renderer:(id <SCNSceneRenderer>)renderer didUpdateNode:(SCNNode *)node forAnchor:(ARAnchor *)anchor;

//Remove node
- (void)renderer:(id <SCNSceneRenderer>)renderer didRemoveNode:(SCNNode *)node forAnchor:(ARAnchor *)anchor;

@end
```

#### ARSession — Key Introduction

![Session Bridge](/assets/images/20170830ARKit/SessionBridge.avif)

`ARSession` is a bridge connecting the low level and the AR view. All the methods in `ARSCNView` are provided by `ARSession`.


__`ARSession` mainly has two ways to obtain camera position data__:

* push: notify the user by implementing the Session's delegate method `session:didUpdateFrame:`
* pull: the user can actively fetch the `ARSession`'s `currentFrame` property.

``` objc
@interface ARSession : NSObject

//Delegate
@property (nonatomic, weak) id <ARSessionDelegate> delegate;

//Specifies the queue on which the delegate is called (the main queue has no delay; background queues do). Defaults to the main queue if not specified
@property (nonatomic, strong, nullable) dispatch_queue_t delegateQueue;

//The camera's current position (computed by the session tracking configuration)
@property (nonatomic, copy, nullable, readonly) ARFrame *currentFrame;

//Session configuration
@property (nonatomic, copy, nullable, readonly) ARConfiguration *configuration;

//Run the session (this line of code is the key to starting AR)
- (void)runWithConfiguration:(ARConfiguration *)configuration NS_SWIFT_UNAVAILABLE("Use run(_:options:) instead");

//Run the session, but with an extra parameter ARSessionRunOptions: it defines the behavior when the session disconnects and reconnects.
- (void)runWithConfiguration:(ARConfiguration *)configuration options:(ARSessionRunOptions)options NS_SWIFT_NAME(run(_:options:));

//Pause the session
- (void)pause;

//Add an anchor
- (void)addAnchor:(ARAnchor *)anchor NS_SWIFT_NAME(add(anchor:));

//Remove an anchor
- (void)removeAnchor:(ARAnchor *)anchor NS_SWIFT_NAME(remove(anchor:));

@end

```

> Running a session, __runWithConfiguration:options:__ — options is an `ARSessionRunOptions` enum.  
> This method defines the behavior when the session disconnects and reconnects.

``` objc
typedef NS_OPTIONS(NSUInteger, ARSessionRunOptions) {
	 //Reset tracking
    ARSessionRunOptionResetTracking           = (1 << 0),
    
    //Remove existing anchors
    ARSessionRunOptionRemoveExistingAnchors   = (1 << 1)
};
```

Now let's look at `ARSession`'s delegate.

`ARSession` has two kinds:

* KVO observer: ARSessionObserver
* delegate: ARSessionDelegate

> Even I find this design odd.

ARSessionObserver looks like this:

``` objc
@protocol ARSessionObserver <NSObject>

@optional

//Session failed
- (void)session:(ARSession *)session didFailWithError:(NSError *)error;

//The camera's tracking state changed
- (void)session:(ARSession *)session cameraDidChangeTrackingState:(ARCamera *)camera;

//Session unexpectedly interrupted (after starting ARSession, moving the app to the background can cause the session to be interrupted)
- (void)sessionWasInterrupted:(ARSession *)session;

//Session resumed after interruption (briefly going to the background and returning to the app resumes automatically)
- (void)sessionInterruptionEnded:(ARSession *)session;

//Session output an audio data `CMSampleBufferRef` 
- (void)session:(ARSession *)session didOutputAudioSampleBuffer:(CMSampleBufferRef)audioSampleBuffer;

@end
```

ARSessionDelegate looks like this:

``` objc
相机位置发生改变 就是相机的位置有变动
- (void)session:(ARSession *)session didUpdateFrame:(ARFrame *)frame;

// Anchors added
- (void)session:(ARSession *)session didAddAnchors:(NSArray<ARAnchor*>*)anchors;

//Update anchors
- (void)session:(ARSession *)session didUpdateAnchors:(NSArray<ARAnchor*>*)anchors;

//Remove anchors
- (void)session:(ARSession *)session didRemoveAnchors:(NSArray<ARAnchor*>*)anchors;

@end
```

That's all for `ARSession`.

#### ARCamera — Key Introduction

`ARCamera` is a camera — the hub connecting the virtual scene and the real scene.

In `ARKit`, it's the camera that captures real-world images; in SceneKit, it's the camera in the 3D virtual world.

> In games — typically first-person 3D games — the hero is a 3D camera. The picture we see on our computer screen is exactly what this camera captures.

Generally, we don't need to create an `ARCamera` instance ourselves, because every time an `ARSCNView` is initialized, it creates an `ARCamera` instance for us by default. This camera is also the position of the camera lens and the origin of the 3D world __(0,0,0)__.

As for `ARCamera`'s API, we usually don't need to care — `ARKit` configures it by default.

``` objc
@interface ARCamera : NSObject <NSCopying>

//4x4 matrix representing the camera's position, similar to an anchor
@property (nonatomic, readonly) matrix_float4x4 transform;

//The vector Euler angles of the camera's orientation (rotation), for x/y/z respectively
@property (nonatomic, readonly) vector_float3 eulerAngles;

//Camera tracking state (the enum values are introduced below)
@property (nonatomic, readonly) ARTrackingState trackingState NS_REFINED_FOR_SWIFT;

//Tracking reason
@property (nonatomic, readonly) ARTrackingStateReason trackingStateReason NS_REFINED_FOR_SWIFT;

//Camera intrinsics, a 3x3 matrix  
@property (nonatomic, readonly) matrix_float3x3 intrinsics;

//Camera resolution
@property (nonatomic, readonly) CGSize imageResolution;

//Projection matrix
@property (nonatomic, readonly) matrix_float4x4 projectionMatrix;


//Create camera using x, y, z position 
- (CGPoint)projectPoint:(vector_float3)point orientation:(UIInterfaceOrientation)orientation viewportSize:(CGSize)viewportSize;
 
//Create the camera projection matrix — near plane distance, far plane distance
- (matrix_float4x4)projectionMatrixForOrientation:(UIInterfaceOrientation)orientation viewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;

//Create the camera projection matrix
- (matrix_float4x4)viewMatrixForOrientation:(UIInterfaceOrientation)orientation;

@end
```

> The near and far plane distances mentioned above — see the diagram: ![Distance](/assets/images/20170830ARKit/Distance1.avif) — taken from [Projection Transform](http://www.jianshu.com/p/bc151ff65cef)
> ![Distance](/assets/images/20170830ARKit/Distance2.avif)
> This falls within the scope of OpenGL. If you're interested, you can study it.

``` objc
//Camera tracking state enum
typedef NS_ENUM(NSInteger, ARTrackingState) {
	 /* Not available */
    ARTrackingStateNotAvailable,
    
    /* Limited */
    ARTrackingStateLimited,
    
    /* Normal. */
    ARTrackingStateNormal,
};

//Tracking reason
typedef NS_ENUM(NSInteger, ARTrackingStateReason) {
    /* None. */
    ARTrackingStateReasonNone,
    
    //Initializing
    ARTrackingStateReasonInitializing,
    
    /* Excessive motion. */
    ARTrackingStateReasonExcessiveMotion,
    
    /** Insufficient features. */
    ARTrackingStateReasonInsufficientFeatures,
}
```

> One thing involved here is called `eulerAngles` — [Euler angles](https://zh.wikipedia.org/wiki/%E6%AC%A7%E6%8B%89%E8%A7%92)
> ![Euler Angles](/assets/images/20170830ARKit/EulerAngles.avif)
> Euler angles solve orientation problems like rotation matrices for 3D objects. There's one plane that's stationary and one that moves. Based on the angle at which the two planes intersect relative to the center, or through sin/cos, you can solve problems like angle labeling and rotation matrices. For details, refer to the Wikipedia explanation. (I studied it for a while and still got lost — forgive me!)


#### Capturing Planes with ARKit

![Plane Detective](/assets/images/20170830ARKit/PlaneDetective.avif)

[Plane detection demo](https://github.com/sunyazhou13/ARDemos/blob/master/ARDemoPlaneDetective.zip)

Let me show the core code.

Called when a node is added (after plane detection mode is enabled, if ARKit detects a plane, it automatically adds a plane node).

``` objc
#pragma mark -
#pragma mark - ARSCNViewDelegate 代理

- (void)renderer:(id <SCNSceneRenderer>)renderer didAddNode:(SCNNode *)node forAnchor:(ARAnchor *)anchor{
    if ([anchor isMemberOfClass:[ARPlaneAnchor class]]) {
        NSLog(@"捕捉到平地");
        //Add a 3D plane model. ARKit only has detection capability; an anchor is a spatial position. To see this space more clearly, we need to add a 3D plane model to render it
        //1. Get the detected plane anchor
        ARPlaneAnchor *planeAnchor = (ARPlaneAnchor *)anchor;
        //2. Create a 3D object model (the plane detected by the system is an irregularly sized rectangle; here we turn it into a rectangle and scale the plane)
        //Create a box — parameters: width, height, length, chamfer radius
        SCNBox *plane = [SCNBox boxWithWidth:planeAnchor.extent.x * 0.3 height:0 length:planeAnchor.extent.x * 0.3 chamferRadius:0];
        //3. Render the 3D model with a material — the default model is white
        plane.firstMaterial.diffuse.contents = [UIColor cyanColor];
        
        //4. Create a node based on the 3D object model
        SCNNode *planeNode = [SCNNode nodeWithGeometry:plane];
        //5. Set the node's position to the anchor and center of the detected plane. In SceneKit, a node's position is a vector coordinate SCNVector3Make based on the 3D coordinate system
        planeNode.position = SCNVector3Make(planeAnchor.center.x, 0, planeAnchor.center.z);
        
        [node addChildNode:planeNode];
        
        //6. When a plane is detected, add a 3D model onto the plane 2 seconds later
        
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            //1. Create a vase scene
            SCNScene *scene = [SCNScene sceneNamed:@"Models.scnassets/vase/vase.scn"];
            //2. Get the vase node (a scene can have multiple nodes; here, the vase node is simply the first child node of the scene)
            //Every scene has one and only one root node; all other nodes are children of the root node
            SCNNode *vaseNode = scene.rootNode.childNodes[0];
            
            //4. Set the vase node's position to the detected plane's position; if not set, it defaults to the origin, i.e., the camera position
            vaseNode.position = SCNVector3Make(planeAnchor.center.x, 0, planeAnchor.center.z);
            
            //5. Add the vase node to the current screen
            //!!!Important: the vase node is added to the node captured by the delegate, not to the AR view's root node, because the detected plane anchor is in a local coordinate system, not the world coordinate system
            [node addChildNode:vaseNode];
        });
    }
}

```

#### AR Code Demo Implementation



[All related demos repository](https://github.com/sunyazhou13/ARDemos)


References 

[Using ARKit with Metal](http://metalkit.org/2017/07/29/using-arkit-with-metal.html)  

[坤小's posts 1–10](http://www.jianshu.com/p/c97b230fa391)
