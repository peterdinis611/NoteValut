import { SharedVaultApp } from "@/components/shared-vault-app";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  return <SharedVaultApp token={token} />;
}
