import { useCallback, useRef, useState } from "react";
import type { PetState } from "../lib/types";

export function usePetState() {
  const [petState, setPetState] = useState<PetState>("idle");
  const timerRef = useRef<number | null>(null);

  const setTemporaryState = useCallback((state: PetState, duration = 1200) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    setPetState(state);
    timerRef.current = window.setTimeout(() => {
      setPetState((current) => (current === state ? "idle" : current));
      timerRef.current = null;
    }, duration);
  }, []);

  return {
    petState,
    setPetState,
    setTemporaryState,
  };
}
