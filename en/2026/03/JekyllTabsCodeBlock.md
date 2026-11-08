---
layout: post
title: Adding Tabbed Code Blocks to Your Jekyll Blog
date: 2026-03-01 08:50 +0000
categories: [iOS, SwiftUI]
tags: [skills, iOS, Swift, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---


![Swift UI](/assets/images/20240727Magnificationgesture/SwiftUI.avif)


# Preface

This article carries a strong personal tone. If you find it uncomfortable to read, please close it immediately. This article serves solely as a personal learning record. You are welcome to repost or share it within the scope of the license agreement; please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe to it via RSS. Thanks for your support!

# Background

When writing blog posts, I often need to show code in both Swift and Objective-C, or multiple implementations of the same feature. Previously, I could only stack code blocks one after another, which made for a poor reading experience.

This time I've added **tabbed code blocks** to the blog. Clicking a tab lets readers switch freely between different languages/implementations, similar to modern documentation platforms like VitePress and Docusaurus.

# Implementation

I use the [jekyll-tabs](https://github.com/Ovski4/jekyll-tabs) gem, which offers:

- ✅ No dependency on any JS framework; plays well with the existing jQuery/Bootstrap
- ✅ Supports multiple independent tab groups on the same page
- ✅ Supports syncing tabs with the same label across groups
- ✅ Supports one-click code copying
- ✅ Built and deployed locally, not limited by GitHub Pages plugin restrictions

## Installation Steps

### Step 1: Add the Dependency to Gemfile

``` ruby
group :jekyll_plugins do
  # ... other gems
  gem "jekyll-tabs"
end
```

Then run the installation:

``` sh
bundle install
```

### Step 2: Declare the Plugin in _config.yml

``` yaml
plugins:
  - jekyll-tabs
```

### Step 3: Include the JS

In the post section of `_includes/js-selector.html`, add:

``` html
{% raw %}{% elsif page.layout == 'post' %}
  <script async src="{{ '/assets/js/post.min.js' | relative_url }}"></script>
  <script defer src="{{ '/assets/AISource/jekyll-tabs/tabs.js' | relative_url }}"></script>{% endraw %}
```

JS initialization config (at the end of `tabs.js`):

``` javascript
window.addEventListener('load', function () {
  jekyllTabs.init({
    syncTabsWithSameLabels: true,   // 同名 Tab 跨组联动
    activateTabFromUrl: false,       // 关闭 URL hash,避免点击跳顶
    addCopyToClipboardButtons: true, // 开启复制按钮
    copyToClipboardSettings: {
      buttonHTML: '<button class="jekyll-tabs-copy-btn" title="Copy to clipboard"><i class="far fa-copy"></i></button>',
      showToastMessageOnCopy: true,
      toastMessage: '已复制到剪贴板',
      toastDuration: 2000,
    }
  });
});
```

### Step 4: Include the CSS

In `_includes/head.html`, add:

``` html
<!-- Jekyll Tabs -->
{% raw %}<link rel="stylesheet" href="{{ '/assets/AISource/jekyll-tabs/tabs.css' | relative_url }}">{% endraw %}
```

## Resource File Locations

All resources are placed under the `assets/AISource/jekyll-tabs/` directory:

``` sh
assets/AISource/
└── jekyll-tabs/
    ├── tabs.js   # 官方 JS + 初始化配置
    └── tabs.css  # 融合博客主题变量的自定义样式
```

# Usage

Use the following syntax in your post's Markdown:

```` markdown
{% raw %}{% tabs 组名 %}

{% tab 组名 标签名 %}
```语言
// code content
```
{% endtab %}

{% tab 组名 另一个标签名 %}
```语言
// code content
```
{% endtab %}

{% endtabs %}{% endraw %}
````

> **Note**: The **group name** in `{% raw %}{% tabs 组名 %}{% endraw %}` and `{% raw %}{% tab 组名 标签名 %}{% endraw %}` must be consistent, and multiple tab groups on the same page should use different group names to tell them apart.

# Examples

## Example 1: Printing Hello World in Swift vs Objective-C

{% tabs hello-world %}

{% tab hello-world Swift %}
``` swift
let greeting = "Hello, World!"
print(greeting)
```
{% endtab %}

{% tab hello-world Objective-C %}
``` objc
NSString *greeting = @"Hello, World!";
NSLog(@"%@", greeting);
```
{% endtab %}

{% endtabs %}

## Example 2: Singleton Pattern

{% tabs singleton %}

{% tab singleton Swift %}
``` swift
class NetworkManager {
    static let shared = NetworkManager()
    private init() {}

    func request(url: String) {
        print("requesting: \(url)")
    }
}

// Usage
NetworkManager.shared.request(url: "https://sunyazhou.com")
```
{% endtab %}

{% tab singleton Objective-C %}
``` objc
@interface NetworkManager : NSObject
+ (instancetype)sharedManager;
- (void)requestWithURL:(NSString *)url;
@end

@implementation NetworkManager

+ (instancetype)sharedManager {
    static NetworkManager *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[self alloc] init];
    });
    return instance;
}

- (void)requestWithURL:(NSString *)url {
    NSLog(@"requesting: %@", url);
}

@end

// Usage
[[NetworkManager sharedManager] requestWithURL:@"https://sunyazhou.com"];
```
{% endtab %}

{% endtabs %}

## Example 3: GCD Asynchronous Execution

{% tabs gcd %}

{% tab gcd Swift %}
``` swift
DispatchQueue.global(qos: .background).async {
    // Run the time-consuming task in the background
    let result = heavyTask()
    
    DispatchQueue.main.async {
        // Update the UI back on the main thread
        self.label.text = result
    }
}
```
{% endtab %}

{% tab gcd Objective-C %}
``` objc
dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    // Run the time-consuming task in the background
    NSString *result = [self heavyTask];
    
    dispatch_async(dispatch_get_main_queue(), ^{
        // Update the UI back on the main thread
        self.label.text = result;
    });
});
```
{% endtab %}

{% endtabs %}

## Example 4: Comparing Three Languages

{% tabs greet %}

{% tab greet Swift %}
``` swift
func greet(name: String) -> String {
    return "你好, \(name)!"
}

print(greet(name: "孙亚洲"))
```
{% endtab %}

{% tab greet Python %}
``` python
def greet(name: str) -> str:
    return f"你好, {name}!"

print(greet("孙亚洲"))
```
{% endtab %}

{% tab greet JavaScript %}
``` javascript
function greet(name) {
    return `你好, ${name}!`;
}

console.log(greet("孙亚洲"));
```
{% endtab %}

{% endtabs %}

# Summary

The entire integration involved minimal changes, touching only 4 files:

| File | Change |
| --- | --- |
| `Gemfile` | Add `gem "jekyll-tabs"` |
| `_config.yml` | Add `plugins: - jekyll-tabs` |
| `_includes/head.html` | Include `tabs.css` |
| `_includes/js-selector.html` | Include `tabs.js` on post pages |

The result works as expected: clicking a tab doesn't jump to the top of the page, both dark and light themes are automatically supported, and code highlighting is fully compatible with the existing rouge rendering.
