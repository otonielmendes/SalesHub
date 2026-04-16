import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LegacyDeviceFingerprintingDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/fingerprinting/${id}`);
}
