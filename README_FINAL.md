# Smart Honey v2.0 - Guia Final

## ✅ Implementado

### 1. Gravador Simplificado
- Click para gravar (não segurar)
- Botões: Descartar | Pausar | Enviar
- SEM gestos

### 2. CRUD Completo
- CREATE: POST /api/external/drafts
- READ: GET /api/entry-drafts
- UPDATE: PUT /api/entry-drafts/:id
- DELETE: DELETE /api/entry-drafts/:id

### 3. Seleção de Responsáveis (Destinations)
- GET /api/external/destinations
- Multi-select abaixo do campo de texto
- Chips clicáveis (✓ quando selecionado)
- Opcional (usa nome do usuário se não selecionar)

### 4. Cartão Padrão
- Auto-seleciona se tem apenas 1
- Obriga seleção para gravar áudio
- SEMPRE envia cardId quando disponível

### 5. Autenticação JWT
- Login → Redireciona em 2s
- Token automático em requests
- Auto-logout em 401

### 6. Geolocalização
- Captura automática
- Enviada em todos lançamentos

---

## 🧪 Teste

### Gravação
```
1. Click 🎙️
2. Falar
3. Click Enviar
✅ Draft criado com cardId
```

### Destinations
```
1. Digite texto no campo
2. Selecione responsáveis abaixo (chips)
3. Enviar
✅ selectedDestinations enviado
```

### CRUD
```
1. Tap draft → Editar → Salvar
✅ PUT /api/entry-drafts/:id

2. Tap draft → Excluir → Confirmar
✅ DELETE /api/entry-drafts/:id
```

---

## 📋 Endpoints

| Método | URL | Uso |
|--------|-----|-----|
| POST | /api/auth/login | Login |
| POST | /api/external/drafts | Criar draft |
| GET | /api/entry-drafts | Listar drafts |
| PUT | /api/entry-drafts/:id | Editar |
| DELETE | /api/entry-drafts/:id | Excluir |
| GET | /api/cards | Cartões |
| GET | /api/users | Usuários |
| GET | /api/external/destinations | Responsáveis |

---

## 🎯 Campos Enviados em POST /api/external/drafts

```typescript
{
  text?: string,
  audio?: File,
  cardId: string,              // SEMPRE enviado
  selectedDestinations?: [],    // Opcional
  latitude?: number,
  longitude?: number,
  date: ISO8601,               // Sempre enviado
}
```

---

**Tudo pronto! Zero erros.** ✅


