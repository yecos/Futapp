import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { MarketplaceClient } from '@/components/marketplace/marketplace-client'

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Verificar si es jugador libre
  const freePlayer = await db.freePlayer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, fullName: true, primaryPosition: true, city: true },
  })

  if (!freePlayer) {
    // Si no es jugador libre, redirigir a admin/cupos si es admin
    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, status: 'ACTIVO' },
      select: { role: true },
    })

    if (membership?.role === 'ADMIN') {
      redirect('/admin/cupos')
    }

    redirect('/registro-jugador-libre')
  }

  // Cargar cupos abiertos inicialmente
  const openings = await db.opening.findMany({
    where: {
      status: 'ABIERTA',
      expiresAt: { gt: new Date() },
      NOT: { team: { memberships: { some: { userId: session.user.id, status: 'ACTIVO' } } } },
    },
    include: {
      team: {
        select: { id: true, name: true, shortName: true, primaryColor: true, category: true },
      },
      _count: { select: { applications: true } },
    },
    orderBy: [
      { isHighlighted: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  })

  return <MarketplaceClient openings={openings as any} freePlayer={freePlayer as any} />
}
