import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/free-players
 * Lista jugadores libres públicos con filtros
 * Query: ?position=DELANTERO&city=Medellin&minJump=40
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const position = searchParams.get('position')
    const city = searchParams.get('city')
    const minJump = searchParams.get('minJump')
    const maxSprint = searchParams.get('maxSprint')

    const where: any = {
      isPublic: true,
    }

    if (position) where.primaryPosition = position
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (minJump) where.bestVerticalJumpCm = { gte: parseInt(minJump) }
    if (maxSprint) where.bestSprint10Sec = { lte: parseFloat(maxSprint) }

    const players = await db.freePlayer.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        age: true,
        photoUrl: true,
        primaryPosition: true,
        city: true,
        zone: true,
        bestVerticalJumpCm: true,
        bestSprint10Sec: true,
        bestSprint20Sec: true,
        createdAt: true,
      },
      orderBy: [
        { bestVerticalJumpCm: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    })

    return NextResponse.json(players)
  } catch (error: any) {
    console.error('[API free-players GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
