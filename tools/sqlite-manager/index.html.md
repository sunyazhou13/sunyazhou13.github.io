---
layout: page
title: SQLite 数据库管理器
icon: fas fa-database
tool_css: /assets/tools/sqlite-manager/app.css?v=6
---

在浏览器里直接管理 SQLite 数据库：新建数据库、打开 `.sqlite` / `.db` 文件（含 **SQLCipher 加密库**，打开时填写密码即可）、执行 SQL、浏览与编辑表数据、导入导出 CSV 与 SQL。基于 **SQLCipher WASM**（SQLite 编译为 WebAssembly，支持 AES-256 加密），**全程在你的浏览器本地运行，文件与密码不会被上传到任何服务器**。

<div id="sqlite-app"></div>

<script type="module" src="/assets/tools/sqlite-manager/app.js?v=8"></script>
