import type { Settings } from "./types";

export const STORAGE_KEYS = {
  settings: "desktop-pet.settings",
  messages: "desktop-pet.messages",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  petName: "Momo",
  userName: "主人",
  model: "gpt-5",
  apiKey: "",
  apiBaseUrl: "https://api.openai.com/v1",
  alwaysOnTop: true,
  personalityPrompt:
    "你是一个可爱的桌面管家。你说话简洁、温暖、有一点点俏皮。你会帮助用户整理思路、回答问题、陪伴学习和工作。",
};

export const MAX_STORED_MESSAGES = 20;
