import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { streamChatMessage } from "../lib/llm";
import {
  clearMessages as clearStoredMessages,
  loadMessages,
  saveMessages,
} from "../lib/storage";
import type { ChatMessage, PetState, Settings } from "../lib/types";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: Date.now(),
  };
}

export function useChat(
  settings: Settings,
  setPetState: Dispatch<SetStateAction<PetState>>,
) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    clearStoredMessages();
  }, []);

  const sendMessage = useCallback(
    async (input: string) => {
      const userInput = input.trim();
      if (!userInput || isLoading) {
        return;
      }

      const userMessage = createMessage("user", userInput);
      const nextMessages = [...messages, userMessage].slice(-20);
      const assistantMessage = createMessage("assistant", "正在思考...");

      setMessages([...nextMessages, assistantMessage].slice(-20));
      setIsLoading(true);
      setPetState("thinking");

      try {
        let reply = "";
        let hasToken = false;

        await streamChatMessage({
          apiKey: settings.apiKey,
          apiBaseUrl: settings.apiBaseUrl,
          model: settings.model,
          personalityPrompt: settings.personalityPrompt,
          messages: nextMessages,
          onToken: (token) => {
            reply += token;

            if (!hasToken) {
              hasToken = true;
              setPetState("talking");
            }

            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: reply }
                  : message,
              ),
            );
          },
        });

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: reply.trim() }
              : message,
          ),
        );
        setPetState("happy");

        window.setTimeout(() => {
          setPetState((current) => (current === "happy" ? "idle" : current));
        }, 1000);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "发送失败，请稍后再试。";
        setMessages((current) =>
          current.map((chatMessage) =>
            chatMessage.id === assistantMessage.id
              ? { ...chatMessage, content: `出错了：${message}` }
              : chatMessage,
          ),
        );
        setPetState("idle");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, setPetState, settings],
  );

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
}
