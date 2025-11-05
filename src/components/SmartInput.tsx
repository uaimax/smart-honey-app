import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTheme } from '@/theme';
import { parseSmartInput, ParsedInput } from '@/utils/parsers';
import { useApp } from '@/context/AppContext';

interface SmartInputProps {
  onSubmit: (text: string, parsed: ParsedInput) => void;
  placeholder?: string;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  onSubmit,
  placeholder = 'Digite ou grave seu lançamento... (ex.: R$22,50 picolés no C6 da Bruna)',
}) => {
  const theme = useTheme();
  const { cards, users } = useApp();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedInput | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Parse text em tempo real
  useEffect(() => {
    if (text.trim() !== '') {
      const result = parseSmartInput(text, cards, users);
      setParsed(result);
      setShowSuggestions(true);
    } else {
      setParsed(null);
      setShowSuggestions(false);
    }
  }, [text, cards, users]);

  const handleSubmit = () => {
    if (text.trim() === '' || !parsed) {
      return;
    }

    onSubmit(text, parsed);
    setText(''); // Limpa campo após envio
    setParsed(null);
    setShowSuggestions(false);
  };

  const canSubmit = parsed && (parsed.amount || text.trim() !== '');

  return (
    <View style={styles.container}>
      {/* Campo de entrada */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: theme.colors.text, fontSize: theme.typography.fontSize.md },
          ]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          maxLength={200}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>

      {/* Sugestões inline */}
      {showSuggestions && parsed && (
        <View
          style={[
            styles.suggestionsContainer,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          {/* Valor detectado */}
          {parsed.amount && (
            <View style={styles.suggestionRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Valor:</Text>
              <Text style={[styles.value, { color: theme.colors.success }]}>
                R$ {parsed.amount.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Cartão detectado */}
          {parsed.cardId && (
            <View style={styles.suggestionRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Cartão:</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {cards.find(c => c.id === parsed.cardId)?.name} -{' '}
                {cards.find(c => c.id === parsed.cardId)?.owner}
              </Text>
            </View>
          )}

          {/* Responsável detectado */}
          {parsed.userId && (
            <View style={styles.suggestionRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Responsável:
              </Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {users.find(u => u.id === parsed.userId)?.name}
              </Text>
            </View>
          )}

          {/* Descrição */}
          {parsed.description && (
            <View style={styles.suggestionRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Descrição:
              </Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {parsed.description}
              </Text>
            </View>
          )}

          {/* Indicador de confiança */}
          <View style={styles.confidenceRow}>
            <View
              style={[
                styles.confidenceBadge,
                {
                  backgroundColor:
                    parsed.confidence === 'high'
                      ? theme.colors.success
                      : parsed.confidence === 'medium'
                      ? theme.colors.warning
                      : theme.colors.error,
                },
              ]}
            >
              <Text style={[styles.confidenceText, { color: theme.colors.textOnPrimary }]}>
                {parsed.confidence === 'high'
                  ? 'Tudo detectado ✓'
                  : parsed.confidence === 'medium'
                  ? 'Faltam dados'
                  : 'Dados incompletos'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Botão de envio */}
      {text.trim() !== '' && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: canSubmit ? theme.colors.primary : theme.colors.disabled,
            },
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={[styles.submitButtonText, { color: theme.colors.textOnPrimary }]}>
            Salvar Lançamento
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 80,
  },
  input: {
    minHeight: 48,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
    minWidth: 90,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  confidenceRow: {
    marginTop: 4,
    alignItems: 'flex-start',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

