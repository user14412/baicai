import {
  PhysicalPosition,
  availableMonitors,
  getCurrentWindow,
} from "@tauri-apps/api/window";
import { emitTo, listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { UnlistenFn } from "@tauri-apps/api/event";
import type { PetState, WindowPosition } from "./types";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

function isTauriRuntime() {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
}

export function isChatWindowMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("window") === "chat";
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

export async function openChatWindow() {
  if (!isTauriRuntime()) {
    window.dispatchEvent(new CustomEvent("baicai:open-chat-preview"));
    return;
  }

  const existing = await WebviewWindow.getByLabel("chat");
  if (existing) {
    await existing.show();
    await existing.setFocus();
    return;
  }

  const chatUrl = new URL(window.location.href);
  chatUrl.search = "?window=chat";
  chatUrl.hash = "";

  const chatWindow = new WebviewWindow("chat", {
    url: chatUrl.toString(),
    title: "baicai chat",
    width: 720,
    height: 640,
    minWidth: 520,
    minHeight: 460,
    center: true,
    decorations: true,
    transparent: false,
    resizable: true,
    alwaysOnTop: false,
    focus: true,
  });

  chatWindow.once("tauri://error", (event) => {
    console.warn("Failed to create chat window", event.payload);
  });
}

export async function notifyMainPetState(petState: PetState) {
  if (!isTauriRuntime()) {
    return;
  }

  try {
    await emitTo("main", "baicai://pet-state", petState);
  } catch (error) {
    console.warn("Failed to notify main pet state", error);
  }
}

export async function listenMainPetState(
  onPetState: (petState: PetState) => void,
): Promise<UnlistenFn | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  try {
    return await listen<PetState>("baicai://pet-state", ({ payload }) => {
      onPetState(payload);
    });
  } catch (error) {
    console.warn("Failed to listen for pet state", error);
    return null;
  }
}

async function isPositionInVisibleArea(position: WindowPosition) {
  const appWindow = getCurrentWindow();
  const [monitors, size] = await Promise.all([
    availableMonitors(),
    appWindow.outerSize(),
  ]);

  return monitors.some((monitor) => {
    const area = monitor.workArea;
    const left = area.position.x;
    const top = area.position.y;
    const right = left + area.size.width;
    const bottom = top + area.size.height;

    return (
      position.x >= left &&
      position.y >= top &&
      position.x + size.width <= right &&
      position.y + size.height <= bottom
    );
  });
}

export async function restoreWindowPosition(position: WindowPosition | null) {
  if (!isTauriRuntime() || !position) {
    return true;
  }

  try {
    const appWindow = getCurrentWindow();
    if (await isPositionInVisibleArea(position)) {
      await appWindow.setPosition(new PhysicalPosition(position.x, position.y));
      return true;
    }

    await appWindow.center();
    return false;
  } catch (error) {
    console.warn("Failed to restore window position", error);
    return true;
  }
}

export async function listenWindowMoves(
  onMove: (position: WindowPosition) => void,
): Promise<UnlistenFn | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  try {
    return await getCurrentWindow().onMoved(({ payload }) => {
      onMove({ x: payload.x, y: payload.y });
    });
  } catch (error) {
    console.warn("Failed to listen for window moves", error);
    return null;
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
