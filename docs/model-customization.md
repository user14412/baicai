# 桌宠模型修改教程

这份文档专门讲当前 MMD 桌宠怎么改。它不是框架大课，而是按这个项目的真实文件来讲：你以后要换模型、调大小、调颜色、理解动作能力边界，主要看这里。

## 1. 这个项目的技术组成

- Tauri 2：把前端页面包成 Windows 桌面窗口，窗口透明、置顶、可拖动。
- React：写界面组件，比如聊天框、右键菜单、桌宠交互外壳。
- Vite：开发服务器和前端构建工具。
- Three.js：在网页里画 3D 模型。
- three-stdlib：提供 `MMDLoader`，用来加载 PMX/PMD 这类 MMD 模型。
- 普通 CSS：负责聊天框样式、层级、窗口布局、canvas 的视觉滤镜。

## 2. 文件分工

- `src/components/Pet.tsx`：桌宠外壳。负责点击打开聊天、右键菜单、拖动窗口。
- `src/components/MmdPetModel.tsx`：真正加载和渲染 PMX 模型。模型状态动作和渲染生命周期主要在这里。
- `src/lib/mmdPetConfig.ts`：MMD 模型路径、镜头、灯光、模型目标高度等调参入口。
- `src/styles.css`：改模型在窗口里的大小、位置、层级、饱和度，以及聊天窗口的界面样式。
- `src/lib/tauri.ts`：封装 Tauri 窗口 API，比如拖动、置顶、创建聊天窗口、窗口间状态通知。
- `src-tauri/tauri.conf.json`：桌面窗口配置，比如窗口大小、是否透明、是否可缩放。
- `src-tauri/capabilities/default.json`：Tauri 权限。前端要调用新的窗口能力时，经常需要在这里加允许项。
- `vite.config.ts`：这里把 `resources/` 配成静态资源目录，让模型文件可以被前端访问。

## 3. 换模型怎么做

把新的 MMD 模型文件夹放进 `resources/`，例如：

```text
resources/
  NewModel/
    model.pmx
    tex/
    toon/
    spa/
```

然后改 `src/lib/mmdPetConfig.ts` 里的路径：

```ts
export const MMD_PET_MODEL_PATH = "/NewModel/model.pmx";
```

注意路径开头的 `/` 表示从 Vite 静态资源根目录读取。因为 `vite.config.ts` 里有：

```ts
publicDir: "resources"
```

所以 `resources/NewModel/model.pmx` 在运行时就是 `/NewModel/model.pmx`。

## 3.1. 两个窗口是怎么工作的

当前前端只有一个 React 应用，但它有两个运行模式：

```ts
return isChatWindowMode() ? <ChatWindowApp /> : <PetWindowApp />;
```

- 默认 URL：渲染 `PetWindowApp`，也就是透明桌宠主窗口。
- `?window=chat`：渲染 `ChatWindowApp`，也就是独立聊天窗口。

点击桌宠时，`src/lib/tauri.ts` 里的 `openChatWindow()` 会创建或聚焦 `chat` 窗口：

```ts
new WebviewWindow("chat", {
  url: "...?window=chat",
  width: 720,
  height: 640,
  resizable: true,
});
```

聊天窗口和桌宠窗口都读同一份 localStorage，所以设置和最近消息仍然共享。聊天窗口发送消息时，会用 Tauri event 通知主窗口切换桌宠状态：

```ts
notifyMainPetState("thinking");
notifyMainPetState("talking");
notifyMainPetState("happy");
```

主窗口监听这些状态，然后更新 MMD 模型动画。

## 4. 模型太大、太小、下身被挡住怎么调

先看 `src/lib/mmdPetConfig.ts` 里的这些参数：

```ts
export const MMD_PET_CAMERA = {
  fov: 30,
  position: { x: 0, y: 0.15, z: 6.2 },
  lookAt: { x: 0, y: 0.05, z: 0 },
};

export const MMD_PET_MODEL_HEIGHT = 2.55;
export const MMD_PET_BASE_POSITION_Y = -0.25;
```

