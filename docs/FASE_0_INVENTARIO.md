# Futapp — Inventario de arquitectura (Fase 0)

Documento generado como resultado de la Fase 0 del plan de ejecución. Sirve como insumo para diseñar las Fases 1 y 2 del roadmap de producto.

Última actualización: julio 2026.

---

## 1. Stack técnico

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Framework | Next.js (App Router) | 16 | Turbopack |
| Lenguaje | TypeScript | 5 | strict |
| Auth | NextAuth.js | 4 | Google OAuth + JWT |
| ORM | Prisma | 6 | Cliente generado |
| Base de datos | PostgreSQL (Neon) | serverless | Pooler + directa |
| Estilos | Tailwind CSS | 4 | shadcn/ui (New York) |
| Estado | Zustand + Server Components | 5 | Mix |
| Charts | Recharts | 2 | Página `/estadisticas` |
| Hosting | Vercel | Hobby plan | Crons diarios |
| PWA | Service Worker propio | v1 | Cache + push |

Variables de entorno activas en producción: `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`.

---

## 2. Modelo de datos actual

El schema Prisma tiene 21 modelos. Los relevantes para el roadmap:

### Núcleo de identidad
- **User** — `id, email, name, image, emailVerified, phoneNumber, createdAt, updatedAt`. Sin campo de rol ni teamId: esos viven en el JWT, no en el modelo.
- **Account** — OAuth tokens de Google.
- **Session** — JWT sessions.
- **VerificationToken** — NextAuth.

### Multi-tenant
- **Team** — `id, name, shortName, category, coachName, primaryColor, foundedYear, bankName, accountType, accountNumber, accountHolder, qrImageUrl, paymentInstructions, onboardingCompleted, isActive`.
- **TeamMembership** — `userId, teamId, role (Role enum), status (MembershipStatus), joinedAt, leftAt`. Tabla de unión con `@@unique([userId, teamId])`.

### Roles
```
enum Role {
  ADMIN
  ENTRENADOR
  JUGADOR
  CUERPO_TECNICO
  ACUDIENTE
  SEGUIDOR
}
```

### Jugadores
- **Player** — vinculado opcionalmente a `userId`. Tiene 32 campos: datos personales, stats deportivas (matchesPlayed, goals, assists, cards), stats RPG (statPoints, totalPointsEarned, streak, maxStreak, basePAC/SHO/PAS/DRI/DEF/PHY), foto como base64 en `photoUrl`.

### Eventos y partidos
- **Event** — `teamId, type (ENTRENAMIENTO/PARTIDO/TORNEO/REUNION/EVENTO), title, date, location, opponent, isHome, status, homeScore, awayScore, formation, latitude, longitude`.
- **Attendance** — `eventId, playerId, status (ASISTIRE/NO_ASISTIRE/TAL_VEZ)`.
- **Callup** — `eventId, playerId, status (TITULAR/SUPLENTE/NO_CONVOCADO), isCaptain, order, fieldPosition`.
- **MatchStat** — `eventId, playerId, goals, assists, minutesPlayed, yellowCards, redCards, saves, shots, recoveries, isMotm`.
- **CheckIn** — GPS check-in en eventos con coordenadas.
- **Absence** — Justificación de ausencia.
- **EventMessage** — Chat por evento.

### Pagos
- **Payment** — `teamId, title, type (MENSUALIDAD/ARBITRAJE/UNIFORME/INSCRIPCION/EVENTO/MULTA/OTRO), amount (Decimal), dueDate, recurrence, appliesTo (Json), status (PENDIENTE/PAGADO/VERIFICADO/RECHAZADO/VENCIDO), parentPaymentId`.
- **PaymentReceipt** — `paymentId, playerId, uploadedBy, receiptUrl (base64), amount, reference, status, reviewedBy, reviewedAt, rejectionReason`.

### Comunicación
- **Announcement** — `teamId, title, content, category, authorId, pinned, publishedAt, expiresAt`.
- **AnnouncementRead** — Marcado de leído.
- **Notification** — `userId, type, title, body, channel (IN_APP/EMAIL/PUSH), status, sentAt, readAt, relatedEntityType, relatedEntityId`.
- **InviteToken** — `teamId, token, role, expiresAt, usedBy`.

