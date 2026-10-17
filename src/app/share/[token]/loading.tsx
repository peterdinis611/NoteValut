import { VaultPreload } from "@/components/ui/spinner";

export default function ShareLoading() {
  return (
    <VaultPreload
      title="Opening shared vault…"
      description="Validating the share link and loading content."
    />
  );
}
