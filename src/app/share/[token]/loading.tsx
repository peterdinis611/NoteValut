import { LottieStatus } from "@/components/lottie-status";

export default function ShareLoading() {
  return (
    <LottieStatus
      variant="loading"
      title="Opening shared vault…"
      description="Validating the share link and loading content."
    />
  );
}
