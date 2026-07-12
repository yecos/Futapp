'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar, Users, ClipboardList, Trophy, Bell, CreditCard,
  Settings, Shield, LogOut,
} from 'lucide-react'
import { ROLE_LABELS, ROLE_ICONS } from '@/lib/permissions'
import { signOut } from 'next-auth/react'

interface DashboardViewProps {
  teamName: string
  teamShortName: string
}

export function DashboardView({ teamName, teamShortName }: DashboardViewProps) {
  const { data: session } = useSession()
  const role = session?.user?.role as any || 'SEGUIDOR'
  const isAdmin = role === 'ADMIN'

  const menuItems = [
    { href: '/', icon: Calendar, label: 'Calendario', desc: 'Entrenamientos, partidos y eventos' },
    { href: '/', icon: Users, label: 'Plantilla', desc: 'Jugadores y perfiles' },
    { href: '/', icon: ClipboardList, label: 'Convocatorias', desc: 'Alineaciones y formaciones' },
    { href: '/', icon: Trophy, label: 'Resultados', desc: 'Partidos y estadísticas' },
    { href: '/', icon: Bell, label: 'Avisos', desc: 'Anuncios del equipo' },
    { href: '/pagos', icon: CreditCard, label: 'Mis Pagos', desc: 'Mensualidades y cobros' },
  ]

  if (isAdmin) {
    menuItems.push(
      { href: '/admin/equipo', icon: Settings, label: 'Configuración', desc: 'Datos del equipo y banco' },
      { href: '/admin/pagos', icon: CreditCard, label: 'Gestión de Pagos', desc: 'Crear y verificar cobros' },
      { href: '/admin/miembros', icon: Users, label: 'Miembros', desc: 'Invitar y aprobar usuarios' },
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">{teamName}</h1>
                <p className="text-xs text-primary-foreground/80">{teamShortName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-primary-foreground/80">
                  {ROLE_ICONS[role]} {ROLE_LABELS[role]}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-primary-foreground/15"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">¡Hola, {session?.user?.name?.split(' ')[0]}! 👋</h2>
          <p className="text-sm text-muted-foreground">
            Bienvenido a Futapp. Selecciona una opción del menú.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.label} href={item.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">{item.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Estado de configuración */}
        {isAdmin && (
          <Card className="mt-6 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <Settings className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Configuración del equipo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Personaliza los datos del equipo, colores, escudo e información bancaria para recibir pagos.
                </p>
                <Link href="/admin/equipo">
                  <Button size="sm" variant="outline" className="mt-2">
                    Ir a configuración
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
