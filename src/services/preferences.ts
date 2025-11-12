import AsyncStorage from '@react-native-async-storage/async-storage';
import { info, error, debug, LogCategory } from './logger';

const DEFAULT_CARD_KEY = '@smart_honey:default_card';
const WALLET_ENABLED_KEY = '@smart_honey:wallet_enabled';
const LOCATION_ENABLED_KEY = '@smart_honey:location_enabled';
const SOUND_ENABLED_KEY = '@smart_honey:sound_enabled';
const BATTERY_OPTIMIZATION_SHOWN_KEY = '@smart_honey:battery_optimization_shown';

export interface UserPreferences {
  defaultCardId: string | null;
  walletEnabled: boolean;
  locationEnabled: boolean;
  soundEnabled: boolean;
  batteryOptimizationShown: boolean;
}

class PreferencesService {
  /**
   * Salva o cartão padrão
   */
  async saveDefaultCard(cardId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(DEFAULT_CARD_KEY, cardId);
      info(LogCategory.SETTINGS, 'Cartão padrão salvo', { cardId });
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao salvar cartão padrão', err);
      throw err;
    }
  }

  /**
   * Recupera o cartão padrão
   */
  async getDefaultCard(): Promise<string | null> {
    try {
      const cardId = await AsyncStorage.getItem(DEFAULT_CARD_KEY);
      debug(LogCategory.SETTINGS, 'Cartão padrão recuperado', { cardId });
      return cardId;
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao recuperar cartão padrão', err);
      return null;
    }
  }

  /**
   * Limpa o cartão padrão
   */
  async clearDefaultCard(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DEFAULT_CARD_KEY);
      info(LogCategory.SETTINGS, 'Cartão padrão removido');
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao remover cartão padrão', err);
      throw err;
    }
  }

  /**
   * Salva configuração de captura automática do Wallet
   */
  async saveWalletEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(WALLET_ENABLED_KEY, enabled.toString());
      info(LogCategory.SETTINGS, 'Configuração de Wallet salva', { enabled });
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao salvar configuração de Wallet', err);
      throw err;
    }
  }

  /**
   * Recupera configuração de captura automática do Wallet
   */
  async getWalletEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(WALLET_ENABLED_KEY);
      const enabled = value === 'true';
      debug(LogCategory.SETTINGS, 'Configuração de Wallet recuperada', { enabled });
      return enabled;
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao recuperar configuração de Wallet', err);
      return false;
    }
  }

  /**
   * Salva configuração de compartilhamento de localização
   */
  async saveLocationEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCATION_ENABLED_KEY, enabled.toString());
      info(LogCategory.SETTINGS, 'Configuração de localização salva', { enabled });
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao salvar configuração de localização', err);
      throw err;
    }
  }

  /**
   * Recupera configuração de compartilhamento de localização
   */
  async getLocationEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(LOCATION_ENABLED_KEY);
      const enabled = value === 'true';
      debug(LogCategory.SETTINGS, 'Configuração de localização recuperada', { enabled });
      return enabled;
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao recuperar configuração de localização', err);
      return true; // Padrão habilitado
    }
  }

  /**
   * Salva configuração de sons e vibrações
   */
  async saveSoundEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
      info(LogCategory.SETTINGS, 'Configuração de som salva', { enabled });
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao salvar configuração de som', err);
      throw err;
    }
  }

  /**
   * Recupera configuração de sons e vibrações
   */
  async getSoundEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
      const enabled = value !== 'false'; // Padrão habilitado
      debug(LogCategory.SETTINGS, 'Configuração de som recuperada', { enabled });
      return enabled;
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao recuperar configuração de som', err);
      return true;
    }
  }

  /**
   * Salva se o aviso de otimização de bateria já foi mostrado
   */
  async saveBatteryOptimizationShown(shown: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(BATTERY_OPTIMIZATION_SHOWN_KEY, shown.toString());
      debug(LogCategory.SETTINGS, 'Status de aviso de bateria salvo', { shown });
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao salvar status de aviso de bateria', err);
      throw err;
    }
  }

  /**
   * Verifica se o aviso de otimização de bateria já foi mostrado
   */
  async getBatteryOptimizationShown(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(BATTERY_OPTIMIZATION_SHOWN_KEY);
      const shown = value === 'true';
      debug(LogCategory.SETTINGS, 'Status de aviso de bateria recuperado', { shown });
      return shown;
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao recuperar status de aviso de bateria', err);
      return false;
    }
  }

  /**
   * Carrega todas as preferências de uma vez
   */
  async getAllPreferences(): Promise<UserPreferences> {
    try {
      const [defaultCardId, walletEnabled, locationEnabled, soundEnabled, batteryOptimizationShown] = await Promise.all([
        this.getDefaultCard(),
        this.getWalletEnabled(),
        this.getLocationEnabled(),
        this.getSoundEnabled(),
        this.getBatteryOptimizationShown(),
      ]);

      const preferences = {
        defaultCardId,
        walletEnabled,
        locationEnabled,
        soundEnabled,
        batteryOptimizationShown,
      };

      info(LogCategory.SETTINGS, 'Todas as preferências carregadas', preferences);

      return preferences;
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao carregar todas as preferências', err);
      // Retornar valores padrão em caso de erro
      return {
        defaultCardId: null,
        walletEnabled: false,
        locationEnabled: true,
        soundEnabled: true,
        batteryOptimizationShown: false,
      };
    }
  }

  /**
   * Salva múltiplas preferências de uma vez
   */
  async saveMultiplePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const operations: Promise<void>[] = [];

      if (preferences.defaultCardId !== undefined) {
        if (preferences.defaultCardId) {
          operations.push(this.saveDefaultCard(preferences.defaultCardId));
        } else {
          operations.push(this.clearDefaultCard());
        }
      }

      if (preferences.walletEnabled !== undefined) {
        operations.push(this.saveWalletEnabled(preferences.walletEnabled));
      }

      if (preferences.locationEnabled !== undefined) {
        operations.push(this.saveLocationEnabled(preferences.locationEnabled));
      }

      if (preferences.soundEnabled !== undefined) {
        operations.push(this.saveSoundEnabled(preferences.soundEnabled));
      }

      if (preferences.batteryOptimizationShown !== undefined) {
        operations.push(this.saveBatteryOptimizationShown(preferences.batteryOptimizationShown));
      }

      await Promise.all(operations);

      info(LogCategory.SETTINGS, 'Múltiplas preferências salvas', preferences);
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao salvar múltiplas preferências', err);
      throw err;
    }
  }

  /**
   * Limpa todas as preferências
   */
  async clearAllPreferences(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(DEFAULT_CARD_KEY),
        AsyncStorage.removeItem(WALLET_ENABLED_KEY),
        AsyncStorage.removeItem(LOCATION_ENABLED_KEY),
        AsyncStorage.removeItem(SOUND_ENABLED_KEY),
        AsyncStorage.removeItem(BATTERY_OPTIMIZATION_SHOWN_KEY),
      ]);

      info(LogCategory.SETTINGS, 'Todas as preferências limpa');
    } catch (err) {
      error(LogCategory.SETTINGS, 'Erro ao limpar todas as preferências', err);
      throw err;
    }
  }
}

