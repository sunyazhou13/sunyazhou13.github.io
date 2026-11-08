---
layout: post
title: "Alibaba, ByteDance: An Efficient Set of iOS Interview Questions - Runtime Related Issues Part 2"
date: 2020-08-08 14:54:07
categories: [iOS, 系统理论实践]
tags: [Algorithm, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---


![i OS Interview Questions Album Cover](/assets/images/20200721iOSinterviewAnswers/iOSInterviewQuestionsAlbumCover.avif)


# Preface

> This article carries strong personal sentiments. If you find it uncomfortable to read, please close it. This article is for personal learning records only. You're welcome to repost or share it within the scope of the license — please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!


In this article, we'll discuss the runtime-related questions and memory management content from [Alibaba, ByteDance: An Efficient Set of iOS Interview Questions](https://mp.weixin.qq.com/s/bDnsaD__ZpdHIk3_So382w).

# Runtime Related Questions — Memory Management

Basic content includes:

* What is the implementation principle of weak? What is the structure of SideTable?
* Applications of associated objects? How does the system implement associated objects?
* How are associated objects managed in memory? How to implement weak properties with associated objects?
* What is the principle of Autoreleasepool? What data structure does it use?
* What is the implementation principle of ARC? What optimizations were made to retain and release under ARC?
* What situations can cause memory leaks under ARC?


## What is the implementation principle of weak? What is the structure of SideTable?

Let's start with the conclusion:

* The `weak table` is actually a hash table. The `Key` is the address of the pointed-to object, and the `Value` is an array of `weak` pointer addresses. The implementation principle is that through the old/new table pointer update mechanism, weak objects are stored separately in the `weak_table_t` (type) `weak_table` table within `SideTable` (struct). This is implemented through the `objc_initWeak()` -> `storeWeak()` function using old and new `SideTable` (struct) tables.
* `SideTable` is a struct with two main members: a reference count table and a weak reference table. What's stored in memory are actually the object's address, reference count, and weak variable addresses — not the object's own data. Here's its structure:

``` objc
struct SideTable {
    spinlock_t slock;
    RefcountMap refcnts;
    weak_table_t weak_table;
    SideTable() {
        memset(&weak_table, 0, sizeof(weak_table));
    }
    ~SideTable() {
        _objc_fatal("Do not delete SideTable.");
    }
    void lock() { slock.lock(); }
    void unlock() { slock.unlock(); }
    void forceReset() { slock.forceReset(); }
    // Address-ordered lock discipline for a pair of side tables.
    template<HaveOld, HaveNew>
    static void lockTwo(SideTable *lock1, SideTable *lock2);
    template<HaveOld, HaveNew>
    static void unlockTwo(SideTable *lock1, SideTable *lock2);
};
```

###  weak Implementation Principle

The implementation principle can be divided into 3 timing phases:

* 1. Initialization
* 2. Adding reference
* 3. Release

#### 1. During Initialization

`runtime` calls the `objc_initWeak` function to initialize a new `weak` pointer pointing to the object's address.

Let's introduce a piece of test code:

``` objc
NSObject *obj = [[NSObject alloc] init];
id __weak obj1 = obj;
```

When we initialize a weak variable, `runtime` calls the `objc_initWeak()` function in `NSObject.mm`. Here's this function's declaration in Clang:

``` objc
id objc_initWeak(id *location, id newObj) {
    if (!newObj) { // 查看对象实例是否有效 无效对象直接导致指针释放
        *location = nil;
        return nil;
    }
    // 这里传递了三个 bool 数值 old, new, crash.使用 template 进行常量参数传递是为了优化性能
    return storeWeak<DontHaveOld, DoHaveNew, DontCrashIfDeallocating>
        (location, (objc_object*)newObj);
}
```

As we can see, this function is merely an entry point for a deeper function call. General entry functions do some simple checks (like the cache check in `objc_msgSend`). Here it checks whether the class object the pointer points to is valid — if invalid, it releases directly without calling deeper functions. Otherwise, object will be registered as a `__weak` object pointing to value. And this is what the `objc_storeWeak` function does.

> Note: The `objc_initWeak` function has a prerequisite: object must be a valid pointer that hasn't been registered as a `__weak` object. value can be null or point to a valid object.

#### 2. When Adding a Reference

The `objc_initWeak` function calls `objc_storeWeak()`, which in turn calls `storeWeak()`. The purpose of `storeWeak()` is to update the pointer's target and create the corresponding weak reference table.

Template:

``` c
// HaveOld:  true - 变量有值 ,false - 需要被及时清理，当前值可能为 nil
// HaveNew:  true - 需要被分配的新值，当前值可能为nil, false - 不需要分配新值
// CrashIfDeallocating: true - 说明 newObj 已经释放或者 newObj 不支持弱引用，该过程需要暂停,false - 用 nil 替代存储
template <HaveOld haveOld, HaveNew haveNew,CrashIfDeallocating crashIfDeallocating>
```

The weak implementation function **this process is used to update the weak reference pointer's target**:

``` objc
static id 
storeWeak(id *location, objc_object *newObj)
{
    ASSERT(haveOld  ||  haveNew);
    if (!haveNew) ASSERT(newObj == nil);  
    // 初始化 previouslyInitializedClass 指针.
    Class previouslyInitializedClass = nil;
    id oldObj;
    // 声明两个 SideTable,① 新旧散列创建
    SideTable *oldTable;
    SideTable *newTable;
    //获得新值和旧值的锁存位置(用地址作为唯一标示),通过地址来建立索引标志,防止桶重复,下面指向的操作会改变旧值.
    if (haveOld) {
        oldObj = *location;// 更改指针，获得以 oldObj 为索引所存储的值地址
        oldTable = &SideTables()[oldObj];
    } else {
        oldTable = nil;
    }
    if (haveNew) {
        newTable = &SideTables()[newObj];// 更改新值指针，获得以 newObj 为索引所存储的值地址
    } else {
        newTable = nil;
    }
    // 加锁操作，防止多线程中竞争冲突
    SideTable::lockTwo<haveOld, haveNew>(oldTable, newTable);
	// 避免线程冲突重处理,location 应该与 oldObj 保持一致，如果不同，说明当前的 location 已经处理过 oldObj 可是又被其他线程所修改
    if (haveOld  &&  *location != oldObj) {
        SideTable::unlockTwo<haveOld, haveNew>(oldTable, newTable);
        goto retry;
    }
    // 防止弱引用间死锁,并且通过 +initialize 初始化构造器保证所有弱引用的 isa 非空指向
    if (haveNew  &&  newObj) {
        Class cls = newObj->getIsa();// 获得新对象的 isa 指针
        // 判断 isa 非空且已经初始化
        if (cls != previouslyInitializedClass  &&  
            !((objc_class *)cls)->isInitialized()) 
        { 
            SideTable::unlockTwo<haveOld, haveNew>(oldTable, newTable);/ 解锁
            class_initialize(cls, (id)newObj); //如果该类已经完成执行 +initialize 方法是最理想情况,如果该类 +initialize 在线程中,例如 +initialize 正在调用 storeWeak 方法,需要手动对其增加保护策略，并设置 previouslyInitializedClass 指针进行标记
            previouslyInitializedClass = cls;
            goto retry; //重试
        }
    }
    // ② 清除旧值
    if (haveOld) {
        weak_unregister_no_lock(&oldTable->weak_table, oldObj, location);
    }
	 // ③ 分配新值
    if (haveNew) {
        newObj = (objc_object *)
            weak_register_no_lock(&newTable->weak_table, (id)newObj, location, 
                                  crashIfDeallocating);
        //如果弱引用被释放 weak_register_no_lock 方法返回 nil,在引用计数表中设置若引用标记位
        if (newObj  &&  !newObj->isTaggedPointer()) {
	        //弱引用位初始化操作,引用计数那张散列表的weak引用对象的引用计数中标识为weak引用
            newObj->setWeaklyReferenced_nolock();
        }
        //之前不要设置 location 对象，这里需要更改指针指向
        *location = (id)newObj;
    }
    else {
        // 没有新值，则无需更改
    }
    
    SideTable::unlockTwo<haveOld, haveNew>(oldTable, newTable);

    return (id)newObj;
}
```

##### SideTable

SideTable is a struct with two main members: a reference count table and a weak reference table. What's stored in memory are actually the object's address, reference count, and weak variable addresses — not the object's own data.
> It's primarily used to manage the object's reference count and weak table.

Let's look at the diagram:

![Side Table Structure](/assets/images/20200808iOSinterviewAnswers/SideTableStructure.avif)

> The operating system maintains 64 SideTables. After hashing the object's address and taking modulo 64 (i.e., %64 for the remainder), the specified SideTable is found.
Each SideTable maintains a RefcountMap reference count table, where the key is the object's address and the value is the object's reference count.


``` objc
struct SideTable {
    spinlock_t slock; //保证原子操作的自旋锁
    RefcountMap refcnts; //引用计数的 hash 表
    weak_table_t weak_table; //weak 引用全局 hash 表
    ...
};

```

* slock — a spinlock to prevent race conditions
* refcnts — a variable that assists the object's isa pointer's `extra_rc` for joint reference counting

##### weak table

The weak reference hash table, a struct of type `weak_table_t`, stores all weak reference information related to a particular instance object. Here's its definition:

``` objc
struct weak_table_t {
    weak_entry_t *weak_entries; // 保存了所有指向指定对象的 weak 指针
    size_t    num_entries;		 // 存储空间
    uintptr_t mask;     			// 参与判断引用计数辅助量
    uintptr_t max_hash_displacement;     // hash key 最大偏移值
};
```
This is a global weak reference hash table. It uses the address of an object of unspecified type as the `key`, and a `weak_entry_t` type struct object as the `value`. The `weak_entries` member is the entry point to the weak reference table.

The `weak_entry_t` is an internal struct stored in the weak reference table, responsible for maintaining and storing all weak reference hash tables pointing to an object. Here's its definition:

``` objc
typedef DisguisedPtr<objc_object *> weak_referrer_t;
struct weak_entry_t {
    DisguisedPtr<objc_object> referent;
    union {
        struct {
            weak_referrer_t *referrers;
            uintptr_t        out_of_line_ness : 2;
            uintptr_t        num_refs : PTR_MINUS_2;
            uintptr_t        mask;
            uintptr_t        max_hash_displacement;
        };
        struct {
            // out_of_line_ness field is low bits of inline_referrers[1]
            weak_referrer_t  inline_referrers[WEAK_INLINE_COUNT];
        };
    };
    ...
};
```
The `referent` variable of type `DisguisedPtr` is **a wrapper around a pointer to a generic object**. This `generic class` is used to solve memory leak problems.

There's an important member `out_of_line` in the comments. It represents the lowest significant bit. When it's 0, the `weak_referrer_t` member expands into a multi-line static `hash table`.

The `weak_referrer_t` is a typedef alias for a two-dimensional `objc_object`. Through a two-dimensional pointer address offset, using the index as the hash `key`, a weak reference hash table is created.

So what role do the members `out_of_line`, `num_refs`, `mask`, and `max_hash_displacement` in `weak_entry_t` play when the significant bit is not active?

* `out_of_line`: The lowest significant bit, also a flag bit. When the flag is 0, it increases the dimension of the reference table pointer.
* `num_refs`: The reference count value. This records the number of valid references in the weak reference table. Since the weak reference table uses a static hash structure, a variable is needed to record the count.
* `mask`: Counting auxiliary value.
* `max_hash_displacement`: The upper threshold for hash elements.

> In fact, the value of `out_of_line` is usually zero, so the weak reference table is always a two-dimensional array of `objc_objective` pointers. A one-dimensional `objc_objective` pointer array can form a weak reference hash table. Through the third dimension, multiple hash tables are implemented, and the number of tables is `WEAK_INLINE_COUNT`.

That's how the weak table works under the hood.

#### 3. Release

During release, the `clearDeallocating` function is called. The `clearDeallocating` function first gets the array of all `weak` pointer addresses based on the object's address, then iterates through this array setting the data to `nil`, and finally removes this `entry` from the `weak` table, and cleans up the object's record.

##### When the object pointed to by a weak reference is released, how is the weak pointer handled? Here's the basic flow when an object is released:

* 1. Call `objc_release`
* 2. Because the object's reference count is 0, execute `dealloc`
* 3. In dealloc, call `_objc_rootDealloc`
* 4. In `_objc_rootDealloc`, call `object_dispose`
* 5. Call `objc_destructInstance`
* 6. Finally call `objc_clear_deallocating`

Let's focus on the `objc_clear_deallocating` function called when the object is released. Here's this function's implementation:

``` objc
void objc_clear_deallocating(id obj)  
{
    ASSERT(obj);
    if (obj->isTaggedPointer()) return;
    obj->clearDeallocating();
}
```
It calls `clearDeallocating()`. Tracing through the source code, it ultimately uses an iterator to get the `value` from the `weak` table, then calls `weak_clear_no_lock()` to find the corresponding `value` and set the `weak` pointer to nil.

Here's the `weak_clear_no_lock()` function's implementation:

``` objc
void weak_clear_no_lock(weak_table_t *weak_table, id referent_id) 
{
    objc_object *referent = (objc_object *)referent_id;
    weak_entry_t *entry = weak_entry_for_referent(weak_table, referent);
    if (entry == nil) {
        /// XXX shouldn't happen, but does with mismatched CF/objc
        //printf("XXX no entry for clear deallocating %p\n", referent);
        return;
    }
    // zero out references
    weak_referrer_t *referrers;
    size_t count;
    if (entry->out_of_line()) {
        referrers = entry->referrers;
        count = TABLE_SIZE(entry);
    } 
    else {
        referrers = entry->inline_referrers;
        count = WEAK_INLINE_COUNT;
    }
    for (size_t i = 0; i < count; ++i) {
        objc_object **referrer = referrers[i];
        if (referrer) {
            if (*referrer == referent) {
                *referrer = nil;
            }
            else if (*referrer) {
                _objc_inform("__weak variable at %p holds %p instead of %p. "
                             "This is probably incorrect use of "
                             "objc_storeWeak() and objc_loadWeak(). "
                             "Break on objc_weak_error to debug.\n", 
                             referrer, (void*)*referrer, (void*)referent);
                objc_weak_error();
            }
        }
    }
    weak_entry_remove(weak_table, entry);
}
```

The `objc_clear_deallocating()` function does the following:

* 1. Get the record with the deallocated object's address as the key from the weak table
* 2. Set all addresses of weak-modified variables contained in the record to nil
* 3. Delete this record from the weak table
* 4. Delete the record with the deallocated object's address as the key from the reference count table

[Reference](https://www.jianshu.com/p/13c4fb1cedea)

## Applications of Associated Objects? How Does the System Implement Associated Objects?

### Applications of Associated Objects?

Generally used in `category` to add associated properties to the current class, because you can't directly add member variables, but you can indirectly achieve the effect of adding member variables through runtime.

When we declare the following code in a `category`:

``` objc
@interface ClassA : NSObject (Category)
@property (nonatomic, strong) NSString *property;
@end
```

Actually, the `@property` keyword, a built-in keyword in the objc standard library, helps us implement the setter and getter. But in a category, it can't help us declare the member variable `property`. We need to indirectly implement dynamically adding the member variable `property` through two C function APIs provided by runtime:

* `objc_setAssociatedObject()`
* `objc_getAssociatedObject()`

``` objc
#import "ClassA+Category.h"
#import <objc/runtime.h>

@implementation ClassA (Category)

- (NSString *) property {
    return objc_getAssociatedObject(self, _cmd);
}

- (void)setProperty:(NSString *)categoryProperty {
    objc_setAssociatedObject(self, @selector(property), categoryProperty, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

@end
```

Looking at the associated methods above, let's study the commonly used associated property-related APIs in detail:

``` c
void objc_setAssociatedObject(id object, const void *key, id value, objc_AssociationPolicy policy);
id objc_getAssociatedObject(id object, const void *key);
void objc_removeAssociatedObjects(id object);
```

1. `objc_setAssociatedObject()` adds an associated object in key-value pair form
2. `objc_getAssociatedObject()` gets the associated object by key
3. `objc_removeAssociatedObjects()` removes all associated objects

The call stack of `objc_setAssociatedObject()`:

``` objc
void objc_setAssociatedObject(id object, const void *key, id value, objc_AssociationPolicy policy)
└── SetAssocHook.get()(object, key, value, policy)
    └── void _object_set_associative_reference(id object, void *key, id value, uintptr_t policy)
```

The `_object_set_associative_reference()` function in the above call stack actually accomplishes the task of setting the associated object:

``` c++
void
_object_set_associative_reference(id object, const void *key, id value, uintptr_t policy)
{
     if (!object && !value) return;
    if (object->getIsa()->forbidsAssociatedObjects())
        _objc_fatal("objc_setAssociatedObject called on instance (%p) of class %s which does not allow associated objects", object, object_getClassName(object));
    DisguisedPtr<objc_object> disguised{(objc_object *)object};
    ObjcAssociation association{policy, value};
    association.acquireValue();
    {
        AssociationsManager manager;
        AssociationsHashMap &associations(manager.get());
        if (value) {
            auto refs_result = associations.try_emplace(disguised, ObjectAssociationMap{});
            if (refs_result.second) {
                object->setHasAssociatedObjects();
            }
            auto &refs = refs_result.first->second;
            auto result = refs.try_emplace(key, std::move(association));
            if (!result.second) {
                association.swap(result.first->second);
            }
        } else {
            ...
        }
    }
    association.releaseHeldValue();
}
```

A lot of code has been omitted. The above code shows the application scenario. The `AssociationsManager` class called above is the principle of how the system implements associated objects, which we'll discuss below.


### How Does the System Implement Associated Objects? (Associated Object Implementation Principle)

The core objects for implementing associated object technology are:

1. AssociationsManager
2. AssociationsHashMap  
3. ObjectAssociationMap
4. ObjcAssociation  

> The Map is similar to the dictionaries we usually use. Values are stored in `key`-`value` form.

Let's explore through the source code:

#### `objc_setAssociatedObject()` Function

Runtime source code:

``` sh
void objc_setAssociatedObject(id object, const void *key, id value, objc_AssociationPolicy policy)
{
    _object_set_associative_reference(object, key, value, policy);
}
```
> The source code call process has hook functions and is a bit long. I'll simplify it here by directly calling the core function.

Now let's look at the implementation of the `_object_set_associative_reference()` function:

``` objc
void _object_set_associative_reference(id object, const void *key, id value, uintptr_t policy)
{
    if (object->getIsa()->forbidsAssociatedObjects())
        _objc_fatal("objc_setAssociatedObject called on instance (%p) of class %s which does not allow associated objects", object, object_getClassName(object));
    DisguisedPtr<objc_object> disguised{(objc_object *)object};
    ObjcAssociation association{policy, value}; //4. 我们用到的ObjcAssociation
    association.acquireValue();
    {
        AssociationsManager manager; //1. 我们用到的AssociationsManager
        AssociationsHashMap &associations(manager.get()); //2.我们上面列举的AssociationsHashMap
        if (value) {
            auto refs_result = associations.try_emplace(disguised, ObjectAssociationMap{}); //3.我们用到的ObjectAssociationMap
            if (refs_result.second) {
                object->setHasAssociatedObjects();
            }
            auto &refs = refs_result.first->second;
            auto result = refs.try_emplace(key, std::move(association));
            if (!result.second) {
                association.swap(result.first->second);
            }
        } else {
            auto refs_it = associations.find(disguised);
            if (refs_it != associations.end()) {
                auto &refs = refs_it->second;
                auto it = refs.find(key);
                if (it != refs.end()) {
                    association.swap(it->second);
                    refs.erase(it);
                    if (refs.size() == 0) {
                        associations.erase(refs_it);
                    }
                }
            }
        }
    }
    association.releaseHeldValue();
}
```
The code above shows the core objects behind associated objects. Let's walk through the internal implementation of each one.

#####  AssociationsManager

``` objc
typedef DenseMap<const void *, ObjcAssociation> ObjectAssociationMap;
typedef DenseMap<DisguisedPtr<objc_object>, ObjectAssociationMap> AssociationsHashMap;
class AssociationsManager {
    using Storage = ExplicitInitDenseMap<DisguisedPtr<objc_object>, ObjectAssociationMap>;
    static Storage _mapStorage;

public:
    AssociationsManager()   { AssociationsManagerLock.lock(); }
    ~AssociationsManager()  { AssociationsManagerLock.unlock(); }

    AssociationsHashMap &get() {
        return _mapStorage.get();
    }
    static void init() {
        _mapStorage.init();
    }
};
```

`AssociationsManager` has a `get()` function inside that returns an `AssociationsHashMap` object.

##### AssociationsHashMap

`AssociationsHashMap` is a typedef of `DenseMap` (can be understood as an alias), but it's defined as a `DenseMap` type that conforms to certain `tuple` conditions.

Actually, `AssociationsHashMap` is used to save the mapping from an object's `disguised_ptr_t` to `ObjectAssociationMap`. This data structure stores all associated objects corresponding to the current object.


``` objc
typedef DenseMap<const void *, ObjcAssociation> ObjectAssociationMap;
typedef DenseMap<DisguisedPtr<objc_object>, ObjectAssociationMap> AssociationsHashMap;
```

Here `ObjectAssociationMap` is a typedef of another type, storing `ObjcAssociation` type object pointers in key-value form.

Now let's look at `ObjcAssociation`. This is a C++ class object. The key is that `ObjcAssociation` contains `policy` and `value`.

``` c++
class ObjcAssociation {
    uintptr_t _policy;
    id _value;
public:
    ObjcAssociation(uintptr_t policy, id value) : _policy(policy), _value(value) {}
    ObjcAssociation() : _policy(0), _value(nil) {}
    ObjcAssociation(const ObjcAssociation &other) = default;
    ObjcAssociation &operator=(const ObjcAssociation &other) = default;
    ObjcAssociation(ObjcAssociation &&other) : ObjcAssociation() {
        swap(other);
    }
    inline void swap(ObjcAssociation &other) {
        std::swap(_policy, other._policy);
        std::swap(_value, other._value);
    }
    inline uintptr_t policy() const { return _policy; }
    inline id value() const { return _value; }
    ...
};
```

##### In What Form Are Associated Objects Stored in Memory?

Example code:

``` objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSObject *obj = [NSObject new];
        objc_setAssociatedObject(obj, @selector(hello), @"Hello", OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }
    return 0;
}
```

This call to `objc_setAssociatedObject(OBJC_ASSOCIATION_RETAIN_NONATOMIC, @"Hello")` has the following storage structure in memory:

![Association Order](/assets/images/20200808iOSinterviewAnswers/AssociationOrder.avif)


##### `objc_setAssociatedObject()`

Let's go back and break down the actual implementation part of the `objc_setAssociatedObject()` function, which is `_object_set_associative_reference()`.

This function takes `(id object, const void *key, id value, uintptr_t policy)` as parameters. Let's use the third `value` parameter to break it down.

We can break it down into 2 steps:

1. `value != nil` — set or update the associated object's value
2. `value == nil` — remove an associated object.

Below is the detailed code explanation. **Pay attention to the code comments!!!**

``` objc
void
_object_set_associative_reference(id object, const void *key, id value, uintptr_t policy)
{
    // 判空
    if (!object && !value) return;

	// 判断本类对象是否允许关联其他对象.如果允许则进入代码块
    if (object->getIsa()->forbidsAssociatedObjects())
        _objc_fatal("objc_setAssociatedObject called on instance (%p) of class %s which does not allow associated objects", object, object_getClassName(object));

	// 将被关联的对象封装成DisguisedPtr方便在后边hash表中的管理,它的作用就像是一个指针
    DisguisedPtr<objc_object> disguised{(objc_object *)object};
    // 将需要关联的对象,封装成ObjcAssociation,方便管理
    ObjcAssociation association{policy, value};

    // 处理policy为retain和copy的修饰情况,
    association.acquireValue();

    {
    	// 获取关联对象管理者对象
        AssociationsManager manager;
        // 根据管理者对象获取对应关联表(HashMap)
        AssociationsHashMap &associations(manager.get());

        if (value) {
        	// 如果这个disguised存在于ObjectAssociationMap()中,则替换,如果不存在则初始化后在插入
        	// 这里说明一下,我们关联的对象关系存在于ObjectAssociationMap中,而
        	//	ObjectAssociationMap有多个,所以,这一步是对ObjectAssociationMap的一个管理,下边才是对我们要关联的对象的操作
            auto refs_result = associations.try_emplace(disguised, ObjectAssociationMap{});
            // 如果这是此对象第一次被关联
            if (refs_result.second) {
               // 修改isa_t中的has_assoc字段,标记其被关联状态
                object->setHasAssociatedObjects();
            }

            // 这里才是对我们要关联的对象操作
            auto &refs = refs_result.first->second;
            // 想map中插入key value对
            auto result = refs.try_emplace(key, std::move(association));
            // 这里没有看懂,为什么没有第二个就要交换一下..
            if (!result.second) {
                association.swap(result.first->second);
            }
        } else {
        	// value为空, 并且在associations中有记录,则进行擦除操作
            auto refs_it = associations.find(disguised);
            if (refs_it != associations.end()) {
                auto &refs = refs_it->second;
                auto it = refs.find(key);
                if (it != refs.end()) {
                    association.swap(it->second);
                    refs.erase(it);
                    if (refs.size() == 0) {
                        associations.erase(refs_it);
                    }
                }
            }
        }
    }

    // release the old value (outside of the lock).
    association.releaseHeldValue();
}
```

##### What Does the `objc_setAssociatedObject()` Function Do?

``` c++
inline void
objc_object::setHasAssociatedObjects()
{
    if (isTaggedPointer()) return;

 retry:
    isa_t oldisa = LoadExclusive(&isa.bits);
    isa_t newisa = oldisa;
    if (!newisa.nonpointer  ||  newisa.has_assoc) {
        ClearExclusive(&isa.bits);
        return;
    }
    newisa.has_assoc = true;
    if (!StoreExclusive(&isa.bits, oldisa.bits, newisa.bits)) goto retry;
}
```

It marks the `has_assoc` flag in the `isa` struct as `true`, indicating that the current object has associated objects. The diagram below shows what each flag bit in `isa` does.

![isa](/assets/images/20200808iOSinterviewAnswers/isa.avif)

##### `objc_getAssociatedObject()`

Here's the call stack of this function:

``` sh
id objc_getAssociatedObject(id object, const void *key)
└── id _object_get_associative_reference(id object, const void *key);
```
With the introduction above, understanding this function is quite simple now:

``` objc
id
_object_get_associative_reference(id object, const void *key)
{
    ObjcAssociation association{};
    {
        AssociationsManager manager; //1
        AssociationsHashMap &associations(manager.get()); //1
        AssociationsHashMap::iterator i = associations.find((objc_object *)object); //2
        if (i != associations.end()) {
            ObjectAssociationMap &refs = i->second;
            ObjectAssociationMap::iterator j = refs.find(key);
            if (j != refs.end()) {
                association = j->second;
                association.retainReturnedValue();
            }
        }
    }
    return association.autoreleaseReturnedValue();
}
```
1. Get the `AssociationsHashMap` hash table through `AssociationsManager`
2. Find the associated object through the hash table
3. The rest is updating flags like whether the object is being created for the first time, then returning the object

##### `objc_removeAssociatedObjects()`

Here's the call stack:

``` sh
void objc_removeAssociatedObjects(id object)
└── void _object_remove_assocations(id object)
```

Specific code implementation:

``` objc
void objc_removeAssociatedObjects(id object) 
{
    if (object && object->hasAssociatedObjects()) { 
        _object_remove_assocations(object);
    }
}
```
> Check whether the object is nil and whether associated objects exist

Then the implementation call is similar to get above:

``` objc
void
_object_remove_assocations(id object)
{
    ObjectAssociationMap refs{};
    {
        AssociationsManager manager;
        AssociationsHashMap &associations(manager.get());
        AssociationsHashMap::iterator i = associations.find((objc_object *)object);
        if (i != associations.end()) {
            refs.swap(i->second);
            associations.erase(i);
        }
    }
    // release everything (outside of the lock).
    for (auto &i: refs) {
        i.second.releaseHeldValue();
    }
}
```
Through `AssociationsManager` -> `AssociationsHashMap` -> check whether the object exists, if it does, **erase** it -> releaseHeldValue() to release the object.
 
#### Summary

Here's the general order of associated object applications and how the system implements associated objects:
`AssociationsManager` associated object manager -> `AssociationsHashMap` hash map -> `ObjectAssociationMap` associated object pointer -> `ObjcAssociation` associated object

## How Are Associated Objects Managed in Memory? How to Implement weak Properties with Associated Objects?

### How Are Associated Objects Managed in Memory?

When I call the associated object function `objc_setAssociatedObject()`, the following function is called:

`_object_set_associative_reference(id object, const void *key, id value, uintptr_t policy)`, which has a method:

``` objc
ObjcAssociation association{policy, value};
// retain the new value (if any) outside the lock.
association.acquireValue();
```

The `policy` here determines whether to use retain or other related memory enums.

``` objc
enum {
    OBJC_ASSOCIATION_SETTER_ASSIGN      = 0,
    OBJC_ASSOCIATION_SETTER_RETAIN      = 1,
    OBJC_ASSOCIATION_SETTER_COPY        = 3,            // NOTE:  both bits are set, so we can simply test 1 bit in releaseValue below.
    OBJC_ASSOCIATION_GETTER_READ        = (0 << 8),
    OBJC_ASSOCIATION_GETTER_RETAIN      = (1 << 8),
    OBJC_ASSOCIATION_GETTER_AUTORELEASE = (2 << 8)
};
```
The acquireValue() function determines which memory keyword to use:

``` objc
inline void acquireValue() {
    if (_value) {
        switch (_policy & 0xFF) {
        case OBJC_ASSOCIATION_SETTER_RETAIN:
            _value = objc_retain(_value);
            break;
        case OBJC_ASSOCIATION_SETTER_COPY:
            _value = ((id(*)(id, SEL))objc_msgSend)(_value, @selector(copy));
            break;
        }
    }
}
```

### How to Implement weak Properties with Associated Objects?

First, this is a very technically deep question that fully tests an iOS developer's understanding of the underlying mechanisms.

When binding an associated object to an NSObject, you can specify the following dependency relationships:

``` objc
typedef OBJC_ENUM(uintptr_t, objc_AssociationPolicy) {
    OBJC_ASSOCIATION_ASSIGN = 0, //弱引用
    OBJC_ASSOCIATION_RETAIN_NONATOMIC = 1, //强引用，非原子操作
    OBJC_ASSOCIATION_COPY_NONATOMIC = 3,  //先 copy，然后强引用
    OBJC_ASSOCIATION_RETAIN = 01401, //强引用，原子操作
    OBJC_ASSOCIATION_COPY = 01403 //先 copy，然后强引用，原子操作
};
```
Based on the above enum, we find a strange problem — there's no `OBJC_ASSOCIATION_WEAK` option in this enum.

Based on the code introduction above, we know that `Objective-C` uses `AssociationsManager` at the underlying level to uniformly manage each object's `associated objects`. Then it accesses the corresponding `associated object` through a `static key` (usually a fixed value). When `dealloc` is called, it calls the `erase function` (`associations.erase()`) to remove references to these associated objects:

``` sh
dealloc
    object_dispose
        objc_destructInstance
            _object_remove_assocations  // 移除必要的associated objects
```
In other words, in the `NSObject` object's memory space, no variables are allocated for `associated objects`.

We know the difference between weak and assign variables is: when the object pointed to by a weak variable is deallocated, `Objective-C` automatically sets it to `nil`, but `assign` does not.

How is this logic implemented?

`Runtime` maintains a `weak` table at the underlying level (which is the `weak_table_t` `weak_tabl` in the `SlideTable` described at the beginning of this article). Each time a `weak` pointer is allocated and assigned a valid object address, the object address and `weak` pointer address are registered in the `weak` table, with the object address as the `key`. When the object is deallocated, all `weak` pointers pointing to it can be quickly found by the object address, and these `weak` pointers are set to `0` (i.e., `nil`) and removed from the `weak` table.

Therefore, the prerequisite for implementing a `weak` reference (rather than an `assign` reference) is the existence of a `__weak` pointer pointing to the referenced object's address. Only in this way, when the object is deallocated, can the pointer be found by `runtime` and set to `nil`. The relationship between an `NSObject` object and its `associated object` does not have such a **intermediary** pointer, so there's only an `OBJC_ASSOCIATION_ASSIGN` option, but no `OBJC_ASSOCIATION_WEAK` option.

#### So How Do We Implement weak Properties for Associated Objects?

We can use an indirect approach by declaring a `class` that holds a weak member variable, then instantiating our custom class and using that instance as the associated object.

Declare a class that wraps the weak object:

```  objc
@interface WeakAssociatedObjectWrapper : NSObject
@property (nonatomic, weak) id object;
@end

@implementation WeakAssociatedObjectWrapper
@end
```

Usage:

``` objc
@interface UIView (ViewController)
@property (nonatomic, weak) UIViewController *vc;
@end

@implementation UIView (ViewController)
- (void)setVc:(UIViewController *)vc {
    WeakAssociatedObjectWrapper *wrapper = [WeakAssociatedObjectWrapper new];
    wrapper.object = vc;
    objc_setAssociatedObject(self, @selector(vc), wrapper, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}
- (UIViewController *)vc {
    WeakAssociatedObjectWrapper *wrapper = objc_getAssociatedObject(self, _cmd);
    return wrapper.object;
}
@end
```
> Do you see it? An indirect approach. Code adapted from [Weak Associated Object](https://zhangbuhuai.com/post/weak-associated-object.html)  

[Associated Object Reference](https://draveness.me/ao/)

##  What Is the Principle of Autoreleasepool? What Data Structure Does It Use?


Under ARC, we use the `@autoreleasepool{}` keyword to wrap the code block that needs automatic management. This process is using an `AutoReleasePool`:

``` objc
@autoreleasepool {
	 <#statements#> //代码块
}
```
The compiler eventually rewrites that code into:

``` c
void *context = objc_autoreleasePoolPush();
```

Since there's a push, there must be a pop operation `objc_autoreleasePoolPop(context)`;

* `objc_autoreleasePoolPush()`
* `objc_autoreleasePoolPop()`

Both functions are wrappers for `AutoreleasePoolPage`. The core of the autorelease mechanism is this class.

###  `AutoreleasePoolPage`

`AutoreleasePoolPage` is a C++ class:

![autoreleasepoolpage](/assets/images/20200808iOSinterviewAnswers/autoreleasepoolpage.avif)

* **AutoreleasePool** doesn't have a separate structure. Instead, it's composed of several `AutoreleasePoolPage` objects in a `doubly linked list` form. As shown in the diagram above, this doubly linked list has `parent predecessor` and `child successor`.
*  **AutoreleasePool** corresponds one-to-one by `thread` (thread member variable)
*  **AutoreleasePoolPage** is the data structure for the autorelease pool to store objects. Each page occupies `4KB` of memory. Its own member variables occupy `56` bytes. The remaining space is used to store the addresses of objects that called the `autorelease` method. A sentinel is also inserted into the page — this sentinel is actually a nil address.
*  When a page is full, a new `AutoreleasePoolPage` object is created and a sentinel is inserted.
Here's the specific code:

``` objc
class AutoreleasePoolPage {
#   define EMPTY_POOL_PLACEHOLDER ((id*)1)
#   define POOL_BOUNDARY nil
    static pthread_key_t const key = AUTORELEASE_POOL_KEY;
    static uint8_t const SCRIBBLE = 0xA3;  // 0xA3A3A3A3 after releasing
    static size_t const SIZE = 
#if PROTECT_AUTORELEASEPOOL
        PAGE_MAX_SIZE;  // must be multiple of vm page size
#else
        PAGE_MAX_SIZE;  // size and alignment, power of 2
#endif
    static size_t const COUNT = SIZE / sizeof(id);
    magic_t const magic;
    id *next;
    pthread_t const thread;
    AutoreleasePoolPage * const parent;
    AutoreleasePoolPage *child;
    uint32_t const depth;
    uint32_t hiwat;
};

```

* `magic` — variable for checking integrity
* `next` — points to the newly added autorelease object
* `thread` — the thread the page is currently on. AutoreleasePool corresponds one-to-one by thread (the thread pointer in the struct points to the current thread)
* `parent` — parent node, points to the previous page
* `child` — child node, points to the next page
* `depth` — the depth of the linked list, number of nodes
* `hiwat` — high water mark, the upper limit for data capacity
* `EMPTY_POOL_PLACEHOLDER` — empty pool placeholder
* `POOL_BOUNDARY` — is a boundary object nil. The previous source code variable name was `POOL_SENTINEL` sentinel object, used to distinguish each page boundary of each AutoreleasePoolPage
* `PAGE_MAX_SIZE` = 4096. Why 4096? It's actually the virtual memory page size of 4096 bytes, the 4K alignment concept.
* `COUNT` — number of objects in a page


Now let's look at the working mechanism diagram:

![autoreleasepoolworkflow](/assets/images/20200808iOSinterviewAnswers/autoreleasepoolworkflow.avif)

> This diagram is from my Kuaishou colleague Zhou Xueyun. If the original author sees this, I hope they'll allow me to use it.

Based on the diagram above, we can roughly understand that `AutoreleasePoolPage` exists in stack form, and internal objects are pushed and popped corresponding to `objc_autoreleasePoolPush` and `objc_autoreleasePoolPop`.

If AutoreleasePools are nested, they're identified by the `sentinel object`. Each time the linked list's next, `predecessor`, and `successor` are updated to complete the creation and destruction of the table.

![autoreleasepoolpage](/assets/images/20200808iOSinterviewAnswers/autoreleasepoolpage1.avif)

When we send an `autorelease` message to an object, it's actually adding the object to the position pointed to by the current `AutoreleasePoolPage`'s stack top `next` pointer.

> Only one page is used as an example here.

#### Summary

* The autorelease pool consists of N `AutoreleasePoolPage` objects, each page 4K in size. AutoreleasePoolPage is a C++ class. AutoreleasePoolPage objects are connected as a doubly linked list to form the autorelease pool.
* When an object calls the autorelease method, the object is added to the AutoreleasePoolPage's stack
* During pop, the boundary object (sentinel object) is passed in, and then release messages are sent to the objects in the page

[Autorelease Pool Principle](https://www.jianshu.com/p/0afda1f23782)
[AutoreleasePool Implementation Principle](https://juejin.im/post/6844903609428115470)


## What Is the Implementation Principle of ARC? What Optimizations Were Made to retain and release Under ARC?

ARC (Automatic Reference Counting) is a mechanism introduced by Apple in objc4 where the compiler automatically inserts retain or release calls at appropriate positions for instance objects.

Its implementation principle is to insert relevant code at the compilation level, helping to complete the object-related memory operation methods that developers needed to manually write and manage in the MRC era.

To explain the implementation principle clearly, I found an article with code examples. From the process of compiling code into assembly, the compiler does a lot of optimization work. It updates the `isa pointer` information.

[Understanding ARC Implementation Principles](https://juejin.im/post/6844903847622606861#heading-4)

There's a point I need to mention. Above we discussed SlideTable, but there are still some unclear parts. Let's connect them through isa.

The composition of isa:

``` c
union isa_t 
{
    Class cls;
    uintptr_t bits;
    struct {
         uintptr_t nonpointer        : 1;//->表示使用优化的isa指针
         uintptr_t has_assoc         : 1;//->是否包含关联对象
         uintptr_t has_cxx_dtor      : 1;//->是否设置了析构函数，如果没有，释放对象更快
         uintptr_t shiftcls          : 33; // MACH_VM_MAX_ADDRESS 0x1000000000 ->类的指针
         uintptr_t magic             : 6;//->固定值,用于判断是否完成初始化
         uintptr_t weakly_referenced : 1;//->对象是否被弱引用
         uintptr_t deallocating      : 1;//->对象是否正在销毁
         uintptr_t has_sidetable_rc  : 1;//1->在extra_rc存储引用计数将要溢出的时候,借助Sidetable(散列表)存储引用计数,has_sidetable_rc设置成1
        uintptr_t extra_rc          : 19;  //->存储引用计数
    };
};

```

Among them, `nonpointer`, `weakly_referenced`, `has_sidetable_rc`, and `extra_rc` are member variables directly related to `ARC`. Most of the others are also involved.

### What Optimizations Were Made to retain and release

It can be roughly divided into the following:

* TaggedPointer — pointer optimization
* !newisa.nonpointer — retain or release with unoptimized isa
* newisa.nonpointer — optimized isa. This is further divided by extra_rc overflow. I'll put the relevant code below and output the conclusions.

| Memory Operation | objc_retain | objc_release |
| :------:| :------: | :------: |
| TaggedPointer | Value stored in pointer, return directly | Return false directly. |
| !nonpointer | Unoptimized `isa`, use `sidetable_retain()` | Unoptimized `isa`, execute `sidetable_release` |
| nonpointer| Optimized `isa`, further divided by `extra_rc` overflow and non-overflow | Optimized `isa`, divided by underflow and non-underflow |


|nonpointer optimized isa's extra_rc | objc_retain | objc_release |
| ------| ------ | ------ |
| No overflow |`isa.extra_rc`+1 | NA |
| Overflow|Transfer half of `isa.extra_rc` to `sidetable`, then set `isa.has_sidetable_rc` to `true`, indicating `sidetable` is used for reference counting|NA|
| No underflow|NA|extra_rc--|
| Underflow|NA|Borrow from `sidetable` to fill `extra_rc` to half. If borrowing fails, it means the reference count has reached zero and the object needs to be released. Borrowing may fail and retry continuously|  
> NA -> not available

Now let's look at the retain source code:

``` objc
ALWAYS_INLINE id objc_object::rootRetain(bool tryRetain, bool handleOverflow) {
    if (isTaggedPointer()) return (id)this;     // 如果是 TaggedPointer 直接返回
    bool sideTableLocked = false;
    bool transcribeToSideTable = false;
    isa_t oldisa;
    isa_t newisa;
    do {
        transcribeToSideTable = false;
        oldisa = LoadExclusive(&isa.bits);  // 获取 isa
        newisa = oldisa;
        if (slowpath(!newisa.nonpointer)) {
            ClearExclusive(&isa.bits);// 未优化的 isa 部分
            if (!tryRetain && sideTableLocked) sidetable_unlock();
            if (tryRetain) return sidetable_tryRetain() ? (id)this : nil;
            else return sidetable_retain();
        }
        if (slowpath(tryRetain && newisa.deallocating)) { // 正在被释放的处理
            ClearExclusive(&isa.bits);
            if (!tryRetain && sideTableLocked) sidetable_unlock();
            return nil;
        }
        // extra_rc 未溢出时引用计数++
        uintptr_t carry;
        newisa.bits = addc(newisa.bits, RC_ONE, 0, &carry);  // extra_rc++
        // extra_rc 溢出
        if (slowpath(carry)) {
            // newisa.extra_rc++ overflowed
            if (!handleOverflow) {
                ClearExclusive(&isa.bits);
                return rootRetain_overflow(tryRetain);   // 重新调用该函数 入参 handleOverflow 为 true
            } 
            // 保留一半引用计数,准备将另一半复制到 side table.
            if (!tryRetain && !sideTableLocked) sidetable_lock();
            sideTableLocked = true;
            transcribeToSideTable = true;
            newisa.extra_rc = RC_HALF;
            newisa.has_sidetable_rc = true;
        }
        //  更新 isa 值
    } while (slowpath(!StoreExclusive(&isa.bits, oldisa.bits, newisa.bits)));
    if (slowpath(transcribeToSideTable)) {
        sidetable_addExtraRC_nolock(RC_HALF); // 将另一半复制到 side table side table.
    }
    if (slowpath(!tryRetain && sideTableLocked)) sidetable_unlock();
    return (id)this;
}
```

`release` source code:

``` objc
ALWAYS_INLINE bool objc_object::rootRelease(bool performDealloc, bool handleUnderflow)
{
    if (isTaggedPointer()) return false;
    bool sideTableLocked = false;
    isa_t oldisa;
    isa_t newisa;
 retry:
    do {
        oldisa = LoadExclusive(&isa.bits);
        newisa = oldisa;
        if (slowpath(!newisa.nonpointer)) {
            ClearExclusive(&isa.bits);// 未优化 isa
            if (sideTableLocked) sidetable_unlock();
            return sidetable_release(performDealloc);// 入参是否要执行 Dealloc 函数，如果为 true 则执行 SEL_dealloc
        }
        newisa.bits = subc(newisa.bits, RC_ONE, 0, &carry);  // extra_rc--
        if (slowpath(carry)) {
            // donot ClearExclusive()
            goto underflow;
        }
        // 更新 isa 值
    } while (slowpath(!StoreReleaseExclusive(&isa.bits, 
                                             oldisa.bits, newisa.bits)));
    if (slowpath(sideTableLocked)) sidetable_unlock();
    return false;
 underflow:
 	// 处理下溢，从 side table 中借位或者释放
    newisa = oldisa;
    if (slowpath(newisa.has_sidetable_rc)) { // 如果使用了 sidetable_rc
        if (!handleUnderflow) {
        	ClearExclusive(&isa.bits);// 调用本函数处理下溢
            return rootRelease_underflow(performDealloc);
        }
        size_t borrowed = sidetable_subExtraRC_nolock(RC_HALF); // 从 sidetable 中借位引用计数给 extra_rc

        if (borrowed > 0) {
		// extra_rc 是计算额外的引用计数，0 即表示被引用一次
            newisa.extra_rc = borrowed - 1;  // redo the original decrement too
            bool stored = StoreReleaseExclusive(&isa.bits, 
                                                oldisa.bits, newisa.bits);                                    
            // 保存失败，恢复现场，重试                                    
            if (!stored) {
                isa_t oldisa2 = LoadExclusive(&isa.bits);
                isa_t newisa2 = oldisa2;
                if (newisa2.nonpointer) {
                    uintptr_t overflow;
                    newisa2.bits = 
                        addc(newisa2.bits, RC_ONE * (borrowed-1), 0, &overflow);
                    if (!overflow) {
                        stored = StoreReleaseExclusive(&isa.bits, oldisa2.bits, 
                                                       newisa2.bits);
                    }
                }
            }
		// 如果还是保存失败，则还回 side table
            if (!stored) {
                sidetable_addExtraRC_nolock(borrowed);
                goto retry;
            }
            sidetable_unlock();
            return false;
        }
        else {
            // Side table is empty after all. Fall-through to the dealloc path.
        }
    }
    // 没有使用 sidetable_rc ，或者 sidetable_rc 计数 == 0 的就直接释放
    // 如果已经是释放中，抛个过度释放错误
    if (slowpath(newisa.deallocating)) {
        ClearExclusive(&isa.bits);
        if (sideTableLocked) sidetable_unlock();
        return overrelease_error();
    }
    // 更新 isa 状态
    newisa.deallocating = true;
    if (!StoreExclusive(&isa.bits, oldisa.bits, newisa.bits)) goto retry;
    if (slowpath(sideTableLocked)) sidetable_unlock();
	// 执行 SEL_dealloc 事件
    __sync_synchronize();
    if (performDealloc) {
        ((void(*)(objc_object *, SEL))objc_msgSend)(this, SEL_dealloc);
    }
    return true;
}
```

### Summary

From this, we can see that reference counts are stored in `isa.extra_rc` and `sidetable` respectively. When `isa.extra_rc` overflows, half the count is transferred to `sidetable`. When it underflows, the count is transferred back. When both are empty, the deallocation process is executed.

## What Situations Can Cause Memory Leaks Under ARC

* Circular references in blocks
* Circular references with NSTimer
* Circular references from addObserver
* Strong references from delegates
* Memory spikes from large number of loop iterations
* Memory handling of non-OC objects (need manual release)


# Summary

That wraps up the runtime and memory management questions from this set of interview questions. The next article will wrap up the remaining questions. Thank you all for your support.

