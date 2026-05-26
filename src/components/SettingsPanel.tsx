import { useState } from "react";
import type { Settings } from "../lib/types";

type SettingsPanelProps = {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
};

export function SettingsPanel({
  settings,
  onSave,
  onClose,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<Settings>(settings);

  const updateDraft = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <section className="settings-backdrop">
      <form
        className="settings-panel"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <header className="settings-header">
          <strong>设置</strong>
          <button type="button" title="关闭" onClick={onClose}>
            ×
          </button>
        </header>

        <label>
          桌宠名字
          <input
            value={draft.petName}
            onChange={(event) => updateDraft("petName", event.target.value)}
          />
        </label>

        <label>
          你的称呼
          <input
            value={draft.userName}
            onChange={(event) => updateDraft("userName", event.target.value)}
          />
        </label>

        <label>
          模型
          <input
            value={draft.model}
            onChange={(event) => updateDraft("model", event.target.value)}
          />
        </label>

        <label>
          API 地址
          <input
            value={draft.apiBaseUrl}
            onChange={(event) => updateDraft("apiBaseUrl", event.target.value)}
          />
        </label>

        <label>
          API Key
          <input
            autoComplete="off"
            type="password"
            value={draft.apiKey}
            onChange={(event) => updateDraft("apiKey", event.target.value)}
          />
        </label>

        <label>
          性格设定
          <textarea
            rows={4}
            value={draft.personalityPrompt}
            onChange={(event) =>
              updateDraft("personalityPrompt", event.target.value)
            }
          />
        </label>

        <label className="toggle-row">
          <input
            checked={draft.alwaysOnTop}
            type="checkbox"
            onChange={(event) =>
              updateDraft("alwaysOnTop", event.target.checked)
            }
          />
          窗口置顶
        </label>

        <footer className="settings-actions">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="submit">保存</button>
        </footer>
      </form>
    </section>
  );
}
