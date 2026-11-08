---
layout: post
title: The Complete Guide to LLVM `__attribute__`
date: 2026-07-01 02:58 +0000
categories: [iOS, SwiftUI]
tags: [skills, iOS, Swift, Objective-C, LLVM]
typora-root-url: ..
math: false
mermaid: false

---

# Preface

This article is highly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. Reposts and sharing are welcome within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


---

## The Complete Guide to LLVM `__attribute__` — A Required Course for iOS / macOS Developers

> Covers Objective-C, C, and Swift interop scenarios, from the basics to internal system-framework usage, trying not to miss any detail.

---

## Table of Contents

1. [What is `__attribute__`](#1-what-is-__attribute__)
2. [Before/After Function Calls: constructor / destructor / cleanup](#2-beforeafter-function-calls-constructor--destructor--cleanup)
3. [ObjC-Specific Attributes](#3-objc-specific-attributes)
4. [Swift Interop](#4-swift-interop)
5. [Memory Management and ARC](#5-memory-management-and-arc)
6. [Compiler Warnings and Checks](#6-compiler-warnings-and-checks)
7. [Performance Optimization](#7-performance-optimization)
8. [Inlining and Calling Conventions](#8-inlining-and-calling-conventions)
9. [Visibility and Symbol Control](#9-visibility-and-symbol-control)
10. [Type Layout and Alignment](#10-type-layout-and-alignment)
11. [Real-World Usage Cases in System Frameworks](#11-real-world-usage-cases-in-system-frameworks)
12. [Caveats and Best Practices](#12-caveats-and-best-practices)

---

## 1. What is `__attribute__`

`__attribute__` is a language extension introduced by GCC, and LLVM/Clang is fully compatible with it and extends it heavily. It allows developers to pass additional semantic information to the compiler, affecting code generation, optimization, warnings, and runtime behavior.

```c
// Basic syntax
__attribute__((属性名))
__attribute__((属性名(参数列表)))
__attribute__((属性1, 属性2, ...))   // 逗号分隔多个属性
```

In ObjC, Apple wraps many attributes into friendlier macros:

```objc
#define NS_REQUIRES_SUPER   __attribute__((objc_requires_super))
#define NS_DESIGNATED_INITIALIZER __attribute__((objc_designated_initializer))
#define API_AVAILABLE(...)  __attribute__((availability(...)))
```

---

## 2. Before/After Function Calls: constructor / destructor / cleanup

This is the most easily overlooked but very powerful group of attributes — they let code run automatically before/after `main()`, or when a variable leaves its scope.

### 2.1 `constructor` — runs before `main()`

```c
// Default priority (later than +load, earlier than main())
__attribute__((constructor))
static void setupBeforeMain(void) {
    printf("1. 在 main() 之前运行\n");
}

// Specified priority (smaller number runs first, range 0~65535)
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
// Output order: 0 → 1 → 2 → 3
```

**ObjC scenario**: the `+load` method is not equivalent to `constructor`:

| Comparison | `+load` | `constructor` |
|--------|---------|---------------|
| Execution timing | When the class is loaded into the runtime | Slightly earlier than `main()` |
| Order controllable | ❌ | ✅ via priority numbers |
| Invoked by | ObjC Runtime | dyld loader |
| Supports plain C functions | ❌ | ✅ |

```objc
// Typical usage: register defaults / swizzle methods / initialize global state
__attribute__((constructor))
static void registerAnalyticsDefaults(void) {
    [[NSUserDefaults standardUserDefaults]
        registerDefaults:@{@"tracking_enabled": @YES}];
}

// You can even specify a priority for C++ static constructors
// (This is an LLVM-specific extension; GCC doesn't support constructor priorities for C++)
__attribute__((constructor(101)))
static void beforeAllCXXConstructors(void) {
    // Runs before C++ global objects are constructed
}
```

### 2.2 `destructor` — runs after `main()` returns / when `exit()` is called

```c
__attribute__((destructor))
static void cleanupAfterMain(void) {
    printf("5. main() 返回后自动调用\n");
}

__attribute__((destructor(101)))
static void earlyCleanup(void) {
    printf("4. 优先级 101 的析构先跑\n");
}
// Output order: after main ends → 4 → 5
// Note: the larger the destructor priority number, the earlier it runs (the opposite of constructor!)
```

**Common pitfalls**:
- `abort()` / `_exit()` don't trigger destructors
- Destruction order is the reverse of construction order
- Destructors may race during multithreaded exit, so try not to take locks inside them

### 2.3 `cleanup` — automatically called when a variable leaves scope

This is the mechanism that ARC's `__strong` / `__weak` rely on under the hood, and it's also often used to implement a Go-style `defer`:

```c
// The cleanup function signature: takes a pointer to the variable's type
static void stringCleanup(__strong NSString **ptr) {
    NSLog(@"即将销毁: %@", *ptr);
    *ptr = nil;  // ensure it gets released
}

static void fdCleanup(int *fd) {
    if (*fd > 0) {
        close(*fd);
        NSLog(@"关闭文件描述符: %d", *fd);
    }
}

void demoCleanup(void) {
    // Bind the cleanup function when declaring the variable
    __strong NSString *str __attribute__((cleanup(stringCleanup)));
    str = @"Hello";

    int fd __attribute__((cleanup(fdCleanup))) = open("/tmp/test.txt", O_RDONLY);

    // ... use str and fd ...

    // stringCleanup(&str) and fdCleanup(&fd) are called automatically when leaving scope
    // They're called even on an early return / break!
}
```

**A defer macro for ObjC** (implemented with cleanup):

```objc
// Define a defer block type
typedef void (^cleanup_block_t)(void);

static inline void defer_block_cleanup(cleanup_block_t *block) {
    if (*block) (*block)();
}

// Core macro: use cleanup to guarantee the block runs at the end of scope
#define defer __strong cleanup_block_t __attribute__((cleanup(defer_block_cleanup))) __cleanup_block = ^

// Usage
- (void)doSomething {
    defer {
        NSLog(@"无论如何都会执行——类似 Go 的 defer");
        [self unlock];
    };

    [self lock];
    // Complex logic...
    if (someError) return; // 也会触发 defer
    // ...
}
```

> **Note**: Swift's `defer` is a language-level feature and needs no black magic. The ObjC `defer` macro is just an imitation.

---

## 3. ObjC-Specific Attributes

### 3.1 `objc_subclassing_restricted` — forbid subclassing

```objc
__attribute__((objc_subclassing_restricted))
@interface AFHTTPSessionManager : NSObject
@end

// Equivalent to Swift's final class
// Compile-time check: any code that tries to inherit will error out
@interface MyManager : AFHTTPSessionManager  // ❌ Cannot subclass a class that was declared with objc_subclassing_restricted
@end
```

Libraries like AFNetworking and SDWebImage use it extensively to prevent inheritance abuse.

### 3.2 `objc_designated_initializer` — designated initializer

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

// Convenience initializers must call a designated initializer
- (instancetype)init {
    // If you don't call [self initWithFrame:], the compiler warns:
    // ⚠️ Convenience initializer missing a 'self' call to another initializer
    return [self initWithFrame:CGRectZero];
}

@end
```

Rules:
- Convenience initializers **must** call one of the class's designated initializers
- Subclasses must override **all** of the superclass's designated initializers (or disable them with `NS_UNAVAILABLE`)
- The `NS_DESIGNATED_INITIALIZER` macro is just a wrapper for this attribute

### 3.3 `objc_requires_super` — require calling super

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

**`NS_REQUIRES_SUPER` is essentially this attribute.** It's only a compile-time hint (warning), not a runtime enforcement.

### 3.4 `objc_direct` / `objc_direct_members` — direct dispatch, skipping the Runtime

> **This is a key attribute for modern ObjC performance optimization, supported in LLVM 11+.**

```objc
// Mark a single method as direct
- (int)fastFibonacci:(int)n __attribute__((objc_direct));

// Or mark an entire @implementation block
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

**What `objc_direct` does**:
- Callers jump directly to the function address (like a C function call), bypassing `objc_msgSend`
- Can't be accessed via `performSelector:` / KVO / Method Swizzling
- Can't be overridden by a Category
- The compiler can inline and optimize it
- Smaller binary size (saves the selector string)

```objc
// Counter-examples: these don't work on direct methods
[obj performSelector:@selector(increment)];           // ❌ 运行时找不到
[self methodForSelector:@selector(increment)];        // ❌ 返回 NULL
[MyClass aspect_hookSelector:@selector(increment)];   // ❌ 无法 Hook
```

**Recommendation**: use `objc_direct` for methods that are private, called frequently, and don't need dynamic features.

### 3.5 `objc_method_family` — specify the method family

```objc
// Tells the compiler which method family this method belongs to (affects ARC behavior)
- (instancetype)initWithDictionary:(NSDictionary *)dict
    __attribute__((objc_method_family(init)));

// Available method families:
// init, alloc, new, copy, mutableCopy

// For example: make a method that doesn't start with init be recognized by ARC as init-family
- (MyObject *)createObject __attribute__((objc_method_family(init)));
// ARC applies retain/release logic to its return value, similar to init behavior
```

### 3.6 `objc_boxable` — support boxing syntax

```objc
// Make a custom struct support the @(...) syntax
typedef struct __attribute__((objc_boxable)) {
    CGFloat width;
    CGFloat height;
} MySize;

MySize size = {100, 200};
NSValue *value = @(size);  // ✅ 合法

// System types like CGFloat, CGPoint, CGRect are all marked objc_boxable
```

### 3.7 `objc_root_class` — declaring a root class

```objc
__attribute__((objc_root_class))
@interface MyRootClass
@end

// Rarely used; usually only NSObject / NSProxy use this
```

### 3.8 `objc_runtime_name` — assign a runtime name to a class

```objc
// Compile-time name is MyClass, runtime name is _Internal_MyClass
__attribute__((objc_runtime_name("_Internal_MyClass")))
@interface MyClass : NSObject
@end

// The Swift compiler uses this heavily — to generate unique runtime names for @objc classes
// Regular developers basically never need it
```

### 3.9 `objc_externally_retained` — externally retained marker

```objc
// Tells ARC: this object is held externally, don't release it within this scope
UIView *view = _cachedView;
__attribute__((objc_externally_retained))
UIView *externalView = view;
// ARC won't insert a release afterwards
```

---

## 4. Swift Interop

### 4.1 `swift_name` — specify the Swift name for an ObjC API

This is the underlying implementation of the `NS_SWIFT_NAME` macro:

```objc
// Customize the function name in Swift
- (void)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
    __attribute__((swift_name("application(_:didFinishLaunchingWithOptions:)")));

// Method renaming (argument labels are renamed too)
- (void)handleURL:(NSURL *)url options:(NSDictionary *)options
    __attribute__((swift_name("handle(url:options:)")));

// Class renaming
__attribute__((swift_name("MyNewClassName")))
@interface OldObjCClassName : NSObject
@end

// Global variable / enum renaming
extern NSString * const kOldConstant
    __attribute__((swift_name("newConstantName")));

// Custom getter/setter
@property (nonatomic, readonly, getter=isEnabled) BOOL enabled
    __attribute__((swift_name("isFeatureEnabled")));
```

### 4.2 `swift_private` — hide from Swift

```objc
// The underlying implementation of NS_REFINED_FOR_SWIFT
__attribute__((swift_private))
- (void)internalSetup;

// Invisible in Swift; only ObjC can call it
// Use it with NS_REFINED_FOR_SWIFT for finer-grained API control
```

### 4.3 `swift_attr` — inject Swift attributes

```objc
// Add attributes to the generated Swift interface
__attribute__((swift_attr("@available(*, deprecated, message: \"Use newAPI instead\")")))
- (void)oldAPI;
```

---

## 5. Memory Management and ARC

### 5.1 `ns_returns_retained` / `ns_returns_not_retained` etc.

```objc
// CF-style manual memory management annotations (the underlying implementation)
- (id)newObject __attribute__((ns_returns_retained));
// The underlying implementation of NS_RETURNS_RETAINED

- (id)borrowedObject __attribute__((ns_returns_not_retained));
// Tells ARC the return value is a non-owning reference

// Corresponding macros: NS_RETURNS_RETAINED, NS_RETURNS_NOT_RETAINED
// And CF_RETURNS_RETAINED, CF_RETURNS_NOT_RETAINED (the CF versions)
```

### 5.2 `ns_consumed` / `ns_consumes_self`

```objc
// Tells ARC: the parameter is consumed by the callee; the caller doesn't need to release
- (void)takeOwnership:(id)obj __attribute__((ns_consumed));

// self is consumed (similar to the assignment in init's self = [super init])
- (instancetype)init __attribute__((ns_consumes_self));
```

### 5.3 `objc_precise_lifetime` — precise lifetime

```objc
// Prevents ARC from releasing early before you need it
- (void)usePointerToWeakObject {
    __weak id weakObj = self.obj;
    __attribute__((objc_precise_lifetime)) id strongObj = self.obj;
    // strongObj is guaranteed to stay alive for the entire scope and won't be released early via optimization

    // Without this attribute, ARC might release strongObj before it's used
    // But strongObj's retain is already here... the real scenario is using it together with cleanup
}

// A more practical scenario: combined with cleanup
__attribute__((objc_precise_lifetime))
__strong NSObject *precise __attribute__((cleanup(myCleanup))) = [NSObject new];
// Guarantees precise is still valid in the cleanup callback
```

### 5.4 `cleanup` revisited (interaction with ARC)

`cleanup` is the core mechanism of the ARC implementation. When you write:

```objc
{
    __strong NSObject *obj = [NSObject new];
} // 这里自动 release
```

The code the compiler actually generates is equivalent to:

```c
{
    __strong NSObject *obj __attribute__((cleanup(__strong_objc_release))) = [NSObject new];
}
// __strong_objc_release is an internal runtime function
```

Similarly, the `__weak` implementation relies on more complex cleanup functions to operate on the side table.

---

## 6. Compiler Warnings and Checks

### 6.1 `warn_unused_result` — warn on unused return values

```objc
// Since Swift 5, ignoring return values is forbidden by default; ObjC needs to mark it manually
- (instancetype)init __attribute__((warn_unused_result));
- (BOOL)trySomething __attribute__((warn_unused_result));

// In Swift:
//    func trySomething() -> Bool   — this kind of declaration inherently requires using the return value
// But an ObjC method with this attribute imported into Swift becomes:
//    the opposite of @discardableResult func trySomething() -> Bool
//    i.e. using the return value is mandatory
```

### 6.2 `format` — format string checking

```c
// Format string checking like NSLog/printf
void LogMessage(NSString *format, ...)
    __attribute__((format(__NSString__, 1, 2)));
//                          ^         ^  ^
//                       format style  format string is the 1st argument  variadic args start at the 2nd

LogMessage(@"Count: %d", @"not a number");
// ⚠️ warning: format specifies type 'int' but the argument has type 'NSString *'

LogMessage(@"Count: %d");  // 漏参数
// ⚠️ warning: more '%' conversions than data arguments

LogMessage(@"Count: %d, Name: %@", 42, @"Test");
// ✅ correct
```

Supported format styles: `printf`, `scanf`, `__NSString__`, `strftime`, etc.

### 6.3 `nonnull` / `nullable` compatible style

```c
// Old-style (you should use _Nonnull/_Nullable now, but understanding the principle is useful)
void process(NSString *str) __attribute__((nonnull(1)));
// The 1st argument can't be nil

void transfer(NSString *from, NSString *to) __attribute__((nonnull));
// None of the pointer arguments can be nil

// Modern style (equivalent):
void process(NSString * _Nonnull str);
void transfer(NSString * _Nonnull from, NSString * _Nonnull to);
```

### 6.4 `sentinel` — sentinel argument checking

```c
// The argument list must end with nil
+ (instancetype)arrayWithObjects:(id)first, ...
    __attribute__((sentinel));

// Must end with nil when calling
NSArray *arr = [NSArray arrayWithObjects:@1, @2, @3, nil];  // ✅
NSArray *bad = [NSArray arrayWithObjects:@1, @2, @3];       // ⚠️ warning: missing sentinel

// Specify the sentinel value (default 0 / nil)
void addStrings(const char *first, ...)
    __attribute__((sentinel("__END__")));
addStrings("hello", "world", "__END__");  // 自定义哨兵
```

### 6.5 `unavailable` — mark an API as unavailable

```objc
// Mark an old API as unavailable with a migration hint
- (void)oldMethod __attribute__((unavailable("请使用 newMethod 替代")));

// The underlying implementation of NS_UNAVAILABLE
+ (instancetype)new __attribute__((unavailable));

// Conditional unavailability (the underlying implementation of the newer availability macros)
- (void)iOSOnlyMethod
    __attribute__((availability(ios, introduced=14.0, deprecated=15.0)));
```

### 6.6 `deprecated` — mark an API as deprecated

```objc
- (void)legacyAPI
    __attribute__((deprecated("在 v3.0 废弃，使用 modernAPI 替代")));
```

### 6.7 `overloadable` — C function overloading

```c
// Clang extension: C function overloading (not C++!)
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

### 6.8 `enable_if` — compile-time conditional checking

```c
// Compile-time static checking of arguments
void resize(int width, int height)
    __attribute__((enable_if(width > 0 && height > 0, "尺寸必须为正数")));

resize(100, 200);  // ✅
resize(0, 200);    // ❌ error: 尺寸必须为正数
```

---

## 7. Performance Optimization

### 7.1 `objc_direct` / `objc_direct_members` revisited

See [Section 3.4](#34-objc_direct--objc_direct_members--direct-dispatch-skipping-the-runtime). This is the most important performance attribute at the ObjC level.

### 7.2 `always_inline` — force inlining

```c
// Force the compiler to inline, even in Debug mode
static inline int add(int a, int b) __attribute__((always_inline));
static inline int add(int a, int b) {
    return a + b;
}

// Swift's @inline(__always) compilation attribute corresponds to this behavior
// Swift:
//    @inline(__always)
//    func add(_ a: Int, _ b: Int) -> Int { a + b }
```

### 7.3 `noinline` — forbid inlining

```c
// Used with debugging and profiling
__attribute__((noinline))
void expensiveFunction(void) {
    // Even if it's static and called only once, the compiler won't inline it
}
```

### 7.4 `cold` / `hot` — hot and cold code hints

```c
// cold: tells the compiler this branch is rarely executed → optimize the hot path
__attribute__((cold))
void handleFatalError(const char *msg) {
    // Error handling, exception paths
}

// hot: tells the compiler this function is called very frequently → more aggressive optimization
__attribute__((hot))
void renderFrame(void) {
    // A rendering function called every frame
}

// Application: assertion failure paths
#define MY_ASSERT(cond) \
    do { \
        if (__builtin_expect(!(cond), 0))  /* likely 的底层实现 */ \
            handleFatalError(#cond); \
    } while(0)
```

### 7.5 `pure` / `const` — pure function markers

```c
// pure: the result only depends on arguments and global variables, with no side effects (allows CSE optimization)
__attribute__((pure))
int square(int x) {
    return x * x;
}

// The compiler can optimize square(5) + square(5) into 2 * square(5)

// const: stricter than pure — the result only depends on arguments, doesn't even read globals
__attribute__((const))
double sinDegrees(double degrees) {
    return sin(degrees * M_PI / 180.0);
}

// Multiple calls with the same arguments may be optimized to a single call
```

### 7.6 `malloc` — the return value doesn't alias other pointers

```c
__attribute__((malloc))
void *myAllocator(size_t size);

// The compiler knows the return value won't point to the same address as any existing pointer
// enabling more aggressive alias analysis optimizations
```

---

## 8. Inlining and Calling Conventions

### 8.1 `flatten` — force inlining of all callees

```c
// Inline every function called within this function's body
__attribute__((flatten))
void criticalPath(void) {
    helper1();  // 被内联
    helper2();  // 被内联
    helper3();  // 被内联
}
// Note: this only affects the calls inside this function; it doesn't affect external calls to this function
```

### 8.2 `no_stack_protector` — disable stack protection

```c
// Leaf functions (that don't call other functions) can safely disable it
__attribute__((no_stack_protector))
int trivialLeaf(int x) {
    return x + 1;
}
// Reduces function prologue/epilogue overhead
```

### 8.3 `naked` — naked functions

```c
// The compiler doesn't generate a prologue/epilogue; you write all the assembly yourself
__attribute__((naked))
void trampoline(void) {
    __asm__ volatile(
        "mov x0, x1\n"
        "b   _real_target\n"
    );
}
// ⚠️ Extremely dangerous; only used in system programming / jailbreak development
```

### 8.4 `disable_tail_calls` — disable tail call optimization

```objc
// For debugging, to keep the stack frames
__attribute__((disable_tail_calls))
- (void)recursiveMethod {
    // ...
    [self recursiveMethod];  // 不会被优化成跳转，保证栈回溯完整
}
```

---

## 9. Visibility and Symbol Control

### 9.1 `visibility` — symbol visibility

```c
// Hide the symbol (not exported, similar to Swift's internal/fileprivate)
__attribute__((visibility("hidden")))
void internalFunction(void);

// Default (exported symbol)
__attribute__((visibility("default")))
void publicFunction(void);

// Protected (similar to default but with subtle differences in dynamic libraries)
__attribute__((visibility("protected")))
void semiPublicFunction(void);

// Real-world scenario: hide all internal functions of a library
#define LIB_INTERNAL __attribute__((visibility("hidden")))
LIB_INTERNAL void parseInternal(void);  // 不会出现在 dylib 的导出表
```

### 9.2 `used` — prevent removal by optimization

```c
// Force the compiler to keep variables/functions it considers unused
__attribute__((used))
static int debugFlag = 1;

__attribute__((used))
static void crashReporterInit(void) {
    // Even if nothing calls it explicitly, LTO won't remove it
}
```

### 9.3 `retain` / `unused`

```c
// A superset of used — even the linker can't remove it (used only prevents the compiler from doing so)
__attribute__((retain))
static void *handlerTable[] = { ... };

// Marks "I know this is unused, don't warn"
__attribute__((unused))
static int placeholder;  // 不产生 unused variable 警告
```

### 9.4 `alias` — symbol aliases

```c
// Create an alias for a function (same address)
void realImplementation(void) { }
void publicName(void) __attribute__((alias("realImplementation")));

// System frameworks use this for API version migration
// e.g. the old function name -> new function name aliases to the same implementation
```

### 9.5 `weak_import` — weakly imported symbols

```objc
// ⚠️ Note the difference between __attribute__((weak_import)) and __weak
// They're completely different things!

// weak_import: the symbol may not exist (checked at runtime)
extern int SomeFunction(void) __attribute__((weak_import));

if (SomeFunction != NULL) {
    SomeFunction();  // 如果符号不存在就不调用
}

// Classic scenario: use a new iOS API while remaining compatible with older versions
if (@available(iOS 15.0, *)) {
    // the symbol is guaranteed to exist
} else {
    // No compile error, but at runtime this symbol is NULL
}
```

---

## 10. Type Layout and Alignment

### 10.1 `aligned` — specify alignment

```c
// 16-byte alignment (commonly used for SIMD vectorization)
typedef struct __attribute__((aligned(16))) {
    float x, y, z, w;
} Vec4 SIMD_ALIGNED;

// 64-byte alignment (cache-line alignment, to avoid false sharing)
__attribute__((aligned(64)))
static int perThreadCounter[4];  // 每个 int 独立缓存行

// Maximum alignment
__attribute__((aligned))  // 即 aligned(sizeof(double)) 或更高的平台默认
struct MaxAligned {
    char c;
};
```

### 10.2 `packed` — compact layout

```c
// Remove alignment padding to save memory
typedef struct __attribute__((packed)) {
    uint8_t  type;     // 1 byte
    uint32_t value;    // 4 bytes（正常会填充 3 字节对齐）
    uint16_t flag;     // 2 bytes
} CompactHeader;       // 总共 7 bytes，而非 12 bytes

// ⚠️ Trade-off: unaligned access can crash / degrade performance on some architectures
// Suitable scenarios: network protocol parsing, file format parsing
```

### 10.3 `transparent_union` — transparent union

```c
// Let a union convert automatically when passed as an argument
typedef union __attribute__((transparent_union)) {
    int    *i;
    float  *f;
} IntOrFloat;

void process(IntOrFloat value);

int i = 42;
float f = 3.14;
process(&i);   // 自动匹配
process(&f);   // 自动匹配
// No need for process((IntOrFloat){.i = &i})
```

### 10.4 `enum_extensibility` — enum extensibility

```objc
// Tells the compiler this enum may have future values (switch will warn)
typedef NS_ENUM(NSInteger, ConnectionState) {
    ConnectionStateDisconnected,
    ConnectionStateConnecting,
    ConnectionStateConnected,
} __attribute__((enum_extensibility(open)));

// Effect: even if switch covers all cases, it still warns suggesting adding a default
// In Swift this corresponds to @frozen vs non-frozen enums
```

---

## 11. Real-World Usage Cases in System Frameworks

### 11.1 A peek inside Foundation

```objc
// An actual fragment from NSObject.h
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

### 11.2 AFNetworking's usage

```objc
// AFHTTPSessionManager.h
__attribute__((objc_subclassing_restricted))
@interface AFHTTPSessionManager : NSObject

// AFURLSessionManager.m
__attribute__((objc_direct_members))
@implementation AFURLSessionManager
// All internal methods use direct dispatch, for performance
@end
```

### 11.3 SDWebImage's usage

```objc
__attribute__((objc_subclassing_restricted))
@interface SDWebImageManager : NSObject

// Internally uses objc_direct extensively to reduce runtime overhead
```

### 11.4 The constructor pattern for system notification registration

```objc
// Many SDKs register themselves with constructor
__attribute__((constructor))
static void initializeAnalyticsSDK(void) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [AnalyticsSDK startWithConfig:defaultConfig];
    });
}
```

### 11.5 The Swift compiler's use of `swift_name`

The Swift compiler automatically generates `swift_name` attributes for every `@objc` class, ensuring the Swift-side API follows Swift naming conventions. You can see many auto-generated `__attribute__((swift_name(...)))` in `.swiftinterface` files.

---

## 12. Caveats and Best Practices

### 12.1 Cross-platform compatibility

```c
// ⚠️ Many attributes are Clang/LLVM extensions; GCC support isn't guaranteed
#if defined(__clang__)
    #define OBJC_DIRECT __attribute__((objc_direct))
#else
    #define OBJC_DIRECT
#endif
```

### 12.2 Debug vs Release behavior differences

```
属性              Debug 行为              Release 行为
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
always_inline    不内联（默认 -O0）      强制内联
noinline         不内联                   不内联
cold             无影响                   代码移出热路径
hot              无影响                   更激进优化
```

### 12.3 Pitfalls of `constructor` priorities

```c
// Priority range: 1~65535
// 1~100: system reserved (used internally by dyld/libSystem)
// 100+: available to apps

__attribute__((constructor(101)))  // ✅ 安全
__attribute__((constructor(1)))    // ⚠️ 可能与系统冲突

// The larger the destructor priority number, the earlier it runs (the opposite of constructor!)
__attribute__((constructor(101)))  // 先构造
__attribute__((constructor(200)))  // 后构造

__attribute__((destructor(101)))   // 后析构
__attribute__((destructor(200)))   // 先析构  ← 注意反过来了！
```

### 12.4 `cleanup` and exception safety

```objc
// cleanup is exception-safe for ObjC/C++
// Even if an exception is thrown, cleanup variables in scope are still called

- (void)riskyOperation {
    __strong NSObject *obj __attribute__((cleanup(cleanupFunc))) = [NSObject new];

    @try {
        // ...
        @throw [NSException exceptionWithName:@"Error" reason:nil userInfo:nil];
    } @catch (NSException *e) {
        // cleanupFunc has already been called!
    }
}
```

### 12.5 Don't overuse `objc_direct`

```objc
// ❌ Wrong: used on a public API
- (void)publicMethod __attribute__((objc_direct));
// Categories can't override it, and KVO doesn't work

// ✅ Correct: internal private methods
- (void)_internalCalculation __attribute__((objc_direct));
```

### 12.6 Alternatives to `objc_subclassing_restricted`

```objc
// In Swift, just use final class — no attribute needed
final class MyManager { }

// In ObjC, if you also want to constrain Swift:
__attribute__((objc_subclassing_restricted))
@interface MyManager : NSObject
@end
```

### 12.7 Comparison table with Swift attributes

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

## Reference Resources

- [Clang Language Extensions](https://clang.llvm.org/docs/LanguageExtensions.html)
- [Objective-C Feature Availability Index](https://clang.llvm.org/docs/ObjectiveCLiterals.html)
- [LLVM Attribute Reference](https://llvm.org/docs/LangRef.html#attributes)
- Apple source: [swift-corelibs-foundation](https://github.com/apple/swift-corelibs-foundation)
- [NSHipster: `__attribute__`](https://nshipster.com/__attribute__/)

---

> Written on 2026-07-01 · Sun Yazhou · [sunyazhou.com](https://sunyazhou.com)
