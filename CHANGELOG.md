# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto adhera a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Planeado
- Módulo de Lesiones y Bienestar
- Entrenamientos detallados
- Galería multimedia
- Migración de imágenes a Supabase Storage
- Notificaciones push (Web Push API)
- Integración con Wompi para pagos automáticos

## [2.0.0] — 2026-07-12

### ✨ Agregado
- 🔐 **Autenticación con Google** — NextAuth.js v4 + Google OAuth
- 👥 **6 roles con permisos diferenciados (RBAC)**: ADMIN, ENTRENADOR, JUGADOR, CUERPO_TECNICO, ACUDIENTE, SEGUIDOR
- ☁️ **Base de datos persistente en la nube** — Migración de SQLite/localStorage a PostgreSQL (Supabase)
- 📋 **16 modelos Prisma**: User, Team, TeamMembership, Player, Event, Attendance, Callup, MatchStat, Announcement, AnnouncementRead, Standing, Payment, PaymentReceipt, Notification, InviteToken, + modelos de NextAuth Adapter
- 💰 **Módulo de Pagos completo**:
  - Crear cobros (mensualidad, arbitraje, uniforme, inscripción, evento, multa, otro)
  - QR Bancolombia + datos bancarios visibles para jugadores
  - Subida de comprobantes (imagen o PDF, máx 5MB)
  - Verificación manual por el admin (aprobar/rechazar con motivo)
  - Recurrencia mensual/semetral/anual con generación automática
  - Dashboard de recaudación con KPIs (recaudado, pendiente, por verificar)
- 🔔 **Notificaciones in-app** para eventos (nuevo cobro, comprobante subido, pago verificado/rechazado)
- 🔗 **Invitaciones por link** con rol predefinido (token único con expiración)
- ✅ **Aprobación manual** de usuarios que entran sin invitación (cola de pendientes)
- 🚀 **Onboarding automático** del primer usuario (se convierte en admin y configura el equipo)
- ⏰ **Vercel Cron Jobs** para recordatorios automáticos:
  - Diario 9am: recordatorios de pago (3 días antes, día del vencimiento, vencido)
  - Día 1 del mes: generación de cobros recurrentes
- 🛡️ **Middleware de autenticación** en Edge runtime (protege todas las rutas)
- 📚 **Documentación completa** de setup en `docs/SETUP.md`

### 🛠 Cambios
- Migración de SQLite a PostgreSQL (Supabase) en `prisma/schema.prisma`
- `src/app/page.tsx` convertido a Server Component con verificación de sesión
- `src/app/layout.tsx` envuelto con `<SessionProvider>` y `<ThemeProvider>`
- Eliminada la dependencia de Zustand como fuente de verdad (ahora es solo UI state)
- `package.json`: añadidas dependencias `@auth/prisma-adapter`, `@supabase/supabase-js`, `next-auth`
- Variables de entorno: añadidas 9 nuevas (Supabase, Google, CRON_SECRET, etc.)
- `vercel.json`: configuración de 2 cron jobs
- README.md actualizado con la nueva arquitectura

### 🗑 Eliminado
- `output: "standalone"` de `next.config.ts`
- `typescript: { ignoreBuildErrors: true }` de `next.config.ts`
- Dependencias no usadas: `@dnd-kit/*`, `@tanstack/react-table`, `z-ai-web-dev-sdk`, etc.

## [1.0.0] — 2026-07-12

### ✨ Agregado
- 🏠 **Vista Inicio**: panel con próximo partido, evento, últimos resultados, avisos fijados, tabla de posiciones y estado de la plantilla
- 📅 **Vista Calendario**: lista de entrenamientos, partidos, torneos y reuniones con confirmación de asistencia (Asistiré / Tal vez / No)
- 👥 **Vista Plantilla**: perfiles de jugadores con estadísticas, filtros por posición/estado y buscador
- 📋 **Vista Convocatorias**: cancha gráfica interactiva con formaciones seleccionables (4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 5-3-2), titulares, suplentes y capitán
- 🏆 **Vista Resultados**: marcadores, estadísticas individuales por jugador (goles, asistencias, tarjetas, atajadas), figura del partido y ranking de goleadores
- 🔔 **Vista Avisos**: anuncios con categorías (general, convocatoria, evento, urgente), fijados y confirmación de lectura
- 🎨 Tema visual verde futbolero con soporte dark mode
- 📱 Diseño mobile-first con sidebar desktop y bottom nav móvil
- 💾 Persistencia local con Zustand + localStorage
- 🔄 Datos semilla realistas: equipo Los Halcones FC, 18 jugadores, 12 eventos, tabla de posiciones de 8 equipos
- ⚡ PWA-ready: manifest configurado, theme color, instalable en móvil
- 🛡️ Stack completo: Next.js 16, TypeScript 5, Tailwind CSS 4, shadcn/ui, Prisma 6, Zustand 5

### 🛠 Cambios
- `next.config.ts` simplificado (sin `output: "standalone"`) para compatibilidad con Vercel
- `package.json` renombrado de `nextjs_tailwind_shadcn_ts` a `futapp`
- Scripts de `package.json` limpiados (sin referencias a standalone)
- Dependencias no usadas removidas (z-ai-web-dev-sdk, @dnd-kit/*, @tanstack/react-table, etc.)

[Unreleased]: https://github.com/yecos/Futapp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yecos/Futapp/releases/tag/v1.0.0
