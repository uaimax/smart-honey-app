import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_CARD_KEY = '@smart_honey:default_card';

class PreferencesService {
  /**
   * Salva o cartão padrão
   */
  async saveDefaultCard(cardId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(DEFAULT_CARD_KEY, cardId);
      console.log('💾 Cartão padrão salvo:', cardId);
    } catch (error) {
      console.error('❌ Erro ao salvar cartão padrão:', error);
      throw error;
    }
  }

  /**
   * Recupera o cartão padrão
   */
  async getDefaultCard(): Promise<string | null> {
    try {
      const cardId = await AsyncStorage.getItem(DEFAULT_CARD_KEY);
      return cardId;
    } catch (error) {
      console.error('❌ Erro ao recuperar cartão padrão:', error);
      return null;
    }
  }

  /**
   * Limpa o cartão padrão
   */
  async clearDefaultCard(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DEFAULT_CARD_KEY);
      console.log('🗑️ Cartão padrão removido');
    } catch (error) {
      console.error('❌ Erro ao remover cartão padrão:', error);
      throw error;
    }
  }
}

// Exportar instância única (singleton)
const preferencesService = new PreferencesService();

// Exportar funções principais
export const saveDefaultCard = (cardId: string) => preferencesService.saveDefaultCard(cardId);
export const getDefaultCard = () => preferencesService.getDefaultCard();
export const clearDefaultCard = () => preferencesService.clearDefaultCard();

