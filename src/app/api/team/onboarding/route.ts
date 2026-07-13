import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

/**
 * POST /api/team/onboarding
 * Completa el onboarding del equipo (colores + datos bancarios).
 * Solo actualiza los campos que no se pidieron en /choose-team.
 *
 * IMPORTANTE: Verifica el rol directamente desde la DB, no del JWT
 * (que puede estar desactualizado después de crear el equipo).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Consultar membership directamente desde la DB
    const { data: membership } = await supabase
      .from('TeamMembership')
      .select('role, teamId')
      .eq('userId', session.user.id)
      .eq('status', 'ACTIVO')
      .single()

    if (!membership || !membership.teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    if (membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo el admin puede configurar el equipo' },
        { status: 403 }
      )
    }

    const body = await req.json()

    const { error } = await supabase
      .from('Team')
      .update({
        primaryColor: body.primaryColor || '#16a34a',
        foundedYear: body.foundedYear || new Date().getFullYear(),
        bankName: body.bankName || 'Bancolombia',
        accountType: body.accountType || 'Ahorros',
        accountNumber: body.accountNumber,
        accountHolder: body.accountHolder,
        paymentInstructions: body.paymentInstructions || '',
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', membership.teamId)

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
