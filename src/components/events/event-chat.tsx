'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  body: string
  createdAt: string
  user: {
    id: string
    name: string | null
    image: string | null
    email: string
  }
}

export function EventChat({ eventId }: { eventId: string }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [body, setBody] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Cargar mensajes
  useEffect(() => {
    fetchMessages()
    // Polling cada 10s para nuevos mensajes
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [eventId])

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/events/${eventId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return

    setSending(true)
    const bodyText = body
    setBody('')

    try {
      const res = await fetch(`/api/events/${eventId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: bodyText }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        toast.error('Tu sesión expiró.')
        setTimeout(() => { window.location.href = '/login' }, 1500)
        return
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al enviar')
      }

      const newMessage = await res.json()
      setMessages(prev => [...prev, newMessage])
    } catch (err: any) {
      toast.error(err.message)
      setBody(bodyText) // restaurar mensaje
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'ahora'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`
    if (diff < 86400000) return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }

  return (
    <Card className="border-white/5 bg-gradient-card">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Chat del evento ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-80 overflow-y-auto mb-3 pr-1">
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No hay mensajes aún. ¡Sé el primero en escribir!
                </p>
              )}
              {messages.map((msg) => {
                const isMine = msg.user.id === session?.user?.id
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="shrink-0">
                      {msg.user.image ? (
                        <img
                          src={msg.user.image}
                          alt={msg.user.name || ''}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {(msg.user.name || msg.user.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-card border border-white/5 rounded-bl-sm'
                      }`}>
                        {msg.body}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 px-1">
                        {!isMine && <span className="font-medium">{msg.user.name?.split(' ')[0] || msg.user.email} · </span>}
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe un mensaje..."
                disabled={sending}
                maxLength={2000}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={sending || !body.trim()}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