- `PerspectiveCamera(30, ...)`：数字越大，视野越广，模型看起来越小。
- `camera.position.z = 4.8`：越大，相机离模型越远，模型越小，更容易看到全身。
- `camera.position.y` 和 `camera.lookAt(... y ...)`：控制镜头看向模型的高度。
- `MMD_PET_MODEL_HEIGHT`：这是模型归一化高度。数字越大，模型越大。
- `MMD_PET_BASE_POSITION_Y`：整体上下移动模型。

再看 `src/styles.css`：

```css
.pet {
  right: 34px;
  bottom: 4px;
  width: 260px;
  height: 300px;
}

.pet-model {
  inset: 0 0 18px;
}
```

- `.pet` 的 `width` / `height` 是模型 canvas 的外框大小。
- `.pet` 的 `right` / `bottom` 是模型在窗口里的位置。
- `.pet-model inset` 会影响 canvas 在外框中的留白。

如果下身被挡，优先按这个顺序调：

1. 增大 `.pet` 的 `height`。
2. 把 `camera.position.z` 调大一点。
3. 把 `MMD_PET_MODEL_HEIGHT` 调小一点。
4. 微调 `MMD_PET_BASE_POSITION_Y`。

## 5. 模型颜色发白或不够鲜艳怎么调

当前不再直接压暗材质，而是在 CSS 里增强 canvas：

```css
.pet-model {
  filter: saturate(1.6) contrast(1.16) brightness(1.04);
}
```

- `saturate(1.6)`：饱和度，越大颜色越鲜艳。
- `contrast(1.16)`：对比度，越大明暗差越强。
- `brightness(1.04)`：整体亮度，少量增加可以避免模型显得灰。

灯光在 `src/lib/mmdPetConfig.ts`：

```ts
export const MMD_PET_LIGHTS = {
  ambient: { color: "#ffffff", intensity: 0.62 },
  key: { color: "#fff8ee", intensity: 0.72 },
  fill: { color: "#ffe4f2", intensity: 0.46 },
};
```

- `ambient` 是整体环境光，太高会发白。
- `keyLight` 是主光。
- `fillLight` 是补光，可以带一点粉色或暖色，让角色不那么灰。

如果想更鲜艳，先调 CSS 的 `saturate`。如果想减少发白，再微降 `ambient`，不要直接把模型材质颜色乘小，否则会变暗。

## 5.1. 模型为什么会糊，怎么调清晰

灯光主要影响明暗，不直接决定清晰度。当前这个 PMX 模型在网页里由 Three.js 渲染到 canvas，再由 CSS 缩放显示；如果 canvas 内部分辨率不够、纹理采样偏软，或者模型在画布里占用的像素太少，看起来就会比 Blender 里糊。

清晰度相关的入口在 `src/lib/mmdPetConfig.ts`：

```ts
export const MMD_PET_RENDERING = {
  pixelRatioMultiplier: 1.75,
  maxPixelRatio: 3,
  textureAnisotropy: 8,
} as const;
```

- `pixelRatioMultiplier`：提高 WebGL 实际渲染分辨率。越高越清晰，但显卡开销也越大。
- `maxPixelRatio`：限制最高渲染倍率，避免高分屏上过度吃资源。
- `textureAnisotropy`：改善贴图在缩放和倾斜角度下的采样质量。

`MmdPetModel.tsx` 里还会在模型加载后给贴图设置 anisotropy。以后如果继续觉得糊，优先按这个顺序调：

1. 把 `pixelRatioMultiplier` 从 `1.75` 调到 `2`。
2. 把 `.pet` 的 `width` / `height` 稍微增大，让模型有更多屏幕像素。
3. 微调 `.pet-model` 的 `filter`，不要把 `saturate` 和 `brightness` 拉太高，否则边缘会显得发白。

