# ⚽ Futapp — Gestión Deportiva para Equipos de Fútbol

[![Deploy with Vercel](https://img.shields.io/badge/Deploy%20with-Vercel-000?logo=vercel&logoColor=white)](https://vercel.com/new)
[![Next.js](https://img.shields.io/badge/Next.js%2016-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Centro de organización, comunicación y seguimiento deportivo para equipos de fútbol aficionados o semi-profesionales. Multi-usuario con login de Google, 6 roles, pagos con QR Bancolombia y recordatorios automáticos.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Demo](#-demo)
- [Stack Tecnológico](#-stack-tecnológico)
- [Inicio Rápido](#-inicio-rápido)
- [Configuración completa](#-configuración-completa)
- [Roles y permisos](#-roles-y-permisos)
- [Módulo de Pagos](#-módulo-de-pagos)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Licencia](#-licencia)

---

## ✨ Características

### 🏆 v2.0 — Multi-usuario completo

- 🔐 **Login con Google** — NextAuth.js + Google OAuth
- 👥 **6 roles con permisos diferenciados** (RBAC): admin, entrenador, jugador, cuerpo técnico, acudiente, seguidor
- ☁️ **Base de datos en la nube** (Supabase + PostgreSQL) — datos persistentes y compartidos
- 💰 **Módulo de Pagos completo**:
  - Crear cobros (mensualidades, arbitraje, uniformes, multas, etc.)
  - QR Bancolombia + datos bancarios visibles para jugadores
  - Subida de comprobantes (foto o PDF)
  - Verificación manual por el admin
  - Recordatorios automáticos (3 días antes, día del vencimiento, vencido)
  - Dashboard de recaudación
- 🔔 **Notificaciones in-app** para eventos importantes
- 🔗 **Invitaciones por link** con rol predefinido
- ✅ **Aprobación manual** de usuarios que entran sin invitación

### ⚽ v1.0 — MVP (mantenida)

- 🏠 **Inicio**: panel con próximos eventos, resultados, avisos
- 📅 **Calendario** con confirmación de asistencia
- 👥 **Plantilla** de jugadores con perfiles y estadísticas
- 📋 **Convocatorias** con cancha gráfica interactiva
- 🏆 **Resultados** con estadísticas por partido
- 🔔 **Avisos** del cuerpo técnico con confirmación de lectura

---

## 🎬 Demo

La app se despliega automáticamente en Vercel desde `main`:
**https://futapp-seven.vercel.app**

El primer usuario que se registra se convierte automáticamente en **ADMIN** y debe configurar el equipo en el onboarding.

---

## 🛠 Stack Tecnológico

| Categoría | Tecnología |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Lenguaje** | TypeScript 5 estricto |
| **Estilos** | Tailwind CSS 4 + shadcn/ui (New York) |
| **Base de datos** | PostgreSQL (Supabase) |
| **ORM** | Prisma 6 |
| **Auth** | NextAuth.js v4 + Google OAuth |
| **Estado** | Zustand (UI) + Server Components |
| **Iconos** | Lucide React |
| **Notificaciones** | Sonner |
| **Cron Jobs** | Vercel Cron (recordatorios automáticos) |
| **Hosting** | Vercel |
| **PWA** | Manifest configurado, instalable en móvil |

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js ≥ 20
- Cuenta en Supabase (gratis)
- Cuenta en Google Cloud Console (gratis)

### Instalación local

```bash
# 1. Clona el repo
git clone https://github.com/yecos/Futapp.git
cd Futapp

# 2. Instala dependencias
npm install

# 3. Configura variables de entorno
cp .env.example .env
# Edita .env con tus credenciales (ver docs/SETUP.md)

# 4. Inicializa la base de datos
npx prisma db push

# 5. (Opcional) Carga datos demo
npm run db:seed

# 6. Inicia el servidor
npm run dev
```

Abre http://localhost:3000

---

## 🔧 Configuración completa

Para configurar Supabase, Google OAuth y Vercel, lee la guía paso a paso:
**[docs/SETUP.md](docs/SETUP.md)** (~30-45 minutos)

---

## 👥 Roles y permisos

| Rol | Qué puede hacer |
|---|---|
| **👑 Admin** | Configura equipo, invita usuarios, gestiona pagos, ve todo |
| **🧢 Entrenador** | Crea eventos, convocatorias, alineaciones |
| **👤 Jugador** | Confirma asistencia, paga, ve su info |
| **🩺 Cuerpo Técnico** | Registra estadísticas y lesiones |
| **👨‍👦 Acudiente** | Gestiona a su hijo (categorías infantiles) |
| **👀 Seguidor** | Solo ve resultados y calendario público |

Ver matriz completa de permisos en `src/lib/permissions.ts`.

---

## 💰 Módulo de Pagos

### Flujo del admin
1. Ve a **Gestión de Pagos** → **Nuevo cobro**
2. Elige tipo (mensualidad, arbitraje, uniforme, multa, etc.)
3. Define monto, vencimiento y a quiénes aplica (todo el equipo o jugadores específicos)
4. Los jugadores reciben notificación automática
5. **Recordatorios automáticos**: 3 días antes, día del vencimiento, vencido

### Flujo del jugador
1. Ve a **Mis Pagos** → ve cobros pendientes
2. Click en **Ver datos para pagar** → aparece info bancaria (Bancolombia)
3. Transfiere por PSE, Nequi, app Bancolombia o QR
4. Click en **Subir comprobante** → sube foto o PDF
5. El admin recibe notificación, revisa y aprueba

### Flujo del admin (verificación)
1. Ve a **Gestión de Pagos** → verás badge de comprobantes pendientes
2. Click en **Revisar** → ves la imagen del comprobante
3. Click **Aprobar** o **Rechazar** (con motivo)
4. El jugador recibe notificación automática

---

## 📁 Estructura del Proyecto

```
Futapp/
├── prisma/
│   ├── schema.prisma          # 16 modelos de DB (PostgreSQL)
│   ├── seed.ts                # Datos demo
│   └── migrations/
├── docs/
│   └── SETUP.md               # Guía completa de configuración
├── src/
│   ├── app/
│   │   ├── login/             # Login con Google
│   │   ├── onboarding/        # Setup inicial del admin
│   │   ├── pending/           # Espera aprobación
│   │   ├── invite/[token]/    # Aceptar invitación
│   │   ├── pagos/             # Vista de pagos del jugador
│   │   ├── admin/
│   │   │   ├── equipo/        # Configuración del equipo
│   │   │   ├── miembros/      # Gestión de miembros
│   │   │   └── pagos/         # Dashboard de pagos
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── team/
│   │       ├── payments/      # CRUD + receipts + verify
│   │       ├── members/
│   │       ├── invites/
│   │       └── cron/          # Recordatorios + recurrencias
│   ├── components/
│   │   ├── admin/             # team-settings, members-manager
│   │   ├── payments/          # player + admin views
│   │   ├── auth/              # require-role, invite-landing
│   │   ├── providers/         # SessionProvider + ThemeProvider
│   │   └── ui/                # shadcn/ui
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── auth-server.ts     # requireSession, requireRole
│   │   ├── permissions.ts     # RBAC helpers
│   │   ├── db.ts              # Prisma client
│   │   └── validations/       # Zod schemas
│   └── middleware.ts          # Protege rutas
├── .env.example
├── vercel.json                # Cron jobs config
└── package.json
```

---

## 📄 Licencia

MIT — ver [LICENSE](LICENSE)

---

## 📖 Documentación

- [Guía de configuración](docs/SETUP.md)
- [Changelog](CHANGELOG.md)
- [Cómo contribuir](CONTRIBUTING.md)

---

<div align="center">

**⚽ Hecho con pasión por el fútbol y la tecnología**

</div>
