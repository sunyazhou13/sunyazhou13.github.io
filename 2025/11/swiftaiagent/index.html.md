---
layout: post
title: 揭秘 AI 编码代理：用 Swift 构建你自己的Agent
date: 2025-11-17 05:09 +0000
categories: [iOS, SwiftUI]
tags: [iOS, SwiftUI, Swift, Objective-C]
typora-root-url: ..
---


# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!


# 揭秘 AI 编码代理：用 Swift 构建你自己的代理

![Hero Image](/assets/images/20251117SwiftAIAgent/hero.webp)

## 并非魔法的魔术

AI 编码代理感觉像魔法一样。你输入一个请求，它们就会搜索文件、编写代码、重构函数，并且似乎"知道"下一步该做什么。很神奇，对吧？

但秘密在于：**这个概念其实出奇地简单**。

我一直相信，真正理解某件事的最好方法就是亲自构建它。这正是我在阅读 Amp 的优秀文章["如何构建一个代理"](https://ampcode.com/how-to-build-an-agent)后所做的。我想看看能否用 Swift 重现这种魔法，你猜怎么着？你绝对可以做到。

今天，我们将用 Swift 构建一个真正的 AI 编码代理，它可以读取文件、列出目录，甚至编辑代码。没有烟雾，没有镜子。只有一个循环、一些工具和一个有主见的语言模型。

读完这篇文章后，你将确切地知道像 Claude Code、Cursor 或 GitHub Copilot Workspace 这样的工具是如何工作的。剧透：它比你想象的要简单。

## AI 编码代理到底是什么？

AI 编码代理归结为三件事：

1. **一个语言模型**（如 GPT-5、Claude 或 Gemini）
2. **一组工具**，它可以调用（执行实际工作的函数）
3. **一个循环**，保持对话继续进行

![Agent Loop Image](/assets/images/20251117SwiftAIAgent/agent-loop.webp)

把它想象成有一位聪明的科学家，但他不能离开办公室。你（代理循环）不断询问他们下一步该做什么，他们告诉你，你去做，然后报告回来，他们再想出下一步。冲洗并重复，直到工作完成。

### 上下文窗口：你的代理的工作记忆

这里事情变得有趣了。语言模型实际上不会像人类那样"记住"之前的对话。每次你发送消息时，实际上是将_整个对话历史_一起发送。

![Context Window](/assets/images/20251117SwiftAIAgent/context-window.webp)

这个"工作记忆"被称为**上下文窗口**。现代模型通常有 128K 到 200K 个 token 的上下文窗口（大约 100,000-150,000 个单词）。

**为什么这很重要？**

因为随着你的代理运行时间越长：

* 它读取的每个文件都会添加到历史记录中。
* 每个工具调用和结果都会占用空间。
* 模型每次需要处理越来越多的文本。
* 最终，你会达到限制。

当上下文填满时，会发生三件事：

1. **性能下降**，因为模型难以"关注"所有内容。
2. **成本飙升**，因为你是按 token 付费的，记得吗？
3. **你达到硬限制**，API 会直接拒绝你的请求。

这就是为什么生产环境的代理使用诸如摘要、选择性记忆和上下文修剪等巧妙技巧。但对于我们的学习之旅，我们会保持简单。

## 游戏计划：通往代理启蒙的五个步骤

我们将构建 **Nimbo**，一个基于 Swift 的编码代理，可以帮助你处理文件。这是我们的路线图：

1. **基础：** 设置一个基本的聊天循环。
2. **教授工具：** 定义我们的代理可以做什么。
3. **工具执行：** 让这些工具真正工作。
4. **循环：** 将所有内容连接在一起。
5. **终点线：** 处理边缘情况和错误。

我们讨论的所有代码都在 [Nimbo 仓库](https://github.com/gscalzo/Nimbo)中。随时克隆它并跟着做！

![Agent Interaction](/assets/images/20251117SwiftAIAgent/agent-interaction.webp)

## 步骤 1：基础（构建聊天循环）

每个代理都需要一个对话循环。在我们的例子中，我们正在构建一个 CLI 工具，感觉就像与一个有帮助的助手聊天。

这是来自 [main.swift](https://github.com/gscalzo/Nimbo/blob/main/Sources/NimboCLI/main.swift) 的核心结构：

```swift
// main.swift
private func runLoop() async {
    print("\nChat with Nimbo (use 'ctrl-c' to quit)\n")

    let agent = Agent(
        apiKey: apiKey,
        system: "You are Nimbo, a concise CLI assistant."
    )

    while let line = input() {
        if line.isEmpty { continue }
        let answer = await agent.respond(line)
        print("\(display("Nimbo", in: .green)): \(answer)")
    }
}
```

很简单，对吧？我们：

1. 使用系统提示创建一个代理。
2. 在循环中获取用户输入。
3. 要求代理响应。
4. 打印响应。

真正的魔法发生在 `agent.respond()` 调用内部。让我们看看底层。

[Agent 类](https://github.com/gscalzo/Nimbo/blob/main/Sources/NimboCLI/Agent.swift)维护对话历史：

```swift
// Agent.swift
final class Agent {
    private let client: OpenAIService
    private var history: [ChatCompletionParameters.Message]
    private let tools: [Tool]

    init(apiKey: String, system: String) {
        client = OpenAIServiceFactory.service(apiKey: apiKey)
        history = [.init(role: .system, content: .text(system))]
        tools = [ListFiles(), ReadFile(), EditFile()]
    }

    func respond(_ text: String) async -> String {
        history.append(.init(role: .user, content: .text(text)))
        // ... 魔法发生在这里 ...
    }
}
```

注意到那个 `history` 数组了吗？那就是我们的上下文窗口在填充。每条消息（你的、模型的和工具结果）都会被追加到它。

### 我们目前拥有的

此时，我们有一个基本的聊天循环，但**还没有工具**。代理只能进行对话。它实际上不能对文件做任何事情。

![Nimbo Basic](/assets/images/20251117SwiftAIAgent/nimbo-1.webp)

## 步骤 2：教授工具（定义能力）

工具只是带有花哨描述的函数。LLM 实际上不执行代码；它只是告诉我们_调用哪个_工具以及_使用什么参数_。

在 Swift 中，我们使用协议定义工具（[Tool.swift](https://github.com/gscalzo/Nimbo/blob/main/Sources/NimboCLI/Tools/Tool.swift)）：

```swift
// Tool.swift
protocol Tool {
    var name: String { get }
    var chatTool: ChatCompletionParameters.Tool { get }
    var exec: (Data?) -> String { get }
}
```

让我们看一个具体的例子：[ReadFile 工具](https://github.com/gscalzo/Nimbo/blob/main/Sources/NimboCLI/Tools/ReadFile.swift)：

```swift
// ReadFile.swift
struct ReadFile: Tool {
    var name = "read_file"

    var chatTool: ChatCompletionParameters.Tool = {
        let schema = JSONSchema(
            type: .object,
            properties: ["path": JSONSchema(type: .string)]
        )

        let function = ChatCompletionParameters.ChatFunction(
            name: "read_file",
            description: """
                读取给定相对文件路径的内容。
                当你想查看文件内部内容时使用此工具。
                """,
            parameters: schema
        )

        return .init(function: function)
    }()

    var exec: (Data?) -> String = { input in
        guard let path = input.asPath(defaultPath: nil) else {
            return "<error> 无效的 JSON 参数"
        }
        return ReadFile.readFile(atPath: path)
    }
}
```

三个关键部分：

1. **名称**：工具的名称。
2. **描述**：给 LLM 的指令，说明何时使用它。
3. **执行**：实际执行工作的 Swift 函数。

LLM 看到描述并决定，"哦，用户想查看一个文件。我应该用路径 `foo.txt` 调用 `read_file`！"

### 我们目前拥有的

现在我们已经定义了我们的工具！代理知道**存在哪些工具**以及**何时使用它们**，但它仍然无法执行它们。如果你要求它读取文件，它会尝试调用工具，但还不会发生任何事情。

![Nimbo Basic](/assets/images/20251117SwiftAIAgent/nimbo-3.webp)

## 步骤 3：工具执行（让它们工作）

这里事情变得有趣了。当模型响应时，它可能：

* 返回文本答案（我们完成了！）。
* 请求调用一个或多个工具（继续！）。

我们的代理需要检测工具调用并执行它们（[Agent.swift](https://github.com/gscalzo/Nimbo/blob/main/Sources/NimboCLI/Agent.swift)）：

```swift
// Agent.swift
func respond(_ text: String) async -> String {
    history.append(.init(role: .user, content: .text(text)))

    do {
        for _ in 0..<Agent.maxToolIterations {
            let response = try await requestCompletion()
            let assistantMessage = try firstAssistantMessage(from: response)
            appendAssistantMessage(assistantMessage)

            // 检查模型是否想使用工具
            if let calls = assistantMessage.toolCalls, !calls.isEmpty {
                executeToolCalls(calls)
                continue  // 循环回去再次询问模型
            }

            // 没有请求工具，我们有答案了！
            return assistantMessage.content ?? ""
        }

        throw AgentError.toolIterationLimitReached
    } catch {
        return "<error> \(error.localizedDescription)"
    }
}
```

注意到那个 `maxToolIterations` 常量了吗？那是我们的安全网。没有它，代理理论上可以永远循环。

`executeToolCalls` 方法很简单：

```swift
// Agent.swift
private func executeToolCalls(_ calls: [ToolCall]) {
    for call in calls {
        let toolMessage = perform(call)
        history.append(toolMessage)  // 将结果添加到历史记录！
    }
}

private func perform(_ call: ToolCall) -> ChatCompletionParameters.Message {
    let toolName = call.function.name ?? "<nil>"
    let rawArgs = call.function.arguments

    print("tool: \(toolName)(\(rawArgs))")

    let result = {
        if let tool = tools.first(where: { $0.name == toolName }) {
            return tool.exec(rawArgs.data(using: .utf8))
        } else {
            return "<error> 未知工具: \(toolName)"
        }
    }()

    return .init(role: .tool, content: .text(result), toolCallID: call.id)
}
```

我们：

1. 按名称查找匹配的工具。
2. 使用提供的参数执行它。
3. 将结果打包为消息。
4. 将其添加到历史记录。

模型在下一次迭代中看到这个结果，并可以决定下一步做什么。

### 我们目前拥有的

现在代理可以**执行单个工具**了！它可以调用 `read_file` 或 `list_files` 并实际获得结果。但它就此停止。它还不能将多个工具链接在一起。

![Nimbo Basic](/assets/images/20251117SwiftAIAgent/nimbo-4.webp)

### 其他工具：ListFiles 和 EditFile

遵循与 `ReadFile` 相同的模式，Nimbo 包含另外两个基本工具，完善了其功能：

**[ListFiles](https://github.com/gscalzo/Nimbo/blob/main/Sources/NimboCLI/Tools/ListFiles.swift)** - 导航目录结构：

```swift
// ListFiles.swift
struct ListFiles: Tool {
    var name = "list_files"

    var chatTool: ChatCompletionParameters.Tool = {
        let function = ChatCompletionParameters.ChatFunction(
            name: "list_files",
            description: """
                列出给定相对路径下的文件和目录。
                当你需要检查项目结构时使用此工具。
                当没有提供路径时，默认为当前工作目录。
                """,
            parameters: schema
        )
        return .init(function: function)
    }()

    var exec: (Data?) -> String = { input in
        let path = input.asPath(defaultPath: ".")
        return ListFiles.listDirectory(atPath: path.asURL)
    }
}
```

该工具将结果限制为 200 个条目，以防止上下文窗口过载。当目录有更多文件时，它会显示一个截断的列表，并显示剩余项目的计数。

**[EditFile](https://github.com/gscalzo/Nimbo/blob/main/Sources/NimboCLI/Tools/EditFile.swift)** - 对文件进行精确更改：

```swift
// EditFile.swift
struct EditFile: Tool {
    var name = "edit_file"

    var chatTool: ChatCompletionParameters.Tool = {
        let function = ChatCompletionParameters.ChatFunction(
            name: "edit_file",
            description: """
                通过将 `old_str` 的精确匹配替换为 `new_str` 来编辑文本文件。
                替换必须是唯一的，`old_str` 必须与 `new_str` 不同。
                当文件不存在且 `old_str` 为空时创建文件。
                """,
            parameters: schema  // 期望：path, old_str, new_str
        )
        return .init(function: function)
    }()

    var exec: (Data?) -> String = { data in
        let arguments = try? JSONDecoder().decode(Arguments.self, from: data)
        return EditFile.process(arguments)
    }
}
```

`EditFile` 工具很聪明。它：

* **创建新文件**，当 `old_str` 为空时。
* **更新现有文件**，通过替换精确匹配。
* **验证唯一性** - `old_str` 必须在文件中精确匹配一次。
* **防止意外** - `old_str` 和 `new_str` 必须不同。

这种设计迫使代理精确。它不能进行模糊的编辑或意外替换错误的文本。如果模式匹配多次，工具会返回错误，要求模型更具体。

这三个工具（`ListFiles`、`ReadFile`、`EditFile`）一起为代理提供了探索和修改代码库所需的一切。模型决定使用哪些工具以及以什么顺序使用。我们所做的只是描述它们的作用。

## 步骤 4：保持对话继续

还记得我们的上下文窗口讨论吗？每个工具调用都会添加到它：

```
用户："你能检查一下 src 文件夹里有什么吗？"
→ 历史记录增加 1 条消息

代理：（调用 list_files 工具）
→ 历史记录增加 1 条消息（工具调用）

工具结果：[长文件列表]
→ 历史记录增加 1 条消息（结果）

代理："当然！src 文件夹包含..."
→ 历史记录增加 1 条消息（响应）
```

一个简单的请求就有四条消息！现在想象：

* 读取一个 500 行的文件。
* 编辑多个文件。
* 来回运行 20 次。

你的上下文窗口很快就会填满。这就是为什么 [ReadFile 工具](https://github.com/gscalzo/Nimbo/blob/main/Sources/NimboCLI/Tools/ReadFile.swift)将文件内容限制为 100KB：

```swift
let capped = fileData.prefix(100_000)
if let text = String(data: capped, encoding: .utf8) {
    return text
}
```

这是一个平衡：给模型足够的上下文以便有用，但不要太多以至于我们耗尽预算或达到限制。

## 步骤 5：将所有内容整合在一起

让我们追踪一个真实的交互，看看所有内容是如何连接的：

**用户输入：** `"创建一个 hello.txt 文件，内容为 'Hello, Nimbo!'"`

1. **输入被添加到历史记录** - `history.append(userMessage)`
2. **代理调用 LLM** - 发送带有工具定义的整个历史记录。
3. **LLM 响应** - "我将使用 `edit_file` 工具。"
4. **代理执行工具** - 创建文件。
5. **工具结果添加到历史记录** - `"<success> 文件已创建"`
6. **代理再次调用 LLM** - 使用更新的历史记录。
7. **LLM 响应** - "完成！我用你的消息创建了 hello.txt。"
8. **用户看到响应** - 任务完成！

这里最美妙的部分：**你从未教过模型何时使用哪个工具**。你只是描述了每个工具的作用，它自己找出了正确的顺序。

这种涌现行为就是让代理感觉神奇的原因。模型将工具链接在一起，处理错误，并调整其策略，所有这些都来自自然语言描述。

### 我们现在拥有的：一个完整的代理！

此时，我们有一个**功能齐全的代理**。它可以：

* 与用户聊天。
* 理解何时使用工具。
* 执行工具并获得结果。
* 将多个工具调用链接在一起。
* 循环直到任务完成。

![Nimbo Basic](/assets/images/20251117SwiftAIAgent/nimbo-5.webp)

## 实际考虑

我们的 Nimbo 代理是教育性的，但生产环境的代理需要更多的润色。

### 安全第一

```swift
private static let maxToolIterations = 8
```

我们限制迭代次数以防止无限循环。生产系统使用更复杂的安全措施：

* 每次对话的 token 预算。
* 工具调用的速率限制。
* 危险操作的沙箱。

### 错误处理

注意到我们的工具如何返回 `<error>` 字符串吗？模型实际上可以读取这些并进行调整：

```swift
return "<error> 无法读取路径下的文件: \(path)"
```

LLM 看到这个，可能会尝试不同的路径或要求用户澄清。

### 上下文管理

生产环境的代理采用以下技巧：

* **摘要** - 压缩旧消息。
* **选择性遗忘** - 删除不太重要的上下文。
* **RAG（检索增强生成）** - 将上下文存储在数据库中，仅检索所需内容。

## 让我们看看它的实际效果

想运行 Nimbo？方法如下：

```bash
git clone https://github.com/gscalzo/Nimbo.git
cd Nimbo
export OPENAI_API_KEY="your-key-here"
swift run
```

现在让我们通过一个真实的例子来看看代理如何将工具链接在一起。

### 示例 1：丢失的 TODO 的奇怪案例

让我们要求我们的代理帮助我们在一个混乱的项目中找到一些东西：

```
你：我想我在某个地方留下了一个关于重构身份验证的 TODO 注释。
    你能帮我找到它吗？

tool: list_files({"path": "."})

Nimbo：我将搜索你的 Swift 文件。让我检查 Sources 目录。

tool: list_files({"path": "Sources"})

tool: read_file({"path": "Sources/AuthManager.swift"})

Nimbo：找到了！在 AuthManager.swift 的第 42 行：

      // TODO: 重构此代码以使用 async/await 而不是完成处理程序
      func login(email: String, password: String, completion: @escaping (Result<User, Error>) -> Void) {
          // ... 旧式回调代码 ...
      }

      看起来你想将其现代化以使用 Swift 并发。想让我
      创建一个使用 async/await 的新版本吗？

你：是的，请！给我看看那会是什么样子。

tool: edit_file({"path": "AuthManager_v2.swift", "old_content": "", "new_content": "..."})

Nimbo：完成！我创建了带有现代化版本的 AuthManager_v2.swift：

      func login(email: String, password: String) async throws -> User {
          // ... 干净的 async/await 代码 ...
      }

      干净多了！不再有回调地狱。
```

注意发生了什么？代理：

1. **理解了模糊的意图**："关于身份验证的 TODO"相当模糊。
2. **系统地探索**：列出目录，然后是文件。
3. **实际读取代码**：找到了特定的 TODO 注释。
4. **提供价值**：建议创建重构版本。
5. **创造性地执行**：主动编写现代 Swift 代码。

代理不仅仅是找到文本。它理解上下文并预测你的下一个需求。

### 示例 2：构建一个有趣的游戏

现在让我们玩点有趣的，要求它从头开始创建一些东西：

```
你：创建一个命令行游戏，让我猜一个随机表情符号。
    让它有趣一点！

tool: edit_file({"path": "EmojiGuesser.swift", "old_content": "", "new_content": "..."})

Nimbo：创建了 EmojiGuesser.swift！这是你的游戏：

      import Foundation

      let emojiSet = ["🎸", "🦖", "🌮", "🚀", "🎨", "🎪", "🦄", "🌈"]

      func playEmojiGame() {
          let secret = emojiSet.randomElement()!
          print("🎮 我在想这个集合中的一个表情符号: \(emojiSet.joined())")
          print("你能猜出是哪一个吗？输入它！")

          while let guess = readLine() {
              if guess == secret {
                  print("🎉 是的！你找到了！你是表情符号低语者！")
                  break
              } else if emojiSet.contains(guess) {
                  print("❌ 不对！再试一次，侦探！")
              } else {
                  print("🤔 那甚至不在集合中！从这里选择: \(emojiSet.joined())")
              }
          }
      }

      playEmojiGame()

      尝试运行它：swift EmojiGuesser.swift

你：这很有趣，但你能在 3 次错误猜测后添加一个提示系统吗？

tool: read_file({"path": "EmojiGuesser.swift"})

tool: edit_file({"path": "EmojiGuesser.swift", "old_content": "...", "new_content": "..."})

Nimbo：更新了！现在在 3 次错误猜测后，它会给你一个提示，比如：
      "🕵️ 提示：它押韵... 开玩笑的，表情符号不押韵！
       但它以 🎯 类别开始：有趣！"

      游戏跟踪尝试次数并提供鼓励。好多了！
```

更令人印象深刻！代理：

1. **有创意**：在没有被要求的情况下为游戏添加了个性。
2. **做出了好的选择**：选择了有趣的表情符号，编写了有趣的字符串。
3. **理解迭代**：在修改之前读取现有文件。
4. **正确应用编辑**：用增强版本替换了旧的游戏逻辑。
5. **解释了改进**：告诉你发生了什么变化。

### 这说明了什么

这些例子展示了 AI 代理的三个关键超能力：

1. **工具链接**：代理决定使用哪些工具以及以什么顺序使用。
2. **上下文意识**：它记得它做了什么（因为这都在历史记录中！）。
3. **创造性推理**：它不仅仅执行命令；它思考什么会使结果更好。

真正的魔法？**你没有编程任何这些逻辑**。你只是：

* 描述了每个工具的作用。
* 给代理访问它们的权限。
* 让语言模型找出其余部分。

![Nimbo Basic](/assets/images/20251117SwiftAIAgent/nimbo-6.webp) 

![Nimbo Basic](/assets/images/20251117SwiftAIAgent/nimbo-7.webp)

## 简单的力量

这是我们学到的：

1. **代理是循环**：只需不断询问模型"下一步是什么？"
2. **工具是描述**：LLM 选择，你执行。
3. **上下文很宝贵**：每条消息都会消耗 token 和注意力。
4. **涌现行为是真实的**：复杂的行为源于简单的规则。

整个 Nimbo 代理不到 300 行 Swift 代码。然而它可以：

* 导航文件系统。
* 读取和修改文件。
* 链接多个操作。
* 优雅地处理错误。

这就是在语言模型之上构建的力量。你不是编码每种可能性；你正在创建一个模型可以思考和行动的空间。

## 下一步是什么？

现在你理解了基础知识，你可以：

* **添加更多工具**：网络搜索、API 调用、数据库查询。
* **改进上下文管理**：实现摘要或 RAG。
* **构建特定领域的代理**：专注于你的特定用例。
* **创建代理网络**：让多个代理协作。

代码都在 [GitHub](https://github.com/gscalzo/Nimbo) 上。Fork 它，破坏它，改进它。

下次你使用 Claude Code 或 Cursor 时，你会确切地知道底层发生了什么：一个循环、一些工具和一个非常聪明的实习生在做决定。

---

## 延伸阅读

**想深入了解？** 查看：

* [完整的 Nimbo 源代码](https://github.com/gscalzo/Nimbo)
* [Anthropic 的工具使用指南](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
* [OpenAI 的函数调用文档](https://platform.openai.com/docs/guides/function-calling)

**有问题？有想法？** 在 [Twitter](https://twitter.com/giordanoscalzo) 或 [LinkedIn](https://linkedin.com/in/giordanoscalzo) 上联系我。我很想看看你构建了什么！

---

**原文链接：** https://gioscalzo.com/blog/demystifying-ai-coding-agents-in-swift/

**作者：** Giordano Scalzo

**译者注：** 本文翻译自 Giordano Scalzo 的博客文章，介绍了如何用 Swift 从零开始构建一个 AI 编码代理。通过这篇文章，你将理解 AI 代理的核心原理，并能够自己动手实现一个功能完整的代理系统。
