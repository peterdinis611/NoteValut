import type { Metadata } from "next";
import { StatusScreen } from "@/components/status/status-screen";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This shelf page does not exist.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="This page left the shelf"
      description="The note you’re looking for isn’t here — it may have moved, or the link is incomplete. Head home or open your vault."
      primaryHref="/"
      primaryLabel="Back home"
    />
  );
}
