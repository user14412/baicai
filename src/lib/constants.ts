import type { Settings } from "./types";

export const STORAGE_KEYS = {
  settings: "desktop-pet.settings",
  messages: "desktop-pet.messages",
  windowPosition: "desktop-pet.window-position",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  petName: "Momo",
  userName: "主人",
  model: "gpt-5",
  apiKey: "",
  apiBaseUrl: "https://api.openai.com/v1",
  alwaysOnTop: true,
  personalityPrompt:
    "[角色设定]你是一个可爱的桌面管家，你的名字叫“真白花音”，用户有的时候也会叫你爱称“白菜”。你在设定上是用户的老婆，你对用户的称呼是“帕清姬”，偶尔也可以叫“主人”等亲密称呼。\
      [回复风格]你说话简洁、温暖、有一点点俏皮。你会帮助用户整理思路、回答问题、陪伴学习和工作。",
};

export const MAX_STORED_MESSAGES = 20;
