---
layout: post
title: iOS 27 适配 iPhone Duo：六个新 API 的 Swift / Objective-C 整理
date: 2026-09-18 08:00 +0000
categories: [iOS]
tags: [iOS 27, iPhone Duo, Swift, Objective-C, SwiftUI, UIKit, 折叠屏]
typora-root-url: ".."
math: false
mermaid: false
---

![iPhoneDUO2026](/assets/images/20260918AdaptingAppsToiPhoneDUOIniOS27/iPhoneDuo.avif)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

---

## 写在前面：这是一篇"纸上谈兵"的整理

先说清楚三件事，免得后面有人照着抄然后来骂我：

1. **我没有 Xcode 27.1 beta**，也没有 iPhone Duo 的模拟器（Device Hub）。所以本文里的代码**一行都没有编译过**。
2. 所有 API 名称来自苹果在 9 月 9 日放出的 **6 个 iPhone Duo Tech Talk 视频**及其字幕，以及各家对这些视频的整理，**不是**来自 SDK 里的头文件。
3. 因此：**Swift 侧的签名相对可信**（视频里直接给了代码）；**Objective-C 侧是我按 UIKit / AVFoundation 的命名惯例推出来的**，Selector 名字请以正式 SDK 为准。我会把"哪些是我推的"标出来。

如果你手里有 beta，欢迎拿真机/模拟器对一遍，错了告诉我，我改。

---

## iPhone Duo 到底改了什么

![iPhoneDuo](/assets/images/20260918AdaptingAppsToiPhoneDUOIniOS27/cover.avif)

*图中 1–6 即下文逐项整理的六个 API：蓝色为布局类接口，橙色为硬件类接口。*


一句话概括：**一块能折的屏、一个能读角度的铰链、两颗前置摄像头，外加 iOS 第一次允许同一个 App 开两个窗口。**

落实到开发者要处理的"事实"：

| 事实 | 后果 |
| --- | --- |
| 外屏 + 内屏两块屏 | 外屏是 compact width（跟普通 iPhone 一样），内屏是 regular × regular |
| 中间有铰链 | 半折时内屏在中间弯折，被切成多个可用区域 |
| 两颗前置摄像头 | `position == .front` 不再等于"正对着你" |
| 支持多实例 | 同一个 App 可以同时开两个窗口（仅内屏） |

设备的三种铰链状态（这是官方枚举，不是我编的）：`closed` / `partiallyOpen` / `fullyOpen`。加上"书本态"（半折立着看）和"桌面态"（半折平放），布局要跑的组合一下子多了好几倍。

---

## 六个新 API 总览

| 功能 | SwiftUI（Swift） | UIKit | 框架 | ObjC 能用吗 |
| --- | --- | --- | --- | --- |
| 折叠屏布局 | `ArrangementView` | `UIArrangementViewController` | SwiftUI / UIKit | ⚠️ 仅 UIKit 侧，待验证 |
| 硬件区域避让 | `GeometryProxy.reservedRegions(kind:)` | `UIView.reservedRegions(kind:)` | SwiftUI / UIKit | ⚠️ 仅 UIKit 侧，待验证 |
| 铰链状态 | `onHingeChange` | `UIHingeInteraction` | SwiftUI / UIKit | ⚠️ 仅 UIKit 侧，待验证 |
| 同应用多窗口 | `UIWindowScene.ActivationAction` | 既有 `requestSceneSessionActivation` | UIKit | ✅ 老 API 可用 |
| 跨屏相机控制 | `CameraCaptureAccessory` + `.sceneAccessory()` | — | SwiftUI | ❌ Swift only |
| 虚拟前置摄像头 | `AVCaptureDeviceDiscoverySession` | 同名 | AVFoundation | ✅ 老 API 可用 |
| 摄像头朝向识别 | `AVCaptureDeviceDirectionCoordinator` | — | AVKit | ❌ Swift only（Swift 并发） |

看明白了吗——**SwiftUI 那五个在 Objective-C 里根本不存在**。这不是苹果歧视 ObjC，纯粹是 SwiftUI 和 Swift 并发天生就不往 ObjC 暴露。老项目想吃到这批红利，门槛不在 API，在语言。

