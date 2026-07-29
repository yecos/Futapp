#!/bin/bash
# Elimina todas las env vars antiguas de Supabase y FUTAPP_URL_ del proyecto Futapp
#
# Uso:
#   VERCEL_TOKEN=vcp_xxx... PROJECT_ID=prj_xxx... bash scripts/clean-vercel-envs.sh
#
# Requiere:
#   - VERCEL_TOKEN: Personal Access Token de Vercel (https://vercel.com/account/tokens)
#   - PROJECT_ID: ID del proyecto en Vercel

set -e

: "${VERCEL_TOKEN:?VERCEL_TOKEN es requerido}"
: "${PROJECT_ID:?PROJECT_ID es requerido}"

# Variables a eliminar (todas las de Supabase + las FUTAPP_URL_ que apuntan a otro Neon)
VARS_TO_DELETE=(
  "FUTAPP_URL_POSTGRES_DATABASE"
  "FUTAPP_URL_NEON_AUTH_BASE_URL"
  "FUTAPP_URL_POSTGRES_HOST"
  "FUTAPP_URL_DATABASE_URL"
  "FUTAPP_URL_PGHOST"
  "FUTAPP_URL_POSTGRES_PRISMA_URL"
  "FUTAPP_URL_PGUSER"
  "FUTAPP_URL_POSTGRES_USER"
  "FUTAPP_URL_VITE_NEON_AUTH_URL"
  "FUTAPP_URL_NEON_PROJECT_ID"
  "FUTAPP_URL_DATABASE_URL_UNPOOLED"
  "FUTAPP_URL_PGHOST_UNPOOLED"
  "FUTAPP_URL_POSTGRES_PASSWORD"
  "FUTAPP_URL_POSTGRES_URL"
  "FUTAPP_URL_POSTGRES_URL_NON_POOLING"
  "FUTAPP_URL_PGDATABASE"
  "FUTAPP_URL_POSTGRES_URL_NO_SSL"
  "FUTAPP_URL_PGPASSWORD"
  "SUPABASE_PUBLISHABLE_KEY"
  "SUPABASE_SECRET_KEY"
  "POSTGRES_URL"
  "POSTGRES_USER"
  "POSTGRES_URL_NON_POOLING"
  "POSTGRES_PRISMA_URL"
  "POSTGRES_DATABASE"
  "POSTGRES_HOST"
  "POSTGRES_PASSWORD"
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  "SUPABASE_ANON_KEY"
  "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "NEXT_PUBLIC_SUPABASE_URL"
)

echo "=== Obteniendo IDs de env vars a eliminar ==="
ENVS=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects/$PROJECT_ID/env")

for VAR_NAME in "${VARS_TO_DELETE[@]}"; do
  ENV_ID=$(echo "$ENVS" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for env in data.get('envs', []):
    if env['key'] == '$VAR_NAME':
        print(env['id'])
        break
")
  if [ -n "$ENV_ID" ]; then
    echo "Eliminando: $VAR_NAME (id=$ENV_ID)"
    curl -s -X DELETE -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects/$PROJECT_ID/env/$ENV_ID" > /dev/null
  else
    echo "No encontrada: $VAR_NAME"
  fi
done

echo ""
echo "=== Env vars restantes ==="
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects/$PROJECT_ID/env" 2>&1 | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('Total env vars:', len(data.get('envs', [])))
for env in data.get('envs', []):
    print(f\"  - {env['key']} (target={env.get('target')})\")
"
