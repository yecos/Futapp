'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft, Activity, Zap, Video, Square, Check, AlertCircle, Loader2, Upload, Footprints, Timer, Repeat,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const TEST_CONFIG = [
  {
    type: 'SALTO_VERTICAL',
    label: 'Salto Vertical',
    icon: Activity,
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    unit: 'cm',
    description: 'Salta lo más alto posible sin carrera. Mide la diferencia entre tu alcance con mano estirada y el máximo al saltar.',
    evidence: 'Validado contra Optojump, correlación >0.94 (MDPI Applied Sciences)',
    placeholder: '45',
    higherIsBetter: true,
  },
  {
    type: 'SPRINT_10M',
    label: 'Sprint 10m',
    icon: Zap,
    color: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    unit: 'seg',
    description: 'Corre 10 metros en línea recta lo más rápido posible. Mide el tiempo con cronómetro o fotoceldas.',
    evidence: 'Validado contra fotoceldas, error promedio 0.09s (MDPI Sensors)',
    placeholder: '2.10',
    higherIsBetter: false,
  },
  {
    type: 'SPRINT_20M',
    label: 'Sprint 20m',
    icon: Zap,
    color: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    unit: 'seg',
    description: 'Corre 20 metros en línea recta lo más rápido posible.',
    evidence: 'Validado contra fotoceldas profesionales (NCBI PMC)',
    placeholder: '3.40',
    higherIsBetter: false,
  },
  {
    type: 'CAMBIO_DIRECCION',
    label: 'Cambio de Dirección (505)',
    icon: Repeat,
    color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    unit: 'seg',
    description: 'Corre 5m, gira 180° y regresa 5m lo más rápido posible. Test 505 estándar.',
    evidence: 'Validado para test 505 vs cronómetro manual (Frontiers in Physiology)',
    placeholder: '2.30',
    higherIsBetter: false,
  },
  {
    type: 'TOQUES_BALON',
    label: 'Toques de Balón',
    icon: Footprints,
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    unit: 'toques',
    description: 'Cuenta cuántos toques de balón logras en 30 segundos sin dejarlo caer.',
    evidence: 'Sin validación científica formal aún, pero implementaciones funcionales existen',
    placeholder: '45',
    higherIsBetter: true,
  },
]

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  SIN_VERIFICAR: { label: 'Sin verificar', class: 'bg-muted/20 text-muted-foreground' },
  VERIFICADO: { label: 'Verificado', class: 'bg-emerald-500/20 text-emerald-400' },
  RECHAZADO: { label: 'Rechazado', class: 'bg-rose-500/20 text-rose-400' },
}

