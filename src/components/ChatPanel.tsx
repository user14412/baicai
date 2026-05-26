import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ChatBubble } from "./ChatBubble";
import { SettingsPanel } from "./SettingsPanel";
import type { ChatMessage, Settings } from "../lib/types";

type ChatPanelProps = {
  settings: Settings;
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (input: string) => void;
  onClose: () => void;
  onClear: () => void;
  onSettingsSave: (settings: Settings) => void;
};

export function ChatPanel({
  settings,
  messages,
  isLoading,
  onSend,
  onClose,
  onClear,
  onSettingsSave,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) {
      return;
    }

    onSend(input);
    setInput("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="chat-panel" onClick={(event) => event.stopPropagation()}>
      <header className="chat-header">
        <div>
          <strong>{settings.petName}</strong>
          <span>{settings.userName}</span>
        </div>
        <nav className="chat-actions" aria-label="Chat actions">
          <button type="button" title="设置" onClick={() => setIsSettingsOpen(true)}>
            ⚙
          </button>
          <button type="button" title="清空对话" onClick={onClear}>
            ⌫
          </button>
          <button type="button" title="关闭" onClick={onClose}>
            ×
          </button>
        </nav>
      </header>

      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 ? (
          <p className="empty-message">今天也在。</p>
        ) : null}
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {isLoading ? (
          <ChatBubble
            message={{
              role: "assistant",
              content: "输出中...",
            }}
          />
        ) : null}
      </div>

      <footer className="chat-input-row">
        <textarea
          aria-label="消息"
          disabled={isLoading}
          placeholder={`和 ${settings.petName} 说点什么`}
          rows={2}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button disabled={isLoading || !input.trim()} type="button" onClick={handleSubmit}>
          发送
        </button>
      </footer>

      {isSettingsOpen ? (
        <SettingsPanel
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={(nextSettings) => {
            onSettingsSave(nextSettings);
            setIsSettingsOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}
