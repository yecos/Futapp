import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config()

const prisma = new PrismaClient()

async function main() {
  console.log('📋 Estado de la tabla InviteToken:\n')

  const invites = await prisma.inviteToken.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  })

  if (invites.length === 0) {
    console.log('  ❌ No hay invites en la DB')
    return
  }

  console.log(`Total: ${invites.length} invites\n`)

  // Buscar teams separadamente
  const teamIds = [...new Set(invites.map(i => i.teamId))]
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: { id: true, name: true },
  })
  const teamMap = new Map(teams.map(t => [t.id, t.name]))

  for (const inv of invites) {
    const status = inv.usedBy ? '✅ USADO' :
                   inv.expiresAt < new Date() ? '⏰ EXPIRADO' :
                   '🟢 VÁLIDO'
    console.log(`${status}`)
    console.log(`  Token: ${inv.token}`)
    console.log(`  Team:  ${teamMap.get(inv.teamId) || '?'}`)
    console.log(`  Rol:   ${inv.role}`)
    console.log(`  Expira: ${inv.expiresAt.toLocaleDateString('es-CO')}`)
    console.log(`  URL:   https://futapp-seven.vercel.app/invite/${inv.token}`)
    console.log('')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
