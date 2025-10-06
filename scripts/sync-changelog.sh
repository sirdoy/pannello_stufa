#!/bin/bash

# Script per sincronizzare changelog con Firebase dopo deploy
# Usage: ./scripts/sync-changelog.sh [URL] [ADMIN_SECRET]

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL dell'app (default: localhost, override con primo argomento)
APP_URL="${1:-http://localhost:3000}"

# Admin secret (da secondo argomento o env var)
ADMIN_SECRET="${2:-$ADMIN_SECRET}"

if [ -z "$ADMIN_SECRET" ]; then
  echo -e "${RED}❌ Errore: ADMIN_SECRET non fornito${NC}"
  echo "Usage: ./scripts/sync-changelog.sh [URL] [ADMIN_SECRET]"
  echo "Oppure: export ADMIN_SECRET=your-secret && ./scripts/sync-changelog.sh [URL]"
  exit 1
fi

echo -e "${YELLOW}🔄 Sincronizzazione changelog con Firebase...${NC}"
echo "URL: $APP_URL"

# Chiamata API
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$APP_URL/api/admin/sync-changelog" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json")

# Estrai body e status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

# Verifica risposta
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Sincronizzazione completata con successo!${NC}"
  echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
else
  echo -e "${RED}❌ Errore sincronizzazione (HTTP $HTTP_CODE)${NC}"
  echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
  exit 1
fi