下面逐个拆。**每一节我都分成 Swift 和 Objective-C 两块写。**

---

## 一、折叠屏布局：ArrangementView / UIArrangementViewController

### 它是什么

苹果对它的定位很精确：**一个位于"导航容器"和"内容容器"之间的布局容器**，负责按规则摆放恰好两个视图：`primary` 和 `secondary`。规则的输入是 size class、视图自身宽高比、以及当前生效的 division region。

两种样式：

- **`.split`**：把空间切两半。宽 > 高时横向切，高 > 宽时纵向切。适合"主体 + 详情"，两边都不能被遮住。
- **`.overlay`**：前后叠放，折叠后才变成并排。适合"前景 + 背景"，背景被挡一部分无所谓。

选哪个？苹果给了个特别直接的判断法：**看你原来用什么**。

| 你原来写的是 | 该用 |
| --- | --- |
| `HStack` / `VStack` | `.split` |
| `ZStack` | `.overlay` |
| 主体 + 详情（播放器 + 文稿） | `.split` |
| 前景盖背景 | `.overlay` |

### Swift

```swift
NavigationStack {
    ArrangementView {
        PlayerView()
    } secondary: {
        UpNextView()
    }
    .arrangementViewStyle(.split)
}
```

限制分屏方向：

```swift
.arrangementViewStyle(.split.axes(.horizontal))
```

⚠️ 这里有个坑，苹果自己点破了：**当 arrangement 无法沿你指定的主轴分割时，它只显示一个视图**。注意这不是报错，是静默丢掉一个 view。所以限制轴向 = 你明确接受了"某些姿态下少一个页面"，这该是个产品决策，别等测试发现了再吵。

overlay 模式下可以读自己被叠在哪一层：

```swift
enum Minimization { case collapsed, expanded }

struct UpNextView: View {
    @Environment(\.overlayArrangementZIndex) private var zIndex: Int

    var body: some View {
        UpNextList(minimization: minimization)
    }

    var minimization: Minimization {
        zIndex > 0 ? .collapsed : .expanded
    }
}
```

**两个明确的禁用场景**（都是布局 bug，不是编译错误）：

- arrangement 不提供导航能力 → 别把 `NavigationSplitView` 塞进去
- 别把 `ArrangementView` 放进 `List` 或 `ScrollView`

### Objective-C

UIKit 这边是 `UIArrangementViewController`，用法是把两个子 VC 挂上去，再把它当 `UINavigationController` 的 root：

```objc
// ⚠️ Selector 名为推断值，以 iOS 27.1 SDK 头文件为准
UIArrangementViewController *arrangementVC = [[UIArrangementViewController alloc] init];
UINavigationController *nav =
    [[UINavigationController alloc] initWithRootViewController:arrangementVC];

[arrangementVC setViewController:playerVC  forArrangementRole:UIArrangementRolePrimary];
[arrangementVC setViewController:upNextVC  forArrangementRole:UIArrangementRoleSecondary];

// 更新样式（Swift 侧的 .split.axes(.horizontal)）
[arrangementVC updateArrangement:UIArrangementStyleSplit];

// 读 overlay 下的层级
UIArrangementState *state =
    [arrangementVC stateForArrangementRole:UIArrangementRoleSecondary];
model.minimization = (state.zIndex > 0) ? MinimizationCollapsed : MinimizationExpanded;
```

我的判断：`UIArrangementViewController` 大概率对 ObjC 友好（它是 `UIViewController` 子类，角色参数应该是 `NS_ENUM`），**但 `.split.axes(.horizontal)` 这种 Swift 才有的"点链式静态成员"语法在 ObjC 里没有对等物**，所以轴向限制大概率要换个写法（比如传 options 结构体），或者根本没有 ObjC 版本。这段请务必对着 SDK 核一遍。

---

## 二、硬件区域避让：ReservedRegion / UIViewReservedRegion

### 它是什么

**reserved region 是"被硬件占掉的一块显示区"，它不属于 safe area，是另一套东西。** 两类：

- **division region**：折痕本身。只在半折时生效，展平时宽度为 0。
- **occlusion region**：屏下前置摄像头那类"遮挡"。只在摄像头工作时生效。

外屏那颗摄像头是**常驻** region，不过当你的控件在侧边栏时系统会自己处理掉。

