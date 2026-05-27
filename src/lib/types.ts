export type PetState = "idle" | "thinking" | "talking" | "happy" | "sleeping";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type Settings = {
  petName: string;
  userName: string;
  personalityPrompt: string;
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  alwaysOnTop: boolean;
};

export type WindowPosition = {
  x: number;
  y: number;
};

export type SendChatMessageParams = {
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  personalityPrompt: string;
  messages: ChatMessage[];
};

export type StreamChatMessageParams = SendChatMessageParams & {
  onToken: (token: string) => void;
};
