---
layout: post
title: "Cross-Platform Desktop Framework Selection Deep Dive: An iOS Developer's Qt6 Journey"
date: 2026-07-03 02:45 +0000
categories: [跨平台, AI Agent, 移动开发, 小程序, 鸿蒙]
tags: [Electron, Tauri, Qt6, Flutter, React Native, uni-app, Taro, Python, LangChain, Deno, 鸿蒙, 微信小程序, AI Agent]

math: false
mermaid: false
---

![banner](/assets/images/20260703CrossPlatformDesktopFrameworkComparison/banner.avif)

# Preface

This article is strongly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. You are welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

## Background

I'm an iOS developer who works with Swift, Objective-C, Metal, and SwiftUI every day. Recently I started systematically learning Qt6, and my motivation is clear: **use AI Agents to empower a batch of aging enterprise-grade native desktop apps**. These apps commonly embed custom graphics rendering pipelines (CAD preview, data visualization, video processing, etc.), but their architectures are stuck in the MFC/WinForms era of more than a decade ago.

The question is — which cross-platform framework should I bet on? Qt6's RHI abstraction layer and its affinity with the Metal backend naturally appeal to me, but Tauri's 3MB package, Flutter's Impeller engine, and Electron's AI ecosystem (LangChain.js / Vercel AI SDK) are each tempting in their own way.

This article is a complete record of my research process. **Starting from an iOS developer's mental model**, it horizontally compares the mainstream solutions on the market with quantitative comparisons.

In 2026, AI Agents have moved from proof of concept to full-scale production deployment. The LangChain ecosystem is maturing, MCP (Model Context Protocol) has become the de facto standard for tool integration, and `llama.cpp` makes local inference independent of cloud APIs.

Meanwhile, the definition of "cross-platform" has been completely rewritten. An AI Agent product may need to run on the following **6 platforms**:

| # | Platform | Typical Scenario | Necessity in the Chinese Market |
|---|-----|---------|:---:|
| 1 | **Desktop** (Win/Mac/Linux) | Enterprise back-office, IDE plugins, desktop chat assistants | ★★★ |
| 2 | **iOS** | Agent Apps on iPhone/iPad | ★★★★ |
| 3 | **Android** | The domestic Android ecosystem | ★★★★★ |
| 4 | **H5/Web** | Browser-based Agents, zero-install experience | ★★★★ |
| 5 | **HarmonyOS** | Huawei devices, government and enterprise customers, central SOE requirements | ★★★★★ (since 2026) |
| 6 | **WeChat Mini Programs** | The shortest path to reach consumers | ★★★★★ |

This article focuses on an upgraded question: **if you're building an AI Agent app covering desktop + mobile + Mini Programs + HarmonyOS, which cross-platform tech stack should you choose?**

It horizontally compares the mainstream cross-platform frameworks across the four battlefields of Desktop, mobile, Mini Programs, and HarmonyOS, with quantitative comparisons one by one.

---

## 6 New Faces Worth Watching in 2026 `★`

### 1. Deno Desktop — "What Electron Should Have Looked Like"

Deno v2.9 has a built-in `deno desktop` command that **reduces TypeScript desktop development from an "engineering problem" to a "configuration problem"**. Zero IPC boilerplate, automatic frontend framework detection, and hot reload out of the box. The package size is about 30MB, one-fifth of Electron's.

```
# 一行命令，把任何 Deno 项目打包为桌面应用
deno desktop
```

Best for: TypeScript full-stack teams, rapid prototyping, AI Agent conversation orchestration layers.
Bottleneck: v2.9 is the initial release; toolchain maturity lags Electron. **Desktop only.**

---

### 2. uni-app X — "One Codebase for 15+ Platforms"

The next-generation uni-app from DCloud, which uses UTS (a TypeScript superset) and compiles to native code. **It is currently the only mainstream framework covering iOS, Android, HarmonyOS, Web, and WeChat Mini Programs at the same time.**

```vue
<!-- 一套代码 → 15+ 个端 -->
<template>
  <view class="agent-chat">
    <scroll-view :scroll-into-view="lastId">
      <text v-for="msg in messages" :key="msg.id">{{ msg.content }}</text>
    </scroll-view>
    <input v-model="prompt" @confirm="sendToAgent" />
  </view>
</template>
<script setup lang="uts">
import { ref } from 'vue'
const messages = ref<Array<{id:string,content:string}>>([])
// 通过 uni.request 调用 MCP Server 或 LLM API
</script>
```

Best for: consumer-facing products, teams that need to cover Mini Programs + HarmonyOS.
Bottleneck: weak support for traditional desktop (Win/Mac/Linux); AI ecosystem weaker than Python's.

---

### 3. Taro — "The React-Based King of Cross-Platform Mini Programs"

Created by JD.com, write one codebase with React syntax and compile to multiple Mini Program platforms including WeChat/Alipay/Baidu/Douyin, while also supporting H5 and React Native for mobile.

```tsx
// Taro + LangChain.js → AI Agent 小程序
import { useLoad } from '@tarojs/taro'
import { ChatOpenAI } from '@langchain/openai'

export default function AgentChat() {
  useLoad(() => {
    // 小程序环境直接跑 LangChain.js
    const llm = new ChatOpenAI({ modelName: 'gpt-4o-mini' })
  })
}
```

Best for: consumer AI Agent products with Mini Programs as the primary entry point.
Bottleneck: no native desktop support; DeepSeek/local model integration requires a backend proxy.

---

### 4. Dioxus — React in Rust

Syntax closely resembles React Hooks and compiles to machine code. One codebase covers Web (WASM), desktop (Blitz self-rendered), mobile, and TUI. Rust's compile-time type safety; package size ~12MB. Suited to long-term bets on a Rust full stack. Still at v0.6, **not recommended for production use in 2026 for now.**

---

### 5. Electrobun — "Electron with Bun"

Replaces Node.js with Bun and writes the low-level layer in Zig; package size **~12MB**. Very early stage. Keep an eye on it.

---

### 6. Tauri 2.0 — 3MB + Mobile GA

Tauri 2.0 was stably released in 2025, with **mobile (iOS/Android) officially GA**. Rust backend + Web frontend + system WebView, with a package size of only 3MB. Suited to a hybrid architecture of frontend teams + Rust inference engines. **No Mini Program/HarmonyOS support.**

---

| New Face | Language | Platforms Covered | Maturity | AI Agent Fit |
|:---:|:---:|------|:---:|------|
| Deno Desktop | TypeScript | Desktop | v2.9 initial release | TS full-stack desktop Agent |
| uni-app X | UTS (TS superset) | iOS/Android/HarmonyOS/H5/Mini Programs | Production-ready | Consumer-facing all-platform Agent |
| Taro | React/Vue | Multi Mini Program/H5/RN | Production-ready | Mini Program AI Agent |
| Dioxus | Rust | Desktop/Web/Mobile | v0.6 | Long-term Rust full-stack bet |
| Electrobun | TypeScript | Desktop | Proof of concept | Electron replacement reserve |
| Tauri 2.0 | Rust + JS | Desktop/iOS/Android | Stable release | Lightweight desktop + mobile Agent |

---

## 0. All-Platform Coverage Matrix: Who Truly Supports "Write Once, Run Everywhere"

