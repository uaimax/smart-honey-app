import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useDrafts } from '@/hooks/useDrafts';
import { DraftItem } from '@/components/DraftItem';

export const HistoryScreen: React.FC = () => {
  const theme = useTheme();
  const { filteredDrafts, searchQuery, setSearchQuery, isLoading, refresh } = useDrafts();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Histórico</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar lançamentos..."
          placeholderTextColor={theme.colors.textTertiary}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={filteredDrafts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <DraftItem draft={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              {searchQuery
                ? 'Nenhum resultado encontrado'
                : 'Nenhum lançamento no histórico'}
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
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
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

