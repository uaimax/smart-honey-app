import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useTheme } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Draft, RootStackParamList } from '@/types';
import { ensureValidDate } from '@/utils/dateUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DraftItemProps {
  draft: Draft;
  onRetry?: () => void;
  onDelete?: () => void;
}

export const DraftItem: React.FC<DraftItemProps> = ({
  draft,
  onRetry,
  onDelete,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [heightAnim] = useState(new Animated.Value(0));

  const getStatusIcon = () => {
    switch (draft.status) {
      case 'sending':
        return '⏳';
      case 'sent':
        return '✅';
      case 'error':
        return '⚠️';
      default:
        return '📝';
    }
  };

  const getStatusColor = () => {
    switch (draft.status) {
      case 'sending':
        return theme.colors.sending;
      case 'sent':
        return theme.colors.sent;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (draft.status) {
      case 'sending':
        return 'Enviando...';
      case 'sent':
        return 'Lançado';
      case 'error':
        return 'Falha';
      default:
        return '';
    }
  };

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;

    Animated.spring(heightAnim, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();

    setIsExpanded(!isExpanded);
  };

  const formatDate = (date: Date) => {
    // Garantir que a data é válida (usa hoje se for inválida)
    const d = ensureValidDate(date);

    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const expandedHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120], // Reduzido - apenas status e botoes
  });

  const handleEdit = () => {
    navigation.navigate('EditDraft', {
      draftId: draft.id,
      description: draft.description,
      amount: draft.amount,
      cardId: draft.cardId,
      selectedDestinations: draft.selectedDestinations || [],
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Lançamento',
      'Tem certeza que deseja excluir este lançamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete();
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
      onPress={toggleExpand}
      activeOpacity={0.7}
    >
      {/* Cabeçalho compacto */}
      <View style={styles.header}>
        <View style={styles.mainInfo}>
          <Text style={[styles.icon, { color: getStatusColor() }]}>
            {getStatusIcon()}
          </Text>

          <View style={styles.textInfo}>
            <Text
              style={[styles.description, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {draft.description}
            </Text>
            <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
              {formatDate(draft.timestamp)}
            </Text>
          </View>
        </View>

        <View style={styles.rightInfo}>
          <Text style={[styles.amount, { color: theme.colors.text }]}>
            R$ {draft.amount.toFixed(2)}
          </Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Detalhes expandidos */}
      {isExpanded && (
        <Animated.View style={[styles.details, { maxHeight: expandedHeight }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Status:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {getStatusText()}
            </Text>
          </View>

          {draft.errorMessage && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Erro:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.error }]}>
                {draft.errorMessage}
              </Text>
            </View>
          )}

          {/* Ações */}
          <View style={styles.actions}>
            {/* Retry apenas para erros */}
            {draft.status === 'error' && onRetry && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={onRetry}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF' }]}>
                  Tentar Novamente
                </Text>
              </TouchableOpacity>
            )}

            {/* Editar (para drafts enviados) */}
            {draft.status === 'sent' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleEdit}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF' }]}>Editar</Text>
              </TouchableOpacity>
            )}

            {/* Excluir */}
            {onDelete && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.error, marginLeft: 8 },
                ]}
                onPress={handleDelete}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF' }]}>Excluir</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  rightInfo: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

