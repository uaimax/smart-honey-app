# 🔔 Sistema de Notificações Bancárias - Smart Honey

## Visão Geral

O Smart Honey captura automaticamente notificações de transações bancárias do Google Wallet, Samsung Pay e apps bancários, criando lançamentos automaticamente.

## Como Funciona

### Fluxo Completo

```
1. Você faz uma compra no cartão
   ↓
2. Banco envia notificação
   "Compra aprovada - R$ 45,90 em IFOOD"
   ↓
3. Smart Honey detecta notificação bancária
   ↓
4. Parser extrai: valor, estabelecimento
   ↓
5. Cria draft automaticamente
   - Cartão: Seu cartão padrão
   - Valor: R$ 45,90
   - Descrição: "IFOOD"
   - Data: Agora (hoje)
   ↓
6. Draft aparece na lista
   Status: "Enviando..." → "Lançado ✅"
```

## Pré-requisitos

### 1. Cartão Padrão Configurado

**Obrigatório:** Você deve ter um cartão padrão selecionado

```
Como configurar:
1. Abra o app
2. Na tela inicial, selecione um cartão na lista horizontal
3. Cartão selecionado terá ⭐ (estrela)
```

Este cartão será usado para **todas** as transações detectadas via notificação.

### 2. Permissão de Notificações

Na primeira vez, o app pedirá permissão para acessar notificações.

**Android:**
```
"Smart Honey precisa acessar notificações
para criar lançamentos automáticos de compras"
```

**Aceite** para ativar o recurso.

## Apps Bancários Suportados

### ✅ Google Wallet
- Package: `com.google.android.apps.walletnfcrel`
- Formatos detectados:
  - "Compra aprovada - R$ 45,90 em IFOOD"
  - "Débito de R$ 22,50 - Padaria Central"

### ✅ Samsung Pay
- Package: `com.samsung.android.spay`
- Formatos detectados:
  - "Pagamento aprovado R$ 75,00 - Restaurante"

### ✅ C6 Bank
- Package: `com.c6bank.app`
- Formatos detectados:
  - "Compra de R$ 18,90 no UBER aprovada"
  - "Transação aprovada: R$ 127,00 - AMAZON"

### ✅ Nubank
- Package: `com.nu.production`
- Formatos detectados:
  - "Compra no crédito - R$ 50,00 - Supermercado"
  - "Débito de R$ 30,00 em Posto Shell"

### ✅ Itaú
- Package: `br.com.itau`

### ✅ Bradesco
- Package: `br.com.bradesco`

### ✅ Santander
- Package: `com.santander.app`

## O Que é Detectado

### ✅ Valor da Transação

Padrões reconhecidos:
- `R$ 1.234,56`
- `R$ 123,45`
- `Valor: R$ 22,50`
- `123,45`

### ✅ Nome do Estabelecimento

Extrai nome após remover:
- Valores monetários
- Palavras comuns ("compra", "débito", "crédito", etc.)
- Últimos 4 dígitos do cartão

### ⚠️ Últimos 4 Dígitos do Cartão (Opcional)

Tentamos detectar mas não é obrigatório:
- `final 1234`
- `**** 1234`
- `cartão ...1234`

## Limitações

### ❌ Não Detecta

1. **Múltiplos cartões por notificação**
   - Usa sempre o cartão padrão configurado

2. **Categoria da despesa**
   - API infere automaticamente

3. **Notificações de débito automático**
   - Pode criar duplicatas (será implementado filtro)

4. **Apps não bancários**
   - Não detecta notificações de lojas, e-commerces, etc.

### ⚠️ Casos Especiais

**Parcelamento:**
- Notificação mostra valor da parcela
- Ex: "3/12x R$ 50,00" → detecta R$ 50,00

**Cashback:**
- Algumas notificações incluem cashback
- Ex: "Compra R$ 100,00 (cashback R$ 5,00)"
- Detecta R$ 100,00 (primeiro valor)

## Configuração

### Ativar/Desativar

**Tela:** Preferências

```
Integração
├─ Captura Automática (Wallet) [ON/OFF]
   └─ Detectar notificações de compras automaticamente
```

### Verificar Permissões

**Android:**
```
Configurações → Apps → Smart Honey → Permissões
└─ Notificações: Permitir
```

**iOS:**
```
Ajustes → Notificações → Smart Honey
└─ Permitir Notificações: ON
```

## Arquivos de Implementação

### 1. `src/services/notifications.ts`

