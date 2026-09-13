import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuthGate } from "@/components/auth-gate";

function DeskStub() {
  return (
    <div>
      <p className="clerk-header-title" style={{ margin: 0 }}>
        Sign in
      </p>
      <button type="button" className="clerk-primary-btn" style={{ width: "100%", height: "2.4rem", marginTop: "1rem" }}>
        Continue
      </button>
    </div>
  );
}

const meta = {
  title: "Components/AuthGate",
  component: AuthGate,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AuthGate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignIn: Story = {
  args: {
    mode: "in",
    children: <DeskStub />,
  },
};

export const SignUp: Story = {
  args: {
    mode: "up",
    children: <DeskStub />,
    footer: (
      <p className="clerk-auth-hint">
        Stuck on an old phone step?{" "}
        <a href="/sign-up?reset=1" className="clerk-auth-hint-link">
          Start over
        </a>
      </p>
    ),
  },
};
