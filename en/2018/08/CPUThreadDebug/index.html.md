---
layout: post
title: Advanced CPU and Thread Debugging Techniques in iOS
date: 2018-08-17 17:19:23
categories: [iOS]
tags: [iOS, macOS, Objective-C, skills]
typora-root-url: ..
math: false
mermaid: false

---


# Preface 

Recently I was developing a live-streaming app, and I found that once CPU usage maxed out, the CPU downclocked, overheating got severe, and then came the stutter...

To pinpoint this problem, we spent at least 3 days tracing the thread code that was consuming CPU, step by step. When we hit C++ threads, there was no symbol table — all we could see was a blob of object addresses, not even a method name. We were completely at a loss. This post introduces an advanced debugging method that uses the symbol table and related instructions to trace the code calls. It's not the best-written piece, so I hope the masters will go easy on me. Special thanks to my colleague Chen Hao for his strong support with the code process.


# Talk is cheap show me the code

Our approach is to find the base address of the dynamic library and start from there, using the relevant instructions to recover the call chain.


### Preparation

* Enable the symbol table (dSYM) in build settings.

![enable Dysm](/assets/images/20180817CPUThreadDebug/enableDysm.avif)




## 1. Import the Header File


``` objc
#import <mach-o/dyld.h>
```

This is the header for macOS's dynamic linker for executable files. It contains several built-in functions we need.

## 2. Copy the Code Below to Where You Want to Use It

``` objc
//1
uint32_t count = _dyld_image_count();
DDLogInfo(@"Dyld image count %d", count);
//2
for (int i = 0; i < count; i++) {
    char *image_name = (char *)_dyld_get_image_name(i);
    //3
    const struct mach_header *mh = _dyld_get_image_header(i);
    intptr_t vmaddr_slide = _dyld_get_image_vmaddr_slide(i);
    //4
    NSLog(@"Image name %s at address 0x%llx and ASLR slide 0x%lx.\n",
              image_name, (mach_vm_address_t)mh, vmaddr_slide);
}

```

Let me explain the code above.

* 1. Get the number of current images.
* 2. Iterate through the images.
* 3. Get the base address of each image.
* 4. Print the info.

Then run your program.

Then check the console and filter our log entries by `ASLR`.

![consolo Debug](/assets/images/20180817CPUThreadDebug/consoloDebug.avif)


Then click Product in the Xcode project.

![products](/assets/images/20180817CPUThreadDebug/products.avif)

Right-click and choose "Show in Finder".

![product Dir](/assets/images/20180817CPUThreadDebug/productDir.avif)

Next, open Terminal, `cd` to that directory (you can open Terminal, type `cd` + space, then drag the folder in).

![dir Final](/assets/images/20180817CPUThreadDebug/dirFinal.avif)

Then run `pwd` to check.


## 3. Search the Console for Our Log Output

Find the first base address.

![importent](/assets/images/20180817CPUThreadDebug/importent.avif)

> Note: __this step is very important. If it doesn't work, try again a few times.__

#### Grab the base address of main from the ASLR log and copy it, then __paste it into the terminal__

``` sh
atos -arch arm64 -o com_kwai_gif.app.dSYM/Contents/Resources/DWARF/com_kwai_gif -l  0x1006b8000
```

> Note: __this is the symbol table path__. If you don't know where to find it, google it.

Let's test whether it works.

First, click the button at the top of the console panel.

![breakpoint](/assets/images/20180817CPUThreadDebug/breakpoint1.avif)


Then type `bt` in the console.

![main](/assets/images/20180817CPUThreadDebug/main.avif)



If you see the following, it means you've succeeded.

![main Result](/assets/images/20180817CPUThreadDebug/mainResult.avif)

## 4. Run on a Real Device and Find the Unknown Threads

First, click Profile in the Xcode project to run `instruments`. In my case, after running the project, Xcode 9.4 can seamlessly switch to `instruments`.

![instruments](/assets/images/20180817CPUThreadDebug/instruments0.avif)

We find a relevant thread — no name, we don't even know what the object is, just a hex address.

![instruments](/assets/images/20180817CPUThreadDebug/instruments2.avif)

Pick an arbitrary address and type it in the terminal.

![instruments](/assets/images/20180817CPUThreadDebug/instruments3.avif)


OK. If you run into problems, delete the product and the symbol table and recompile.

# Summary

The CPU debugging process is quite painful, and most of the intermediate code is C++ calls — the main overhead comes from thread consumption. There's a lot to learn from it, and I hope you'll share your feedback.

The End
