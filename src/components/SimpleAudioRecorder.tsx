import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { useTheme } from '@/theme';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import * as Haptics from 'expo-haptics';

interface SimpleAudioRecorderProps {
  onRecordingComplete: (audioUri: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  hasDefaultCard?: boolean; // Indica se tem cartão padrão configurado
}

export const SimpleAudioRecorder: React.FC<SimpleAudioRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  disabled = false,
  hasDefaultCard = true,
}) => {
  const theme = useTheme();
  const {
    isRecording,
    isPaused,
    recordingDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    hasPermission,
    requestPermission,
  } = useAudioRecorder();

  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animação de pulso quando gravando
  useEffect(() => {
    if (isRecording && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording, isPaused]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      pulseAnim.stopAnimation();
      if (isRecording) {
        cancelRecording().catch(console.error);
      }
    };
  }, []);

  const handleStartRecording = async () => {
    if (isProcessing || isRecording) return;

    // VALIDAÇÃO: Cartão padrão é obrigatório para áudio
    if (!hasDefaultCard) {
      Alert.alert(
        'Cartão Padrão Necessário',
        'Selecione um cartão padrão acima antes de gravar áudio.\n\nA gravação será enviada usando este cartão.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setIsProcessing(false);
          return;
        }
      }

      await startRecording();
      console.log('✅ Gravação iniciada');
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDiscard = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await cancelRecording();
      onCancel?.();
      console.log('✅ Gravação descartada');
    } catch (error) {
      console.error('❌ Erro ao descartar:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePauseToggle = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (isPaused) {
        await resumeRecording();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        await pauseRecording();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('❌ Erro ao pausar/retomar:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const uri = await stopRecording();

      if (uri) {
        onRecordingComplete(uri);
        console.log('✅ Gravação enviada');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Timer (quando gravando) */}
      {isRecording && (
        <View style={styles.timerContainer}>
          <View style={[styles.recordingDot, { backgroundColor: theme.colors.recording }]} />
          <Text style={[styles.timerText, { color: theme.colors.text }]}>
            {formatDuration(recordingDuration)}
          </Text>
          {isPaused && (
            <Text style={[styles.pausedLabel, { color: theme.colors.textSecondary }]}>
              (Pausado)
            </Text>
          )}
        </View>
      )}

      {/* Botão Principal */}
      <Pressable
        style={[
          styles.micButton,
          {
            backgroundColor: isRecording ? theme.colors.recording : theme.colors.primary,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={handleStartRecording}
        disabled={disabled || isRecording}
      >
        <Animated.View
          style={{
            transform: [{ scale: isRecording && !isPaused ? pulseAnim : 1 }],
          }}
        >
          <Text style={styles.micIcon}>
            {isRecording ? '⏹' : '🎙️'}
          </Text>
        </Animated.View>
      </Pressable>

      {/* Label */}
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {isRecording ? 'Gravando...' : 'Toque para gravar'}
      </Text>

      {/* Controles (aparecem quando gravando) */}
      {isRecording && (
        <View style={styles.controlsContainer}>
          {/* Descartar */}
          <Pressable
            onPress={handleDiscard}
            style={[styles.controlButton, { backgroundColor: theme.colors.error }]}
            disabled={isProcessing}
          >
            <Text style={styles.controlIcon}>🗑️</Text>
            <Text style={[styles.controlLabel, { color: '#FFF' }]}>Descartar</Text>
          </Pressable>

          {/* Pausar/Retomar */}
          <Pressable
            onPress={handlePauseToggle}
            style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
            disabled={isProcessing}
          >
            <Text style={styles.controlIcon}>{isPaused ? '▶️' : '⏸'}</Text>
            <Text style={[styles.controlLabel, { color: '#FFF' }]}>
              {isPaused ? 'Retomar' : 'Pausar'}
            </Text>
          </Pressable>

          {/* Enviar */}
          <Pressable
            onPress={handleSend}
            style={[styles.controlButton, { backgroundColor: theme.colors.success }]}
            disabled={isProcessing}
          >
            <Text style={styles.controlIcon}>📤</Text>
            <Text style={[styles.controlLabel, { color: '#FFF' }]}>Enviar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  pausedLabel: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 12,
  },
  micIcon: {
    fontSize: 36,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlIcon: {
    fontSize: 22,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

