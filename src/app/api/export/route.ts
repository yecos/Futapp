import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

function escapeCsv(value: string): string {
  if (!value) return ''
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'players'

    let csv = ''
    let filename = ''

    if (type === 'players') {
      const players = await db.player.findMany({
        where: { teamId: membership.teamId },
        orderBy: { jerseyNumber: 'asc' },
        select: {
          jerseyNumber: true, fullName: true, firstName: true, lastName: true,
          primaryPosition: true, secondaryPosition: true, age: true,
          dominantFoot: true, height: true, weight: true, phone: true,
          emergencyContact: true, status: true,
          matchesPlayed: true, goals: true, assists: true,
          yellowCards: true, redCards: true,
          statPoints: true, totalPointsEarned: true, streak: true, maxStreak: true,
        },
      })

      const headers = [
        'Dorsal', 'Nombre', 'Apellido', 'Nombre Completo', 'Posición', 'Posición Secundaria',
        'Edad', 'Pierna', 'Altura', 'Peso', 'Teléfono', 'Emergencia', 'Estado',
        'Partidos', 'Goles', 'Asistencias', 'Amarillas', 'Rojas',
        'Puntos RPG', 'Total Puntos', 'Racha', 'Mejor Racha',
      ]

      csv = headers.join(',') + '\n'
      for (const p of players) {
        csv += [
          p.jerseyNumber, escapeCsv(p.firstName), escapeCsv(p.lastName), escapeCsv(p.fullName),
          p.primaryPosition, p.secondaryPosition || '',
          p.age, p.dominantFoot, p.height || '', p.weight || '',
          escapeCsv(p.phone || ''), escapeCsv(p.emergencyContact || ''), p.status,
          p.matchesPlayed, p.goals, p.assists, p.yellowCards, p.redCards,
          p.statPoints, p.totalPointsEarned, p.streak, p.maxStreak,
        ].join(',') + '\n'
      }
      filename = `plantilla-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'payments') {
      if (membership.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Solo el admin puede exportar pagos' }, { status: 403 })
      }

      const payments = await db.payment.findMany({
        where: { teamId: membership.teamId },
        include: {
          receipts: {
            include: {
              player: { select: { fullName: true, jerseyNumber: true } },
            },
          },
        },
        orderBy: { dueDate: 'desc' },
      })

      const headers = [
        'Título', 'Tipo', 'Monto', 'Vencimiento', 'Estado', 'Recurrencia',
        'Comprobante: Jugador', 'Comprobante: Monto', 'Comprobante: Estado', 'Fecha Revisión',
      ]

      csv = headers.join(',') + '\n'
      for (const p of payments) {
        if (p.receipts.length === 0) {
          csv += [
            escapeCsv(p.title), p.type, p.amount.toString(),
            new Date(p.dueDate).toLocaleDateString('es-CO'), p.status, p.recurrence,
            '', '', '', '',
          ].join(',') + '\n'
        } else {
          for (const r of p.receipts) {
            csv += [
              escapeCsv(p.title), p.type, p.amount.toString(),
              new Date(p.dueDate).toLocaleDateString('es-CO'), p.status, p.recurrence,
              escapeCsv(`#${r.player.jerseyNumber} ${r.player.fullName}`),
              r.amount ? r.amount.toString() : '',
              r.status,
              r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString('es-CO') : '',
            ].join(',') + '\n'
          }
        }
      }
      filename = `pagos-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'stats') {
      const players = await db.player.findMany({
        where: { teamId: membership.teamId },
        orderBy: { totalPointsEarned: 'desc' },
        select: {
          jerseyNumber: true, fullName: true, primaryPosition: true,
          matchesPlayed: true, goals: true, assists: true,
          yellowCards: true, redCards: true,
          trainingsAttended: true, trainingsTotal: true,
          statPoints: true, totalPointsEarned: true, streak: true, maxStreak: true,
          basePAC: true, baseSHO: true, basePAS: true, baseDRI: true, baseDEF: true, basePHY: true,
        },
      })

      const headers = [
        'Dorsal', 'Jugador', 'Posición',
        'Partidos', 'Goles', 'Asistencias', 'Amarillas', 'Rojas',
        'Entrenos Asistidos', 'Entrenos Total',
        'Puntos Disp.', 'Total Puntos', 'Racha', 'Mejor Racha',
        'RIT', 'TIR', 'PAS', 'REG', 'DEF', 'FIS',
      ]

      csv = headers.join(',') + '\n'
      for (const p of players) {
        csv += [
          p.jerseyNumber, escapeCsv(p.fullName), p.primaryPosition,
          p.matchesPlayed, p.goals, p.assists, p.yellowCards, p.redCards,
          p.trainingsAttended, p.trainingsTotal,
          p.statPoints, p.totalPointsEarned, p.streak, p.maxStreak,
          p.basePAC, p.baseSHO, p.basePAS, p.baseDRI, p.baseDEF, p.basePHY,
        ].join(',') + '\n'
      }
      filename = `estadisticas-${new Date().toISOString().split('T')[0]}.csv`
    } else {
      return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
    }

    const bom = '\uFEFF'
    const csvContent = bom + csv

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('[API export] Error:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
