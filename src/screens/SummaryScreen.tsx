import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useApp } from '@/context/AppContext';
import type { SummaryByDestination } from '@/types';

export const SummaryScreen: React.FC = () => {
  const theme = useTheme();
  const { summaryData, loadSummary, selectedMonth, setSelectedMonth, isLoading } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSummary(selectedMonth);
  }, [selectedMonth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSummary(selectedMonth);
    setRefreshing(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getPreviousMonth = (current: string): string => {
    const [year, month] = current.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getNextMonth = (current: string): string => {
    const [year, month] = current.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const isCurrentMonth = (): boolean => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return selectedMonth === currentMonth;
  };

  const renderItem = ({ item }: { item: SummaryByDestination }) => (
    <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.summaryCardContent}>
        <View style={styles.personInfo}>
          <Text style={[styles.personIcon, { color: theme.colors.primary }]}>
            👤
          </Text>
          <Text style={[styles.personName, { color: theme.colors.text }]}>
            {item.destinationName}
          </Text>
        </View>
        <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
          {formatCurrency(item.total)}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Nenhum lançamento
      </Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
        Não há lançamentos registrados para {formatMonth(selectedMonth)}
      </Text>
    </View>
  );

  const calculateTotal = (): number => {
    return summaryData.reduce((sum, item) => sum + item.total, 0);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Resumo por Pessoa
        </Text>
      </View>

      {/* Month Selector */}
      <View style={[styles.monthSelector, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          style={styles.monthButton}
          onPress={() => setSelectedMonth(getPreviousMonth(selectedMonth))}
        >
          <Text style={[styles.monthButtonText, { color: theme.colors.primary }]}>
            ←
          </Text>
        </Pressable>

        <Text style={[styles.monthText, { color: theme.colors.text }]}>
          {formatMonth(selectedMonth)}
        </Text>

        <Pressable
          style={styles.monthButton}
          onPress={() => setSelectedMonth(getNextMonth(selectedMonth))}
          disabled={isCurrentMonth()}
        >
          <Text
            style={[
              styles.monthButtonText,
              {
                color: isCurrentMonth()
                  ? theme.colors.textTertiary
                  : theme.colors.primary,
              },
            ]}
          >
            →
          </Text>
        </Pressable>
      </View>

      {/* Total Summary */}
      {summaryData.length > 0 && (
        <View style={[styles.totalCard, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
            Total do mês
          </Text>
          <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
            {formatCurrency(calculateTotal())}
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={summaryData}
          renderItem={renderItem}
          keyExtractor={(item) => item.destinationId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  monthButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  totalCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

