# baicai

## 项目简介

baicai 是一个 Windows 桌面桌宠 MVP。当前版本使用 Tauri 2 + React 构建桌宠主窗口和独立聊天窗口，用 Three.js 渲染本地 MMD/PMX 模型，并通过 OpenAI-compatible Chat Completions API 提供基础聊天能力。

当前版本只做个人本地测试用途，不包含复杂智能能力。

## 当前功能

- 340x390 透明桌宠主窗口。
- 桌宠主窗口无边框、置顶、不可缩放，只负责模型、拖动和右键菜单。
- 点击桌宠打开独立聊天窗口。
- 聊天窗口是 720x640 的普通可缩放窗口，承载聊天、设置和后续小功能。
- 使用 `resources/眞白花音偶像服Q版MMD模型/眞白花音_增加腕部骨骼限制.pmx` 渲染桌宠角色。
- 通过 Three.js + `three-stdlib` 的 `MMDLoader` 在前端加载 PMX、贴图、toon/spa 资源。
- 对 MMD 模型做了高分辨率 canvas 渲染、贴图采样优化、饱和度和对比度增强，避免看起来发白或偏糊。
- 桌宠状态：`idle`、`thinking`、`talking`、`happy`、`sleeping`。
- 根据状态切换集中在 MMD 渲染层里的轻量 Three.js 动作，并保留思考 `...`、睡觉 `Zzz` 这类 MMD 状态提示。
- 拖动桌宠移动窗口。
- 右键菜单：打开/关闭聊天、睡觉/唤醒、清空对话、退出应用。
- 聊天面板：消息列表、输入框、发送按钮、关闭按钮、设置入口。
- Enter 发送，Shift+Enter 换行。
- loading 时禁用发送按钮。
- 设置面板：桌宠名字、用户称呼、模型、API 地址、API Key、性格设定、是否置顶。
- 流式 OpenAI-compatible Chat Completions API 调用，回复会边生成边更新到聊天气泡。
- 使用 localStorage 保存设置、窗口位置和最近 20 条消息。

## 明确不包含的功能

- 不包含 Live2D。
- 不包含 VMD 动作文件播放和物理模拟。
- 不包含摄像头。
- 不包含屏幕截图。
- 不包含 OCR。
- 不包含 RAG。
- 不包含 SQLite。
- 不包含自动操作电脑。
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
- Three.js
- three-stdlib

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
      MmdPetModel.tsx
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
      mmdPetConfig.ts
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

- `src/App.tsx`：应用主流程，根据 URL 参数切换桌宠主窗口和独立聊天窗口。
- `src/components/Pet.tsx`：桌宠交互外壳，负责点击、右键和拖动窗口。
- `src/components/MmdPetModel.tsx`：MMD/PMX 模型渲染组件，负责 Three.js 场景、相机、灯光、模型加载和轻量状态动画。
- `src/components/ChatPanel.tsx`：聊天面板，负责消息展示、输入和发送。
- `src/components/ChatBubble.tsx`：单条消息气泡。
- `src/components/SettingsPanel.tsx`：设置面板。
- `src/components/ContextMenu.tsx`：桌宠右键菜单。
- `src/hooks/useChat.ts`：聊天状态、流式发送消息、清空对话。
- `src/hooks/usePetState.ts`：桌宠状态机。
- `src/hooks/useSettings.ts`：设置读取和保存。
- `src/lib/llm.ts`：OpenAI-compatible Chat Completions API 封装。
- `src/lib/mmdPetConfig.ts`：MMD 模型路径、相机、灯光、归一化高度等调参配置。
- `src/lib/storage.ts`：localStorage 读写。
- `src/lib/tauri.ts`：Tauri 窗口拖动、置顶、创建聊天窗口、窗口间状态通知和关闭封装。
- `src/lib/types.ts`：共享 TypeScript 类型。
- `vite.config.ts`：Vite 配置，当前把 `resources/` 作为静态资源目录，让 PMX 和贴图在开发、构建后都能以相对路径加载。
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

窗口位置保存 key：

```text
desktop-pet.window-position
```

保存内容：

```ts
{
  x: number;
  y: number;
}
```

## API Key 安全说明

当前版本的 API Key 明文保存在 localStorage 中，仅适合个人本地测试。

不要在共享电脑、生产环境或不可信环境中使用真实 API Key。当前版本没有加密存储、系统密钥链接入、账号权限隔离或云端密钥托管。

## 常见问题

### MMD 模型替换是否可行？

可行。当前实现没有移动模型文件，而是让 Vite 直接把 `resources/` 当作静态资源目录：

```ts
publicDir: "resources"
```

这样模型路径保持为：

```text
/眞白花音偶像服Q版MMD模型/眞白花音_增加腕部骨骼限制.pmx
```

桌宠外层仍然是原来的按钮交互结构，所以点击打开独立聊天窗口、右键菜单、拖动窗口这些逻辑没有跟 3D 渲染混在一起。

### 为什么改成两个窗口？

桌宠主窗口应该尽量小，只包住模型和右键菜单；聊天、设置和后续小功能需要更大的操作空间。当前实现是：

- 默认窗口 `main`：透明、无边框、置顶，只显示 MMD 桌宠。
- 动态窗口 `chat`：点击桌宠时创建或聚焦，使用 `?window=chat` 渲染大聊天界面。
- 两个窗口共用 localStorage，所以设置和最近消息仍然是同一份本地数据。
- 聊天窗口会通过 Tauri event 把 `thinking`、`talking`、`happy` 等状态发回桌宠窗口，让模型动画跟随聊天状态。

### 如何调整模型显示效果？

模型路径、镜头、灯光、渲染清晰度和目标高度集中在 `src/lib/mmdPetConfig.ts`。模型在窗口里的画布尺寸、位置和 CSS 视觉增强在 `src/styles.css`。更详细的修改教程见 [`docs/model-customization.md`](docs/model-customization.md)。

### 当前 MMD 动作能力到什么程度？

当前状态动画只包含根节点层面的轻量动作，例如上下浮动、左右转动、说话时轻微缩放，以及思考 `...`、睡觉 `Zzz` 状态提示。项目还没有接入 VMD/VPD，也没有控制 PMX 的骨骼姿势或 morph 表情，所以托腮、抱胸、眨眼、微笑这类真实 MMD 动作还没有实现。

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

聊天发送时使用 `stream: true`，流式解析 SSE 的 `data:` chunk，并把 token 增量更新到当前助手气泡。

### 数据保存在哪里？

设置和最近消息保存在 localStorage，不写入 SQLite，也不同步到云端。

### 如何清空对话？

可以在聊天面板点击清空按钮，也可以通过桌宠右键菜单选择清空对话。

### 如何退出应用？

通过桌宠右键菜单选择退出应用。

## Roadmap

- 增加托盘菜单。
- 增加开机自启动选项。
- 将 API Key 存储迁移到更安全的本地方案。
- 增加 MMD morph 表情、VPD 姿势或 VMD 动作文件播放，让模型从默认站姿进化到真实表情和动作。
- 增加更细的错误提示和重试入口。
