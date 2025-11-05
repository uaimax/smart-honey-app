import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseNotification } from '@/utils/notificationParser';
import { ParsedNotification } from '@/types';

const NOTIFICATION_PERMISSION_KEY = '@smart_honey:notification_permission';

// Configurar como as notificações devem ser tratadas quando app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFA500',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';

      // Salvar status da permissão
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, granted.toString());

      console.log('🔔 Permissão de notificações:', granted ? 'concedida' : 'negada');
      return granted;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão de notificações:', error);
      return false;
    }
  }

  /**
   * Verifica se tem permissão de notificações
   */
  async hasPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Configura listener para notificações recebidas
   */
  setupNotificationListener(
    onBankingNotification: (parsedData: ParsedNotification) => void
  ): () => void {
    console.log('🔔 Configurando listener de notificações...');

    // Listener para notificações recebidas
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Notificação recebida:', notification.request.content);

        // Tentar parsear como notificação bancária
        const parsed = this.parseReceivedNotification(notification);

        if (parsed) {
          console.log('💰 Notificação bancária detectada!');
          onBankingNotification(parsed);
        } else {
          console.log('ℹ️ Notificação ignorada (não bancária)');
        }
      }
    );

    // Retornar função de cleanup
    return () => {
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

    // Parsear conteúdo
    return parseNotification(title, body, packageName);
  }

  /**
   * Adiciona listener para quando app está em background
   */
  setupBackgroundListener(
    onBankingNotification: (parsedData: ParsedNotification) => void
  ): () => void {
    // Listener para quando usuário toca na notificação
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('🔔 Notificação tocada:', response.notification.request.content);

        const parsed = this.parseReceivedNotification(response.notification);
        if (parsed) {
          onBankingNotification(parsed);
        }
      }
    );

    return () => {
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
