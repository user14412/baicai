import { useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { MmdPetModel } from "./MmdPetModel";
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
  dragStarted: boolean;
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
      dragStarted: false,
    };
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

    if (!snapshot.dragStarted && distance > 8) {
      snapshot.dragStarted = true;
      void startWindowDrag();
    }
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const snapshot = pointerRef.current;
    const elapsed = snapshot ? Date.now() - snapshot.time : 0;
    const wasDrag = Boolean(snapshot?.dragStarted) || elapsed > 350;

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
      className="pet interactive-surface"
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <MmdPetModel petState={petState} />

      <span className="pet-shadow" />
    </button>
  );
}
