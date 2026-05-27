import { DEFAULT_SETTINGS, MAX_STORED_MESSAGES, STORAGE_KEYS } from "./constants";
import type { ChatMessage, Settings, WindowPosition } from "./types";

function safeParse<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function loadSettings(): Settings {
  if (!canUseLocalStorage()) {
    return DEFAULT_SETTINGS;
  }

  const stored = safeParse<Partial<Settings>>(
    window.localStorage.getItem(STORAGE_KEYS.settings),
  );

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
  };
}

export function saveSettings(settings: Settings) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function loadMessages(): ChatMessage[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  const stored = safeParse<ChatMessage[]>(
    window.localStorage.getItem(STORAGE_KEYS.messages),
  );

  if (!Array.isArray(stored)) {
    return [];
  }

  return stored
    .filter(
      (message) =>
        message &&
        typeof message.id === "string" &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        typeof message.createdAt === "number",
    )
    .slice(-MAX_STORED_MESSAGES);
}

export function saveMessages(messages: ChatMessage[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  if (messages.length === 0) {
    clearMessages();
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.messages,
    JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
  );
}

export function clearMessages() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.messages);
}

function isWindowPosition(value: unknown): value is WindowPosition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const position = value as WindowPosition;
  return Number.isFinite(position.x) && Number.isFinite(position.y);
}

export function loadWindowPosition(): WindowPosition | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const stored = safeParse<unknown>(
    window.localStorage.getItem(STORAGE_KEYS.windowPosition),
  );

  return isWindowPosition(stored) ? stored : null;
}

export function saveWindowPosition(position: WindowPosition) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.windowPosition,
    JSON.stringify(position),
  );
}

export function clearWindowPosition() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.windowPosition);
}