配套的设计概念叫 **displacement（位移）**：把交互元素挪出折痕区。规则是统一的：

- 书本态 → 往 trailing 侧挪
- 桌面态 → 往下挪，供远看的放上面
- 相关的东西一起挪，别挪太远
- **滚动内容不用管**（feed 从折痕下面穿过去完全没问题）
- sheet / alert / menu / popover **系统已经帮你避让了**

### Swift

```swift
GeometryReader { proxy in
    // 折痕区域；.includeInactive 让它在展平时也返回（宽度 0）
    let regions = proxy.reservedRegions(kind: .division, options: .includeInactive)
    let frames  = regions.map(\.frame)
    MyLayout(avoiding: frames)
}
```

```swift
// 遮挡区域（摄像头）
GeometryReader { proxy in
    let regions = proxy.reservedRegions(kind: .occlusion)
    let frames  = regions.map(\.frame)
    MyLayout(avoiding: frames)
}
```

`includeInactive` 有个很妙的用法：**网格列数想固定成偶数时开着它**。这样即使屏幕展平（region 宽度 0）你也能拿到 region，列的决策就稳定了，不会用户每折一次就重排一次。

### Objective-C

SwiftUI 的 `GeometryProxy` 那条路在 ObjC 里不存在。UIKit 侧是 `UIView` 上的方法：

```objc
// ⚠️ 方法名按 UIKit 惯例推断，以 SDK 为准
NSArray<UIViewReservedRegion *> *regions =
    [self.view reservedRegionsWithKind:UIViewReservedRegionKindDivision
                              options:UIViewReservedRegionOptionIncludeInactive];

NSMutableArray<NSValue *> *frames = [NSMutableArray array];
for (UIViewReservedRegion *region in regions) {
    [frames addObject:[NSValue valueWithCGRect:region.frame]];
}
[self layoutAvoiding:frames];
```

`UIViewReservedRegion` 这个名字来自苹果视频里 UIKit 侧的接口名，返回的是区域对象、带 `frame`，这点比较可信；具体 Selector 是 `reservedRegionsWithKind:` 还是 `reservedRegionsForKind:` 我赌不出来。

---

## 三、铰链状态：onHingeChange / UIHingeInteraction

### 它是什么

给你两样东西：**离散状态**（closed / partiallyOpen / fullyOpen）和**连续角度**。

**苹果的原话很坚决：这是给交互和特效用的，不是给布局用的。** 布局请用 arrangement 和 reserved region。如果你发现自己正在用 `hinge.angle` 算 frame —— 你用错 API 了，而且你会跟系统打架。

官方例子是个吉他 App：用折叠程度当 whammy bar，弯音高。

### Swift

```swift
struct InstrumentView: View {
    @State private var pitchBend: Double = 0

    var body: some View {
        GuitarView(pitchBend: pitchBend)
            .onHingeChange { _, context in
                // hinge 为 nil 表示这台设备没有铰链 —— 必须判空
                guard let hinge = context.hinge,
                      hinge.status == .partiallyOpen else {
                    pitchBend = 0
                    return
                }
                pitchBend = bend(for: hinge.angle)
            }
    }
}
```

那个 `guard let hinge` **不是礼貌，是必需**。你的 App 会跑在其它所有 iPhone 上，那里 `context.hinge` 就是 `nil`。顺手在 `else` 里把效果复位，别让吉他一直弯着。

### Objective-C

```objc
// ⚠️ 类名来自视频，具体初始化/回调形式以 SDK 为准
UIHingeInteraction *hingeInteraction =
    [[UIHingeInteraction alloc] initWithChangeHandler:^(UIHingeContext *context) {
        UIHinge *hinge = context.hinge;      // 无铰链设备为 nil
        if (hinge == nil || hinge.status != UIHingeStatusPartiallyOpen) {
            self.pitchBend = 0.0;
            return;
        }
        self.pitchBend = [self bendForAngle:hinge.angle];
    }];
[self.view addInteraction:hingeInteraction];
```

`UIHingeInteraction` 走的是 `UIInteraction` 协议那套（跟 `UIPointerInteraction` 一个路子），所以 `addInteraction:` 这个接入方式我比较有信心；初始化器长什么样、回调是 block 还是 delegate，得看头文件。

