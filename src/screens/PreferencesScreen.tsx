import React, { useState } from 'react';
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

export const PreferencesScreen: React.FC = () => {
  const theme = useTheme();
  const { cards, users, currentUser, logout } = useApp();

  // Estados temporários para preferências (futuramente AsyncStorage)
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

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
              onValueChange={setWalletEnabled}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
            />
          </View>
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
              onValueChange={setLocationEnabled}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.divider }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Sons e Vibrações
            </Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
            />
          </View>
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
});

