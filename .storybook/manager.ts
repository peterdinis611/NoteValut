import { addons } from "storybook/manager-api";
import { folioTheme } from "./folio-theme";

addons.setConfig({
  theme: folioTheme,
  sidebar: {
    showRoots: true,
  },
});