// Exportar instância única (singleton)
const preferencesService = new PreferencesService();

// Exportar funções principais - compatibilidade com código existente
export const saveDefaultCard = (cardId: string) => preferencesService.saveDefaultCard(cardId);
export const getDefaultCard = () => preferencesService.getDefaultCard();
export const clearDefaultCard = () => preferencesService.clearDefaultCard();

// Exportar novas funções
export const saveWalletEnabled = (enabled: boolean) => preferencesService.saveWalletEnabled(enabled);
export const getWalletEnabled = () => preferencesService.getWalletEnabled();
export const saveLocationEnabled = (enabled: boolean) => preferencesService.saveLocationEnabled(enabled);
export const getLocationEnabled = () => preferencesService.getLocationEnabled();
export const saveSoundEnabled = (enabled: boolean) => preferencesService.saveSoundEnabled(enabled);
export const getSoundEnabled = () => preferencesService.getSoundEnabled();
export const saveBatteryOptimizationShown = (shown: boolean) => preferencesService.saveBatteryOptimizationShown(shown);
export const getBatteryOptimizationShown = () => preferencesService.getBatteryOptimizationShown();
export const getAllPreferences = () => preferencesService.getAllPreferences();
export const saveMultiplePreferences = (preferences: Partial<UserPreferences>) => preferencesService.saveMultiplePreferences(preferences);
export const clearAllPreferences = () => preferencesService.clearAllPreferences();

