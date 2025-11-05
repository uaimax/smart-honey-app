import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueuedDraft, Draft, SubmitDraftParams } from '@/types';
import { submitDraft } from './api';

const QUEUE_STORAGE_KEY = '@smart_honey:draft_queue';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000; // 2 segundos

class QueueService {
  private isProcessing = false;
  private listeners: Array<() => void> = [];

  /**
   * Adiciona um draft à fila offline
   */
  async addToQueue(draft: Omit<QueuedDraft, 'retryCount'>): Promise<void> {
    try {
      const queue = await this.getQueue();

      const queuedDraft: QueuedDraft = {
        ...draft,
        retryCount: 0,
        status: 'sending',
      };

      queue.push(queuedDraft);
      await this.saveQueue(queue);

      console.log('📌 Draft adicionado à fila:', draft.id);
      this.notifyListeners();

      // Tentar processar imediatamente
      this.processQueue();
    } catch (error) {
      console.error('❌ Erro ao adicionar à fila:', error);
      throw error;
    }
  }

  /**
   * Obtém todos os drafts na fila
   */
  async getQueue(): Promise<QueuedDraft[]> {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!queueJson) {
        return [];
      }

      const queue = JSON.parse(queueJson) as QueuedDraft[];

      // Converter timestamps de string para Date
      return queue.map(draft => ({
        ...draft,
        timestamp: new Date(draft.timestamp),
        lastRetryAt: draft.lastRetryAt ? new Date(draft.lastRetryAt) : undefined,
      }));
    } catch (error) {
      console.error('❌ Erro ao ler fila:', error);
      return [];
    }
  }

  /**
   * Salva fila no AsyncStorage
   */
  private async saveQueue(queue: QueuedDraft[]): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('❌ Erro ao salvar fila:', error);
      throw error;
    }
  }

  /**
   * Remove um draft da fila
   */
  async removeFromQueue(draftId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const updatedQueue = queue.filter(draft => draft.id !== draftId);
      await this.saveQueue(updatedQueue);

      console.log('🗑️ Draft removido da fila:', draftId);
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Erro ao remover da fila:', error);
      throw error;
    }
  }

  /**
   * Atualiza status de um draft na fila
   */
  private async updateDraftInQueue(
    draftId: string,
    updates: Partial<QueuedDraft>
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const updatedQueue = queue.map(draft =>
        draft.id === draftId ? { ...draft, ...updates } : draft
      );
      await this.saveQueue(updatedQueue);
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Erro ao atualizar draft na fila:', error);
    }
  }

  /**
   * Processa a fila tentando enviar drafts pendentes
   */
  async processQueue(): Promise<void> {
    // Evitar processamento concorrente
    if (this.isProcessing) {
      console.log('⏳ Processamento de fila já em andamento...');
      return;
    }

    // Verificar conexão
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('📵 Offline - aguardando conexão para processar fila');
      return;
    }

    this.isProcessing = true;
    console.log('🔄 Iniciando processamento da fila...');

    try {
      const queue = await this.getQueue();

      if (queue.length === 0) {
        console.log('✅ Fila vazia');
        return;
      }

      console.log(`📋 ${queue.length} draft(s) na fila`);

      for (const draft of queue) {
        await this.processDraft(draft);
      }

      console.log('✅ Processamento da fila concluído');
    } catch (error) {
      console.error('❌ Erro ao processar fila:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processa um draft individual
   */
  private async processDraft(draft: QueuedDraft): Promise<void> {
    // Verificar se excedeu tentativas máximas
    if (draft.retryCount >= MAX_RETRY_ATTEMPTS) {
      console.warn(`⚠️ Draft ${draft.id} excedeu máximo de tentativas`);
      await this.updateDraftInQueue(draft.id, {
        status: 'error',
        errorMessage: 'Máximo de tentativas excedido',
      });
      return;
    }

    // Delay entre tentativas (backoff exponencial)
    if (draft.retryCount > 0) {
      const delay = RETRY_DELAY_MS * Math.pow(2, draft.retryCount - 1);
      console.log(`⏱️ Aguardando ${delay}ms antes de retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      console.log(`📤 Tentando enviar draft ${draft.id} (tentativa ${draft.retryCount + 1})`);

      // Construir params para submissão
      const params: SubmitDraftParams = {
        userId: draft.userId,
        cardId: draft.cardId,
      };

      if (draft.audioUri) {
        params.audio = {
          uri: draft.audioUri,
          name: `audio_${draft.id}.m4a`,
          type: 'audio/m4a',
        };
      }

      if (draft.textInput) {
        params.text = draft.textInput;
      }

      // Tentar enviar
      const response = await submitDraft(params);

      if (response.success) {
        console.log(`✅ Draft ${draft.id} enviado com sucesso!`);
        await this.removeFromQueue(draft.id);
      } else {
        throw new Error(response.message || 'Falha ao enviar draft');
      }
    } catch (error: any) {
      console.error(`❌ Erro ao enviar draft ${draft.id}:`, error.message);

      // Incrementar contador de tentativas
      await this.updateDraftInQueue(draft.id, {
        retryCount: draft.retryCount + 1,
        lastRetryAt: new Date(),
        errorMessage: error.message || 'Erro desconhecido',
      });
    }
  }

  /**
   * Retry manual de um draft específico
   */
  async retryDraft(draftId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const draft = queue.find(d => d.id === draftId);

      if (!draft) {
        throw new Error('Draft não encontrado na fila');
      }

      // Reset retry count
      await this.updateDraftInQueue(draftId, {
        retryCount: 0,
        status: 'sending',
      });

      // Processar imediatamente
      await this.processDraft(draft);
    } catch (error) {
      console.error('❌ Erro ao tentar retry:', error);
      throw error;
    }
  }

  /**
   * Limpa toda a fila (uso com cuidado!)
   */
  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
      console.log('🗑️ Fila limpa');
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Erro ao limpar fila:', error);
      throw error;
    }
  }

  /**
   * Obtém contagem de drafts na fila
   */
  async getQueueCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Inicia monitoramento de conexão para auto-sync
   */
  startNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('🌐 Conexão detectada - processando fila...');
        this.processQueue();
      }
    });

    console.log('👁️ Monitoramento de rede iniciado');
  }

  /**
   * Registra listener para mudanças na fila
   */
  addListener(callback: () => void): () => void {
    this.listeners.push(callback);

    // Retorna função para remover listener
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica todos os listeners de mudanças
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ Erro ao notificar listener:', error);
      }
    });
  }
}

// Exportar instância única (singleton)
export const queueService = new QueueService();

// Exportar funções principais
export const addToQueue = (draft: Omit<QueuedDraft, 'retryCount'>) =>
  queueService.addToQueue(draft);
export const getQueue = () => queueService.getQueue();
export const removeFromQueue = (id: string) => queueService.removeFromQueue(id);
export const processQueue = () => queueService.processQueue();
export const retryDraft = (id: string) => queueService.retryDraft(id);
export const clearQueue = () => queueService.clearQueue();
export const getQueueCount = () => queueService.getQueueCount();
export const startNetworkMonitoring = () => queueService.startNetworkMonitoring();

