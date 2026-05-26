import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { ContextMenu } from "./components/ContextMenu";
import { Pet } from "./components/Pet";
import { useChat } from "./hooks/useChat";
import { usePetState } from "./hooks/usePetState";
import { useSettings } from "./hooks/useSettings";
import { applyAlwaysOnTop, closeCurrentWindow } from "./lib/tauri";

type MenuPosition = {
  x: number;
  y: number;
};

function App() {
  const { settings, saveSettings } = useSettings();
  const { petState, setPetState, setTemporaryState } = usePetState();
  const { messages, isLoading, sendMessage, clearChat } = useChat(
    settings,
    setPetState,
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  useEffect(() => {
    void applyAlwaysOnTop(settings.alwaysOnTop);
  }, [settings.alwaysOnTop]);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
  }, []);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
    if (petState === "idle" || petState === "happy") {
      setTemporaryState("happy", 900);
    }
  }, [petState, setTemporaryState]);

  const toggleChat = useCallback(() => {
    setIsChatOpen((current) => !current);
    closeMenu();
  }, [closeMenu]);

  const toggleSleep = useCallback(() => {
    setPetState((current) => (current === "sleeping" ? "idle" : "sleeping"));
    closeMenu();
  }, [closeMenu, setPetState]);

  const handleClearChat = useCallback(() => {
    clearChat();
    closeMenu();
  }, [clearChat, closeMenu]);

  const handleContextMenu = useCallback((position: MenuPosition) => {
    setMenuPosition(position);
  }, []);

  const handleExit = useCallback(() => {
    closeMenu();
    void closeCurrentWindow();
  }, [closeMenu]);

  return (
    <main className="app" onClick={closeMenu}>
      <section className="stage" aria-label="baicai desktop pet">
        {isChatOpen ? (
          <ChatPanel
            isLoading={isLoading}
            messages={messages}
            onClear={clearChat}
            onClose={() => setIsChatOpen(false)}
            onSend={sendMessage}
            onSettingsSave={saveSettings}
            settings={settings}
          />
        ) : null}

        <Pet
          petName={settings.petName}
          petState={petState}
          onClick={openChat}
          onContextMenu={handleContextMenu}
        />
      </section>

      {menuPosition ? (
        <ContextMenu
          isChatOpen={isChatOpen}
          isSleeping={petState === "sleeping"}
          position={menuPosition}
          onClearChat={handleClearChat}
          onClose={closeMenu}
          onExit={handleExit}
          onToggleChat={toggleChat}
          onToggleSleep={toggleSleep}
        />
      ) : null}
    </main>
  );
}

export default App;
