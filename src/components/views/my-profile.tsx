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
