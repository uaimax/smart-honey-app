import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { info, warn, error, LogCategory } from './logger';
import { getBatteryOptimizationShown, saveBatteryOptimizationShown } from './preferences';

const BATTERY_OPTIMIZATION_KEY = '@smart_honey:battery_optimization_requested';
const XIAOMI_GUIDANCE_KEY = '@smart_honey:xiaomi_guidance_shown';

interface BackgroundPersistenceStatus {
  notificationPermission: boolean;
  batteryOptimizationRequested: boolean;
  xiaomiGuidanceShown: boolean;
}

class BackgroundPersistenceService {
  /**
   * Verifica se o dispositivo é Xiaomi/MIUI
   */
  private isXiaomiDevice(): boolean {
    // No React Native, não temos acesso direto aos dados do fabricante
    // Mas podemos usar algumas heurísticas
    return Platform.OS === 'android'; // Para fins de demonstração, consideramos todos Android
  }

  /**
   * Solicita permissões necessárias para funcionamento em background
   */
  async requestBackgroundPermissions(): Promise<void> {
    try {
      info(LogCategory.PERMISSIONS, 'Iniciando solicitação de permissões de background...');

      // 1. Verificar permissão de notificações
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          warn(LogCategory.PERMISSIONS, 'Permissão de notificações negada');
          throw new Error('Permissão de notificações é necessária para funcionamento em background');
        }
      }

      info(LogCategory.PERMISSIONS, 'Permissão de notificações concedida');

      // 2. Mostrar guia de otimização de bateria se necessário
      await this.showBatteryOptimizationGuide();

      // 3. Mostrar guia específico para Xiaomi se necessário
      if (this.isXiaomiDevice()) {
        await this.showXiaomiSpecificGuide();
      }

