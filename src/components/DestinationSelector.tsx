import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useTheme } from '@/theme';
import { Destination } from '@/types';
import { info, error, LogCategory } from '@/services/logger';

interface DestinationSelectorProps {
  destinations: Destination[];
  selectedDestinationIds: string[];
  onToggle: (destinationId: string) => void;
  onAddDestination?: (name: string) => Promise<void>;
  isLoading?: boolean;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  destinations,
  selectedDestinationIds,
  onToggle,
  onAddDestination,
  isLoading = false,
}) => {
  const theme = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newDestinationName, setNewDestinationName] = useState('');

  const handleAddDestination = async () => {
    if (!newDestinationName.trim()) {
      Alert.alert('Erro', 'Por favor, digite um nome para o responsável');
      return;
    }

    if (!onAddDestination) {
      Alert.alert('Erro', 'Funcionalidade não disponível');
      return;
    }

    try {
      info(LogCategory.APP, 'Usuário está adicionando novo destination', { name: newDestinationName.trim() });
      await onAddDestination(newDestinationName.trim());
      setNewDestinationName('');
      setIsModalVisible(false);
    } catch (err) {
      error(LogCategory.APP, 'Erro ao adicionar destination', err);
      Alert.alert('Erro', 'Não foi possível adicionar o responsável');
    }
  };

  const handleCancelAdd = () => {
    setNewDestinationName('');
    setIsModalVisible(false);
  };

  const openAddModal = () => {
    setNewDestinationName('');
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        Responsáveis pela Cobrança
      </Text>

      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
            Carregando responsáveis...
          </Text>
        </View>
      ) : destinations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
            Nenhum responsável cadastrado ainda.
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

          {/* Botão para adicionar novo destination */}
          {onAddDestination && (
            <Pressable
              style={[
                styles.addButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={openAddModal}
            >
              <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
                + Adicionar Responsável
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
        {isLoading
          ? 'Aguarde...'
          : destinations.length > 0
          ? '(OPCIONAL) Selecione um ou mais responsáveis. Se não selecionar, usará seu nome por padrão. Edite os responsáveis apenas na versão web.'
          : 'Nenhum responsável cadastrado ainda. Adicione um acima ou use a versão web.'}
      </Text>

      {/* Modal para adicionar destination */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelAdd}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Adicionar Responsável
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                }
              ]}
              placeholder="Nome do responsável"
              placeholderTextColor={theme.colors.textTertiary}
              value={newDestinationName}
              onChangeText={setNewDestinationName}
              autoFocus
              onSubmitEditing={handleAddDestination}
              returnKeyType="done"
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={handleCancelAdd}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddDestination}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textOnPrimary }]}>
                  Adicionar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor será definido dinamicamente
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

