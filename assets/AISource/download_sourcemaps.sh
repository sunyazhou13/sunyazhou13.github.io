#!/bin/bash

echo "📦 下载 Source Map 文件..."

# Bootstrap CSS Source Map
echo "⬇️  下载 Bootstrap CSS Source Map..."
curl -L -o bootstrap/bootstrap.min.css.map https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css.map

# Bootstrap JS Source Map
echo "⬇️  下载 Bootstrap JS Source Map..."
curl -L -o bootstrap/bootstrap.min.js.map https://cdn.jsdelivr.net/npm/bootstrap@4/dist/js/bootstrap.min.js.map

# Popper.js Source Map
echo "⬇️  下载 Popper.js Source Map..."
curl -L -o popper/popper.min.js.map https://cdn.jsdelivr.net/npm/popper.js@1.15.0/dist/umd/popper.min.js.map

echo "✅ Source Map 文件下载完成！"
