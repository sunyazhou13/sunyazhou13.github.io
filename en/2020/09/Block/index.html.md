---
layout: post
title: A Set of Efficient iOS Interview Questions from Alibaba and Bytedance — Block
date: 2020-09-17 14:34:10
categories: [iOS, 系统理论实践]
tags: [Algorithm, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---

![i OS Interview Questions Album Cover](/assets/images/20200721iOSinterviewAnswers/iOSInterviewQuestionsAlbumCover.avif)

# Preface

This article has a strong personal flavor; if it makes you uncomfortable, please close it right away. This article is only for personal study notes. You're welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for the support!


## Block

In this post, we'll study objc's Block and answer the following interview questions:

1. Block's internal implementation — what does its struct look like?
2. Is Block a class? What types are there?
3. What's the difference between an int variable modified with `__block` and one without? Block variable capture
4. When modifying an `NSMutableArray` in a Block, do you need to add `__block`?
5. How is memory managed?
6. Can a Block be modified with `strong`?
7. When solving circular references, why use `__strong` and `__weak`?
8. When does a `block` get `copy`ed?
9. When a `Block` accesses an object-type `auto` variable, what's the difference under `ARC` and `MRC`?

Before answering all these questions, we need to understand some background knowledge about Block:

\- How to view Block's internal implementation, i.e., what the block looks like after being converted into the underlying real c/c++ code? And what's the conversion format or principle?  
\- About variable scope

#### Converting Objective-C to C++

Below is a sample `TestClass.m` class I wrote, with the block code shown here:

OC code:

``` objc
@interface TestClass ()
@end

@implementation TestClass
- (void)testMethods {
    void (^blockA)(int a) = ^(int a) {
        NSLog(@"%d",a);
    };
    if (blockA) {
        blockA(1990);
    }
}
@end
```

After the conversion operation above, we find the following code at the bottom of TestClass.cpp:

C++ code

``` objc
// @interface TestClass ()
/* @end */


// @implementation TestClass


struct __TestClass__testMethods_block_impl_0 {
  struct __block_impl impl;
  struct __TestClass__testMethods_block_desc_0* Desc;
  __TestClass__testMethods_block_impl_0(void *fp, struct __TestClass__testMethods_block_desc_0 *desc, int flags=0) {
    impl.isa = &_NSConcreteStackBlock;
    impl.Flags = flags;
    impl.FuncPtr = fp;
    Desc = desc;
  }
};

static void __TestClass__testMethods_block_func_0(struct __TestClass__testMethods_block_impl_0 *__cself, int a) {

        NSLog((NSString *)&__NSConstantStringImpl__var_folders_wx_b8tcry0j24dbhr7zlzjq3v340000gn_T_TestClass_ee18d3_mi_0,a);
    }

static struct __TestClass__testMethods_block_desc_0 {
  size_t reserved;
  size_t Block_size;
} __TestClass__testMethods_block_desc_0_DATA = { 0, sizeof(struct __TestClass__testMethods_block_impl_0)};

static void _I_TestClass_testMethods(TestClass * self, SEL _cmd) {
    void (*blockA)(int a) = ((void (*)(int))&__TestClass__testMethods_block_impl_0((void *)__TestClass__testMethods_block_func_0, &__TestClass__testMethods_block_desc_0_DATA));
    if (blockA) {
        ((void (*)(__block_impl *, int))((__block_impl *)blockA)->FuncPtr)((__block_impl *)blockA, 1990);
    }
}
```

The code above is generated through the following operations:

Open the terminal, cd to the folder containing TestClass.m, and use the following command:

``` c++
clang -rewrite-objc TestClass.m
```
This will automatically generate the corresponding TestClass.cpp file in the current folder.

> Note: if it says clang is missing, you need to install it. Enter the following:

   ``` sh
   brew install clang-format
   或者
   brew link clang-forma
   然后输入 下面命令测试是否好使
   clang-format --help
   ```

From the code above, we can see that Block is actually a struct type.

The underlying implementation is named based on `__`**class name**`__`**method name**`_`block`_`impl`_`**index** (0 means the 0th block in this method or class; if there are more below, they'll be the 1st block, 2nd, and so on).

``` objc
struct __类名__方法名_block_impl_下标
```

#### About variable scope

The kinds of parameter variables that may be used in a C function:

* Parameter types
* Automatic variables (local variables)
* Static variables (static local variables)
* Static global variables
* Global variables

Because of their special storage regions, three of these variables can be called at any time and in any state:

* Static variables
* Static global variables
* Global variables

The other two each have their own scope; once the scope is exceeded, they get destroyed.  

---


### 1. Block's internal implementation — what does its struct look like?

Now that we've looked at the background knowledge, let's answer this question.

Here's Block's internal implementation:

``` objc
struct __TestClass__testMethods_block_impl_0 {
  struct __block_impl impl; //成员变量
  struct __TestClass__testMethods_block_desc_0* Desc; //desc 结构体声明
  // Constructor
  // fp function pointer
  // desc pointer to the __main_block_desc_ struct instance initialized as a static global variable
  // flags the block's load info (reference count and type info), stored bitwise.
  __TestClass__testMethods_block_impl_0(void *fp, struct __TestClass__testMethods_block_desc_0 *desc, int flags=0) {
    impl.isa = &_NSConcreteStackBlock;
    impl.Flags = flags;
    impl.FuncPtr = fp;
    Desc = desc;
  }
};
//The code inside the block that will be called later: the block value is converted into a C function
//Here, *__cself is the pointer to the Block's value, which is basically the Block's value itself (equivalent to this in C++,
OC里的self)
//__cself is the pointer to the __TestClass__testMethods_block_impl_0 struct implementation
//The Block struct is the __TestClass__testMethods_block_impl_0 struct. The Block's value is constructed through __TestClass__testMethods_block_impl_0
static void __TestClass__testMethods_block_func_0(struct __TestClass__testMethods_block_impl_0 *__cself, int a) {
	NSLog((NSString *)&__NSConstantStringImpl__var_folders_wx_b8tcry0j24dbhr7zlzjq3v340000gn_T_TestClass_9f58f7_mi_0,a);
}

static struct __TestClass__testMethods_block_desc_0 {
  size_t reserved;
  size_t Block_size;
} __TestClass__testMethods_block_desc_0_DATA = { 0, sizeof(struct __TestClass__testMethods_block_impl_0)};

static void _I_TestClass_testMethods(TestClass * self, SEL _cmd) {
    void (*blockA)(int a) = ((void (*)(int))&__TestClass__testMethods_block_impl_0((void *)__TestClass__testMethods_block_func_0, &__TestClass__testMethods_block_desc_0_DATA));
    if (blockA) {
        ((void (*)(__block_impl *, int))((__block_impl *)blockA)->FuncPtr)((__block_impl *)blockA, 1990);
    }
}
```

As you can see, `__TestClass__testMethods_block_impl_0` consists of 3 parts:

* impl — the function pointer points to `__TestClass__testMethods_block_impl_0`  

	``` objc
	struct __block_impl {
	  void *isa;
	  int Flags;
	  int Reserved;  //今后版本升级所需的区域
	  void *FuncPtr; //函数指针
	};
	```
	
* Desc — the Desc pointer pointing to `__TestClass__testMethods_block_impl_0`, used to describe the additional info of this block, including the size of the struct, etc.
	
	``` objc
	static struct __TestClass__testMethods_block_desc_0 {
	  size_t reserved; //今后升级版本所需区域
	  size_t Block_size; //block的大小
	} __TestClass__testMethods_block_desc_0_DATA = { 0, sizeof(struct __TestClass__testMethods_block_impl_0)};
	```
* `__TestClass__testMethods_block_impl_0()` constructor — that is, the concrete implementation of this block

	``` objc
	__TestClass__testMethods_block_impl_0(void *fp, struct __TestClass__testMethods_block_desc_0 *desc, int flags=0) {
    impl.isa = &_NSConcreteStackBlock;
    impl.Flags = flags;
    impl.FuncPtr = fp;
    Desc = desc;
	}
	```
	In this struct:
	* The isa pointer holds the pointer to the struct instance of the class it belongs to.
	* `struct __TestClass__testMethods_block_impl_0` is equivalent to the struct of an Objective-C class object.
	* `_NSConcreteStackBlock` is equivalent to the struct instance of a Block — that is, **a Block is actually Objective-C's object-based implementation of closures**.

So — do you understand Block's internal implementation now? Do you remember what its struct looks like? It may look tedious, but if you observe the code carefully, you'll find it's actually fairly simple.

### 2. Is Block a class? What types are there?

Block can be considered a class, because it has an isa pointer. Block's isa type includes:

* _NSConcreteGlobalBlock — like a global variable, placed in the program's data region (.data)
* _NSConcreteStackBlock — on the stack (everything discussed earlier was about stack blocks)
* _NSConcreteMallocBlock — on the heap

> This isa can be manipulated with bitwise operations.

### 3. What's the difference between an int variable modified with `__block` and one without? Block variable capture

#### The difference between being modified by `__block` or not
Let's answer this question with a piece of sample code:

``` objc
__block int a = 10;
int b = 20;
    
PrintTwoIntBlock block = ^(){
    a -= 10;
    printf("%d, %d\n",a,b);
};
    
block();//0 20
    
a += 20;
b += 30;
    
printf("%d, %d\n",a,b);//20 50
    
block();/10 20
 
```
When `int` `a` is modified by `__block`, the reference to this variable inside the block body is a pointer copy. It's passed into the struct as a constructor parameter, and the pointer reference to the variable is copied, which allows the variable to be modified.


`int` `b` is not modified by `__block`, so inside the block, `b` is copied by value. Modifying `b` inside the block doesn't affect the outer `b`.

#### Block variable capture

Let's observe variable capture with the following code:

``` objc
blk_t blk;
{
    id array = [NSMutableArray new];
    blk = [^(id object){
        [array addObject:object];
        NSLog(@"array count = %ld",[array count]);
    } copy];
}
blk([NSObject new]);
blk([NSObject new]);
blk([NSObject new]);
```
Output:

``` sh
block_demo[28963:1629127] array count = 1
block_demo[28963:1629127] array count = 2
block_demo[28963:1629127] array count = 3
```
Let's translate the code above into C++ and take a look:

``` c++
struct __main_block_impl_0 {
  struct __block_impl impl;
  struct __main_block_desc_0* Desc;
  id array;//截获的对象
  __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, id _array, int flags=0) : array(_array) {
    impl.isa = &_NSConcreteStackBlock;
    impl.Flags = flags;
    impl.FuncPtr = fp;
    Desc = desc;
  }
};
```

In ObjC, a C struct can't contain variables modified by `__strong`, because the compiler doesn't know when to initialize and discard a C struct. However, ObjC's runtime library can precisely grasp when a `Block` is copied from the stack to the heap, and when a heap block is discarded. This is implemented through the `__TestClass__testMethods_block_copy_0` function and the `__TestClass__testMethods_block_dispose_0` function.

``` objc
static void __TestClass__testMethods_block_copy_0(struct __TestClass__testMethods_block_impl_0*dst, struct __TestClass__testMethods_block_impl_0*src) {
    _Block_object_assign((void*)&dst->array, (void*)src->array, 3/*BLOCK_FIELD_IS_OBJECT*/);
}  
static void __TestClass__testMethods_block_dispose_0(struct __TestClass__testMethods_block_impl_0*src) {
    _Block_object_dispose((void*)src->array, 3/*BLOCK_FIELD_IS_OBJECT*/);
}
```

* `_Block_object_assign` is equivalent to a retain operation — it assigns the object to the struct member variable of object type.  
* `_Block_object_dispose` is equivalent to a release operation.  

When are these two functions called?

| Function | When it's called |
| ------ | ------ |
| `__TestClass__testMethods_block_copy_0 ` | When copying from the stack to the heap | 
| `__TestClass__testMethods_block_dispose_0 ` | When the Block on the heap is discarded | 

##### When is a Block on the stack copied to the heap?

* When the block's copy function is called.  
* When the Block is returned as a function's return value.  
* When the Block is assigned to an id-type or Block-type member variable with the `__strong` modifier.  
* When the Block is passed to a Cocoa framework method that uses a usingBlock parameter, or to a GCD API.  

##### When is a Block discarded?

* When the Block on the heap is released and nobody holds the Block anymore, the dispose function is called.

That's the content about variables being captured by a block.

---

### 4. When modifying `NSMutableArray` in a `block`, do you need to add `__block`?

* If you modify the stored contents of `NSMutableArray`, you don't need to add the `__block` modifier.
* If you modify the `NSMutableArray` object itself, you must add the `__block` modifier.

### 5. How is memory managed?

In the Block constructor `__TestClass__testMethods_block_impl_0` above, the isa pointer points to &_NSConcreteStackBlock, which indicates that the current Block is located in the stack region.

| Block memory operation | Storage region/location |  Effect of the copy operation |
| :------: | :------: |  :------: |
| _NSConcreteGlobalBlock | The program's data region  |  Does nothing |   
| _NSConcreteStackBlock | Stack | Copies from the stack to the heap | 
| _NSConcreteMallocBlock| Heap | Increases the reference count | 

* Global Block: the struct instance of `_NSConcreteGlobalBlock` is set up in the program's data storage region, so it can be accessed by pointer from anywhere in the program. Its conditions:
	* When there's block syntax in a place that records global variables.
	* A block that captures no automatic variables.  
	
	> A global Block is produced as long as either of the above conditions is satisfied.  [Reference](https://juejin.im/post/6844903474312773646#heading-13)
* Stack Block: after `_NSConcreteStackBlock` is generated, if this Block isn't a global Block, then it's a stack Block, and its lifetime is within its enclosing variable scope. (In other words, its destruction depends on the enclosing variable scope.) Once the Block variable and `__block` variable are copied to the heap, they're no longer affected by the end of the variable scope, because they've become heap Blocks.  
* Heap Block: after `_NSConcreteMallocBlock` copies a stack block to the heap, the block struct's isa member variable becomes `_NSConcreteMallocBlock`.

### 6. Can a block be modified with strong?

Under ARC, yes — because in the ARC environment, blocks can only exist in heap memory or global memory, so there's no stack-to-heap copy involved.

Under MRC, no — because there's a copy process. If you use strong when a copy is required, it'll crash. `strong` is a keyword introduced in ARC. Using retain is equivalent to ignoring the block's copy process.

### 7. When solving circular references, why use `__strong` and `__weak`?

First, because when a block captures variables, self is passed in during the struct construction, creating a default reference relationship. So generally, the object being operated on is decorated with `__weak` outside the Block, and inside the Block, the object-type automatic variable is decorated with `__strong`. Then when the Block is copied from the stack to the heap, the object is held by the Block — but since we've added `__weak` to it, a give-and-take chain forms, which just happens to solve the impact the Block's delayed destruction would have on the outer object's lifecycle. Without doing this, it's easy to cause circular references.


### 8. When does a block get copyed?

Under ARC, the compiler automatically copies blocks created on the stack to heap memory. But when a block is passed as a parameter to a method or function, the compiler does not perform the copy operation.

* When the block's copy function is called.  
* When the Block is returned as a function's return value.  
* When the Block is assigned to an id-type or Block-type member variable with the `__strong` modifier.  
* When the Block is passed to a Cocoa framework method that uses a usingBlock parameter, or to a GCD API.

### 9. When a Block accesses an object-type auto variable, what's the difference between ARC and MRC?

Under ARC, the object is strongly referenced; under MRC, it isn't.

[See here for details](https://juejin.im/post/6844903474312773646)
