import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse, Card, Draft, SubmitDraftParams, UpdateDraftParams, User, Destination } from '@/types';
import { getToken, clearToken } from './auth';

// Configuração base da API
const API_BASE_URL = 'https://smart.app.webmaxdigital.com';

// Callback para quando token expirar (será setado pelo AppNavigator)
let onTokenExpired: (() => void) | null = null;

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 segundos
      headers: {
        'Accept': 'application/json',
      },
    });

    // Interceptor para adicionar token automaticamente
    this.client.interceptors.request.use(
      async (config) => {
        // Adicionar token se existir
        const token = await getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;

          // Log detalhado para debug
          if (config.url?.includes('destinations')) {
            console.log('🔍 DEBUG destinations request:');
            console.log('  - URL:', config.url);
            console.log('  - Token existe:', !!token);
            console.log('  - Token COMPLETO:', token);
            console.log('  - Header Authorization COMPLETO:', config.headers.Authorization);
          }
        }

        console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar respostas e erros
    this.client.interceptors.response.use(
      (response) => {
        console.log('📥 API Response:', response.status, response.config.url);
        return response;
      },
      async (error) => {
        // Tratar erro 401 (token expirado) - mas apenas se não for tela de login
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
          console.warn('🔒 Token expirado ou inválido - fazendo logout');
          await clearToken();

          // Chamar callback para redirecionar para login
          if (onTokenExpired) {
            onTokenExpired();
          }
        }

        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Define callback para quando token expirar
   */
  setOnTokenExpired(callback: () => void): void {
    onTokenExpired = callback;
  }

  private handleError(error: AxiosError) {
    if (error.response) {
      // Servidor respondeu com erro
      const status = error.response.status;
      console.error(`❌ API Error ${status}:`, error.response.data);

      switch (status) {
        case 400:
          console.warn('⚠️ Bad Request - Dados inválidos ou faltando informação');
          break;
        case 401:
          console.warn('🔒 Unauthorized - Autenticação necessária');
          break;
        case 422:
          console.warn('⚠️ Validation Error - Dados não passaram na validação');
          break;
        case 429:
          console.warn('🚫 Rate Limit - Muitas requisições');
          break;
        case 500:
        case 502:
        case 503:
          console.error('💥 Server Error - Problema no servidor');
          break;
        default:
          console.error(`❌ HTTP Error ${status}`);
      }
    } else if (error.request) {
      // Requisição feita mas sem resposta (offline)
      console.error('📵 No Response - Provavelmente offline');
    } else {
      // Erro ao configurar requisição
      console.error('⚙️ Setup Error:', error.message);
    }
  }

  /**
   * Submete um novo draft (despesa) via áudio ou texto
   */
  async submitDraft(params: SubmitDraftParams): Promise<ApiResponse<Draft>> {
    try {
      const formData = new FormData();

      // Adicionar áudio se fornecido
      if (params.audio) {
        const audioFile = {
          uri: params.audio.uri,
          name: params.audio.name,
          type: params.audio.type,
        } as any;

        formData.append('audio', audioFile);
      }

      // Adicionar texto se fornecido
      if (params.text) {
        formData.append('text', params.text);
      }

      // Adicionar metadados opcionais
      if (params.cardId) {
        formData.append('cardId', params.cardId);
      }

      // NÃO enviar userId - backend pega automaticamente do token JWT
      // if (params.userId) {
      //   formData.append('userId', params.userId);
      // }

      // Adicionar coordenadas se fornecidas
      if (params.latitude !== undefined && params.longitude !== undefined) {
        formData.append('latitude', params.latitude.toString());
        formData.append('longitude', params.longitude.toString());
        console.log('📍 Coordenadas enviando:', {
          latitude: params.latitude,
          longitude: params.longitude,
        });
      } else {
        console.log('📍 Nenhuma coordenada disponível');
      }

      // Adicionar destinations (responsáveis) se fornecidos
      if (params.selectedDestinations && params.selectedDestinations.length > 0) {
        params.selectedDestinations.forEach((destId, index) => {
          formData.append(`selectedDestinations[${index}]`, destId);
        });
        console.log('📋 Destinations enviando para API:', params.selectedDestinations.length);
        console.log('📋 IDs:', params.selectedDestinations);
      } else {
        console.log('📋 Nenhum destination selecionado - backend usará nome do usuário');
      }

      // Sempre enviar a data (hoje por padrão)
      // API vai receber no formato ISO: "2025-11-04T14:30:00.000Z"
      const date = params.date || new Date();
      formData.append('date', date.toISOString());

      const response = await this.client.post<ApiResponse<Draft>>(
        '/api/external/drafts',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      // Re-throw para tratamento no componente
      throw error;
    }
  }

  /**
   * Busca lista de cartões disponíveis
   */
  async fetchCards(): Promise<Card[]> {
    try {
      const response = await this.client.get<any>('/api/cards');

      // Validar resposta
      if (!response.data) {
        console.warn('⚠️ Resposta inválida de /api/cards');
        return this.getMockCards();
      }

      // API pode retornar { success, data } ou array direto
      const cardsData = response.data.success ? response.data.data : response.data;

      if (!Array.isArray(cardsData)) {
        console.warn('⚠️ Resposta não é array');
        return this.getMockCards();
      }

      console.log('📇 Cartões recebidos da API:', cardsData.length, 'cartão(ões)');
      console.log('📇 IDs dos cartões:', cardsData.map((c: Card) => c.id));

      return cardsData;
    } catch (error: any) {
      // Se endpoint não existe ou 401, retornar mock
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.warn('⚠️ Endpoint /api/cards não disponível - usando mock mínimo');
        return this.getMockCards();
      }
      console.error('❌ Erro ao buscar cartões:', error);
      return this.getMockCards(); // Fallback para mock
    }
  }

  /**
   * Mock mínimo de cartões para permitir configuração mesmo sem backend
   */
  private getMockCards(): Card[] {
    return [
      {
        id: 'mock-card-1',
        name: 'Cartão Padrão',
        owner: 'Você',
        isDefault: false,
      },
    ];
  }

  /**
   * Busca lista de usuários/responsáveis
   */
  async fetchUsers(): Promise<User[]> {
    try {
      const response = await this.client.get<any>('/api/users');

      // Validar resposta
      if (!response.data) {
        console.warn('⚠️ Resposta inválida de /api/users');
        return [];
      }

      // API pode retornar { success, data } ou array direto
      const usersData = response.data.success ? response.data.data : response.data;

      if (!Array.isArray(usersData)) {
        console.warn('⚠️ Resposta não é array');
        return [];
      }

      return usersData;
    } catch (error: any) {
      // Se endpoint não existe ou 401, retornar array vazio
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.warn('⚠️ Endpoint /api/users não disponível - retornando lista vazia');
        return [];
      }
      console.error('❌ Erro ao buscar usuários:', error);
      return []; // Fallback seguro
    }
  }

  /**
   * Busca drafts de um mês específico
   */
  async fetchDrafts(month: string): Promise<Draft[]> {
    try {
      const response = await this.client.get<any>('/api/entry-drafts', {
        params: { month },
      });

      // Validar resposta
      if (!response.data) {
        console.warn('⚠️ Resposta inválida de /api/entry-drafts');
        return [];
      }

      // API retorna { success: true, data: [...] }
      const draftsData = response.data.success ? response.data.data : response.data;

      if (!Array.isArray(draftsData)) {
        console.warn('⚠️ Resposta não é array');
        return [];
      }

      return draftsData;
    } catch (error: any) {
      // Se endpoint não existe ou 401, retornar array vazio
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.warn('⚠️ Endpoint /api/entry-drafts não disponível - retornando lista vazia');
        return [];
      }
      console.error('❌ Erro ao buscar drafts:', error);
      return []; // Fallback seguro
    }
  }

  /**
   * Atualiza um draft existente
   */
  async updateDraft(draftId: string, data: UpdateDraftParams): Promise<ApiResponse<Draft>> {
    try {
      console.log('📝 Atualizando draft:', draftId, data);

      const response = await this.client.put<ApiResponse<Draft>>(
        `/api/entry-drafts/${draftId}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Draft atualizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar draft:', error);
      throw error;
    }
  }

  /**
   * Deleta um draft
   */
  async deleteDraft(draftId: string): Promise<ApiResponse> {
    try {
      console.log('🗑️ Deletando draft:', draftId);

      const response = await this.client.delete<ApiResponse>(
        `/api/entry-drafts/${draftId}`
      );

      console.log('✅ Draft deletado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao deletar draft:', error);
      throw error;
    }
  }

  /**
   * Logout do servidor (limpa cookie)
   */
  async logout(): Promise<void> {
    try {
      console.log('🔓 Chamando logout no servidor...');
      await this.client.post('/api/auth/logout');
      console.log('✅ Logout no servidor concluído');
    } catch (error) {
      console.warn('⚠️ Erro ao fazer logout no servidor (continuando):', error);
      // Não bloquear logout se servidor falhar
    }
  }

  /**
   * Busca lista de destinations (responsáveis)
   */
  async fetchDestinations(): Promise<Destination[]> {
    try {
      const response = await this.client.get<any>('/api/external/destinations');

      console.log('🔍 DEBUG destinations response:');
      console.log('  - Status:', response.status);
      console.log('  - Success:', response.data?.success);
      console.log('  - Data type:', typeof response.data?.data);
      console.log('  - Data is array:', Array.isArray(response.data?.data));
      console.log('  - Data length:', response.data?.data?.length);
      console.log('  - Raw data:', JSON.stringify(response.data).substring(0, 200));

      // Validar resposta
      if (!response.data) {
        console.warn('⚠️ Resposta inválida de /api/external/destinations');
        return [];
      }

      // API retorna { success: true, data: [...] }
      const destinationsData = response.data.success ? response.data.data : response.data;

      if (!Array.isArray(destinationsData)) {
        console.warn('⚠️ Resposta não é array');
        return [];
      }

      console.log('📋 Destinations recebidos:', destinationsData.length);
      if (destinationsData.length > 0) {
        console.log('📋 Primeiro destination:', destinationsData[0]);
      }

      return destinationsData;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.warn('⚠️ Endpoint /api/external/destinations não disponível');
        return [];
      }
      console.error('❌ Erro ao buscar destinations:', error);
      return [];
    }
  }

}

// Exportar instância única (singleton)
export const api = new ApiService();

// Exportar funções principais para facilitar imports
export const submitDraft = (params: SubmitDraftParams) => api.submitDraft(params);
export const fetchCards = () => api.fetchCards();
export const fetchUsers = () => api.fetchUsers();
export const fetchDrafts = (month: string) => api.fetchDrafts(month);
export const fetchDestinations = () => api.fetchDestinations();
export const updateDraft = (draftId: string, data: UpdateDraftParams) => api.updateDraft(draftId, data);
export const deleteDraft = (draftId: string) => api.deleteDraft(draftId);
export const apiLogout = () => api.logout();
export const setOnTokenExpired = (callback: () => void) => api.setOnTokenExpired(callback);

