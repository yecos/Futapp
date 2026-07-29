'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck, ArrowLeft, Calendar, Trophy, CreditCard, ClipboardList, Megaphone, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  status: string
  sentAt: string | null
  readAt: string | null
  relatedEntityType: string | null
  relatedEntityId: string | null
}

const TYPE_ICONS: Record<string, any> = {
  NEW_EVENT: Calendar,
  NEW_ANNOUNCEMENT: Megaphone,
  NEW_PAYMENT: CreditCard,
  PAYMENT_REMINDER: CreditCard,
  PAYMENT_VERIFIED: CheckCheck,
  PAYMENT_REJECTED: AlertCircle,
  RECEIPT_UPLOADED: CreditCard,
  CALLUP: ClipboardList,
  PENALTY: Trophy,
}

const TYPE_COLORS: Record<string, string> = {
  NEW_EVENT: 'bg-emerald-500/20 text-emerald-400',
  NEW_ANNOUNCEMENT: 'bg-sky-500/20 text-sky-400',
  NEW_PAYMENT: 'bg-teal-500/20 text-teal-400',
  PAYMENT_REMINDER: 'bg-amber-500/20 text-amber-400',
  PAYMENT_VERIFIED: 'bg-emerald-500/20 text-emerald-400',
  PAYMENT_REJECTED: 'bg-rose-500/20 text-rose-400',
  RECEIPT_UPLOADED: 'bg-violet-500/20 text-violet-400',
  CALLUP: 'bg-purple-500/20 text-purple-400',
  PENALTY: 'bg-rose-500/20 text-rose-400',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      const res = await fetch('/api/notifications?markAllRead=true', { method: 'PATCH' })
      if (res.ok) {
        toast.success(`${unreadCount} notificaciones marcadas como leídas`)
        setNotifications(prev => prev.map(n => ({ ...n, status: 'LEIDA', readAt: new Date().toISOString() })))
        setUnreadCount(0)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setMarkingAll(false)
    }
  }

  const handleMarkOne = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'LEIDA', readAt: new Date().toISOString() } : n))
        setUnreadCount(c => Math.max(0, c - 1))
      }
    } catch (e) {
      // ignore
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
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge className="bg-rose-500 text-white">{unreadCount}</Badge>
              )}
            </h1>
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleMarkAll} disabled={markingAll}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No tienes notificaciones.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const Icon = TYPE_ICONS[n.type] || Bell
              const color = TYPE_COLORS[n.type] || 'bg-muted text-muted-foreground'
              const isUnread = n.status === 'PENDIENTE' || n.status === 'ENVIADA'

              return (
                <Card
                  key={n.id}
                  className={`border-white/5 animate-fade-in-up cursor-pointer ${
                    isUnread ? 'bg-primary/5 ring-1 ring-primary/30' : 'bg-card/30'
                  }`}
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => isUnread && handleMarkOne(n.id)}
                >
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm">{n.title}</p>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                      {n.sentAt && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.sentAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
