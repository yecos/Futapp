import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/players
 * Lista jugadores del equipo del usuario
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, status: 'ACTIVO' },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    if (!membership?.teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    const players = await db.player.findMany({
      where: { teamId: membership.teamId },
      select: {
        id: true,
        fullName: true,
        jerseyNumber: true,
        primaryPosition: true,
        status: true,
        photoUrl: true,
      },
      orderBy: { jerseyNumber: 'asc' },
    })

    return NextResponse.json(players)
  } catch (error: any) {
    console.error('[API players GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
