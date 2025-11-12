import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Card,
  Draft,
  User,
  SubmitDraftParams,
  UpdateDraftParams,
  QueuedDraft,
  LoginCredentials,
  Destination,
  RegisterCredentials,
  SummaryByDestination,
} from '@/types';
import {
  fetchCards,
  fetchUsers,
  fetchDrafts,
  fetchDestinations,
  createDestination as apiCreateDestination,
  submitDraft as apiSubmitDraft,
  updateDraft as apiUpdateDraft,
  deleteDraft as apiDeleteDraft,
  apiLogout,
  getSummaryByDestination,
} from '@/services/api';
import { addToQueue, getQueue, removeFromQueue, processQueue, startNetworkMonitoring } from '@/services/queue';
import { ensureValidDate } from '@/utils/dateUtils';
import { getUserData, clearToken, clearAllCache, login as authLogin, register as authRegister } from '@/services/auth';
import { getDefaultCard, saveDefaultCard } from '@/services/preferences';
import { requestPermission as requestLocationPermission, getCurrentLocation } from '@/services/location';
import { info, warn, error, LogCategory } from '@/services/logger';

interface AppContextType {
  // Estado
  currentUser: User | null;
  cards: Card[];
  users: User[];
  drafts: Draft[];
  destinations: Destination[];
  queuedDrafts: QueuedDraft[];
  selectedMonth: string;
  isLoading: boolean;
  error: string | null;
  defaultCardId: string | null;
  refreshKey: number;
  summaryData: SummaryByDestination[];

