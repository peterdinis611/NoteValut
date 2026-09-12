"use client";

import { animate, createScope, createTimeline, stagger } from "animejs";

export function playFolioPageMotion(root: HTMLElement) {
  const scope = createScope({
    root,
    mediaQueries: {
      reduce: "(prefers-reduced-motion: reduce)",
    },
  });

  scope.add((self) => {
    if (self.matches.reduce) {
      root.classList.remove("nv-folio-motion");
      return;
    }

    root.classList.add("nv-folio-motion");

    const tl = createTimeline({ defaults: { ease: "out(3)" } });

    tl.add(".nv-folio-await", {
      opacity: [0, 1],
      y: [18, 0],
      duration: 720,
      delay: stagger(70),
    });

    const orders = root.querySelectorAll<HTMLElement>(".nv-folio-btn, .status-btn-primary, .vault-btn-primary");
    const onEnter = (e: Event) => {
      animate(e.currentTarget as HTMLElement, { y: -3, duration: 240, ease: "out(3)" });
    };
    const onLeave = (e: Event) => {
      animate(e.currentTarget as HTMLElement, { y: 0, duration: 260, ease: "out(3)" });
    };
    orders.forEach((btn) => {
      btn.addEventListener("pointerenter", onEnter);
      btn.addEventListener("pointerleave", onLeave);
    });

    return () => {
      orders.forEach((btn) => {
        btn.removeEventListener("pointerenter", onEnter);
        btn.removeEventListener("pointerleave", onLeave);
      });
    };
  });

  return () => {
    scope.revert();
    root.classList.remove("nv-folio-motion");
  };
}
