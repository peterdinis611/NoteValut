"use client";

import { animate, createScope, createTimeline, stagger } from "animejs";

function clearFolioMotion(root: HTMLElement) {
  root.classList.remove("nv-folio-motion", "nv-folio-animating");
  root.querySelectorAll<HTMLElement>(".nv-folio-await").forEach((el) => {
    el.style.opacity = "";
    el.style.transform = "";
    el.style.translate = "";
  });
}

export function playFolioPageMotion(root: HTMLElement) {
  const scope = createScope({
    root,
    mediaQueries: {
      reduce: "(prefers-reduced-motion: reduce)",
    },
  });

  let safetyTimer = 0;

  scope.add((self) => {
    if (self?.matches.reduce) {
      clearFolioMotion(root);
      return;
    }

    root.classList.add("nv-folio-motion", "nv-folio-animating");

    const tl = createTimeline({
      defaults: { ease: "out(3)" },
      onComplete: () => {
        root.classList.remove("nv-folio-animating");
        window.clearTimeout(safetyTimer);
      },
    });

    safetyTimer = window.setTimeout(() => {
      if (root.classList.contains("nv-folio-animating")) {
        clearFolioMotion(root);
      }
    }, 1800);

    tl.add(".nv-folio-await", {
      opacity: [0, 1],
      y: [18, 0],
      duration: 720,
      delay: stagger(70),
    });

    const orders = root.querySelectorAll<HTMLElement>(
      ".nv-folio-btn, .status-btn-primary, .vault-btn-primary",
    );
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
      window.clearTimeout(safetyTimer);
      orders.forEach((btn) => {
        btn.removeEventListener("pointerenter", onEnter);
        btn.removeEventListener("pointerleave", onLeave);
      });
    };
  });

  return () => {
    window.clearTimeout(safetyTimer);
    scope.revert();
    clearFolioMotion(root);
  };
}