---

## 四、同应用多窗口：UIWindowSceneActivation

### 它是什么

**iPhone Duo 是第一款支持同一个 App 跑多个 UI 实例的 iPhone。** 在 iPad 上做过这套的，这里自动就有了。

一条硬限制：**新窗口只能开在内屏，外屏不行。**

所以：请求场景**必须处理失败**。苹果的做法是给你 `UIWindowScene.ActivationAction`，**它在开不了新窗口时会自动把自己隐藏掉**——你不用手写"这个按钮该不该显示"的逻辑。

顺带一提：外媒把它传成"应用双开"，其实差远了。这是 iPadOS 13 就有的多窗口，两个窗口同属一个 App、共享同一份数据和账号会话，不是两个独立容器。

### Swift

新的 SwiftUI action（名字来自苹果文档路径 `UIKit/UIWindowScene/ActivationAction`）：

```swift
// ⚠️ 构造参数未验证
struct ContentView: View {
    var body: some View {
        UIWindowScene.ActivationAction("在新窗口中打开") {
            // 返回要交给新场景的 activity / configuration
        }
    }
}
```

更稳的是直接走已经存在好几年的 UIKit 多窗口 API，这个我有把握：

```swift
let activity = NSUserActivity(activityType: "com.example.openDocument")
activity.userInfo = ["documentID": document.id]

let options = UIWindowScene.ActivationRequestOptions()
options.requestingScene = view.window?.windowScene

UIApplication.shared.requestSceneSessionActivation(
    nil,
    userActivity: activity,
    options: options
) { error in
    // 外屏上、或已达上限时，这里会拿到 error —— 一定要处理
    guard error == nil else {
        presentFallbackLayout()
        return
    }
}
```

### Objective-C

老 API 在 ObjC 里完全能用，这也是**本节唯一一个 ObjC 不需要赌的部分**：

```objc
NSUserActivity *activity =
    [[NSUserActivity alloc] initWithActivityType:@"com.example.openDocument"];
activity.userInfo = @{ @"documentID": documentID };

UIWindowSceneActivationRequestOptions *options =
    [[UIWindowSceneActivationRequestOptions alloc] init];
options.requestingScene = self.view.window.windowScene;

[[UIApplication sharedApplication] requestSceneSessionActivation:nil
                                                   userActivity:activity
                                                        options:options
                                                   errorHandler:^(NSError * _Nonnull error) {
    // 外屏上开不了窗口，会走这里
    [self presentFallbackLayout];
}];
```

至于 `UIWindowScene.ActivationAction` 这个新类型：Swift 里写作嵌套类型 `UIWindowScene.ActivationAction`，ObjC 里通常会通过 `NS_SWIFT_NAME` 暴露成 `UIWindowSceneActivationAction`，但它大概率是个 SwiftUI 的 `View`，**ObjC 拿不到**。老老实实用上面那段。

---

## 五、跨屏相机控制：CameraCaptureAccessory

### 它是什么

相机 UI 在内屏全屏跑着，**外屏同时显示一块附属 UI**。典型用法：给被拍的人看自己的构图，或者当提词器。

生效条件很明确：

- App 在内屏**全屏**
- 有**活跃的相机会话**
- 注册在相机 view 上，只有那个 view 可见时才出现

可用性是**系统动态控制的**：默认可用，随时可能被收走（比如把设备合上）。所以要用 `onAvailabilityChange` 跟着改 UI，别让用户点一个没反应的按钮。

### Swift

```swift
struct CameraRootView: View {
    @State private var model = TeleprompterModel()

    var body: some View {
        CameraView(model: model)
            .sceneAccessory {
                CameraCaptureAccessory(isEnabled: $model.isEnabled) {
                    TeleprompterView(model: model)
                }
                .onAvailabilityChange { model.isAvailable = $0 }
            }
            .toolbar {
                TeleprompterToggle(isEnabled: $model.isEnabled)
                    .disabled(!model.isAvailable)   // 不可用就置灰
            }
    }
}
```

### Objective-C

**没有。** `CameraCaptureAccessory` 和 `.sceneAccessory()` 都是 SwiftUI 类型，ObjC 里连名字都摸不到。

