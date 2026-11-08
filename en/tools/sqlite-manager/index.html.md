---
layout: page
title: SQLite Database Manager
icon: fas fa-database
lang: en
permalink: /tools/sqlite-manager/
tool_css: /assets/tools/sqlite-manager/app.css?v=6
---

Manage SQLite databases right in your browser: create a new database, open `.sqlite` / `.db` files (including **SQLCipher encrypted databases** — just enter the password), run SQL, browse and edit table data, import and export CSV and SQL. Powered by **SQLCipher WASM** (SQLite compiled to WebAssembly with AES-256 encryption). **Everything runs locally in your browser — neither your files nor your password are ever uploaded to a server**.

<div id="sqlite-app"></div>

<script type="module" src="/assets/tools/sqlite-manager/app.js?v=8"></script>
