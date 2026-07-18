import { dark } from "@clerk/themes";

/** NoteVault-tuned Clerk appearance (dark + teal accent). */
export const clerkAppearance = {
  theme: dark,
  baseTheme: dark,
  variables: {
    colorPrimary: "#3ecfbe",
    colorBackground: "#171b24",
    colorInputBackground: "#12151c",
    colorInputText: "rgba(255,255,255,0.9)",
    colorText: "rgba(255,255,255,0.88)",
    colorTextSecondary: "rgba(255,255,255,0.5)",
    colorNeutral: "rgba(255,255,255,0.7)",
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
