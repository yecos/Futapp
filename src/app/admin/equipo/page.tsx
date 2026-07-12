import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { TeamSettingsView } from '@/components/admin/team-settings-view'

export default async function AdminEquipoPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!session.user.teamId) redirect('/choose-team')
  if (session.user.role !== 'ADMIN') redirect('/')

  const teamId = session.user.teamId
  const { data: team } = await supabase
    .from('Team')
    .select('*')
    .eq('id', teamId)
    .single()

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
