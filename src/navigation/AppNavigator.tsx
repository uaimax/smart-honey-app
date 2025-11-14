import React, { useState, useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { isAuthenticated } from '@/services/auth';
import { setOnTokenExpired } from '@/services/api';
import { getOnboardingCompleted } from '@/services/preferences';

// Screens
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/screens/ResetPasswordScreen';
import { AcceptInviteScreen } from '@/screens/AcceptInviteScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { QueueScreen } from '@/screens/QueueScreen';
import { SummaryScreen } from '@/screens/SummaryScreen';
import { PreferencesScreen } from '@/screens/PreferencesScreen';
import { EditDraftScreen } from '@/screens/EditDraftScreen';
import { FeedbackScreen } from '@/screens/FeedbackScreen';

// Types
import { MainTabParamList, RootStackParamList } from '@/types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Ícones simples com emoji
const getTabIcon = (routeName: string, focused: boolean) => {
  const icons = {
    Home: focused ? '🏠' : '🏡',
    History: focused ? '📊' : '📈',
    Summary: focused ? '💰' : '💵',
    Feedback: focused ? '💬' : '💭',
  };
  return icons[routeName as keyof typeof icons] || '📱';
};

const MainTabs = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const icon = getTabIcon(route.name, focused);
          return <Text style={{ fontSize: 24 }}>{icon}</Text>;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Histórico',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Summary"
        component={SummaryScreen}
        options={{
          tabBarLabel: 'Resumo',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{
          tabBarLabel: 'Feedback',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const theme = useTheme();
  const [isAuth, setIsAuth] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [navigationReady, setNavigationReady] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Verificar autenticação e onboarding no mount
  useEffect(() => {
    checkAuth();
    checkOnboarding();

    // Verificar auth a cada 1 segundo (detectar login/logout mais rapidamente)
    const authInterval = setInterval(checkAuth, 1000);

    // Verificar onboarding apenas quando necessário (não a cada segundo)
    // Verificar novamente quando auth mudar (após login)
    const onboardingCheckInterval = setInterval(() => {
      // Só verificar se ainda não foi completado ou se auth mudou
      if (onboardingCompleted === null || onboardingCompleted === false) {
        checkOnboarding();
      }
    }, 2000); // Verificar a cada 2 segundos apenas se necessário

    return () => {
      clearInterval(authInterval);
      clearInterval(onboardingCheckInterval);
    };
  }, [onboardingCompleted]);

  const checkOnboarding = async () => {
    try {
      const completed = await getOnboardingCompleted();
      // Só atualizar se o valor mudou para evitar re-renders desnecessários
      setOnboardingCompleted(prev => prev !== completed ? completed : prev);
    } catch (error) {
      console.error('Erro ao verificar onboarding:', error);
      // Em caso de erro, assumir que não foi completado (mais seguro)
      setOnboardingCompleted(false);
    }
  };

  // Configurar callback de token expirado
  useEffect(() => {
    if (navigationReady) {
      setOnTokenExpired(() => {
        console.log('🔓 Token expirado - redirecionando para login');
        setIsAuth(false);
      });
    }
  }, [navigationReady]);

  const checkAuth = async () => {
    try {
      const authenticated = await isAuthenticated();

      // Só logar quando mudar de estado
      if (authenticated !== isAuth && !isChecking) {
        console.log('🔐 Status de autenticação mudou:', authenticated);

        // Se acabou de autenticar, verificar onboarding novamente
        if (authenticated) {
          checkOnboarding();
        }

        // Se acabou de autenticar, os dados serão recarregados pelo AppContext
        // O AppContext já tem lógica de recarregamento após login
      }

      setIsAuth(authenticated);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuth(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Loading screen enquanto verifica autenticação e onboarding
  if (isChecking || onboardingCompleted === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ fontSize: 80, marginBottom: 20 }}>🍯</Text>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const linking = {
    prefixes: ['smarthoney://', 'https://smart.app.webmaxdigital.com'],
    config: {
      screens: {
        AcceptInvite: 'accept-invite/:token',
        ResetPassword: 'reset-password/:token',
        Login: 'login',
        Register: 'register',
        ForgotPassword: 'forgot-password',
        MainTabs: {
          screens: {
            Home: 'home',
            History: 'history',
            Summary: 'summary',
            Feedback: 'feedback',
          },
        },
      },
    },
  };

  return (
    <NavigationContainer linking={linking} onReady={() => setNavigationReady(true)}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
        }}
      >
        {isAuth ? (
          // Usuário autenticado - verificar onboarding
          onboardingCompleted ? (
            <>
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="EditDraft"
                component={EditDraftScreen}
                options={{
                  title: 'Editar Lançamento',
                  headerBackTitle: 'Voltar',
                }}
              />
              <Stack.Screen
                name="Preferences"
                component={PreferencesScreen}
                options={{
                  presentation: 'modal',
                  title: 'Preferências',
                }}
              />
              <Stack.Screen
                name="Queue"
                component={QueueScreen}
                options={{
                  title: 'Fila de Sincronização',
                  headerBackTitle: 'Voltar',
                }}
              />
            </>
          ) : (
            // Onboarding não completado - mostrar tela de onboarding
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
          )
        ) : (
          // Usuário não autenticado - mostrar login e telas públicas
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AcceptInvite"
              component={AcceptInviteScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

