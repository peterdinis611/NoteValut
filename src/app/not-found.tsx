import { LottieStatus } from "@/components/lottie-status";

export default function NotFound() {
  return (
    <LottieStatus
      variant="not-found"
      title="Page not found"
      description="This route doesn’t exist in your vault — it may have been moved or never existed."
      actions={[
        { label: "Go home", href: "/", primary: true },
      ]}
    />
  );
}
