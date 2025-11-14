import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  Card,
  Draft,
  SubmitDraftParams,
  UpdateDraftParams,
  User,
  Destination,
  AuthResponse,
  ResetPasswordParams,
  InviteData,
  AcceptInviteParams,
  SummaryByCategory,
  SummaryByDestination,
} from '@/types';
import { getToken, clearToken } from './auth';

// Configuração base da API
const API_BASE_URL = 'https://smart.app.webmaxdigital.com';

// Callback para quando token expirar (será setado pelo AppNavigator)
let onTokenExpired: (() => void) | null = null;

// Flag para evitar múltiplos logouts simultâneos
let isLoggingOut = false;

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
          // Evitar múltiplos logouts simultâneos
          if (!isLoggingOut) {
            isLoggingOut = true;
            console.warn('🔒 Token expirado ou inválido - fazendo logout');

            try {
              await clearToken();

              // Chamar callback para redirecionar para login
              if (onTokenExpired) {
                onTokenExpired();
              }
            } catch (logoutError) {
              console.error('❌ Erro ao fazer logout:', logoutError);
            } finally {
              // Resetar flag após 1 segundo para permitir novo logout se necessário
              setTimeout(() => {
                isLoggingOut = false;
              }, 1000);
            }
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

      // Enviar isDraft baseado na preferência do usuário
      // Se isDraft não for fornecido explicitamente, usar false (criar entry oficial)
      const isDraft = params.isDraft !== undefined ? params.isDraft : false;
      formData.append('isDraft', isDraft.toString());

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
        return [];
      }

      // API pode retornar { success, data } ou array direto
      const cardsData = response.data.success ? response.data.data : response.data;

      if (!Array.isArray(cardsData)) {
        console.warn('⚠️ Resposta não é array');
        return [];
      }

      console.log('📇 Cartões recebidos da API:', cardsData.length, 'cartão(ões)');
      console.log('📇 IDs dos cartões:', cardsData.map((c: Card) => c.id));

      // Mapear "holder" do backend para "owner" do frontend
      return cardsData.map((card: any) => ({
        ...card,
        owner: card.holder || card.owner, // Backend retorna "holder", frontend espera "owner"
      }));
    } catch (error: any) {
      // Se endpoint não existe ou 401, retornar array vazio
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.warn('⚠️ Endpoint /api/cards não disponível - retornando lista vazia');
        return [];
      }
      console.error('❌ Erro ao buscar cartões:', error);
      return []; // Sem fallback para mock - retornar array vazio
    }
  }

  /**
   * Cria um novo cartão
   */
  async createCard(params: { name: string; holder: 'Bruna' | 'Max'; color: string; isDefault?: boolean }): Promise<Card> {
    try {
      const response = await this.client.post<ApiResponse<Card>>('/api/cards', params);

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Erro ao criar cartão');
      }

      console.log('✅ Cartão criado com sucesso:', response.data.data);

      // Mapear "holder" do backend para "owner" do frontend
      const card = response.data.data;
      return {
        ...card,
        owner: card.holder || card.owner, // Backend retorna "holder", frontend espera "owner"
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar cartão:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Atualiza um cartão existente
   */
  async updateCard(cardId: string, params: { name?: string; holder?: 'Bruna' | 'Max'; color?: string; isDefault?: boolean }): Promise<Card> {
    try {
      const response = await this.client.put<ApiResponse<Card>>(`/api/cards/${cardId}`, params);

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Erro ao atualizar cartão');
      }

      console.log('✅ Cartão atualizado com sucesso:', response.data.data);

      // Mapear "holder" do backend para "owner" do frontend
      const card = response.data.data;
      return {
        ...card,
        owner: card.holder || card.owner, // Backend retorna "holder", frontend espera "owner"
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar cartão:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Busca lista de usuários/responsáveis
   */
  /**
   * Busca o perfil do próprio usuário (não requer permissão admin)
   */
  async getMyProfile(): Promise<User | null> {
    try {
      const response = await this.client.get<any>('/api/users/me/profile');

      if (!response.data || !response.data.success) {
        console.warn('⚠️ Resposta inválida de /api/users/me/profile');
        return null;
      }

      return response.data.data;
    } catch (error: any) {
      // Se endpoint não existe ou 401, retornar null
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.warn('⚠️ Endpoint /api/users/me/profile não disponível');
        return null;
      }
      console.error('❌ Erro ao buscar perfil do usuário:', error);
      return null;
    }
  }

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
      // Se endpoint não existe, 401 ou 403 (sem permissão), retornar array vazio
      // Este endpoint requer permissão admin, então é normal falhar para usuários viewer
      if (error.response?.status === 404 || error.response?.status === 401 || error.response?.status === 403) {
        console.warn('⚠️ Endpoint /api/users não disponível ou sem permissão - retornando lista vazia');
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

      // Converter timestamps de string para Date
      return draftsData.map((draft: any) => ({
        ...draft,
        timestamp: draft.createdAt ? new Date(draft.createdAt) : new Date(draft.timestamp || Date.now()),
      }));
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
   * Busca entries (lançamentos confirmados) de um mês específico
   */
  async fetchEntries(month: string): Promise<Draft[]> {
    try {
      const response = await this.client.get<any>('/api/entries', {
        params: { month },
      });

      // Validar resposta
      if (!response.data) {
        console.warn('⚠️ Resposta inválida de /api/entries');
        return [];
      }

      // API retorna { success: true, data: [...] }
      const entriesData = response.data.success ? response.data.data : response.data;

      if (!Array.isArray(entriesData)) {
        console.warn('⚠️ Resposta não é array');
        return [];
      }

      // Converter entries para formato compatível com Draft
      // Entries têm estrutura diferente (destinations é array de IDs, não selectedDestinations)
      return entriesData.map((entry: any) => ({
        id: entry.id,
        description: entry.description,
        amount: entry.amount,
        cardId: entry.cardId,
        userId: '', // Entries não têm userId direto
        status: 'sent' as const, // Entries são sempre confirmados
        timestamp: new Date(entry.createdAt),
        selectedDestinations: entry.destinations || [],
        month: entry.month,
        destinationSplits: entry.destinationSplits,
        observations: entry.observations,
        isEntry: true, // Flag para identificar que é entry, não draft
      }));
    } catch (error: any) {
      // Se endpoint não existe ou 401, retornar array vazio
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.warn('⚠️ Endpoint /api/entries não disponível - retornando lista vazia');
        return [];
      }
      console.error('❌ Erro ao buscar entries:', error);
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
   * Atualiza um entry (lançamento confirmado) existente
   */
  async updateEntry(entryId: string, data: UpdateDraftParams): Promise<ApiResponse<Draft>> {
    try {
      console.log('📝 Atualizando entry:', entryId, data);

      // Converter selectedDestinations para destinations (formato esperado pelo endpoint de entries)
      const updateData: any = { ...data };
      if (data.selectedDestinations) {
        updateData.destinations = data.selectedDestinations;
        delete updateData.selectedDestinations;
      }

      const response = await this.client.put<ApiResponse<Draft>>(
        `/api/entries/${entryId}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Entry atualizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar entry:', error);
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
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      console.log('🔑 Requesting password reset for:', email);

      const response = await this.client.post<ApiResponse>(
        '/api/auth/forgot-password',
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Password reset email sent');
      return response.data;
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        message: 'Erro ao conectar com o servidor',
      };
    }
  }

  /**
   * Verify reset token validity
   */
  async verifyResetToken(token: string): Promise<ApiResponse> {
    try {
      console.log('🔍 Verifying reset token...');

      const response = await this.client.get<ApiResponse>(
        `/api/auth/verify-reset-token/${token}`
      );

      console.log('✅ Token verified');
      return response.data;
    } catch (error: any) {
      console.error('❌ Token verification error:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        message: 'Token inválido ou expirado',
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(params: ResetPasswordParams): Promise<ApiResponse> {
    try {
      console.log('🔒 Resetting password...');

      const response = await this.client.post<ApiResponse>(
        '/api/auth/reset-password',
        {
          token: params.token,
          newPassword: params.newPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Password reset successful');
      return response.data;
    } catch (error: any) {
      console.error('❌ Password reset error:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        message: 'Erro ao redefinir senha',
      };
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
   * Get invites list (admin only)
   */
  async getInvites(): Promise<InviteData[]> {
    try {
      console.log('📨 Fetching invites...');

      const response = await this.client.get<{ success: boolean; data: InviteData[] }>(
        '/api/invites'
      );

      if (response.data.success && response.data.data) {
        console.log('✅ Invites loaded:', response.data.data.length);
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      console.error('❌ Error fetching invites:', error);
      return [];
    }
  }

  /**
   * Create invite (admin only)
   */
  async createInvite(email: string, role: string): Promise<InviteData> {
    try {
      console.log('✉️ Creating invite for:', email);

      const response = await this.client.post<{ success: boolean; data: InviteData }>(
        '/api/invites',
        { email, role },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.data) {
        console.log('✅ Invite created:', response.data.data);
        return response.data.data;
      }

      throw new Error('Failed to create invite');
    } catch (error: any) {
      console.error('❌ Error creating invite:', error);
      throw error;
    }
  }

  /**
   * Delete invite (admin only)
   */
  async deleteInvite(inviteId: string): Promise<ApiResponse> {
    try {
      console.log('🗑️ Deleting invite:', inviteId);

      const response = await this.client.delete<ApiResponse>(
        `/api/invites/${inviteId}`
      );

      console.log('✅ Invite deleted');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error deleting invite:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        message: 'Erro ao deletar convite',
      };
    }
  }

  /**
   * Verify invite token (public)
   */
  async verifyInviteToken(token: string): Promise<ApiResponse> {
    try {
      console.log('🔍 Verifying invite token...');

      const response = await this.client.get<ApiResponse>(
        `/api/invites/accept/${token}`
      );

      console.log('✅ Invite token verified');
      return response.data;
    } catch (error: any) {
      console.error('❌ Invite token verification error:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        message: 'Token de convite inválido ou expirado',
      };
    }
  }

  /**
   * Accept invite and create user (public)
   */
  async acceptInvite(params: AcceptInviteParams): Promise<AuthResponse> {
    try {
      console.log('✅ Accepting invite...');

      const response = await this.client.post<AuthResponse>(
        `/api/invites/accept/${params.token}`,
        {
          name: params.name,
          password: params.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Invite accepted successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Accept invite error:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        error: 'Erro ao aceitar convite',
      };
    }
  }

  /**
   * Cria um novo destination (responsável)
   */
  async createDestination(name: string): Promise<Destination> {
    try {
      const response = await this.client.post<{ success: boolean; data: Destination }>('/api/external/destinations', {
        name: name.trim(),
        type: 'person', // Por padrão, sempre criar como "person"
      });

      if (response.data.success && response.data.data) {
        console.log('✅ Destination criado:', response.data.data);
        return response.data.data;
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('❌ Erro ao criar destination:', error);
      throw error;
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

  /**
   * Get summary by category
   */
  async getSummaryByCategory(month?: string): Promise<{ data: SummaryByCategory[]; error?: string }> {
    try {
      console.log('📊 Fetching summary by category...', { month });

      const params: any = {};
      if (month) {
        params.month = month;
      }

      const response = await this.client.get<{ success: boolean; data: SummaryByCategory[] }>(
        '/api/entries/summary-by-category',
        { params }
      );

      if (response.data.success && response.data.data) {
        console.log('✅ Category summary loaded:', response.data.data.length, 'categories');
        return { data: response.data.data };
      }

      if (response.data.success === false) {
        console.warn('⚠️ Endpoint retornou success: false');
        return { data: [], error: 'Endpoint retornou erro' };
      }

      return { data: [] };
    } catch (error: any) {
      console.error('❌ Error fetching category summary:', error);

      if (error.response?.status === 404) {
        return { data: [], error: 'Endpoint não disponível' };
      }
      if (error.response?.status === 401) {
        return { data: [], error: 'Não autenticado' };
      }

      return { data: [], error: 'Erro ao carregar resumo por categoria' };
    }
  }

  /**
   * Get summary by destination (person)
   */
  async getSummaryByDestination(month?: string): Promise<{ data: SummaryByDestination[]; error?: string }> {
    try {
      console.log('📊 Fetching summary by destination...', { month });

      const params: any = {};
      if (month) {
        params.month = month;
      }

      const response = await this.client.get<{ success: boolean; data: SummaryByDestination[] }>(
        '/api/external/entries/summary-by-destination',
        { params }
      );

      if (response.data.success && response.data.data) {
        console.log('✅ Summary loaded:', response.data.data.length, 'destinations');
        return { data: response.data.data };
      }

      // Se success é false ou data não existe, pode ser que não há dados ou endpoint não está disponível
      if (response.data.success === false) {
        console.warn('⚠️ Endpoint retornou success: false');
        return { data: [], error: 'Endpoint retornou erro' };
      }

      return { data: [] };
    } catch (error: any) {
      console.error('❌ Error fetching summary:', error);

      // Verificar se é erro 404 (endpoint não existe) ou 401 (não autenticado)
      if (error.response?.status === 404) {
        return { data: [], error: 'Endpoint não disponível' };
      }
      if (error.response?.status === 401) {
        return { data: [], error: 'Não autenticado' };
      }

      // Erro de rede (offline)
      if (!error.response) {
        return { data: [], error: 'Erro de conexão. Verifique sua internet.' };
      }

      return { data: [], error: 'Erro ao carregar resumo' };
    }
  }

  /**
   * Busca metadata de estabelecimento por nome de exibição
   */
  async getMetadataByDisplayName(displayName: string): Promise<ApiResponse<{ category?: string; id?: string } | null>> {
    try {
      const response = await this.client.get<ApiResponse<{ category?: string; id?: string } | null>>(
        '/api/entry-metadata/by-display-name',
        { params: { displayName } }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar metadata:', error);
      return { success: false, message: 'Erro ao buscar categoria' };
    }
  }

  /**
   * Busca todas as categorias disponíveis (extrai de todos os metadados)
   */
  async getAllCategories(): Promise<string[]> {
    try {
      const response = await this.client.get<ApiResponse<Array<{
        normalizedName: string;
        displayName: string;
        entryCount: number;
        metadata: {
          category?: string;
        } | null;
      }>>>('/api/entry-metadata');

      if (response.data.success && response.data.data) {
        // Extrair categorias únicas e não vazias
        const categories = new Set<string>();
        response.data.data.forEach(item => {
          if (item.metadata?.category && item.metadata.category.trim()) {
            categories.add(item.metadata.category.trim());
          }
        });

        // Ordenar alfabeticamente
        const sortedCategories = Array.from(categories).sort();

        // Adicionar categorias padrão se não existirem
        const defaultCategories = [
          'Alimentação',
          'Serviço',
          'Transporte',
          'Moradia',
          'Educação',
          'Saúde',
          'Lazer',
          'Compras',
          'Outros',
        ];

        defaultCategories.forEach(cat => {
          if (!sortedCategories.includes(cat)) {
            sortedCategories.push(cat);
          }
        });

        return sortedCategories;
      }

      // Se não houver dados, retornar categorias padrão
      return [
        'Alimentação',
        'Serviço',
        'Transporte',
        'Moradia',
        'Educação',
        'Saúde',
        'Lazer',
        'Compras',
        'Outros',
      ];
    } catch (error: any) {
      console.error('❌ Erro ao buscar categorias:', error);
      // Retornar categorias padrão em caso de erro
      return [
        'Alimentação',
        'Serviço',
        'Transporte',
        'Moradia',
        'Educação',
        'Saúde',
        'Lazer',
        'Compras',
        'Outros',
      ];
    }
  }

  /**
   * Cria ou atualiza metadata de estabelecimento
   */
  async upsertMetadata(data: { displayName: string; normalizedName?: string; category?: string }): Promise<ApiResponse> {
    try {
      const response = await this.client.post<ApiResponse>(
        '/api/entry-metadata',
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar metadata:', error);
      throw error;
    }
  }

  /**
   * Envia feedback do usuário (áudio ou texto)
   */
  async submitFeedback(params: { audio?: { uri: string; name: string; type: string }; text?: string }): Promise<ApiResponse> {
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

      const response = await this.client.post<ApiResponse>(
        '/api/feedback',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao enviar feedback:', error);
      throw error;
    }
  }

  /**
   * Envia votação de features
   */
  async submitFeatureVote(params: { selectedFeatures: string[]; suggestion?: string }): Promise<ApiResponse> {
    try {
      const response = await this.client.post<ApiResponse>(
        '/api/feedback/vote',
        {
          selectedFeatures: params.selectedFeatures,
          suggestion: params.suggestion || undefined,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao enviar votação:', error);
      throw error;
    }
  }

}

// Exportar instância única (singleton)
export const api = new ApiService();

// Exportar funções principais para facilitar imports
export const submitDraft = (params: SubmitDraftParams) => api.submitDraft(params);
export const fetchCards = () => api.fetchCards();
export const createCard = (params: { name: string; holder: 'Bruna' | 'Max'; color: string; isDefault?: boolean }) => api.createCard(params);
export const updateCard = (cardId: string, params: { name?: string; holder?: 'Bruna' | 'Max'; color?: string; isDefault?: boolean }) => api.updateCard(cardId, params);
export const getMyProfile = () => api.getMyProfile();
export const fetchUsers = () => api.fetchUsers();
export const fetchDrafts = (month: string) => api.fetchDrafts(month);
export const fetchEntries = (month: string) => api.fetchEntries(month);
export const fetchDestinations = () => api.fetchDestinations();
export const createDestination = (name: string) => api.createDestination(name);
export const updateDraft = (draftId: string, data: UpdateDraftParams) => api.updateDraft(draftId, data);
export const updateEntry = (entryId: string, data: UpdateDraftParams) => api.updateEntry(entryId, data);
export const deleteDraft = (draftId: string) => api.deleteDraft(draftId);
export const apiLogout = () => api.logout();
export const setOnTokenExpired = (callback: () => void) => api.setOnTokenExpired(callback);

// Auth methods (register está em auth.ts para evitar require cycle)
export const apiForgotPassword = (email: string) => api.forgotPassword(email);
export const apiVerifyResetToken = (token: string) => api.verifyResetToken(token);
export const apiResetPassword = (params: ResetPasswordParams) => api.resetPassword(params);

// Invite methods
export const apiGetInvites = () => api.getInvites();
export const apiCreateInvite = (email: string, role: string) => api.createInvite(email, role);
export const apiDeleteInvite = (inviteId: string) => api.deleteInvite(inviteId);
export const apiVerifyInviteToken = (token: string) => api.verifyInviteToken(token);
export const apiAcceptInvite = (params: AcceptInviteParams) => api.acceptInvite(params);

// Summary methods
export const getSummaryByCategory = (month?: string) => api.getSummaryByCategory(month);
export const getSummaryByDestination = (month?: string) => api.getSummaryByDestination(month);

// Entry Metadata methods
export const getMetadataByDisplayName = (displayName: string) => api.getMetadataByDisplayName(displayName);
export const getAllCategories = () => api.getAllCategories();
export const upsertMetadata = (data: { displayName: string; normalizedName?: string; category?: string }) => api.upsertMetadata(data);

// Feedback methods
export const submitFeedback = (params: { audio?: { uri: string; name: string; type: string }; text?: string }) => api.submitFeedback(params);
export const submitFeatureVote = (params: { selectedFeatures: string[]; suggestion?: string }) => api.submitFeatureVote(params);

