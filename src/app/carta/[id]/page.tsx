import { db } from '@/lib/db'
import { PublicCardClient } from '@/components/free-player/public-card-client'

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const freePlayer = await db.freePlayer.findUnique({
    where: { id },
    include: {
      testResults: {
        where: { status: { not: 'RECHAZADO' } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!freePlayer || !freePlayer.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Carta no disponible</h1>
          <p className="text-muted-foreground">
            Esta carta no existe o el jugador la hizo privada.
          </p>
        </div>
      </div>
    )
  }

  return <PublicCardClient freePlayer={freePlayer as any} />
}
