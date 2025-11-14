import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types';
import { useTheme } from '@/theme';
import { useApp } from '@/context/AppContext';
import { saveOnboardingCompleted } from '@/services/preferences';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OnboardingStep {
  id: number;
  icon: string;
  title: string;
  description: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    icon: '🍯',
    title: 'Bem-vindo ao Smart Honey!',
    description: 'Gerencie suas despesas de forma simples e rápida. Registre gastos por áudio ou texto e organize por responsáveis.',
  },
  {
    id: 2,
    icon: '💳',
    title: 'Cadastre seu cartão',
    description: 'Primeiro, cadastre pelo menos um cartão para começar a registrar seus lançamentos. Você pode ter múltiplos cartões e selecionar um padrão.',
  },
  {
    id: 3,
    icon: '📝',
    title: 'Faça seus lançamentos',
    description: 'Registre despesas de duas formas: falando (áudio) ou digitando (texto). Exemplo: "R$50 almoço no C6 da Bruna" ou "22,50 picolés". A IA processa automaticamente.',
  },
  {
    id: 4,
    icon: '👤',
    title: 'Adicione responsáveis',
    description: 'Organize suas despesas por pessoa. Adicione responsáveis pela cobrança (como "Bruna" ou "Max") para facilitar o controle financeiro e ver resumos por pessoa.',
  },
  {
    id: 5,
    icon: '🎙️',
    title: 'Use áudio ou texto',
    description: 'Áudio é mais rápido: toque e segure o microfone, fale o lançamento e solte. Texto é mais preciso: digite como preferir. Ambos são processados automaticamente pela IA.',
  },
];

export const OnboardingScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { refreshData, isLoading } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      // Salvar onboarding como completado
      await saveOnboardingCompleted(true);
      console.log('✅ Onboarding marcado como completado');
      
      // Aguardar um pouco para garantir que foi salvo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Não navegar manualmente - o AppNavigator detectará a mudança automaticamente
      // e renderizará MainTabs
    } catch (error) {
      console.error('❌ Erro ao salvar onboarding:', error);
      // Mesmo com erro, tentar continuar (pode ser problema temporário de storage)
    }
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Header com botão de refresh */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={isRefreshing}
          style={styles.refreshButton}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={[styles.refreshText, { color: theme.colors.primary }]}>
              🔄 Atualizar
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
            Pular
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <Text style={styles.stepIcon}>{currentStepData.icon}</Text>
          <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
            {currentStepData.title}
          </Text>
          <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
            {currentStepData.description}
          </Text>
        </View>

        {/* Indicadores de progresso */}
        <View style={styles.progressContainer}>
          {onboardingSteps.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    index === currentStep
                      ? theme.colors.primary
                      : index < currentStep
                      ? theme.colors.primary + '80'
                      : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      {/* Botões de navegação */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        {currentStep > 0 && (
          <TouchableOpacity
            onPress={handlePrevious}
            style={[styles.navButton, styles.backButton, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.navButtonText, { color: theme.colors.text }]}>
              Anterior
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleNext}
          style={[
            styles.navButton,
            styles.nextButton,
            {
              backgroundColor: theme.colors.primary,
              flex: currentStep === 0 ? 1 : undefined,
            },
          ]}
        >
          <Text style={[styles.navButtonText, { color: '#fff' }]}>
            {isLastStep ? 'Começar' : 'Próximo'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  navButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  backButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  nextButton: {
    flex: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

