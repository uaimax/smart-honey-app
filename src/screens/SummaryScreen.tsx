import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { useTheme } from '@/theme';
import { useApp } from '@/context/AppContext';
import type { SummaryByDestination, SummaryByCategory } from '@/types';
import { getSummaryByDestination, getSummaryByCategory } from '@/services/api';

export const SummaryScreen: React.FC = () => {
  const theme = useTheme();
  const { summaryData, loadSummary, selectedMonth, setSelectedMonth, isLoading } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<SummaryByCategory[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const isLoadingSummaryRef = useRef(false);
  const isLoadingCategoryRef = useRef(false);
  const lastFocusTimeRef = useRef<number>(0);

  const loadCategoryData = useCallback(async (month: string) => {
    if (isLoadingCategoryRef.current) return;

    setCategoryError(null);
    isLoadingCategoryRef.current = true;
    try {
      const result = await getSummaryByCategory(month);
      if (result.error) {
        setCategoryError(result.error);
      } else {
        setCategoryData(result.data);
      }
    } catch (err) {
      setCategoryError('Erro ao carregar categorias');
    } finally {
      isLoadingCategoryRef.current = false;
    }
  }, []);

  const loadSummaryWithError = useCallback(async (month: string) => {
    if (isLoadingSummaryRef.current) return;

    setSummaryError(null);
    isLoadingSummaryRef.current = true;
    try {
      const result = await getSummaryByDestination(month);
      if (result.error) {
        setSummaryError(result.error);
      }
      // loadSummary já atualiza o contexto
      await loadSummary(month);
    } catch (err) {
      setSummaryError('Erro ao carregar resumo');
    } finally {
      isLoadingSummaryRef.current = false;
    }
  }, [loadSummary]);

  // Recarregar dados quando a tela ganha foco (após editar/deletar ou voltar para a aba)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Evitar refresh muito frequente (mínimo 1 segundo entre refreshes)
      if (now - lastFocusTimeRef.current < 1000) {
        return;
      }
      lastFocusTimeRef.current = now;
      // Recarregar dados quando volta para a tela
      loadSummaryWithError(selectedMonth);
      loadCategoryData(selectedMonth);
    }, [selectedMonth, loadSummaryWithError, loadCategoryData])
  );

  useEffect(() => {
    loadSummaryWithError(selectedMonth);
    loadCategoryData(selectedMonth);
  }, [selectedMonth, loadSummaryWithError, loadCategoryData]);

  const onRefresh = async () => {
    setRefreshing(true);
    setSummaryError(null);
    setCategoryError(null);
    await Promise.all([
      loadSummaryWithError(selectedMonth),
      loadCategoryData(selectedMonth),
    ]);
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

  const renderEmptyState = () => {
    if (summaryError) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Erro ao carregar resumo
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
            {summaryError === 'Endpoint não disponível'
              ? 'O endpoint de resumo não está disponível no backend. Entre em contato com o suporte.'
              : summaryError === 'Não autenticado'
              ? 'Você precisa estar autenticado para ver o resumo.'
              : summaryError === 'Erro ao carregar resumo'
              ? 'Erro de conexão. Verifique sua internet e tente novamente.'
              : summaryError || 'Não foi possível carregar o resumo. Tente novamente mais tarde.'}
          </Text>
        </View>
      );
    }

    return (
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
  };

  const calculateTotal = (): number => {
    return summaryData.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateCategoryTotal = (): number => {
    return categoryData.reduce((sum, item) => sum + item.total, 0);
  };

  // Cores para o gráfico pizza
  const pieColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#AED6F1',
  ];

  const renderPieChart = () => {
    // Mostrar erro se houver
    if (categoryError) {
      return (
        <View style={styles.pieChartContainer}>
          <Text style={[styles.pieChartTitle, { color: theme.colors.text }]}>
            Por Categoria
          </Text>
          <View style={styles.pieChartError}>
            <Text style={[styles.pieChartErrorText, { color: theme.colors.textTertiary }]}>
              {categoryError}
            </Text>
          </View>
        </View>
      );
    }

    // Mostrar mensagem se não houver dados
    if (categoryData.length === 0 || calculateCategoryTotal() === 0) {
      return (
        <View style={styles.pieChartContainer}>
          <Text style={[styles.pieChartTitle, { color: theme.colors.text }]}>
            Por Categoria
          </Text>
          <View style={styles.pieChartEmpty}>
            <Text style={[styles.pieChartEmptyText, { color: theme.colors.textTertiary }]}>
              Nenhum lançamento por categoria neste mês
            </Text>
          </View>
        </View>
      );
    }

    const size = 200;
    const center = size / 2;
    const radius = size / 2 - 20;
    let currentAngle = -90; // Começar do topo

    const total = calculateCategoryTotal();
    const segments: JSX.Element[] = [];
    const legendItems: JSX.Element[] = [];

    categoryData.forEach((item, index) => {
      const percentage = (item.total / total) * 100;
      const angle = (item.total / total) * 360;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Converter ângulos para radianos
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      // Calcular pontos do arco
      const x1 = center + radius * Math.cos(startAngleRad);
      const y1 = center + radius * Math.sin(startAngleRad);
      const x2 = center + radius * Math.cos(endAngleRad);
      const y2 = center + radius * Math.sin(endAngleRad);

      // Determinar se o arco é grande (>180 graus)
      const largeArcFlag = angle > 180 ? 1 : 0;

      // Criar path do segmento
      const pathData = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');

      const color = pieColors[index % pieColors.length];

      segments.push(
        <Path
          key={`segment-${index}`}
          d={pathData}
          fill={color}
          stroke={theme.colors.background}
          strokeWidth={2}
        />
      );

      // Adicionar item da legenda
      legendItems.push(
        <View key={`legend-${index}`} style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: color }]} />
          <Text style={[styles.legendText, { color: theme.colors.text }]} numberOfLines={1}>
            {item.category}
          </Text>
          <Text style={[styles.legendValue, { color: theme.colors.textSecondary }]}>
            {formatCurrency(item.total)} ({percentage.toFixed(1)}%)
          </Text>
        </View>
      );

      currentAngle = endAngle;
    });

    return (
      <View style={styles.pieChartContainer}>
        <Text style={[styles.pieChartTitle, { color: theme.colors.text }]}>
          Por Categoria
        </Text>
        <View style={styles.pieChartContent}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G>{segments}</G>
          </Svg>
          <View style={styles.legendContainer}>
            {legendItems}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={true}
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

          {/* Pie Chart */}
          {renderPieChart()}

          {/* List */}
          <View style={styles.listContainer}>
            {summaryData.length === 0 ? (
              renderEmptyState()
            ) : (
              summaryData.map((item) => (
                <View key={item.destinationId} style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
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
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
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
  listContainer: {
    padding: 16,
    paddingTop: 0,
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
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
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
  pieChartContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  pieChartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  pieChartContent: {
    alignItems: 'center',
  },
  pieChartError: {
    padding: 20,
    alignItems: 'center',
  },
  pieChartErrorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  pieChartEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  pieChartEmptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  legendContainer: {
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '400',
  },
});

