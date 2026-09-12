import { create } from "storybook/theming";

/** Storybook chrome — same Folio shop as the app. */
export const folioTheme = create({
  base: "light",
  brandTitle: "NoteVault · Folio",
  brandUrl: "./",
  brandTarget: "_self",
  brandImage: undefined,

  colorPrimary: "#e8611a",
  colorSecondary: "#e8611a",

  appBg: "#fbf8f2",
  appContentBg: "#fffaf3",
  appPreviewBg: "#fbf8f2",
  appBorderColor: "#e6ddd0",
  appBorderRadius: 4,

  fontBase: '"Sora", ui-sans-serif, sans-serif',
  fontCode: '"IBM Plex Mono", ui-monospace, monospace',

  textColor: "#171412",
  textInverseColor: "#fbf8f2",
  textMutedColor: "#6d6458",

  barTextColor: "#6d6458",
  barSelectedColor: "#e8611a",
  barHoverColor: "#171412",
  barBg: "#f3ead8",

  buttonBg: "#fffaf3",
  buttonBorder: "#171412",

  booleanBg: "#f3ead8",
  booleanSelectedBg: "#cbb6ee",

  inputBg: "#fffaf3",
  inputBorder: "#171412",
  inputTextColor: "#171412",
  inputBorderRadius: 4,
});
