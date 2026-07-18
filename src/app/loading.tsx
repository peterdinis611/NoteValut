import { LottieStatus } from "@/components/lottie-status";

export default function Loading() {
  return (
    <LottieStatus
      variant="loading"
      title="Opening your vault…"
      description="Syncing notes and collections. This usually takes a moment."
    />
  );
}
