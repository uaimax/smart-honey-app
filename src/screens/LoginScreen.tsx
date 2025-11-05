import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { login } from '@/services/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Validação básica
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await login({
        email: email.trim(),
        password: password.trim(),
        rememberMe,
      });

      if (response.success) {
        console.log('✅ Login bem-sucedido - redirecionando...');
        // Forçar navegação verificando auth novamente
        // O listener de focus do AppNavigator vai detectar
      } else {
        setError(response.error || 'Email ou senha inválidos');
      }
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Título */}
          <View style={styles.header}>
            <Text style={styles.logo}>🍯</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Smart Honey
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Controle de despesas simplificado
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="seu@email.com"
                placeholderTextColor={theme.colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Senha */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Senha
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Lembrar-me */}
            <View style={styles.rememberMeContainer}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor="#FFFFFF"
                disabled={isLoading}
              />
              <Text style={[styles.rememberMeText, { color: theme.colors.text }]}>
                Lembrar-me por 30 dias
              </Text>
            </View>

            {/* Mensagem de erro */}
            {error ? (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.colors.error + '20' },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Botão de Login */}
            <Pressable
              style={[
                styles.loginButton,
                {
                  backgroundColor: isLoading
                    ? theme.colors.border
                    : theme.colors.primary,
                },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <Text
                  style={[
                    styles.loginButtonText,
                    { color: theme.colors.textOnPrimary },
                  ]}
                >
                  Entrar
                </Text>
              )}
            </Pressable>
          </View>

          {/* Informação adicional */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Primeira vez? Entre em contato com o administrador
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeText: {
    fontSize: 14,
    marginLeft: 12,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