UIKit 项目想在两块屏上同时显示内容，只能退回既有的外屏方案（给外接/第二屏创建 `UIWindow` + `UIWindowScene`）。苹果给的 background 文档是 *Presenting content on a connected display*，走的就是这条路——但那是"投屏"语义，跟"相机配件"不是一回事，系统不会帮你管那套可用性。

---

## 六、虚拟前置摄像头与朝向识别

### 它是什么

iPhone Duo 有**两颗**前置摄像头，都是方形传感器 + 超广角：

- **外置超广角**（设备外侧）：最高 4K @ 120fps
- **屏下内超广角**（展开后在内屏，iPhone 上第一颗屏下摄像头）：最高 1080p @ 60fps

用老办法发现前置摄像头时，你拿到的是一颗**虚拟前置摄像头（Virtual Front Camera）**：开合设备时它自动在两颗物理摄像头之间切换，永远给你最相关的那颗。**你什么都不用做。**

代价是：虚拟摄像头只暴露两者的交集 —— **1080p、60fps、无 depth**。要 4K120 或 depth，就得直接用 `builtInOuterUltraWideCamera` / `builtInInnerUltraWideCamera`，代价是**切换得你自己管**。

然后是那个真正的新问题：**`position == .front` 不再意味着"正对着你"**。两块屏可能朝相反方向——你在看内屏，流却来自外屏那颗前置，它正对着别处。合上设备，同一颗摄像头又转过来对着你了。

解法是 AVKit 的 `AVCaptureDeviceDirectionCoordinator`：绑定一个 view，报告"相对于这个 view"哪颗摄像头朝前。**一个 view 一个 coordinator**（两块屏就建两个）。

### Swift

发现虚拟前置摄像头（老 API，AVFoundation）：

```swift
let discovery = AVCaptureDevice.DiscoverySession(
    deviceTypes: [.builtInWideAngleCamera, .builtInUltraWideCamera],
    mediaType: .video,
    position: .front
)
// iPhone Duo 上拿到的是 Virtual Front Camera
```

朝向协调器（这段是苹果视频里的原代码，可信度最高）：

```swift
directionCoordinator = AVCaptureDeviceDirectionCoordinator(
    view: view,
    deviceTypes: [
        .builtInOuterUltraWideCamera,
        .builtInInnerUltraWideCamera,
        .builtInDualWideCamera,
    ],
    changeHandler: { [weak self] map in
        self?.updateCameraSession(map)
    }
)
```

两个实现细节，苹果特意强调了：

1. **它给你的不是 `AVCaptureDevice`，而是 `AVCaptureDeviceDescriptor`** —— 一个 `Sendable` 的替身。因为 coordinator 绑在 view 上、被隔离在 main actor，**回调里不能直接调 AVFoundation API**。正确姿势是把 descriptor 传给你的 camera actor，在那边重建 device。
2. 方向变了要**重新决定镜像**：后置摄像头朝前当自拍用时，预览该镜像。

预览打磨三件套：

```swift
previewLayer.videoGravity = .resizeAspectFill          // fit 还是 fill
device.dynamicAspectRatio                              // 方形传感器 → 选横构图比例
AVCaptureDevice.RotationCoordinator                    // 换屏时保持预览/成片正立
// 采用 RotationCoordinator 之后，关掉它换性能
photoOutput.isCameraSensorOrientationCompensationEnabled = false
```

### Objective-C

发现摄像头那部分完全没问题，`AVCaptureDeviceDiscoverySession` 是十几年的老 API：

```objc
NSArray<AVCaptureDeviceType> *types = @[AVCaptureDeviceTypeBuiltInWideAngleCamera,
                                        AVCaptureDeviceTypeBuiltInUltraWideCamera];
AVCaptureDeviceDiscoverySession *session =
    [AVCaptureDeviceDiscoverySession discoverySessionWithDeviceTypes:types
                                                           mediaType:AVMediaTypeVideo
                                                            position:AVCaptureDevicePositionFront];
// iPhone Duo 上同样拿到虚拟前置摄像头 —— 自动切换，零成本
```

