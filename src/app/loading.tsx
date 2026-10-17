import { VaultPreload } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <VaultPreload
      title="Opening your vault…"
      description="Syncing notes and collections. This usually takes a moment."
    />
  );
}
