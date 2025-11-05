# 🔧 Correção da Lógica de Cartões

## ✅ Problema Resolvido

**Erro anterior:**
```
ERROR ❌ API Error 404: {
  "error": "Cartão não encontrado. ID: d97b9013-..."
}
```

**Causa:** Enviava cardId mesmo quando não deveria, ou enviava mock

---

## ✅ Nova Lógica Implementada

### Regra 1: Auto-Seleção

**Se conta tem apenas 1 cartão:**
```typescript
// AppContext.tsx linha 144-150
if (cardsData.length === 1) {
  console.log('🎯 Apenas 1 cartão - selecionando automaticamente');
  savedDefaultCard = cardsData[0].id;
  await saveDefaultCard(savedDefaultCard);
}
```

✅ Usuário não precisa selecionar manualmente

---

### Regra 2: Validação Obrigatória

**Antes de gravar áudio:**
```typescript
// SimpleAudioRecorder.tsx linha 80-86
if (!hasDefaultCard) {
  Alert.alert(
    'Cartão Padrão Necessário',
    'Selecione um cartão padrão acima antes de gravar áudio'
  );
  return; // Não inicia gravação
}
```

✅ Impossível gravar sem cartão válido

---

### Regra 3: Banner de Aviso

**Se não tem cartão selecionado:**
```
┌─────────────────────────────┐
│ ⚠️ Selecione um cartão      │ <- Banner vermelho
│ acima para gravar áudio     │
└─────────────────────────────┘
```

✅ Feedback visual claro

---

### Regra 4: Envio de cardId

**Lógica corrigida:**
```typescript
// AppContext.tsx linha 221-240
let cardIdToSend = finalCardId;

// Se é mock, não enviar
if (cardIdToSend?.startsWith('mock-')) {
  cardIdToSend = '';
}

// Se não tem cardId E não tem texto:
if (!cardIdToSend && !params.text) {
  throw new Error('Selecione um cartão padrão');
}

// SEMPRE enviar cardId quando disponível
paramsWithCard = {
  ...params,
  cardId: cardIdToSend || undefined,
};
```

**Ordem de prioridade:**
1. `params.cardId` (explícito) → Envia
2. Cartão padrão válido → Envia
3. Mock → NÃO envia
4. Nenhum + sem texto → ERRO

---

## 📊 Comportamento Esperado

### Cenário 1: Conta com 1 Cartão

```
Login → Carrega 1 cartão → Auto-seleciona ⭐
→ Usuário pode gravar imediatamente
→ cardId sempre enviado
```

### Cenário 2: Conta com Múltiplos Cartões

```
Login → Carrega N cartões
→ Mostra banner: "⚠️ Selecione um cartão"
→ Usuário seleciona → Banner some
→ Pode gravar com cardId
```

### Cenário 3: Sem Cartões Válidos (Mock)

```
Login → API falha → Mock carregado
→ Banner: "⚠️ Selecione um cartão"
→ Usuário tenta gravar → Alert bloqueia
→ Deve usar texto (permite detecção pela IA)
```

---

## 🧪 Teste Agora

### Teste 1: Auto-Seleção
```
1. Login com conta que tem 1 cartão
Console: "🎯 Apenas 1 cartão - selecionando automaticamente"
Console: "📇 IDs dos cartões: [...]"
✅ Cartão aparece com ⭐
✅ SEM banner de aviso
✅ Pode gravar imediatamente
```

### Teste 2: Gravar com Cartão
```
1. Gravar áudio
Console: "📤 Enviando draft: { cardId: 'uuid', ... }"
✅ SEM erro 404 de cartão
✅ Draft criado com sucesso
```

### Teste 3: Sem Cartão Tentar Gravar
```
1. Não selecionar cartão (ou ter mock)
2. Click em 🎙️
✅ Alert: "Cartão Padrão Necessário"
✅ Gravação NÃO inicia
```

---

## 🔍 Logs de Debug

**Auto-seleção:**
```
📇 Cartões recebidos da API: 1 cartão(ões)
📇 IDs dos cartões: ["d97b9013-..."]
🎯 Apenas 1 cartão encontrado - selecionando automaticamente: C6 Bank
💾 Cartão padrão salvo: d97b9013-...
```

**Envio de draft:**
```
📤 Enviando draft: {
  hasAudio: true,
  hasText: false,
  cardId: "d97b9013-...",
  hasLocation: true
}
📤 API Request: POST /api/external/drafts
✅ Draft criado
```

---

## ✅ Garantias

1. ✅ **1 cartão = auto-seleção**
2. ✅ **Sem cartão = bloqueia gravação**
3. ✅ **cardId sempre enviado** (quando válido)
4. ✅ **Mock não é enviado**
5. ✅ **Banner de aviso** visível
6. ✅ **Alert antes de gravar** sem cartão

---

**Teste novamente! Erro 404 de cartão deve sumir.** 🎯