      info(LogCategory.PERMISSIONS, 'Processo de permissões de background concluído');
    } catch (err) {
      error(LogCategory.PERMISSIONS, 'Erro ao solicitar permissões de background', err);
      throw err;
    }
  }

  /**
   * Mostra guia de otimização de bateria
   */
  private async showBatteryOptimizationGuide(): Promise<void> {
    try {
      const alreadyShown = await getBatteryOptimizationShown();
      if (alreadyShown) {
        info(LogCategory.PERMISSIONS, 'Guia de otimização de bateria já foi mostrado');
        return;
      }

      return new Promise((resolve) => {
        Alert.alert(
          '🔋 Otimização de Bateria',
          'Para o Smart Honey funcionar corretamente em segundo plano e capturar notificações do Google Wallet, é importante desabilitar a otimização de bateria para este app.\\n\\n' +
          '📱 Passos:\\n' +
          '1. Vá em Configurações > Bateria\\n' +
          '2. Encontre "Otimização de bateria"\\n' +
          '3. Procure por "Smart Honey"\\n' +
          '4. Selecione "Não otimizar"\\n\\n' +
          '⚠️ Sem isso, o Android pode fechar o app e interromper a captura de notificações.',
          [
            {
              text: 'Entendi',
              onPress: async () => {
                await saveBatteryOptimizationShown(true);
                info(LogCategory.PERMISSIONS, 'Usuário confirmou guia de otimização de bateria');
                resolve();
              }
            },
            {
              text: 'Abrir Configurações',
              onPress: async () => {
                await saveBatteryOptimizationShown(true);
                // Tentar abrir configurações de bateria (pode não funcionar em todos os dispositivos)
                try {
                  await Linking.openSettings();
                } catch (err) {
                  warn(LogCategory.PERMISSIONS, 'Não foi possível abrir configurações automaticamente');
                }
                resolve();
              }
            }
          ]
        );
      });
    } catch (err) {
      error(LogCategory.PERMISSIONS, 'Erro ao mostrar guia de otimização de bateria', err);
    }
  }

  /**
   * Mostra guia específico para dispositivos Xiaomi/MIUI
   */
  private async showXiaomiSpecificGuide(): Promise<void> {
    try {
      const alreadyShown = await AsyncStorage.getItem(XIAOMI_GUIDANCE_KEY);
      if (alreadyShown === 'true') {
        info(LogCategory.PERMISSIONS, 'Guia específico para Xiaomi já foi mostrado');
        return;
      }

      return new Promise((resolve) => {
        Alert.alert(
          '📱 Configurações Xiaomi/MIUI',
          'Detectamos que você pode estar usando um dispositivo Xiaomi. Para garantir que o Smart Honey funcione corretamente:\\n\\n' +
          '🔧 Configurações adicionais:\\n\\n' +
          '1. **Autostart**:\\n' +
          '   • Segurança > Gerenciar apps > Smart Honey > Autostart: Ativar\\n\\n' +
          '2. **Travamento na tela de recentes**:\\n' +
          '   • Abra apps recentes, arraste Smart Honey para baixo para "travar"\\n\\n' +
          '3. **Economizador de bateria**:\\n' +
          '   • Configurações > Bateria > Smart Honey > Sem restrições\\n\\n' +
          '4. **Exibir notificações**:\\n' +
          '   • Configurações > Apps > Smart Honey > Notificações: Ativar todas\\n\\n' +
          '⚡ Essas configurações são essenciais para dispositivos Xiaomi!',
          [
            {
              text: 'Entendi',
              onPress: async () => {
                await AsyncStorage.setItem(XIAOMI_GUIDANCE_KEY, 'true');
                info(LogCategory.PERMISSIONS, 'Usuário confirmou guia específico para Xiaomi');
                resolve();
              }
            },
            {
              text: 'Abrir Configurações',
              onPress: async () => {
                await AsyncStorage.setItem(XIAOMI_GUIDANCE_KEY, 'true');
                try {
                  await Linking.openSettings();
                } catch (err) {
                  warn(LogCategory.PERMISSIONS, 'Não foi possível abrir configurações automaticamente');
                }
                resolve();
              }
            }
          ]
        );
      });
    } catch (err) {
      error(LogCategory.PERMISSIONS, 'Erro ao mostrar guia específico para Xiaomi', err);
    }
  }

  /**
   * Cria uma notificação persistente para manter o app ativo
   */
  async createPersistentNotification(): Promise<void> {
    try {
      info(LogCategory.NOTIFICATIONS, 'Criando notificação persistente para background...');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍯 Smart Honey Ativo',
          body: 'Monitorando notificações do Google Wallet...',
          data: { persistent: true },
          sticky: true,
          sound: false,
        },
        trigger: null, // Imediatamente
        identifier: 'smart-honey-persistent',
      });

      info(LogCategory.NOTIFICATIONS, 'Notificação persistente criada');
    } catch (err) {
      error(LogCategory.NOTIFICATIONS, 'Erro ao criar notificação persistente', err);
    }
  }

  /**
   * Remove a notificação persistente
   */
  async removePersistentNotification(): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync('smart-honey-persistent');
      info(LogCategory.NOTIFICATIONS, 'Notificação persistente removida');
    } catch (err) {
      error(LogCategory.NOTIFICATIONS, 'Erro ao remover notificação persistente', err);
    }
  }

  /**
   * Verifica o status das configurações de background
   */
  async getBackgroundStatus(): Promise<BackgroundPersistenceStatus> {
    try {
      const [notificationStatus, batteryOptShown, xiaomiShown] = await Promise.all([
        Notifications.getPermissionsAsync(),
        getBatteryOptimizationShown(),
        AsyncStorage.getItem(XIAOMI_GUIDANCE_KEY),
      ]);

      const status = {
        notificationPermission: notificationStatus.status === 'granted',
        batteryOptimizationRequested: batteryOptShown,
        xiaomiGuidanceShown: xiaomiShown === 'true',
      };

      info(LogCategory.PERMISSIONS, 'Status de background verificado', status);

      return status;
    } catch (err) {
      error(LogCategory.PERMISSIONS, 'Erro ao verificar status de background', err);
      return {
        notificationPermission: false,
        batteryOptimizationRequested: false,
        xiaomiGuidanceShown: false,
      };
    }
  }

  /**
   * Força a configuração inicial completa
   */
  async setupBackgroundPersistence(): Promise<void> {
    try {
      info(LogCategory.PERMISSIONS, 'Iniciando configuração completa de persistência em background...');

      // Solicitar todas as permissões
      await this.requestBackgroundPermissions();

      // Criar notificação persistente
      await this.createPersistentNotification();

      info(LogCategory.PERMISSIONS, 'Configuração de persistência em background concluída');
    } catch (err) {
      error(LogCategory.PERMISSIONS, 'Erro na configuração de persistência em background', err);
      throw err;
    }
  }

  /**
   * Reseta todas as configurações de background (para testing)
   */
  async resetBackgroundSettings(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(BATTERY_OPTIMIZATION_KEY),
        AsyncStorage.removeItem(XIAOMI_GUIDANCE_KEY),
        saveBatteryOptimizationShown(false),
        this.removePersistentNotification(),
      ]);

      info(LogCategory.PERMISSIONS, 'Configurações de background resetadas');
    } catch (err) {
      error(LogCategory.PERMISSIONS, 'Erro ao resetar configurações de background', err);
    }
  }
}

// Exportar instância única (singleton)
const backgroundPersistenceService = new BackgroundPersistenceService();

// Exportar funções principais
export const requestBackgroundPermissions = () => backgroundPersistenceService.requestBackgroundPermissions();
export const createPersistentNotification = () => backgroundPersistenceService.createPersistentNotification();
export const removePersistentNotification = () => backgroundPersistenceService.removePersistentNotification();
export const getBackgroundStatus = () => backgroundPersistenceService.getBackgroundStatus();
export const setupBackgroundPersistence = () => backgroundPersistenceService.setupBackgroundPersistence();
export const resetBackgroundSettings = () => backgroundPersistenceService.resetBackgroundSettings();