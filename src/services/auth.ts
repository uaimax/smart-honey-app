import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import type { RegisterCredentials } from '@/types';

const API_BASE_URL = 'https://smart.app.webmaxdigital.com';
const AUTH_TOKEN_KEY = '@smart_honey:auth_token';
const USER_DATA_KEY = '@smart_honey:user_data';
const TOKEN_EXPIRY_KEY = '@smart_honey:token_expiry';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    tenant?: {
      id: string;
      name: string;
    };
    role: string;
  };
  error?: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  tenantName: string;
  role: string;
}

class AuthService {
  /**
   * Faz login na API e salva o token
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Fazendo login...');

      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/api/auth/login`,
        {
          email: credentials.email,
          password: credentials.password,
          rememberMe: credentials.rememberMe,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.data) {
        // Salvar token e dados do usuário
        await this.saveToken(response.data.data.token, credentials.rememberMe);

        // Verificar se tenant existe (pode não existir para super admins sem tenant)
        if (!response.data.data.tenant) {
          console.warn('⚠️ Login bem-sucedido, mas usuário não possui grupo associado');
          console.warn('⚠️ Este usuário pode não conseguir criar gravações até ser associado a um grupo');

          // Para super admins sem tenant, usar valores padrão
          // O tenantId no token JWT será 'super-admin' (placeholder)
          const userData: UserData = {
            id: response.data.data.user.id,
            name: response.data.data.user.name,
            email: response.data.data.user.email,
            tenantId: 'super-admin', // Placeholder para super admins sem tenant
            tenantName: 'Sem grupo',
            role: response.data.data.role || 'admin',
          };

          await this.saveUserData(userData);
          console.log('✅ Login bem-sucedido (sem grupo)');
        } else {
          const userData: UserData = {
            id: response.data.data.user.id,
            name: response.data.data.user.name,
            email: response.data.data.user.email,
            tenantId: response.data.data.tenant.id,
            tenantName: response.data.data.tenant.name,
            role: response.data.data.role,
          };

          await this.saveUserData(userData);
          console.log('✅ Login bem-sucedido');
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao fazer login:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        error: 'Erro ao conectar com o servidor',
      };
    }
  }

  /**
   * Register new user with new tenant
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Registering new user...');

      // Fazer requisição diretamente para evitar require cycle
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/api/auth/register`,
        {
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
          tenantName: credentials.tenantName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.data) {
        // Salvar token e dados do usuário
        await this.saveToken(response.data.data.token, credentials.rememberMe);

        // Verificar se tenant existe (deve sempre existir no registro, mas vamos ser defensivos)
        if (!response.data.data.tenant) {
          console.error('❌ Erro: Registro bem-sucedido mas sem grupo associado');
          throw new Error('Erro ao registrar: grupo não foi criado');
        }

        const userData: UserData = {
          id: response.data.data.user.id,
          name: response.data.data.user.name,
          email: response.data.data.user.email,
          tenantId: response.data.data.tenant.id,
          tenantName: response.data.data.tenant.name,
          role: response.data.data.role,
        };

        await this.saveUserData(userData);

        console.log('✅ Registration successful');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao registrar:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        error: 'Erro ao criar conta',
      };
    }
  }

  /**
   * Salva o token no AsyncStorage
   */
  async saveToken(token: string, rememberMe: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);

      // Calcular data de expiração
      // rememberMe = 30 dias, senão = 24 horas
      const expiryDate = new Date();
      if (rememberMe) {
        expiryDate.setDate(expiryDate.getDate() + 30);
      } else {
        expiryDate.setHours(expiryDate.getHours() + 24);
      }

      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());

      console.log('💾 Token salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar token:', error);
      throw error;
    }
  }

  /**
   * Salva dados do usuário no AsyncStorage
   */
  async saveUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      console.log('💾 Dados do usuário salvos');
    } catch (error) {
      console.error('❌ Erro ao salvar dados do usuário:', error);
      throw error;
    }
  }

  /**
   * Recupera o token salvo
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('❌ Erro ao recuperar token:', error);
      return null;
    }
  }

  /**
   * Recupera dados do usuário salvos
   */
  async getUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
      if (userDataString) {
        return JSON.parse(userDataString);
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao recuperar dados do usuário:', error);
      return null;
    }
  }

  /**
   * Verifica se o token ainda é válido
   */
  async isTokenValid(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        return false;
      }

      const expiryString = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiryString) {
        return false;
      }

      const expiryDate = new Date(expiryString);
      const now = new Date();

      return now < expiryDate;
    } catch (error) {
      console.error('❌ Erro ao verificar validade do token:', error);
      return false;
    }
  }

  /**
   * Limpa token e dados do usuário (logout)
   */
  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY,
        USER_DATA_KEY,
        TOKEN_EXPIRY_KEY,
      ]);
      console.log('🔓 Token e dados removidos do AsyncStorage');
    } catch (error) {
      console.error('❌ Erro ao limpar token:', error);
      throw error;
    }
  }

  /**
   * Limpa TODO o cache do app (logout completo)
   * IMPORTANTE: NÃO remove onboarding e tooltips - devem persistir entre logins
   */
  async clearAllCache(): Promise<void> {
    try {
      console.log('🧹 Limpando TODO o cache...');
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔍 Keys encontradas:', allKeys.length);

      // Limpar todas as keys do Smart Honey, EXCETO onboarding e tooltips
      // Esses devem persistir entre logins para não mostrar tutorial novamente
      const keysToPreserve = [
        '@smart_honey:onboarding_completed',
        '@smart_honey:tooltip_card_selector_shown',
        '@smart_honey:tooltip_audio_recorder_shown',
        '@smart_honey:tooltip_text_input_shown',
        '@smart_honey:tooltip_destination_selector_shown',
        '@smart_honey:destination_explanation_shown',
      ];

      const smartHoneyKeys = allKeys.filter(
        key => key.startsWith('@smart_honey') && !keysToPreserve.includes(key)
      );
      
      if (smartHoneyKeys.length > 0) {
        await AsyncStorage.multiRemove(smartHoneyKeys);
        console.log('✅ Cache limpo:', smartHoneyKeys.length, 'items removidos');
        console.log('ℹ️ Keys preservadas:', keysToPreserve.filter(k => allKeys.includes(k)).length);
      }
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const hasToken = await this.getToken();
    const isValid = await this.isTokenValid();
    return !!(hasToken && isValid);
  }
}

// Exportar instância única (singleton)
export const authService = new AuthService();

// Exportar funções principais
export const login = (credentials: LoginCredentials) => authService.login(credentials);
export const register = (credentials: RegisterCredentials) => authService.register(credentials);
export const saveToken = (token: string, rememberMe: boolean) => authService.saveToken(token, rememberMe);
export const getToken = () => authService.getToken();
export const getUserData = () => authService.getUserData();
export const clearToken = () => authService.clearToken();
export const clearAllCache = () => authService.clearAllCache();
export const isTokenValid = () => authService.isTokenValid();
export const isAuthenticated = () => authService.isAuthenticated();

