# baicai

## 项目简介

baicai 是一个 Windows 桌面桌宠 MVP。当前版本固化为 `v0.1 MVP baseline`，目标是验证 Tauri 2 + React 桌宠壳子、基础聊天 UI、本地设置保存和 OpenAI-compatible API 调用流程。

当前版本只做个人本地测试用途，不包含复杂智能能力。

## 当前功能

- 360x460 小窗口。
- 透明背景、无边框、置顶、不可缩放。
- CSS 绘制的占位桌宠角色。
- 桌宠状态：`idle`、`thinking`、`talking`、`happy`、`sleeping`。
- 根据状态切换简单 CSS 动画。
- 点击桌宠打开聊天面板。
- 拖动桌宠移动窗口。
- 右键菜单：打开/关闭聊天、睡觉/唤醒、清空对话、退出应用。
- 聊天面板：消息列表、输入框、发送按钮、关闭按钮、设置入口。
- Enter 发送，Shift+Enter 换行。
- loading 时禁用发送按钮。
- 设置面板：桌宠名字、用户称呼、模型、API 地址、API Key、性格设定、是否置顶。
- 非流式 OpenAI-compatible Chat Completions API 调用。
- 使用 localStorage 保存设置和最近 20 条消息。

## 明确不包含的功能

- 不包含 Live2D。
- 不包含摄像头。
- 不包含屏幕截图。
- 不包含 OCR。
- 不包含 RAG。
- 不包含 SQLite。
- 不包含自动操作电脑。
- 不包含流式输出。
- 不包含托盘菜单。
- 不包含开机自启动。
- 不包含多角色系统。
- 不包含正式账号系统或云端同步。

## 技术栈

- Tauri 2
- React
- TypeScript
- Vite
- pnpm
- 普通 CSS

## 运行命令

安装依赖：

```powershell
pnpm install
```

启动 Tauri 桌面应用：

```powershell
pnpm tauri:dev
```

只预览前端：

```powershell
pnpm dev
```

前端预览地址：

```text
http://127.0.0.1:1420
```

## 构建命令

前端构建：

```powershell
pnpm build
```

Tauri debug 构建，不生成安装包：

```powershell
pnpm tauri build --debug --no-bundle
```

正式 Tauri 构建：

```powershell
pnpm tauri:build
```

## 目录结构

```text
baicai/
  package.json
  index.html
  vite.config.ts
  tsconfig.json
  README.md

  src/
    main.tsx
    App.tsx
    styles.css

    components/
      Pet.tsx
      ChatPanel.tsx
      ChatBubble.tsx
      ContextMenu.tsx
      SettingsPanel.tsx

    hooks/
      useChat.ts
      usePetState.ts
      useSettings.ts

    lib/
      constants.ts
      llm.ts
      storage.ts
      tauri.ts
      types.ts

  src-tauri/
    tauri.conf.json
    Cargo.toml
    Cargo.lock
    build.rs

    capabilities/
      default.json

    icons/
      icon.ico

    src/
      main.rs
      lib.rs
```

## 核心模块说明

- `src/App.tsx`：应用主流程，连接桌宠、聊天面板、右键菜单、设置和状态。
- `src/components/Pet.tsx`：桌宠组件，负责显示角色、点击、右键和拖动窗口。
- `src/components/ChatPanel.tsx`：聊天面板，负责消息展示、输入和发送。
- `src/components/ChatBubble.tsx`：单条消息气泡。
- `src/components/SettingsPanel.tsx`：设置面板。
- `src/components/ContextMenu.tsx`：桌宠右键菜单。
- `src/hooks/useChat.ts`：聊天状态、发送消息、清空对话。
- `src/hooks/usePetState.ts`：桌宠状态机。
- `src/hooks/useSettings.ts`：设置读取和保存。
- `src/lib/llm.ts`：OpenAI-compatible Chat Completions API 封装。
- `src/lib/storage.ts`：localStorage 读写。
- `src/lib/tauri.ts`：Tauri 窗口拖动、置顶、关闭封装。
- `src/lib/types.ts`：共享 TypeScript 类型。
- `src-tauri/tauri.conf.json`：Tauri 窗口和构建配置。
- `src-tauri/capabilities/default.json`：Tauri 权限配置。

## localStorage 数据说明

当前版本使用浏览器 localStorage 保存本地数据。

设置保存 key：

```text
desktop-pet.settings
```

保存内容：

```ts
{
  petName: string;
  userName: string;
  personalityPrompt: string;
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  alwaysOnTop: boolean;
}
```

最近消息保存 key：

```text
desktop-pet.messages
```

保存内容：

```ts
Array<{
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}>
```

消息最多保存最近 20 条。

## API Key 安全说明

当前版本的 API Key 明文保存在 localStorage 中，仅适合个人本地测试。

不要在共享电脑、生产环境或不可信环境中使用真实 API Key。当前版本没有加密存储、系统密钥链接入、账号权限隔离或云端密钥托管。

## 常见问题

### 为什么没有真实桌宠图片？

v0.1 使用 CSS 绘制占位角色，目的是先验证桌宠窗口、状态动画和聊天流程。

### 为什么发送消息提示 API Key 缺失？

需要先打开设置面板，填写 API Key、API 地址和模型。API 地址默认是：

```text
https://api.openai.com/v1
```

### 支持哪些 API？

当前只封装了 OpenAI-compatible Chat Completions API，默认请求路径是：

```text
/chat/completions
```

### 为什么不是流式输出？

v0.1 使用非流式请求，先保证 MVP 简洁稳定。

### 数据保存在哪里？

设置和最近消息保存在 localStorage，不写入 SQLite，也不同步到云端。

### 如何清空对话？

可以在聊天面板点击清空按钮，也可以通过桌宠右键菜单选择清空对话。

### 如何退出应用？

通过桌宠右键菜单选择退出应用。

## Roadmap

- 增加流式输出。
- 增加真实桌宠图片或精灵图资源。
- 增加窗口位置记忆。
- 增加托盘菜单。
- 增加开机自启动选项。
- 将 API Key 存储迁移到更安全的本地方案。
- 增加更多桌宠动作和状态。
- 增加更细的错误提示和重试入口。
