import { db } from '@/lib/db'
import { InviteLanding } from '@/components/auth/invite-landing'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invite = await db.inviteToken.findUnique({
    where: { token },
    include: { team: { select: { name: true } } },
  })

  if (!invite || invite.usedBy || invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Invitación inválida</h1>
          <p className="text-muted-foreground">
            El link expiró o ya fue usado. Pide al administrador un nuevo link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <InviteLanding
      token={invite.token}
      teamName={invite.team.name}
      role={invite.role}
    />
  )
}
