import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '@/theme';
import { Destination } from '@/types';

interface DestinationSelectorProps {
  destinations: Destination[];
  selectedDestinationIds: string[];
  onToggle: (destinationId: string) => void;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  destinations,
  selectedDestinationIds,
  onToggle,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        Responsáveis pela Cobrança
      </Text>

      {destinations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
            Carregando responsáveis...
          </Text>
        </View>
      ) : (
        <View style={styles.chipsContainer}>
          {destinations.map((destination) => {
          const isSelected = selectedDestinationIds.includes(destination.id);

          return (
            <Pressable
              key={destination.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={() => onToggle(destination.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#FFF' : theme.colors.text,
                  },
                ]}
              >
                {isSelected && '✓ '}
                {destination.name}
              </Text>
            </Pressable>
          );
        })}
        </View>
      )}

      <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
        {destinations.length > 0
          ? 'Selecione um ou mais responsáveis. Se não selecionar, usará seu nome por padrão.'
          : 'Nenhum responsável cadastrado ainda.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});