**但 `AVCaptureDeviceDirectionCoordinator` 基本可以确定 ObjC 用不了。** 理由不是名字，是它的设计：main actor 隔离、回调返回 `Sendable` 的 descriptor、文档里明说"别在 handler 里直接调 AVFoundation"—— 这是一整套 Swift 并发语境下的设计，ObjC 没有落点。

也就是说：**ObjC 项目要么接受虚拟前置摄像头的自动切换（1080p60 封顶），要么自己监听场景/屏幕变化去猜朝向。** 想拿到完整的 4K120 + 精确的朝向追踪，这段逻辑得写成 Swift。这是这批 API 里最实在的一道语言门槛。

---

## Swift / Objective-C 对照总表

| 能力 | Swift | Objective-C | 结论 |
| --- | --- | --- | --- |
| 折叠布局 | `ArrangementView` / `UIArrangementViewController` | `UIArrangementViewController` | ⚠️ 大概率可用，轴向限制可能缺失 |
| 避让区域 | `GeometryProxy.reservedRegions(kind:)` | `UIView` 上的同族方法 | ⚠️ 大概率可用，Selector 待核 |
| 铰链角度 | `onHingeChange` / `UIHingeInteraction` | `UIHingeInteraction` | ⚠️ 大概率可用，初始化形式待核 |
| 多窗口 | `UIWindowScene.ActivationAction` + 老 API | 老 API `requestSceneSessionActivation` | ✅ 完全可用 |
| 相机配件 | `CameraCaptureAccessory` | — | ❌ 无 |
| 虚拟前置 | `DiscoverySession` | 同名 | ✅ 完全可用 |
| 朝向识别 | `AVCaptureDeviceDirectionCoordinator` | — | ❌ 无（Swift 并发） |

一句话总结：**UIKit 那三个能指望，SwiftUI 那两个别想，相机这块一半一半，真正的硬门槛是 `AVCaptureDeviceDirectionCoordinator`。**

---

## 不碰新 API 也得做的迁移清单

这批新 API 其实不是最急的。更急的是下面这些——**按"先炸哪个"排序**：

1. **Scene lifecycle**：没有 `UISceneDelegate`，用新 SDK 编出来的 App **直接起不来**。这条没得商量，排第一。
2. **`UIScreen.main`**：两块屏了，"main"是谁？它已被标记弃用方向。换成 `traitCollection.displayScale`，或者通过 `window.windowScene` 拿屏幕。
3. **方向判断 → size class 判断**：内屏**根本不理会**你声明的 supported interface orientations。所有基于 orientation 的布局分支都是错的。
4. **安全区不再对称**：左右/上下 inset 可能不相等，**每一边单独处理**，别写 `safeAreaInsets.left * 2`。Split View 下更要重测一遍。
5. **竖排的栏**：侧边的 toolbar / tab bar 宽度固定，纯符号比文字好用——**每个 item 同时给 title 和 image**，让系统挑。溢出更早发生，设好 `visibilityPriority`。
6. **半宽测试**：所有 App 都参与 Split View，你的界面可能只有半个屏宽。这是布局 bug 的高发区。
7. **审计居中单列布局**：内屏那么宽，居中一列多半是浪费，考虑两栏。

---

## 参考

苹果的六场 Tech Talk（本文一手来源）：

- [Prepare your app for iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111461/)
- [Raise the bar with iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111462/)
- [Strike a pose with adaptive layouts on iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111463/)
- [Leverage multiple displays and scenes on iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111464/)
- [Build a great camera experience for iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111465/)
- [Design for iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111466/)

二手整理（我拿它们交叉验证过）：

- [iPhone Duo's New Code: Six APIs Developers Have Not Used Before](https://www.macobserver.com/news/iphone-duo-new-apis-developers-have-not-used-before/) — The Mac Observer
- [iPhone Duo: First Developer Good-to-Knows](https://www.swiftjectivec.com/iPhone-Duo-First-Developer-Good-to-Knows) — Swiftjective-C
- [iPhone Duo — Developer Video Hub](https://iphoneduo.dev/) — 六场视频的文字笔记

最后再啰嗦一遍：**以上代码全部未经编译**。等 Xcode 27.1 beta 出来，我会拿模拟器把每一段跑一遍，再回来改这篇。到时候哪些推断是对的、哪些是我瞎猜的，一目了然。
