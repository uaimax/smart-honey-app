import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Draft } from '@/types';

interface UseDraftsReturn {
  drafts: Draft[];
  filteredDrafts: Draft[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterByStatus: (status: Draft['status'] | 'all') => void;
  getTotalAmount: () => number;
  getTotalByUser: (userId: string) => number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useDrafts = (): UseDraftsReturn => {
  const { drafts, isLoading, refreshData } = useApp();
  const [filteredDrafts, setFilteredDrafts] = useState<Draft[]>(drafts);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<Draft['status'] | 'all'>('all');

  // Atualizar filtros quando drafts ou filtros mudarem
  useEffect(() => {
    applyFilters();
  }, [drafts, searchQuery, statusFilter]);

  /**
   * Aplica filtros de busca e status
   */
  const applyFilters = () => {
    let filtered = [...drafts];

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(draft => draft.status === statusFilter);
    }

    // Filtrar por busca
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(draft =>
        draft.description.toLowerCase().includes(query) ||
        draft.amount.toString().includes(query)
      );
    }

    setFilteredDrafts(filtered);
  };

  /**
   * Filtra por status
   */
  const filterByStatus = (status: Draft['status'] | 'all') => {
    setStatusFilter(status);
  };

  /**
   * Calcula total de todos os drafts
   */
  const getTotalAmount = (): number => {
    return filteredDrafts
      .filter(draft => draft.status === 'sent')
      .reduce((sum, draft) => sum + draft.amount, 0);
  };

  /**
   * Calcula total por usuário
   */
  const getTotalByUser = (userId: string): number => {
    return filteredDrafts
      .filter(draft => draft.userId === userId && draft.status === 'sent')
      .reduce((sum, draft) => sum + draft.amount, 0);
  };

  /**
   * Recarrega drafts
   */
  const refresh = async () => {
    await refreshData();
  };

  return {
    drafts,
    filteredDrafts,
    searchQuery,
    setSearchQuery,
    filterByStatus,
    getTotalAmount,
    getTotalByUser,
    isLoading,
    refresh,
  };
};

