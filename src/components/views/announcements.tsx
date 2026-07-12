'use client'

import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Pin, Bell, CheckCheck, Plus, Megaphone, AlertCircle, Calendar as CalIcon,
  ShieldCheck, Eye, EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { formatRelative } from '@/lib/helpers'
import { Announcement } from '@/lib/types'

const CATEGORY_INFO: Record<Announcement['category'], { label: string; icon: React.ElementType; color: string }> = {
  general: { label: 'General', icon: Megaphone, color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  convocatoria: { label: 'Convocatoria', icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  evento: { label: 'Evento', icon: CalIcon, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  urgente: { label: 'Urgente', icon: AlertCircle, color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
}

export function AnnouncementsView() {
  const { announcements, currentUserId, players, markAnnouncementRead, togglePinAnnouncement, addAnnouncement } = useAppStore()
  const [tab, setTab] = useState<'todos' | 'no_leidos' | 'fijados'>('todos')
  const [showNew, setShowNew] = useState(false)

  const currentUser = players.find((p) => p.id === currentUserId)

  const sorted = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.date.localeCompare(a.date)
    })
  }, [announcements])

  const filtered = useMemo(() => {
    if (tab === 'no_leidos') {
      return sorted.filter((a) => !a.readBy.includes(currentUserId))
    }
    if (tab === 'fijados') return sorted.filter((a) => a.pinned)
    return sorted
  }, [sorted, tab, currentUserId])

  const unreadCount = announcements.filter((a) => !a.readBy.includes(currentUserId)).length
  const pinnedCount = announcements.filter((a) => a.pinned).length

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Megaphone className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground">Total avisos</p>
              <p className="font-bold text-lg leading-none">{announcements.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground">Sin leer</p>
              <p className="font-bold text-lg leading-none">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950">
              <Pin className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground">Fijados</p>
              <p className="font-bold text-lg leading-none">{pinnedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header con acción */}
      <div className="flex items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="no_leidos">
              No leídos
              {unreadCount > 0 && (
                <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="fijados">Fijados</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setShowNew(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo aviso
        </Button>
      </div>

      {/* Lista de avisos */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No hay avisos en esta categoría.</p>
            </CardContent>
          </Card>
        )}

        {filtered.map((a) => {
          const isRead = a.readBy.includes(currentUserId)
          const cat = CATEGORY_INFO[a.category]
          const Icon = cat.icon
          return (
            <Card
              key={a.id}
              className={cn(
                'transition-all',
                a.pinned && 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20',
                !isRead && 'border-l-4 border-l-primary'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', cat.color)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-sm">{a.title}</h3>
                      {a.pinned && (
                        <Badge variant="outline" className="text-[9px] bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                          <Pin className="h-2.5 w-2.5 mr-0.5" />
                          Fijado
                        </Badge>
                      )}
                      {!isRead && (
                        <Badge variant="default" className="text-[9px] bg-primary">
                          Nuevo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{a.author}</span>
                        <span>·</span>
                        <span>{formatRelative(a.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => togglePinAnnouncement(a.id)}
                        >
                          <Pin className={cn('h-3 w-3 mr-1', a.pinned && 'fill-current text-amber-500')} />
                          {a.pinned ? 'Desfijar' : 'Fijar'}
                        </Button>
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              markAnnouncementRead(a.id, currentUserId)
                              toast.success('Aviso marcado como leído')
                            }}
                          >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Marcar leído
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Footer con info de lecturas */}
                    {a.readBy.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>Leído por {a.readBy.length} jugador{a.readBy.length !== 1 ? 'es' : ''}</span>
                      </div>
                    )}
                    {a.readBy.length === 0 && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <EyeOff className="h-3 w-3" />
                        <span>Aún sin lecturas</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <NewAnnouncementDialog
        open={showNew}
        onOpenChange={setShowNew}
        onAdd={(data) => {
          addAnnouncement(data)
          toast.success('Aviso publicado', {
            description: 'El aviso fue enviado a todo el equipo.',
          })
          setShowNew(false)
        }}
      />
    </div>
  )
}

function NewAnnouncementDialog({
  open, onOpenChange, onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: Omit<Announcement, 'id' | 'date' | 'readBy'>) => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<Announcement['category']>('general')
  const [pinned, setPinned] = useState(false)

  const handleSubmit = () => {
    if (!title || !content) return
    onAdd({
      title, content, category, pinned,
      author: 'Carlos Mendoza',
      authorRole: 'entrenador',
    })
    setTitle(''); setContent(''); setPinned(false); setCategory('general')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo aviso</DialogTitle>
          <DialogDescription>Publica un anuncio para todo el equipo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Cambio de horario" />
          </div>
          <div>
            <Label>Contenido</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Escribe el mensaje…" />
          </div>
          <div>
            <Label>Categoría</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Announcement['category'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="convocatoria">Convocatoria</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinned"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="pinned" className="cursor-pointer">Fijar aviso (destacado)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!title || !content}>Publicar aviso</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
