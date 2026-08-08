'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Video, Square, Check, AlertCircle, Loader2, Upload, Activity } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface VerticalJumpTestClientProps {
  freePlayerId: string
  freePlayerName: string
}

export function VerticalJumpTestClient({ freePlayerId, freePlayerName }: VerticalJumpTestClientProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recordingStartRef = useRef<number>(0)

  const [state, setState] = useState<'idle' | 'recording' | 'recorded' | 'uploading' | 'done'>('idle')
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [jumpHeight, setJumpHeight] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)

  // Inicializar cámara al montar
  useEffect(() => {
    let mounted = true

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'portrait', width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: false,
        })
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraReady(true)
      } catch (e: any) {
        setError('No se pudo acceder a la cámara: ' + e.message)
      }
    }

    initCamera()

    return () => {
      mounted = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const startRecording = () => {
    if (!streamRef.current) {
      toast.error('Cámara no disponible')
      return
    }

    chunksRef.current = []
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp9' })
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setVideoBlob(blob)
      setVideoUrl(URL.createObjectURL(blob))
      setState('recorded')
    }
    mr.start()
    recordingStartRef.current = Date.now()
    setState('recording')
    toast.info('Grabando... Salta ahora!')
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      // Detener stream para que el preview se congele
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    // Si mediaRecorder no está seteado, usar el que creamos en startRecording
    // Re-creamos lógica: usamos variable local
  }

  // Versión corregida: guardar mediaRecorder en ref
  const startRecordingV2 = () => {
    if (!streamRef.current) {
      toast.error('Cámara no disponible')
      return
    }

    chunksRef.current = []
    try {
      const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp9' })
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setVideoBlob(blob)
        setVideoUrl(URL.createObjectURL(blob))
        setState('recorded')
      }
      mr.start()
      recordingStartRef.current = Date.now()
      setState('recording')
      toast.info('Grabando... ¡Salta ahora!')
    } catch (e: any) {
      toast.error('Error al grabar: ' + e.message)
    }
  }

  const stopRecordingV2 = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    // No detenemos el stream para permitir re-grabar
  }

  const resetTest = async () => {
    setVideoBlob(null)
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(null)
    setJumpHeight('')
    setState('idle')

    // Reiniciar cámara
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'portrait', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraReady(true)
    } catch (e: any) {
      setError('No se pudo reiniciar la cámara: ' + e.message)
    }
  }

  const handleSubmit = async () => {
    if (!videoBlob) {
      toast.error('Graba el video primero')
      return
    }
    if (!jumpHeight || parseFloat(jumpHeight) <= 0) {
      toast.error('Ingresa la altura del salto en cm')
      return
    }

    setState('uploading')
    try {
      // Convertir blob a base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string

        const res = await fetch('/api/test-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'SALTO_VERTICAL',
            value: parseFloat(jumpHeight),
            unit: 'cm',
            videoUrl: base64,
            deviceInfo: navigator.userAgent,
            recordedAt: new Date(recordingStartRef.current).toISOString(),
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
        toast.success(`Salto de ${jumpHeight}cm guardado!`)
        setTimeout(() => router.push('/mi-carta'), 1500)
      }
      reader.readAsDataURL(videoBlob)
    } catch (err: any) {
      toast.error(err.message)
      setState('recorded')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <Link href="/mi-carta" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Mi carta
          </Link>
          <h1 className="text-xl font-bold mt-2 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Test de Salto Vertical
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-4">
        {error && (
          <Card className="border-rose-500/30 bg-rose-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <p className="text-sm text-rose-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Instrucciones */}
        <Card className="border-amber-500/20 bg-amber-950/10">
          <CardContent className="p-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              Cómo hacer el test
            </h3>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Coloca el celular vertical a 2-3 metros de distancia</li>
              <li>Asegúrate de que se vea tu cuerpo completo</li>
              <li>Píde a alguien que grabe, o usa un trípode</li>
              <li>Salta lo más alto que puedas sin carrera</li>
              <li>Mide la altura del salto (puedes usar una pared como referencia)</li>
              <li>El video debe grabarse en vivo, no se puede subir desde la galería</li>
            </ol>
          </CardContent>
        </Card>

        {/* Cámara / Video preview */}
        <Card className="border-white/5 bg-gradient-card overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] max-w-sm mx-auto bg-black">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Indicador de grabación */}
              {state === 'recording' && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded bg-rose-500/80 text-white text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  REC
                </div>
              )}

              {/* Overlay si no hay cámara */}
              {!cameraReady && !videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Iniciando cámara...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controles según estado */}
        {state === 'idle' && (
          <Button
            onClick={startRecordingV2}
            disabled={!cameraReady}
            className="w-full h-12 bg-rose-500 hover:bg-rose-600"
            size="lg"
          >
            <Video className="h-5 w-5 mr-2" />
            Empezar a grabar
          </Button>
        )}

        {state === 'recording' && (
          <Button
            onClick={stopRecordingV2}
            className="w-full h-12"
            size="lg"
          >
            <Square className="h-5 w-5 mr-2 fill-current" />
            Detener grabación
          </Button>
        )}

        {state === 'recorded' && (
          <>
            <Card className="border-white/5 bg-gradient-card">
              <CardContent className="p-4">
                <label className="text-sm font-medium mb-2 block">
                  Altura del salto (cm) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  step="0.1"
                  value={jumpHeight}
                  onChange={(e) => setJumpHeight(e.target.value)}
                  placeholder="Ej: 45"
                  className="w-full h-12 rounded-lg bg-card/50 border border-white/10 px-4 text-lg font-bold text-center"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Mide la diferencia entre tu alcance con mano estirada sin saltar y tu alcance máximo al saltar
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={resetTest} variant="outline" className="flex-1" disabled={state === 'uploading'}>
                Grabar de nuevo
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={state === 'uploading' || !jumpHeight}
                className="flex-1 bg-gradient-primary"
              >
                {state === 'uploading' ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo…</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Guardar resultado</>
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
                Tu salto de {jumpHeight}cm fue registrado. Redirigiendo a tu carta...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info científica */}
        <Card className="border-white/5 bg-card/30">
          <CardContent className="p-4">
            <h4 className="text-xs font-bold mb-1">📊 Evidencia científica</h4>
            <p className="text-[10px] text-muted-foreground">
              El salto vertical con celular está validado contra Optojump con correlación &gt;0.94
              en múltiples estudios (MDPI Applied Sciences). Es el test con mayor evidencia
              científica para medir con cámara de celular.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
