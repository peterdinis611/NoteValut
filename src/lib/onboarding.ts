import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const STEPS: DriveStep[] = [
  {
    element: "[data-tour='vault-home']",
    popover: {
      title: "Welcome to NoteVault",
      description:
        "Your personal knowledge space — notes, collections, and daily pages in one calm workspace.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='sidebar']",
    popover: {
      title: "Navigate everything",
      description:
        "Home, Today, Calendar, Due inbox, and your private tree live here. Collapse the rail anytime for focus.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='search']",
    popover: {
      title: "Find anything fast",
      description:
        "Search by title or content. Prefer keyboard? Open the command palette with ⌘K / Ctrl+K.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='due-inbox']",
    popover: {
      title: "Never miss a due date",
      description:
        "Every open todo with a date — overdue, today, upcoming — collected in one inbox.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='new-entry']",
    popover: {
      title: "Start writing",
      description:
        "Create a blank page or start from a template. Collections group related pages together.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='daily-notes']",
    popover: {
      title: "Daily rhythm",
      description:
        "Hop through the week and open any day’s note. Calendar adds the full month and reminders.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "[data-tour='quick-capture']",
    popover: {
      title: "Capture in a flash",
      description:
        "Park a quick idea in Inbox without breaking flow. The lightning button does the same.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour='settings']",
    popover: {
      title: "Make it yours",
      description:
        "Themes, export, push reminders, and this tour again — whenever you want them.",
      side: "top",
      align: "start",
    },
  },
];

let activeDriver: ReturnType<typeof driver> | null = null;

/** Start the vault intro tour (manual only). Skips missing elements. */
export function startVaultTour() {
  if (typeof window === "undefined") return;

  const steps = STEPS.filter((step) => {
    if (!step.element || typeof step.element !== "string") return true;
    return Boolean(document.querySelector(step.element));
  });

  if (steps.length === 0) return;

  activeDriver?.destroy();
  activeDriver = driver({
    showProgress: true,
    progressText: "{{current}} / {{total}}",
    animate: true,
    allowClose: true,
    smoothScroll: true,
    overlayOpacity: 0.72,
    stagePadding: 10,
    stageRadius: 12,
    popoverOffset: 14,
    popoverClass: "notevault-driver-popover",
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Got it",
    steps,
    onPopoverRender: (popover) => {
      const title = popover.title;
      if (title && !title.querySelector(".nv-tour-kicker")) {
        const kicker = document.createElement("p");
        kicker.className = "nv-tour-kicker";
        kicker.textContent = "NoteVault tour";
        title.prepend(kicker);
      }
    },
    onDestroyStarted: () => {
      activeDriver?.destroy();
      activeDriver = null;
    },
  });

  activeDriver.drive();
}
