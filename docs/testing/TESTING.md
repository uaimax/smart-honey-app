# 🧪 Guia de Testes - Smart Honey

## Testando com Expo Go (Recomendado)

### Setup Inicial

1. **Instalar Expo Go no celular**
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Iniciar servidor de desenvolvimento**
   ```bash
   cd /home/uaimax/projects/smart-honey-app
   npm start
   ```

3. **Conectar dispositivo**
   - Android: Abrir Expo Go → Escanear QR code
   - iOS: Câmera nativa → Escanear QR code

### Cenários de Teste

#### 1. Gravação de Áudio - Nova Interface WhatsApp ✨

**Objetivo:** Testar novo sistema de gravação com gestos

**Teste 1.1: Gravação Rápida (Segurar e Soltar)**
1. Na tela inicial, pressionar e segurar botão 🎙️
2. Falar claramente: "R$22,50 picolés no C6 da Bruna"
3. Soltar botão imediatamente após falar
4. Aguardar feedback

**Resultado Esperado:**
- Timer aparece durante gravação
- Ponto vermelho pulsante
- Feedback "⏳ Enviando..."
- Após processamento: "✅ Lançamento criado com sucesso!"
- Item aparece na lista

**Teste 1.2: Cancelar com Gesto (Deslizar Esquerda)**
1. Pressionar e segurar botão 🎙️
2. Enquanto segura, deslizar o dedo para a esquerda
3. Quando aparecer "Solte para cancelar", soltar

**Resultado Esperado:**
- Hint "Deslize para cancelar" aparece
- Botão do microfone se move para esquerda
- Ao soltar: gravação é cancelada
- Volta ao estado inicial, nenhum áudio enviado

**Teste 1.3: Travar Gravação (Deslizar Cima)**
1. Pressionar e segurar botão 🎙️
2. Deslizar o dedo para cima
3. Quando aparecer "Solte para travar", soltar
4. Verificar interface travada

**Resultado Esperado:**
- Hint "Deslize para travar" aparece
- Botão se move para cima
- Ao soltar: modo travado ativado
- Aparece header com timer e botão X
- Três botões de controle visíveis (Excluir, Pausar, Enviar)

**Teste 1.4: Pausar e Retomar (Modo Travado)**
1. Travar gravação (teste 1.3)
2. Falar por 3 segundos
3. Clicar em "Pausar" ⏸
4. Aguardar 2 segundos (timer deve parar)
5. Clicar em "Retomar" ▶️
6. Falar mais 3 segundos
7. Clicar em "Enviar" 📤

**Resultado Esperado:**
- Timer para quando pausado
- Texto muda para "⏸ Pausado"
- Timer continua de onde parou ao retomar
- Áudio final contém apenas partes gravadas (sem pausas)

**Teste 1.5: Excluir no Modo Travado**
1. Travar gravação
2. Falar algo
3. Clicar em "Excluir" 🗑️

**Resultado Esperado:**
- Gravação é descartada
- Volta ao estado inicial
- Nenhum áudio enviado
- Vibração de aviso

**Teste 1.6: Fechar com X**
1. Travar gravação
2. Clicar no X no canto superior direito

**Resultado Esperado:**
- Mesmo comportamento de "Excluir"
- Gravação descartada

**Possíveis Erros:**
- Se API não responder: "❌ Erro ao enviar. Adicionado à fila."
- Se permissão de microfone negada: Alerta pedindo permissão
- Se gesto não funcionar: Ajustar velocidade/distância do deslize

**Feedback Tátil Esperado:**
- Vibração média ao iniciar gravação
- Vibração pesada ao travar
- Vibração leve ao pausar
- Vibração média ao retomar
- Vibração de aviso ao cancelar
- Vibração de sucesso ao enviar

---

#### 2. Lançamento Manual (Texto) 📝

**Objetivo:** Testar parser de texto inteligente

**Passos:**
1. Tocar no campo de texto grande
2. Digitar: "ifood 18,90 max"
3. Observar sugestões inline
4. Tocar "Salvar Lançamento"

**Resultado Esperado:**
- Sugestões aparecem mostrando:
  - Valor: R$ 18,90
  - Descrição: ifood
  - Responsável: Max (se detectado)
