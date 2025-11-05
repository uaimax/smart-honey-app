import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '@/context/AppContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useTheme } from '@/theme';
import { setupNotificationListener, setupBackgroundListener, requestPermission } from '@/services/notifications';
import { ParsedNotification } from '@/types';

function AppContent() {
  const theme = useTheme();
  const { submitNewDraft, defaultCardId } = useApp();

  // Configurar listeners de notificação
  useEffect(() => {
    let cleanupForeground: (() => void) | undefined;
    let cleanupBackground: (() => void) | undefined;

    const setupListeners = async () => {
      // Pedir permissão de notificações
      await requestPermission();

      // Handler para notificações bancárias
      const handleBankingNotification = async (parsedData: ParsedNotification) => {
        try {
          console.log('💰 Notificação bancária detectada:', parsedData);

          // VALIDAÇÃO: Cartão padrão é obrigatório para notificações
          if (!defaultCardId) {
            console.warn('⚠️ Cartão padrão não configurado - não é possível criar lançamento automático');
            // TODO: Mostrar notificação local pedindo configuração
            return;
          }

          console.log('💰 Criando lançamento automático...');

          // Criar draft automaticamente usando cartão padrão
          await submitNewDraft({
            text: `${parsedData.description} - ${parsedData.amount.toFixed(2)}`,
            cardId: defaultCardId,
            date: parsedData.timestamp,
          });

          console.log('✅ Lançamento automático criado');
        } catch (error) {
          console.error('❌ Erro ao criar lançamento automático:', error);
        }
      };

      // Configurar listeners
      cleanupForeground = setupNotificationListener(handleBankingNotification);
      cleanupBackground = setupBackgroundListener(handleBankingNotification);

      console.log('✅ Listeners de notificação configurados');
    };

    setupListeners();

    // Cleanup ao desmontar
    return () => {
      cleanupForeground?.();
      cleanupBackground?.();
    };
  }, [defaultCardId]);

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
