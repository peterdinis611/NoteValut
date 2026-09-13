"use client";

import { useRef, type TouchEvent } from "react";

type SwipeHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
};

/** Minimal horizontal swipe detector for mobile list rows. */
export function useSwipeActions({ onSwipeLeft, onSwipeRight, threshold = 56 }: SwipeHandlers) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.changedTouches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
    },
    onTouchEnd: (e: TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      startX.current = null;
      startY.current = null;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
  };
}
