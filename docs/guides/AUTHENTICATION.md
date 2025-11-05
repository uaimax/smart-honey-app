# 🔐 Sistema de Autenticação - Smart Honey

## Visão Geral

O Smart Honey utiliza autenticação baseada em JWT (JSON Web Token) para proteger os dados dos usuários e integrar com o backend.

## Fluxo de Autenticação

### 1. Login

```
Usuário → LoginScreen
   ↓
Digita email e senha
   ↓
Envia para POST /api/auth/login
   ↓
Recebe: { token, user, tenant, role }
   ↓
Salva em AsyncStorage
   ↓
Navega para MainTabs (app principal)
```

### 2. Verificação ao Iniciar App

```
App inicia → AppNavigator
   ↓
Verifica se token existe
   ↓
Token existe? → Verifica validade
   ↓
Válido? → MainTabs
   ↓
Inválido/Expirado → LoginScreen
```

### 3. Token Expirado Durante Uso

```
Usuário usando app
   ↓
Faz requisição → API retorna 401
   ↓
Interceptor detecta 401
   ↓
Limpa token do AsyncStorage
   ↓
Redireciona para LoginScreen
```

## API Endpoint

### POST /api/auth/login

**Request:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "rememberMe": false
}
```

**Response Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "name": "Nome",
      "email": "usuario@email.com"
    },
    "tenant": {
      "id": "uuid",
      "name": "Honey"
    },
    "role": "admin"
  }
}
```

**Response Erro (400/401):**
```json
{
  "success": false,
  "error": "Email ou senha inválidos"
}
```

## Duração do Token

- **rememberMe = false:** 24 horas
- **rememberMe = true:** 30 dias

## Uso do Token

### Em todas requisições autenticadas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Implementação no App

O token é adicionado automaticamente por um interceptor do Axios:

```typescript
// src/services/api.ts
this.client.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

## Armazenamento

### AsyncStorage Keys

```typescript
@smart_honey:auth_token        // Token JWT
@smart_honey:user_data         // Dados do usuário
@smart_honey:token_expiry      // Data de expiração
```

### Dados Salvos

**Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**User Data:**
```json
{
  "id": "uuid",
  "name": "Nome",
  "email": "usuario@email.com",
  "tenantId": "uuid",
  "tenantName": "Honey",
  "role": "admin"
}
```

**Token Expiry:**
```
2025-11-05T14:30:00.000Z
```

## Arquivos do Sistema de Auth

### 1. `src/services/auth.ts`

**Serviço principal de autenticação:**
- `login(credentials)` - Faz login e salva token
- `saveToken(token, rememberMe)` - Salva token no AsyncStorage
- `getToken()` - Recupera token salvo
- `getUserData()` - Recupera dados do usuário
- `isTokenValid()` - Verifica se token ainda é válido
- `clearToken()` - Remove token (logout)
- `isAuthenticated()` - Verifica se usuário está autenticado

### 2. `src/screens/LoginScreen.tsx`

**Tela de login:**
- Form com email e senha
- Checkbox "Lembrar-me por 30 dias"
- Validação de campos
- Tratamento de erros
- Loading state durante login

### 3. `src/navigation/AppNavigator.tsx`

**Navegação condicional:**
- Verifica autenticação no mount
- Loading screen durante verificação
- Se autenticado → MainTabs
- Se não autenticado → LoginScreen
- Callback para token expirado (401)

### 4. `src/context/AppContext.tsx`

**Integração no contexto:**
- `login(credentials)` - Método de login
- `logout()` - Método de logout
- Carrega dados do usuário do AsyncStorage
- Disponibiliza para todo o app

### 5. `src/services/api.ts`

**Interceptores:**
- Request: Adiciona token automaticamente
- Response: Detecta 401 e faz logout

## Como Usar

### Login Programático

```typescript
import { useApp } from '@/context/AppContext';

function MyComponent() {
  const { login } = useApp();

  const handleLogin = async () => {
    const success = await login({
      email: 'usuario@email.com',
      password: 'senha123',
      rememberMe: true,
    });

    if (success) {
      console.log('Login bem-sucedido');
    } else {
      console.log('Falha no login');
    }
  };
}
```

### Logout

```typescript
import { useApp } from '@/context/AppContext';

