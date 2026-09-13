import type { Meta, StoryObj } from "@storybook/nextjs-vite";

function TypographyCanvas() {
  return (
    <div className="mx-auto max-w-2xl space-y-12 p-8">
      <header className="space-y-2">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-accent">Folio type</p>
        <h1
          className="text-5xl leading-none"
          style={{ fontFamily: "var(--font-land-display), Calistoga, Georgia, serif" }}
        >
          Your Daily Pages
        </h1>
        <p
          className="text-3xl text-accent"
          style={{ fontFamily: "var(--font-land-script), Fraunces, Georgia, serif", fontStyle: "italic" }}
        >
          Perfectly Linked
        </p>
      </header>

      <section className="space-y-3">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted">Display · Calistoga</p>
        <h2
          className="text-4xl leading-tight"
          style={{ fontFamily: "var(--font-land-display), Calistoga, Georgia, serif" }}
        >
          NoteVault display type
        </h2>
        <p className="text-muted">Titles, vault branding, and shop headlines.</p>
      </section>

      <section className="space-y-3">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted">Script · Fraunces italic</p>
        <p
          className="text-2xl text-accent"
          style={{ fontFamily: "var(--font-land-script), Fraunces, Georgia, serif", fontStyle: "italic" }}
        >
          The line that should feel handwritten.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted">Sans · Sora</p>
        <p
          className="text-base leading-relaxed"
          style={{ fontFamily: "var(--font-body), Sora, ui-sans-serif, sans-serif" }}
        >
          Body copy, UI chrome, menus, and controls. The quick brown fox jumps over the lazy vault.
        </p>
        <p className="text-sm text-muted">Secondary labels stay readable at smaller sizes.</p>
      </section>

      <section className="space-y-3">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted">Mono · IBM Plex Mono</p>
        <pre
          className="overflow-x-auto border border-foreground bg-panel p-4 text-sm shadow-[4px_4px_0_var(--foreground)]"
          style={{ fontFamily: "var(--font-plex-mono), ui-monospace, monospace" }}
        >
          {`const accent = "var(--accent)";
function greet(name: string) {
  return \`Hello, \${name}\`;
}`}
        </pre>
        <code
          className="text-sm"
          style={{ fontFamily: "var(--font-plex-mono), ui-monospace, monospace" }}
        >
          Inline mono · notes:list · ⌘K
        </code>
      </section>
    </div>
  );
}

const meta = {
  title: "App/Typography",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Samples: Story = {
  render: () => <TypographyCanvas />,
};