This is the most important table in this article. **Desktop frameworks** and **all-platform frameworks** are two different species.

| Framework | Desktop | iOS | Android | H5/Web | HarmonyOS | WeChat Mini Program | **Platforms Covered** |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **uni-app X** | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | **6/6** 🏆 |
| **Flutter** | ✅ | ✅ | ✅ | ✅ | ✅(community) | ⚠️ | **5.5/6** |
| **React Native** | ✅(Win/Mac) | ✅ | ✅ | ✅ | ✅(community) | ⚠️ | **5.5/6** |
| **Taro** | ❌ | ⚠️(RN) | ⚠️(RN) | ✅ | ✅ | ✅ | **4.5/6** |
| **Qt6** | ✅ | ✅ | ✅ | ⚠️(WASM) | ❌ | ❌ | **3.5/6** |
| **Kotlin Multiplatform** | ✅ | ✅ | ✅ | ✅(Wasm) | ⚠️(early) | ❌ | **4/6** |
| **Tauri 2.0** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **3/6** |
| **.NET MAUI** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **3/6** |
| **Electron** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **1/6** |
| **Deno Desktop** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **1/6** |
| **Wails** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **1/6** |
| **Dioxus** | ✅ | ⚠️ | ⚠️ | ✅(Wasm) | ❌ | ❌ | **2.5/6** |

> ✅ Official/community production-ready | ⚠️ Partial support or requires third-party adaptation | ❌ Not supported or unavailable

**Key Insights**:
- **uni-app X is the only framework with full 6/6 coverage**; support for WeChat Mini Programs and HarmonyOS is its unique advantage
- Flutter and React Native follow closely, covering 5-5.5 platforms with the most mature ecosystems
- Electron/Tauri/Deno are essentially "desktop frameworks," not "all-platform frameworks" — choosing them means giving up mobile and Mini Programs
- If you need to cover WeChat Mini Programs, **only uni-app and Taro are reliable options**

---

## 1. The Core Capability Model for AI Agent Development

Traditional cross-platform comparisons focus on package size and rendering performance, but in AI Agent scenarios, the following dimensions are decisive:

| Capability Dimension | Why It Matters | Typical Requirements |
|---------|-----------|---------|
| **LLM SDK Ecosystem** | The core of Agent logic | LangChain / LlamaIndex / Vercel AI SDK / OpenAI SDK |
| **All-Platform Coverage** | Reach all users with one codebase | Desktop + iOS + Android + H5 + HarmonyOS + WeChat Mini Programs |
| **Local Model Deployment** | Offline operation, data security, low latency | llama.cpp / ONNX Runtime / MLX / GGUF formats |
| **Tool Calling** | The key to Agent-system interaction | File I/O, Shell execution, API calls, browser control |
| **Agent Orchestration Frameworks** | Multi-step reasoning, memory management, multi-Agent collaboration | LangGraph / CrewAI / AutoGen / Semantic Kernel |
| **Desktop Integration Depth** | Native desktop experience | System tray, global shortcuts, notifications, auto-launch, window management |

> Core takeaway: **In 2026, building an AI Agent product for the desktop alone is not enough.** WeChat Mini Programs are the shortest path to consumer reach, and HarmonyOS is the entry ticket to government and enterprise projects. Technology selection must factor in "how many platforms can be covered" from day one.

---

## 2. Core Framework Comparison Overview

Here's a quantitative comparison from a pure AI Agent development perspective. It drops the graphics rendering dimension and adds Agent-specific dimensions such as local model deployment and Tool Calling.

### 2.1 Explanation of the Quantitative Scoring System

| Dimension | Weight | Scoring Criteria |
|------|:----:|---------|
| **AI Ecosystem Maturity** | ×2.5 | LLM SDKs, Agent frameworks (LangChain/LangGraph), RAG libraries, vector database integration |
| **All-Platform Coverage** | ×2.0 | Degree of coverage across Desktop + iOS + Android + H5 + HarmonyOS + WeChat Mini Programs |
| **Local Model Deployment** | ×2.0 | Local inference engines (llama.cpp/ONNX/MLX), model hot reloading, quantization support, GPU acceleration |
| **Developer Experience & Toolchain** | ×1.5 | Language barrier, IDE support, debugging, hot reload, type hints, AI-assisted coding |
| **Desktop Integration Depth** | ×1.5 | System tray, global shortcuts, notifications, file system, process management, window control |
| **Package Size & Performance** | ×1.0 | Empty package size, cold start speed, runtime memory (including memory peaks after model loading) |
| **Enterprise Readiness** | ×1.5 | LTS support, documentation quality, production cases, community activity, domestic ecosystem |
| **Learning Curve (Beginner Friendliness)** | ×0.5 | Estimated time from zero to a deliverable first-version Agent (lower is easier to learn; already reverse-scored) |

### 2.2 The Main Battlefield: Horizontal Comparison from an All-Platform AI Agent Perspective

| Framework | Language | AI Ecosystem ★ | All-Platform ★ | Local Deployment ★ | Dev Experience ★ | Desktop Integration ★ | Size MB | Enterprise Readiness | Beginner Friendly | **Overall Score** |
|------|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Qt6 (Python)** | Python / QML | 10 | 3.5 | 9 | 8 | 9 | ~35 | 7 | 7.5 | **72.1** |
| **Flutter** | Dart | 5 | 9 | 3 | 7.5 | 5 | ~20 | 8 | 7 | **65.2** |
| **Electron** | JS/TS | 10 | 1.5 | 5 | 9.5 | 8 | ~150 | 9 | 9 | **64.4** |
| **React Native** | JS/TS | 8 | 9 | 4 | 7 | 4 | ~15 | 8 | 7 | **64.0** |
| **uni-app X** | UTS (TS superset) | 6 | 10 | 4 | 8 | 4 | ~10 | 7 | 8.5 | **63.0** |
| **Qt6 (C++)** | C++ / QML | 6 | 3.5 | 10 | 6 | 9.5 | ~25 | 9.5 | 4 | **62.9** |
| **Taro** | React/Vue/TS | 7 | 7 | 4 | 8 | 2 | ~5 | 7 | 8 | **57.6** |
| **Tauri 2.0** | Rust + JS | 7 | 5 | 8 | 6 | 7 | ~3 | 6.5 | 5 | **59.4** |
| **Kotlin Multiplatform** | Kotlin | 5 | 6.5 | 5 | 7 | 7 | ~18 | 6 | 6 | **55.6** |
| **Deno Desktop** ✦ | TS | 8 | 1.5 | 5 | 9 | 6 | ~30 | 4.5 | 9 | **54.9** |
| **Wails** | Go + JS | 6.5 | 1.5 | 5 | 7 | 7 | ~10 | 5.5 | 6.5 | **52.0** |
| **Avalonia** | C# | 6 | 3 | 5 | 7 | 7 | ~15 | 7.5 | 6.5 | **53.1** |
| **Dioxus** | Rust | 5.5 | 3.5 | 7 | 4 | 5 | ~12 | 3 | 4 | **47.0** |

> ✦ Marked as emerging frameworks worth special attention in 2026.

> Overall score = Σ(dimension score × weight), normalized to a maximum of 112.5. Scores are based on the ecosystem status as of mid-2026.

