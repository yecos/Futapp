#!/bin/bash
# Crea DATABASE_URL y DIRECT_URL en el proyecto Futapp de Vercel
#
# Uso:
#   VERCEL_TOKEN=vcp_xxx... PROJECT_ID=prj_xxx... \
#   DATABASE_URL='postgresql://...' DIRECT_URL='postgresql://...' \
#   bash scripts/create-vercel-envs.sh
#
# Requiere:
#   - VERCEL_TOKEN: Personal Access Token de Vercel
#   - PROJECT_ID: ID del proyecto en Vercel
#   - DATABASE_URL: connection string PostgreSQL (pooler)
#   - DIRECT_URL: connection string PostgreSQL (directa)

set -e

: "${VERCEL_TOKEN:?VERCEL_TOKEN es requerido}"
: "${PROJECT_ID:?PROJECT_ID es requerido}"
: "${DATABASE_URL:?DATABASE_URL es requerido}"
: "${DIRECT_URL:?DIRECT_URL es requerido}"

echo "=== Creando DATABASE_URL (pooled, para runtime) ==="
curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "
import json, os
print(json.dumps({
    'key': 'DATABASE_URL',
    'value': os.environ['DATABASE_URL'],
    'target': ['production', 'preview', 'development'],
    'type': 'encrypted'
}))
")" | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ✓ Creada:', d.get('key', d.get('error')))"

echo ""
echo "=== Creando DIRECT_URL (direct, para migraciones) ==="
curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "
import json, os
print(json.dumps({
    'key': 'DIRECT_URL',
    'value': os.environ['DIRECT_URL'],
    'target': ['production', 'preview', 'development'],
    'type': 'encrypted'
}))
")" | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ✓ Creada:', d.get('key', d.get('error')))"

echo ""
echo "=== Env vars finales ==="
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects/$PROJECT_ID/env" 2>&1 | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('Total env vars:', len(data.get('envs', [])))
for env in data.get('envs', []):
    print(f\"  - {env['key']} (target={env.get('target')})\")
"
