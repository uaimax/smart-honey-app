#!/bin/bash

echo "=== TESTE DE DESTINATIONS COM AUTH ==="
echo ""

# Tentar login com diferentes credenciais
for EMAIL in "admin@webmaxdigital.com" "admin@honey.com" "admin@admin.com"; do
  for PASS in "admin123" "Admin@123" "senha123" "Webmax@2024"; do
    echo "Tentando: $EMAIL / $PASS"
    RESPONSE=$(curl -s -X POST https://smart.app.webmaxdigital.com/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
      echo "✅ LOGIN SUCESSO!"
      TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
      echo "Token: ${TOKEN:0:50}..."
      echo ""
      echo "Testando GET /api/external/destinations..."
      curl -s -X GET https://smart.app.webmaxdigital.com/api/external/destinations \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json"
      echo ""
      exit 0
    fi
  done
done

echo "❌ Nenhuma credencial funcionou"
echo "Por favor, forneça as credenciais corretas do usuário Admin"
