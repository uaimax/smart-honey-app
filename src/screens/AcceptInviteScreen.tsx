import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { apiVerifyInviteToken, apiAcceptInvite } from '@/services/api';
import { login } from '@/services/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AcceptInvite'>;

export const AcceptInviteScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const [token, setToken] = useState(route.params?.token || '');
  const [email, setEmail] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(!route.params?.token);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      setIsVerifying(true);
      setError('');
      const response = await apiVerifyInviteToken(tokenToVerify);

      if (response.success && response.data) {
        setTokenValid(true);
        setShowTokenInput(false);
        // Extract email and tenant name from response
        setEmail(response.data.email || '');
        setTenantName(response.data.tenantName || '');
      } else {
        setTokenValid(false);
        setError('Token de convite inválido ou expirado');
        setShowTokenInput(true);
      }
    } catch (err) {
      setTokenValid(false);
      setError('Erro ao verificar token');
      setShowTokenInput(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyToken = () => {
    if (!token.trim()) {
      setError('Por favor, informe o token do convite');
      return;
    }
    verifyToken(token.trim());
  };

  const handleAcceptInvite = async () => {
    // Validação básica
    if (!name.trim()) {
      setError('Por favor, informe seu nome completo');
      return;
    }

    if (!password.trim()) {
      setError('Por favor, informe uma senha');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiAcceptInvite({
        token,
        name: name.trim(),
        password: password.trim(),
      });

      if (response.success && response.data) {
        // Auto login após aceitar convite
        const loginResponse = await login({
          email,
          password: password.trim(),
          rememberMe: true,
        });

        if (loginResponse.success) {
          Alert.alert(
            'Bem-vindo!',
            `Você foi adicionado ao grupo "${tenantName}". Faça login para continuar.`,
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Login'),
              },
            ]
          );
        } else {
          // Se auto login falhar, redirecionar para tela de login
          Alert.alert(
            'Conta Criada',
            'Sua conta foi criada com sucesso. Faça login para continuar.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Login'),
              },
            ]
          );
        }
      } else {
        setError(response.error || 'Erro ao aceitar convite');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Erro ao aceitar convite:', err);
      setError('Erro ao conectar com o servidor');
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Verificando convite...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showTokenInput) {
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
            <View style={styles.header}>
              <Text style={styles.logo}>✉️</Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Aceitar Convite
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Cole o token do convite que você recebeu
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Token do convite
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.tokenInput,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Cole o token aqui"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  editable={!isVerifying}
                />
              </View>

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

              <Pressable
                style={[
                  styles.verifyButton,
                  {
                    backgroundColor: isVerifying
                      ? theme.colors.border
                      : theme.colors.primary,
                  },
                ]}
                onPress={handleVerifyToken}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color={theme.colors.textOnPrimary} />
                ) : (
                  <Text
                    style={[
                      styles.verifyButtonText,
                      { color: theme.colors.textOnPrimary },
                    ]}
                  >
                    Verificar Token
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Pressable onPress={() => navigation.navigate('Login')} disabled={isVerifying}>
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                  ← Voltar para login
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.logo}>👋</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Aceitar Convite
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Você foi convidado para: {tenantName}
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            {/* Email (read-only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.disabled,
                    borderColor: theme.colors.border,
                    color: theme.colors.textSecondary,
                  },
                ]}
                value={email}
                editable={false}
              />
            </View>

            {/* Nome completo */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Nome completo
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
                placeholder="João Silva"
                placeholderTextColor={theme.colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
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

            {/* Confirmar senha */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Confirmar senha
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
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
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

            {/* Botão de Aceitar */}
            <Pressable
              style={[
                styles.acceptButton,
                {
                  backgroundColor: isLoading
                    ? theme.colors.border
                    : theme.colors.primary,
                },
              ]}
              onPress={handleAcceptInvite}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <Text
                  style={[
                    styles.acceptButtonText,
                    { color: theme.colors.textOnPrimary },
                  ]}
                >
                  Aceitar convite e criar conta
                </Text>
              )}
            </Pressable>
          </View>

          {/* Link para Login */}
          <View style={styles.footer}>
            <Pressable onPress={() => navigation.navigate('Login')} disabled={isLoading}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                ← Voltar para login
              </Text>
            </Pressable>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 60,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 16,
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
  tokenInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
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
  verifyButton: {
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
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
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
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

