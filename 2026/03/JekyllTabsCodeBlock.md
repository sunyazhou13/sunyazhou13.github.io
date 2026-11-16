---
layout: post
title: Jekyll博客支持Tab切换代码块
date: 2026-03-01 08:50 +0000
categories: [iOS, SwiftUI]
tags: [skills, iOS, Swift, Objective-C]
typora-root-url: ..
math: false
mermaid: false

---


![Swift UI](/assets/images/20240727Magnificationgesture/SwiftUI.avif)


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

# 背景

写博客时经常需要同时展示 Swift 和 Objective-C 两种语言的代码,或者同一个功能的多种实现方式.以前只能把代码块一个个堆在一起,阅读体验很差.

这次给博客加上了 **Tab 切换代码块**的功能,点击 Tab 标签即可在不同语言/实现之间自由切换,效果类似 VitePress、Docusaurus 等现代文档平台.

# 实现方案

使用 [jekyll-tabs](https://github.com/Ovski4/jekyll-tabs) 这个 gem,它的特点是:

- ✅ 不依赖任何 JS 框架,与已有的 jQuery/Bootstrap 不冲突
- ✅ 支持同一页面多个独立 Tab 组
- ✅ 支持同名 Tab 跨组联动(可开关,本站默认关闭)
- ✅ 支持一键复制代码(本站改用统一的标题栏按钮,见文末「视觉优化」)
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
  <script defer src="{{ '/assets/AISource/jekyll-tabs/tabs.js?v=20261116' | relative_url }}"></script>{% endraw %}
```

JS 初始化配置(在 `tabs.js` 末尾):

``` javascript
window.addEventListener('load', function () {
  jekyllTabs.init({
    syncTabsWithSameLabels: false,   // 同名 Tab 跨组联动,本站关闭
    activateTabFromUrl: false,       // 关闭 URL hash,避免点击跳顶
    addCopyToClipboardButtons: false // 关闭官方复制按钮,原因见文末
  });
  jtEnhanceTabs();                   // 标题栏统一复制按钮
});
```

> `?v=20261116` 是资源版本戳. 改过 CSS/JS 后要同步 bump,否则访客会吃到浏览器缓存里的旧样式.

### 第四步: 引入 CSS

在 `_includes/head.html` 加入:

``` html
<!-- Jekyll Tabs -->
{% raw %}<link rel="stylesheet" href="{{ '/assets/AISource/jekyll-tabs/tabs.css?v=20261116' | relative_url }}">{% endraw %}
```

## 资源文件位置

所有资源统一放在 `assets/AISource/jekyll-tabs/` 目录下:

``` sh
assets/AISource/
└── jekyll-tabs/
    ├── tabs.js   # 官方 JS + 初始化配置 + 标题栏复制按钮增强
    └── tabs.css  # 复用 Chirpy 主题变量的「单一代码窗口」样式
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

## 示例五: 可选值与空安全

{% tabs optional %}

{% tab optional Swift %}
``` swift
let name: String? = nil
print(name ?? "匿名")
```
{% endtab %}

{% tab optional Kotlin %}
``` kotlin
val name: String? = null
println(name ?: "匿名")
```
{% endtab %}

{% tab optional Rust %}
``` rust
let name: Option<&str> = None;
println!("{}", name.unwrap_or("匿名"));
```
{% endtab %}

{% endtabs %}

# 视觉优化:把多 Tab 代码块做成一个完整窗口

2026-11 又回头收拾了一次. 功能一直能用,但显示效果别扭,而且越看越不像现代文档站的做法.

## 原来的问题

| 问题 | 实测 |
| --- | --- |
| 复制按钮泛滥 | 官方 `addCopyToClipboardButtons` 遍历的是 `ul.tab-content > li pre`,带行号的代码块有**两个 `<pre>`**(行号列 + 代码列),本文 9 个面板被塞了 **18 个** `position:absolute` 按钮,左上角那个直接压住行号 1 |
| 明暗割裂 | Tab 栏硬编码 `#3a3a3c`,代码区却是主题的 `#f7f7f7` / `#282828`,浅色模式下像两块不相干的东西拼在一起 |
| 标签颜色失控 | 全站 `%link-color` 覆盖了 `ul.tab li a`,浅色 `#8e2a2a` / 深色 `#cf6c6c`,连下划线都被 `--link-underline-color` 抢走,激活态几乎看不出来 |
| 语言标签重复 | `_includes/refactor-content.html` 会给**每个** Tab 面板里的代码块再加一套 `.code-header`(圆点 + 语言标签),本文 9 套,和 Tab 标签说的是同一件事 |
| 双层边框 | 内层 `.highlighter-rouge` 自带 1px 描边,外层容器又有圆角边框 |

## 主流做法

看了 VitePress 和 Docusaurus,多 Tab 代码块大致分两派:

| | 拼合派(VitePress) | 分离派(Docusaurus) |
| --- | --- | --- |
| Tab 栏底色 | 与代码块**同一个色值**:`--vp-code-tab-bg: var(--vp-code-block-bg)` | 透明,只有一条下划线 |
| 激活态 | 品牌色 2px 圆角短条,`inset-inline: .5rem` / `bottom:-1px` | 3px 品牌色下划线 |
| 内层代码块 | 强制去掉顶部圆角和 `margin-top` | 独立卡片 |
| 适用场景 | Tab 里只放代码 | Tab 里放文本/表格/任意内容 |

本站 Tab 里装的全是代码,所以选拼合派. VitePress 的 Tab 栏约 48px 高,改造后本站是 49px,基本一致. 两派共同的底线是:**只有一个复制按钮、语言信息只出现一次、明暗跟随主题**. 至于激活态,主流都用下划线,本站最后换成了胶囊底(原因见下).

后来又参考了 Vue 官网(`cn.vuejs.org/guide/quick-start`)的 code group:实测它的 Tab 栏 49px、激活条 2px 且左右各内缩 8px、复制按钮 40×40、标签 14px/500. 这几个尺寸直接搬了过来. Vue 官网的代码区是固定深色 `#24292e`,本站没有照搬 —— 因为 Chirpy 的语法高亮配色是跟主题走的,强行固定深色会变成深底深字,得再覆盖 60 多个 rouge token 颜色,代价太大且会和站内其他代码块风格打架.

激活态最后也没跟 Vue 用下划线,而是换成了**胶囊底**:激活项 30px 高、圆角 `999px`、淡品牌色背景 `color-mix(in srgb, var(--link-color) 16%, transparent)`,文字改用主文本色. 深色模式下品牌红 `#cf6c6c` 落在淡红底上只有约 3.6:1,低于可读阈值,所以文字不能再跟底色用同一个红;换成主文本色后实测浅色 **9.01:1** / 深色 **5.51:1**. 另外 `color-mix()` 返回的是 `color(srgb 0..1)` 格式,算对比度时分量要按 0–1 小数解析而不是 0–255,否则会算出假数值.

## 具体改动

改动集中在 `assets/AISource/jekyll-tabs/` 下的两个文件,外加一处全站代码块样式(**没有碰 markdown 语法、Liquid 模板,也没有改文章里任何一处 Tab 标记**):

- `tabs.css`:配色全部换成 Chirpy 主题变量(`--highlight-bg-color` / `--highlight-lineno-border-color` / `--link-color`),明暗自动跟随;用 `!important` 挡住全站链接色覆盖;去掉 Mac 圆点,隐藏面板内冗余的 `.code-header` 和内层描边,标题栏只留 Tab 标签和一个复制按钮;激活态改成胶囊底(淡品牌色 + 主文本色字),去掉了下划线. 另外用 `margin: 0 !important` 挡掉了 Bootstrap 给 `li + li` 加的 `margin-top:4.8px` —— 它在横向 flex 标题栏里会把第 2 个及之后的标签整体推低 2.4px,是「文字没对齐」的真凶.
- `tabs.js`:关掉官方复制按钮,在标题栏右侧注入**唯一一个**按钮,点击时读取当前激活面板的 `.rouge-code pre` 复制到剪贴板,图标切 ✓ 并提示「已复制」. 这里用 `getElementById` 而不是 `#id` 选择器,是因为组 id 是 UUID,以数字开头时 `#0abc...` 是非法 CSS 选择器.
- `_includes/refactor-content.html`:语言标签的图标从统一的 `</>` 改成按语言匹配的 Font Awesome 品牌图标 —— Swift / Python / JavaScript / TypeScript / HTML5 / CSS3 / Rust / Java / Go / PHP / Vue / React / Node / Ruby / Markdown 都有专属图标;Objective-C 借 `fab fa-apple`,Shell 用 `fas fa-terminal`,YAML/JSON/TOML/XML 用 `fas fa-file-code`,C++ 用 `fas fa-c` 配独立色,没有品牌图标的(如 Kotlin/Scala/C#/Dart/Lua)用 `fas fa-code` 配各自特征色. 图标后面统一带 `lang-xxx` class,颜色由 `syntax.scss` 里的明暗两套 CSS 变量驱动.
- `assets/css/_addon/syntax.scss`:全站代码块去掉左上角的 macOS 三圆点;语言图标单独加深到 `--text-muted-color` 并把 `.small` 从 70% 提到 `0.9rem` —— 原来的 `--code-header-icon-color` 在浅色底只有约 1.3:1,淡到看不出形状. 只改了 `.code-header span i`,复制按钮的图标不受影响. 圆点其实是 `.code-header::before`,它会作为 flex item 占住左侧,再配合 `span { margin-left:-1.75rem }` 把语言标签挤到中间 —— 所以删掉圆点后标签自然左对齐,不用另外写居中样式. 实测标签距代码块左边缘 12px、复制按钮距右边缘 6px,tab 内的代码块不受影响.
- `_includes/head.html` / `_includes/js-selector.html`:资源引入补 `?v=20261116` 版本戳.

**写文章的姿势一点没变** —— 上面「示例五」就是这次优化之后新加的,用的还是原来那套 `{% raw %}{% tabs 组名 %}{% endraw %}` / `{% raw %}{% tab 组名 标签名 %}{% endraw %}`,一行没改. 新增的 Tab 组会自动拿到标题栏和唯一个复制按钮,不需要任何额外配置;复制按钮读的是「当前激活面板」,切 Tab 后自动跟着变. Tab 外的普通代码块完全不受影响,因为 CSS 选择器都带 `ul.tab` / `ul.tab-content` 前缀.

本地构建 + 真实浏览器实测(明/暗两种主题):官方按钮 18 → **0**,统一按钮 **5**(每组一个),Tab 内可见 `.code-header` **0**,Tab 外的普通代码块原样保留.

# 总结

整个接入过程改动极小,只涉及 4 个文件:

| 文件 | 改动内容 |
| --- | --- |
| `Gemfile` | 添加 `gem "jekyll-tabs"` |
| `_config.yml` | 添加 `plugins: - jekyll-tabs` |
| `_includes/head.html` | 引入 `tabs.css` |
| `_includes/js-selector.html` | post 页面引入 `tabs.js` |

后续补了资源版本戳,2026-11 又做了一轮视觉优化(见上一节),但接入方式和使用语法始终没变.

效果符合预期,点击 Tab 不会跳顶,dark/light 双主题自动适配,代码高亮与原有 rouge 渲染完全兼容,复制按钮也只剩一个了.