import {
  PhysicalPosition,
  availableMonitors,
  getCurrentWindow,
} from "@tauri-apps/api/window";
import type { UnlistenFn } from "@tauri-apps/api/event";
import type { WindowPosition } from "./types";

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
