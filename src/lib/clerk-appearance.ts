import { dark } from "@clerk/themes";

/** NoteVault — Phosphor Archive (dark teal + lime). */
export const clerkAppearance = {
  theme: dark,
  baseTheme: dark,
  variables: {
    colorPrimary: "#c8f542",
    colorBackground: "#101a17",
    colorInputBackground: "#0a1210",
    colorInputText: "rgba(232, 244, 236, 0.94)",
    colorText: "rgba(232, 244, 236, 0.92)",
    colorTextSecondary: "rgba(156, 184, 168, 0.62)",
    colorNeutral: "rgba(156, 184, 168, 0.72)",
    borderRadius: "0.4rem",
    fontFamily: "var(--font-body), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    rootBox: "clerk-root-box",
    card: "clerk-card",
    headerTitle: "clerk-header-title",
    headerSubtitle: "clerk-header-subtitle",
    socialButtonsBlockButton: "clerk-social-btn",
    formButtonPrimary: "clerk-primary-btn",
    footerActionLink: "clerk-footer-link",
  },
};
