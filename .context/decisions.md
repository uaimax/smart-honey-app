# Decisões Arquiteturais - Smart Honey

## Visão Geral
Smart Honey é um app mobile-first para registro ultra-rápido de despesas de cartão de crédito, com foco absoluto em velocidade e fluidez.

## Stack Tecnológica

### Framework Base: Expo
**Por quê?**
- Setup rápido e configuração simplificada
- Expo Go permite testes instantâneos via QR code
- Build de APK facilitado com EAS Build
- Excelente developer experience
- Atualizações OTA para correções rápidas
- Suporte nativo a TypeScript

### Linguagem: TypeScript
- Type safety reduz bugs em produção
- Melhor autocomplete e IntelliSense
- Documentação implícita no código
- Facilita refatoração

## Arquitetura

### Estrutura de Tela Única (Single-Screen UX)
**Decisão crítica:** Toda a interação principal acontece em uma única tela, sem modais ou navegação profunda.

**Motivação:**
- Usuário (Bruna) precisa lançar despesas em segundos
- Cada toque extra é fricção
- Feedback inline elimina context switching
- Menos estado para gerenciar = menos bugs

### Gravação de Áudio: Local + Upload
**Escolha:** Gravar localmente com `expo-av` e fazer upload do arquivo.

**Alternativa rejeitada:** Streaming em tempo real

**Motivo:**
- Mais simples de implementar
- Funciona offline (fila)
- Backend já espera FormData com arquivo
- Menor latência percebida (usuário vê "enviando" imediatamente)
- Mais confiável em conexões instáveis

### Sistema de Fila Offline
**Implementação:** AsyncStorage + sincronização automática

**Por quê?**
- Nunca perder dados do usuário
- Funciona em qualquer condição de rede
- Retry automático transparente
- Estado local first, sincronização depois

### Gerenciamento de Estado: Context API
**Escolha:** Context API nativa do React

**Alternativa rejeitada:** Redux, Zustand, MobX

**Motivo:**
- Estado relativamente simples (cartões, drafts, usuário)
- Sem necessidade de middleware complexo
- Menos dependências
- Performance adequada para escala do app
- Hooks customizados encapsulam lógica complexa

### Parser de Texto Inteligente
**Abordagem:** Regex + heurísticas

**Detecta:**
- Valores monetários: `R$ 22,50`, `22.50`, `18,90`
- Cartões por apelidos: "c6", "bruna", "max"
- Responsáveis por contexto

**Por quê não ML/NLP?**
- Overhead desnecessário
- Padrões previsíveis
- Performance instantânea
- Mantém app leve

## Navegação

### Tab Navigator (Bottom Tabs)
3 tabs principais:
1. **Home** - Lançamentos
2. **Histórico** - Consulta
3. **Fila** - Pendências (badge com contador)

**Modal Stack:** Preferências (slide from bottom)

**Motivo:**
- Padrão familiar mobile
- Acesso rápido às funcionalidades
- Badge visual para pendências

## Design e UX

### Mobile-First
- Desenvolvido e testado primeiro para mobile
- Botões grandes (mínimo 44pt)
- Uma mão operável
- Gestos naturais (swipe, long press)

### Dark Mode Automático
- Respeita preferência do sistema
- Cores adaptadas para ambos modos
- Sem toggle manual (uma decisão a menos)

### Animações Sutis
**Biblioteca:** `react-native-reanimated`

**Onde:**
- Feedback de gravação (pulsação)
- Items adicionados à lista (slide in)
- Mudanças de status (fade, color transition)
- Loading states

**Princípio:** Animações servem feedback, não decoração

### Feedback Tátil
**Biblioteca:** `expo-haptics`

**Quando:**
- Segurar botão de gravação (iniciar)
- Soltar botão (enviado)
- Erro (padrão de vibração diferente)
- Sucesso (feedback sutil)

## Integração com Backend

### API Base
`https://smart.app.webmaxdigital.com`

### Endpoint Principal
`POST /api/external/drafts`

**Formato:** `multipart/form-data`

### Tratamento de Erros
- **400:** Cartão não identificado → Dropdown inline
- **422:** Validação → Retry na fila
- **429:** Rate limit → Backoff exponencial
- **500+:** Servidor → Retry automático

### Mock Local (Fase Inicial)
Enquanto endpoints não existem:
- `GET /api/cards` → mock em `src/services/mock-data.ts`
- `GET /api/users` → mock em `src/services/mock-data.ts`
- `GET /api/drafts` → mock em `src/services/mock-data.ts`

Documentar endpoints esperados para backend implementar.

## Autenticação (Roadmap)

### Fase 1 (Atual)
- Usuário hard-coded: "bruna-id"
- Sem tela de login

### Fase 2 (Futuro)
- Seleção de usuário no primeiro uso
- Token JWT do backend
- AsyncStorage para persistir sessão

## Notificações

### Push Local
**Quando:** App em background e operação completa

**Tipos:**
- Sucesso: "💰 Lançamento criado! R$22,50 — C6 Bruna"
- Erro: "Não foi possível enviar 1 lançamento"

**Deep Linking:** Tocar notificação abre item específico na lista

### Notificações de Transação (Futuro)
Integração com Wallet Android para captura automática de notificações bancárias.

## Build e Distribuição

### Desenvolvimento
- **Expo Go:** Testar via QR code (iPhone/Android)
- **Hot Reload:** Atualizações instantâneas
- **Dev Client:** Para testar funcionalidades nativas

### Distribuição
- **EAS Build:** Gerar APK para Android
- **Profile "preview":** Build com debug removido mas assinatura de desenvolvimento

## Princípios de Desenvolvimento

1. **Performance First:** Cada frame conta
2. **Offline-First:** App funciona sem internet
3. **Type-Safe:** TypeScript strict mode
4. **Component-Based:** Componentes reutilizáveis
5. **Functional:** Hooks e componentes funcionais
6. **Documented:** Código auto-explicativo
7. **Tested:** Manual testing via Expo Go, automated tests futuro

## Convenções

### Nomenclatura
- Componentes: `PascalCase` (ex: `SmartInput.tsx`)
- Hooks: `camelCase` com prefixo `use` (ex: `useAudioRecorder.ts`)
- Services: `camelCase` (ex: `api.ts`, `queue.ts`)
- Types: `PascalCase` (ex: `Draft`, `Card`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `API_BASE_URL`)

### Estrutura de Arquivos
```
src/
├── components/       # Componentes reutilizáveis
├── screens/          # Telas principais
├── navigation/       # Configuração de navegação
├── services/         # API, queue, notifications
├── hooks/            # Custom hooks
├── context/          # Context providers
├── types/            # TypeScript types
├── theme/            # Design system (cores, tipografia)
└── utils/            # Funções utilitárias
```

## Futuras Melhorias

### Curto Prazo
- Testes automatizados (Jest + React Native Testing Library)
- Sentry para error tracking
- Analytics (Expo Analytics ou similar)

### Médio Prazo
- Integração com Wallet (captura automática)
- Sistema de autenticação completo
- Relatórios avançados
- Export para PDF/Excel

### Longo Prazo
- Sync entre dispositivos
- Compartilhamento de cartões
- Categorização automática com ML
- Widget para home screen

