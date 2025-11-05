import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme } from '@/theme';
import { Card } from '@/types';

interface CardSelectorProps {
  cards: Card[];
  selectedCardId: string | null;
  onSelect: (cardId: string) => void;
  showDefault?: boolean;
}

export const CardSelector: React.FC<CardSelectorProps> = ({
  cards,
  selectedCardId,
  onSelect,
  showDefault = false,
}) => {
  const theme = useTheme();

  if (cards.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        Cartão Padrão (usado quando não identificado)
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cards.map((card) => {
          const isSelected = card.id === selectedCardId;

          return (
            <Pressable
              key={card.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => onSelect(card.id)}
            >
              {/* Indicador de padrão */}
              {isSelected && (
                <View style={styles.starContainer}>
                  <Text style={styles.star}>⭐</Text>
                </View>
              )}

              {/* Nome do cartão */}
              <Text
                style={[
                  styles.cardName,
                  {
                    color: isSelected ? theme.colors.primary : theme.colors.text,
                  },
                ]}
                numberOfLines={1}
              >
                {card.name}
              </Text>

              {/* Titular */}
              <Text
                style={[
                  styles.cardOwner,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {card.owner}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
        A IA tenta identificar o cartão no áudio/texto. Se não conseguir, usa este cartão padrão.
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
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 140,
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  starContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  star: {
    fontSize: 16,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardOwner: {
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
});

