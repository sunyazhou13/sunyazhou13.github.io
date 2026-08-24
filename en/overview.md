# 图片主色调提取工具 — 完成概览

## 完成内容

将原"图片吸色器"（像素级取色笔）完整重写为"图片主色调提取工具"：上传图片 → 分析全部像素 → 算法提取主色调 → 输出 HEX/RGB + 多语言代码片段。

## 改动文件

| 文件 | 改动 |
|------|------|
| `assets/tools/color-picker/app.js` | 重写：三种色彩量化算法 + 代码生成 + 调色板渲染 |
| `assets/tools/color-picker/app.css` | 重写：移除放大镜/历史样式，新增条形图/标签页/加载动画 |
| `tools/color-picker.md` | 重写：新 HTML 结构（算法选择器/调色板/代码标签页） |
| `tools/color-picker-en.md` | 重写：英文版同结构 |
| `_data/tools.yml` | 更新：title → 图片主色调提取，icon → fa-palette |
| `_data/tools_en.yml` | 更新：title → Image Color Palette，icon → fa-palette |

## 三种算法

1. **K-Means 聚类**（k-means++ 初始化）— 经典聚类，色彩分布均匀
2. **中值切割**（Median Cut, Heckbert 1982）— Color Thief 同源，速度快
3. **直方图统计** — 3D 色彩直方图量化 + 相似色合并（threshold=30）

## 代码生成

- Swift：UIKit `UIColor` + SwiftUI `Color` 双版本
- Objective-C：`[UIColor colorWithRed:green:blue:alpha:]`
- CSS：`:root { --color-N: #HEX; }` 自定义属性
- Android XML：`<color name="color_N">#HEX</color>`

## 验证结果

- JS 语法检查通过
- 19 个 HTML ID 与 JS 引用三方匹配（中文 HTML / 英文 HTML / JS）
- 4 个 data-lang 标签与 JS dispatch 匹配
- YAML 格式合法
- Jekyll build 成功（12.8s）
- 中文页 + 英文页均正确生成，标题/ID/CSS/JS 链接全部正确
