#!/bin/bash
# Monitorea el estado de un deployment de Vercel hasta READY o ERROR
#
# Uso:
#   VERCEL_TOKEN=vcp_xxx... DEPLOY_ID=dpl_xxx... bash scripts/monitor-deploy.sh
#
# Requiere:
#   - VERCEL_TOKEN: Personal Access Token de Vercel
#   - DEPLOY_ID: ID del deployment a monitorear

set -e

: "${VERCEL_TOKEN:?VERCEL_TOKEN es requerido}"
: "${DEPLOY_ID:?DEPLOY_ID es requerido}"

MAX_ATTEMPTS=60  # 60 * 10s = 10 min max
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  STATUS=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v13/deployments/$DEPLOY_ID" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    state = d.get('readyState', 'UNKNOWN')
    err = d.get('errorMessage', '')
    print(f\"{state}|{err}\")
except Exception as e:
    print(f'ERROR|{e}')
")

  STATE=$(echo "$STATUS" | cut -d'|' -f1)
  ERR=$(echo "$STATUS" | cut -d'|' -f2-)

  TIMESTAMP=$(date +"%H:%M:%S")
  echo "[$TIMESTAMP] Attempt $ATTEMPT: state=$STATE"

  if [ "$STATE" = "READY" ]; then
    echo ""
    echo "✓ DEPLOY COMPLETADO EXITOSAMENTE!"
    curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v13/deployments/$DEPLOY_ID" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('  Production URL:', 'https://' + d.get('alias', ['?'])[0] if d.get('alias') else '?')
print('  Deployment URL:', 'https://' + d.get('url', '?'))
print('  Inspector:', d.get('inspectorUrl'))
"
    exit 0
  fi

  if [ "$STATE" = "ERROR" ] || [ "$STATE" = "CANCELED" ]; then
    echo ""
    echo "✗ DEPLOY FALLIDO: $STATE"
    echo "  Error: $ERR"
    exit 1
  fi

  sleep 10
done

echo "Timeout después de $MAX_ATTEMPTS intentos"
exit 2
