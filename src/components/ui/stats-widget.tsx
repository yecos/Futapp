'use client'

import { AnimatedCounter } from './animated-counter'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface StatsWidgetProps {
  icon: LucideIcon
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gold'
  index?: number
  className?: string
}

const VARIANT_STYLES = {
  primary: {
    bg: 'from-emerald-900/30 to-emerald-950/20',
    icon: 'bg-emerald-500/20 text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/20',
    accent: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  success: {
    bg: 'from-green-900/30 to-green-950/20',
    icon: 'bg-green-500/20 text-green-400',
    glow: 'group-hover:shadow-green-500/20',
    accent: 'text-green-400',
    bar: 'bg-green-500',
  },
  warning: {
    bg: 'from-amber-900/30 to-amber-950/20',
    icon: 'bg-amber-500/20 text-amber-400',
    glow: 'group-hover:shadow-amber-500/20',
    accent: 'text-amber-400',
    bar: 'bg-amber-500',
  },
  danger: {
    bg: 'from-red-900/30 to-red-950/20',
    icon: 'bg-red-500/20 text-red-400',
    glow: 'group-hover:shadow-red-500/20',
    accent: 'text-red-400',
    bar: 'bg-red-500',
  },
  info: {
    bg: 'from-sky-900/30 to-sky-950/20',
    icon: 'bg-sky-500/20 text-sky-400',
    glow: 'group-hover:shadow-sky-500/20',
    accent: 'text-sky-400',
    bar: 'bg-sky-500',
  },
  gold: {
    bg: 'from-yellow-900/30 to-amber-950/20',
    icon: 'bg-yellow-500/20 text-yellow-400',
    glow: 'group-hover:shadow-yellow-500/20',
    accent: 'text-yellow-400',
    bar: 'bg-yellow-500',
  },
}

export function StatsWidget({
  icon: Icon,
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  variant = 'primary',
  index = 0,
  className,
}: StatsWidgetProps) {
  const styles = VARIANT_STYLES[variant]
  const [barWidth, setBarWidth] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setBarWidth(100), 100 + index * 80)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [index])

  return (
    <div
      ref={ref}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/5',
        'bg-gradient-to-br backdrop-blur-sm',
        'transition-all duration-300 hover:scale-[1.02] hover:border-white/10',
        'shadow-lg hover:shadow-2xl',
        styles.bg,
        styles.glow,
        'animate-fade-in-up p-4',
        className
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Glow decorativo */}
      <div className={cn(
        'absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40',
        styles.bar
      )} />

      <div className="relative">
        {/* Icon */}
        <div className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3',
          styles.icon
        )}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Label */}
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
          {label}
        </p>

        {/* Value */}
        <p className="text-3xl font-black tabular-nums text-foreground">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
          />
        </p>

        {/* Trend */}
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={cn(
              'font-bold',
              trend.isPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            {trend.label && (
              <span className="text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}

        {/* Barra de progreso animada */}
        <div className="mt-3 h-1 rounded-full bg-black/30 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-1000 ease-out', styles.bar)}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  )
}
