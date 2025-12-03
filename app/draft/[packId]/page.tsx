import { PackOpeningCeremony } from '@/components/pack-opening'

interface DraftPageProps {
  params: Promise<{ packId: string }>
}

export default async function DraftPage({ params }: DraftPageProps) {
  const { packId } = await params

  // TODO: Fetch pack metadata from API
  // const packData = await fetch(`/api/pack/${packId}`).then(r => r.json())
  
  return (
    <main className="min-h-screen bg-black">
      <PackOpeningCeremony 
        packId={packId}
        packName={`Pack #${packId}`}
      />
    </main>
  )
}

// Generate metadata for the page
export async function generateMetadata({ params }: DraftPageProps) {
  const { packId } = await params
  
  return {
    title: `Opening Pack #${packId} | Game of Memes`,
    description: 'Watch the pack opening ceremony and reveal your cards!',
  }
}
