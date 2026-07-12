'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCard, Clock, CheckCircle2, XCircle, Upload, ArrowLeft, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamInfo {
  name: string
  shortName: string
  bankName: string
  accountType: string
  accountNumber: string | null
  accountHolder: string | null
  qrImageUrl: string | null
  paymentInstructions: string | null
}

interface Receipt {
  id: string
  status: 'PAGADO' | 'VERIFICADO' | 'RECHAZADO' | 'PENDIENTE'
  receiptUrl: string
  uploadedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
  amount: number | null
  reference: string | null
}

interface Payment {
  id: string
  title: string
  description: string | null
  type: string
  amount: number
  dueDate: string
  status: string
  receipts: Receipt[]
}

const TYPE_LABELS: Record<string, string> = {
  MENSUALIDAD: 'Mensualidad',
  ARBITRAJE: 'Arbitraje',
  UNIFORME: 'Uniforme',
  INSCRIPCION: 'Inscripción',
  EVENTO: 'Evento',
  MULTA: 'Multa',
  OTRO: 'Otro',
}

const STATUS_BADGES: Record<string, { label: string; class: string; icon: any }> = {
  PENDIENTE: { label: 'Pendiente', class: 'bg-amber-100 text-amber-700', icon: Clock },
  PAGADO: { label: 'En revisión', class: 'bg-sky-100 text-sky-700', icon: Upload },
  VERIFICADO: { label: 'Verificado', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  RECHAZADO: { label: 'Rechazado', class: 'bg-rose-100 text-rose-700', icon: XCircle },
  VENCIDO: { label: 'Vencido', class: 'bg-rose-100 text-rose-700', icon: XCircle },
}

export function PlayerPaymentsView({ team }: { team: TeamInfo }) {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    setLoading(true)
    const res = await fetch('/api/payments?mine=true')
    if (res.ok) {
      const data = await res.json()
      setPayments(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header team={team} />
        <main className="mx-auto max-w-4xl px-4 py-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 mb-3" />
          ))}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header team={team} />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold mt-2">Mis Pagos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus mensualidades y otros cobros del equipo.
          </p>
        </div>

        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No tienes pagos pendientes por ahora.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const receipt = payment.receipts[0]
              const status = receipt?.status || payment.status
              const badge = STATUS_BADGES[status] || STATUS_BADGES.PENDIENTE
              const Icon = badge.icon
              const isOverdue = new Date(payment.dueDate) < new Date() && status === 'PENDIENTE'

              return (
                <Card key={payment.id} className={cn(isOverdue && 'border-rose-300')}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {TYPE_LABELS[payment.type] || payment.type}
                          </Badge>
                          <Badge className={cn('text-[10px]', badge.class)}>
                            <Icon className="h-2.5 w-2.5 mr-0.5" />
                            {badge.label}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-[10px]">
                              Vencido
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold">{payment.title}</h3>
                        {payment.description && (
                          <p className="text-xs text-muted-foreground mt-1">{payment.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold">
                          ${payment.amount.toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vence: {new Date(payment.dueDate).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>

                    {receipt?.status === 'RECHAZADO' && receipt.rejectionReason && (
                      <div className="mb-3 p-2 rounded bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-400">
                        <strong>Motivo del rechazo:</strong> {receipt.rejectionReason}
                      </div>
                    )}

                    {status === 'PENDIENTE' && (
                      <PaymentActions
                        payment={payment}
                        team={team}
                        onSubmitted={fetchPayments}
                      />
                    )}

                    {receipt?.status === 'PAGADO' && (
                      <p className="text-xs text-muted-foreground italic">
                        Comprobante subido. Esperando verificación del admin.
                      </p>
                    )}

                    {receipt?.status === 'VERIFICADO' && (
                      <p className="text-xs text-emerald-600 font-medium">
                        ✅ Pago verificado. ¡Gracias!
                      </p>
                    )}
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

function Header({ team }: { team: TeamInfo }) {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{team.name}</h1>
            <p className="text-xs text-primary-foreground/80">Mis Pagos</p>
          </div>
        </div>
      </div>
    </header>
  )
}

function PaymentActions({
  payment,
  team,
  onSubmitted,
}: {
  payment: Payment
  team: TeamInfo
  onSubmitted: () => void
}) {
  const [showUpload, setShowUpload] = useState(false)
  const [showBankInfo, setShowBankInfo] = useState(false)

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => setShowBankInfo(!showBankInfo)}>
        <Banknote className="h-3.5 w-3.5 mr-1" />
        Ver datos para pagar
      </Button>
      <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
        <Upload className="h-3.5 w-3.5 mr-1" />
        Subir comprobante
      </Button>

      {showBankInfo && (
        <div className="w-full mt-2 p-3 rounded-lg bg-muted/50 border">
          <p className="text-xs font-semibold mb-2">Datos para transferir:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Banco:</p>
              <p className="font-medium">{team.bankName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo de cuenta:</p>
              <p className="font-medium">{team.accountType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Número:</p>
              <p className="font-medium font-mono">{team.accountNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Titular:</p>
              <p className="font-medium">{team.accountHolder}</p>
            </div>
          </div>
          {team.paymentInstructions && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              {team.paymentInstructions}
            </p>
          )}
        </div>
      )}

      {showUpload && (
        <UploadReceipt
          payment={payment}
          onUploaded={() => {
            setShowUpload(false)
            onSubmitted()
          }}
        />
      )}
    </div>
  )
}

function UploadReceipt({
  payment,
  onUploaded,
}: {
  payment: Payment
  onUploaded: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [amount, setAmount] = useState<string>(String(payment.amount))
  const [reference, setReference] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('amount', amount)
      formData.append('reference', reference)
      const res = await fetch(`/api/payments/${payment.id}/receipts`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al subir')
      }
      onUploaded()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full mt-2 p-3 rounded-lg border space-y-2">
      <div>
        <label className="text-xs font-medium">Comprobante (JPG, PNG, PDF - máx 5MB)</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-xs mt-1 file:mr-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1.5"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium">Monto pagado</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded border px-2 py-1 text-xs"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium">Referencia (opcional)</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full rounded border px-2 py-1 text-xs"
            placeholder="Nro. transacción"
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={uploading} className="w-full">
        {uploading ? 'Subiendo…' : 'Enviar comprobante'}
      </Button>
    </form>
  )
}
