---
layout: post
title: Shell脚本批量将heic转png和webp
date: 2023-06-07 10:01 +0800
categories: [shell]
tags: [macOS, Xcode, skills]
typora-root-url: ..
---

# 前言

![](/assets/images/20230607BatchConvertHEICtoPNG/chatgpt.webp)

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

## 如何批量将HECI图片转成png

最近公司搞活动需要我们组织小组业余爱好并记录美好生活,避免不了拍一些照片,我手机忘记了设置所以拍摄出来的照片都是HEIC(H.265)编码的格式,然而公司需要的是把这些图片转成png或者jpeg上传,所以就因为了今天这批技术文章

### 编写脚本HECI转PNG

先看下之前的效果
![](/assets/images/20230607BatchConvertHEICtoPNG/heic.webp)  
转换完成后的效果
![](/assets/images/20230607BatchConvertHEICtoPNG/pngs.webp)

下面来编写脚本实现

作为一个很多年都不怎么学习使用脚本的我面对这个一个突如其来的需求比较麻木,喵神曾经说过:"对于一些不擅长的技术很多人刚接触的时候会有一种恐惧感,这种恐惧源于未知!"。那么怎么解决自己不了解的技术难题的呢?--`ChatGPT`

先打开[ChatGPT](https://chat.openai.com/), 输入如下:

``` txt
写个shell脚本 指定 Mac  中Downloads目录下的所有HEIC格式一次批量转成png
```

当使用Shell脚本将`Mac`中`Downloads`目录下的所有`HEIC`格式文件批量转换为`PNG`格式时，可以使用`sips`命令来完成。以下是一个示例脚本：

``` sh
#!/bin/bash

# 定义Download目录路径
download_dir="$HOME/Downloads"

# 转换HEIC文件为PNG格式
convert_heic_to_png() {
  local file_path="$1"
  local file_name="$(basename "$file_path")"
  local file_extension="${file_name##*.}"
  local file_name_no_extension="${file_name%.*}"
  
  if [[ "$file_extension" == "HEIC" || "$file_extension" == "heic" ]]; then
    png_file_path="$download_dir/$file_name_no_extension.png"
    sips -s format png "$file_path" --out "$png_file_path"
    echo "转换完成: $png_file_path"
  fi
}

# 遍历Download目录下的文件
find "$download_dir" -type f | while read -r file; do
  convert_heic_to_png "$file"
done

```

请将上述脚本保存为一个文件（例如`convert_heic_to_png.sh`），然后打开终端，执行以下命令来给脚本文件添加执行权限：

``` sh
chmod +x convert_heic_to_png.sh
```

之后，可以通过以下命令运行脚本：

``` sh
./convert_heic_to_png.sh

```

脚本将会遍历Download目录下的所有文件，并将HEIC格式的文件转换为PNG格式，转换后的PNG文件将存储在相同目录下。脚本会输出每个转换完成的PNG文件路径。注意，脚本仅在Mac系统上有效，且需要安装Xcode命令行工具以获取`sips`命令。

### 编写脚本HECI转webp

当使用Shell脚本将Mac中Downloads目录下的所有HEIC格式文件批量转换为WebP格式时，可以使用`cwebp`命令来完成。以下是一个示例脚本：

``` sh
#!/bin/bash

# 定义Downloads目录路径
downloads_dir="$HOME/Downloads"

# 转换HEIC文件为WebP格式
convert_heic_to_webp() {
  local file_path="$1"
  local file_name="$(basename "$file_path")"
  local file_extension="${file_name##*.}"
  local file_name_no_extension="${file_name%.*}"
  
  if [[ "$file_extension" == "HEIC" || "$file_extension" == "heic" ]]; then
    webp_file_path="$downloads_dir/$file_name_no_extension.webp"
    cwebp -q 80 "$file_path" -o "$webp_file_path"
    echo "转换完成: $webp_file_path"
  fi
}

# 遍历Downloads目录下的文件
find "$downloads_dir" -type f | while read -r file; do
  convert_heic_to_webp "$file"
done

```

请将上述脚本保存为一个文件（例如`convert_heic_to_webp.sh`），然后打开终端，执行以下命令来给脚本文件添加执行权限：

``` sh
chmod +x convert_heic_to_webp.sh
```

之后，可以通过以下命令运行脚本：

``` sh
./convert_heic_to_webp.sh
```
脚本将会遍历Downloads目录下的所有文件，并将HEIC格式的文件转换为WebP格式，转换后的WebP文件将存储在相同目录下。脚本会输出每个转换完成的WebP文件路径。注意，脚本仅在Mac系统上有效，且需要安装`webp`库以获取`cwebp`命令。你可以通过Homebrew来安装`webp`库：

``` sh
brew install webp
```

至于如何转换其它类型 我应该不用再说了吧!

# 总结

简直被ChatGPT的神奇力量炸裂,我不咋会写脚本,这太好用了.分享给大家.

[点击这里下载本文的脚本文件](https://github.com/sunyazhou13/BatchConvertImagesShells)