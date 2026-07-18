import { LottieStatus } from "@/components/lottie-status";

export const metadata = {
  title: "Not authorized — NoteVault",
};

export default function NotAuthorizedPage() {
  return (
    <LottieStatus
      variant="not-authorized"
      title="Not authorized"
      description="You don’t have access to this vault or share link. Ask the owner for a new invite, or return home."
      actions={[
        { label: "Back to vault", href: "/", primary: true },
      ]}
    />
  );
}
