#!/bin/bash

echo "📦 开始下载前端资源..."

# 1. jQuery
echo "⬇️  下载 jQuery..."
curl -L -o jquery/jquery.min.js https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js

# 2. Bootstrap CSS
echo "⬇️  下载 Bootstrap CSS..."
curl -L -o bootstrap/bootstrap.min.css https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css

# 3. Bootstrap JS
echo "⬇️  下载 Bootstrap JS..."
curl -L -o bootstrap/bootstrap.min.js https://cdn.jsdelivr.net/npm/bootstrap@4/dist/js/bootstrap.min.js

# 4. Popper.js
echo "⬇️  下载 Popper.js..."
curl -L -o popper/popper.min.js https://cdn.jsdelivr.net/npm/popper.js@1.15.0/dist/umd/popper.min.js

# 5. Font Awesome CSS
echo "⬇️  下载 Font Awesome CSS..."
curl -L -o fontawesome/all.min.css https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.11.2/css/all.min.css

# 6. Font Awesome Webfonts
echo "⬇️  下载 Font Awesome 字体文件..."
mkdir -p fontawesome/webfonts
curl -L -o fontawesome/webfonts/fa-brands-400.woff2 https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.11.2/webfonts/fa-brands-400.woff2
curl -L -o fontawesome/webfonts/fa-regular-400.woff2 https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.11.2/webfonts/fa-regular-400.woff2
curl -L -o fontawesome/webfonts/fa-solid-900.woff2 https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.11.2/webfonts/fa-solid-900.woff2

# 7. Simple Jekyll Search
echo "⬇️  下载 Simple Jekyll Search..."
curl -L -o simple-jekyll-search/simple-jekyll-search.min.js https://cdn.jsdelivr.net/npm/simple-jekyll-search@1.7.3/dest/simple-jekyll-search.min.js

# 8. Lozad.js
echo "⬇️  下载 Lozad.js..."
curl -L -o lozad/lozad.min.js https://cdn.jsdelivr.net/npm/lozad/dist/lozad.min.js

# 9. MathJax
echo "⬇️  下载 MathJax..."
curl -L -o mathjax/tex-mml-chtml.js https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js

echo "✅ 所有资源下载完成！"
