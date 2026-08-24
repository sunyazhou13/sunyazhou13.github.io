# 依赖库说明

本目录需要以下库文件：

## 1. fflate.js

ZIP 打包下载功能所需的库。

**当前状态**：已从 AVIF 工具复制（fflate.js + LICENSE）

**如需重新下载**：
```bash
curl -L -o fflate.js "https://cdn.jsdelivr.net/npm/fflate@0.8.2/dist/browser/fflate.js"
curl -L -o LICENSE.fflate.txt "https://raw.githubusercontent.com/101arrowz/fflate/master/LICENSE"
```

## 2. heic2any.js

HEIC 图片解码所需的库（约 1.4 MB），首次使用时动态加载。

**当前状态**：待下载

**下载命令**：
```bash
curl -L -o heic2any.js "https://cdn.jsdelivr.net/npm/heic2any@0.0.3/dist/heic2any.js"
```

**GitHub 仓库**：https://github.com/nicktomlin/heic2any

**License**：MIT

---

## 文件清单

下载完成后，本目录应包含：
- `fflate.js` - ZIP 打包库（已存在）
- `heic2any.js` - HEIC 解码库（待下载）
- `LICENSE.fflate.txt` - fflate 许可证（可选）
