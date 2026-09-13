"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimePresence } from "@/lib/anime-ui";

const THRESHOLD = 280;

function isScrollContainer(el: EventTarget | null): el is HTMLElement {
  return (
    el instanceof HTMLElement &&
    (el.classList.contains("note-scroll") || el.classList.contains("page-scroll"))
  );
}

type Props = {
  /** When this changes (e.g. note id), scroll the active pane to top. */
  resetKey?: string | null;
};

export function ScrollToTop({ resetKey }: Props) {
  const [visible, setVisible] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const main = document.querySelector(".app-main");
    if (!main) return;

    function onScroll(e: Event) {
      if (!isScrollContainer(e.target)) return;
      targetRef.current = e.target;
      setVisible(e.target.scrollTop > THRESHOLD);
    }

    main.addEventListener("scroll", onScroll, true);
    return () => main.removeEventListener("scroll", onScroll, true);
  }, []);

  useEffect(() => {
    const main = document.querySelector(".app-main");
    if (!main) return;
    const panes = main.querySelectorAll<HTMLElement>(".page-scroll, .note-scroll");
    panes.forEach((el) => {
      el.scrollTop = 0;
    });
    setVisible(false);
  }, [resetKey]);

  function scrollUp() {
    const el =
      targetRef.current ??
      document.querySelector<HTMLElement>(".app-main .page-scroll, .app-main .note-scroll");
    el?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AnimePresence show={visible} kind="pop">
        <button
          type="button"
          className="scroll-top-btn"
          onClick={scrollUp}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp className="size-4" />
        </button>
    </AnimePresence>
  );
}