  // Ações
  setCurrentUser: (user: User) => void;
  submitNewDraft: (params: SubmitDraftParams) => Promise<void>;
  updateDraft: (draftId: string, data: UpdateDraftParams) => Promise<void>;
  deleteDraft: (draftId: string) => Promise<void>;
  createDestination: (name: string) => Promise<void>;
  refreshData: () => Promise<void>;
  forceRefresh: () => void;
  setSelectedMonth: (month: string) => void;
  retryDraft: (draftId: string) => Promise<void>;
  removeDraft: (draftId: string) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  setDefaultCardId: (cardId: string | null) => void;
  loadSummary: (month?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Estado
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [queuedDrafts, setQueuedDrafts] = useState<QueuedDraft[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultCardId, setDefaultCardId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Força re-render de componentes
  const [summaryData, setSummaryData] = useState<SummaryByDestination[]>([]);

  // Inicialização
  useEffect(() => {
    initializeApp();
  }, []);

  // Atualizar quando o mês muda
  useEffect(() => {
    loadDraftsForMonth(selectedMonth);
  }, [selectedMonth]);

  // Monitorar fila
  useEffect(() => {
    loadQueue();

    // Iniciar monitoramento de rede
    startNetworkMonitoring();

    // Processar fila a cada 30 segundos
    const interval = setInterval(() => {
      processQueue();
      loadQueue();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Inicializa o app carregando dados iniciais
   */
  const initializeApp = async (isFirstLogin = false, manageLoading = true) => {
    try {
      if (manageLoading) {
        setIsLoading(true);
      }
      setError(null);

      info(LogCategory.APP, 'Inicializando Smart Honey...', { isFirstLogin });

      // Carregar dados do usuário do AsyncStorage
      const userData = await getUserData();
      if (userData) {
        setCurrentUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          tenantId: userData.tenantId,
          tenantName: userData.tenantName,
          role: userData.role,
        });
        info(LogCategory.APP, 'Dados do usuário carregados', { userId: userData.id, tenantId: userData.tenantId });
      } else {
        warn(LogCategory.APP, 'Nenhum dados de usuário encontrados no AsyncStorage');
      }

      // Carregar dados em paralelo (não bloquear app se falhar)
      let cardsData: Card[] = [];
      let usersData: User[] = [];
      let draftsData: Draft[] = [];

      // Pedir permissão de localização (não bloquear se negada)
      try {
        await requestLocationPermission();
      } catch (err) {
        warn(LogCategory.PERMISSIONS, 'Permissão de localização não concedida', err);
      }

      // Carregar dados da API com retry para primeiro login
      let attempts = isFirstLogin ? 3 : 1;
      let success = false;

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          info(LogCategory.API, 'Carregando dados da API', { attempt, maxAttempts: attempts });

          const [cardsResponse, usersResponse, draftsResponse, destinationsResponse] = await Promise.allSettled([
            fetchCards(),
            fetchUsers(),
            fetchDrafts(selectedMonth),
            fetchDestinations(),
          ]);

          // Processar resultados
          cardsData = cardsResponse.status === 'fulfilled' ? cardsResponse.value : [];
          usersData = usersResponse.status === 'fulfilled' ? usersResponse.value : [];
          draftsData = draftsResponse.status === 'fulfilled' ? draftsResponse.value : [];
          const destinationsData = destinationsResponse.status === 'fulfilled' ? destinationsResponse.value : [];

          // Log dos resultados
          info(LogCategory.API, 'Dados carregados da API', {
            cards: cardsData.length,
            users: usersData.length,
            drafts: draftsData.length,
            destinations: destinationsData.length,
            attempt,
          });

          // Verificar se pelo menos cartões e usuários foram carregados
          if (cardsData.length > 0 && usersData.length > 0) {
            setCards(cardsData);
            setUsers(usersData);
            // Preservar timestamps originais da API
            setDrafts(draftsData.map(draft => ({
              ...draft,
              timestamp: new Date(draft.timestamp) // Usar timestamp original da API
            })));
            setDestinations(destinationsData);
            info(LogCategory.APP, 'Estados atualizados no contexto', {
              cards: cardsData.length,
              users: usersData.length,
              drafts: draftsData.length,
              destinations: destinationsData.length,
            });
            success = true;
            break;
          } else if (attempt < attempts) {
            warn(LogCategory.API, 'Dados incompletos - tentando novamente', {
              attempt,
              cardsCount: cardsData.length,
              usersCount: usersData.length,
            });
            // Aguardar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (err) {
          error(LogCategory.API, 'Erro ao carregar dados da API', { attempt, error: err });
          if (attempt === attempts) {
            // Última tentativa falhou - usar dados vazios
            warn(LogCategory.API, 'Falha final no carregamento - usando dados vazios');
            setCards([]);
            setUsers([]);
            setDrafts([]);
            setDestinations([]);
          }
        }
      }

      if (!success && isFirstLogin) {
        warn(LogCategory.APP, 'Primeiro login com dados incompletos - pode ser necessário pull-to-refresh');
      }

      // Carregar/definir cartão padrão
      let savedDefaultCard = await getDefaultCard();

      // Se não tem cartão salvo e tem exatamente 1 cartão, selecionar automaticamente
      if (!savedDefaultCard && cardsData.length === 1) {
        const onlyCard = cardsData[0];
        if (!onlyCard.id.startsWith('mock-')) {
          info(LogCategory.APP, 'Apenas 1 cartão encontrado - selecionando automaticamente', { cardName: onlyCard.name });
          savedDefaultCard = onlyCard.id;
          await saveDefaultCard(savedDefaultCard);
        }
      }

      setDefaultCardId(savedDefaultCard);

      info(LogCategory.APP, 'App inicializado com sucesso', {
        cardsLoaded: cardsData.length,
        usersLoaded: usersData.length,
        hasDefaultCard: !!savedDefaultCard,
        isFirstLogin,
      });
    } catch (err) {
      error(LogCategory.APP, 'Erro ao inicializar app', err);
      // Não bloquear app se dados não carregarem
      setError(null);
    } finally {
      if (manageLoading) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Carrega drafts para um mês específico
   */
  const loadDraftsForMonth = async (month: string) => {
    try {
      setIsLoading(true);
      const draftsData = await fetchDrafts(month);

      // Preservar timestamps originais da API (não sobrescrever)
      const draftsWithValidDates = draftsData.map(draft => ({
        ...draft,
        timestamp: new Date(draft.timestamp), // Usar timestamp original da API
      }));

      setDrafts(draftsWithValidDates);
    } catch (err) {
      console.error('❌ Erro ao carregar drafts:', err);
      setError('Erro ao carregar lançamentos');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Carrega fila de drafts pendentes
   */
  const loadQueue = async () => {
    try {
      const queue = await getQueue();
      setQueuedDrafts(queue);
    } catch (err) {
      console.error('❌ Erro ao carregar fila:', err);
    }
  };

  /**
   * Submete um novo draft
   *
   * Ordem de prioridade para cartão:
   * 1. params.cardId (fornecido explicitamente)
   * 2. defaultCardId (cartão padrão do usuário)
   * 3. '' (vazio - API tentará identificar pelo texto)
   */
  const submitNewDraft = async (params: SubmitDraftParams) => {
    try {
      // Validar que tem áudio OU texto
      if (!params.audio && !params.text) {
        console.error('❌ Nenhum áudio ou texto fornecido');
        throw new Error('É necessário fornecer áudio ou texto');
      }

      // Se não tiver cardId fornecido, usar cartão padrão como fallback
      // IMPORTANTE: Se IA detectar cartão no texto, ela sobrescreve isso
      const finalCardId = params.cardId || defaultCardId || '';

      // Tentar capturar geolocalização (não bloquear se falhar)
      let coordinates: { latitude: number; longitude: number } | null = null;

      if (!params.latitude && !params.longitude) {
        try {
          coordinates = await getCurrentLocation();
        } catch (error) {
          console.warn('⚠️ Não foi possível obter localização');
        }
      }

      // VALIDAÇÃO CRÍTICA: Cartão é OBRIGATÓRIO
      // Se conta tem apenas 1 cartão → usa ele
      // Se tem cartão padrão selecionado → usa ele
      // Se não tem nenhum → erro (não cria draft)

      let cardIdToSend = finalCardId;

      // Se é mock, não enviar
      if (cardIdToSend && cardIdToSend.startsWith('mock-')) {
        console.warn('⚠️ Cartão mock - não pode ser usado');
        cardIdToSend = '';
      }

      // Se não tem cardId e não tem texto para detectar, obrigar seleção
      if (!cardIdToSend && !params.text) {
        console.error('❌ Nenhum cartão disponível e sem texto para detecção');
        throw new Error('Selecione um cartão padrão antes de gravar áudio');
      }

      console.log('📤 Enviando draft:', {
        hasAudio: !!params.audio,
        hasText: !!params.text,
        cardId: cardIdToSend || '(IA detectará pelo texto/áudio)',
        hasLocation: !!coordinates,
        latitude: coordinates?.latitude ?? params.latitude,
        longitude: coordinates?.longitude ?? params.longitude,
        hasDestinations: !!params.selectedDestinations,
        destinationsCount: params.selectedDestinations?.length || 0,
      });

      // IMPORTANTE: NÃO enviar userId para /api/external/drafts
      // O backend pega automaticamente do token JWT
      // Se enviar userId, backend valida e pode dar "Usuário não encontrado"
      console.log('ℹ️ userId NÃO será enviado (backend pega do token JWT)');

      // Criar draft local temporário com data SEMPRE como hoje
      const tempDraft: Draft = {
        id: `temp-${Date.now()}`,
        description: params.text || 'Gravação de áudio',
        amount: 0, // Será preenchido pelo backend
        cardId: finalCardId,
        userId: params.userId || currentUser?.id || '',
        status: 'sending',
        timestamp: ensureValidDate(new Date()), // Garantir data válida (hoje)
        audioUri: params.audio?.uri,
        textInput: params.text,
      };

      // Usar cartão detectado/padrão + adicionar coordenadas
      const paramsWithCard = {
        ...params,
        cardId: cardIdToSend || undefined,
        latitude: coordinates?.latitude ?? params.latitude,
        longitude: coordinates?.longitude ?? params.longitude,
      };

      // Adicionar à lista local imediatamente para feedback
      setDrafts(prev => [tempDraft, ...prev]);

      try {
        // Tentar enviar (com cartão padrão se necessário)
        const response = await apiSubmitDraft(paramsWithCard);

        if (response.success && response.draft) {
          // Substituir draft temporário pelo real com data válida
          const serverDraft = {
            ...response.draft,
            status: 'sent' as const,
            timestamp: ensureValidDate(response.draft.timestamp), // Garantir data válida
          };

          setDrafts(prev =>
            prev.map(d => d.id === tempDraft.id ? serverDraft : d)
          );

          console.log('✅ Draft enviado com sucesso');
        } else {
          throw new Error(response.message || 'Falha ao enviar draft');
        }
      } catch (err: any) {
        console.error('❌ Erro ao enviar draft:', err);

        // Adicionar à fila offline
        const queuedDraft: Omit<QueuedDraft, 'retryCount'> = {
          ...tempDraft,
          status: 'error',
          errorMessage: err.message || 'Erro ao enviar',
        };

        await addToQueue(queuedDraft);
        await loadQueue();

        // Atualizar status na lista
        setDrafts(prev =>
          prev.map(d => d.id === tempDraft.id ? { ...d, status: 'error' } : d)
        );

        throw err;
      }
    } catch (err) {
      console.error('❌ Erro ao processar draft:', err);
      throw err;
    }
  };

  /**
   * Recarrega todos os dados
   */
  const refreshData = async () => {
    info(LogCategory.APP, 'Usuário solicitou refresh manual dos dados');
    await Promise.all([
      initializeApp(false), // Não é primeiro login, mas força reload
      loadQueue(),
    ]);
  };

  /**
   * Força re-render completo de todos os componentes
   */
  const forceRefresh = () => {
    info(LogCategory.APP, 'Forçando refresh completo da UI');
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Faz login do usuário
   */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      info(LogCategory.AUTH, 'Iniciando processo de login', { email: credentials.email });

      const response = await authLogin(credentials);
      if (response.success && response.data) {
        info(LogCategory.AUTH, 'Login bem-sucedido - forçando reload completo...');

        // Forçar estado de loading antes de recarregar
        setIsLoading(true);

        try {
          // Resetar estados para forçar re-render
          setCards([]);
          setUsers([]);
          setDrafts([]);
          setDestinations([]);

          // Recarregar dados do usuário primeiro
          const userData = await getUserData();
          if (userData) {
            setCurrentUser({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              tenantId: userData.tenantId,
              tenantName: userData.tenantName,
              role: userData.role,
            });
          }

          // Forçar reload completo dos dados com retry
          await Promise.all([
            initializeApp(true, false), // Primeiro login com retry, sem gerenciar loading
            loadQueue(),
          ]);

          info(LogCategory.AUTH, 'Dados recarregados após login com sucesso');

          // Aguardar um tick para garantir que React processou as atualizações de estado
          await new Promise(resolve => setTimeout(resolve, 100));

          // Forçar re-render completo
          forceRefresh();
        } finally {
          setIsLoading(false);
        }

        return true;
      } else {
        warn(LogCategory.AUTH, 'Login falhou', { error: response.error });
      }
      return false;
    } catch (err) {
      error(LogCategory.AUTH, 'Erro durante processo de login', err);
      return false;
    }
  };

  /**
   * Register new user with new tenant
   */
  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      info(LogCategory.AUTH, 'Starting registration process', { email: credentials.email });

      const response = await authRegister(credentials);
      if (response.success && response.data) {
        info(LogCategory.AUTH, 'Registration successful - forcing complete reload...');

        // Force loading state before reloading
        setIsLoading(true);

        try {
          // Reset states to force re-render
          setCards([]);
          setUsers([]);
          setDrafts([]);
          setDestinations([]);

          // Reload user data first
          const userData = await getUserData();
          if (userData) {
            setCurrentUser({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              tenantId: userData.tenantId,
              tenantName: userData.tenantName,
              role: userData.role,
            });
          }

          // Force complete data reload with retry
          await Promise.all([
            initializeApp(true, false), // First login with retry, without managing loading
            loadQueue(),
          ]);

          info(LogCategory.AUTH, 'Data reloaded after registration successfully');

          // Wait a tick to ensure React processed state updates
          await new Promise(resolve => setTimeout(resolve, 100));

          // Force complete re-render
          forceRefresh();
        } finally {
          setIsLoading(false);
        }

        return true;
      } else {
        warn(LogCategory.AUTH, 'Registration failed', { error: response.error });
      }
      return false;
    } catch (err) {
      error(LogCategory.AUTH, 'Error during registration process', err);
      return false;
    }
  };

  /**
   * Faz logout COMPLETO do usuário (limpa tudo)
   */
  const logout = async () => {
    try {
      // 1. Chamar endpoint de logout no servidor
      await apiLogout();

      // 2. Limpar TODO o cache local
      await clearAllCache();

      // 3. Limpar estados do app
      setCurrentUser(null);
      setCards([]);
      setUsers([]);
      setDrafts([]);
      setDestinations([]);
      setQueuedDrafts([]);
      setDefaultCardId(null);

      console.log('✅ Logout completo realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  /**
   * Atualiza um draft existente
   */
  const updateDraft = async (draftId: string, data: UpdateDraftParams) => {
    try {
      const response = await apiUpdateDraft(draftId, data);

      if (response.success) {
        // Atualizar draft na lista local
        setDrafts(prev =>
          prev.map(d =>
            d.id === draftId
              ? { ...d, ...data } // Não sobrescrever timestamp
              : d
          )
        );

        console.log('✅ Draft atualizado localmente');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar draft:', error);
      throw error;
    }
  };

  /**
   * Deleta um draft
   */
  const deleteDraft = async (draftId: string) => {
    try {
      await apiDeleteDraft(draftId);

      // Remover da lista local
      setDrafts(prev => prev.filter(d => d.id !== draftId));

      console.log('✅ Draft removido da lista');
    } catch (error) {
      console.error('❌ Erro ao deletar draft:', error);
      throw error;
    }
  };

  /**
   * Cria um novo destination (responsável)
   */
  const createDestination = async (name: string) => {
    try {
      info(LogCategory.API, 'Criando novo destination', { name });

      const newDestination = await apiCreateDestination(name);

      // Adicionar à lista local
      setDestinations(prev => [...prev, newDestination]);

      info(LogCategory.API, 'Destination criado e adicionado à lista', { id: newDestination.id, name: newDestination.name });
    } catch (err) {
      error(LogCategory.API, 'Erro ao criar destination', err);
      throw err;
    }
  };

  /**
   * Tenta reenviar um draft da fila
   */
  const retryDraft = async (draftId: string) => {
    try {
      await processQueue();
      await loadQueue();
      await loadDraftsForMonth(selectedMonth);
    } catch (err) {
      console.error('❌ Erro ao tentar reenviar:', err);
      throw err;
    }
  };

  /**
   * Remove um draft da fila
   */
  const removeDraft = async (draftId: string) => {
    try {
      await removeFromQueue(draftId);
      await loadQueue();
    } catch (err) {
      console.error('❌ Erro ao remover draft:', err);
      throw err;
    }
  };

  /**
   * Load summary by destination
   */
  const loadSummary = async (month?: string) => {
    try {
      info(LogCategory.API, 'Loading summary by destination', { month });
      const summary = await getSummaryByDestination(month);
      setSummaryData(summary);
      info(LogCategory.API, 'Summary loaded successfully', { count: summary.length });
    } catch (err) {
      error(LogCategory.API, 'Error loading summary', err);
      setSummaryData([]);
    }
  };

  const value: AppContextType = {
    currentUser,
    cards,
    users,
    drafts,
    destinations,
    queuedDrafts,
    selectedMonth,
    isLoading,
    error,
    defaultCardId,
    refreshKey,
    summaryData,
    setCurrentUser,
    submitNewDraft,
    updateDraft,
    deleteDraft,
    createDestination,
    refreshData,
    forceRefresh,
    setSelectedMonth,
    retryDraft,
    removeDraft,
    login,
    register,
    logout,
    setDefaultCardId,
    loadSummary,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Hook para usar o contexto
 */
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return context;
};

/**
 * Retorna o mês atual no formato YYYY-MM
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

