import React, { useState, useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { isAuthenticated } from '@/services/auth';
import { setOnTokenExpired } from '@/services/api';

// Screens
import { LoginScreen } from '@/screens/LoginScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { QueueScreen } from '@/screens/QueueScreen';
import { PreferencesScreen } from '@/screens/PreferencesScreen';
import { EditDraftScreen } from '@/screens/EditDraftScreen';

// Types
import { MainTabParamList, RootStackParamList } from '@/types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Ícones simples com emoji
const getTabIcon = (routeName: string, focused: boolean) => {
  const icons = {
    Home: focused ? '🏠' : '🏡',
    History: focused ? '📊' : '📈',
    Queue: focused ? '⏳' : '⏱️',
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
        name="Queue"
        component={QueueScreen}
        options={{
          tabBarLabel: 'Fila',
          headerShown: false,
          // Badge será implementado quando integrarmos contador
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

  // Verificar autenticação no mount e periodicamente
  useEffect(() => {
    checkAuth();

    // Verificar auth a cada 2 segundos (detectar login/logout)
    const interval = setInterval(checkAuth, 2000);

    return () => clearInterval(interval);
  }, []);

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
      }

      setIsAuth(authenticated);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuth(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Loading screen enquanto verifica autenticação
  if (isChecking) {
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

  return (
    <NavigationContainer onReady={() => setNavigationReady(true)}>
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
          // Usuário autenticado - mostrar app
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
          </>
        ) : (
          // Usuário não autenticado - mostrar login
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

