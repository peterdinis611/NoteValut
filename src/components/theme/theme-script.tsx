/** Inline bootstrap so the first paint matches stored / system theme (no FOUC). */
export const THEME_STORAGE_KEY = "theme";

export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var t=s||"system";var r=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(r);d.style.colorScheme=r;}catch(e){}})();`;

/** Server-rendered blocking script — React 19 allows this from RSC. */
export function ThemeScript() {
  return (
    <script
      id="notevalut-theme-init"
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
