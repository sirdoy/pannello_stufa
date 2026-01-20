#!/bin/bash

# Script per sincronizzare changelog con Firebase dopo deploy
# Usage: ./scripts/sync-changelog.sh [URL] [CRON_SECRET]
#
# Esempi:
#   ./scripts/sync-changelog.sh                           # localhost + CRON_SECRET da env
#   ./scripts/sync-changelog.sh http://localhost:3000     # localhost + CRON_SECRET da env
#   source .env.local && ./scripts/sync-changelog.sh      # carica env e usa localhost

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL dell'app (default: localhost, override con primo argomento)
APP_URL="${1:-http://localhost:3000}"

# Cron secret (da secondo argomento o env var)
SECRET="${2:-$CRON_SECRET}"

if [ -z "$SECRET" ]; then
  echo -e "${RED}❌ Errore: CRON_SECRET non fornito${NC}"
  echo ""
  echo "Usage:"
  echo "  source .env.local && ./scripts/sync-changelog.sh"
  echo "  CRON_SECRET=xxx ./scripts/sync-changelog.sh [URL]"
  echo "  ./scripts/sync-changelog.sh [URL] [SECRET]"
  exit 1
fi

echo -e "${YELLOW}🔄 Sincronizzazione changelog con Firebase...${NC}"
echo "URL: $APP_URL"

# Chiamata API e cattura separatamente body e status
HTTP_CODE=$(curl -s -o /tmp/sync-response.json -w "%{http_code}" -X POST "$APP_URL/api/admin/sync-changelog" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json")

HTTP_BODY=$(cat /tmp/sync-response.json 2>/dev/null)
rm -f /tmp/sync-response.json

# Verifica risposta
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Sincronizzazione completata con successo!${NC}"
  echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
else
  echo -e "${RED}❌ Errore sincronizzazione (HTTP $HTTP_CODE)${NC}"
  echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
  exit 1
fi
