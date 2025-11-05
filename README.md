# 🍯 Smart Honey

App mobile para registro ultra-rápido de despesas de cartão de crédito.

## 📱 Sobre

Smart Honey é um app React Native (Expo) focado em velocidade e fluidez. Permite registrar despesas por:
- **Gravação de áudio** (principal) - fale e pronto
- **Texto inteligente** - digite naturalmente
- **Captura automática** (futuro) - integração com Wallet

**Usuários:**
- **Bruna** - usuária principal, lança despesas frequentemente
- **Max** - revisa relatórios, uso menos frequente

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ e npm
- Expo Go app no seu celular ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Instalação

```bash
# Clonar/navegar para o projeto
cd smart-honey-app

# Instalar dependências (já feito se acabou de criar)
npm install

# Iniciar servidor de desenvolvimento
npm start
```

### Testando no Celular

1. Execute `npm start`
2. Abra o app **Expo Go** no seu celular
3. Escaneie o QR code que aparece no terminal
4. O app será carregado automaticamente!

**Dica:** Mantenha o celular na mesma rede Wi-Fi do computador.

### Testando Funcionalidades

#### Gravação de Áudio
1. Segure o botão 🎙️ "Segurar para gravar"
2. Fale: "R$22,50 picolés no C6 da Bruna"
3. Solte o botão
4. Veja o feedback inline aparecer

#### Lançamento Manual
1. Digite no campo: "ifood 18,90 max"
2. O app detecta valor e cartão automaticamente
3. Toque em "Salvar"
4. Campo limpa e mantém último cartão

#### Modo Offline
1. Ative modo avião no celular
2. Tente lançar uma despesa
3. Veja "⏸️ Aguardando conexão..."
4. Desative modo avião
5. App envia automaticamente!

## 📁 Estrutura do Projeto

```
smart-honey-app/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── SmartInput.tsx
│   │   ├── RecordButton.tsx
│   │   └── DraftItem.tsx
│   ├── screens/          # Telas principais
│   │   ├── HomeScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── QueueScreen.tsx
│   │   └── PreferencesScreen.tsx
│   ├── navigation/       # Configuração de navegação
│   │   └── AppNavigator.tsx
│   ├── services/         # Lógica de negócio
│   │   ├── api.ts        # Chamadas de API
│   │   ├── queue.ts      # Fila offline
│   │   └── notifications.ts
│   ├── hooks/            # Custom hooks
│   │   ├── useAudioRecorder.ts
│   │   ├── useQueue.ts
│   │   └── useDrafts.ts
│   ├── context/          # Estado global
│   │   └── AppContext.tsx
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── theme/            # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   └── utils/            # Funções utilitárias
│       └── parsers.ts    # Parser de texto
├── .context/             # Documentação para LLMs
│   └── decisions.md
├── .cursorrules          # Regras do projeto
├── Claude.md             # Guia para IAs
├── app.json              # Configuração Expo
├── babel.config.js       # Configuração Babel
└── package.json
```

## 🛠️ Comandos Disponíveis

```bash
# Desenvolvimento
npm start                 # Inicia servidor Expo
npm run android           # Abre no Android (emulador/device)
npm run ios               # Abre no iOS (apenas macOS)
npm run web               # Abre no navegador

# Build
npm run build:apk         # Gera APK para Android (requer EAS)
```

## 📦 Build para Produção

### Configurar EAS Build (primeira vez)

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Login na conta Expo
eas login

# Configurar projeto
eas build:configure
```

### Gerar APK

```bash
# Build de preview (assinatura dev, ideal para testes)
npm run build:apk

# Build de produção (assinatura release, para distribuição)
eas build -p android --profile production
```

O link para download do APK aparecerá no terminal após o build.

## 🔌 API Backend

### Endpoint Principal

```
POST https://smart.app.webmaxdigital.com/api/external/drafts
Content-Type: multipart/form-data

Campos:
- audio (File, opcional)
- text (String, opcional)
- cardId (String, opcional)
- userId (String, opcional)
- geolocation (String, opcional, formato: "lat,long")

Resposta (201):
{
  "success": true,
  "message": "💰 Lançamento registrado com sucesso!",
  "summary": "📝 Descrição: Picolés\n💲 Valor: R$ 22,50",
  "draft": { ... }
}
```

### Endpoints Esperados (mockar se não existirem)

```
GET /api/cards
Response: [{ id: string, name: string, owner: string }]

GET /api/users
Response: [{ id: string, name: string }]

GET /api/drafts?month=YYYY-MM
Response: [{ id, description, amount, cardId, userId, timestamp }]
```

## 🎨 Design

### Cores Principais

- **Primary:** `#FFA500` (Honey orange)
- **Success:** `#10B981`
- **Error:** `#EF4444`
- **Background Light:** `#FFFFFF`
- **Background Dark:** `#1A1A1A`

### Princípios de UX

1. **Tela única** - sem modals, sem navegação profunda
2. **Feedback inline** - tudo acontece no contexto
3. **Offline-first** - funciona sem internet
4. **Mobile-first** - botões grandes, uma mão operável
5. **Velocidade** - lançar despesa em segundos

## 🧪 Testes

### Manual (Expo Go)
- Testar em dispositivo real via QR code
- Verificar áudio, texto, offline, erros
- Testar light/dark mode

### Automatizados (futuro)
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## 🐛 Debug

### Logs
```typescript
// Desenvolvimento
console.log('Debug:', data);

// Produção (usar logger apropriado)
import { logger } from '@/utils/logger';
logger.info('Info message', { metadata });
```

### React DevTools
```bash
# Abrir React DevTools standalone
npx react-devtools
```

### Network Requests
```bash
# Ver requests HTTP no terminal
npx expo start --dev-client
```

## 📚 Documentação Adicional

- **[.context/decisions.md](./.context/decisions.md)** - Decisões arquiteturais
- **[.cursorrules](./.cursorrules)** - Regras de código
- **[Claude.md](./Claude.md)** - Guia completo para IAs
- **[Expo Docs](https://docs.expo.dev/)** - Documentação oficial

## 🤝 Contribuindo

### Workflow

1. Criar branch descritiva: `feat/audio-recording`
2. Fazer alterações seguindo `.cursorrules`
3. Testar no Expo Go
4. Commit com mensagem descritiva: `feat: add audio recording`
5. Push e criar PR

### Tipos de Commit

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `refactor:` - Refatoração de código
- `test:` - Testes
- `chore:` - Manutenção

## 🔒 Segurança

- ✅ API keys em variáveis de ambiente
- ✅ Validação de inputs
- ✅ HTTPS obrigatório
- ✅ Permissões solicitadas apenas quando necessário

## 🚧 Roadmap

### v1.0 (MVP) - Em desenvolvimento
- [x] Setup inicial
- [ ] Gravação de áudio
- [ ] Lançamento manual
- [ ] Fila offline
- [ ] Tela principal completa
- [ ] Histórico e busca
- [ ] Build APK

### v1.1
- [ ] Sistema de autenticação
- [ ] Relatórios avançados
- [ ] Dark mode completo
- [ ] Notificações push

### v2.0
- [ ] Integração Wallet (captura automática)
- [ ] Categorização inteligente
- [ ] Export PDF/Excel
- [ ] Sincronização entre dispositivos

## 📄 Licença

Privado - Web Max Digital © 2025

## 💬 Suporte

- **Issues:** Criar issue no repositório
- **Email:** suporte@webmaxdigital.com
- **Docs:** Consultar `Claude.md` e `.context/decisions.md`

---

**Feito com 🍯 por Web Max Digital**