**Ranking Analysis**:

1. **Qt6 Python remains at the top** — its absolute advantage in the AI ecosystem (the entire LangChain family available) outweighs the shortcoming in platform coverage
2. **Flutter jumps to second place** — all-platform capability + Impeller rendering; Dart's AI ecosystem is weak but can go through HTTP calls
3. **Electron drops from second to third** — only 1 platform; in the all-platform era this is a fatal flaw
4. **React Native and uni-app X break into the top five** — mobile + Mini Program coverage brings huge strategic value
5. **Deno Desktop falls from 60.5 to 54.9** — the desktop-only single platform's competitiveness has plummeted in 2026

### 2.3 Detailed Breakdown: The AI Agent Profile of Each Framework

---

#### Qt6 (Python Route: PySide6) — 75.8 Points 🏆

**Positioning: the optimal solution for AI Agent desktop development.**

The Python ecosystem is the absolute home turf of AI Agent development. A single line — `from langchain.agents import create_react_agent` — can run an Agent, and PySide6 gives you the full desktop capability in the same process.

```python
# 一个进程：LangChain Agent + 原生桌面窗口
from PySide6.QtCore import QObject, Signal, Slot, QThread
from langgraph.graph import StateGraph
from langchain_community.tools import ShellTool, FileSystemTool

class DesktopAIAgent(QObject):
    responseReady = Signal(str)
    toolProgress = Signal(str, str)  # tool_name, status

    def __init__(self):
        super().__init__()
        # 直接使用 LangGraph 做 Agent 编排
        self.graph = StateGraph(AgentState)
        self.graph.add_node("llm", self.call_llm)
        self.graph.add_node("tools", self.execute_tool)
        # 注册系统级 Tool
        self.shell = ShellTool()
        self.fs = FileSystemTool()

    @Slot(str)
    def query(self, prompt: str):
        # Agent 循环：LLM → Tool Calling → 结果返回
        result = self.graph.invoke({"input": prompt})
        self.responseReady.emit(result["output"])
```

**Core Advantages:**

- **LangChain / LangGraph / CrewAI / AutoGen** can all be imported directly with zero adaptation
- **MCP protocol support**: `pip install mcp` is enough to connect to any MCP Server
- **Complete RAG ecosystem**: ChromaDB / FAISS / Qdrant local vector stores + direct reads from the desktop file system
- **The ceiling of Tool Calling**: Python can directly call any system API, read/write files, execute Shell commands, and control the browser (Playwright)
- **Local model deployment**: ONNX Runtime / PyTorch / llama-cpp-python are all available, with GPU acceleration support

**Costs:**
- Python's GIL becomes a bottleneck with concurrent Agent calls; you need `QThread` + subprocess isolation
- The learning curve of QML declarative UI is not friendly to pure backend developers
- Package size 35MB+, model files counted separately (GGUF quantized models are usually 4-8GB)

**Best for:**
- AI Agents that need complex Tool Calling (system calls, file operations, chained API calls)
- Those that need local model inference + RAG
- Teams with Python experience

**Not suitable for:**
- Pure chat UIs (Electron is faster)
- Teams without Python experience that don't want to learn it

---

#### Electron — 72.0 Points

**Positioning: the desktop framework with the most complete AI ecosystem, but local inference is a weak point.**

Electron's AI development ecosystem is unrivaled:

```typescript
// LangChain.js + Electron = AI Agent 桌面应用
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { BrowserWindow, app, Tray, globalShortcut } from "electron";

// 系统级 Tool：全局快捷键 → 唤起 Agent
app.whenReady().then(() => {
  globalShortcut.register("CommandOrControl+Shift+A", () => {
    agentWindow.show();
    agent.invoke({ input: "Ready to assist" });
  });
});
```