### Otros
- **Standing** — Tabla de posiciones manual.

---

## 3. Flujo de autenticación

1. Usuario entra a `/` → middleware chequea JWT.
2. Sin sesión → redirect a `/login`.
3. Login page muestra botón "Continuar con Google".
4. Google OAuth callback a `/api/auth/callback/google`.
5. NextAuth crea/actualiza `User` y `Account` vía `@auth/prisma-adapter`.
6. `jwt` callback consulta `TeamMembership` en DB y guarda `userId, role, teamId, membershipStatus, onboardingCompleted` en el JWT.
7. `session` callback expone esos campos en `session.user`.
8. JWT tiene TTL de 5 minutos para refrescar membership desde DB.

**Importante**: el JWT guarda `teamId` solo si el usuario tiene membership ACTIVO o PENDIENTE. Un usuario sin membresía no tiene teamId en el JWT.

---

## 4. Flujo de creación de equipo y invitación

### Crear equipo
1. Usuario sin teamId va a `/choose-team`.
2. Elige "Crear equipo nuevo" → form con name, shortName, category, coachName.
3. POST `/api/team/create` → crea `Team` + `TeamMembership` con role ADMIN y status ACTIVO en una transacción.
4. Redirect a `/onboarding` para configurar colores y datos bancarios.
5. POST `/api/team/onboarding` actualiza `Team.onboardingCompleted = true`.

### Invitar
1. Admin va a `/admin/miembros` → "Generar invitación".
2. Elige rol y vencimiento → POST `/api/invites` crea `InviteToken` con UUID.
3. Se muestra URL pública `/invite/[token]`.

### Aceptar invitación
1. Usuario sin sesión abre `/invite/[token]` → ve pantalla de bienvenida con equipo y rol.
2. Click "Continuar con Google" → login con `callbackUrl=/invite/[token]`.
3. Vuelve a `/invite/[token]` logueado → click "Aceptar invitación".
4. POST `/api/team/join` → en transacción:
   - Verifica que no tenga membership ACTIVO.
   - Crea o actualiza `TeamMembership` con status ACTIVO y el rol del invite.
   - Marca `InviteToken.usedBy` y `usedAt`.

### Estados de membership
- `ACTIVO` — puede usar la app.
- `PENDIENTE` — esperando aprobación manual del admin. Va a `/pending`.
- `RETIRADO` — salió del equipo voluntariamente.
- `BLOQUEADO` — admin lo bloqueó.

---

## 5. Sistema de roles

Definido en `src/lib/permissions.ts` y aplicado en cada API route con `getServerSession` + verificación de `membership.role`.

| Rol | Puede hacer |
|---|---|
| ADMIN | Todo: crear/editar/eliminar eventos, cobros, avisos, jugadores, miembros, configuración del equipo |
| ENTRENADOR | Crear/editar eventos, convocatorias, avisos, cargar resultados, editar jugadores |
| CUERPO_TECNICO | Crear eventos, avisos, cargar resultados, editar jugadores |
| JUGADOR | Confirmar asistencia, subir comprobante de pago, editar su perfil, chat en eventos |
| ACUDIENTE | Como JUGADOR pero para su hijo (categorías infantiles) |
| SEGUIDOR | Solo lectura: calendario, resultados, avisos |

**Verificación**: cada API route chequea `membership.role` contra `['ADMIN', 'ENTRENADOR', ...]` antes de ejecutar. El middleware solo protege páginas, no APIs (las APIs devuelven 401 JSON).

---

## 6. Componente de carta de jugador

No existe un componente "carta" unificado. Hay dos vistas que cumplen funciones similares:

### `/mi-perfil` (yo como jugador)
Muestra:
- Foto de perfil (base64 o Google image)
- Datos deportivos: dorsal, posición, edad, pie dominante, altura, peso
- Datos físicos: teléfono, contacto emergencia
- Stats RPG: rating (promedio 6 stats), nivel (6 tiers por totalPointsEarned), racha actual y máxima
- 6 atributos con barras: Ritmo, Disparo, Pase, Regate, Defensa, Físico
- Asignación de puntos disponibles con botones +/-

