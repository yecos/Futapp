'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bell, Pin, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CreateAnnouncementDialog } from '@/components/announcements/create-announcement-dialog'
import { toast } from 'sonner'

interface AnnouncementData {
  id: string
  title: string
  content: string
  category: string
  pinned: boolean
  publishedAt: string
  authorRole: string
  author?: { name: string | null; image: string | null }
  reads?: { id: string }[]
}

const CATEGORY_COLORS: Record<string, string> = {
  GENERAL: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  CONVOCATORIA: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  EVENTO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  URGENTE: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  PAGO: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  CONVOCATORIA: 'Convocatoria',
  EVENTO: 'Evento',
  URGENTE: 'Urgente',
  PAGO: 'Pago',
}

export function AnnouncementsView({ announcements: initialAnnouncements }: { announcements: AnnouncementData[] }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [showCreate, setShowCreate] = useState(false)
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [deleting, setDeleting] = useState<string | null>(null)

  const canCreate = ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(session?.user?.role || '')
  const canPin = ['ADMIN', 'ENTRENADOR'].includes(session?.user?.role || '')
  const canDelete = (a: AnnouncementData) => canPin || session?.user?.role === 'ADMIN'

  useEffect(() => {
    // Marcar avisos no leídos como leídos al abrir
    initialAnnouncements.forEach(async (a) => {
      if (!a.reads || a.reads.length === 0) {
        await fetch(`/api/announcements/${a.id}/read`, { method: 'POST' })
      }
    })
  }, [initialAnnouncements])

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este aviso?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      setAnnouncements(announcements.filter(a => a.id !== id))
      toast.success('Aviso eliminado')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-xl font-bold">Avisos</h1>
            {canCreate && (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Nuevo aviso
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
        <div className="space-y-3">
          {sorted.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No hay avisos.</p>
              {canCreate && (
                <Button size="sm" className="mt-3" onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Crear aviso
                </Button>
              )}
            </CardContent></Card>
          )}
          {sorted.map((a, i) => {
            const isUnread = !a.reads || a.reads.length === 0
            return (
              <Card
                key={a.id}
                className={`border-white/5 bg-gradient-card animate-fade-in-up ${a.pinned ? 'border-amber-500/30 bg-amber-950/10' : ''} ${isUnread ? 'ring-1 ring-primary/30' : ''}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {a.pinned && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 shrink-0">
                        <Pin className="h-4 w-4 text-amber-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[a.category] || CATEGORY_COLORS.GENERAL}`}>
                          {CATEGORY_LABELS[a.category] || a.category}
                        </Badge>
                        {a.pinned && <Badge variant="outline" className="text-[9px] bg-amber-500/20 text-amber-400">Fijado</Badge>}
                        {isUnread && (
                          <Badge className="text-[9px] bg-primary text-primary-foreground">NUEVO</Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-sm">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-muted-foreground">
                          {a.author?.name || 'Staff'} · {new Date(a.publishedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {canDelete(a) && (
                          <button
                            onClick={() => handleDelete(a.id)}
                            disabled={deleting === a.id}
                            className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>

      <CreateAnnouncementDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => router.refresh()}
        canPin={canPin}
      />
    </div>
  )
}
