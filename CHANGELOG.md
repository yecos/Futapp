# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto adhera a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Planeado
- Autenticación multi-usuario (NextAuth.js)
- Migración a Supabase (PostgreSQL + Realtime + Storage)
- Pagos y administración
- Lesiones y bienestar
- Entrenamientos detallados
- Galería multimedia
- Notificaciones push

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