export function TestsMenuClient({ freePlayer }: { freePlayer: any }) {
  const router = useRouter()
  const [selectedTest, setSelectedTest] = useState<typeof TEST_CONFIG[0] | null>(null)
  const [value, setValue] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [state, setState] = useState<'idle' | 'recording' | 'recorded' | 'uploading' | 'done'>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [chunks, setChunks] = useState<Blob[]>([])
  const [recordedAt, setRecordedAt] = useState<number>(0)

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'portrait', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      })
      setStream(s)
      const video = document.getElementById('test-video') as HTMLVideoElement
      if (video) video.srcObject = s
    } catch (e: any) {
      toast.error('No se pudo acceder a la cámara: ' + e.message)
    }
  }

  const startRecording = () => {
    if (!stream) {
      toast.error('Cámara no disponible')
      return
    }
    const newChunks: Blob[] = []
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) newChunks.push(e.data)
    }
    mr.onstop = () => {
      const blob = new Blob(newChunks, { type: 'video/webm' })
      setVideoBlob(blob)
      setVideoUrl(URL.createObjectURL(blob))
      setState('recorded')
    }
    mr.start()
    setMediaRecorder(mr)
    setChunks(newChunks)
    setRecordedAt(Date.now())
    setState('recording')
    toast.info('Grabando... ¡Realiza el test ahora!')
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
  }

  const resetTest = () => {
    setVideoBlob(null)
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(null)
    setValue('')
    setState('idle')
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
  }

  const handleSubmit = async () => {
    if (!selectedTest) return
    if (!videoBlob) {
      toast.error('Graba el video primero')
      return
    }
    if (!value || parseFloat(value) <= 0) {
      toast.error(`Ingresa el valor en ${selectedTest.unit}`)
      return
    }

    setState('uploading')
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string

        const res = await fetch('/api/test-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: selectedTest.type,
            value: parseFloat(value),
            unit: selectedTest.unit,
            videoUrl: base64,
            deviceInfo: navigator.userAgent,
            recordedAt: new Date(recordedAt).toISOString(),
          }),
        })

        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          toast.error('Tu sesión expiró.')
          setTimeout(() => { window.location.href = '/login' }, 1500)
          return
        }

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al guardar')
        }

        setState('done')
        toast.success(`${selectedTest.label}: ${value} ${selectedTest.unit} guardado!`)
        setTimeout(() => router.push('/mi-carta'), 1500)
      }
      reader.readAsDataURL(videoBlob)
    } catch (err: any) {
      toast.error(err.message)
      setState('recorded')
    }
  }

  const closeTest = () => {
    resetTest()
    setSelectedTest(null)
  }

  // Vista de menú de tests
  if (!selectedTest) {
    return (
      <div className="min-h-screen bg-gradient-deportivo">
        <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <Link href="/mi-carta" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Mi carta
            </Link>
            <h1 className="text-xl font-bold mt-2 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Tests Físicos
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Elige qué test quieres realizar. Todos se graban en vivo.
          </p>

          <div className="space-y-3">
            {TEST_CONFIG.map((test) => {
              const Icon = test.icon
              const myBest = freePlayer.testResults
                .filter((r: any) => r.type === test.type && r.status !== 'RECHAZADO')
                .sort((a: any, b: any) => test.higherIsBetter ? b.value - a.value : a.value - b.value)[0]

              return (
                <Card
                  key={test.type}
                  className="border-white/5 bg-gradient-card card-hover cursor-pointer animate-fade-in-up"
                  onClick={() => { setSelectedTest(test); setState('idle'); startCamera() }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${test.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm">{test.label}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{test.description}</p>
                      {myBest && (
                        <p className="text-xs text-primary mt-1">
                          Mejor: <strong>{myBest.value} {test.unit}</strong>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Historial */}
          {freePlayer.testResults.length > 0 && (
            <Card className="border-white/5 bg-gradient-card mt-6">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm mb-3">Historial reciente</h3>
                <div className="space-y-2">
                  {freePlayer.testResults.slice(0, 10).map((test: any) => {
                    const config = TEST_CONFIG.find(t => t.type === test.type)
                    return (
                      <div key={test.id} className="flex items-center justify-between p-2 rounded bg-card/30 text-xs">
                        <div>
                          <p className="font-medium">{config?.label || test.type}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(test.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{test.value} {test.unit}</p>
                          <Badge variant="outline" className={`text-[9px] ${STATUS_BADGE[test.status]?.class}`}>
                            {STATUS_BADGE[test.status]?.label}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    )
  }

  // Vista de test activo
  const Icon = selectedTest.icon
  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <button onClick={closeTest} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a tests
          </button>
          <h1 className="text-xl font-bold mt-2 flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {selectedTest.label}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-4">
        {/* Instrucciones */}
        <Card className="border-amber-500/20 bg-amber-950/10">
          <CardContent className="p-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              Cómo hacer el test
            </h3>
            <p className="text-xs text-muted-foreground mb-2">{selectedTest.description}</p>
            <div className="p-2 rounded bg-card/30 text-[10px] text-muted-foreground">
              <strong>📊 Evidencia:</strong> {selectedTest.evidence}
            </div>
          </CardContent>
        </Card>

        {/* Cámara */}
        <Card className="border-white/5 bg-gradient-card overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] max-w-sm mx-auto bg-black">
              {videoUrl ? (
                <video src={videoUrl} controls className="w-full h-full object-cover" />
              ) : (
                <video id="test-video" autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
              {state === 'recording' && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded bg-rose-500/80 text-white text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> REC
                </div>
              )}
              {state === 'idle' && !stream && (
                <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" /> Iniciando cámara...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controles */}
        {state === 'idle' && (
          <Button onClick={startRecording} disabled={!stream} className="w-full h-12 bg-rose-500 hover:bg-rose-600" size="lg">
            <Video className="h-5 w-5 mr-2" /> Empezar a grabar
          </Button>
        )}

        {state === 'recording' && (
          <Button onClick={stopRecording} className="w-full h-12" size="lg">
            <Square className="h-5 w-5 mr-2 fill-current" /> Detener grabación
          </Button>
        )}

        {state === 'recorded' && (
          <>
            <Card className="border-white/5 bg-gradient-card">
              <CardContent className="p-4">
                <label className="text-sm font-medium mb-2 block">
                  Resultado ({selectedTest.unit}) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step={selectedTest.unit === 'seg' ? '0.01' : '1'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={selectedTest.placeholder}
                  className="text-center text-2xl font-bold"
                />
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={resetTest} variant="outline" className="flex-1">Grabar de nuevo</Button>
              <Button onClick={handleSubmit} disabled={state === 'uploading' || !value} className="flex-1 bg-gradient-primary">
                {state === 'uploading' ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo…</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Guardar</>
                )}
              </Button>
            </div>
          </>
        )}

        {state === 'done' && (
          <Card className="border-emerald-500/30 bg-emerald-950/20">
            <CardContent className="p-6 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-3">
                <Check className="h-7 w-7" />
              </div>
              <h2 className="font-bold text-lg">¡Test guardado!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTest.label}: {value} {selectedTest.unit}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
