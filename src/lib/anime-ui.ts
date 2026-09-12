"use client";

import { animate } from "animejs";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from "react";

export const SIDEBAR_WIDTH = 260;

export type AnimeKind =
  | "page"
  | "overlay"
  | "modal"
  | "dropdown"
  | "toast"
  | "fade"
  | "pop"
  | "slot"
  | "drawer";

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const PRESETS: Record<AnimeKind, { enter: Record<string, unknown>; exit: Record<string, unknown> }> = {
  page: {
    enter: { opacity: [0, 1], y: [8, 0], duration: 380, ease: "out(3)" },
    exit: { opacity: [1, 0], y: [0, -6], duration: 220, ease: "in(2)" },
  },
  overlay: {
    enter: { opacity: [0, 1], duration: 220, ease: "out(2)" },
    exit: { opacity: [1, 0], duration: 180, ease: "in(2)" },
  },
  modal: {
    enter: { opacity: [0, 1], y: [16, 0], scale: [0.97, 1], duration: 420, ease: "out(3)" },
    exit: { opacity: [1, 0], y: [0, 10], scale: [1, 0.98], duration: 240, ease: "in(2)" },
  },
  dropdown: {
    enter: { opacity: [0, 1], y: [-6, 0], scale: [0.96, 1], duration: 280, ease: "out(3)" },
    exit: { opacity: [1, 0], y: [0, -4], duration: 180, ease: "in(2)" },
  },
  toast: {
    enter: { opacity: [0, 1], y: [12, 0], scale: [0.96, 1], duration: 360, ease: "out(3)" },
    exit: { opacity: [1, 0], y: [8, 0], duration: 220, ease: "in(2)" },
  },
  fade: {
    enter: { opacity: [0, 1], duration: 220, ease: "out(2)" },
    exit: { opacity: [1, 0], duration: 160, ease: "in(2)" },
  },
  pop: {
    enter: { opacity: [0, 1], x: [-10, 0], scale: [0.9, 1], duration: 320, ease: "out(3)" },
    exit: { opacity: [1, 0], x: [-8, 0], scale: [0.92, 1], duration: 200, ease: "in(2)" },
  },
  slot: {
    enter: { width: [0, SIDEBAR_WIDTH], duration: 420, ease: "out(3)" },
    exit: { width: [SIDEBAR_WIDTH, 0], duration: 320, ease: "in(2)" },
  },
  drawer: {
    enter: { x: ["-105%", "0%"], duration: 420, ease: "out(3)" },
    exit: { x: ["0%", "-105%"], duration: 320, ease: "in(2)" },
  },
};

export function playAnime(el: Element, kind: AnimeKind, dir: "enter" | "exit") {
  if (reducedMotion()) {
    if (el instanceof HTMLElement) {
      el.style.opacity = dir === "exit" ? "0" : "1";
      el.style.transform = "none";
    }
    return Promise.resolve();
  }
  return animate(el, PRESETS[kind][dir]);
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else ref.current = value;
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) assignRef(ref, node);
  };
}

export function useAnimeEnter<T extends HTMLElement = HTMLElement>(
  kind: AnimeKind = "page",
  replayKey?: string | number,
) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    void playAnime(el, kind, "enter");
  }, [kind, replayKey]);
  return ref;
}

export function useAnimePresence<T extends HTMLElement = HTMLElement>(
  show: boolean,
  kind: AnimeKind = "fade",
) {
  const ref = useRef<T>(null);
  const [mounted, setMounted] = useState(show);
  const showRef = useRef(show);
  showRef.current = show;

  useEffect(() => {
    if (show) {
      setMounted(true);
      return;
    }
    const el = ref.current;
    if (!el) {
      setMounted(false);
      return;
    }
    let alive = true;
    void Promise.resolve(playAnime(el, kind, "exit")).finally(() => {
      if (alive && !showRef.current) setMounted(false);
    });
    return () => {
      alive = false;
    };
  }, [show, kind]);

  useLayoutEffect(() => {
    if (!mounted || !show) return;
    const el = ref.current;
    if (el) void playAnime(el, kind, "enter");
  }, [mounted, show, kind]);

  return { ref, mounted };
}

export function AnimePresence({
  show,
  kind = "fade",
  children,
}: {
  show: boolean;
  kind?: AnimeKind;
  children: ReactElement<{ ref?: Ref<HTMLElement> }>;
}) {
  const { ref, mounted } = useAnimePresence(show, kind);
  if (!mounted || !isValidElement(children)) return null;
  return cloneElement(children, {
    ref: mergeRefs(ref, children.props.ref),
  });
}
