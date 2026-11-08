---
layout: post
title: "Alibaba & ByteDance: An Efficient Set of iOS Interview Questions — Runtime Related Questions 1"
date: 2020-07-06 09:52:47
categories: [iOS, 系统理论实践]
tags: [Algorithm, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

![i OS Interview Questions Album Cover](/assets/images/20200721iOSinterviewAnswers/iOSInterviewQuestionsAlbumCover.avif)

# Preface

> This post carries a strong personal flavor — if it makes you uncomfortable, please close it quickly. This article is only for personal study notes, but you're welcome to repost or share it within the scope of the license agreement. Please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


I remember during the Spring Festival that a set of interview questions from [a WeChat official account](https://mp.weixin.qq.com/s/bDnsaD__ZpdHIk3_So382w) caught my attention, but it only had questions without answers. Since I've been so busy over the past half year that my blog was almost dormant for a quarter, today I plan to organize the answers to these interview questions, so that iOS developers can refer to them when needed. If any explanation is unclear or incorrect, please point it out.


# Structure and Breakdown of the Interview Questions

* Runtime-related questions
	1. Runtime structural model
	2. Memory management
	3. Associated objects or hook-related Method Swizzling
* NSNotification-related
	1. Refer to the GNUStep source code
	2. NSNotification implementation principles
* Runloop & KVO
	1. Runloop
	2. KVO
* Block
	1. Block implementation principles and cautions
* Multithreading
	1. GCD-related and other multithreading concepts
* Views & Images
	1.  View UI layout solutions
	2. View rendering
* Performance optimization
* Development certificates
* Architecture design
	1. Various design patterns
	2. One's own designs
* Other questions
	1. Method invocation and aspect-oriented programming, etc.
* System fundamentals
* Data structures and algorithms


## Runtime-related Questions

[objc-runtime source code](https://github.com/RetVal/objc-runtime)   
[Official objc4 source code](https://opensource.apple.com/tarballs/objc4/)

### Structural Model

#### Describe the runtime memory model (isa, objects, classes, metaclasses, struct storage information, etc.)

##### Objects

An object in Objective-C is a pointer to an `objc_object`, `typedef struct objc_object *id;` As can be seen from its struct, it contains an isa pointer that points to the class object of this object. An object instance finds its own Class through this isa, and this Class stores the instance's method list, property list, ivar list, and other related information.

``` objc
/// Represents an instance of a class.
struct objc_object {
    Class _Nonnull isa  OBJC_ISA_AVAILABILITY;
};

/// A pointer to an instance of a class.
typedef struct objc_object *id;
```
The objc_object implementation is quite long; [view it here](https://github.com/RetVal/objc-runtime/blob/master/runtime/objc-private.h)

#### Classes

A class in Objective-C is represented by Class, which is actually a pointer to an `objc_class`: `typedef struct objc_class *Class;`  
Here's the corresponding struct:

``` objc
struct objc_class {
    Class _Nonnull isa  OBJC_ISA_AVAILABILITY;

#if !__OBJC2__
    Class _Nullable super_class                              OBJC2_UNAVAILABLE;
    const char * _Nonnull name                               OBJC2_UNAVAILABLE;
    long version                                             OBJC2_UNAVAILABLE;
    long info                                                OBJC2_UNAVAILABLE;
    long instance_size                                       OBJC2_UNAVAILABLE;
    struct objc_ivar_list * _Nullable ivars                  OBJC2_UNAVAILABLE;
    struct objc_method_list * _Nullable * _Nullable methodLists                    OBJC2_UNAVAILABLE;
    struct objc_cache * _Nonnull cache                       OBJC2_UNAVAILABLE;
    struct objc_protocol_list * _Nullable protocols          OBJC2_UNAVAILABLE;
#endif

}
```

##### Summary of class and object

From the variables defined in the struct, we can see that Objective-C's `Class` type includes the following:

Data (i.e., metadata): `super_class` (the superclass class object);  
name (the name of the class object);   
version and info (version and related information);  
instance_size (the instance memory size);  
ivars (the instance variable list);  
methodLists (the method list);  
cache (the cache);  
protocols (the list of implemented protocols);  
It also includes an isa pointer, which shows that Class is also an object type, so we call it the class object.
The isa here points to the metaclass object, which stores all the information about the class methods used to create the class object (Class).

![Objective-C object prototype inheritance chain](/assets/images/20200721iOSinterviewAnswers/class_inherit.avif)  Objective-C object prototype inheritance chain


As shown in the figure, the `isa` of the root class `NSObject`'s metaclass object points to itself, forming a closed loop.  
A metaclass (`Meta Class`) is the class of a class object, i.e., the class of Class. It stores class methods and related information.  
Let's also look at the structs in the class object that store methods, properties, ivars, and other information:  
`objc_ivar_list`: stores the class's ivars,  
which can be obtained via `object_getIvar` or `class_copyIvarList`;  
There are also two methods for getting the class's property list: `class_getProperty` and `class_copyPropertyList`. Properties and ivars are different.

``` objc
struct objc_ivar {
    char * _Nullable ivar_name                               OBJC2_UNAVAILABLE;
    char * _Nullable ivar_type                               OBJC2_UNAVAILABLE;
    int ivar_offset                                          OBJC2_UNAVAILABLE;
#ifdef __LP64__
    int space                                                OBJC2_UNAVAILABLE;
#endif
}                                                            OBJC2_UNAVAILABLE;

struct objc_ivar_list {
    int ivar_count                                           OBJC2_UNAVAILABLE;
#ifdef __LP64__
    int space                                                OBJC2_UNAVAILABLE;
#endif
    /* variable length structure */
    struct objc_ivar ivar_list[1]                            OBJC2_UNAVAILABLE;
} 
```

`objc_method_list`: stores the class's method list, which can be obtained via `class_copyMethodList`.

Here's the struct:

``` objc
struct objc_method {
    SEL _Nonnull method_name                                 OBJC2_UNAVAILABLE;
    char * _Nullable method_types                            OBJC2_UNAVAILABLE;
    IMP _Nonnull method_imp                                  OBJC2_UNAVAILABLE;
}                                                            OBJC2_UNAVAILABLE;

struct objc_method_list {
    struct objc_method_list * _Nullable obsolete             OBJC2_UNAVAILABLE;

    int method_count                                         OBJC2_UNAVAILABLE;
#ifdef __LP64__
    int space                                                OBJC2_UNAVAILABLE;
#endif
    /* variable length structure */
    struct objc_method method_list[1]                        OBJC2_UNAVAILABLE;
} 
```

`objc_protocol_list`: stores the class's protocol list, which can be obtained via `class_copyProtocolList`.

Here's the struct:

``` objc
struct objc_protocol_list {
    struct objc_protocol_list * _Nullable next;
    long count;
    __unsafe_unretained Protocol * _Nullable list[1];
};
```

This question references [Describe the runtime memory model (isa, objects, classes, metaclasses, struct storage information, etc.)](https://developer.aliyun.com/ask/282811)

#### Why Design a Metaclass?

Let me start with the conclusion: it's for better **message-passing reuse**. The metaclass is merely a tool needed to **achieve message-passing reuse**. And in Objective-C, all classes share the same MetaClass by default (the isa pointer ultimately points to the metaclass). Because Objective-C's features are largely copied from Smalltalk, and the MetaClass design in Smalltalk was introduced in Smalltalk-80, Objective-C inherited the metaclass design.

> Essentially, the highlight of Smalltalk's object orientation is its **message-sending mechanism**.


Before answering this question, let's review the Objective-C object prototype inheritance chain above:![Objective-C object prototype inheritance chain](/assets/images/20200721iOSinterviewAnswers/class_inherit2.avif)

From the figure above, we understand the following key points:

* **Instance methods of an instance are stored in the class struct**
* **Class methods are stored in the metaclass struct**

In Objective-C, a method call (message) finds the corresponding method by looking up the method list of the Class object pointed to by the isa pointer.
> The class pointed to by isa is the type of the instance we create.

Through the article [Why is MetaClass in Objective-C?](https://www.jianshu.com/p/ea7c42e16da8), we learn a very important concept: unlike Python, **in Objective-C it's not that every class has its own MetaClass — rather, all classes share the same MetaClass by default.**

##### Metaclass in Smalltalk

Smalltalk, widely recognized as the second object-oriented language in history, is known for its **message-sending mechanism**.  
The MetaClass design in Smalltalk was introduced in Smalltalk-80. In the earlier Smalltalk-76, not every class had a MetaClass; instead, the isa pointers of all classes pointed to a special class called Class (a design later adopted by Java as well).  
The reason for giving each class its own MetaClass is that in Smalltalk, classes are objects, and objects can respond to messages. Therefore, the methods that respond to class messages should be stored in the class of the class, and each MetaClass holds the class methods of its corresponding class.

######  What does each MetaClass's isa pointer point to?

If MetaClass had its own MetaClass, this relationship would go on infinitely. Smalltalk's solution is to point them all to the same class called MetaClass.

###### What does MetaClass's isa pointer point to?

It points to its instance. That is, the instance's isa points to MetaClass, and MetaClass's isa points to the instance — they point at each other.

So Smalltalk's inheritance relationship is actually very similar to Objective-C's (the one with "class" at the end is the MetaClass of the former).

![class_inherit2_smaltalk](/assets/images/20200721iOSinterviewAnswers/class_inherit2_smaltalk.avif)

###### An important question arises here: if we remove MetaClass and put class methods into the class itself, is that feasible?

I pondered this question for a long time and found that it's actually a philosophical question about object orientation. To draw a conclusion, I have to revisit object orientation.

##### Re-understanding Object Orientation from Smalltalk

When discussing object orientation, people always mention its three features: encapsulation, inheritance, and polymorphism. But in fact, object orientation also has different schools. For example, C++, which draws from Simula's design philosophy, focuses more on class division because method calls are static. In contrast, Objective-C, which borrows from Smalltalk, focuses more on message passing — dynamically responding to messages.

The three features of object orientation are more based on class division.

I think the biggest difference between these two schools of thought is the top-down versus bottom-up way of thinking.

* Class division requires the class designer to design the class from a high level, extracting the class's characteristics and essence to build it. Only when you know the type can you send messages to the object.
* Message passing requires the class designer to build the class starting from messages, i.e., responding to external changes without caring about its own type, and designing interfaces. Try to understand the message; if it can't be handled, apply special handling.
Here I won't discuss which approach is better; I'll focus on the Smalltalk design.

Message passing in object-oriented design is essentially about providing a solution for messages. One of object orientation's advantages — reuse — in this design is more about reusing solutions rather than reusing the class itself. This is like designing components: you care about interfaces and composition rather than the class itself. Actually, the reason the MetaClass design exists, in my understanding, is not that MetaClass came first, but that in Smalltalk, where everything is an object, the basic solution for sending messages to objects is unified and intended to be reused. The mechanism used between instances and classes — storing the method list in the Class singleton pointed to by the isa pointer and looking up methods — is a process that should be reused at the class level, and so MetaClass naturally came into being.

##### Summary of Why to Design a Metaclass

###### Back to the original question: why design MetaClass? Would it work to remove it and put class methods into the class?

My understanding is: it can work, but it's not Smalltalk. That design is the C++ top-down approach, where class methods are just another description of the class's characteristics. The essence of Smalltalk lies in message passing; reusing message passing is the fundamental goal, and MetaClass is merely a tool needed for that purpose.

Reference: [Why is MetaClass in Objective-C?](https://www.jianshu.com/p/ea7c42e16da8)

#### Differences Between **class_copyIvarList()** and **class_copyPropertyList()**

First, the conclusion:

* **class_copyIvarList()** can get all ivars, including the variables inside braces (both in `.h` and `.m`).
* **class_copyPropertyList()** can only get the properties declared with the `@property` keyword (both in `.h` and `.m`).

Differences:

* `class_copyIvarList()` returns variables with underscores by default
* `class_copyPropertyList()` returns variable names without underscores by default

> However, both methods can only get the properties and variables of the current class (i.e., they can't get the superclass's properties and variables)  

___

For example:

Let's declare a `ClassA` and test it with debug code:

``` objc
#import <Foundation/Foundation.h>
#import <objc/runtime.h>

@interface ClassA : NSObject {
    int _a;
    int _b;
    int _c;
    CGFloat d; //不推荐这样写
}

@property (nonatomic, strong) NSArray          *arrayA;
@property (nonatomic, copy  ) NSString         *stringA;
@property (nonatomic, assign) dispatch_queue_t testQueue;

@end

@implementation ClassA
@end
```
If you go through the `class_copyIvarList()` function, the output looks like this:

``` sh
 --- class_copyIvarList ↓↓↓---
 _a
 _b
 _c
 d
 _arrayA
 _stringA
 _testQueue
 --------------END----------------
```

If you go through the `class_copyPropertyList()` function, the output looks like this:

``` sh
 --- class_copyPropertyList ↓↓↓---
 arrayA
 stringA
 testQueue
 --------------END----------------
```

Here's the debug code:

``` objc
- (void)printIvarOrProperty {
    NSLog(@"--- class_copyPropertyList ↓↓↓---");
    ClassA *classA = [[ClassA alloc] init];
    unsigned int propertyCount;
    objc_property_t *result = class_copyPropertyList(object_getClass(classA), &propertyCount);
    for (unsigned int i = 0; i < propertyCount; i++) {
        objc_property_t objc_property_name = result[i];
        NSLog(@"%@",[NSString stringWithFormat:@"%s", property_getName(objc_property_name)]);
    }
    free(result);
    NSLog(@"--------------END----------------");
    NSLog(@"--- class_copyIvarList ↓↓↓---");
    Ivar *iv = class_copyIvarList(object_getClass(classA), &propertyCount);
    for (unsigned int i = 0; i < propertyCount; i++) {
        Ivar ivar = iv[i];
        NSLog(@"%@",[NSString stringWithFormat:@"%s", ivar_getName(ivar)]);
    }
    free(iv);
    NSLog(@"--------------END----------------");
}
```

[Click here to download the demo](https://github.com/sunyazhou13/IvarAndPropertyDemo)

___

Now let's look at the [objc source code](https://github.com/sunyazhou13/objc-runtime)

The following code is in `objc-runtime-new.mm`:

``` c++
/***********************************************************************
* class_copyPropertyList. Returns a heap block containing the 
* properties declared in the class, or nil if the class 
* declares no properties. Caller must free the block.
* Does not copy any superclass's properties.
* Locking: read-locks runtimeLock
**********************************************************************/
objc_property_t *
class_copyPropertyList(Class cls, unsigned int *outCount)
{
    if (!cls) {
        if (outCount) *outCount = 0;
        return nil;
    }

    mutex_locker_t lock(runtimeLock);

    checkIsKnownClass(cls);
    ASSERT(cls->isRealized());
    
    auto rw = cls->data();

    property_t **result = nil;
    unsigned int count = rw->properties.count();
    if (count > 0) {
        result = (property_t **)malloc((count + 1) * sizeof(property_t *));

        count = 0;
        for (auto& prop : rw->properties) {
            result[count++] = &prop;
        }
        result[count] = nil;
    }

    if (outCount) *outCount = count;
    return (objc_property_t *)result;
}
```
From the source code, we can see:

``` c
auto rw = cls->data();
rw->properties; //通过rw直接拿到properties
```
Get properties directly through rw, then iterate to extract the desired variable names declared with the `@property` keyword.

For the detailed content of `properties`, please look at the runtime source code on your own — space is limited here so I won't elaborate.

--- 

``` c++
/***********************************************************************
* class_copyIvarList
* fixme
* Locking: read-locks runtimeLock
**********************************************************************/
Ivar *
class_copyIvarList(Class cls, unsigned int *outCount)
{
    const ivar_list_t *ivars;
    Ivar *result = nil;
    unsigned int count = 0;

    if (!cls) {
        if (outCount) *outCount = 0;
        return nil;
    }

    mutex_locker_t lock(runtimeLock);

    ASSERT(cls->isRealized());
    
    if ((ivars = cls->data()->ro->ivars)  &&  ivars->count) {
        result = (Ivar *)malloc((ivars->count+1) * sizeof(Ivar));
        
        for (auto& ivar : *ivars) {
            if (!ivar.offset) continue;  // anonymous bitfield
            result[count++] = &ivar;
        }
        result[count] = nil;
    }
    
    if (outCount) *outCount = count;
    return result;
}
```
There's just one key point here:

``` c
ivars = cls->data()->ro->ivars
```
Get the ivars.

Since the two obtain different members, the two APIs differ.

#### Differences Between `class_rw_t` and `class_ro_t`

First, the conclusion:

* Both structs store the current class's properties, ivars, methods, protocols, etc.
* `class_ro_t` stores what is determined at compile time.
* `class_rw_t` is determined at runtime: it first copies the contents of `class_ro_t`, then copies in the properties, methods, etc., from the class's categories. So `class_rw_t` can be said to be a superset of `class_ro_t`. Of course, actually accessing a class's methods and properties accesses the contents of `class_rw_t`.

___

##### Let's Dig Deeper into What These Two Are

First, we need to understand where they come from. We know that `objc_class` has a member variable called `isa`; here we're going to introduce another member variable of `objc_class`: `bits`.

Here's the structure of `objc_class`:

![The structure of objc_class](/assets/images/20200721iOSinterviewAnswers/objc_class_struct.avif)


`bits` is used to store the class's properties, methods, protocols, and other information. It is of type `class_data_bits_t`.

Here's `class_data_bits_t`:

``` objc
struct class_data_bits_t {
    uintptr_t bits;
    // method here
}
```
This struct has only one `64-bit` member variable `bits`. Let's first look at what information these `64 bits` store:

![objc_class_bits](/assets/images/20200721iOSinterviewAnswers/objc_class_bits.avif)

* `is_swift`: the first bit, indicating whether the class is a Swift class
* `has_default_rr`: the second bit, indicating whether the current class or its superclass has the default `retain/release/autorelease/retainCount/_tryRetain/_isDeallocating/retainWeakReference/allowsWeakReference` methods
* `require_raw_isa`: the third bit, indicating whether instances of the current class need `raw_isa`
* `data`: bits 4-48, storing a pointer to the class_rw_t struct, which contains the class's properties, methods, protocols, and other information. (As for why only 44 bits are used to store the address...

##### `class_rw_t` and `class_ro_t`

First, let's look at the member variables of the two structs:

``` objc
struct class_rw_t {
    uint32_t flags;
    uint32_t version;

    const class_ro_t *ro;

    method_array_t methods;
    property_array_t properties;
    protocol_array_t protocols;

    Class firstSubclass;
    Class nextSiblingClass;
};
```

``` objc
struct class_ro_t {
    uint32_t flags;
    uint32_t instanceStart;
    uint32_t instanceSize;
    uint32_t reserved;

    const uint8_t * ivarLayout;

    const char * name;
    method_list_t * baseMethodList;
    protocol_list_t * baseProtocols;
    const ivar_list_t * ivars;

    const uint8_t * weakIvarLayout;
    property_list_t *baseProperties;
};
```

`class_rw_t` contains a pointer to a `class_ro_t` struct.

Every class has a corresponding `class_ro_t` struct and a `class_rw_t` struct. During compilation, the `class_ro_t` struct is already determined, and the `data` part of `bits` in `objc_class` stores the address of this struct. After the `runtime` runs — specifically when the runtime's `realizeClass` method runs — the `class_rw_t` struct is generated. This struct contains `class_ro_t`, and the `data` part is updated to the address of the `class_rw_t` struct.

Two figures illustrate this process:

Before the class's `realizeClass` runs:  
![before_bits](/assets/images/20200721iOSinterviewAnswers/before_bits.avif)

After the class's `realizeClass` runs:

![after_bits](/assets/images/20200721iOSinterviewAnswers/after_bits.avif)

A close look at the member variables of the two structs reveals many similarities: both store the current class's properties, ivars, methods, and protocols. The difference is that `class_ro_t` stores what is determined at compile time, while `class_rw_t` is determined at `runtime`: it first copies the contents of `class_ro_t`, then copies in the properties, methods, etc., from the class's categories. So `class_rw_t` can be said to be a superset of `class_ro_t`. Of course, actually accessing a class's methods and properties accesses the contents of `class_rw_t`.

Properties are stored in `class_rw_t`, while instance variables (ivars) are stored in `class_ro_t`.

For details, please refer to [Objective-C runtime - Properties and Methods](http://vanney9.com/2017/06/05/objective-c-runtime-property-method/)


#### How Categories Are Loaded, the Loading Order of Two Categories' load Methods, and the Loading Order of Two Categories' Methods with the Same Name

Conclusion:

1. A category is loaded step by step like this: `realizeClass` -> `methodizeClass()` -> `attachCategories()`.
2. The loading order of the main class and its categories: **the main class is loaded before its categories, regardless of compile order**.
3. The loading order between categories depends on the compile order: **the one compiled first is loaded first; the one compiled later is loaded later**.

---

##### How Categories Are Loaded

In the runtime source code `objc-runtime-new.mm`, I found the following:

```  objc
static Class realizeClassWithoutSwift(Class cls, Class previously)
{
	...
	// Attach categories
	methodizeClass(cls, previously);
	return cls;
}
```
`realizeClass` -> `methodizeClass()` -> `attachCategories()`

The core is implemented in the methodizeClass() function.

``` c
static void methodizeClass(Class cls)
{
    runtimeLock.assertLocked();
    bool isMeta = cls->isMetaClass();
    auto rw = cls->data();
    auto ro = rw->ro;
    ...
    property_list_t *proplist = ro->baseProperties;
    if (proplist) {
        rw->properties.attachLists(&proplist, 1);
    }
    ...
    // Attach categories.
    category_list *cats = unattachedCategoriesForClass(cls, true /*realizing*/);
    attachCategories(cls, cats, false /*don't flush caches*/);
    ...    
    if (cats) free(cats);

}
```
From the code above, we find that `ro->baseProperties;` comes first and categories come after:

``` objc
property_list_t *proplist = ro->baseProperties;
if (proplist) {
  rw->properties.attachLists(&proplist, 1);
}
```
But what actually determines the order is the rw->`properties.attachLists()` method.

``` c
/// categories are attached here
void attachLists(List* const * addedLists, uint32_t addedCount) {
    if (addedCount == 0) return;
    if (hasArray()) {
        // many lists -> many lists
        uint32_t oldCount = array()->count;
        uint32_t newCount = oldCount + addedCount;
        setArray((array_t *)realloc(array(), array_t::byteSize(newCount)));
        array()->count = newCount;
        //move the old content by the addedCount offset, then copy addedLists to the start position
        /*
            struct array_t {
                    uint32_t count;
                    List* lists[0];
                    };
        */
        memmove(array()->lists + addedCount, array()->lists, 
                oldCount * sizeof(array()->lists[0]));
        memcpy(array()->lists, addedLists, 
               addedCount * sizeof(array()->lists[0]));
    }
    else if (!list  &&  addedCount == 1) {
        // 0 lists -> 1 list
        list = addedLists[0];
    } 
    else {
        // 1 list -> many lists
        List* oldList = list;
        uint32_t oldCount = oldList ? 1 : 0;
        uint32_t newCount = oldCount + addedCount;
        setArray((array_t *)malloc(array_t::byteSize(newCount)));
        array()->count = newCount;
        if (oldList) array()->lists[addedCount] = oldList;
        memcpy(array()->lists, addedLists, 
        addedCount * sizeof(array()->lists[0]));
    }
}
```
So the category's properties always come first, and the base class's properties are shifted back.

##### The Loading Order of Two Categories' load Methods

``` txt
A class’s +load method is called after all of its superclasses’ +load methods.
一个类的+load方法在其父类的+load方法后调用

A category +load method is called after the class’s own +load method.
一个Category的+load方法在被其扩展的类的自有+load方法后调用
```
Conclusion: the loading order of the main class and its categories is: **the main class is loaded before its categories, regardless of compile order**.

#####  The Loading Order of Two Categories' Methods with the Same Name

When the application's image is loaded into memory, during the `Category` resolution process — note the `while(i--)` loop below — the protocols, methods, and properties in the `category` are added in reverse order to `methods/properties/protocols` in `rw = cls->data()`.

``` objc
static void 
attachCategories(Class cls, category_list *cats, bool flush_caches)
{
    if (!cats) return;
    if (PrintReplacedMethods) printReplacements(cls, cats);

    bool isMeta = cls->isMetaClass();

    // fixme rearrange to remove these intermediate allocations
    method_list_t **mlists = (method_list_t **)
        malloc(cats->count * sizeof(*mlists));
    property_list_t **proplists = (property_list_t **)
        malloc(cats->count * sizeof(*proplists));
    protocol_list_t **protolists = (protocol_list_t **)
        malloc(cats->count * sizeof(*protolists));

    // Count backwards through cats to get newest categories first
    int mcount = 0;
    int propcount = 0;
    int protocount = 0;
    int i = cats->count;
    bool fromBundle = NO;
    while (i--) {
        auto& entry = cats->list[i];

        method_list_t *mlist = entry.cat->methodsForMeta(isMeta);
        if (mlist) {
            mlists[mcount++] = mlist;
            fromBundle |= entry.hi->isBundle();
        }

        property_list_t *proplist = 
            entry.cat->propertiesForMeta(isMeta, entry.hi);
        if (proplist) {
            proplists[propcount++] = proplist;
        }

        protocol_list_t *protolist = entry.cat->protocols;
        if (protolist) {
            protolists[protocount++] = protolist;
        }
    }
    auto rw = cls->data();
        
    //note: the code above traverses in reverse order, so categories compiled later are added to the front of the array first
    prepareMethodLists(cls, mlists, mcount, NO, fromBundle);
    rw->methods.attachLists(mlists, mcount);
    free(mlists);
    if (flush_caches  &&  mcount > 0) flushCaches(cls);

    rw->properties.attachLists(proplists, propcount);
    free(proplists);

    rw->protocols.attachLists(protolists, protocount);
    free(protolists);
}
```

So the conclusion is: the loading order between categories depends on the compile order: the one compiled first is loaded first; the one compiled later is loaded later.

There are many examples of this online, so I won't add more here.


#### The Difference Between `category` and `extension`; Can You Add an Extension to NSObject, and What Happens?

#####  `category`

* Adds category properties/protocols/methods at runtime
* Methods added by a category "override" the original class methods, because method lookup goes from start to end and stops as soon as it finds a match
* Which same-named category method takes effect depends on the compile order. The image reads the information in reverse order, so the ones compiled later are read in first
* Two categories with the same name cause a compile error;

##### `extension`

* Resolved at compile time
* Exists only in declaration form; in most cases it lives in the .m file;
* Cannot add extensions to system classes

It can add member variables to a class, but they are private; it can add methods to a class, but they are private too. The added properties and methods are part of the class, determined at compile time. The @interface in the header file and @implementation in the implementation file together form a complete class. It comes into being with the class and disappears with the class.

> **You must have the class's source code to add an extension to it**!!!

##### The Difference Between `category` and `extension`

* A Category has a name in its parentheses, while an Extension doesn't;
* A Category can only add methods, not member variables or properties;
* If a Category declares a property, the Category only generates the declarations of the setter and getter for that property, but doesn't implement them. So for system classes such as NSString, you can't add a class extension. You can't add an Extension to NSObject either, because the methods or properties added in an extension must be implemented in the .m file of the source class — that is, you must have the source code of a class to add an `extension` to it.

##### Can You Add an Extension to NSObject, and What Happens?

No, because there's no .m source file for NSObject.

> If you could, it wouldn't be called an Extension. Or you'd be building your own ExtensionDIY with runtime APIs. In that case, what you're using can't really be called an `Extension` — it's just API calls.

#### The Message Forwarding Mechanism, and a Comparison of the Message Forwarding Mechanism with Other Languages' Message Mechanisms

> Preface: before understanding message forwarding, it's necessary to understand some of the message-passing mechanisms in Objective-C

##### The Message-Passing Mechanism

In Objective-C, when we call a method through an `instance (object)` or a `class method name`, we are actually sending a message.

``` objc
id returnValue = [someObject messageName:parameter];  //实例调用方式
id returnValue = [ClassA messageName:parameter];  //类调用方式
```
In the above, `someObject` and `ClassA` are the receivers, and `messageName:` is the selector. The selector and its parameters together form the message. When the compiler sees this message, it converts it into a standard C function call, and the function called is the core function of the message-passing mechanism: `objc_msgSend()`.

``` c
void objc_msgSend(id self, SEL cmd, ...)
```
The first parameter represents the receiver, the second parameter represents the selector, and the remaining parameters are the message's parameters.
The compiler converts the message in the example above into the following function:

``` objc
id returnValue = objc_msgSend(someObject, @selector(messageName:),parameter);
id returnValue = objc_msgSend(ClassA, @selector(messageName:),parameter);
```
The `objc_msgSend()` function calls the appropriate method based on the types of the receiver and the selector. To do this, it searches the "method list" in the class the receiver belongs to (which is the method_list in `class_ro_t` we mentioned above). If found, it jumps to the implementation; otherwise, it keeps searching up the inheritance hierarchy. If still not found, it performs message forwarding. For other "edge cases", some other functions in the Objective-C runtime environment handle them:

``` c
objc_msgSend_stret  //待发送的消息返回结构体时
objc_msgSend_fpret  //消息返回的是浮点型
objc_msgSendSuper   //如果要给超类发送消息
```

##### The Message Forwarding Mechanism

Building on the message-passing mechanism above, in Objective-C, if you send an object a message it can't handle, it enters the Message Forwarding flow described in the figure below:

![methodforward](/assets/images/20200721iOSinterviewAnswers/methodforward.avif)

Message forwarding in objc goes through 3 stages: `resolveInstanceMethod` -> `forwardingTargetForSelectoer` -> `forwardInvocation` -> `message not handled`.  

* Stage 1: **Dynamic Method Resolution** — first ask the receiver in its class whether it can dynamically add a method to handle this **unknown selector**
* Stage 2: **Replace the message receiver (fast forwarding)**
* Stage 3: **Full message forwarding mechanism**


##### Stage 1: **Dynamic Method Resolution**

After an object receives an uninterpretable message, it first calls the following class methods of its class:  

``` objc
+ (BOOL)resolveClassMethod:(SEL)sel OBJC_AVAILABLE(10.5, 2.0, 9.0, 1.0, 2.0);
+ (BOOL)resolveInstanceMethod:(SEL)sel OBJC_AVAILABLE(10.5, 2.0, 9.0, 1.0, 2.0);
```
> These two methods are in NSObject.h    

It returns a `Boolean` indicating whether this class can add an instance method to handle the selector.

During message forwarding, we can use `resolveInstanceMethod:` to dynamically add a method to a class.

For example, the following sample code:

``` objc
@implementation MyClass
+ (BOOL)resolveInstanceMethod:(SEL)aSEL
{
    if (aSEL == @selector(resolveThisMethodDynamically)) {
          class_addMethod([self class], aSEL, (IMP) dynamicMethodIMP, "v@:");
          return YES;
    }
    return [super resolveInstanceMethod:aSEL];
}
@end
```

Here we use a runtime function `class_addMethod()`.

``` c
BOOL 
class_addMethod(Class cls, SEL name, IMP imp, const char *types)
{
    if (!cls) return NO;

    mutex_locker_t lock(runtimeLock);
    return ! addMethod(cls, name, imp, types ?: "", NO);
}
```

*  The last parameter of `class_addMethod()` is called `types`; it's a string describing the parameter types of the method.
* `v` stands for `void`
* `@` stands for an object, i.e., the `id type`
* `:` (this colon) stands for the method selector SEL

What each character means is not something we make up — it must follow Apple's standard: [Objective-C Runtime Programming Guide -> Type Encodings](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtTypeEncodings.html#//apple_ref/doc/uid/TP40008048-CH100-SW1)

The `dynamicMethodIMP` above has a return value of `void` and two input parameters: `id` and `SEL`. So the string describing the method's parameter types is `v@:`.

The meaning of this stage is to dynamically provide a method implementation for a class. Strictly speaking, it hasn't entered the message forwarding flow yet.

`resolveInstanceMethod:` controls whether the following two methods are called:

* `respondsToSelector:`  
* `instancesRespondToSelector:`  

> That is, if `resolveInstanceMethod:` returns `YES`, then both `respondsToSelector:` and `instancesRespondToSelector:` will return `YES`.

##### Stage 2: Replace the Message Receiver (Fast Forwarding)

If `resolveInstanceMethod:` in stage 1 returns NO, `forwardingTargetForSelector:` is called to ask whether the message should be forwarded to another object. The message's receiver then changes.

``` objc
- (id)forwardingTargetForSelector:(SEL)aSelector {
    return someOtherObject;
}
```

##### Stage 3: The Full Message Forwarding Mechanism

If `forwardingTargetForSelector:` in stage 2 returns `nil`, the full message forwarding mechanism kicks in.

First, `methodSignatureForSelector:` is called to return the correct signature for the message to be forwarded:

``` objc
- (void)forwardInvocation:(NSInvocation *)anInvocation {
    NSLog(@"forwardInvocation");
    SomeOtherObject *someOtherObject = [SomeOtherObject new];
    if ([someOtherObject respondsToSelector:[anInvocation selector]]) {
        [anInvocation invokeWithTarget:someOtherObject];
    } else {
        [super forwardInvocation:anInvocation];
    }
}
```

The code above forwards the message to another object, which is actually the same thing the sample code in stage 2 does. The difference is that this stage has an `NSInvocation` object. [`NSInvocation`](https://developer.apple.com/documentation/foundation/nsinvocation?language=objc) is an object used to store and forward messages. It contains all the elements of an Objective-C message: a target, a selector, arguments, and a return value. Each element can be set directly.

> `NSInvocation` can be simply understood as an object that stores the selector method and the object we use, and which one points to the target we need to call.

So unlike stage 2, in this stage you can:

* Store the message and forward it when you think it's appropriate, or simply not handle it.
* Modify the message's target, selector, arguments, etc.
* Forward the message multiple times, to multiple objects

At this stage you can do much more with an Objective-C message.

---

##### Comparison of the Message Forwarding Mechanism with Other Languages' Message Mechanisms

I haven't yet gone deep into the runtime level of other programming languages, such as C's underlying implementation, C++'s, or Java's underlying message passing. Here's an article about something similar to message forwarding on Android (探索 Android App Bundle)


#### Before Method Lookup -> Dynamic Resolution -> Message Forwarding, What Happens When a Method Is Called

The steps for an Objective-C instance object to execute a method:

1. Get the Class corresponding to the receiver
2. In the Class's cache list (i.e., from `cache_t` in `objc_class` to the method list in `class_ro_t`), look up the `IMP` by the selector
3. If not found in the cache, continue searching in the method list.
4. If not in the method list, search the superclass and repeat the above steps.
5. If still not found, perform message forwarding.

* Before method lookup, you need to know the receiver and the selector — mainly to clarify which instance called which method.  
* Before dynamic resolution, you ask the receiver in its class whether it can dynamically add a method to handle this unknown selector.
* Before message forwarding, you ask whether the message should be forwarded to another object.

> For a deeper understanding, it comes down to why objc_msgSend() is implemented in assembly and which assembly instructions are executed before those methods are called.

Here are two articles for reference:  
[An in-depth look at Objective-C message sending and forwarding](https://chipengliu.github.io/2019/06/02/objc-msgSend-forward/)   
[Written in assembly, with the specific process details](https://chipengliu.github.io/2019/04/07/objc-msg-armd64/)

#### Differences Between `IMP`, `SEL`, and `Method` and Their Usage Scenarios

* `IMP`: the concrete implementation of a method (a pointer)
* `SEL`: the method name
* `Method`: a pointer of type objc_method, which is a struct, shown below:

	``` objc
	struct objc_method {
	    SEL _Nonnull method_name                                 OBJC2_UNAVAILABLE;
	    char * _Nullable method_types                            OBJC2_UNAVAILABLE;
	    IMP _Nonnull method_imp                                  OBJC2_UNAVAILABLE;
	}
	```  

Usage scenarios:

* For example, when a Button adds a Target and Selector, or when implementing `swizzling`, you use `class_getInstanceMethod(class, SEL)` to get the class's `Method`, where SEL is used as the method name.

* For example, to dynamically add a method to a class, we need to call class_addMethod(Class, SEL, IMP, types), which requires us to pass an IMP implementation function, e.g.:

``` objc
static void funcName(id receiver, SEL cmd, 方法参数...) {
   // the concrete implementation of the method
}
```

> SEL is like the method's type keyword.

#### What's the Difference Between `load` and `initialize`? What's the Difference in Inheritance Relationships?

When an Objective-C class is loaded and initialized, the class can receive method callbacks.

``` objc
- (void)load;
- (void)initialize;
```

#####  `+load`

The `+load` method is called when the file (i.e., the subclassed class you override) is loaded by the program. Any file that appears in Xcode's `Compile Sources` is always loaded, regardless of whether the class is used. Therefore, the +load method is always called before the `main()` function.

The call happens early, so the runtime environment has uncertain factors. Specifically, on iOS it's usually loaded when the app starts. But when load is called, it's not guaranteed that all classes have finished loading and are usable; if necessary, you have to handle autorelease yourself.

> One more point: for two libraries with a dependency relationship, the +load of the depended-upon class is called first. But within a library, calls between parent, child, and category classes have an order, while the call order between unrelated classes is uncertain.

* About inheritance: for a class, if it doesn't implement +load, it won't be called — inheritance from NSObject doesn't matter, i.e., the superclass's +load won't be inherited.
* Calls between the superclass and the current class: the superclass's method is called before the subclass's. A class's +load method doesn't need to explicitly call `[super load]`; the superclass will still receive the call.
* Calls between the current class and its Categories: the current class's method is called before the category's methods. A Category's +load is also called, but after the current class's +load.
* It doesn't directly trigger the initialize call.

#### `+initialize`

The `+initialize` method is called before the class or its subclasses receive their first message. Here, "message" includes calls to instance methods and class methods, and it's only called once. The `initialize` method is actually a lazy-load call: if a class is never used, its initialize method won't be called either. This helps save resources.

The runtime calls `+initialize` via message sending (`objc_msgSend`). That is, `+initialize` is called the same way as an ordinary method — both go through the `message-sending flow`. In other words, if a subclass doesn't implement +initialize, the inherited implementation from the superclass is called; if a class's category implements `+initialize`, it overrides the class's own implementation.

* initialize is naturally called when the current class is first actively used.
* When the initialize method is called, the runtime environment is basically sound.
* About inheritance: unlike load, even if a subclass doesn't implement the initialize method, the superclass's implementation is inherited and called — i.e., the superclass's +initialize is used. (When using the inherited superclass method, self still refers to the subclass.)
* Calls between the superclass and the current class: when the subclass's +initialize is about to be called, it triggers the superclass's +initialize method, so you don't need to write [super initialize] in the subclass either. (Following the principle that it's called only once unless actively invoked, if the superclass's +initialize has already been called, it won't be called again.)
* Calls between the current class and its Categories: a Category's +initialize method overrides the current class's method, and only one Category's +initialize method runs.

Here's a table I put together that I hope helps explain these two methods:

| | + load |  + initialize | 
| ------| ------ | ------ |
| Invocation | Directly using the function's memory address | Via objc_msgSend() |
| Timing | Called when the program loads it, before main(), i.e., when it's added to the runtime | Called before the class or its subclasses receive their first message |
| Called only once by the system (unless actively invoked) | Yes | Yes |
| Is the runtime environment stable? | Uncertain | Stable |
| Is it thread-safe | Safe by default (locked) | Safe (locked) |
| Characteristics | Because it's not called via `objc_msgSend()`, the +load method has a very interesting characteristic: implementations of +load in the subclass, superclass, and categories are treated differently. That is, if a subclass doesn't implement +load, the runtime won't call the superclass's +load when it's loaded. Similarly, when both a class and its category implement +load, both methods are called | `+initialize` is called the same way as an ordinary method. If a subclass doesn't implement +initialize, the inherited implementation from the superclass is called; if a class's category implements +initialize, it overrides the class's own implementation |

Reference: [The difference between load and initialize](https://cloud.tencent.com/developer/article/1355957)

##### What's the Difference in Inheritance Relationships?

Calling super's method will succeed, but it's redundant, because the runtime automatically calls the superclass's +load method, and +initialize automatically triggers the superclass's method along with the subclass (as stated in Apple's documentation), so no explicit call is needed. On the other hand, if a method in the superclass uses self (like the method in the example), self still refers to the class itself, not the superclass.

####  Discuss the Pros and Cons of the Message Forwarding Mechanism

Advantages:
  
* Using the message forwarding mechanism, you can implement multiple delegates without code intrusion, allowing different objects to simultaneously act as delegates for the same callback and handle it in their respective areas, reducing code coupling.  
* Using @synthesize can automatically generate getter and setter methods for @property (in current Xcode versions, they're generated automatically), while @dynamic tells the compiler not to generate getter and setter methods. When using @dynamic, we can use the message forwarding mechanism to dynamically add getter and setter methods. Of course, you can also implement this with other approaches.


Disadvantages:

* Objective-C itself doesn't support multiple inheritance, because name lookup in the message mechanism happens at runtime rather than compile time, making it hard to resolve the ambiguity that multiple base classes could cause. But through the message forwarding mechanism, you can internally create multiple objects with different functionality and forward unimplementable functionality to other objects, creating the illusion of multiple inheritance. Forwarding is similar to inheritance and can be used to add some multiple-inheritance effects to OC programming: when an object forwards a message, it's as if it takes over or "inherits" the methods of another object. Message forwarding makes up for objc's lack of multiple inheritance and also prevents a single class from becoming bloated and complex due to multiple inheritance.


# Summary

This post covers the **structural model** part of the **runtime-related questions** from the interview questions. In the next chapter, I plan to cover **memory management**, another part of the **runtime-related questions**, and continue step by step through all the interview-related articles.

I have to say, this kind of interview is indeed quite challenging. By the way, let me also take a jab at Alibaba and Toutiao: I hope they can be more fair — it's fine to ask questions, but there should also be answers. This whole thing made me observe that these two companies start things but don't finish them — they begin well but don't end well.
