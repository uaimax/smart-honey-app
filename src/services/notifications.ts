import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseNotification } from '@/utils/notificationParser';
import { ParsedNotification } from '@/types';
import { info, warn, error, debug, LogCategory } from './logger';

const NOTIFICATION_PERMISSION_KEY = '@smart_honey:notification_permission';

// Configurar como as notificações devem ser tratadas quando app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private listeners: Array<(parsedData: ParsedNotification) => void> = [];

  /**
   * Solicita permissão de notificações
   */
  async requestPermission(): Promise<boolean> {
    try {
      info(LogCategory.NOTIFICATIONS, 'Solicitando permissão de notificações...');

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFA500',
        });
        debug(LogCategory.NOTIFICATIONS, 'Canal de notificação Android configurado');
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      debug(LogCategory.NOTIFICATIONS, 'Status atual de permissão', { existingStatus });

      if (existingStatus !== 'granted') {
        info(LogCategory.NOTIFICATIONS, 'Solicitando nova permissão de notificações...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';

      // Salvar status da permissão
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, granted.toString());

      if (granted) {
        info(LogCategory.NOTIFICATIONS, 'Permissão de notificações concedida');
      } else {
        warn(LogCategory.NOTIFICATIONS, 'Permissão de notificações negada', { finalStatus });
      }

      return granted;
    } catch (err) {
      error(LogCategory.NOTIFICATIONS, 'Erro ao solicitar permissão de notificações', err);
      return false;
    }
  }

  /**
   * Verifica se tem permissão de notificações
   */
  async hasPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === 'granted';

      debug(LogCategory.NOTIFICATIONS, 'Verificando permissão de notificações', { status, granted });

      return granted;
    } catch (err) {
      error(LogCategory.NOTIFICATIONS, 'Erro ao verificar permissão de notificações', err);
      return false;
    }
  }

  /**
   * Configura listener para notificações recebidas
   */
  setupNotificationListener(
    onBankingNotification: (parsedData: ParsedNotification) => void
  ): () => void {
    info(LogCategory.NOTIFICATIONS, 'Configurando listener de notificações em foreground...');

    // Listener para notificações recebidas
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const content = notification.request.content;

        info(LogCategory.NOTIFICATIONS, 'Notificação recebida em foreground', {
          title: content.title,
          body: content.body,
          hasData: !!content.data,
          identifier: notification.request.identifier,
        });

        // Tentar parsear como notificação bancária
        const parsed = this.parseReceivedNotification(notification);

        if (parsed) {
          info(LogCategory.WALLET, 'Notificação bancária detectada e parseada!', {
            amount: parsed.amount,
            description: parsed.description,
            cardLast4: parsed.cardLast4,
          });
          onBankingNotification(parsed);
        } else {
          debug(LogCategory.NOTIFICATIONS, 'Notificação ignorada (não bancária ou sem valor válido)');
        }
      }
    );

    // Retornar função de cleanup
    return () => {
      info(LogCategory.NOTIFICATIONS, 'Removendo listener de notificações em foreground');
      subscription.remove();
    };
  }

  /**
   * Parse de notificação recebida
   */
  private parseReceivedNotification(
    notification: Notifications.Notification
  ): ParsedNotification | null {
    const content = notification.request.content;
    const title = content.title || '';
    const body = content.body || '';

    // Tentar obter package name (Android)
    let packageName = '';
    if (Platform.OS === 'android' && content.data) {
      packageName = (content.data as any).packageName || '';
    }

    debug(LogCategory.WALLET, 'Tentando parsear notificação', {
      title,
      body,
      packageName,
      hasData: !!content.data,
      platform: Platform.OS,
    });

    // Parsear conteúdo
    const parsed = parseNotification(title, body, packageName);

    if (parsed) {
      info(LogCategory.WALLET, 'Parsing bem-sucedido', {
        amount: parsed.amount,
        description: parsed.description,
        cardLast4: parsed.cardLast4,
      });
    } else {
      debug(LogCategory.WALLET, 'Parsing falhou - notificação não é bancária ou não tem valor válido');
    }

    return parsed;
  }

  /**
   * Adiciona listener para quando app está em background
   */
  setupBackgroundListener(
    onBankingNotification: (parsedData: ParsedNotification) => void
  ): () => void {
    info(LogCategory.NOTIFICATIONS, 'Configurando listener de notificações em background...');

    // Listener para quando usuário toca na notificação
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const content = response.notification.request.content;

        info(LogCategory.NOTIFICATIONS, 'Usuário tocou na notificação (background/closed)', {
          title: content.title,
          body: content.body,
          actionIdentifier: response.actionIdentifier,
          userText: response.userText,
        });

        const parsed = this.parseReceivedNotification(response.notification);
        if (parsed) {
          info(LogCategory.WALLET, 'Processando notificação bancária via background tap');
          onBankingNotification(parsed);
        }
      }
    );

    return () => {
      info(LogCategory.NOTIFICATIONS, 'Removendo listener de notificações em background');
      subscription.remove();
    };
  }

  /**
   * Mostra notificação local
   */
  async showLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Imediatamente
      });
    } catch (error) {
      console.error('❌ Erro ao mostrar notificação:', error);
    }
  }
}

// Exportar instância única (singleton)
const notificationService = new NotificationService();

// Exportar funções principais
export const requestPermission = () => notificationService.requestPermission();
export const hasPermission = () => notificationService.hasPermission();
export const setupNotificationListener = (callback: (parsed: ParsedNotification) => void) =>
  notificationService.setupNotificationListener(callback);
export const setupBackgroundListener = (callback: (parsed: ParsedNotification) => void) =>
  notificationService.setupBackgroundListener(callback);
export const showLocalNotification = (title: string, body: string, data?: any) =>
  notificationService.showLocalNotification(title, body, data);
