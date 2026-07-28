import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

const createInviteSchema = z.object({
  role: z.enum(['ENTRENADOR', 'JUGADOR', 'CUERPO_TECNICO', 'ACUDIENTE', 'SEGUIDOR']),
  expiresInDays: z.number().int().min(1).max(30).default(7),
  email: z.string().email().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede invitar' }, { status: 403 })
    }

    const teamId = session.user.teamId
    if (!teamId) {
      return NextResponse.json({ error: 'Sin equipo asignado' }, { status: 400 })
    }
    const body = await req.json()
    const parsed = createInviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays)

    const { data: invite, error } = await supabase
      .from('InviteToken')
      .insert({
        teamId,
        createdBy: session.user.id,
        token,
        email: parsed.data.email,
        role: parsed.data.role,
        expiresAt: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(invite, { status: 201 })
  } catch (error: any) {
    console.error('[API invites POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin' }, { status: 403 })
    }

    const teamId = session.user.teamId
    if (!teamId) {
      return NextResponse.json({ error: 'Sin equipo asignado' }, { status: 400 })
    }
    const { data: invites, error } = await supabase
      .from('InviteToken')
      .select('*')
      .eq('teamId', teamId)
      .is('usedBy', null)
      .gt('expiresAt', new Date().toISOString())
      .order('createdAt', { ascending: false })

    if (error) throw error

    return NextResponse.json(invites || [])
  } catch (error: any) {
    console.error('[API invites GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