**Serviço de notificações:**
- `requestPermission()` - Solicita permissão
- `setupNotificationListener()` - Escuta notificações (foreground)
- `setupBackgroundListener()` - Escuta quando app em background
- `showLocalNotification()` - Mostra notificação local

### 2. `src/utils/notificationParser.ts`

**Parser de notificações:**
- `isBankingNotification(packageName)` - Verifica se é app bancário
- `parseNotification(title, body, packageName)` - Extrai dados
- `extractAmount()` - Extrai valor monetário
- `extractEstablishment()` - Extrai nome do estabelecimento
- `extractCardLast4()` - Extrai últimos 4 dígitos

### 3. `App.tsx`

**Configuração de listeners:**
- Configura listeners no mount
- Handler para criar draft automaticamente
- Cleanup ao desmontar

## Exemplos de Notificações

### Google Wallet

```
Título: "Compra aprovada"
Corpo: "R$ 45,90 em IFOOD"

Parseado:
├─ amount: 45.90
├─ description: "IFOOD"
└─ timestamp: 2025-11-04T14:30:00.000Z
```

### C6 Bank

```
Título: "Transação aprovada"
Corpo: "R$ 127,00 - AMAZON no cartão final 1234"

Parseado:
├─ amount: 127.00
├─ description: "AMAZON"
├─ cardLast4: "1234"
└─ timestamp: 2025-11-04T14:30:00.000Z
```

### Nubank

```
Título: "Compra no crédito"
Corpo: "R$ 50,00 - Supermercado Extra"

Parseado:
├─ amount: 50.00
├─ description: "Supermercado Extra"
└─ timestamp: 2025-11-04T14:30:00.000Z
```

## Logs do Console

### Notificação Detectada

```
🔔 Notificação recebida: { title: "...", body: "..." }
🔔 Notificação bancária parseada: { amount: 45.90, description: "IFOOD" }
💰 Notificação bancária detectada!
💰 Criando lançamento automático de notificação bancária...
✅ Lançamento automático criado
```

### Notificação Ignorada

```
🔔 Notificação recebida: { title: "...", body: "..." }
ℹ️ Notificação ignorada (não bancária)
```

## Troubleshooting

### Notificações não são detectadas

**Possíveis causas:**
1. Permissão de notificações negada
2. App bancário não está na lista suportada
3. Formato da notificação não é reconhecido

**Solução:**
1. Verificar permissões: Configurações → Apps → Smart Honey
2. Verificar logs no console
3. Reportar formato da notificação para adicionar suporte

### Draft criado com dados errados

**Possíveis causas:**
1. Parser não conseguiu extrair valor corretamente
2. Nome do estabelecimento contém caracteres especiais

**Solução:**
1. Verificar logs: `🔔 Notificação bancária parseada`
2. Editar draft manualmente no app
3. Reportar caso para melhorar parser

### Duplicatas

**Possíveis causas:**
1. Múltiplas notificações da mesma compra
2. Notificação + lançamento manual

**Solução:**
1. Verificar lista de drafts
2. Excluir duplicata manualmente
3. (Futuro) Implementar detecção de duplicatas

### Cartão errado

**Causa:**
- Cartão padrão não corresponde à notificação

**Solução:**
1. Configurar cartão padrão correto na Home
2. Ou editar draft manualmente

## Privacidade

### Dados Coletados

- ✅ Título da notificação
- ✅ Corpo da notificação
- ✅ Package name do app
- ❌ NÃO coleta outras notificações (não bancárias)

### Dados Enviados para API

Apenas dados parseados:
- Descrição do estabelecimento
- Valor da transação
- Cartão padrão configurado
- Geolocalização (se permitida)

### Permissões Necessárias (Android)

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## Melhorias Futuras

### Planejadas

1. **Detecção de duplicatas**
   - Comparar valor + horário + estabelecimento
   - Evitar criar draft se já existe similar

2. **Identificação automática de cartão**
   - Usar últimos 4 dígitos para identificar cartão correto
   - Não depender apenas do cartão padrão

3. **Filtros inteligentes**
   - Ignorar notificações de débitos automáticos conhecidos
   - Configuração de estabelecimentos a ignorar

4. **Edição antes de criar**
   - Preview do draft antes de criar
   - Permitir ajustar valores/descrição

5. **Histórico de notificações**
   - Ver todas notificações detectadas
   - Recriar draft de notificação antiga

## Referências

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Google Wallet API](https://developers.google.com/wallet)
- [Samsung Pay](https://pay.samsung.com/)

---

**Criado:** Novembro 2025
**Status:** ✅ Implementado
**Versão:** 1.0.0

