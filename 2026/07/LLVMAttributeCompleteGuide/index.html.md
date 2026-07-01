---
layout: post
title: LLVM `__attribute__` 完全指南.
date: 2026-07-01 02:58 +0000
categories: [iOS, SwiftUI]
tags: [skills, iOS, Swift, Objective-C, LLVM]
typora-root-url: ..
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


---

## LLVM `__attribute__` 完全指南 —— iOS / macOS 开发者的必修课

> 覆盖 Objective-C、C、Swift 互操作场景，从基础到系统框架内部用法，尽量不遗漏细节。

---

## 目录

1. [什么是 `__attribute__`](#1-什么是-__attribute__)
2. [函数调用前后：constructor / destructor / cleanup](#2-函数调用前后constructordestructorcleanup)
3. [ObjC 专属属性](#3-objc-专属属性)
4. [Swift 互操作](#4-swift-互操作)
5. [内存管理与 ARC](#5-内存管理与-arc)
6. [编译器警告与检查](#6-编译器警告与检查)
7. [性能优化](#7-性能优化)
8. [内联与调用约定](#8-内联与调用约定)
9. [可见性与符号控制](#9-可见性与符号控制)
10. [类型布局与对齐](#10-类型布局与对齐)
11. [系统框架中的实际使用案例](#11-系统框架中的实际使用案例)
12. [注意事项与最佳实践](#12-注意事项与最佳实践)

---

## 1. 什么是 `__attribute__`

`__attribute__` 是 GCC 引入的语言扩展，LLVM/Clang 完全兼容并大量扩展。它允许开发者向编译器传递额外的语义信息，影响代码生成、优化、警告和运行时行为。

```c
// 基本语法
__attribute__((属性名))
__attribute__((属性名(参数列表)))
__attribute__((属性1, 属性2, ...))   // 逗号分隔多个属性
```

在 ObjC 中，Apple 将大量属性封装成了更友好的宏：

```objc
#define NS_REQUIRES_SUPER   __attribute__((objc_requires_super))
#define NS_DESIGNATED_INITIALIZER __attribute__((objc_designated_initializer))
#define API_AVAILABLE(...)  __attribute__((availability(...)))
```

---

## 2. 函数调用前后：constructor / destructor / cleanup

这是最容易被忽略但非常强大的一组属性——让代码在 `main()` 之前、之后、或变量离开作用域时自动执行。

### 2.1 `constructor` —— 在 `main()` 之前执行

```c
// 默认优先级（比 +load 晚，比 main() 早）
__attribute__((constructor))
static void setupBeforeMain(void) {
    printf("1. 在 main() 之前运行\n");
}

// 指定优先级（数字越小越先执行，范围 0~65535）
__attribute__((constructor(101)))
static void earlySetup(void) {
    printf("0. 优先级 101，更早运行\n");
}

__attribute__((constructor(200)))
static void laterSetup(void) {
    printf("2. 优先级 200，稍后运行\n");
}

int main() {
    printf("3. main() 开始\n");
    return 0;
}
// 输出顺序：0 → 1 → 2 → 3
```

**ObjC 场景**：`+load` 方法不等同于 `constructor`：

| 对比项 | `+load` | `constructor` |
|--------|---------|---------------|
| 执行时机 | 类被加载到 runtime 时 | 比 `main()` 稍早 |
| 是否可控制顺序 | ❌ | ✅ 通过优先级数字 |
| 调用方 | ObjC Runtime | dyld 加载器 |
| 是否支持纯 C 函数 | ❌ | ✅ |

```objc
// 典型用法：注册默认值 / 交换方法 / 初始化全局状态
__attribute__((constructor))
static void registerAnalyticsDefaults(void) {
    [[NSUserDefaults standardUserDefaults]
        registerDefaults:@{@"tracking_enabled": @YES}];
}

// 甚至可以给 C++ 静态构造函数指定优先级
// （这是 LLVM 特有扩展，GCC 对 C++ 不支持 constructor 优先级）
__attribute__((constructor(101)))
static void beforeAllCXXConstructors(void) {
    // 在 C++ 全局对象构造之前运行
}
```

### 2.2 `destructor` —— 在 `main()` 返回后 / `exit()` 时执行

```c
__attribute__((destructor))
static void cleanupAfterMain(void) {
    printf("5. main() 返回后自动调用\n");
}

__attribute__((destructor(101)))
static void earlyCleanup(void) {
    printf("4. 优先级 101 的析构先跑\n");
}
// 输出顺序：main 结束后 → 4 → 5
// 注意：destructor 优先级数字越大越先执行（和 constructor 反过来的！）
```

**容易踩的坑**：
- `abort()` / `_exit()` 不会触发 destructor
- 析构顺序与构造顺序相反
- 在多线程 exit 时 destructor 可能竞争，尽量不要在里面加锁

### 2.3 `cleanup` —— 变量离开作用域时自动调用

这是 ARC 的 `__strong` / `__weak` 底层依赖的机制，也经常被用来实现 Go 风格的 `defer`：

```c
// cleanup 函数签名：接受一个指向变量类型的指针
static void stringCleanup(__strong NSString **ptr) {
    NSLog(@"即将销毁: %@", *ptr);
    *ptr = nil;  // 确保被释放
}

static void fdCleanup(int *fd) {
    if (*fd > 0) {
        close(*fd);
        NSLog(@"关闭文件描述符: %d", *fd);
    }
}

void demoCleanup(void) {
    // 变量声明时绑定 cleanup 函数
    __strong NSString *str __attribute__((cleanup(stringCleanup)));
    str = @"Hello";

    int fd __attribute__((cleanup(fdCleanup))) = open("/tmp/test.txt", O_RDONLY);

    // ... 使用 str 和 fd ...

    // 离开作用域时自动调用 stringCleanup(&str)、fdCleanup(&fd)
    // 即使提前 return / break 也会调用！
}
```

**ObjC 中的 defer 宏**（利用 cleanup 实现）：

```objc
// 定义一个 defer block 类型
typedef void (^cleanup_block_t)(void);

static inline void defer_block_cleanup(cleanup_block_t *block) {
    if (*block) (*block)();
}

// 核心宏：用 cleanup 保证 block 在作用域结束时执行
#define defer __strong cleanup_block_t __attribute__((cleanup(defer_block_cleanup))) __cleanup_block = ^

// 使用
- (void)doSomething {
    defer {
        NSLog(@"无论如何都会执行——类似 Go 的 defer");
        [self unlock];
    };

    [self lock];
    // 复杂逻辑...
    if (someError) return; // 也会触发 defer
    // ...
}
```

> **注意**：Swift 中的 `defer` 是语言级别的，不需要任何黑魔法。ObjC 的 `defer` 宏只是一种模拟。

---

## 3. ObjC 专属属性

### 3.1 `objc_subclassing_restricted` —— 禁止子类化

```objc
__attribute__((objc_subclassing_restricted))
@interface AFHTTPSessionManager : NSObject
@end

// 等同于 Swift 的 final class
// 编译时检查：任何试图继承的代码都会报错
@interface MyManager : AFHTTPSessionManager  // ❌ Cannot subclass a class that was declared with objc_subclassing_restricted
@end
```

AFNetworking、SDWebImage 等库大量使用来防止继承滥用。

### 3.2 `objc_designated_initializer` —— 指定初始化器

```objc
@interface MyView : UIView

- (instancetype)initWithFrame:(CGRect)frame
    __attribute__((objc_designated_initializer));  // 指定初始化器

- (instancetype)initWithFrame:(CGRect)frame style:(NSInteger)style
    __attribute__((objc_designated_initializer));  // 可以有多个

- (instancetype)initWithCoder:(NSCoder *)coder
    __attribute__((objc_designated_initializer));

@end

@implementation MyView

// 便捷初始化器必须调用指定初始化器
- (instancetype)init {
    // 如果不调用 [self initWithFrame:]，编译器警告：
    // ⚠️ Convenience initializer missing a 'self' call to another initializer
    return [self initWithFrame:CGRectZero];
}

@end
```

规则：
- 便捷初始化器**必须**调用自身的一个指定初始化器
- 子类必须重写**所有**父类的指定初始化器（或用 `NS_UNAVAILABLE` 禁用）
- `NS_DESIGNATED_INITIALIZER` 宏就是它的封装

### 3.3 `objc_requires_super` —— 强制调用 super

```objc
@interface BaseViewController : UIViewController

- (void)viewDidLoad __attribute__((objc_requires_super));
- (void)setupNavigationBar __attribute__((objc_requires_super));

@end

@implementation MyViewController

- (void)viewDidLoad {
    // ⚠️ Method possibly missing a [super viewDidLoad] call
    [super viewDidLoad]; // 必须有这一行
}

@end
```

**`NS_REQUIRES_SUPER` 本质上就是这个属性。** 它只是编译期提示（warning），不是运行时强制。

### 3.4 `objc_direct` / `objc_direct_members` —— 直接派发，跳过 Runtime

> **这是现代 ObjC 性能优化的关键属性，LLVM 11+ 支持。**

```objc
// 单个方法标记为 direct
- (int)fastFibonacci:(int)n __attribute__((objc_direct));

// 或者标记整个 @implementation 区域
__attribute__((objc_direct_members))
@implementation MyClass {
    int _counter;
}

- (void)increment {
    _counter++;  // 直接访问 ivar，无 objc_msgSend 开销
}

- (int)value {
    return _counter;
}

@end
```

**`objc_direct` 做了什么**：
- 调用方直接跳转到函数地址（类似 C 函数调用），不走 `objc_msgSend`
- 不能被 `performSelector:` / KVO / Method Swizzling 访问
- 不能被 Category 覆盖
- 编译器可以内联优化
- 二进制体积更小（省去了 selector string）

```objc
// 反例：这些对 direct 方法都无效
[obj performSelector:@selector(increment)];           // ❌ 运行时找不到
[self methodForSelector:@selector(increment)];        // ❌ 返回 NULL
[MyClass aspect_hookSelector:@selector(increment)];   // ❌ 无法 Hook
```

**使用建议**：私有的、频繁调用的、不需要动态特性的方法全部用 `objc_direct`。

### 3.5 `objc_method_family` —— 指定方法族

```objc
// 告诉编译器这个方法属于哪个方法族（影响 ARC 行为）
- (instancetype)initWithDictionary:(NSDictionary *)dict
    __attribute__((objc_method_family(init)));

// 可用方法族：
// init, alloc, new, copy, mutableCopy

// 例如：让一个非 init 开头的方法被 ARC 识别为 init 族
- (MyObject *)createObject __attribute__((objc_method_family(init)));
// ARC 会对其返回值执行 retain/release 逻辑，类似 init 的行为
```

### 3.6 `objc_boxable` —— 支持装箱语法

```objc
// 让自定义 struct 支持 @(...) 语法
typedef struct __attribute__((objc_boxable)) {
    CGFloat width;
    CGFloat height;
} MySize;

MySize size = {100, 200};
NSValue *value = @(size);  // ✅ 合法

// CGFloat、CGPoint、CGRect 等系统类型都标记了 objc_boxable
```

### 3.7 `objc_root_class` —— 声明根类

```objc
__attribute__((objc_root_class))
@interface MyRootClass
@end

// 极少使用，通常只有 NSObject / NSProxy 用这个
```

### 3.8 `objc_runtime_name` —— 给类指定运行时名字

```objc
// 编译期叫 MyClass，运行时叫 _Internal_MyClass
__attribute__((objc_runtime_name("_Internal_MyClass")))
@interface MyClass : NSObject
@end

// Swift 编译器大量使用这个——给 @objc 类生成唯一运行时名称
// 普通开发者基本用不到
```

### 3.9 `objc_externally_retained` —— 外部持有标记

```objc
// 告诉 ARC：这个对象由外部持有，不要在这个作用域内 release
UIView *view = _cachedView;
__attribute__((objc_externally_retained))
UIView *externalView = view;
// ARC 不会在此后插入 release
```

---

## 4. Swift 互操作

### 4.1 `swift_name` —— 给 ObjC API 指定 Swift 中的名字

这是 `NS_SWIFT_NAME` 宏的底层实现：

```objc
// 自定义 Swift 中函数名
- (void)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
    __attribute__((swift_name("application(_:didFinishLaunchingWithOptions:)")));

// 方法重命名（参数标签也重命名）
- (void)handleURL:(NSURL *)url options:(NSDictionary *)options
    __attribute__((swift_name("handle(url:options:)")));

// 类重命名
__attribute__((swift_name("MyNewClassName")))
@interface OldObjCClassName : NSObject
@end

// 全局变量 / 枚举重命名
extern NSString * const kOldConstant
    __attribute__((swift_name("newConstantName")));

// getter/setter 自定义
@property (nonatomic, readonly, getter=isEnabled) BOOL enabled
    __attribute__((swift_name("isFeatureEnabled")));
```

### 4.2 `swift_private` —— 对 Swift 隐藏

```objc
// NS_REFINED_FOR_SWIFT 的底层
__attribute__((swift_private))
- (void)internalSetup;

// Swift 中不可见，只有 ObjC 能调用
// 配合 NS_REFINED_FOR_SWIFT 做更精细的 API 控制
```

### 4.3 `swift_attr` —— 注入 Swift 属性

```objc
// 给生成的 Swift 接口添加属性
__attribute__((swift_attr("@available(*, deprecated, message: \"Use newAPI instead\")")))
- (void)oldAPI;
```

---

## 5. 内存管理与 ARC

### 5.1 `ns_returns_retained` / `ns_returns_not_retained` 等

```objc
// CF 风格的手动内存管理标注（底层实现）
- (id)newObject __attribute__((ns_returns_retained));
// NS_RETURNS_RETAINED 的底层

- (id)borrowedObject __attribute__((ns_returns_not_retained));
// 告诉 ARC 返回的是非持有引用

// 对应宏：NS_RETURNS_RETAINED、NS_RETURNS_NOT_RETAINED
// 以及 CF_RETURNS_RETAINED、CF_RETURNS_NOT_RETAINED（CF 版本）
```

### 5.2 `ns_consumed` / `ns_consumes_self`

```objc
// 告诉 ARC：参数被调用方消耗，调用方不需要 release
- (void)takeOwnership:(id)obj __attribute__((ns_consumed));

// self 被消耗（类似 init 的 self = [super init] 中的赋值）
- (instancetype)init __attribute__((ns_consumes_self));
```

### 5.3 `objc_precise_lifetime` —— 精确生命周期

```objc
// 防止 ARC 在你需要之前提前释放
- (void)usePointerToWeakObject {
    __weak id weakObj = self.obj;
    __attribute__((objc_precise_lifetime)) id strongObj = self.obj;
    // strongObj 保证在整个作用域存活，不会被提前优化释放

    // 如果不用这个属性，ARC 可能在使用 strongObj 之前就释放了
    // 但 strongObj 的 retain 已经在这里了... 实际场景是配合 cleanup 使用
}

// 更实际的场景：配合 cleanup 使用
__attribute__((objc_precise_lifetime))
__strong NSObject *precise __attribute__((cleanup(myCleanup))) = [NSObject new];
// 保证 cleanup 回调中 precise 仍然有效
```

### 5.4 `cleanup` 回顾（与 ARC 的交互）

`cleanup` 是 ARC 实现的核心机制。当你写：

```objc
{
    __strong NSObject *obj = [NSObject new];
} // 这里自动 release
```

编译器实际生成的代码等价于：

```c
{
    __strong NSObject *obj __attribute__((cleanup(__strong_objc_release))) = [NSObject new];
}
// __strong_objc_release 是 runtime 内部函数
```

同样，`__weak` 的实现依赖更复杂的 cleanup 函数 来操作 side table。

---

## 6. 编译器警告与检查

### 6.1 `warn_unused_result` —— 未使用返回值警告

```objc
// Swift 5 开始默认禁止忽略返回值，ObjC 需要手动标记
- (instancetype)init __attribute__((warn_unused_result));
- (BOOL)trySomething __attribute__((warn_unused_result));

// Swift 中：
//    func trySomething() -> Bool   这种写法本身就要求使用返回值
// 但加了这个属性的 ObjC 方法导入 Swift 后会变成：
//    @discardableResult func trySomething() -> Bool  的反面
//    即强制使用返回值
```

### 6.2 `format` —— 格式字符串检查

```c
// 类似 NSLog/printf 的格式字符串检查
void LogMessage(NSString *format, ...)
    __attribute__((format(__NSString__, 1, 2)));
//                          ^         ^  ^
//                          格式风格   格式字符串是第1个参数  可变参数从第2个开始

LogMessage(@"Count: %d", @"not a number");
// ⚠️ warning: format specifies type 'int' but the argument has type 'NSString *'

LogMessage(@"Count: %d");  // 漏参数
// ⚠️ warning: more '%' conversions than data arguments

LogMessage(@"Count: %d, Name: %@", 42, @"Test");
// ✅ 正确
```

支持的格式风格：`printf`、`scanf`、`__NSString__`、`strftime` 等。

### 6.3 `nonnull` / `nullable` 兼容写法

```c
// 老式写法（现在应该用 _Nonnull/_Nullable 了，但了解原理有用）
void process(NSString *str) __attribute__((nonnull(1)));
// 第 1 个参数不能为 nil

void transfer(NSString *from, NSString *to) __attribute__((nonnull));
// 所有指针参数都不能为 nil

// 现代写法（等价）：
void process(NSString * _Nonnull str);
void transfer(NSString * _Nonnull from, NSString * _Nonnull to);
```

### 6.4 `sentinel` —— 哨兵参数检查

```c
// 参数列表必须以 nil 结尾
+ (instancetype)arrayWithObjects:(id)first, ...
    __attribute__((sentinel));

// 调用时必须 nil 结尾
NSArray *arr = [NSArray arrayWithObjects:@1, @2, @3, nil];  // ✅
NSArray *bad = [NSArray arrayWithObjects:@1, @2, @3];       // ⚠️ warning: missing sentinel

// 指定哨兵值（默认 0 / nil）
void addStrings(const char *first, ...)
    __attribute__((sentinel("__END__")));
addStrings("hello", "world", "__END__");  // 自定义哨兵
```

### 6.5 `unavailable` —— 标记 API 不可用

```objc
// 老 API 标记不可用，给出迁移提示
- (void)oldMethod __attribute__((unavailable("请使用 newMethod 替代")));

// NS_UNAVAILABLE 的底层
+ (instancetype)new __attribute__((unavailable));

// 条件不可用（新版 availability 宏的底层）
- (void)iOSOnlyMethod
    __attribute__((availability(ios, introduced=14.0, deprecated=15.0)));
```

### 6.6 `deprecated` —— 标记 API 废弃

```objc
- (void)legacyAPI
    __attribute__((deprecated("在 v3.0 废弃，使用 modernAPI 替代")));
```

### 6.7 `overloadable` —— C 函数重载

```c
// Clang 扩展：C 语言函数重载（不是 C++！）
void printValue(int x) __attribute__((overloadable)) {
    printf("int: %d\n", x);
}

void printValue(float x) __attribute__((overloadable)) {
    printf("float: %f\n", x);
}

void printValue(NSString *str) __attribute__((overloadable)) {
    NSLog(@"string: %@", str);
}

printValue(42);          // → int: 42
printValue(3.14f);       // → float: 3.140000
printValue(@"Hello");    // → string: Hello
```

### 6.8 `enable_if` —— 编译时条件检查

```c
// 编译时静态检查参数
void resize(int width, int height)
    __attribute__((enable_if(width > 0 && height > 0, "尺寸必须为正数")));

resize(100, 200);  // ✅
resize(0, 200);    // ❌ error: 尺寸必须为正数
```

---

## 7. 性能优化

### 7.1 `objc_direct` / `objc_direct_members` 回顾

见 [3.4 节](#34-objc_direct--objc_direct_members--直接派发跳过-runtime)，这是 ObjC 层面最重要的性能属性。

### 7.2 `always_inline` —— 强制内联

```c
// 强制编译器内联，即使在 Debug 模式下
static inline int add(int a, int b) __attribute__((always_inline));
static inline int add(int a, int b) {
    return a + b;
}

// Swift 中的 @inline(__always) 编译属性对应这个行为
// Swift:
//    @inline(__always)
//    func add(_ a: Int, _ b: Int) -> Int { a + b }
```

### 7.3 `noinline` —— 禁止内联

```c
// 配合调试、性能分析使用
__attribute__((noinline))
void expensiveFunction(void) {
    // 即使是 static 且只调用一次，编译器也不内联
}
```

### 7.4 `cold` / `hot` —— 冷热代码提示

```c
// cold：告诉编译器这个分支几乎不会执行→优化热路径
__attribute__((cold))
void handleFatalError(const char *msg) {
    // 错误处理、异常路径
}

// hot：告诉编译器这个函数非常频繁调用→更激进的优化
__attribute__((hot))
void renderFrame(void) {
    // 每帧都调用的渲染函数
}

// 应用：断言失败路径
#define MY_ASSERT(cond) \
    do { \
        if (__builtin_expect(!(cond), 0))  /* likely 的底层实现 */ \
            handleFatalError(#cond); \
    } while(0)
```

### 7.5 `pure` / `const` —— 纯函数标记

```c
// pure：结果只依赖参数和全局变量，无副作用（可以 CSE 优化）
__attribute__((pure))
int square(int x) {
    return x * x;
}

// 编译器可以将 square(5) + square(5) 优化为 2 * square(5)

// const：比 pure 更严格——结果只依赖参数，连全局变量都不读
__attribute__((const))
double sinDegrees(double degrees) {
    return sin(degrees * M_PI / 180.0);
}

// 同一参数多次调用可能被优化为只调一次
```

### 7.6 `malloc` —— 返回值不别名其他指针

```c
__attribute__((malloc))
void *myAllocator(size_t size);

// 编译器知道返回值不会和任何已存在的指针指向同一地址
// 可以做更激进的别名分析优化
```

---

## 8. 内联与调用约定

### 8.1 `flatten` —— 强制内联所有被调用者

```c
// 把这个函数体内调用的所有函数都内联进来
__attribute__((flatten))
void criticalPath(void) {
    helper1();  // 被内联
    helper2();  // 被内联
    helper3();  // 被内联
}
// 注意：只影响这个函数内 call 的，不影响外部对这个函数的调用
```

### 8.2 `no_stack_protector` —— 禁用栈保护

```c
// leaf 函数（不调用其他函数）可以放心禁用
__attribute__((no_stack_protector))
int trivialLeaf(int x) {
    return x + 1;
}
// 减少函数 prologue/epilogue 开销
```

### 8.3 `naked` —— 裸函数

```c
// 编译器不生成 prologue/epilogue，完全由你手写汇编
__attribute__((naked))
void trampoline(void) {
    __asm__ volatile(
        "mov x0, x1\n"
        "b   _real_target\n"
    );
}
// ⚠️ 极度危险，只在系统编程 / 越狱开发中使用
```

### 8.4 `disable_tail_calls` —— 禁止尾调用优化

```objc
// 调试时用，保留栈帧
__attribute__((disable_tail_calls))
- (void)recursiveMethod {
    // ...
    [self recursiveMethod];  // 不会被优化成跳转，保证栈回溯完整
}
```

---

## 9. 可见性与符号控制

### 9.1 `visibility` —— 符号可见性

```c
// 隐藏符号（不导出，类似 Swift 的 internal/fileprivate）
__attribute__((visibility("hidden")))
void internalFunction(void);

// 默认（导出符号）
__attribute__((visibility("default")))
void publicFunction(void);

// 保护（类似 default 但在动态库中有细微差别）
__attribute__((visibility("protected")))
void semiPublicFunction(void);

// 实际场景：库的内部函数全部 hidden
#define LIB_INTERNAL __attribute__((visibility("hidden")))
LIB_INTERNAL void parseInternal(void);  // 不会出现在 dylib 的导出表
```

### 9.2 `used` —— 防止被优化删除

```c
// 编译器认为没用的变量/函数，强制保留
__attribute__((used))
static int debugFlag = 1;

__attribute__((used))
static void crashReporterInit(void) {
    // 即使没有任何地方显式调用，也不被 LTO 删除
}
```

### 9.3 `retain` / `unused`

```c
// used 的超集——连链接器都不能删除（used 只防编译器）
__attribute__((retain))
static void *handlerTable[] = { ... };

// 标记"我知道没用到，别警告"
__attribute__((unused))
static int placeholder;  // 不产生 unused variable 警告
```

### 9.4 `alias` —— 符号别名

```c
// 创建一个函数的别名（同地址）
void realImplementation(void) { }
void publicName(void) __attribute__((alias("realImplementation")));

// system framework 用这个做 API 版本迁移
// 例如原来的函数名 -> 新函数名用 alias 指向同一个实现
```

### 9.5 `weak_import` —— 弱引用符号

```objc
// ⚠️ 注意区分 __attribute__((weak_import)) 和 __weak
// 完全不同的东西！

// weak_import：符号可以不存在（运行时检查）
extern int SomeFunction(void) __attribute__((weak_import));

if (SomeFunction != NULL) {
    SomeFunction();  // 如果符号不存在就不调用
}

// 经典场景：使用新版本 iOS API，同时兼容旧版本
if (@available(iOS 15.0, *)) {
    // 符号保证存在
} else {
    // 编译时不报错，但运行时这个符号就是 NULL
}
```

---

## 10. 类型布局与对齐

### 10.1 `aligned` —— 指定对齐

```c
// 16 字节对齐（常用于 SIMD 向量化）
typedef struct __attribute__((aligned(16))) {
    float x, y, z, w;
} Vec4 SIMD_ALIGNED;

// 64 字节对齐（缓存行对齐，避免 false sharing）
__attribute__((aligned(64)))
static int perThreadCounter[4];  // 每个 int 独立缓存行

// 最大对齐
__attribute__((aligned))  // 即 aligned(sizeof(double)) 或更高的平台默认
struct MaxAligned {
    char c;
};
```

### 10.2 `packed` —— 紧凑布局

```c
// 取消对齐填充，节省内存
typedef struct __attribute__((packed)) {
    uint8_t  type;     // 1 byte
    uint32_t value;    // 4 bytes（正常会填充 3 字节对齐）
    uint16_t flag;     // 2 bytes
} CompactHeader;       // 总共 7 bytes，而非 12 bytes

// ⚠️ 代价：非对齐访问在某些架构会崩溃 / 性能下降
// 适用场景：网络协议解析、文件格式解析
```

### 10.3 `transparent_union` —— 透明联合体

```c
// 让 union 在参数传递时自动转换
typedef union __attribute__((transparent_union)) {
    int    *i;
    float  *f;
} IntOrFloat;

void process(IntOrFloat value);

int i = 42;
float f = 3.14;
process(&i);   // 自动匹配
process(&f);   // 自动匹配
// 不需要 process((IntOrFloat){.i = &i})
```

### 10.4 `enum_extensibility` —— 枚举可扩展性

```objc
// 告诉编译器这个枚举可能有未来的值（switch 会警告）
typedef NS_ENUM(NSInteger, ConnectionState) {
    ConnectionStateDisconnected,
    ConnectionStateConnecting,
    ConnectionStateConnected,
} __attribute__((enum_extensibility(open)));

// 效果：switch 覆盖了所有 case 仍会警告建议加 default
// Swift 中对应 @frozen vs non-frozen enum
```

---

## 11. 系统框架中的实际使用案例

### 11.1 Foundation 内部一览

```objc
// NSObject.h 的实际片段
__attribute__((objc_root_class))
@interface NSObject <NSObject> {
    Class isa  OBJC_ISA_AVAILABILITY;
}

// NSProxy.h
__attribute__((objc_root_class))
@interface NSProxy <NSObject> {
    Class isa;
}
```

### 11.2 AFNetworking 的用法

```objc
// AFHTTPSessionManager.h
__attribute__((objc_subclassing_restricted))
@interface AFHTTPSessionManager : NSObject

// AFURLSessionManager.m
__attribute__((objc_direct_members))
@implementation AFURLSessionManager
// 内部所有方法都是 direct dispatch，性能优化
@end
```

### 11.3 SDWebImage 的用法

```objc
__attribute__((objc_subclassing_restricted))
@interface SDWebImageManager : NSObject

// 内部大量使用 objc_direct 减少运行时开销
```

### 11.4 系统通知注册的 constructor 模式

```objc
// 很多 SDK 用 constructor 注册自己
__attribute__((constructor))
static void initializeAnalyticsSDK(void) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [AnalyticsSDK startWithConfig:defaultConfig];
    });
}
```

### 11.5 Swift 编译器对 `swift_name` 的使用

Swift 编译器为每个 `@objc` 类自动生成 `swift_name` 属性，确保 Swift 侧的 API 看起来符合 Swift 命名规范。你可以在 `.swiftinterface` 文件中看到大量自动生成的 `__attribute__((swift_name(...)))`。

---

## 12. 注意事项与最佳实践

### 12.1 跨平台兼容性

```c
// ⚠️ 很多属性是 Clang/LLVM 扩展，不保证 GCC 支持
#if defined(__clang__)
    #define OBJC_DIRECT __attribute__((objc_direct))
#else
    #define OBJC_DIRECT
#endif
```

### 12.2 Debug vs Release 行为差异

```
属性              Debug 行为              Release 行为
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
always_inline    不内联（默认 -O0）      强制内联
noinline         不内联                   不内联
cold             无影响                   代码移出热路径
hot              无影响                   更激进优化
```

### 12.3 `constructor` 优先级的坑

```c
// 优先级范围：1~65535
// 1~100：系统保留（dyld/libSystem 内部使用）
// 100+: 应用可用

__attribute__((constructor(101)))  // ✅ 安全
__attribute__((constructor(1)))    // ⚠️ 可能与系统冲突

// destructor 优先级数字越大越先执行（和 constructor 相反！）
__attribute__((constructor(101)))  // 先构造
__attribute__((constructor(200)))  // 后构造

__attribute__((destructor(101)))   // 后析构
__attribute__((destructor(200)))   // 先析构  ← 注意反过来了！
```

### 12.4 `cleanup` 与异常安全

```objc
// cleanup 是 ObjC/C++ 异常安全的
// 即使抛出异常，作用域内的 cleanup 变量也会被调用

- (void)riskyOperation {
    __strong NSObject *obj __attribute__((cleanup(cleanupFunc))) = [NSObject new];

    @try {
        // ...
        @throw [NSException exceptionWithName:@"Error" reason:nil userInfo:nil];
    } @catch (NSException *e) {
        // cleanupFunc 已经被调用了！
    }
}
```

### 12.5 不要滥用 `objc_direct`

```objc
// ❌ 错误：用于公开 API
- (void)publicMethod __attribute__((objc_direct));
// Category 无法覆盖，KVO 不可用

// ✅ 正确：内部私有方法
- (void)_internalCalculation __attribute__((objc_direct));
```

### 12.6 `objc_subclassing_restricted` 的替代方案

```objc
// Swift 中直接 final class —— 无需 attribute
final class MyManager { }

// ObjC 中如果需要 Swift 也能约束：
__attribute__((objc_subclassing_restricted))
@interface MyManager : NSObject
@end
```

### 12.7 与 Swift 属性的对照表

```
ObjC __attribute__                  Swift 等价写法
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
objc_subclassing_restricted         final class
objc_designated_initializer         语言级别指定初始化器
objc_requires_super                 需要手动调用 super（无编译检查）
always_inline                       @inline(__always)
noinline                            @inline(never)
warn_unused_result                  默认行为（返回值不可忽略）
deprecated                          @available(*, deprecated)
unavailable                         @available(*, unavailable)
used                                无（编译器自动处理）
pure / const                        无直接等价（编译器自动推断）
cleanup                             defer 语句
constructor                         无直接等价（用 lazy var 或 init）
visibility("hidden")                internal / fileprivate
```

---

## 参考资源

- [Clang Language Extensions](https://clang.llvm.org/docs/LanguageExtensions.html)
- [Objective-C Feature Availability Index](https://clang.llvm.org/docs/ObjectiveCLiterals.html)
- [LLVM Attribute Reference](https://llvm.org/docs/LangRef.html#attributes)
- Apple 源码：[swift-corelibs-foundation](https://github.com/apple/swift-corelibs-foundation)
- [NSHipster: `__attribute__`](https://nshipster.com/__attribute__/)

---

> 写于 2026-07-01 · 孙亚洲 · [sunyazhou.com](https://sunyazhou.com)

