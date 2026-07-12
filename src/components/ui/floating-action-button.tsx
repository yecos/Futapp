'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Plus, X, Calendar, CreditCard, Bell, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FabAction {
  icon: React.ElementType
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'success' | 'warning' | 'info'
}

interface FloatingActionButtonProps {
  actions?: FabAction[]
}

const DEFAULT_ACTIONS: FabAction[] = [
  { icon: Calendar, label: 'Nuevo evento', href: '/calendario', variant: 'info' },
  { icon: Bell, label: 'Nuevo aviso', href: '/avisos', variant: 'warning' },
  { icon: Users, label: 'Invitar miembro', href: '/admin/miembros', variant: 'primary' },
  { icon: CreditCard, label: 'Crear cobro', href: '/admin/pagos', variant: 'success' },
]

const VARIANT_COLORS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  info: 'bg-sky-500 text-white hover:bg-sky-600',
}

export function FloatingActionButton({ actions = DEFAULT_ACTIONS }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleAction = (action: FabAction) => {
    if (action.href) router.push(action.href)
    if (action.onClick) action.onClick()
    setOpen(false)
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 lg:bottom-6 lg:right-6">
      {/* Actions que se despliegan */}
      <div className={cn(
        'absolute bottom-16 right-0 flex flex-col gap-2 items-end',
        'transition-all duration-300',
        open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}>
        {actions.map((action, i) => {
          const Icon = action.icon
          return (
            <div
              key={i}
              className="flex items-center gap-2"
              style={{
                transitionDelay: open ? `${i * 50}ms` : `${(actions.length - i) * 30}ms`,
              }}
            >
              <span className="px-3 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs font-medium shadow-lg whitespace-nowrap">
                {action.label}
              </span>
              <button
                onClick={() => handleAction(action)}
                className={cn(
                  'h-11 w-11 rounded-full shadow-lg flex items-center justify-center',
                  'transition-all duration-300 hover:scale-110',
                  VARIANT_COLORS[action.variant || 'primary']
                )}
              >
                <Icon className="h-5 w-5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Botón principal */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'h-14 w-14 rounded-full shadow-2xl flex items-center justify-center',
          'bg-gradient-primary text-primary-foreground',
          'transition-all duration-300 hover:scale-110',
          'animate-glow',
          open && 'rotate-45'
        )}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 -z-10 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
