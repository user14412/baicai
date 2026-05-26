import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { sendChatMessage } from "../lib/llm";
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

      const previousMessages = messages;
      const userMessage = createMessage("user", userInput);

      setMessages((current) => [...current, userMessage].slice(-20));
      setIsLoading(true);
      setPetState("thinking");

      try {
        const reply = await sendChatMessage({
          apiKey: settings.apiKey,
          apiBaseUrl: settings.apiBaseUrl,
          model: settings.model,
          personalityPrompt: settings.personalityPrompt,
          messages: previousMessages,
          userInput,
        });

        const assistantMessage = createMessage("assistant", reply);
        setPetState("talking");
        setMessages((current) => [...current, assistantMessage].slice(-20));

        window.setTimeout(() => {
          setPetState((current) => (current === "talking" ? "happy" : current));
        }, 600);

        window.setTimeout(() => {
          setPetState((current) => (current === "happy" ? "idle" : current));
        }, 1600);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "发送失败，请稍后再试。";
        setMessages((current) =>
          [...current, createMessage("assistant", message)].slice(-20),
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
