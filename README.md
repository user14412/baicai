# baicai

Windows desktop pet MVP built with Tauri 2, React, TypeScript, Vite, and pnpm.

## Run

```powershell
pnpm install
pnpm tauri:dev
```

Frontend-only preview:

```powershell
pnpm dev
```

Open `http://127.0.0.1:1420`.

## Build Check

```powershell
pnpm build
pnpm tauri build --debug --no-bundle
```

## MVP

- Transparent, borderless, always-on-top 360x460 Tauri window.
- CSS placeholder pet with idle, thinking, talking, happy, and sleeping states.
- Click pet to open chat, drag pet to move the window, right-click for menu.
- Chat panel, message bubbles, settings panel, clear conversation.
- OpenAI-compatible Chat Completions API wrapper.
- Settings and recent 20 messages saved in localStorage.
