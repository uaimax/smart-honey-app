import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useTheme } from '@/theme';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import * as Haptics from 'expo-haptics';

interface RecordButtonProps {
  onRecordingComplete: (audioUri: string) => void;
  disabled?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  onRecordingComplete,
  disabled = false,
}) => {
  const theme = useTheme();
  const {
    isRecording,
    audioUri,
    recordingDuration,
    startRecording,
    stopRecording,
    hasPermission,
    requestPermission,
  } = useAudioRecorder();

  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = async () => {
    if (disabled) return;

    // Feedback tátil
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animação de pressionar
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    // Iniciar gravação
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          alert('Permissão de microfone necessária para gravar áudio');
          return;
        }
      }

      await startRecording();
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao iniciar gravação de áudio');
    }
  };

  const handlePressOut = async () => {
    if (disabled) return;

    // Feedback tátil
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animação de soltar
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    // Parar gravação
    try {
      const uri = await stopRecording();
      if (uri) {
        onRecordingComplete(uri);
      }
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      alert('Erro ao finalizar gravação');
    }
  };

  // Animação de pulsação durante gravação
  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isRecording]);

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          {
            backgroundColor: isRecording ? theme.colors.recording : theme.colors.primary,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Text style={[styles.icon, { color: theme.colors.textOnPrimary }]}>
            {isRecording ? '⏹' : '🎙️'}
          </Text>
        </Animated.View>
      </Pressable>

      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {isRecording ? 'Gravando...' : 'Segurar para gravar'}
        </Text>
        {isRecording && (
          <Text style={[styles.duration, { color: theme.colors.textSecondary }]}>
            {formatDuration(recordingDuration)}
          </Text>
        )}
      </View>
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
    paddingVertical: 16,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  icon: {
    fontSize: 36,
  },
  textContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  duration: {
    fontSize: 14,
    marginTop: 4,
  },
});

