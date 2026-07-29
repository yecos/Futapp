'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft, Camera, Save, Loader2, User, Shield, Phone,
  Footprints, Ruler, Weight, AlertTriangle, Check, X,
  Zap, Target, Brain, Wind, Swords, Heart, Plus, Minus, TrendingUp, Flame, Crown,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface MyProfileViewProps {
  player: any | null
  teamName: string
  teamShortName: string
  userRole: string
  userId: string
  teamId: string
  userName: string
  userEmail: string
  userImage: string | null
}

export function MyProfileView({
  player, teamName, teamShortName, userRole, userId, teamId,
  userName, userEmail, userImage,
}: MyProfileViewProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(player?.photoUrl || userImage || null)

  // Si no tiene perfil de jugador, mostrar form para crearlo
  const [form, setForm] = useState({
    firstName: player?.firstName || userName.split(' ')[0] || '',
    lastName: player?.lastName || userName.split(' ').slice(1).join(' ') || '',
    jerseyNumber: player?.jerseyNumber || '',
    primaryPosition: player?.primaryPosition || 'MEDIOCAMPISTA',
    secondaryPosition: player?.secondaryPosition || '',
    age: player?.age || 25,
    dominantFoot: player?.dominantFoot || 'DIESTRO',
    height: player?.height || '',
    weight: player?.weight || '',
    phone: player?.phone || '',
    emergencyContact: player?.emergencyContact || '',
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP')
      return
    }

    // Validar tamaño (máx 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 3MB.')
      return
    }

    // Mostrar preview
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Subir
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('playerId', player?.id || '')

      const res = await fetch('/api/player/photo', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al subir foto')
      }

      const data = await res.json()
      setPhotoPreview(data.photoUrl)
      toast.success('Foto actualizada')
    } catch (err: any) {
      toast.error(err.message)
      // Revertir preview
      setPhotoPreview(player?.photoUrl || userImage || null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        jerseyNumber: form.jerseyNumber ? parseInt(String(form.jerseyNumber)) : 0,
        height: form.height ? parseInt(String(form.height)) : null,
        weight: form.weight ? parseInt(String(form.weight)) : null,
        teamId,
        userId,
        fullName: `${form.firstName} ${form.lastName}`,
      }

      const url = player?.id ? `/api/player/profile?playerId=${player.id}` : '/api/player/profile'
      const method = player?.id ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }

      toast.success('Perfil guardado correctamente')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const initials = (form.firstName[0] || '') + (form.lastName[0] || '')

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <h1 className="text-xl font-bold mt-2">Mi Perfil</h1>
          <p className="text-xs text-muted-foreground">{teamName} · {userRole}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-4">
        {/* === FOTO DE PERFIL === */}
        <Card className="border-white/5 bg-gradient-card">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Foto de perfil
            </h3>

            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Mi foto"
                    className="h-24 w-24 rounded-2xl object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl flex items-center justify-center text-2xl font-black bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-primary/30 text-primary-foreground">
                    {initials || <User className="h-8 w-8" />}
                  </div>
                )}

                {/* Badge dorsal */}
                {player?.jerseyNumber && (
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <span className="text-xs font-black text-primary">{player.jerseyNumber}</span>
                  </div>
                )}
              </div>

              {/* Botón subir */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  variant="outline"
                  className="w-full"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo…
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      {photoPreview ? 'Cambiar foto' : 'Subir foto'}
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1">
                  JPG, PNG o WebP · Máximo 3MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* === DATOS DE JUGADOR === */}
        <Card className="border-white/5 bg-gradient-card">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Datos deportivos
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="bg-card/50"
                />
              </div>
              <div>
                <Label>Apellido *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="bg-card/50"
                />
              </div>
              <div>
                <Label>Dorsal</Label>
                <Input
                  type="number"
                  value={form.jerseyNumber}
                  onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })}
                  placeholder="Auto"
                  className="bg-card/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Vacío = auto-asignado</p>
              </div>
              <div>
                <Label>Edad</Label>
                <Input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                  className="bg-card/50"
                />
              </div>
              <div>
                <Label>Posición principal</Label>
                <select
                  value={form.primaryPosition}
                  onChange={(e) => setForm({ ...form, primaryPosition: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-card/50 px-3 py-1 text-sm"
                >
                  <option value="PORTERO">Portero</option>
                  <option value="DEFENSA">Defensa</option>
                  <option value="MEDIOCAMPISTA">Mediocampista</option>
                  <option value="DELANTERO">Delantero</option>
                </select>
              </div>
              <div>
                <Label>Posición secundaria</Label>
                <select
                  value={form.secondaryPosition}
                  onChange={(e) => setForm({ ...form, secondaryPosition: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-card/50 px-3 py-1 text-sm"
                >
                  <option value="">Ninguna</option>
                  <option value="PORTERO">Portero</option>
                  <option value="DEFENSA">Defensa</option>
                  <option value="MEDIOCAMPISTA">Mediocampista</option>
                  <option value="DELANTERO">Delantero</option>
                </select>
              </div>
              <div>
                <Label>Pierna dominante</Label>
                <select
                  value={form.dominantFoot}
                  onChange={(e) => setForm({ ...form, dominantFoot: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-card/50 px-3 py-1 text-sm"
                >
                  <option value="DIESTRO">Diestro</option>
                  <option value="ZURDO">Zurdo</option>
                  <option value="AMBIDIESTRO">Ambidiestro</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* === DATOS FÍSICOS === */}
        <Card className="border-white/5 bg-gradient-card">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Ruler className="h-4 w-4 text-primary" />
              Datos físicos
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Altura (cm)</Label>
                <Input
                  type="number"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  placeholder="175"
                  className="bg-card/50"
                />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  placeholder="72"
                  className="bg-card/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* === CONTACTO === */}
        <Card className="border-white/5 bg-gradient-card">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Contacto
            </h3>
            <div className="space-y-3">
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="300 123 4567"
                  className="bg-card/50"
                />
              </div>
              <div>
                <Label>Contacto de emergencia</Label>
                <Input
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  placeholder="Nombre - Teléfono"
                  className="bg-card/50"
                />
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  El contacto de emergencia solo lo ven admin y cuerpo técnico
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* === RPG / GAMIFICACIÓN === */}
        {player && (
          <RpgStatsCard player={player} />
        )}

        {/* === GUARDAR === */}
        <Button
          onClick={handleSave}
          disabled={saving || !form.firstName || !form.lastName}
          size="lg"
          className="w-full bg-gradient-primary h-12"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar perfil
            </>
          )}
        </Button>
      </main>
    </div>
  )
}

// =====================================================
// COMPONENTE: Stats RPG con sliders para asignar puntos
// =====================================================

const STAT_CONFIG = [
  { key: 'basePAC', label: 'Ritmo', icon: Wind, color: 'text-sky-400', bg: 'bg-sky-500/20' },
  { key: 'baseSHO', label: 'Disparo', icon: Target, color: 'text-rose-400', bg: 'bg-rose-500/20' },
  { key: 'basePAS', label: 'Pase', icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { key: 'baseDRI', label: 'Regate', icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/20' },
  { key: 'baseDEF', label: 'Defensa', icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { key: 'basePHY', label: 'Físico', icon: Heart, color: 'text-teal-400', bg: 'bg-teal-500/20' },
] as const

function getLevel(totalPoints: number) {
  if (totalPoints >= 1000) return { name: 'Leyenda', icon: '👑', color: 'text-amber-400' }
  if (totalPoints >= 501) return { name: 'Estrella', icon: '🌟', color: 'text-purple-400' }
  if (totalPoints >= 301) return { name: 'Profesional', icon: '⭐', color: 'text-sky-400' }
  if (totalPoints >= 151) return { name: 'Semi-Pro', icon: '🥇', color: 'text-emerald-400' }
  if (totalPoints >= 51) return { name: 'Amateur', icon: '🥈', color: 'text-zinc-300' }
  return { name: 'Novato', icon: '🥉', color: 'text-orange-400' }
}

function RpgStatsCard({ player }: { player: any }) {
  const router = useRouter()
  const [allocations, setAllocations] = useState<Record<string, number>>({
    basePAC: 0, baseSHO: 0, basePAS: 0, baseDRI: 0, baseDEF: 0, basePHY: 0,
  })
  const [saving, setSaving] = useState(false)

  const statPoints = player.statPoints || 0
  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0)
  const remaining = statPoints - totalAllocated

  const adjust = (key: string, delta: number) => {
    setAllocations(prev => {
      const current = prev[key]
      const newVal = Math.max(0, current + delta)
      // Verificar tope (99)
      const currentValue = player[key] || 0
      if (currentValue + newVal > 99) {
        toast.error(`${key.replace('base', '')} no puede pasar de 99`)
        return prev
      }
      // Verificar puntos disponibles
      const newTotal = Object.entries(prev)
        .filter(([k]) => k !== key)
        .reduce((a, [, v]) => a + v, 0) + newVal
      if (newTotal > statPoints) {
        toast.error('No tienes más puntos disponibles')
        return prev
      }
      return { ...prev, [key]: newVal }
    })
  }

  const handleSave = async () => {
    if (totalAllocated === 0) {
      toast.error('Asigna al menos 1 punto')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/player/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pac: allocations.basePAC,
          sho: allocations.baseSHO,
          pas: allocations.basePAS,
          dri: allocations.baseDRI,
          def: allocations.baseDEF,
          phy: allocations.basePHY,
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
        throw new Error(err.error || 'Error al asignar puntos')
      }

      const data = await res.json()
      toast.success(`${totalAllocated} puntos asignados! ${data.message}`)
      setAllocations({ basePAC: 0, baseSHO: 0, basePAS: 0, baseDRI: 0, baseDEF: 0, basePHY: 0 })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const level = getLevel(player.totalPointsEarned || 0)
  const rating = Math.round(
    (player.basePAC + player.baseSHO + player.basePAS + player.baseDRI + player.baseDEF + player.basePHY) / 6
  )

  return (
    <Card className="border-primary/20 bg-gradient-card">
      <CardContent className="p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Estadísticas RPG
        </h3>

        {/* Header con rating y nivel */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Rating</p>
            <p className="text-2xl font-black text-primary">{rating}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Nivel</p>
            <p className={`text-lg font-bold ${level.color}`}>
              {level.icon} {level.name}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/10 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Puntos</p>
            <p className="text-2xl font-black text-orange-400">{player.totalPointsEarned || 0}</p>
          </div>
        </div>

        {/* Racha */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-card/50 flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <div>
              <p className="text-[10px] text-muted-foreground">Racha actual</p>
              <p className="text-sm font-bold">{player.streak || 0} partidos</p>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-card/50 flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-muted-foreground">Mejor racha</p>
              <p className="text-sm font-bold">{player.maxStreak || 0} partidos</p>
            </div>
          </div>
        </div>

        {/* Stats con sliders */}
        <div className="space-y-2">
          {STAT_CONFIG.map((stat) => {
            const Icon = stat.icon
            const base = player[stat.key] || 0
            const allocating = allocations[stat.key]
            const total = base + allocating
            return (
              <div key={stat.key} className="p-3 rounded-lg bg-card/30">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{stat.label}</span>
                      <span className={`text-lg font-bold tabular-nums ${allocating > 0 ? stat.color : ''}`}>
                        {total}
                        {allocating > 0 && (
                          <span className="text-xs text-emerald-400 ml-1">(+{allocating})</span>
                        )}
                      </span>
                    </div>
                    {/* Barra visual */}
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stat.bg.replace('/20', '')} transition-all`}
                        style={{ width: `${Math.min(100, (total / 99) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Botones + y - */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => adjust(stat.key, 1)}
                      disabled={remaining <= 0 || saving}
                      className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => adjust(stat.key, -1)}
                      disabled={allocating === 0 || saving}
                      className="flex h-6 w-6 items-center justify-center rounded bg-muted/30 text-muted-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer con puntos disponibles y botón asignar */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Puntos disponibles</p>
            <p className="text-2xl font-black text-primary">{remaining}</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || totalAllocated === 0}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Asignando…</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" />Asignar {totalAllocated} pts</>
            )}
          </Button>
        </div>

        {statPoints === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-3 italic">
            💡 Haz check-in en eventos para ganar puntos (1 por entrenamiento, 3 por partido)
          </p>
        )}
      </CardContent>
    </Card>
  )
}
