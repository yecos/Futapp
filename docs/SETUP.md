# 🚀 Guía de Configuración — Futapp Multi-Usuario

Esta guía te lleva paso a paso para tener Futapp funcionando con:
- ✅ Base de datos PostgreSQL persistente (Supabase)
- ✅ Login con Google
- ✅ Sistema de roles
- ✅ Pagos con QR Bancolombia

---

## 📋 Tiempo estimado: 30-45 minutos

### Lo que vas a crear
1. Cuenta en Supabase (gratis)
2. Proyecto en Supabase
3. OAuth Client en Google Cloud Console
4. Variables de entorno en Vercel
5. ¡Listo!

---

## Paso 1 — Crear cuenta y proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta gratuita
2. Click en **New Project**
3. Completa:
   - **Name:** `Futapp`
   - **Database Password:** crea una contraseña segura (guárdala)
   - **Region:** `South America (São Paulo)` o la más cercana
   - **Pricing Plan:** Free
4. Click **Create new project** y espera ~2 minutos

### Obtener las credenciales de Supabase

Una vez creado el proyecto, ve a **Settings → API**:

1. Anota estos valores:
   - **Project URL:** `https://XXXXX.supabase.co`
   - **anon public key:** `eyJhbG...`
   - **service_role key:** `eyJhbG...` (¡MANTENER SECRETO!)

2. Ve a **Settings → Database**:
   - En "Connection string", copia la URL **directa** (la larga con password)
   - Copia también la URL del **pooler** (puerto 6543, con `?pgbouncer=true`)

---

## Paso 2 — Configurar Google OAuth

1. Ve a https://console.cloud.google.com/
2. Crea un proyecto nuevo (o usa uno existente)
3. Ve a **APIs & Services → OAuth consent screen**:
   - **User type:** External
   - **App name:** `Futapp`
   - **User support email:** tu email
   - **Developer contact:** tu email
   - Guarda y continúa
4. Ve a **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - **Application type:** Web application
   - **Name:** `Futapp Web`
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `https://TU-DOMINIO.vercel.app` (cuando lo tengas)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google`
     - `https://TU-DOMINIO.vercel.app/api/auth/callback/google`
5. Click **Create**
6. Anota el **Client ID** y **Client Secret**

---

## Paso 3 — Configurar variables en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Click en el proyecto **futapp**
3. Ve a **Settings → Environment Variables**
4. Añade estas variables (una por una):

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@db.XXXXX.supabase.co:5432/postgres` (la directa de Supabase) |
| `DIRECT_URL` | `postgresql://postgres.XXXXX:PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `NEXTAUTH_URL` | `https://futapp-seven.vercel.app` (tu URL de Vercel) |
| `NEXTAUTH_SECRET` | Genera con: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | El Client ID de Google |
| `GOOGLE_CLIENT_SECRET` | El Client Secret de Google |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://XXXXX.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | El anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | El service_role key de Supabase |
| `CRON_SECRET` | Genera con: `openssl rand -base64 32` |
| `STORAGE_BUCKET_TEAM` | `team-assets` |
| `STORAGE_BUCKET_RECEIPTS` | `payment-receipts` |

5. After adding all variables, click **Redeploy** in the Deployments tab

---

## Paso 4 — Crear buckets en Supabase Storage

1. Ve a tu proyecto en Supabase → **Storage**
2. Crea dos buckets:
   - `team-assets` — **Public** (para escudos y fotos)
   - `payment-receipts` — **Private** (comprobantes, solo access via URL firmada)

---

## Paso 5 — Inicializar la base de datos

Cuando Vercel haga el primer deploy con las nuevas variables, Prisma automáticamente:
1. Se conectará a PostgreSQL
2. Creará todas las tablas (User, Team, Payment, etc.)

Si necesitas hacerlo manualmente, desde tu terminal local:

