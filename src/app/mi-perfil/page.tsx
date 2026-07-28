import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { MyProfileView } from '@/components/views/my-profile'

export default async function MiPerfilPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Buscar membership
  const membership = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVO',
    },
    orderBy: { joinedAt: 'desc' },
    select: { teamId: true, role: true },
  })

  if (!membership?.teamId) redirect('/choose-team')

  // Buscar el perfil de jugador vinculado al user
  const player = await db.player.findUnique({
    where: { userId: session.user.id },
  })

  // Buscar el team para info
  const team = await db.team.findUnique({
    where: { id: membership.teamId },
    select: { name: true, shortName: true, primaryColor: true },
  })

  return (
    <MyProfileView
      player={player}
      teamName={team?.name || ''}
      teamShortName={team?.shortName || ''}
      userRole={membership.role}
      userId={session.user.id}
      teamId={membership.teamId}
      userName={session.user.name || ''}
      userEmail={session.user.email || ''}
      userImage={session.user.image || null}
    />
  )
}
