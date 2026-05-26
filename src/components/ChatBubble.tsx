import type { ChatMessage } from "../lib/types";

type ChatBubbleProps = {
  message: Pick<ChatMessage, "role" | "content">;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  return (
    <article className={`chat-bubble chat-bubble-${message.role}`}>
      {message.content}
    </article>
  );
}