- `@langchain/core` + `@langchain/community` run directly in Node.js
- Vercel AI SDK, OpenAI Node SDK, and Anthropic SDK with zero configuration
- Use Chrome DevTools for Agent debugging (you can set breakpoints on the LLM's input/output)
- **The only solution that can build desktop Agents with the Web frontend ecosystem**

**But local model deployment is a real pain point:**
- Node.js's llama.cpp bindings (node-llama-cpp) perform far worse than native
- WebAssembly inference speed is only 20-30% of native
- GPU acceleration for large models is basically unavailable

> Verdict: Electron is the **best solution for the "cloud LLM + local desktop" scenario**. If the Agent doesn't need to run models locally (e.g., using the OpenAI API / Anthropic API), Electron's development efficiency crushes everything else.

---

#### Qt6 (C++ Route) — 67.8 Points

**Positioning: the performance ceiling for local inference, but low AI ecosystem development efficiency.**

```cpp
// llama.cpp C++ API → 本地推理的最高性能
#include "llama.h"

llama_model_params model_params = llama_model_default_params();
llama_model *model = llama_load_model_from_file("qwen2-7b.Q4_K_M.gguf", model_params);
llama_context *ctx = llama_new_context_with_model(model, llama_context_default_params());

// 推理速度是 Python 绑定的 1.5-2 倍
llama_decode(ctx, batch);
```

**Advantages:**
- The C++ APIs of llama.cpp / whisper.cpp are the performance ceiling
- Precise memory management, no OOM like Python
- QML provides a modern desktop UI, ten times better than MFC/WinForms

**Disadvantages:**
- LangChain has no C++ bindings; Agent orchestration must be written from scratch or via a Python subprocess
- Extremely low Tool Calling development efficiency
- Prototype validation cycles are 3-5 times longer than Python

> Verdict: only choose this path when local inference performance is the absolute bottleneck (for example, needing 7B+ models to respond in real time on a laptop). 90% of AI Agent scenarios don't need this level of optimization.

---

#### Tauri — 63.0 Points

**Positioning: the "dark horse" of lightweight Agents + Rust inference engines.**

```
// Tauri 2.0：Rust 本地推理 + JS 前端 UI
#[tauri::command]
async fn run_agent(prompt: String, app: tauri::AppHandle) -> Result<String, String> {
    // Rust 直接跑 candle / burn 推理
    let model = load_quantized_model("mistral-7b.Q4_K_M.gguf")?;
    let response = model.generate(&prompt, 512)?;
    Ok(response)
}
```

**Advantages:**
- 3MB package + model files, the lightest distribution
- Rust ML frameworks like candle (HuggingFace) and burn are maturing quickly
- React/Vue frontend with low learning costs

**Disadvantages:**
- LangChain has no Rust bindings; Agent orchestration must be implemented yourself
- No official Rust SDK for the MCP protocol
- The ecosystem is an order of magnitude weaker than Python

> Verdict: 2026 is still not the right time to bet on Tauri as your primary AI Agent framework. But if you're planning your 2027 tech stack, it's worth preparing for early.

---

#### Deno Desktop — 54.9 Points `★ 2026 New Star`

**Positioning: Electron minus 80% of the glue code and 80% of the package size. Desktop only.**

```ts
// deno.json — 零配置 AI Agent 桌面应用
{
  "desktop": {
    "title": "CodeBuddy Agent",
    "width": 1200, "height": 800,
    "autoUpdate": true, "hotReload": true
  }
}
```

Core selling points: zero IPC boilerplate, ~30MB package size, automatic frontend framework detection, and hot reload out of the box.

**Best for:** TS full-stack AI Agents (cloud LLM + local Agent orchestration), frontend teams tired of Electron's complexity.
**Not suitable for:** those needing multi-platform coverage (desktop only), going to production in 2026 (v2.9 just released).
**Fatal flaw: 1/6 platform coverage.** In the "all-platform" era, this is a strategic shortcoming.

---

#### Flutter — 65.2 Points

The Impeller engine matured in 2026. Dart's AI ecosystem is weak (no LangChain, no llama.cpp bindings), but **all-platform coverage of 5.5/6 (including the HarmonyOS community edition)** is a huge strategic advantage.

If the Agent is a "cloud brain + local thin client," Flutter is the most balanced all-platform UI choice. The HarmonyOS adaptation is officially maintained by Huawei's OpenHarmony SIG.

---

#### React Native — 64.0 Points `★ New`

**Positioning: the king of cross-platform mobile in the JS/TS ecosystem, with desktop also closing in.**

React Native is no longer a "pure mobile framework" in 2026:
- **iOS/Android**: the new Fabric architecture + Hermes engine bring a big performance boost
- **Windows/macOS**: Microsoft officially maintains `react-native-windows`; v0.84 has been released
- **HarmonyOS**: the RN-OH project is led by the Huawei Developer Alliance
- **Mini Programs**: indirectly supported via Taro or expo

```tsx
// React Native + LangChain.js → 全平台 AI Agent
import { ChatOpenAI } from '@langchain/openai';
import { Platform } from 'react-native';

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  // iOS 用 CoreML 加速，Android 用 NNAPI
});
```

**Advantages:** the largest npm ecosystem, zero learning cost for frontend teams, and `@langchain/core` runs directly in the Hermes engine.
**Disadvantages:** desktop maturity is below Electron; local large-model inference needs a backend proxy.
**Key verdict:** if you need iOS/Android + desktop + Web, React Native is the all-platform choice second only to Flutter.

---

#### uni-app X — 63.0 Points `★ New`

**Positioning: the only framework with full 6/6 all-platform coverage; WeChat Mini Programs and HarmonyOS are its unique trump cards.**

uni-app X uses UTS (a TypeScript superset) and compiles to native code for each platform. It no longer depends on WebView; the uvue rendering engine generates native UI directly.

```vue
<!-- 一套代码 → 16 个平台 -->
<script setup lang="uts">
import { ref } from 'vue'

// 通过 uni.request 调用 LLM API 或 MCP Server
async function callAgent(prompt: string) {
  const res = await uni.request({
    url: 'https://your-mcp-server/agent',
    method: 'POST',
    data: { prompt }
  })
  return res.data
}
</script>
```

**The actual pattern for AI Agent development**: uni-app handles the UI layer → connects to the backend Python Agent service over HTTP/MCP. Model inference and Agent orchestration happen server-side; the frontend only handles presentation and interaction.

**Advantages:**
- **Full 6/6 coverage**: native support for WeChat Mini Programs and HarmonyOS NEXT — impossible to bypass for the domestic consumer market
- HBuilderX IDE cloud packaging saves environment configuration
- 9 million developers with a mature plugin marketplace
- Actually used by big companies like Huawei, Alibaba, Tencent, Douyin, and Meituan

**Disadvantages:**
- Traditional desktop (Win/Mac/Linux) support is weaker than Electron/Qt
- The AI ecosystem is weaker than Python — LangChain can't run in the same process
- Agent logic must be separated into a backend service

**Key verdict:** if your AI Agent is a consumer product that needs WeChat Mini Programs + HarmonyOS, uni-app X is the **only correct choice**. Just accept the "frontend UI layer + backend Agent service" architecture.

---

#### Taro — 57.6 Points `★ New`

**Positioning: a React-tech-stack, multi-platform framework centered on Mini Programs.**

Created by JD.com, write one codebase in React and compile to multiple Mini Program platforms — WeChat/Alipay/Baidu/Douyin/Feishu/QQ/Kuaishou — plus H5 and React Native.

```tsx
import { ChatOpenAI } from '@langchain/openai'
// Taro 环境中直接使用 LangChain.js
const llm = new ChatOpenAI({ modelName: 'gpt-4o-mini' })
```

**Best for:** existing React frontend teams, AI Agents with Mini Programs as the primary entry point.
**Not suitable for:** desktop (no native support), local inference needs.
**Compared with uni-app:** Taro's React ecosystem is more international, while uni-app's Vue + HarmonyOS coverage is more domestic.

---

## 3. Specialized Comparison of Core AI Agent Capabilities

Setting aside all frameworks' GUI capabilities, this section looks only at the pure dimensions of AI Agent development.

### 3.1 LLM Integration and Agent Orchestration

| Capability | Qt6 Python | Electron | React Native | uni-app X | Taro | Flutter | Tauri | Qt6 C++ | Deno | Kotlin |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **LangChain Support** | 10 | 10 | 8(LangChain.js) | 6(HTTP) | 7(LangChain.js) | 0 | 0 | 0 | 8 | 3 |
| **LangGraph Orchestration** | 10 | 9 | 7 | 4 | 5 | 0 | 0 | 0 | 7 | 2 |
| **MCP Protocol** | 10 | 8 | 6 | 5 | 5 | 0 | 4 | 4 | 6 | 3 |
| **OpenAI/Anthropic SDK** | 10 | 10 | 10 | 8(HTTP) | 9 | 8(HTTP) | 7 | 7 | 10 | 7 |
| **Tool Calling Efficiency** | 10 | 9 | 7 | 5 | 6 | 5 | 6 | 5 | 9 | 5 |

### 3.2 Local Model Deployment

| Capability | Qt6 C++ | Qt6 Python | Tauri | Kotlin | Electron | Deno | React Native | uni-app X | Taro | Flutter |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **llama.cpp Integration** | 10 | 9 | 8 | 4 | 5 | 5 | 3 | 2 | 2 | 0 |
| **ONNX Runtime** | 9 | 9 | 7 | 5 | 5 | 5 | 4 | 3 | 3 | 3 |
| **GPU-Accelerated Inference** | 10 | 8 | 7 | 5 | 3 | 3 | 4 | 2 | 2 | 3 |
| **Quantized Model Support** | 10 | 9 | 8 | 5 | 5 | 5 | 3 | 2 | 2 | 3 |
| **Mobile Local Inference** | 8 | 7 | 6 | 6 | 0 | 0 | 5 | 3 | 2 | 5 |

### 3.3 Per-Platform Capability Comparison

| Capability | Qt6 | Flutter | RN | uni-app X | Taro | Electron | Tauri |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Desktop (Win/Mac/Linux)** | 10 | 8 | 6 | 4 | 2 | 10 | 8 |
| **iOS / Android Native** | 8 | 9 | 9 | 8 | 5(via RN) | 0 | 7 |
| **HarmonyOS** | 0 | 7(community) | 6(community) | 9 | 7 | 0 | 0 |
| **WeChat Mini Programs** | 0 | 2 | 2 | 10 | 10 | 0 | 0 |
| **H5 / Web** | 5(WASM) | 8 | 7 | 9 | 9 | 0 | 0 |

### Key Conclusions

1. **Python is still the "home language" of AI Agents.** For LangChain, LangGraph, CrewAI, and MCP — all the mainstream Agent frameworks — the Python SDK is a first-class citizen. But the platform coverage of Python's native framework (Qt6) is only 3.5/6.

2. **All-platform capability is the core dividing line for technology selection in 2026.** uni-app X (6/6) and Flutter/RN (5.5/6) lead far ahead in platform coverage. Although Electron (1/6) and Deno Desktop (1/6) have excellent AI ecosystems, "desktop only" is a fatal strategic shortcoming.

3. **WeChat Mini Programs and HarmonyOS are the two "tickets" to China-specific cross-platform development.** If you're building a consumer product, lacking WeChat Mini Programs means losing 80% of your reach channels. uni-app X and Taro are the only two frameworks that can cover both platforms at the same time.

4. **"Strong AI ecosystem + weak platform coverage" vs. "strong platform coverage + weak AI ecosystem"** — this is the core contradiction in 2026's AI Agent cross-platform selection. The MCP-decoupled architecture provides the best solution: use Python for the Agent core (strong AI ecosystem) and uni-app/Flutter/RN for the frontend (strong platform coverage).

5. **The performance ceiling for local inference is in C++/Rust.** If you need 7B+ models to run real-time inference on consumer hardware, Qt6 C++ or a Tauri Rust backend is the only choice. But mobile and Mini Programs can't carry local inference at this level — they naturally need backend services.

---

## 4. Recommended Agent Architecture Patterns

### 4.1 The Classic Three-Layer Architecture (Suited to Most Scenarios)

```
┌──────────────────────────────────────┐
│           桌面 UI 层                  │  ← React / Vue / QML
│       对话界面 + 工具状态展示          │
├──────────────────────────────────────┤
│         AI Agent 逻辑层              │  ← LangChain / LangGraph
│  LLM 调用 + Tool Calling + RAG       │
├──────────────────────────────────────┤
│         模型推理层                    │  ← llama.cpp / ONNX / API
│     本地推理 or 云端 API              │
└──────────────────────────────────────┘
```

**UI layer**: Electron (React/Vue) or PySide6 (QML)
**Agent layer**: Python (LangChain/LangGraph) — can be in the same process as the UI, or a separate process + IPC
**Inference layer**: cloud APIs (OpenAI/Anthropic) or local (llama.cpp/ONNX)

### 4.2 MCP-Decoupled Architecture (A Future-Oriented Choice)

```
┌──────────┐    MCP协议     ┌──────────────┐
│  UI 层   │ ←──────────→  │  Agent 核心  │
│ Electron │               │  Python 进程  │
│  / Tauri │               │  LangGraph    │
└──────────┘               └──────┬───────┘
                                  │ MCP
                    ┌─────────────┼─────────────┐
                    │             │             │
               ┌────┴────┐ ┌─────┴─────┐ ┌─────┴─────┐
               │文件系统  │ │ 浏览器控制 │ │ 代码执行   │
               │ MCP Svr │ │ MCP Server│ │ MCP Server│
               └─────────┘ └───────────┘ └───────────┘
```

The UI layer is decoupled from the tech stack, and the Agent core runs independently, exposing Tool Calling capabilities through the MCP protocol. This way the UI layer can be freely replaced (Electron → Tauri → Deno Desktop) without affecting the Agent logic.

---

## 5. All-Platform Scenario-Based Decision Matrix

Based on your target platform combination and AI Agent requirements, the following six selection paths are recommended:

### Scenario A: Consumer All-Platform Product (Needs Mini Programs + HarmonyOS + Mobile)

```
第一选择：uni-app X（6/6 全覆盖）
├── 前端 UI: uni-app X (Vue/UTS) → iOS/Android/鸿蒙/H5/微信小程序
├── Agent 层: Python (LangChain/LangGraph) 独立部署为 HTTP/MCP 服务
├── 推理层: 云端 API (OpenAI/DeepSeek) 或 独立 GPU 服务器
└── 交付: HBuilderX 云端打包 + Docker 部署 Agent 后端
```

**Alternative: Taro** (if the team is on the React stack and Mini Program-first)

**Rationale**: uni-app X is the only framework covering both WeChat Mini Programs and HarmonyOS. Accept the decoupled "frontend UI layer + backend Agent service" architecture, deploy the Agent core independently in Python, and communicate over HTTP/MCP. This is the optimal solution for Chinese consumer-facing AI Agent products in 2026.

---

### Scenario B: Mobile-First + Desktop Secondary (iOS/Android Primary, Desktop Secondary)

```
第一选择：Flutter（5.5/6 覆盖）
├── 前端 UI: Flutter (Dart) → iOS/Android/Desktop/Web/鸿蒙(社区)
├── Agent 层: Python 后端服务 (HTTP/MCP)
├── 推理层: 云端 API 为主
└── 交付: flutter build + Fastlane
```

**Alternative: React Native** (if the team is on the React stack and needs deeper desktop integration)

**Rationale**: Flutter has the best all-platform consistency, and the Impeller engine delivers excellent performance. HarmonyOS is officially maintained by Huawei's OpenHarmony SIG. If your Agent doesn't need local inference, Flutter is the most balanced all-platform choice.

---

### Scenario C: Desktop Primary + Mobile Extension (Enterprise Desktop Agent)

```
第一选择：Qt6 Python (PySide6)
├── Agent 层: LangChain/LangGraph (Python) — 与 UI 同进程
├── 工具层: Shell / 文件系统 / Playwright / MCP Server
├── 推理层: llama-cpp-python (本地) / OpenAI API (云端)
├── UI 层: QML 声明式 UI → Desktop + iOS + Android
└── 交付: PyInstaller (Desktop) + Qt for Mobile
```

**Rationale**: the most complete AI ecosystem — the entire LangChain suite can run in the same process. The ceiling of Tool Calling. The strongest native desktop experience. Mobile is covered via Qt for Android/iOS. **Mini Programs and HarmonyOS cannot be covered**, requiring additional Taro/uni-app sub-projects to fill the gap.

---

### Scenario D: Pure Desktop AI Agent (No Mobile/Mini Programs Needed)

```
第一选择：Electron
├── Agent 层: LangChain.js / Vercel AI SDK
├── 推理层: OpenAI / Anthropic / Claude API
├── UI 层: React / Vue
└── 交付: electron-builder
```

**Alternative: Deno Desktop** (pursuing lightness, not in a hurry for production)

**Rationale**: both the frontend and AI ecosystems are complete. **But be fully aware: 1/6 platform coverage — future expansion to mobile/Mini Programs requires starting from scratch.**

---

### Scenario E: Local Large-Model Inference First (7B+ Models, Consumer Hardware)

```
第一选择：Qt6 C++ 或 Tauri (Rust 后端)
├── Agent 层: llama.cpp (C++) / candle (Rust) + Python 子进程辅助编排
├── 推理层: 纯本地 GGUF 量化模型
├── UI 层: QML / React
└── 交付: CMake / cargo-bundle
```

**Rationale**: only C++/Rust can make 7B+ models reach acceptable inference speed on a laptop. **But mobile/Mini Program scenarios are inherently unsuitable for 7B+ local inference** — this scenario is desktop-exclusive by nature.

---

### Scenario F: Lightweight Embedded Agent (IoT / Edge Devices)

```
选 Slint（Rust/C++ 路线）
├── Agent 层: 轻量 Rust ML 推理
├── 推理层: 微型模型 (1B 以下)
├── UI 层: .slint DSL
└── 交付: 单二进制 <5MB
```

**Rationale**: a <300KB UI framework + micro models. Not suitable for complex Agent scenarios, but suitable for IoT offline command recognition and similar use cases.

---

### Quick Reference Table

| Your Target Platforms | Recommended Framework | Alternative | Agent Layer Strategy |
|:---|:---|:---|:---|
| **Mini Programs + HarmonyOS + Mobile** | uni-app X | Taro | Python Agent standalone service |
| **iOS/Android + Desktop + Web** | Flutter | React Native | Python Agent standalone service |
| **Desktop primary + mobile secondary** | Qt6 Python | Qt6 C++ | Same-process LangChain |
| **Desktop only** | Electron | Deno Desktop | Same-process LangChain.js |
| **Desktop local large-model inference** | Qt6 C++ | Tauri | llama.cpp C++ API |
| **IoT/Edge devices** | Slint | — | Lightweight Rust ML |

---

## 6. Learning Paths from Different Technical Backgrounds

### 6.1 Python Backend Developers

**Desktop Agent path**: PySide6 + QML, 4-6 weeks. LangChain connects directly to existing Python model code.
**All-platform path**: Python Agent service + uni-app X frontend, requires learning Vue/UTS, 8-10 weeks.

### 6.2 Web Frontend Developers (React)

**Desktop path**: Electron + LangChain.js → prototype running the same day.
**Mobile path**: React Native → learning cost is almost zero.
**All-platform path**: Taro (Mini Programs + H5) + React Native (mobile) + Electron (desktop) = a three-piece combo.
**Mini Program exclusive**: Taro — React tech stack, zero extra learning cost.

### 6.3 Web Frontend Developers (Vue)

**All-platform path**: uni-app X — the Vue ecosystem is reused directly, and one codebase covers 6 platforms. About 4-6 weeks.

### 6.4 Native Mobile Developers (Swift / Kotlin)

**All-platform path**: Flutter (Dart syntax is close to Swift/Kotlin, about 6-8 weeks) or Kotlin Multiplatform (Kotlin reuse, about 4-6 weeks).
**Desktop path**: Qt6 Python (Python Agent + QML UI; the declarative syntax is close to SwiftUI/Compose, about 6-8 weeks).

### 6.5 C++ / System-Level Developers

**Optimal path**: Qt6 C++ + llama.cpp. Zero Python dependencies, C++ all the way through.

### 6.6 Real-World Pitfall Log

1. **The Python GIL is a real problem.** In PySide6, if Agent inference blocks the GIL, the entire UI freezes. Solution: run the Agent logic in a separate QThread or subprocess.

2. **Electron/node-llama-cpp is a small horse pulling a big cart.** When local inference is needed, use a Python subprocess or a standalone inference service.

3. **The MCP protocol is the silver bullet for decoupling.** Don't weld the UI and Agent logic into the same process. Connect with MCP: UI layer (uni-app/Flutter/RN/Electron) → Agent layer (standalone Python LangGraph service).

4. **WeChat Mini Programs' request limitations are a real problem.** Mini Programs don't support SSE (Server-Sent Events) streaming responses, so the Agent's streaming output must be implemented via WebSocket or polling.

5. **HarmonyOS development requires DevEco Studio.** Whether you use uni-app X or Flutter, compiling to HarmonyOS ultimately requires Huawei's DevEco Studio and the HarmonyOS SDK. The experience is good on macOS, with a slightly higher barrier on Windows.

6. **CMake is the first wall on the Qt6 C++ path.** Just use Qt Creator to generate the template.

---

## 7. IDE Selection Guide

Choosing the right IDE is just as important as choosing the right framework. AI Agent development involves a mix of languages (Python for the Agent, C++/Rust for inference, JS/TS for the UI), and a capable IDE can help you avoid 70% of environment configuration pitfalls.

### 7.1 IDE Recommendations Overview by Framework

| Framework | Primary IDE | Alternative IDE | macOS Experience | Core Reason |
|------|---------|---------|:---:|------|
| **Qt6 (C++)** | **Qt Creator** | CLion / VS Code | ★★★★★ | QML live preview, signal/slot auto-completion |
| **Qt6 (Python)** | **PyCharm Pro** | VS Code / Qt Creator | ★★★★☆ | Python type inference + Qt bindings |
| **Electron** | **VS Code** | WebStorm | ★★★★★ | JS/TS as first-class citizens |
| **Deno Desktop** | **VS Code** | No mature alternative | ★★★★☆ | Deno official extension + LSP |
| **Tauri** | **VS Code** | RustRover / Zed | ★★★★★ | Rust Analyzer + frontend dual-window |
| **Flutter** | **VS Code** | Android Studio | ★★★★★ | Flutter extension + Dart LSP |
| **React Native** | **VS Code** | WebStorm | ★★★★☆ | JS/TS ecosystem, Expo integration |
| **uni-app X** | **HBuilderX** | VS Code | ★★★★☆ | Cloud packaging, visual drag-and-drop |
| **Taro** | **VS Code** | WebStorm | ★★★★☆ | React ecosystem, mature CLI |
| **Kotlin Multiplatform** | **IntelliJ IDEA** | Fleet | ★★★★☆ | JetBrains' own Kotlin |
| **Wails** | **VS Code** | GoLand | ★★★★☆ | Go + frontend dual-window |
| **Avalonia** | **Rider** | VS Code + C# Dev Kit | ★★★☆☆ | Rider's XAML preview ceiling |
| **Dioxus** | **VS Code** | RustRover | ★★★★☆ | Rust Analyzer is good enough |

### 7.2 Deep Recommendations for the macOS Platform

Developing desktop AI Agent apps on macOS adds another layer of consideration to IDE selection: **the Xcode toolchain is the compilation foundation for all frameworks**, but you don't necessarily need to open Xcode.

---

#### 🥇 General First Choice: VS Code

**Suitable frameworks**: Electron, Deno Desktop, Tauri, Flutter, Wails, Dioxus

On macOS, VS Code's native Apple Silicon support, Metal rendering performance, and extension ecosystem are all at their best. It's especially friendly for AI Agent development:

- **GitHub Copilot / Copilot Chat**: AI-assisted Agent coding with full Python/TS/Rust language support
- **Jupyter extension**: run `.ipynb` in VS Code to debug LangChain Agent prototypes, then export
- **REST Client extension**: test LLM APIs directly (OpenAI / Anthropic / Ollama local endpoints)
- **Remote - SSH**: run the Agent inference layer on a remote GPU and develop remotely with local VS Code

```bash
# macOS 安装 VS Code + AI Agent 必备扩展
brew install --cask visual-studio-code

code --install-extension ms-python.python         # Python Agent
code --install-extension denoland.vscode-deno      # Deno Desktop
code --install-extension rust-lang.rust-analyzer   # Tauri / Dioxus
code --install-extension dart-code.flutter         # Flutter
code --install-extension github.copilot            # AI 辅助
code --install-extension github.copilot-chat       # AI Chat
```

---

#### 🥈 The Best Choice for Qt6 Developers: Qt Creator

**Suitable frameworks**: Qt6 C++, Qt6 Python (PySide6)

On macOS, Qt Creator's experience is in the same lineage as Xcode's, but specifically optimized for Qt:

- **Design mode**: drag-and-drop QML UI design, WYSIWYG. Preview Aqua-style controls directly on macOS
- **Signal/slot auto-completion**: after `connect(`, it automatically lists all available signals — something other IDEs can't do
- **Qt RHI debugging**: when running on the Metal backend on macOS, Qt Creator can capture frames to analyze rendering performance
- **CMake project template**: generate a macOS bundle project with one click, no need to hand-write `Info.plist`

```bash
# macOS 安装 Qt Creator（开源版）
brew install --cask qt-creator

# 或通过 Qt 在线安装器获取完整 SDK
# https://www.qt.io/download-open-source
```

> For Qt6 Python (PySide6), I recommend running **PyCharm Professional + Qt Creator side by side**: write Python Agent logic in PyCharm, and open the same project's QML files in Qt Creator for UI preview. The free Community edition of PyCharm doesn't support QML syntax highlighting; you can use VS Code + the QML extension instead.

---

#### 🥉 The JetBrains Suite: The Choice of Professional Teams

On macOS, JetBrains IDEs render their UI through JBR (JetBrains Runtime) with native Apple Silicon support. All are paid products (Community editions have limited features).

| Framework | Recommended JetBrains IDE | Free Alternative |
|------|-------------------|---------|
| Qt6 Python | **PyCharm Professional** | VS Code + Python + QML extensions |
| Qt6 C++ | **CLion** | Qt Creator (free and better) |
| Electron / Deno | **WebStorm** | VS Code (nearly identical features) |
| Tauri / Dioxus | **RustRover** | VS Code + Rust Analyzer |
| Avalonia | **Rider** | VS Code + C# Dev Kit |
| Kotlin Compose | **IntelliJ IDEA Ultimate** | IDEA Community + Kotlin plugin |
| Wails | **GoLand** | VS Code + Go extension |

**Reasons to choose JetBrains**: the Toolbox App manages versions uniformly, settings are shared across IDEs, and AI Assistant works across IDEs.

**Reasons not to choose JetBrains**: subscription fees (personal ~¥1000/year/product, all-inclusive ~¥2500/year); Qt6 C++ is better served by Qt Creator (CLion has no QML live preview); and the Electron/Deno experience has no essential difference from the free VS Code.

### 7.3 macOS-Specific Environment Prerequisites

No matter which IDE you choose, these basic tools are needed on macOS:

```bash
# 1. Xcode Command Line Tools（所有框架的编译基础）
xcode-select --install

# 2. Homebrew 包管理器
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. 按框架装编译依赖
brew install cmake ninja         # Qt6
brew install node                # Electron / Deno Desktop
brew install rustup-init         # Tauri / Dioxus（装完运行 rustup-init）
brew install --cask flutter      # Flutter
brew install go                  # Wails
```

### 7.4 IDE Workflow Recommendations for AI Agent Development

AI Agent desktop development is characterized by **multi-language mixing + multi-process debugging**; the recommended workflow is:

```
┌─────────────────────────────────────────┐
│              终端 1                       │
│  ollama serve                            │  ← 本地模型推理（常驻后台）
│  GGUF 模型热加载，API 端点 :11434          │
├─────────────────────────────────────────┤
│              终端 2                       │
│  python agent_server.py                  │  ← Agent 核心进程
│  LangGraph + MCP Server                  │     PyCharm 调试模式
├─────────────────────────────────────────┤
│              IDE 主窗口                   │
│  VS Code / Qt Creator / PyCharm          │  ← UI + Agent 逻辑开发
│  前端代码 + Agent 代码 + 断点调试           │
├─────────────────────────────────────────┤
│              终端 3                       │
│  deno desktop / npm run dev              │  ← 桌面应用热重载预览
└─────────────────────────────────────────┘
```

**Key tips**:
- **Run the model service independently**: keep `ollama serve` or `llama-server` running in the background; the IDE only debugs the Agent logic
- **Agent core in Python**: set breakpoints in PyCharm to observe LangGraph state transitions and Tool Calling inputs/outputs
- **UI layer in VS Code**: frontend hot reload, change the UI without restarting the Agent
- **MCP Inspector**: `npx @modelcontextprotocol/inspector` to debug MCP Tool requests/responses in the browser

---

## 8. Summary

Back to the original question: **if an AI Agent product needs to cover desktop + iOS + Android + H5 + HarmonyOS + WeChat Mini Programs, which cross-platform tech stack should you choose?**

**Core conclusion: no single framework can do everything. The MCP-decoupled architecture is the only correct answer.**

| If Your Priority Is... | Recommended Framework | One-Line Rationale |
|:---|:---|------|
| **AI ecosystem completeness** | Qt6 Python (PySide6) | LangChain + MCP + local inference, all in one process |
| **All-platform coverage (incl. Mini Programs + HarmonyOS)** | uni-app X | The only 6/6 all-platform framework |
| **All-platform coverage (no Mini Programs)** | Flutter | 5.5/6, Impeller engine + HarmonyOS community support |
| **Development efficiency (desktop only)** | Electron | JS/TS full stack, frontend ecosystem out of the box |
| **Local inference performance (desktop)** | Qt6 C++ | The llama.cpp C++ API is the ceiling |
| **Mini Program AI Agent** | Taro | React ecosystem + LangChain.js + multi Mini Programs |
| **Mobile AI Agent** | React Native | npm ecosystem + Fabric architecture + RN-OH HarmonyOS |
| **Smallest package size** | Tauri | 3MB + model files |

**The most important advice**: use the MCP protocol to decouple the UI and the Agent. When choosing a UI framework, follow your platform coverage needs (uni-app X for all platforms / Flutter for mobile-first / Electron for desktop-first), and always deploy the Agent core independently in Python. This is the most pragmatic and flexible architecture for 2026.

---

## 9. All-Platform Framework Resource Guide (Official Sites · Installation · Docs)

### 9.1 All-Platform Frameworks (Covering 4+ Platforms)

#### uni-app X `★ 6/6 All Platforms`

| Type | Link |
|------|------|
| Official site | <https://uniapp.dcloud.net.cn/> |
| uni-app X documentation | <https://uniapp.dcloud.net.cn/uni-app-x/> |
| HarmonyOS development guide | <https://uniapp.dcloud.net.cn/tutorial/harmony/> |
| Plugin marketplace | <https://ext.dcloud.net.cn/> |
| IDE download (HBuilderX) | <https://www.dcloud.io/hbuilderx.html> |

> Supports cloud packaging; no need to configure iOS/Android SDK locally. 9 million developers, actually used by Tencent/Alibaba/Huawei/Douyin/Meituan and others.

---

#### Taro `★ The King of Mini Programs`

| Type | Link |
|------|------|
| Official site | <> |
| Installation | `npm install -g @tarojs/cli` |
| Chinese documentation | <https://taro-docs.jd.com/> |
| GitHub | <https://github.com/NervJS/taro> |

> Created by JD.com, write one codebase in React/Vue → WeChat/Alipay/Baidu/Douyin and other Mini Programs + H5 + RN.

---

#### React Native

| Type | Link |
|------|------|
| Official site | <https://reactnative.dev/> |
| Chinese documentation | <https://reactnative.cn/> |
| Installation | `npx create-expo-app` |
| Windows/macOS | <https://microsoft.github.io/react-native-windows/> |
| HarmonyOS (RN-OH) | <> |
| GitHub | <https://github.com/facebook/react-native> |

> Expo for a quick start. The HarmonyOS adaptation is led by the Huawei Developer Alliance.

---

#### Flutter

| Type | Link |
|------|------|
| Official site | <https://flutter.dev/> |
| Chinese documentation | <https://docs.flutter.cn/> |
| Installation | `brew install --cask flutter` (macOS) |
| HarmonyOS (OpenHarmony) | <https://gitcode.com/openharmony-tpc/flutter_flutter> |
| GitHub | <https://github.com/flutter/flutter> |

> The HarmonyOS version is officially maintained by the OpenHarmony SIG.

---

#### Kotlin Multiplatform + Compose

| Type | Link |
|------|------|
| Official site | <https://kotlinlang.org/compose-multiplatform/> |
| Installation | `brew install kotlin` |
| Chinese documentation | <https://docs.kmpstudy.com/> |
| GitHub | <https://github.com/JetBrains/compose-multiplatform> |

---

### 9.2 Desktop Frameworks (Desktop-First, Some Extending to Mobile)

#### Electron

| Type | Link |
|------|------|
| Official site | <https://www.electronjs.org/> |
| Chinese official site | <https://electron.nodejs.cn/> |
| Installation | `npm install electron` |
| GitHub | <https://github.com/electron/electron> |

---

#### Tauri 2.0

| Type | Link |
|------|------|
| Official site | <https://tauri.app/> |
| Chinese official site | <https://v2.tauri.org.cn/> |
| Installation | `npm create tauri-app@latest` |
| GitHub | <https://github.com/tauri-apps/tauri> |

> Mobile (iOS/Android) is officially GA.

---

#### Deno Desktop `★`

| Type | Link |
|------|------|
| Official site | <https://deno.com/> |
| Desktop documentation | <https://docs.deno.com/runtime/desktop/> |
| Installation | `curl -fsSL https://deno.land/install.sh \| sh` |
| Chinese documentation | <https://docs.deno.org.cn/> |
| GitHub | <https://github.com/denoland/deno> |

> `deno desktop` is built in starting from v2.9.

---

#### Wails

| Type | Link |
|------|------|
| Official site | <https://wails.io/> |
| Chinese documentation | <https://wails.golang.ac.cn/> |
| Installation | `go install github.com/wailsapp/wails/v3/cmd/wails@latest` |
| GitHub | <https://github.com/wailsapp/wails> |

---

#### NW.js

| Type | Link |
|------|------|
| Official site | <https://nwjs.io/> |
| Chinese documentation | <https://nwjs-cn.readthedocs.io/> |
| GitHub | <https://github.com/nwjs/nw.js> |

---

#### Dioxus

| Type | Link |
|------|------|
| Official site | <https://dioxuslabs.com/> |
| Installation | `cargo install dioxus-cli` |
| GitHub | <https://github.com/DioxusLabs/dioxus> |

---

#### Electrobun `★`

| Type | Link |
|------|------|
| GitHub | <https://github.com/blackboardsh/electrobun> |

---

### 9.3 Enterprise-Grade Frameworks

#### Qt6 (C++ / Python)

| Type | Link |
|------|------|
| Official site | <https://www.qt.io/development/qt-framework/qt6> |
| Chinese documentation | <https://doc.qt.ac.cn/> |
| PySide6 documentation | <https://doc.qt.io/qtforpython-6/> |

> For users in China, the Tsinghua mirror is recommended: `

---

#### .NET MAUI

| Type | Link |
|------|------|
| Official site | <https://dotnet.microsoft.com/en-us/apps/maui> |
| Installation | `dotnet workload install maui` |
| Documentation | <https://learn.microsoft.com/en-us/dotnet/maui/> |

---

#### Avalonia

| Type | Link |
|------|------|
| Official site | <https://avaloniaui.net/> |
| Chinese documentation | <https://avaloniachina.github.io/avalonia-docs/> |
| GitHub | <https://github.com/AvaloniaUI/Avalonia> |

---

#### Uno Platform

| Type | Link |
|------|------|
| Official site | <https://platform.uno/> |
| GitHub | <https://github.com/unoplatform/uno> |

---

### 9.4 Lightweight and Experimental

#### Slint

| Type | Link |
|------|------|
| Official site | <https://slint.dev/> |
| Chinese reference | <https://qi-xmu.github.io/slint-reference-zh/> |
| GitHub | <https://github.com/slint-ui/slint> |

> Package size <300KB.

---

#### Neutralinojs

| Type | Link |
|------|------|
| Official site | <https://neutralino.js.org/> |
| GitHub | <https://github.com/neutralinojs/neutralinojs> |

---

### 9.5 AI Agent Ecosystem Resources

| Resource | Link | Description |
|------|------|------|
| LangChain Python | <https://python.langchain.com/> | Agent orchestration framework |
| LangChain.js | <https://js.langchain.com/> | JS/TS Agent orchestration |
| LangGraph | <https://langchain-ai.github.io/langgraph/> | Stateful multi-step Agent |
| LlamaIndex | <https://docs.llamaindex.ai/> | RAG data framework |
| CrewAI | <https://docs.crewai.com/> | Multi-Agent collaboration |
| AutoGen | <https://microsoft.github.io/autogen/> | Microsoft's multi-Agent |
| Vercel AI SDK | <https://sdk.vercel.ai/> | Frontend AI components |
| MCP Protocol | <https://modelcontextprotocol.io/> | Agent-Tool standard protocol |
| llama.cpp | <https://github.com/ggerganov/llama.cpp> | C++ local inference |
| ONNX Runtime | <https://onnxruntime.ai/> | Cross-platform model inference |
| Ollama | <https://ollama.com/> | One-click local model deployment |
| DeepSeek API | <https://platform.deepseek.com/> | Domestic high-value LLM |

### 9.6 HarmonyOS / Mini Program Specific Resources

| Resource | Link | Description |
|------|------|------|
| HarmonyOS Developers | <https://developer.huawei.com/consumer/cn/harmonyos/> | The official HarmonyOS portal |
| DevEco Studio | <https://developer.huawei.com/consumer/cn/deveco-studio/> | The official HarmonyOS IDE |
| ArkUI Documentation | <https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkui-overview> | HarmonyOS native UI |
| WeChat Mini Program Docs | <> | Official Mini Program development |
| WeChat Mini Program AI Capabilities | <> | Built-in AI for Mini Programs |
| uni-app Plugin Marketplace | <https://ext.dcloud.net.cn/> | uni-app/Taro plugins |

---

*This article is continuously updated. You're welcome to discuss and correct via [GitHub Issues](https://github.com/sunyazhou/sunyazhou.github.io/issues).*
