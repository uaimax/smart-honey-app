# 📱 Guia para Gerar APK - Smart Honey

## ✅ Pré-requisitos Confirmados

- [x] `eas.json` configurado
- [x] `app.json` com package Android
- [x] Script `build:apk` no package.json
- [x] Todas funcionalidades implementadas
- [x] Zero erros de lint

**Você está pronto para gerar o APK!**

---

## 🚀 Passos para Gerar APK

### 1. Instalar EAS CLI (se ainda não tem)

```bash
npm install -g eas-cli
```

### 2. Fazer Login na Conta Expo

```bash
eas login
```

Credenciais: Use sua conta Expo ou crie uma em https://expo.dev

### 3. Configurar Projeto no EAS (Primeira Vez)

```bash
cd /home/uaimax/projects/smart-honey-app
eas build:configure
```

Perguntas que vai fazer:
- Criar projeto no Expo? → **Sim**
- Platform? → **Android**

### 4. Gerar APK

```bash
npm run build:apk
```

Ou:
```bash
eas build -p android --profile preview
```

**Isso vai:**
1. Fazer upload do código
2. Build na nuvem (Expo servers)
3. Gerar APK assinado
4. Disponibilizar link para download

**Tempo:** ~10-15 minutos

---

## 📦 Profiles Disponíveis

### Preview (Recomendado para Teste)
```bash
npm run build:apk
# ou
eas build -p android --profile preview
```

**Características:**
- APK para testes
- Assinatura de desenvolvimento
- Instalável em qualquer device
- Não pode ser publicado na Play Store

### Production (Para Publicação)
```bash
eas build -p android --profile production
```

**Características:**
- APK/AAB de produção
- Assinatura de release
- Pronto para Play Store
- Otimizado

---

## 📥 Após Build Concluir

**Terminal mostrará:**
```
✔ Build finished

Build artifact URL:
https://expo.dev/artifacts/eas/abc123.apk
```

### Como Instalar no Android:

1. **Download do APK**
   - Abra o link no celular
   - Ou baixe no computador e transfira

2. **Permitir Instalação**
   - Configurações → Segurança
   - Permitir "Fontes Desconhecidas"

3. **Instalar**
   - Tap no arquivo .apk
   - Seguir instruções

---

## 🔍 Checklist Pré-Build

### Configurações

- [x] Package name: `com.webmaxdigital.smarthoney`
- [x] Bundle identifier: `com.webmaxdigital.smarthoney`
- [x] Version: 1.0.0
- [x] Permissões declaradas (áudio, localização, etc)

### Funcionalidades

- [x] Login JWT funcionando
- [x] Gravação de áudio simplificada
- [x] CRUD completo de drafts
- [x] Seleção de destinations
- [x] Geolocalização automática
- [x] Cartão padrão
- [x] Logout completo

### Assets

- [x] Icon configurado (./assets/icon.png)
- [x] Splash screen configurado
- [x] Adaptive icon (Android)

---

## ⚠️ Possíveis Erros

### "Not logged in to EAS"
```bash
eas login
```

### "Project not configured"
```bash
eas build:configure
```

### "No Expo account"
```bash
# Criar em: https://expo.dev/signup
```

### Build falha
```bash
# Ver logs detalhados:
eas build:list
# Click no build que falhou para ver logs
```

---

## 🎯 Comandos Úteis

```bash
# Ver status de builds
eas build:list

# Cancelar build em andamento
eas build:cancel

# Ver detalhes de build específico
eas build:view [build-id]

# Limpar cache e tentar novamente
eas build -p android --profile preview --clear-cache
```

---

## 📱 Após Instalar o APK

**Diferenças do Expo Go:**
- ✅ Notificações bancárias funcionam (Google/Samsung Wallet)
- ✅ Permissões nativas completas
- ✅ Performance melhor
- ✅ Não depende de Expo Go
- ✅ Pode distribuir para usuários

**Testar:**
1. Login
2. Selecionar cartão padrão
3. Selecionar destinations
4. Gravar áudio com tudo selecionado
5. Verificar se destinations chegam no backend
6. Editar draft
7. Ver destinations pré-selecionados

---

## 🚀 Executar Build Agora

```bash
cd /home/uaimax/projects/smart-honey-app

# Se primeira vez:
eas login
eas build:configure

# Gerar APK:
npm run build:apk
```

**Aguardar ~10-15 minutos e baixar o link que aparecer!**

---

**Tudo pronto para build! Configuração validada.** ✅


