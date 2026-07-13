'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Bell, Pin } from 'lucide-react'
import Link from 'next/link'

interface AnnouncementData {
  id: string
  title: string
  content: string
  category: string
  pinned: boolean
  publishedAt: string
  authorRole: string
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

export function AnnouncementsView({ announcements }: { announcements: AnnouncementData[] }) {
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <h1 className="text-xl font-bold mt-2">Avisos</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
        <div className="space-y-3">
          {sorted.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No hay avisos.</p>
            </CardContent></Card>
          )}
          {sorted.map((a, i) => (
            <Card key={a.id} className={`border-white/5 bg-gradient-card animate-fade-in-up ${a.pinned ? 'border-amber-500/30 bg-amber-950/10' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
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
                    </div>
                    <h3 className="font-bold text-sm">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(a.publishedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