Blender 里看起来更清晰，通常还因为视口显示尺寸更大、材质预览和抗锯齿策略不同、骨骼线和网格边缘提供了额外视觉参照。网页里现在偏 2D 的感觉，主要来自 MMDLoader/Three.js 对 MMD toon 材质的转换；这能减轻“太 3D、太硬”的感觉，但清晰度要靠渲染分辨率和贴图采样来补。

## 6. 模型代码和交互代码怎么分工

当前结构是：

```tsx
<button className="pet interactive-surface ...">
  <MmdPetModel petState={petState} />
  <span className="pet-shadow" />
</button>
```

也就是说：

- `Pet.tsx` 只管桌宠交互。
- `MmdPetModel.tsx` 只管真实模型。
- `.pet` 只提供模型外框和拖动区域。
- MMD 状态动作统一在 `MmdPetModel.tsx` 的 `getMmdMotionFrame()` 里，不再通过 `.pet-happy`、`.pet-talking` 这类 CSS class 驱动。
- 思考时的 `...`、睡觉时的 `Zzz` 是 `.mmd-status-cue`，属于 MMD 渲染层旁边的状态提示。

以后要做模型功能，优先改 `MmdPetModel.tsx` 和 `mmdPetConfig.ts`；点击、右键、拖动、开聊天窗口这类交互逻辑仍然留在 `Pet.tsx` 和 `tauri.ts`。

## 6.1. 以后怎么做真正的表情和动作

当前 `idle`、`thinking`、`talking`、`happy`、`sleeping` 还只是轻量动作：整体上下浮动、左右转头、说话时轻微缩放、开心时小跳。这些动作都在 `getMmdMotionFrame()` 里，只移动整个 `modelRoot`，没有直接控制骨骼、表情 morph 或 VMD 动作。

如果后续想让模型不再像默认站姿那样双手撑开，需要进入 MMD 专属动作层：

- 表情：读取 PMX 里的 morph targets，例如眨眼、笑、害羞、嘴型。
- 姿势：用 VPD pose 或手动设置骨骼旋转，让手臂、头、身体有固定姿态。
- 动作：加载 VMD 动作文件，用 `MMDAnimationHelper` 播放 idle、thinking、talking 等状态动画。

比较稳的下一步是新建一个 MMD action 层，例如 `src/lib/mmdActions.ts`，把状态映射成“根节点轻量动作 + 表情 morph + 可选 VMD/VPD”。这样以后扩展动作时不会污染 `Pet.tsx` 的点击/拖动逻辑。

## 7. 透明背景为什么会挡点击

Tauri 的透明窗口本质上还是一个矩形窗口。即使背景看起来透明，这个矩形也可能挡住下面应用的鼠标点击。

不要在当前结构里自动调用 `setIgnoreCursorEvents(true)`。原因是：一旦整个窗口进入“忽略鼠标事件”，窗口自己也收不到后续鼠标移动或点击，代码就没有机会自动切回可交互状态，结果会变成桌宠左右键都点不了。

当前实现先保证桌宠可点击、可拖动、可右键。聊天已经拆成独立窗口，桌宠主窗口也缩小了，透明矩形挡点击的问题会比单窗口方案轻很多。剩下的问题后续更适合用这些方案之一处理：

- 缩小 Tauri 窗口尺寸，让窗口矩形尽量贴近模型和聊天框。
- 把桌宠和聊天框拆成两个窗口，分别控制包围盒。
- 做一个显式“点击穿透模式”开关，并提供键盘快捷键或托盘入口恢复交互。

点击穿透是桌面端能力，普通浏览器预览不能完整验证。

## 8. 开发和验证命令

前端构建：

```powershell
pnpm build
```

桌面 debug 构建：

```powershell
pnpm tauri build --debug --no-bundle
```

启动桌面应用：

```powershell
pnpm tauri:dev
```

只看前端页面：

```powershell
pnpm dev
```

如果 `pnpm tauri build --debug --no-bundle` 报 `failed to remove ... baicai.exe`，通常是旧的 `baicai.exe` 还在运行，关掉应用后重试即可。
