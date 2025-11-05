import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useApp } from '@/context/AppContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditDraft'>;

export const EditDraftScreen: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme();
  const { cards, destinations, updateDraft } = useApp();
  const { draftId, description, amount, cardId, selectedDestinations } = route.params;

  const [editDescription, setEditDescription] = useState(description);
  const [editAmount, setEditAmount] = useState(amount.toString());
  const [editCardId, setEditCardId] = useState(cardId);
  const [editDestinations, setEditDestinations] = useState<string[]>(selectedDestinations);
  const [isSaving, setIsSaving] = useState(false);

  // Log dos destinations iniciais para debug
  React.useEffect(() => {
    console.log('📝 Editando draft:', draftId);
    console.log('📋 Destinations já selecionados:', selectedDestinations.length);
    console.log('📋 IDs:', selectedDestinations);
  }, []);

  const handleSave = async () => {
    const amountNum = parseFloat(editAmount);

    if (!editDescription.trim()) {
      Alert.alert('Erro', 'Descrição não pode estar vazia');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }

    setIsSaving(true);

    try {
      await updateDraft(draftId, {
        description: editDescription.trim(),
        amount: amountNum,
        cardId: editCardId,
        selectedDestinations: editDestinations.length > 0 ? editDestinations : undefined,
      });

      Alert.alert('Sucesso', 'Lançamento atualizado!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDestination = (destId: string) => {
    setEditDestinations((prev) => {
      if (prev.includes(destId)) {
        return prev.filter((id) => id !== destId);
      } else {
        return [...prev, destId];
      }
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Descrição */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Descrição</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={editDescription}
            onChangeText={setEditDescription}
            placeholder="Ex: Café da manhã"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        {/* Valor */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Valor</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={editAmount}
            onChangeText={setEditAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        {/* Cartão */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Cartão</Text>
          <View style={styles.cardsContainer}>
            {cards.map((card) => {
              const isSelected = card.id === editCardId;
              return (
                <Pressable
                  key={card.id}
                  style={[
                    styles.cardChip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => setEditCardId(card.id)}
                >
                  <Text
                    style={[
                      styles.cardChipText,
                      { color: isSelected ? '#FFF' : theme.colors.text },
                    ]}
                  >
                    {isSelected && '✓ '}
                    {card.name} - {card.owner}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Responsáveis */}
        {destinations.length > 0 && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Responsáveis pela Cobrança
            </Text>
            <View style={styles.destinationsContainer}>
              {destinations
                .filter((d) => d.active)
                .map((destination) => {
                  const isSelected = editDestinations.includes(destination.id);
                  return (
                    <Pressable
                      key={destination.id}
                      style={[
                        styles.destChip,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surface,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                      onPress={() => toggleDestination(destination.id)}
                    >
                      <Text
                        style={[
                          styles.destChipText,
                          { color: isSelected ? '#FFF' : theme.colors.text },
                        ]}
                      >
                        {isSelected && '✓ '}
                        {destination.name}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
            <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
              Selecione um ou mais responsáveis
            </Text>
          </View>
        )}

        {/* Botões */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, { backgroundColor: theme.colors.border }]}
            onPress={() => navigation.goBack()}
            disabled={isSaving}
          >
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
              Cancelar
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.saveButton,
              {
                backgroundColor: isSaving ? theme.colors.border : theme.colors.primary,
              },
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={[styles.buttonText, { color: '#FFF' }]}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Text>
          </Pressable>
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
  scrollContent: {
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  cardsContainer: {
    gap: 8,
  },
  cardChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  cardChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  destinationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  destChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

