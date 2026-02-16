import { PackOpeningCeremony } from "@/components/pack-opening";

interface DraftPageProps {
  params: Promise<{ packId: string }>;
  searchParams: Promise<{ image?: string; name?: string }>;
}

function getPackCount(packId: string): number {
  const parts = packId.split("-");
  if (parts.length >= 2) {
    const tokenIds = decodeURIComponent(parts[1]).split(",");
    return tokenIds.length;
  }
  return 1;
}

export default async function DraftPage({
  params,
  searchParams,
}: DraftPageProps) {
  const { packId } = await params;
  const { image, name } = await searchParams;

  const packCount = getPackCount(packId);
  const packName = name || `${packCount} Pack${packCount !== 1 ? "s" : ""}`;

  return (
    <main className="min-h-screen bg-black">
      <PackOpeningCeremony
        packId={packId}
        packName={packName}
        packImage={image}
      />
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: DraftPageProps) {
  const { name } = await searchParams;

  return {
    title: `Opening ${name || "Packs"} | Game of Memes`,
    description: "Watch the pack opening ceremony and reveal your cards!",
  };
}
