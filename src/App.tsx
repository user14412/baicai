import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { ContextMenu } from "./components/ContextMenu";
import { Pet } from "./components/Pet";
import { useChat } from "./hooks/useChat";
import { usePetState } from "./hooks/usePetState";
import { useSettings } from "./hooks/useSettings";
import {
  applyAlwaysOnTop,
  closeCurrentWindow,
  isChatWindowMode,
  listenWindowMoves,
  listenMainPetState,
  notifyMainPetState,
  openChatWindow,
  restoreWindowPosition,
} from "./lib/tauri";
import {
  clearMessages,
  clearWindowPosition,
  loadWindowPosition,
  saveWindowPosition,
} from "./lib/storage";
import type { PetState } from "./lib/types";

type MenuPosition = {
  x: number;
  y: number;
};

function App() {
  return isChatWindowMode() ? <ChatWindowApp /> : <PetWindowApp />;
}

function PetWindowApp() {
  const { settings, saveSettings } = useSettings();
  const { petState, setPetState, setTemporaryState } = usePetState();
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [isPreviewChatOpen, setIsPreviewChatOpen] = useState(false);

  useEffect(() => {
    void applyAlwaysOnTop(settings.alwaysOnTop);
  }, [settings.alwaysOnTop]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let isDisposed = false;

    void listenMainPetState((nextPetState) => {
      setPetState(nextPetState);
    }).then((nextUnlisten) => {
      if (isDisposed) {
        nextUnlisten?.();
        return;
      }

      unlisten = nextUnlisten;
    });

    return () => {
      isDisposed = true;
      unlisten?.();
    };
  }, [setPetState]);

  useEffect(() => {
    const openPreviewChat = () => setIsPreviewChatOpen(true);
    window.addEventListener("baicai:open-chat-preview", openPreviewChat);
    return () => {
      window.removeEventListener("baicai:open-chat-preview", openPreviewChat);
    };
  }, []);

  useEffect(() => {
    let saveTimer: number | null = null;
    let unlisten: (() => void) | null = null;
    let isDisposed = false;

    void restoreWindowPosition(loadWindowPosition()).then((isStoredPositionValid) => {
      if (!isStoredPositionValid) {
        clearWindowPosition();
      }
    });

    void listenWindowMoves((position) => {
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer);
      }

      saveTimer = window.setTimeout(() => {
        saveWindowPosition(position);
      }, 250);
    }).then((nextUnlisten) => {
      if (isDisposed) {
        nextUnlisten?.();
        return;
      }

      unlisten = nextUnlisten;
    });

    return () => {
      isDisposed = true;
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer);
      }
      unlisten?.();
    };
  }, []);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
  }, []);

  const openChat = useCallback(() => {
    void openChatWindow();
    if (petState === "idle" || petState === "happy") {
      setTemporaryState("happy", 900);
    }
  }, [petState, setTemporaryState]);

  const toggleChat = useCallback(() => {
    void openChatWindow();
    closeMenu();
  }, [closeMenu]);

  const toggleSleep = useCallback(() => {
    setPetState((current) => (current === "sleeping" ? "idle" : "sleeping"));
    closeMenu();
  }, [closeMenu, setPetState]);

  const handleClearChat = useCallback(() => {
    clearMessages();
    closeMenu();
  }, [closeMenu]);

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
        {isPreviewChatOpen ? (
          <ChatPanel
            isLoading={false}
            messages={[]}
            onClear={clearMessages}
            onClose={() => setIsPreviewChatOpen(false)}
            onSend={() => {}}
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
          isChatOpen={isPreviewChatOpen}
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

function ChatWindowApp() {
  const { settings, saveSettings } = useSettings();
  const { setPetState } = usePetState();
  const setSharedPetState = useMemo<Dispatch<SetStateAction<PetState>>>(
    () => (action) => {
      setPetState((current) => {
        const nextPetState =
          typeof action === "function"
            ? (action as (current: PetState) => PetState)(current)
            : action;

        void notifyMainPetState(nextPetState);
        return nextPetState;
      });
    },
    [setPetState],
  );
  const { messages, isLoading, sendMessage, clearChat } = useChat(
    settings,
    setSharedPetState,
  );

  useEffect(() => {
    return () => {
      void notifyMainPetState("idle");
    };
  }, []);

  return (
    <main className="chat-window-app">
      <ChatPanel
        isLoading={isLoading}
        messages={messages}
        onClear={clearChat}
        onClose={() => {
          void notifyMainPetState("idle");
          void closeCurrentWindow();
        }}
        onSend={sendMessage}
        onSettingsSave={saveSettings}
        settings={settings}
      />
    </main>
  );
}

export default App;
