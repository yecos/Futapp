# ⚽ Futapp — Gestión Deportiva para Equipos de Fútbol

[![Deploy with Vercel](https://img.shields.io/badge/Deploy%20with-Vercel-000?logo=vercel&logoColor=white)](https://vercel.com/new)
[![Next.js](https://img.shields.io/badge/Next.js%2016-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Centro de organización, comunicación y seguimiento deportivo para equipos de fútbol aficionados o semi-profesionales. Diseñada alrededor de **3 acciones que el equipo realiza constantemente**: ver el próximo evento, confirmar asistencia y consultar la convocatoria.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Demo](#-demo)
- [Stack Tecnológico](#-stack-tecnológico)
- [Inicio Rápido](#-inicio-rápido)
- [Despliegue en Vercel](#-despliegue-en-vercel)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Vistas de la Aplicación](#-vistas-de-la-aplicación)
- [Tipos de Usuario](#-tipos-de-usuario)
- [Base de Datos](#-base-de-datos)
- [Personalización](#-personalización)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### MVP actual (v1.0)

- 🏠 **Inicio** — Panel con próximo partido, próximo evento, confirmaciones en vivo, últimos resultados, avisos fijados, tabla de posiciones y estado de la plantilla.
- 📅 **Calendario** — Entrenamientos, partidos, torneos, reuniones y eventos con confirmación de asistencia (**Asistiré / Tal vez / No**) y contadores en tiempo real.
- 👥 **Plantilla** — Perfiles individuales con foto, dorsal, posición, edad, pierna dominante, datos físicos, contacto de emergencia, estadísticas y estado (disponible / lesionado / suspendido / ausente).
- 📋 **Convocatorias** — Selección de convocados, titulares y suplentes con **cancha gráfica interactiva** y formaciones (4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 5-3-2). Asignación de capitán y publicación automática del aviso.
- 🏆 **Resultados** — Registro de marcador, goles, asistencias, minutos jugados, tarjetas, atajadas, tiros y figura del partido. Estadísticas de temporada y ranking de goleadores.
- 🔔 **Avisos** — Anuncios del cuerpo técnico con categorías (general, convocatoria, evento, urgente), fijados, confirmación de lectura y contador de lecturas.

### Próximamente (Roadmap)

- 💰 Pagos y administración (mensualidades, arbitraje, uniformes, multas)
- 🩹 Lesiones y bienestar (con privacidad médica)
- 🏋️ Entrenamientos detallados (objetivo, calentamiento, ejercicios, esfuerzo percibido)
- 📸 Galería y comunidad (fotos, videos, jugador de la semana, cumpleaños)
- 🔐 Autenticación multi-usuario (admin, entrenador, jugador, cuerpo técnico, acudiente, seguidor)
- 📱 Notificaciones push para convocatorias y recordatorios
- ☁️ Migración a Supabase para datos en la nube

---

## 🎬 Demo

La aplicación incluye datos semilla realistas del equipo **Los Halcones FC** (Liga Municipal Senior Amateur):

- 18 jugadores con perfiles, posiciones y estadísticas diversas
- 12 eventos (entrenamientos, 4 partidos completados, 2 próximos, reunión, torneo)
- Tabla de posiciones de 8 equipos (Halcones FC 2.º con 23 pts)
- 4 avisos (2 fijados, 3 sin leer)
- 1 convocatoria con alineación 4-3-3 completa
- Estadísticas de los últimos 3 partidos

> **Tip:** Todos los cambios (confirmar asistencia, editar convocatoria, registrar estadísticas) se guardan en `localStorage` del navegador. Para reiniciar los datos, borra el almacenamiento del sitio.

---

## 🛠 Stack Tecnológico

| Categoría | Tecnología |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **Lenguaje** | [TypeScript 5](https://www.typescriptlang.org) |
| **Estilos** | [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (New York) |
| **Estado** | [Zustand 5](https://github.com/pmndrs/zustand) con persistencia en `localStorage` |
| **Base de datos** | [Prisma 6](https://www.prisma.io) + SQLite (configurado, listo para usar) |
| **Iconos** | [Lucide React](https://lucide.dev) |
| **Notificaciones** | [Sonner](https://sonner.emilkowal.ski) |
| **Fechas** | [date-fns 4](https://date-fns.org) |
| **Formularios** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **PWA** | Manifest configurado, instalable en móvil |

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** ≥ 20.0.0 — [Descargar](https://nodejs.org/)
- **bun** (opcional, recomendado) — [Instalar](https://bun.sh/)

### Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/yecos/Futapp.git
cd Futapp

# 2. Instala dependencias (elige una opción)
bun install        # recomendado, más rápido
# o
npm install

# 3. Configura variables de entorno
cp .env.example .env

# 4. Inicializa la base de datos SQLite
bun run db:push
# o: npx prisma db push

# 5. Inicia el servidor de desarrollo
bun run dev
# o: npm run dev
```

Abre **http://localhost:3000** en tu navegador. Verás la pantalla de carga y luego el dashboard de Los Halcones FC.

---

## ☁️ Despliegue en Vercel

La forma más rápida de tener Futapp en producción es con Vercel:

1. **Sube el repo a GitHub** (si no lo has hecho)
2. Ve a [vercel.com/new](https://vercel.com/new)
3. Importa el repositorio `yecos/Futapp`
4. **Framework Preset:** Next.js (autodetectado)
5. **Environment Variables** — añade:
   | Nombre | Valor |
   |---|---|
   | `DATABASE_URL` | `file:./db/custom.db` |
6. Click **Deploy**

En ~2 minutos tendrás la app en producción con URL pública tipo `futapp-seven.vercel.app`.

> **Nota:** SQLite con `file:./db/custom.db` funciona para demos en Vercel porque los datos están en `localStorage`. Para multi-usuario real, migra a Supabase o PostgreSQL (ver [Roadmap](#-roadmap)).

---

## 📁 Estructura del Proyecto

```
Futapp/
├── prisma/
│   └── schema.prisma              # Esquema de base de datos
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── logo.svg
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── api/route.ts           # API route de ejemplo
│   │   ├── globals.css            # Estilos globales + tema verde futbolero
│   │   ├── layout.tsx             # Layout raíz con metadatos
│   │   └── page.tsx               # SPA con navegación entre vistas
│   ├── components/
│   │   ├── app/                   # Componentes de la app
│   │   │   ├── football-field.tsx # Cancha gráfica interactiva
│   │   │   ├── header.tsx         # Header desktop
│   │   │   ├── mobile-nav.tsx     # Navegación móvil (top + bottom)
│   │   │   ├── player-avatar.tsx  # Avatar reutilizable de jugador
│   │   │   └── sidebar.tsx        # Sidebar desktop
│   │   ├── ui/                    # Componentes shadcn/ui
│   │   └── views/                 # 6 vistas principales
│   │       ├── dashboard.tsx      # Inicio
│   │       ├── calendar.tsx       # Calendario
│   │       ├── roster.tsx         # Plantilla
│   │       ├── callups.tsx        # Convocatorias
│   │       ├── results.tsx        # Resultados
│   │       └── announcements.tsx  # Avisos
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   └── lib/
│       ├── db.ts                  # Cliente Prisma
│       ├── helpers.ts             # Fechas, formaciones, colores
│       ├── seed-data.ts           # Datos semilla (Los Halcones FC)
│       ├── store.ts               # Store Zustand con persistencia
│       ├── types.ts               # Tipos TypeScript
│       └── utils.ts               # Utilidades (cn, etc.)
├── .env.example                   # Plantilla de variables de entorno
├── .gitignore
├── components.json                # Config shadcn/ui
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🖥 Vistas de la Aplicación

### 1. Inicio (`/`)
Panel principal con:
- 🏆 Hero card del próximo partido con fecha, hora, ubicación y condición (local/visitante)
- 📅 Próximo evento con contadores de confirmaciones (sí / tal vez / no) y avatares de confirmados
- 📊 Últimos 3 resultados con código de color (G/E/P)
- 📌 Avisos fijados del cuerpo técnico
- 🏆 Tabla de posiciones top 5
- 👥 Estado de la plantilla (disponibles, lesionados, suspendidos, ausentes)

### 2. Calendario (`/calendario`)
- Tabs: Próximos / Finalizados
- Tarjetas de evento con fecha destacada, tipo (entrenamiento, partido, torneo, reunión)
- Botones de confirmación: **Asistiré / Tal vez / No** con feedback toast
- Contadores de asistencia en tiempo real
- Lista expandible de jugadores confirmados
- Diálogo para crear nuevos eventos

### 3. Plantilla (`/plantilla`)
- Top stats: goleador, máximo asistidor, mayor asistencia a entrenamientos, más minutos jugados
- Filtros por posición y estado + buscador por nombre
- Tarjetas de jugador con dorsal, posición, edad y mini-stats (PJ, goles, asistencias, tarjetas)
- Modal de detalle con estadísticas completas, datos físicos, contacto de emergencia y cambio de estado

### 4. Convocatorias (`/convocatorias`)
- Selector de partido (próximos y pasados)
- **Cancha gráfica interactiva** con líneas, áreas, círculo central y franjas
- Formaciones seleccionables: 4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 5-3-2
- Jugadores posicionados con dorsal y nombre, corona de capitán
- Lista de titulares con asignación de posición
- Suplentes como chips con acciones rápidas (hacer titular, capitán, quitar)
- Lista de disponibles para convocar
- Botón **"Enviar convocatoria al equipo"** que publica un aviso automático

### 5. Resultados (`/resultados`)
- Stats de temporada: PJ, G, E, P, GF, GC
- Tabla de goleadores del equipo
- Filtros: Todos / Ganados / Empatados / Perdidos
- Tarjetas de partido con marcador, mini-stats y figura del partido
- Modal editor con marcador editable y estadísticas individuales por jugador:
  - Goles, asistencias, minutos jugados
  - Tarjetas amarillas y rojas
  - Atajadas (porteros), tiros
  - Botón "Marcar como figura"

### 6. Avisos (`/avisos`)
- Resumen: total, no leídos, fijados
- Tabs: Todos / No leídos / Fijados
- Tarjetas de aviso con categorías:
  - 📢 General
  - 🛡 Convocatoria
  - 📅 Evento
  - ⚠️ Urgente
- Botones: Fijar/Desfijar, Marcar como leído
- Indicador de lecturas (cuántos jugadores lo han leído)
- Diálogo para publicar nuevos avisos

---

## 👥 Tipos de Usuario

La aplicación está diseñada para soportar (en futuras versiones con autenticación):

| Rol | Permisos |
|---|---|
| **Administrador** | Configura el equipo y gestiona usuarios |
| **Entrenador** | Crea entrenamientos, convocatorias y alineaciones |
| **Jugador** | Confirma asistencia y consulta su información |
| **Cuerpo técnico** | Registra rendimiento, lesiones y estadísticas |
| **Acudiente** | Útil para categorías infantiles |
| **Seguidor** | Solo ve resultados, calendario y noticias |

> **Estado actual:** La demo funciona en modo "entrenador" (un solo usuario). La autenticación multi-usuario está en el roadmap.

---

## 🗄 Base de Datos

El proyecto usa **Prisma ORM** con **SQLite** (archivo local `db/custom.db`).

### Esquema actual

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

> **Nota:** El esquema de Prisma es mínimo porque el MVP usa Zustand + localStorage para la mayoría de los datos. Cuando migres a multi-usuario real, expande el esquema con los modelos de `src/lib/types.ts` (Player, TeamEvent, Attendance, Callup, Announcement, MatchStat, etc.).

### Comandos útiles

```bash
bun run db:push      # Sincroniza esquema con la DB
bun run db:generate  # Regenera el cliente Prisma
bun run db:studio    # Abre Prisma Studio (GUI para ver/editar datos)
bun run db:reset     # Resetea la DB (¡borra todo!)
```

---

## 🎨 Personalización

### Cambiar el equipo

Edita `src/lib/seed-data.ts`:

```typescript
export const seedTeam: Team = {
  name: 'Tu Equipo FC',           // ← Cambia esto
  shortName: 'TFC',                // ← Y esto
  category: 'Tu Categoría',
  coachName: 'Tu Nombre',
  primaryColor: '#16a34a',         // ← Color hexadecimal
  foundedYear: 2024,
}
```

### Cambiar colores del tema

Edita las variables CSS en `src/app/globals.css`:

```css
:root {
  --primary: oklch(0.55 0.15 150);     /* Verde futbolero */
  --primary-foreground: oklch(0.99 0.005 145);
  /* ... */
}
```

### Cambiar formaciones disponibles

Edita `src/lib/helpers.ts`:

```typescript
export const FORMATIONS: FormationDef[] = [
  { name: '4-3-3', positions: ['POR', 'LI', 'DFC', 'DFC', 'LD', 'MCD', 'MC', 'MCO', 'EI', 'DC', 'ED'] },
  // Agrega o modifica formaciones aquí
]
```

---

## 🗺 Roadmap

- [x] MVP con 6 vistas principales
- [x] Cancha gráfica interactiva
- [x] Persistencia local con Zustand
- [x] PWA manifest
- [ ] Autenticación multi-usuario (NextAuth.js)
- [ ] Migración a Supabase (PostgreSQL + Realtime + Storage)
- [ ] Pagos y administración
- [ ] Lesiones y bienestar (con privacidad médica)
- [ ] Entrenamientos detallados
- [ ] Galería multimedia
- [ ] Notificaciones push
- [ ] Roles de usuario (admin, entrenador, jugador, etc.)
- [ ] App móvil nativa (React Native o PWA mejorada)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Sigue estos pasos:

1. Fork el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/mi-nueva-funcion`
3. Haz commit de tus cambios: `git commit -m 'feat: añade mi nueva función'`
4. Push a la rama: `git push origin feature/mi-nueva-funcion`
5. Abre un Pull Request

### Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` formato, no afecta código
- `refactor:` refactorización de código
- `test:` añade o modifica tests
- `chore:` tareas de mantenimiento

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT — ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 💬 Soporte

- 📧 Email: abre un issue en GitHub
- 🐛 Reportar bug: [GitHub Issues](https://github.com/yecos/Futapp/issues)
- 💡 Sugerir feature: [GitHub Discussions](https://github.com/yecos/Futapp/discussions)

---

<div align="center">

**⚽ Hecho con pasión por el fútbol y la tecnología**

</div>
