"use client";

import {
  animate,
  createDrawable,
  createScope,
  createTimeline,
  onScroll,
  stagger,
} from "animejs";

export function playLandingMotion(root: HTMLElement) {
  const scope = createScope({
    root,
    mediaQueries: {
      reduce: "(prefers-reduced-motion: reduce)",
    },
  });

  scope.add((self) => {
    if (self.matches.reduce) {
      root.classList.remove("nv-land-motion");
      return;
    }

    root.classList.add("nv-land-motion");

    const tl = createTimeline({ defaults: { ease: "out(3)" } });

    tl.add(
      ".nv-land-nav",
      { opacity: [0, 1], y: [-18, 0], duration: 640 },
      0,
    );

    tl.add(
      ".nv-land-word",
      {
        y: ["1.15em", "0em"],
        opacity: [0, 1],
        duration: 880,
        delay: stagger(52),
      },
      90,
    );

    tl.add(".nv-land-col-left", { opacity: [0, 1], x: [-28, 0], duration: 780 }, 280);
    tl.add(".nv-land-art-wrap", { opacity: [0, 1], y: [28, 0], scale: [0.94, 1], duration: 920 }, 220);
    tl.add(".nv-land-col-right", { opacity: [0, 1], x: [28, 0], duration: 780 }, 340);
    tl.add(".nv-land-order", { opacity: [0, 1], y: [12, 0], duration: 560 }, 520);
    tl.add(
      ".nv-land-faces span",
      { opacity: [0, 1], scale: [0.6, 1], delay: stagger(70), duration: 480 },
      640,
    );
    tl.add(".nv-land-proof p", { opacity: [0, 1], x: [12, 0], duration: 520 }, 720);

    const count = root.querySelector<HTMLElement>(".nv-land-count");
    if (count) {
      animate(count, {
        innerHTML: [0, 100],
        modifier: (v) => String(Math.round(Number(v))),
        duration: 1400,
        ease: "out(3)",
        delay: 420,
      });
    }

    try {
      const drawn = createDrawable(".nv-art-arrow, .nv-art-spark, .nv-art-steam path", 0, 1);
      animate(drawn, {
        draw: ["0 0", "0 1"],
        duration: 1100,
        delay: stagger(80, { start: 520 }),
        ease: "inOut(2)",
      });
    } catch {
      /* drawable only wraps geometry */
    }

    animate(".nv-land-bento article", {
      opacity: [0, 1],
      y: [36, 0],
      rotate: [1.4, 0],
      duration: 780,
      delay: stagger(90),
      ease: "out(3)",
      autoplay: onScroll({
        target: "#features",
        enter: "bottom-=12% top",
        repeat: false,
      }),
    });

    animate("#how li", {
      opacity: [0, 1],
      x: [-22, 0],
      duration: 680,
      delay: stagger(110),
      ease: "out(3)",
      autoplay: onScroll({
        target: "#how",
        enter: "bottom-=16% top",
        repeat: false,
      }),
    });

    animate("#features h2", {
      opacity: [0, 1],
      y: [18, 0],
      duration: 640,
      ease: "out(3)",
      autoplay: onScroll({
        target: "#features",
        enter: "bottom-=8% top",
        repeat: false,
      }),
    });

    animate("#how h2", {
      opacity: [0, 1],
      y: [18, 0],
      duration: 640,
      ease: "out(3)",
      autoplay: onScroll({
        target: "#how",
        enter: "bottom-=8% top",
        repeat: false,
      }),
    });

    animate(".nv-land-cta", {
      opacity: [0, 1],
      y: [28, 0],
      duration: 820,
      ease: "out(3)",
      autoplay: onScroll({
        target: ".nv-land-cta",
        enter: "bottom-=10% top",
        repeat: false,
      }),
    });

    animate(".nv-land-foot", {
      opacity: [0, 1],
      y: [16, 0],
      duration: 640,
      ease: "out(3)",
      autoplay: onScroll({
        target: ".nv-land-foot",
        enter: "bottom-=6% top",
        repeat: false,
      }),
    });

    animate(".nv-land-art-wrap", {
      y: [-12, 18],
      autoplay: onScroll({
        target: ".nv-land-hero",
        enter: "top top",
        leave: "bottom top",
        sync: 0.12,
      }),
    });

    const orders = root.querySelectorAll<HTMLElement>(".nv-land-order");
    const onEnter = (e: Event) => {
      animate(e.currentTarget as HTMLElement, { y: -3, duration: 260, ease: "out(3)" });
    };
    const onLeave = (e: Event) => {
      animate(e.currentTarget as HTMLElement, { y: 0, duration: 280, ease: "out(3)" });
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
    root.classList.remove("nv-land-motion");
  };
}
