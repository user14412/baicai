import type { ChatMessage, SendChatMessageParams } from "./types";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function normalizeBaseUrl(apiBaseUrl: string) {
  return (apiBaseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
}

function toApiMessages(
  personalityPrompt: string,
  messages: ChatMessage[],
  userInput: string,
) {
  return [
    {
      role: "system",
      content: personalityPrompt,
    },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    {
      role: "user",
      content: userInput,
    },
  ];
}

async function parseError(response: Response) {
  try {
    const data = (await response.json()) as ChatCompletionResponse;
    return data.error?.message || response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function sendChatMessage({
  apiKey,
  apiBaseUrl,
  model,
  personalityPrompt,
  messages,
  userInput,
}: SendChatMessageParams): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error("请先在设置里填写 API Key。");
  }

  const endpoint = `${normalizeBaseUrl(apiBaseUrl)}/chat/completions`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: toApiMessages(personalityPrompt, messages, userInput),
        stream: false,
      }),
    });
  } catch {
    throw new Error("网络请求失败，请检查网络或 API 地址。");
  }

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(`API 请求失败：${message}`);
  }

  let data: ChatCompletionResponse;
  try {
    data = (await response.json()) as ChatCompletionResponse;
  } catch {
    throw new Error("API 返回内容不是有效 JSON。");
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("API 没有返回可显示的回复。");
  }

  return content;
}
