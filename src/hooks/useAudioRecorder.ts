import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  audioUri: string | null;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
  clearRecording: () => void;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  // Configuração de gravação
  const recordingOptions: Audio.RecordingOptions = {
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: '.m4a',
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  };

  useEffect(() => {
    checkPermission();

    return () => {
      // Cleanup: parar gravação se componente desmontar
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);

  // Atualizar duração durante gravação (não conta quando pausado)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else if (!isRecording) {
      setRecordingDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, isPaused]);

  /**
   * Verifica permissão de microfone
   */
  const checkPermission = async () => {
    try {
      const permission = await Audio.getPermissionsAsync();
      setHasPermission(permission.granted);
    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', error);
      setHasPermission(false);
    }
  };

  /**
   * Solicita permissão de microfone
   */
  const requestPermission = async (): Promise<boolean> => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      setHasPermission(permission.granted);
      return permission.granted;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      setHasPermission(false);
      return false;
    }
  };

  /**
   * Inicia gravação de áudio
   */
  const startRecording = async () => {
    try {
      // Verificar permissão
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Permissão de microfone negada');
        }
      }

      // Configurar modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('🎙️ Iniciando gravação...');

      // Criar nova gravação
      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );

      setRecording(newRecording);
      setIsRecording(true);
      setAudioUri(null);

      console.log('✅ Gravação iniciada');
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      throw error;
    }
  };

  /**
   * Para gravação e retorna URI do arquivo
   */
  const stopRecording = async (): Promise<string | null> => {
    if (!recording) {
      console.warn('⚠️ Nenhuma gravação ativa');
      return null;
    }

    try {
      console.log('⏹️ Parando gravação...');

      await recording.stopAndUnloadAsync();

      // Restaurar modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();

      if (!uri) {
        throw new Error('URI de gravação não disponível');
      }

      console.log('✅ Gravação finalizada:', uri);

      setAudioUri(uri);
      setIsRecording(false);
      setRecording(null);

      return uri;
    } catch (error) {
      console.error('❌ Erro ao parar gravação:', error);
      setIsRecording(false);
      setRecording(null);
      throw error;
    }
  };

  /**
   * Pausa gravação atual
   */
  const pauseRecording = async (): Promise<void> => {
    if (!recording || !isRecording || isPaused) {
      console.warn('⚠️ Nenhuma gravação ativa para pausar');
      return;
    }

    try {
      console.log('⏸️ Pausando gravação...');
      await recording.pauseAsync();
      setIsPaused(true);
      console.log('✅ Gravação pausada');
    } catch (error) {
      console.error('❌ Erro ao pausar gravação:', error);
      throw error;
    }
  };

  /**
   * Retoma gravação pausada
   */
  const resumeRecording = async (): Promise<void> => {
    if (!recording || !isRecording || !isPaused) {
      console.warn('⚠️ Nenhuma gravação pausada para retomar');
      return;
    }

    try {
      console.log('▶️ Retomando gravação...');
      await recording.startAsync();
      setIsPaused(false);
      console.log('✅ Gravação retomada');
    } catch (error) {
      console.error('❌ Erro ao retomar gravação:', error);
      throw error;
    }
  };

  /**
   * Cancela e descarta gravação atual
   */
  const cancelRecording = async (): Promise<void> => {
    if (!recording) {
      console.warn('⚠️ Nenhuma gravação para cancelar');
      return;
    }

    try {
      console.log('🗑️ Cancelando gravação...');

      await recording.stopAndUnloadAsync();

      // Restaurar modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setRecording(null);
      setIsRecording(false);
      setIsPaused(false);
      setAudioUri(null);
      setRecordingDuration(0);

      console.log('✅ Gravação cancelada');
    } catch (error) {
      console.error('❌ Erro ao cancelar gravação:', error);
      setRecording(null);
      setIsRecording(false);
      setIsPaused(false);
      throw error;
    }
  };

  /**
   * Limpa gravação atual
   */
  const clearRecording = () => {
    setAudioUri(null);
    setRecordingDuration(0);
  };

  return {
    isRecording,
    isPaused,
    audioUri,
    recordingDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    clearRecording,
    hasPermission,
    requestPermission,
  };
};