### `/plantilla/[id]` (perfil público de otro jugador)
Muestra:
- Foto y dorsal
- Stats deportivas (PJ, G, A, tarjetas)
- Histórico de MatchStats por partido
- Carta FIFA visual (existe `player-card-fut.tsx` pero no está integrado del todo)

**Edición**: el propio usuario edita su perfil en `/mi-perfil`. Admin/entrenador pueden editar cualquier jugador vía `/api/players/[id]` PATCH.

**Quién la puede ver**: solo miembros del mismo equipo. No hay URL pública.

---

## 7. Estado real de pagos y QR Bancolombia

**Sí existe** y está completo:

- Admin crea cobro → `Payment` con monto, vencimiento, recurrencia, aplica a (todos o jugadores específicos).
- Jugador ve sus cobros en `/pagos` → click "Ver datos para pagar" muestra `bankName, accountType, accountNumber, accountHolder, paymentInstructions`.
- **NO hay QR generado automáticamente** — el campo `qrImageUrl` en `Team` existe pero nunca se popula. El admin tendría que subir un QR manualmente.
- Jugador sube comprobante (foto o PDF, máx 5MB, base64) → `PaymentReceipt` con status PAGADO.
- Admin verifica o rechaza → notificación al jugador.
- Cron diario `/api/cron/remind-payments` manda recordatorios 3 días antes, día del vencimiento, y marca como VENCIDO.
- Cron diario `/api/cron/generate-recurring` genera cobros mensuales recurrentes.

**Deuda**: no hay integración con Wompi/Stripe. El pago es 100% fuera de la app (transferencia manual) y la verificación es humana.

---

## 8. Deuda técnica para las Fases 1 y 2

### Bloqueantes para Fase 2 (jugador libre)

1. **Arquitectura mono-equipo**: el middleware fuerza redirect a `/choose-team` si no hay `teamId`. No hay forma de que un usuario exista sin equipo.
2. **Sin modelo `FreePlayer`**: no hay entidad para un jugador sin equipo que tenga carta y tests.
3. **Sin página pública de carta**: las URLs `/plantilla/[id]` requieren sesión y membership del mismo equipo. No hay `/carta/[id]` pública.
4. **Sin test físico**: no existe ningún endpoint ni UI para grabar y guardar resultados de tests.
5. **Sin modelo `TestResult`**: no hay entidad para guardar resultados de tests.

### Mejorables para Fase 1 (cobros)

6. **Sin QR automático**: `qrImageUrl` nunca se popula. Hay librerías para generar QR desde los datos bancarios.
7. **Sin integración de pagos**: no hay Wompi/Stripe. El pago es manual.
8. **Sin suscripción de admin**: no hay flag `team.isPremium` ni validación de features premium.
9. **Sin comisión sobre cobros**: no hay forma de cobrar 1-3% sobre transacciones.
10. **Storage de comprobantes en base64**: las fotos se guardan en la columna `receiptUrl` como data URL. No escala bien y llena la DB. Debería migrarse a Supabase Storage o Vercel Blob.

### Generales

11. **Crons limitados a diarios**: Vercel Hobby solo permite 1 cron por día. Los recordatorios no son en tiempo real.
12. **Sin push notifications reales**: el service worker está preparado pero no hay VAPID keys configuradas ni endpoint de suscripción.
13. **Sin multi-equipo**: un usuario solo puede tener un `TeamMembership` ACTIVO a la vez (la primera query `findFirst` gana).
14. **Fotos en base64**: `Player.photoUrl` y `PaymentReceipt.receiptUrl` guardan base64 en DB. Mala práctica.

---

## 9. Próximos pasos recomendados

Con base en este inventario y el roadmap de producto:

1. **Fase 2 primero** (jugador libre) — es el diferencial competitivo y desbloquea el efecto de red. Requiere cambios arquitectónicos grandes.
2. **Mejoras de Fase 1 en paralelo** — QR automático, migración de fotos a storage, flag premium.
3. **Fase 5 (tests físicos)** — el documento de investigación ya está listo. Implementar salto vertical primero (mayor evidencia científica).

La Fase 4 (marketplace) y Fase 6 (canchas) quedan fuera de alcance hasta que la Fase 2 tenga volumen real de jugadores libres.
