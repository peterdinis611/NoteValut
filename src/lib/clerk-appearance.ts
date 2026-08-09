import { dark } from "@clerk/themes";

/** NoteVault-tuned Clerk appearance (dark + copper accent). */
export const clerkAppearance = {
  theme: dark,
  baseTheme: dark,
  variables: {
    colorPrimary: "#e2a45a",
    colorBackground: "#1a1713",
    colorInputBackground: "#141210",
    colorInputText: "rgba(250,245,235,0.92)",
    colorText: "rgba(250,245,235,0.9)",
    colorTextSecondary: "rgba(210,190,165,0.58)",
    colorNeutral: "rgba(210,190,165,0.7)",
    borderRadius: "0.65rem",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
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
