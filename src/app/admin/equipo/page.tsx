import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { TeamSettingsView } from '@/components/admin/team-settings-view'

export default async function AdminEquipoPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Verificar rol desde DB
  const membership = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVO',
    },
    orderBy: { joinedAt: 'desc' },
    select: { role: true, teamId: true },
  })

  if (!membership?.teamId) redirect('/choose-team')
  if (membership.role !== 'ADMIN') redirect('/')

  const team = await db.team.findUnique({
    where: { id: membership.teamId },
  })

  if (!team) redirect('/')

  return (
    <TeamSettingsView
      team={{
        name: team.name,
        shortName: team.shortName,
        category: team.category,
        coachName: team.coachName,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor || '',
        foundedYear: team.foundedYear,
        description: team.description || '',
        bankName: team.bankName,
        accountType: team.accountType,
        accountNumber: team.accountNumber || '',
        accountHolder: team.accountHolder || '',
        paymentInstructions: team.paymentInstructions || '',
      }}
    />
  )
}
