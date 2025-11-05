import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useApp } from '@/context/AppContext';
import { DraftItem } from '@/components/DraftItem';

export const QueueScreen: React.FC = () => {
  const theme = useTheme();
  const { queuedDrafts, retryDraft, removeDraft, refreshData, isLoading } = useApp();

  const handleRetry = async (draftId: string) => {
    try {
      await retryDraft(draftId);
      Alert.alert('Sucesso', 'Tentando reenviar...');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reenviar');
    }
  };

  const handleDelete = async (draftId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este lançamento da fila?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDraft(draftId);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir');
            }
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Fila de Pendências</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {queuedDrafts.length} {queuedDrafts.length === 1 ? 'lançamento' : 'lançamentos'}
        </Text>
      </View>

      {/* Lista */}
      <FlatList
        data={queuedDrafts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <DraftItem
            draft={item}
            onRetry={() => handleRetry(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshData}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: theme.colors.textTertiary }]}>✅</Text>
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              Nenhum lançamento pendente!{'\n'}Tudo sincronizado.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