- Botão "Salvar" fica ativo
- Após salvar, campo limpa

**Testar Variações:**
- "R$ 50,00 netflix bruna"
- "uber 12.50 uz"
- "amazon 127 c6 max"

---

#### 3. Modo Offline 📵

**Objetivo:** Verificar fila offline e sincronização

**Passos:**
1. Ativar modo avião no celular
2. Tentar fazer um lançamento (áudio ou texto)
3. Observar mensagem
4. Ir para aba "Fila" (terceira aba)
5. Verificar item na fila
6. Desativar modo avião
7. Aguardar sincronização automática

**Resultado Esperado:**
- Offline: "📵 Sem internet — enviaremos quando estiver online"
- Item aparece na fila com status "Enviando..."
- Ao reconectar: Sync automático em até 30 segundos
- Item some da fila e vai para lista principal

---

#### 4. Histórico e Busca 🔍

**Objetivo:** Testar filtros e busca

**Passos:**
1. Ir para aba "Histórico"
2. Fazer alguns lançamentos primeiro
3. Usar barra de busca: digitar "ifood"
4. Verificar resultados filtrados

**Resultado Esperado:**
- Lista mostra apenas itens que contêm "ifood"
- Pull-to-refresh funciona
- Tocar em item expande detalhes inline

---

#### 5. Fila de Pendências ⏳

**Objetivo:** Gerenciar lançamentos que falharam

**Passos:**
1. Com internet, forçar um erro (mockar offline)
2. Ir para aba "Fila"
3. Ver lançamentos pendentes
4. Tocar "Tentar Novamente"
5. Tocar "Excluir" em outro item

**Resultado Esperado:**
- Lista mostra itens com status de erro
- Retry reenvia o item
- Delete remove da fila após confirmação

---

#### 6. Preferências ⚙️

**Objetivo:** Verificar configurações

**Passos:**
1. Tocar em "⚙️ Preferências" no rodapé da tela inicial
2. Explorar seções:
   - Integração Wallet (toggle)
   - Cartões (lista)
   - Responsáveis (lista)
   - Privacidade (toggles)
   - Sobre (versão)

**Resultado Esperado:**
- Todos switches funcionam
- Cartões mostram badge "Padrão" no favorito
- Modal abre e fecha corretamente

---

#### 7. Dark Mode 🌙

**Objetivo:** Testar tema automático

**Passos:**
1. Ir em Configurações do celular
2. Mudar tema para Dark
3. Voltar ao app
4. Verificar cores adaptadas

