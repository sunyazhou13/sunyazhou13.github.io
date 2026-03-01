---
layout: post
title: Jekyll博客支持Tab切换代码块
date: 2026-03-01 08:50 +0000
categories: [iOS, SwiftUI]
tags: [skills, iOS, Swift, Objective-C]
typora-root-url: ..
---


![](/assets/images/20240727Magnificationgesture/SwiftUI.webp)

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 背景

写博客时经常需要同时展示 Swift 和 Objective-C 两种语言的代码,或者同一个功能的多种实现方式.以前只能把代码块一个个堆在一起,阅读体验很差.

这次给博客加上了 **Tab 切换代码块**的功能,点击 Tab 标签即可在不同语言/实现之间自由切换,效果类似 VitePress、Docusaurus 等现代文档平台.

# 实现方案

使用 [jekyll-tabs](https://github.com/Ovski4/jekyll-tabs) 这个 gem,它的特点是:

- ✅ 不依赖任何 JS 框架,与已有的 jQuery/Bootstrap 不冲突
- ✅ 支持同一页面多个独立 Tab 组
- ✅ 支持同名 Tab 跨组联动
- ✅ 支持一键复制代码
- ✅ 本地构建部署,不受 GitHub Pages 插件限制

## 安装步骤

### 第一步: Gemfile 添加依赖

``` ruby
group :jekyll_plugins do
  # ... 其他 gem
  gem "jekyll-tabs"
end
```

然后执行安装:

``` sh
bundle install
```

### 第二步: _config.yml 声明插件

``` yaml
plugins:
  - jekyll-tabs
```

### 第三步: 引入 JS

在 `_includes/js-selector.html` 的 post 部分加入:

``` html
{% raw %}{% elsif page.layout == 'post' %}
  <script async src="{{ '/assets/js/post.min.js' | relative_url }}"></script>
  <script defer src="{{ '/assets/AISource/jekyll-tabs/tabs.js' | relative_url }}"></script>{% endraw %}
```

JS 初始化配置(在 `tabs.js` 末尾):

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

### 第四步: 引入 CSS

在 `_includes/head.html` 加入:

``` html
<!-- Jekyll Tabs -->
{% raw %}<link rel="stylesheet" href="{{ '/assets/AISource/jekyll-tabs/tabs.css' | relative_url }}">{% endraw %}
```

## 资源文件位置

所有资源统一放在 `assets/AISource/jekyll-tabs/` 目录下:

``` sh
assets/AISource/
└── jekyll-tabs/
    ├── tabs.js   # 官方 JS + 初始化配置
    └── tabs.css  # 融合博客主题变量的自定义样式
```

# 使用方法

在文章 Markdown 中使用如下语法:

```` markdown
{% raw %}{% tabs 组名 %}

{% tab 组名 标签名 %}
```语言
// 代码内容
```
{% endtab %}

{% tab 组名 另一个标签名 %}
```语言
// 代码内容
```
{% endtab %}

{% endtabs %}{% endraw %}
````

> **注意**: `{% raw %}{% tabs 组名 %}{% endraw %}` 和 `{% raw %}{% tab 组名 标签名 %}{% endraw %}` 中的**组名必须一致**,同一页面多个 Tab 组使用不同组名加以区分.

# 示例

## 示例一: Swift vs Objective-C 打印 Hello World

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

## 示例二: 单例模式

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

// 使用
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

// 使用
[[NetworkManager sharedManager] requestWithURL:@"https://sunyazhou.com"];
```
{% endtab %}

{% endtabs %}

## 示例三: GCD 异步执行

{% tabs gcd %}

{% tab gcd Swift %}
``` swift
DispatchQueue.global(qos: .background).async {
    // 后台执行耗时任务
    let result = heavyTask()
    
    DispatchQueue.main.async {
        // 回到主线程更新 UI
        self.label.text = result
    }
}
```
{% endtab %}

{% tab gcd Objective-C %}
``` objc
dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    // 后台执行耗时任务
    NSString *result = [self heavyTask];
    
    dispatch_async(dispatch_get_main_queue(), ^{
        // 回到主线程更新 UI
        self.label.text = result;
    });
});
```
{% endtab %}

{% endtabs %}

## 示例四: 三种语言对比

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

# 总结

整个接入过程改动极小,只涉及 4 个文件:

| 文件 | 改动内容 |
| --- | --- |
| `Gemfile` | 添加 `gem "jekyll-tabs"` |
| `_config.yml` | 添加 `plugins: - jekyll-tabs` |
| `_includes/head.html` | 引入 `tabs.css` |
| `_includes/js-selector.html` | post 页面引入 `tabs.js` |

效果符合预期,点击 Tab 不会跳顶,dark/light 双主题自动适配,代码高亮与原有 rouge 渲染完全兼容.