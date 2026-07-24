import type { Transition, Variants } from "motion/react";

export const easeOutSoft: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

export const easeQuick: Transition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
};

/** Desktop sidebar rail width (px) — keep in sync with `.sidebar` CSS. */
export const SIDEBAR_WIDTH = 260;

export const sidebarSpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 36,
  mass: 0.85,
};

export const sidebarSlotVariants: Variants = {
  hidden: { width: 0 },
  visible: { width: SIDEBAR_WIDTH },
  exit: { width: 0 },
};

/** Panel content fade/slide inside the rail (desktop). */
export const sidebarPanelVariants: Variants = {
  hidden: { x: -14, opacity: 0.55 },
  visible: { x: 0, opacity: 1 },
  exit: { x: -10, opacity: 0.4 },
};

/** Mobile drawer — full off-canvas slide. */
export const sidebarDrawerVariants: Variants = {
  hidden: { x: "-105%" },
  visible: { x: 0 },
  exit: { x: "-105%" },
};

/** @deprecated Prefer sidebarPanelVariants / sidebarDrawerVariants */
export const sidebarVariants: Variants = sidebarPanelVariants;

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.98 },
};

export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: easeQuick },
};

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};
