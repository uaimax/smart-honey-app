import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types';
import { useTheme } from '@/theme';
import { useApp } from '@/context/AppContext';
import { useDrafts } from '@/hooks/useDrafts';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { SmartInput } from '@/components/SmartInput';
import { SimpleAudioRecorder } from '@/components/SimpleAudioRecorder';
import { DraftItem } from '@/components/DraftItem';
import { CardSelector } from '@/components/CardSelector';
import { DestinationSelector } from '@/components/DestinationSelector';
import { ParsedInput } from '@/utils/parsers';
import { saveDefaultCard } from '@/services/preferences';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {
    currentUser,
    submitNewDraft,
    updateDraft,
    deleteDraft,
    isLoading,
    refreshData,
    users,
    destinations,
    cards,
    defaultCardId,
    setDefaultCardId,
  } = useApp();
  const { filteredDrafts, getTotalByUser, refresh } = useDrafts();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'loading'>('loading');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);

  // Mostrar feedback inline
  const showFeedback = (message: string, type: 'success' | 'error' | 'loading') => {
    setFeedbackMessage(message);
    setFeedbackType(type);

    if (type !== 'loading') {
      // Auto-hide após 3 segundos
      setTimeout(() => {
        setFeedbackMessage(null);
      }, 3000);
    }
  };

  // Handler para gravação de áudio
  const handleRecordingComplete = async (audioUri: string) => {
    showFeedback('⏳ Enviando...', 'loading');

    try {
      await submitNewDraft({
        audio: {
          uri: audioUri,
          name: `audio_${Date.now()}.m4a`,
          type: 'audio/m4a',
        },
        selectedDestinations: selectedDestinations.length > 0 ? selectedDestinations : undefined,
      });

      showFeedback('✅ Lançamento criado com sucesso!', 'success');
      // Limpar seleção após envio
      setSelectedDestinations([]);
    } catch (error: any) {
      console.error('Erro ao enviar áudio:', error);
      showFeedback('❌ Erro ao enviar. Adicionado à fila.', 'error');
    }
  };

  // Handler para envio de texto
  const handleTextSubmit = async (text: string, parsed: ParsedInput) => {
    showFeedback('⏳ Enviando...', 'loading');

    try {
      await submitNewDraft({
        text: text,
        cardId: parsed.cardId || undefined,
        userId: parsed.userId || currentUser?.id,
        date: parsed.date, // Usar data parseada (hoje por padrão)
        selectedDestinations: selectedDestinations.length > 0 ? selectedDestinations : undefined,
      });

      showFeedback('✅ Lançamento criado com sucesso!', 'success');
      // Limpar seleção após envio
      setSelectedDestinations([]);
    } catch (error: any) {
      console.error('Erro ao enviar texto:', error);
      showFeedback('❌ Erro ao enviar. Adicionado à fila.', 'error');
    }
  };

  // Handler para toggle de destination
  const handleToggleDestination = (destinationId: string) => {
    setSelectedDestinations(prev => {
      if (prev.includes(destinationId)) {
        return prev.filter(id => id !== destinationId);
      } else {
        return [...prev, destinationId];
      }
    });
  };

  // Mês atual
  const currentMonth = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  // Handler para selecionar cartão padrão
  const handleSelectDefaultCard = async (cardId: string) => {
    try {
      await saveDefaultCard(cardId);
      setDefaultCardId(cardId);
      console.log('✅ Cartão padrão atualizado:', cardId);
    } catch (error) {
      console.error('Erro ao salvar cartão padrão:', error);
    }
  };


  // Handler para deletar draft
  const handleDeleteDraft = async (draftId: string) => {
    showFeedback('⏳ Excluindo...', 'loading');

    try {
      await deleteDraft(draftId);
      showFeedback('✅ Lançamento excluído!', 'success');
    } catch (error: any) {
      console.error('Erro ao deletar draft:', error);
      showFeedback('❌ Erro ao excluir lançamento', 'error');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header com botão de configurações */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              Oi, {currentUser?.name || 'Usuário'} 👋
            </Text>
            <Text style={[styles.month, { color: theme.colors.textSecondary }]}>
              {currentMonth}
            </Text>
          </View>

          <Pressable
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Preferences')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        {/* Seletor de Cartão Padrão */}
        {cards.length > 0 && (
          <CardSelector
            cards={cards}
            selectedCardId={defaultCardId}
            onSelect={handleSelectDefaultCard}
          />
        )}

        {/* Alerta se não tem cartão padrão */}
        {cards.length > 0 && (!defaultCardId || defaultCardId.startsWith('mock-')) && (
          <View style={[styles.warningBanner, { backgroundColor: theme.colors.error + '20' }]}>
            <Text style={[styles.warningText, { color: theme.colors.error }]}>
              ⚠️ Selecione um cartão acima para gravar áudio
            </Text>
          </View>
        )}

        {/* Botão de Gravação */}
        <SimpleAudioRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => console.log('Gravação cancelada')}
          hasDefaultCard={!!defaultCardId && !defaultCardId.startsWith('mock-')}
        />

        {/* Divisor */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
          <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>ou</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
        </View>

        {/* Campo de Texto Inteligente */}
        <SmartInput onSubmit={handleTextSubmit} />

        {/* Seletor de Responsáveis (Destinations) */}
        <DestinationSelector
          destinations={destinations}
          selectedDestinationIds={selectedDestinations}
          onToggle={handleToggleDestination}
        />

        {/* Feedback Inline */}
        {feedbackMessage && (
          <View
            style={[
              styles.feedbackContainer,
              {
                backgroundColor:
                  feedbackType === 'success'
                    ? theme.colors.success
                    : feedbackType === 'error'
                    ? theme.colors.error
                    : theme.colors.sending,
              },
            ]}
          >
            <Text style={[styles.feedbackText, { color: theme.colors.textOnPrimary }]}>
              {feedbackMessage}
            </Text>
          </View>
        )}

        {/* Lista de Lançamentos */}
        <View style={styles.draftsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Lançamentos Recentes
          </Text>

          {filteredDrafts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                Nenhum lançamento ainda.{'\n'}
                Grave ou digite seu primeiro!
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredDrafts}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <DraftItem
                  draft={item}
                  onDelete={() => handleDeleteDraft(item.id)}
                />
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Rodapé com Totais */}
        {users && users.length > 0 && (
        <View style={styles.footer}>
          <Text style={[styles.footerTitle, { color: theme.colors.textSecondary }]}>
            Total do Mês
          </Text>
          <View style={styles.totalsContainer}>
            {users.map(user => {
              const total = getTotalByUser(user.id);
              return (
                <View
                  key={user.id}
                  style={[
                    styles.totalChip,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                >
                  <Text style={[styles.totalName, { color: theme.colors.textSecondary }]}>
                    {user.name}
                  </Text>
                  <Text style={[styles.totalAmount, { color: theme.colors.text }]}>
                    R$ {total.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        )}
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
  scrollContent: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  header: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  month: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 28,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  feedbackContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '600',
  },
  draftsSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  totalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  totalChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  totalName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  warningBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

