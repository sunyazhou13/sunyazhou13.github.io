---
layout: post
title: A Set of Efficient iOS Interview Questions from Alibaba and Bytedance — Runtime Related Questions Part 3
date: 2020-08-31 16:52:25
categories: [iOS, 系统理论实践]
tags: [Algorithm, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

![i OS Interview Questions Album Cover](/assets/images/20200721iOSinterviewAnswers/iOSInterviewQuestionsAlbumCover.avif)

# Preface

This article has a strong personal flavor; if it makes you uncomfortable, please close it right away. This article is only for personal study notes. You're welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for the support!

# Runtime Related Questions — Memory Part: Associated Properties or Method Swizzle Hooks

Following the previous two posts, this time we'll talk about the remaining memory questions, which mainly include:

1. `Method Swizzle` caveats
2. How is the property modifier `atomic` implemented internally? Can it guarantee thread safety?
3. What are the introspection methods in iOS? What are their internal implementation principles?
4. What's the difference between `class`, `objc_getClass`, and `object_getclass`?

## `Method Swizzle` Caveats

1. **Be aware of the side effects after swapping method implementations** — `method_exchangeImplementations()`. The swapped methods end up being called via `objc_msgSend()`, and the side effects are mainly concentrated in the first argument, as shown in the following example:

	``` objc
	objc_msgSend(payment, @selector(quantity))
	```
	After the swap, calling the quantity method again may crash. The way to solve this side effect is to use `method_setImplementation()` instead of the swapping approach — that's the most reasonable. For the specific principle, refer to Objc black magic — some caveats of Method Swizzle  

2. **Avoid swapping parent class methods** 

	If the current class doesn't implement the method being swapped but its parent class does, then the parent's implementation gets swapped. If multiple subclasses of this parent class all swap, repeated swapping causes chaos. Also, calling the parent class method may crash because the method signature can't be found.  
	So before swapping, you should always check whether you can add a new implementation IMP for the method being swapped to the current class. This process is roughly divided into 3 steps:
	
	* `class_addMethod` — check whether the method can be added
		``` objc
		BOOL class_addMethod(Class cls, SEL name, IMP imp, const char *types)
		```
		
		> Adds an implementation IMP for the SEL on class cls. Returning YES indicates that class cls did not implement this method; returning NO indicates the class already implemented it. Note: whether the addition succeeds is entirely determined by the class itself and has nothing to do with whether the parent class has this method.
	* `class_replaceMethod` — replace the implementation of SEL name on class cls with imp
		``` objc
			class_replaceMethod(Class _Nullable cls, SEL _Nonnull name, IMP _Nonnull imp, 
                    const char * _Nullable types)	
		```
		
	* `method_exchangeImplementations` — the final method swap
		``` objc
		method_exchangeImplementations(Method _Nonnull m1, Method _Nonnull m2) 
		```
3. The swap should be done in the +load method  
	
	As covered earlier when talking about message forwarding, +load is not implemented via message forwarding, and it's called when the class is loaded during runtime initialization. Moreover, the parent class, current class, categories, subclasses, etc., all get called once. So this is the most suitable place for writing method swap hooks (Method Swizzle).

4. Category methods being swapped should have a custom prefix to avoid conflicts
	
	There's no doubt about this: when method names are the same, category methods override methods with the same name in the class.

[Points you should note about method swizzling](https://blog.csdn.net/weixin_34168700/article/details/88762738)

	
## How is the property modifier atomic implemented internally? Can it guarantee thread safety?

### Internal implementation of atomic

``` objc
id objc_getProperty(id self, SEL _cmd, ptrdiff_t offset, BOOL atomic) {
    ...
    id *slot = (id*) ((char*)self + offset);
    if (!atomic) return *slot;  
    // Atomic retain release world
    spinlock_t& slotlock = PropertyLocks[slot];
    slotlock.lock();
    id value = objc_retain(*slot);
    slotlock.unlock();
    return objc_autoreleaseReturnValue(value);
}
```
``` objc
static inline void reallySetProperty(id self, SEL _cmd, id newValue, ptrdiff_t offset, bool atomic, bool copy, bool mutableCopy)
{
    ...
    if (!atomic) {
        oldValue = *slot;
        *slot = newValue;
    } else {
        spinlock_t& slotlock = PropertyLocks[slot];
        slotlock.lock();
        oldValue = *slot;
        *slot = newValue;        
        slotlock.unlock();
    }
    objc_release(oldValue);
}
```

`property`'s `atomic` is implemented with the `spinlock_t` spinlock.

### Can it guarantee thread safety?
 
`atomic` works this way. At runtime, it only guarantees the atomicity of the `set` and `get` methods. So using atomic does not guarantee thread safety.

## What are the introspection methods in iOS? What are their internal implementation principles?

First, let's understand the term `introspection` — self-examination, introspection. In iOS development, we also call it reflection.

Introspection methods, such as the commonly used `isKindOfClass:` in `NSObject`, judge the `class` through an instance object — that's one kind of introspection or reflection method. But I think `NSClassFromString()` should also count as a reflection method.

### Introspection methods in iOS

Let's look at NSObject.h:

``` objc
- (BOOL)isKindOfClass:(Class)aClass; //判断是否是这个类或者这个类的子类的实例
- (BOOL)isMemberOfClass:(Class)aClass; //判断是否是这个类的实例
- (BOOL)conformsToProtocol:(Protocol *)aProtocol;  //判断是否遵守某个协议
+ (BOOL)conformsToProtocol:(Protocol *)protocol; //判断某个类是否遵守某个协议
- (BOOL)respondsToSelector:(SEL)aSelector;  //判读实例是否有这样方法
+ (BOOL)instancesRespondToSelector:(SEL)aSelector; //判断类是否有这个方法
...
```
### Internal implementation principles

1. `isKindOfClass:`  

``` objc
+ (BOOL)isKindOfClass:(Class)cls {
    for (Class tcls = self->ISA(); tcls; tcls = tcls->superclass) {
        if (tcls == cls) return YES;
    }
    return NO;
}
	
- (BOOL)isKindOfClass:(Class)cls {
    for (Class tcls = [self class]; tcls; tcls = tcls->superclass) {
        if (tcls == cls) return YES;
    }
    return NO;
}
```
The class method uses the ISA() function to get the isa pointer to the metaclass, then does a bitwise AND with the relevant mask on the stored isa data address bits to determine whether the current class is a subclass of the given class.  
The instance method uses the `objc_object::getIsa()` function to get the class corresponding to the isa via the stored `tag_ext` table, then walks the class chain to check.

2. `isMemberOfClass:`

``` objc
+ (BOOL)isMemberOfClass:(Class)cls {
    return self->ISA() == cls;
}

- (BOOL)isMemberOfClass:(Class)cls {
    return [self class] == cls;
}
```

These two methods are very simple and direct — just get the isa pointer and compare.

3. `conformsToProtocol:`

``` objc
+ (BOOL)conformsToProtocol:(Protocol *)protocol {
    if (!protocol) return NO;
    for (Class tcls = self; tcls; tcls = tcls->superclass) {
        if (class_conformsToProtocol(tcls, protocol)) return YES;
    }
    return NO;
}

- (BOOL)conformsToProtocol:(Protocol *)protocol {
    if (!protocol) return NO;
    for (Class tcls = [self class]; tcls; tcls = tcls->superclass) {
        if (class_conformsToProtocol(tcls, protocol)) return YES;
    }
    return NO;
}
```

Both methods ultimately get the relevant protocols via isa->data()->protocols, then check whether the protocol exists.  
Here's the code:

``` objc
BOOL class_conformsToProtocol(Class cls, Protocol *proto_gen)
{
    protocol_t *proto = newprotocol(proto_gen);  
    if (!cls) return NO;
    if (!proto_gen) return NO;
    mutex_locker_t lock(runtimeLock);
    checkIsKnownClass(cls);
    ASSERT(cls->isRealized())
    for (const auto& proto_ref : cls->data()->protocols) {
        protocol_t *p = remapProtocol(proto_ref);
        if (p == proto || protocol_conformsToProtocol_nolock(p, proto)) {
            return YES;
        }
    }
    return NO;
}
```
> Here you can clearly see the for loop taking out the relevant protocol pointers, then comparing them with the `proto` generated from the passed-in parameter.

4. `respondsToSelector:`

``` objc
+ (BOOL)respondsToSelector:(SEL)sel {
    return class_respondsToSelector_inst(self, sel, self->ISA());
}

- (BOOL)respondsToSelector:(SEL)sel {
    return class_respondsToSelector_inst(self, sel, [self class]);
}
```

This source code is a bit complicated, so I'll briefly explain: the call stack is actually quite deep — it keeps looking up which methods the current instance can respond to. If the current class doesn't have it, it goes to the parent class; if the parent class doesn't have it either, it continues up to the metaclass.

``` sh
respondsToSelector:
	|__ class_respondsToSelector_inst()
		|__ lookUpImpOrNil()
			|__ lookUpImpOrForward()
				返回IMP结果
```

That's the whole message forwarding process, which I won't elaborate on here. If you're interested, take a look at the message forwarding part of [Chapter 2](https://www.sunyazhou.com/2020/08/iOSinterviewAnswers2/).

I've listed some commonly used introspection methods above. The other methods basically have nothing special — they all get the isa and perform various internal operations on functions that fetch the relevant attributes and return the result.

## What's the difference between `class`, `objc_getClass`, and `object_getclass`?

I casually created a demo in Xcode to print the contents of a view controller.

``` objc
@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    Class cls1 = [self class];
    Class cls2 = object_getClass(cls1);
    Class cls3 = objc_getClass(object_getClassName([self class]));
    NSLog(@"%p",cls1);
    NSLog(@"%p",cls2);
    NSLog(@"%p",cls3);
}
@end
```
Output:

``` sh
2020-08-31 16:15:48.150285+0800 ClassDemo[5582:55836] 0x10205b3b0
2020-08-31 16:15:48.150456+0800 ClassDemo[5582:55836] 0x10205b3d8
2020-08-31 16:15:48.150575+0800 ClassDemo[5582:55836] 0x10205b3b0
```

Let me briefly list a table:

|  | `class` | `object_getclass()`  | `objc_getClass()` |
| :-----: | :-----: | :-----: | :-----: |
| Passed-in argument | N/a | id type  | string of the class name |
| Operated object | obj | the Class pointed to by this id's isa pointer | the class object of this class |
| On an instance object | same as `object_getclass()` | same as `class` | N/a |
| On a class object/metaclass object | returns the message object itself | returns the next object  | N/a |

> Reason: because class returns self, while object_getClass returns the object that isa points to.

# Summary

That's the remaining memory part of "a set of efficient iOS interview questions — my compiled answers — runtime related questions part 3". Although the answers are short, each question is spot on. Next time, we'll talk about the notification part and try to compile the answers to all the questions as quickly as possible.

[Reference](https://www.codenong.com/cs106358283/)
