/** NoteVault — Folio (paper, ink, brew). */
export const clerkAppearance = {
  options: {
    socialButtonsVariant: "blockButton" as const,
    socialButtonsPlacement: "top" as const,
    logoPlacement: "none" as const,
  },
  layout: {
    socialButtonsVariant: "blockButton" as const,
    socialButtonsPlacement: "top" as const,
    logoPlacement: "none" as const,
  },
  variables: {
    colorPrimary: "#c4480e",
    colorBackground: "#fffaf3",
    colorInputBackground: "#fbf8f2",
    colorInputText: "#171412",
    colorText: "#171412",
    colorTextSecondary: "#6d6458",
    colorNeutral: "#6d6458",
    colorDanger: "#c43c1a",
    borderRadius: "0.35rem",
    fontFamily: "var(--font-body), ui-sans-serif, sans-serif",
    fontFamilyButtons: "var(--font-body), ui-sans-serif, sans-serif",
  },
  elements: {
    rootBox: "clerk-root-box",
    card: "clerk-card",
    headerTitle: "clerk-header-title",
    headerSubtitle: "clerk-header-subtitle",
    socialButtonsBlockButton: "clerk-social-btn",
    formButtonPrimary: "clerk-primary-btn",
    footerActionLink: "clerk-footer-link",
    logoBox: "clerk-logo-box",
    footer: "clerk-footer",
  },
};
