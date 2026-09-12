"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { animate } from "animejs";

const THRESHOLD = 420;

export function LandingScrollTop() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const shown = useRef(false);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    btn.hidden = true;
    btn.style.opacity = "0";

    function toggle() {
      const show = window.scrollY > THRESHOLD;
      if (show === shown.current || !btn) return;
      shown.current = show;
      if (show) btn.hidden = false;
      if (reduce) {
        btn.style.opacity = show ? "1" : "0";
        if (!show) btn.hidden = true;
        return;
      }
      animate(btn, {
        opacity: show ? [0, 1] : [1, 0],
        y: show ? [16, 0] : [0, 16],
        rotate: show ? [-8, 0] : [0, 8],
        duration: 420,
        ease: "out(3)",
        onComplete: () => {
          if (!show) btn.hidden = true;
        },
      });
    }

    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  function goUp() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scroller = document.scrollingElement ?? document.documentElement;
    if (reduce) {
      scroller.scrollTop = 0;
      return;
    }
    animate(scroller, {
      scrollTop: 0,
      duration: 920,
      ease: "inOut(3)",
    });
  }

  return (
    <button
      ref={btnRef}
      type="button"
      className="nv-land-top"
      hidden
      onClick={goUp}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
