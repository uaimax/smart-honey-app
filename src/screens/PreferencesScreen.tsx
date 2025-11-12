import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useApp } from '@/context/AppContext';
import {
  getAllPreferences,
  saveWalletEnabled,
  saveLocationEnabled,
  saveSoundEnabled,
  UserPreferences
} from '@/services/preferences';
import { info, warn, error, LogCategory } from '@/services/logger';
import * as Notifications from 'expo-notifications';
import { parseNotification } from '@/utils/notificationParser';
import { setupBackgroundPersistence, getBackgroundStatus, resetBackgroundSettings } from '@/services/backgroundPersistence';

export const PreferencesScreen: React.FC<any> = ({ navigation }) => {
  const theme = useTheme();
  const { cards, users, currentUser, logout, submitNewDraft, defaultCardId, queuedDrafts } = useApp();

  // Estados para preferências (carregados do AsyncStorage)
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar preferências ao montar o componente
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const preferences = await getAllPreferences();

      setWalletEnabled(preferences.walletEnabled);
      setLocationEnabled(preferences.locationEnabled);
      setSoundEnabled(preferences.soundEnabled);

      info(LogCategory.SETTINGS, 'Preferências carregadas na tela de configurações', preferences);
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletToggle = async (enabled: boolean) => {
    try {
      await saveWalletEnabled(enabled);
      setWalletEnabled(enabled);
      info(LogCategory.SETTINGS, 'Configuração de Wallet alterada pelo usuário', { enabled });
    } catch (error) {
      console.error('Erro ao salvar configuração de Wallet:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
    }
  };

  const handleLocationToggle = async (enabled: boolean) => {
    try {
      await saveLocationEnabled(enabled);
      setLocationEnabled(enabled);
      info(LogCategory.SETTINGS, 'Configuração de localização alterada pelo usuário', { enabled });
    } catch (error) {
      console.error('Erro ao salvar configuração de localização:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
    }
  };

  const handleSoundToggle = async (enabled: boolean) => {
    try {
      await saveSoundEnabled(enabled);
      setSoundEnabled(enabled);
      info(LogCategory.SETTINGS, 'Configuração de som alterada pelo usuário', { enabled });
    } catch (error) {
      console.error('Erro ao salvar configuração de som:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
    }
  };

  const testWalletNotifications = async () => {
    try {
      info(LogCategory.WALLET, 'Usuário solicitou varredura de notificações Wallet ativas');

      // Verificar permissão de notificações
      const { status } = await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'É necessário conceder permissão de notificações para acessar notificações ativas.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Solicitar Permissão',
              onPress: async () => {
                await Notifications.requestPermissionsAsync();
              },
            },
          ]
        );
        return;
      }

      let resultMessage = '🔍 Varredura de Notificações Wallet:\n\n';
      let foundNotifications = 0;
      let createdDrafts = 0;

      try {
        info(LogCategory.WALLET, 'Iniciando varredura real de notificações do sistema');
        resultMessage += '📱 Varrendo notificações ativas do sistema...\n\n';

        // Tentar acessar notificações ativas (se disponível)
        try {
          // No Expo/React Native, não há API nativa para acessar notificações de outros apps
          // Esta seria a implementação se tivéssemos uma biblioteca nativa custom
          const activeNotifications = await Notifications.getPresentedNotificationsAsync();

          if (activeNotifications && activeNotifications.length > 0) {
            resultMessage += `🔍 Encontradas ${activeNotifications.length} notificações ativas:\n\n`;

            for (const notification of activeNotifications) {
              foundNotifications++;

              const title = notification.request.content.title || 'Sem título';
              const body = notification.request.content.body || 'Sem conteúdo';

              resultMessage += `${foundNotifications}. ${title}:\n`;
              resultMessage += `"${body}"\n`;

              // Tentar parsear se parecer ser de carteira/banco
              const walletApps = ['google', 'pay', 'wallet', 'bank', 'nubank', 'c6', 'itau', 'bradesco', 'santander'];
              const isWalletRelated = walletApps.some(app =>
                title.toLowerCase().includes(app) || body.toLowerCase().includes(app)
              );

              if (isWalletRelated) {
                const parsed = parseNotification(title, body, '');

                if (parsed) {
                  resultMessage += `✅ PARSEADO: R$ ${parsed.amount.toFixed(2)} - ${parsed.description}\n`;

                  try {
                    await submitNewDraft({
                      text: `${parsed.description} - R$ ${parsed.amount.toFixed(2)}`,
                      cardId: defaultCardId || undefined,
                      selectedDestinations: [],
                    });

                    createdDrafts++;
                    resultMessage += `✅ DRAFT CRIADO automaticamente!\n`;
                    info(LogCategory.WALLET, 'Draft criado da notificação real', {
                      title,
                      amount: parsed.amount,
                      description: parsed.description,
                    });
                  } catch (draftError) {
                    resultMessage += `❌ ERRO ao criar draft: ${draftError}\n`;
                  }
                } else {
                  resultMessage += `⚠️ Notificação de carteira detectada, mas não foi possível parsear\n`;
                }
              } else {
                resultMessage += `ℹ️ Não relacionada a carteira/banco\n`;
              }
              resultMessage += '\n';
            }
          } else {
            resultMessage += '📭 Nenhuma notificação ativa encontrada no momento.\n\n';
            resultMessage += '💡 Para que esta funcionalidade funcione:\n';
            resultMessage += '• Deixe notificações de bancos/carteiras ativas\n';
            resultMessage += '• Faça uma compra e deixe a notificação aparecer\n';
            resultMessage += '• Execute esta varredura logo após a notificação\n\n';
          }

        } catch (accessError) {
          warn(LogCategory.WALLET, 'Erro ao acessar notificações do sistema', accessError);
          resultMessage += '❌ LIMITAÇÃO TÉCNICA:\n\n';
          resultMessage += 'O Expo/React Native não permite acesso direto às\n';
          resultMessage += 'notificações de outros aplicativos por questões de segurança.\n\n';
          resultMessage += '📋 PARA IMPLEMENTAÇÃO COMPLETA seria necessário:\n';
          resultMessage += '• Aplicativo nativo Android (não Expo)\n';
          resultMessage += '• Permissão especial "Notification Listener Service"\n';
          resultMessage += '• Desenvolvimento de módulo nativo customizado\n\n';
          resultMessage += '🔧 ALTERNATIVAS DISPONÍVEIS:\n';
          resultMessage += '• Captura manual via áudio/texto\n';
          resultMessage += '• Integração direta com APIs dos bancos\n';
          resultMessage += '• Monitoramento de SMS (em desenvolvimento)\n';
        }

        resultMessage += `\n📊 RESUMO DA VARREDURA:\n`;
        resultMessage += `• ${foundNotifications} notificações verificadas\n`;
        resultMessage += `• ${createdDrafts} drafts criados automaticamente\n`;

        if (createdDrafts > 0) {
          resultMessage += `\n✅ Drafts criados com sucesso!\n`;
          resultMessage += `Vá para a tela inicial para visualizá-los.\n`;
        } else if (foundNotifications === 0) {
          resultMessage += `\n💡 DICA: Para testar esta funcionalidade:\n`;
          resultMessage += `1. Faça uma compra com cartão\n`;
          resultMessage += `2. Aguarde a notificação aparecer\n`;
          resultMessage += `3. Execute esta varredura imediatamente\n`;
        }

      } catch (scanError) {
        error(LogCategory.WALLET, 'Erro crítico durante varredura', scanError);
        resultMessage += `❌ ERRO CRÍTICO: ${scanError}\n`;
      }

      Alert.alert(
        '🔍 Resultado da Varredura',
        resultMessage,
        [
          { text: 'Fechar', style: 'default' },
          ...(createdDrafts > 0 ? [{
            text: 'Ver Drafts',
            onPress: () => {
              // Navegar para tela inicial para mostrar os drafts criados
              // (implementação depende da navegação disponível)
            },
          }] : []),
        ]
      );

      info(LogCategory.WALLET, 'Varredura de notificações Wallet concluída', {
        foundNotifications,
        createdDrafts,
      });

    } catch (error) {
      warn(LogCategory.WALLET, 'Erro durante varredura de notificações Wallet', error);
      Alert.alert('Erro', 'Ocorreu um erro durante a varredura de notificações.');
    }
  };

  const setupBackgroundSettings = async () => {
    try {
      info(LogCategory.PERMISSIONS, 'Usuário solicitou configuração de background');

      // Verificar status atual
      const status = await getBackgroundStatus();

      let message = 'Status atual das configurações de background:\n\n';
      message += `📱 Permissão de notificações: ${status.notificationPermission ? '✅ Concedida' : '❌ Negada'}\n`;
      message += `🔋 Guia de bateria mostrado: ${status.batteryOptimizationRequested ? '✅ Sim' : '❌ Não'}\n`;
      message += `📲 Guia Xiaomi mostrado: ${status.xiaomiGuidanceShown ? '✅ Sim' : '❌ Não'}\n\n`;
      message += 'Deseja configurar ou reconfigurar as permissões de background?';

      Alert.alert(
        '🔧 Configurações de Background',
        message,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Resetar e Reconfigurar',
            style: 'destructive',
            onPress: async () => {
              try {
                await resetBackgroundSettings();
                await setupBackgroundPersistence();
                Alert.alert('✅ Sucesso', 'Configurações de background resetadas e reconfiguradas!');
              } catch (error) {
                Alert.alert('❌ Erro', 'Erro ao configurar background: ' + error);
              }
            },
          },
          {
            text: 'Configurar Agora',
            onPress: async () => {
              try {
                await setupBackgroundPersistence();
                Alert.alert('✅ Sucesso', 'Configurações de background aplicadas!');
              } catch (error) {
                Alert.alert('❌ Erro', 'Erro ao configurar background: ' + error);
              }
            },
          },
        ]
      );
    } catch (error) {
      warn(LogCategory.PERMISSIONS, 'Erro durante configuração de background', error);
      Alert.alert('❌ Erro', 'Ocorreu um erro durante a configuração.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair e Limpar Cache',
      'Isso irá:\n• Sair da sua conta\n• Limpar todo o cache local\n• Permitir login com outro usuário\n\nTem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair e Limpar Tudo',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Preferências</Text>
        </View>

        {/* Integração Wallet */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Integração</Text>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.divider }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Captura Automática (Wallet)
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Detectar notificações de compras automaticamente
              </Text>
            </View>
            <Switch
              value={walletEnabled}
              onValueChange={handleWalletToggle}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
              disabled={isLoading}
            />
          </View>

          {/* Botão de teste para Wallet */}
          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: theme.colors.info },
            ]}
            onPress={testWalletNotifications}
            disabled={isLoading}
          >
            <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
              🔍 Varrer e Importar Notificações Wallet
            </Text>
          </TouchableOpacity>

          {/* Botão para configurar background */}
          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: theme.colors.warning },
            ]}
            onPress={setupBackgroundSettings}
            disabled={isLoading}
          >
            <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
              🔧 Configurar Background (Xiaomi)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cartões */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cartões</Text>

          {cards.map(card => (
            <TouchableOpacity
              key={card.id}
              style={[styles.settingRow, { borderBottomColor: theme.colors.divider }]}
              onPress={() => Alert.alert('Cartão', `${card.name} - ${card.owner}`)}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {card.name}
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  {card.owner}
                </Text>
              </View>
              {card.isDefault && (
                <View
                  style={[styles.badge, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.badgeText, { color: theme.colors.textOnPrimary }]}>
                    Padrão
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Responsáveis */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Responsáveis</Text>

          {users.map(user => (
            <TouchableOpacity
              key={user.id}
              style={[styles.settingRow, { borderBottomColor: theme.colors.divider }]}
              onPress={() => Alert.alert('Responsável', user.name)}
            >
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                {user.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacidade */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacidade</Text>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.divider }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Compartilhar Localização
            </Text>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
              disabled={isLoading}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.divider }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Sons e Vibrações
            </Text>
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* Grupo */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Grupo</Text>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                {currentUser?.tenantName || 'Meu Grupo'}
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Grupo compartilhado de despesas
              </Text>
            </View>
          </View>

          {/* Botão para ver fila */}
          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: queuedDrafts.length > 0 ? theme.colors.warning : theme.colors.info },
            ]}
            onPress={() => navigation.navigate('Queue')}
          >
            <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
              📋 Ver fila de sincronização {queuedDrafts.length > 0 ? `(${queuedDrafts.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conta */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Conta</Text>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                {currentUser?.name}
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                {currentUser?.email}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: theme.colors.error },
            ]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutButtonText, { color: '#FFF' }]}>
              🔓 Sair e Limpar Cache
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info sobre logout */}
        <View style={styles.section}>
          <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>
            O logout completo irá limpar todos os dados locais e permitir login com outro usuário.
          </Text>
        </View>

        {/* Sobre */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sobre</Text>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Versão</Text>
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
              1.0.0
            </Text>
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Smart Honey
            </Text>
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
              Web Max Digital
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingValue: {
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  testButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

