#!/bin/bash
echo "=== TESTE COMPLETO DE API ==="
echo ""
echo "1. Tentando login..."
RESPONSE=$(curl -s -X POST https://smart.app.webmaxdigital.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@honey.com","password":"senha123"}')

echo "$RESPONSE" | head -c 300
echo ""
echo ""

# Tentar extrair token se houver
TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | head -1)

if [ ! -z "$TOKEN" ]; then
  echo "2. Token recebido (primeiros 50 chars): ${TOKEN:0:50}..."
  echo ""
  echo "3. Testando GET /api/external/destinations..."
  curl -s -X GET https://smart.app.webmaxdigital.com/api/external/destinations \
    -H "Authorization: Bearer $TOKEN"
  echo ""
else
  echo "Login falhou. Tente com credenciais corretas."
fi
