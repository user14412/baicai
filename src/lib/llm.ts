import type {
  ChatMessage,
  SendChatMessageParams,
  StreamChatMessageParams,
} from "./types";

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

type ChatCompletionStreamChunk = {
  choices?: Array<{
    delta?: {
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

function toApiMessages(personalityPrompt: string, messages: ChatMessage[]) {
  return [
    {
      role: "system",
      content: personalityPrompt,
    },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
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

function parseStreamLine(line: string) {
  if (!line.startsWith("data:")) {
    return null;
  }

  const data = line.slice("data:".length).trim();
  if (!data || data === "[DONE]") {
    return null;
  }

  try {
    return JSON.parse(data) as ChatCompletionStreamChunk;
  } catch {
    throw new Error("API 流式返回内容不是有效 JSON。");
  }
}

export async function sendChatMessage({
  apiKey,
  apiBaseUrl,
  model,
  personalityPrompt,
  messages,
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
        messages: toApiMessages(personalityPrompt, messages),
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

export async function streamChatMessage({
  apiKey,
  apiBaseUrl,
  model,
  personalityPrompt,
  messages,
  onToken,
}: StreamChatMessageParams): Promise<string> {
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
        messages: toApiMessages(personalityPrompt, messages),
        stream: true,
      }),
    });
  } catch {
    throw new Error("网络请求失败，请检查网络或 API 地址。");
  }

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(`API 请求失败：${message}`);
  }

  if (!response.body) {
    throw new Error("当前环境不支持读取 API 流式回复。");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      const lines = buffer.split(/\r?\n/);
      buffer = done ? "" : lines.pop() ?? "";

      for (const line of lines) {
        const chunk = parseStreamLine(line.trim());
        if (!chunk) {
          continue;
        }

        if (chunk.error?.message) {
          throw new Error(`API 请求失败：${chunk.error.message}`);
        }

        const token = chunk.choices?.[0]?.delta?.content;
        if (!token) {
          continue;
        }

        content += token;
        onToken(token);
      }

      if (done) {
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  const finalContent = content.trim();
  if (!finalContent) {
    throw new Error("API 没有返回可显示的回复。");
  }

  return finalContent;
}
