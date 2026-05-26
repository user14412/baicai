import { useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { startWindowDrag } from "../lib/tauri";
import type { PetState } from "../lib/types";

type PetProps = {
  petName: string;
  petState: PetState;
  onClick: () => void;
  onContextMenu: (position: { x: number; y: number }) => void;
};

type PointerSnapshot = {
  x: number;
  y: number;
  time: number;
  moved: boolean;
};

export function Pet({
  petName,
  petState,
  onClick,
  onContextMenu,
}: PetProps) {
  const pointerRef = useRef<PointerSnapshot | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    pointerRef.current = {
      x: event.screenX,
      y: event.screenY,
      time: Date.now(),
      moved: false,
    };

    void startWindowDrag();
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const snapshot = pointerRef.current;
    if (!snapshot) {
      return;
    }

    const distance = Math.hypot(
      event.screenX - snapshot.x,
      event.screenY - snapshot.y,
    );
    if (distance > 4) {
      snapshot.moved = true;
    }
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const snapshot = pointerRef.current;
    const elapsed = snapshot ? Date.now() - snapshot.time : 0;
    const wasDrag = Boolean(snapshot?.moved) || elapsed > 180;

    pointerRef.current = null;

    if (wasDrag) {
      event.preventDefault();
      return;
    }

    onClick();
  };

  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onContextMenu({ x: event.clientX, y: event.clientY });
  };

  return (
    <button
      aria-label={`${petName} desktop pet`}
      className={`pet pet-${petState}`}
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <span className="pet-effects" aria-hidden="true">
        {petState === "thinking" ? (
          <span className="thinking-dots">
            <span />
            <span />
            <span />
          </span>
        ) : null}
        {petState === "sleeping" ? <span className="sleep-label">Zzz</span> : null}
      </span>

      <span className="pet-body">
        <span className="pet-leaf pet-leaf-left" />
        <span className="pet-leaf pet-leaf-right" />
        <span className="pet-ear pet-ear-left" />
        <span className="pet-ear pet-ear-right" />
        <span className="pet-face">
          <span className="pet-eye pet-eye-left" />
          <span className="pet-eye pet-eye-right" />
          <span className="pet-mouth" />
        </span>
        <span className="pet-cheek pet-cheek-left" />
        <span className="pet-cheek pet-cheek-right" />
      </span>

      <span className="pet-shadow" />
    </button>
  );
}