```bash
# Clona el repo
git clone https://github.com/yecos/Futapp.git
cd Futapp

# Instala dependencias
npm install

# Crea .env con las mismas variables que Vercel
cp .env.example .env
# Edita .env con tus valores reales

# Sincroniza el schema con la DB
npx prisma db push

# (Opcional) Carga datos demo
npm run db:seed
```

---

## Paso 6 — ¡Probar la app!

1. Abre https://futapp-seven.vercel.app (o tu URL)
2. Click en **"Continuar con Google"**
3. Inicia sesión con tu cuenta Google

### Como eres el primer usuario:
- Automáticamente serás el **ADMIN** del equipo
- Te pedirá configurar los datos del equipo (nombre, colores, datos bancarios)
- Una vez completado, podrás invitar jugadores con links

### Para invitar jugadores:
1. Ve a **Miembros** → **Generar invitación**
2. Elige el rol (Jugador, Entrenador, etc.)
3. Copia el link y compártelo por WhatsApp
4. El jugador abre el link, se loguea con Google, ¡y listo!

---

## 🎯 Roles disponibles

| Rol | Qué puede hacer |
|---|---|
| **👑 Admin** | Todo: configura equipo, invita, gestiona pagos |
| **🧢 Entrenador** | Crea eventos, convocatorias, ve pagos propios |
| **👤 Jugador** | Confirma asistencia, paga, ve su info |
| **🩺 Cuerpo Técnico** | Registra estadísticas y lesiones |
| **👨‍👦 Acudiente** | Gestiona a su hijo (categorías infantiles) |
| **👀 Seguidor** | Solo ve resultados y calendario público |

---

## 💰 Cómo funcionan los pagos

### Como admin:
1. Ve a **Gestión de Pagos** → **Nuevo cobro**
2. Elige tipo (mensualidad, arbitraje, uniforme, etc.)
3. Define monto, vencimiento y a quiénes aplica
4. Los jugadores reciben notificación automática
5. Recordatorios automáticos: 3 días antes, día del vencimiento, vencido

### Como jugador:
1. Ve a **Mis Pagos**
2. Click en **Ver datos para pagar** → aparece la info bancaria
3. Transfiere por PSE, Nequi, app Bancolombia o QR
4. Click en **Subir comprobante** → sube foto/PDF de la transferencia
5. El admin recibe notificación, revisa y aprueba

### Como admin (verificación):
1. Ve a **Gestión de Pagos** → verás badge de comprobantes pendientes
2. Click en **Revisar** → ves la imagen del comprobante
3. Click **Aprobar** o **Rechazar** (con motivo)
4. El jugador recibe notificación automática

---

## 🔧 Solución de problemas

### Error: "No se puede conectar a la base de datos"
- Verifica que `DATABASE_URL` y `DIRECT_URL` estén bien en Vercel
- Asegúrate de que la contraseña sea correcta
- Verifica que el proyecto Supabase esté activo (no pausado)

### Error: "Redirect URI mismatch" en Google
- Ve a Google Cloud Console → Credentials
- Asegúrate de que las URLs de redirección incluyan TU dominio de Vercel
- Deben ser EXACTAMENTE: `https://TU-DOMINIO.vercel.app/api/auth/callback/google`

### Error: "Middleware is not working"
- Verifica que `NEXTAUTH_SECRET` esté configurado
- Verifica que `NEXTAUTH_URL` coincida con tu dominio real

### El primer usuario no se hizo admin
- Eso solo pasa si la DB estaba vacía al hacer login
- Borra todos los usuarios en Supabase → Table Editor → users
- Vuelve a intentar

### Los cron jobs no se ejecutan
- Vercel Cron solo funciona en deploys de producción
- Verifica que `CRON_SECRET` esté configurado
- Los logs están en Vercel → Functions → cron

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel → Deployments → Functions
2. Abre un issue en https://github.com/yecos/Futapp/issues
3. Verifica que todas las variables de entorno estén configuradas

¡Disfruta Futapp! ⚽
