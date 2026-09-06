import type { Meta, StoryObj } from "@storybook/nextjs-vite";

function TypographyCanvas() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 p-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted">Display</p>
        <h1
          className="text-4xl leading-tight"
          style={{
            fontFamily: 'var(--font-display), "Iowan Old Style", Georgia, serif',
          }}
        >
          NoteVault display type
        </h1>
        <p
          className="text-lg text-muted"
          style={{
            fontFamily: 'var(--font-display), "Iowan Old Style", Georgia, serif',
          }}
        >
          Used for titles, vault branding, and expressive headings.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted">Sans</p>
        <p
          className="text-base leading-relaxed"
          style={{
            fontFamily:
              'var(--font-geist-sans), var(--font-sans), "DM Sans", ui-sans-serif, system-ui, sans-serif',
          }}
        >
          Body copy, UI chrome, menus, and controls use the sans stack. The quick brown fox jumps
          over the lazy vault.
        </p>
        <p
          className="text-sm text-muted"
          style={{
            fontFamily:
              'var(--font-geist-sans), var(--font-sans), "DM Sans", ui-sans-serif, system-ui, sans-serif',
          }}
        >
          Secondary labels stay readable at smaller sizes.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted">Mono</p>
        <pre
          className="overflow-x-auto rounded-lg border border-border bg-panel p-4 text-sm"
          style={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
          }}
        >
          {`const accent = "var(--accent)";
function greet(name: string) {
  return \`Hello, \${name}\`;
}`}
        </pre>
        <code
          className="text-sm"
          style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
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