**Resultado Esperado:**
- Background muda para escuro (#1A1A1A)
- Textos ficam claros
- Primary color ajustado (#FFB833)
- Transição suave

---

#### 8. Feedback Tátil 📳

**Objetivo:** Verificar vibrações

**Passos:**
1. Segurar botão de gravação
2. Soltar botão
3. Fazer lançamento com sucesso
4. Forçar um erro

**Resultado Esperado:**
- Vibração média ao iniciar gravação
- Vibração leve ao soltar
- Feedback tátil apropriado em cada ação

---

#### 9. Totais do Mês 💰

**Objetivo:** Verificar cálculos

**Passos:**
1. Fazer vários lançamentos com usuários diferentes
2. Rolar até o rodapé da tela inicial
3. Ver chips com totais

**Resultado Esperado:**
- Cada usuário tem seu total calculado
- Valores aparecem corretamente (R$ XX,XX)
- Atualiza em tempo real

---

#### 10. Pull to Refresh 🔄

**Objetivo:** Testar atualização manual

**Passos:**
1. Em qualquer tela com lista
2. Arrastar para baixo (pull down)
3. Soltar

**Resultado Esperado:**
- Spinner de loading aparece
- Dados recarregam do backend/cache
- Lista atualiza

---

#### 9. Autenticação e Login 🔐

**Objetivo:** Testar sistema de login JWT

**Teste 9.1: Login com Credenciais Válidas**
1. Fechar app completamente
2. Abrir app
3. Ver LoginScreen
4. Digitar email: `usuario@email.com`
5. Digitar senha: (senha correta)
6. Marcar checkbox "Lembrar-me por 30 dias"
7. Clicar "Entrar"

**Resultado Esperado:**
- Loading spinner aparece
- Console: `📤 API Request: POST /api/auth/login`
- Console: `✅ Login bem-sucedido`
- Console: `💾 Token salvo com sucesso`
- Navega automaticamente para MainTabs
- Não mostra LoginScreen novamente ao reabrir app

**Teste 9.2: Login com Credenciais Inválidas**
1. Abrir LoginScreen
2. Digitar email/senha incorretos
3. Clicar "Entrar"

**Resultado Esperado:**
- Loading spinner aparece e desaparece
- Mensagem de erro: "Email ou senha inválidos"
- Permanece no LoginScreen
- Campos não são limpos (usuário pode corrigir)

**Teste 9.3: Logout**
1. Estar logado
2. Ir para aba "Preferências"
3. Rolar até seção "Conta"
4. Clicar "Sair da Conta"
5. Confirmar no Alert

**Resultado Esperado:**
- Console: `🔓 Logout realizado`
- Navega para LoginScreen
- Ao reabrir app, mostra LoginScreen (não lembra)

---

#### 10. Cartão Padrão 💳

**Objetivo:** Configurar cartão padrão para notificações automáticas

**Teste 10.1: Selecionar Cartão Padrão**
1. Na tela inicial (HomeScreen)
2. Logo abaixo do header, ver lista horizontal de cartões
3. Label: "Cartão Padrão para Notificações"
4. Clicar em um cartão (ex: "C6 Bank - Max")

**Resultado Esperado:**
- Cartão selecionado tem borda azul destacada
- Ícone ⭐ aparece no cartão selecionado
- Console: `✅ Cartão padrão atualizado: card-xyz`
- Console: `💾 Cartão padrão salvo: card-xyz`

**Teste 10.2: Lançamento Sem Cartão Detectado**
1. Configurar cartão padrão: "C6 Bank - Max"
2. Gravar áudio: "R$ 20 mercado" (sem mencionar cartão)
3. Enviar

**Resultado Esperado:**
- Draft criado automaticamente com cartão padrão
- Campos enviados incluem `cardId` do cartão padrão
- API não retorna erro de "cartão não identificado"

---

#### 11. Geolocalização 📍

**Objetivo:** Testar captura automática de coordenadas GPS

**Teste 11.1: Permissão de Localização**
1. Instalar app pela primeira vez
2. Fazer login
3. Ver diálogo de permissão de localização

**Resultado Esperado:**
- Diálogo nativo do sistema
- Texto: "Smart Honey usa sua localização para identificar estabelecimentos próximos..."
- Console: `📍 Permissão de localização: concedida` (se aceitar)

**Teste 11.2: Lançamento com Geolocalização**
1. Permitir localização
2. Fazer lançamento (áudio ou texto)
3. Verificar console

**Resultado Esperado:**
- Console: `📍 Obtendo localização atual...`
- Console: `✅ Localização obtida: -23.xxx -46.xxx`
- Campos enviados incluem `latitude` e `longitude`
- Lançamento criado normalmente

**Teste 11.3: Sem Permissão de Localização**
1. Negar permissão
2. Fazer lançamento

**Resultado Esperado:**
- Console: `⚠️ Sem permissão de localização`
- Lançamento criado NORMALMENTE (sem bloquear)
- Campos latitude/longitude não são enviados

---

#### 12. Notificações Bancárias 🔔

**Objetivo:** Criar lançamentos automaticamente de notificações

**IMPORTANTE:** Requer dispositivo Android real (não funciona em simulador)

**Pré-requisitos:**
- ✅ Cartão padrão configurado
- ✅ Permissão de notificações concedida

**Teste 12.1: Notificação Bancária (Google Wallet)**
1. Configurar cartão padrão
2. Simular ou fazer compra real
3. Receber notificação: "Compra aprovada - R$ 45,90 em IFOOD"

**Resultado Esperado:**
- Console: `🔔 Notificação recebida`
- Console: `💰 Notificação bancária detectada!`
- Console: `💰 Criando lançamento automático...`
- Console: `✅ Lançamento automático criado`
- Draft aparece automaticamente na lista
- Descrição: "IFOOD - 45.90"
- Valor: R$ 45,90
- Cartão: Seu cartão padrão
- Data: Hoje

**Teste 12.2: Notificação Não Bancária**
1. Receber notificação de WhatsApp/Instagram/etc

**Resultado Esperado:**
- Console: `ℹ️ Notificação ignorada (não bancária)`
- Nenhum draft criado

---

## Checklist de Teste Completo

### Funcionalidades Core
- [ ] Gravação de áudio funciona
- [ ] Gravação pode ser pausada/retomada
- [ ] Gravação pode ser cancelada com gesto
- [ ] Gravação pode ser travada (modo mãos livres)
- [ ] Lançamento manual (texto) funciona
- [ ] Parser detecta valores corretamente
- [ ] Parser detecta cartões
- [ ] Parser detecta responsáveis
- [ ] Parser detecta datas ("ontem", "amanhã")

### Autenticação
- [ ] Login com credenciais válidas funciona
- [ ] Login com credenciais inválidas mostra erro
- [ ] Token persiste após reabrir app (rememberMe)
- [ ] Logout limpa dados e volta para login
- [ ] Token expirado (401) redireciona para login

### Cartão Padrão
- [ ] Pode selecionar cartão padrão
- [ ] Cartão padrão persiste após reabrir
- [ ] Lançamento usa cartão padrão se não detectado

### Geolocalização
- [ ] Permissão de localização é solicitada
- [ ] Coordenadas são capturadas automaticamente
- [ ] Lançamento funciona SEM localização (não bloqueia)
- [ ] Cache de localização funciona (< 5 min)

### Notificações Bancárias
- [ ] Permissão de notificações é solicitada
- [ ] Notificação bancária cria draft automaticamente
- [ ] Notificação não bancária é ignorada
- [ ] Cartão padrão é usado para notificações

### Offline & Fila
- [ ] Fila offline salva lançamentos
- [ ] Sincronização automática funciona
- [ ] Retry de lançamentos funciona
- [ ] Delete de lançamentos funciona

### UI/UX
- [ ] Dark mode ativa automaticamente
- [ ] Feedback tátil funciona em todas ações
- [ ] Totais calculam corretamente
- [ ] Pull-to-refresh atualiza dados
- [ ] Navegação entre tabs funciona
- [ ] Modal de preferências abre/fecha
- [ ] Permissões são solicitadas corretamente
- [ ] App não trava em nenhum cenário
- [ ] Feedback inline sempre aparece
- [ ] Animações são suaves (60fps)
- [ ] Datas sempre válidas (não "Invalid Date")

## Casos Extremos

### Texto Vazio
- Tentar enviar sem digitar nada
- **Esperado:** Botão salvar desabilitado

### Valor Sem Centavos
- Digitar "50 netflix"
- **Esperado:** Parser detecta R$ 50,00

### Múltiplos Valores
- Digitar "R$10,00 e R$20,00"
- **Esperado:** Pega primeiro valor

### Cartão Não Identificado
- Digitar "30 pizza"
- **Esperado:** Envia mesmo sem cartão (opcional)

### Muitos Lançamentos
- Criar 50+ lançamentos
- **Esperado:** Lista renderiza suavemente (FlatList)

## Problemas Conhecidos

### Notificações em iOS
- Captura de notificações bancárias limitada no iOS
- Google/Samsung Wallet são Android-only
- Recomendado: Teste em Android real

### First-time Setup
- Requer várias permissões na primeira vez
- Pode parecer invasivo (mas todas são necessárias)
- Explicações claras em cada solicitação

## Performance

### Métricas Esperadas
- **App start:** < 3 segundos
- **Gravação start:** < 500ms
- **Submit feedback:** < 1 segundo (mock)
- **Lista scroll:** 60fps

## Relatando Bugs

Ao encontrar bugs, anotar:
1. Dispositivo (modelo, OS)
2. Passos para reproduzir
3. Resultado esperado vs obtido
4. Screenshots/vídeo se possível
5. Logs do console (se acessível)

---

**Happy Testing! 🍯**

