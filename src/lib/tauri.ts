import { getCurrentWindow } from "@tauri-apps/api/window";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

function isTauriRuntime() {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
}

export async function startWindowDrag() {
  if (!isTauriRuntime()) {
    return;
  }

  try {
    await getCurrentWindow().startDragging();
  } catch (error) {
    console.warn("Failed to start window drag", error);
  }
}

export async function applyAlwaysOnTop(alwaysOnTop: boolean) {
  if (!isTauriRuntime()) {
    return;
  }

  try {
    await getCurrentWindow().setAlwaysOnTop(alwaysOnTop);
  } catch (error) {
    console.warn("Failed to update always-on-top", error);
  }
}

export async function closeCurrentWindow() {
  if (!isTauriRuntime()) {
    window.close();
    return;
  }

  try {
    await getCurrentWindow().close();
  } catch (error) {
    console.warn("Failed to close window", error);
  }
}