function MyComponent() {
  const { logout } = useApp();

  const handleLogout = async () => {
    await logout();
    // Usuário será redirecionado para LoginScreen
  };
}
```

### Verificar Se Está Autenticado

```typescript
import { isAuthenticated } from '@/services/auth';

const checkAuth = async () => {
  const isAuth = await isAuthenticated();
  console.log('Autenticado?', isAuth);
};
```

## Fluxos Completos

### Fluxo 1: Primeiro Login

```
1. App inicia
   └→ Verifica token no AsyncStorage
   └→ Não encontrado
   └→ Mostra LoginScreen

2. Usuário preenche credenciais
   └→ Email: usuario@email.com
   └→ Senha: senha123
   └→ Marca "Lembrar-me"

3. Clica "Entrar"
   └→ POST /api/auth/login
   └→ Recebe { token, user, tenant, role }

4. Salva no AsyncStorage
   └→ Token com validade de 30 dias
   └→ Dados do usuário

5. AppNavigator detecta token
   └→ Navega para MainTabs
   └→ Usuário vê app normalmente
```

### Fluxo 2: App Já Logado

```
1. App inicia
   └→ Verifica token no AsyncStorage
   └→ Token encontrado

2. Verifica validade
   └→ Expira em: 25/11/2025
   └→ Hoje: 04/11/2025
   └→ Ainda válido ✅

3. Navega direto para MainTabs
   └→ Usuário NÃO vê LoginScreen
```

### Fluxo 3: Token Expirado

```
1. Usuário fazendo requisição
   └→ GET /api/drafts
   └→ Headers: Authorization: Bearer <token_expirado>

2. API retorna 401
   └→ Interceptor detecta 401
   └→ Limpa token do AsyncStorage
   └→ Chama callback onTokenExpired

3. AppNavigator reage
   └→ setIsAuth(false)
   └→ Navega para LoginScreen

4. Usuário vê mensagem
   └→ "Sessão expirada. Faça login novamente"
```

## Segurança

### Armazenamento Seguro

- Token armazenado em AsyncStorage (criptografado no iOS)
- Não armazena senha (apenas token)
- Token tem expiração definida

### Validação

- Email e senha validados antes de enviar
- Token validado em cada inicialização
- 401 automaticamente faz logout

### Renovação

Não há renovação automática de token. Quando expirar:
1. Usuário é redirecionado para login
2. Faz login novamente
3. Recebe novo token

## Troubleshooting

### Token não é salvo

**Sintoma:** Usuário faz login mas volta para LoginScreen

**Solução:**
1. Verificar logs: `💾 Token salvo com sucesso`
2. Verificar AsyncStorage no console
3. Verificar permissões do app

### Requisições sem token

**Sintoma:** API retorna 401 mesmo logado

**Solução:**
1. Verificar se interceptor está configurado
2. Verificar logs: `📤 API Request` deve incluir Authorization
3. Verificar se token não expirou

### Loop infinito de login

**Sintoma:** Após login, volta para LoginScreen

**Solução:**
1. Verificar se API retornou success=true
2. Verificar se token foi salvo corretamente
3. Verificar se AppNavigator está verificando token corretamente

## Testes

### Teste 1: Login com credenciais válidas

```
1. Iniciar app
2. Ver LoginScreen
3. Digitar email/senha corretos
4. Marcar "Lembrar-me"
5. Clicar "Entrar"
✅ Deve navegar para MainTabs
```

### Teste 2: Login com credenciais inválidas

```
1. Digitar email/senha incorretos
2. Clicar "Entrar"
✅ Deve mostrar: "Email ou senha inválidos"
```

### Teste 3: Persistência de token

```
1. Fazer login com "Lembrar-me"
2. Fechar app completamente
3. Reabrir app
✅ Deve ir direto para MainTabs (sem pedir login)
```

### Teste 4: Expiração de token

```
1. Fazer login SEM "Lembrar-me"
2. Aguardar 24h
3. Abrir app
✅ Deve mostrar LoginScreen
```

### Teste 5: Logout

```
1. Estar logado
2. Ir em Preferências
3. Clicar "Sair da Conta"
4. Confirmar
✅ Deve voltar para LoginScreen
```

## Referências

- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [JWT](https://jwt.io/)
- [React Navigation Auth Flow](https://reactnavigation.org/docs/auth-flow/)

---

**Criado:** Novembro 2025
**Status:** ✅ Implementado
**Versão:** 1.0.0

