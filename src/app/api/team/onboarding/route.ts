import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

// Re-export POST handler from /api/team
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede configurar el equipo' }, { status: 403 })
    }

    const body = await req.json()
    const teamId = session.user.teamId
    if (!teamId) {
      return NextResponse.json({ error: 'Sin equipo asignado' }, { status: 400 })
    }

    const { error } = await supabase
      .from('Team')
      .update({
        name: body.name,
        shortName: body.shortName?.toUpperCase(),
        category: body.category,
        coachName: body.coachName,
        foundedYear: body.foundedYear,
        primaryColor: body.primaryColor,
        bankName: body.bankName || 'Bancolombia',
        accountType: body.accountType || 'Ahorros',
        accountNumber: body.accountNumber,
        accountHolder: body.accountHolder,
        paymentInstructions: body.paymentInstructions || '',
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', teamId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API team/onboarding] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
