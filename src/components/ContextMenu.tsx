type ContextMenuProps = {
  position: {
    x: number;
    y: number;
  };
  isChatOpen: boolean;
  isSleeping: boolean;
  onToggleChat: () => void;
  onToggleSleep: () => void;
  onClearChat: () => void;
  onExit: () => void;
  onClose: () => void;
};

export function ContextMenu({
  position,
  isChatOpen,
  isSleeping,
  onToggleChat,
  onToggleSleep,
  onClearChat,
  onExit,
  onClose,
}: ContextMenuProps) {
  const left =
    typeof window === "undefined"
      ? position.x
      : Math.min(position.x, window.innerWidth - 132);
  const top =
    typeof window === "undefined"
      ? position.y
      : Math.min(position.y, window.innerHeight - 132);

  return (
    <menu
      className="context-menu"
      style={{
        left: Math.max(6, left),
        top: Math.max(6, top),
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button type="button" onClick={onToggleChat}>
        {isChatOpen ? "关闭聊天" : "打开聊天"}
      </button>
      <button type="button" onClick={onToggleSleep}>
        {isSleeping ? "唤醒" : "睡觉"}
      </button>
      <button type="button" onClick={onClearChat}>
        清空对话
      </button>
      <button type="button" onClick={onExit}>
        退出应用
      </button>
    </menu>
  );
}
