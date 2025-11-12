import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { info, warn, error, debug, LogCategory } from './logger';

const LOCATION_PERMISSION_KEY = '@smart_honey:location_permission';
const LAST_LOCATION_KEY = '@smart_honey:last_location';
const LOCATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface LocationCoordinates {
  latitude: number;
  longitude: number;
  timestamp: number;
}

class LocationService {
  private cachedLocation: LocationCoordinates | null = null;

  /**
   * Solicita permissão de localização
   */
  async requestPermission(): Promise<boolean> {
    try {
      debug(LogCategory.LOCATION, 'Solicitando permissão de localização...');

      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';

      // Salvar status da permissão
      await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, granted.toString());

      if (granted) {
        info(LogCategory.LOCATION, 'Permissão de localização concedida');
      } else {
        warn(LogCategory.LOCATION, 'Permissão de localização negada', { status });
      }

      return granted;
    } catch (err) {
      error(LogCategory.LOCATION, 'Erro ao solicitar permissão de localização', err);
      return false;
    }
  }

  /**
   * Verifica se tem permissão de localização
   */
  async hasPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';

      debug(LogCategory.LOCATION, 'Verificando permissão de localização', { status, granted });

      return granted;
    } catch (err) {
      error(LogCategory.LOCATION, 'Erro ao verificar permissão de localização', err);
      return false;
    }
  }

  /**
   * Obtém localização atual do usuário
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    const startTime = Date.now();

    try {
      info(LogCategory.LOCATION, 'Iniciando captura de coordenadas...');

      // Verificar se tem permissão
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        warn(LogCategory.LOCATION, 'Sem permissão de localização - cancelando captura');
        return null;
      }

      // Verificar cache (5 minutos)
      if (this.cachedLocation) {
        const age = Date.now() - this.cachedLocation.timestamp;
        if (age < LOCATION_CACHE_DURATION) {
          info(LogCategory.LOCATION, 'Usando localização em cache', {
            coordinates: {
              latitude: this.cachedLocation.latitude,
              longitude: this.cachedLocation.longitude,
            },
            cacheAge: Math.round(age / 1000) + 's',
          });
          return {
            latitude: this.cachedLocation.latitude,
            longitude: this.cachedLocation.longitude,
          };
        } else {
          debug(LogCategory.LOCATION, 'Cache de localização expirado', { ageSeconds: Math.round(age / 1000) });
        }
      }

      info(LogCategory.LOCATION, 'Obtendo nova localização via GPS...');

      // Obter localização com timeout de 5 segundos
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 5000,
        maximumAge: 60000, // Aceitar localização de até 1 minuto atrás
      });

      const duration = Date.now() - startTime;
      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };

      // Salvar em cache
      this.cachedLocation = coordinates;
      await this.saveLastLocation(coordinates);

      info(LogCategory.LOCATION, 'Coordenadas capturadas com sucesso', {
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
        accuracy: location.coords.accuracy,
        durationMs: duration,
        source: 'GPS',
      });

      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
    } catch (err: any) {
      const duration = Date.now() - startTime;
      error(LogCategory.LOCATION, 'Erro ao obter localização via GPS', {
        errorMessage: err.message,
        errorCode: err.code,
        durationMs: duration,
      });

      // Tentar usar última localização salva
      const lastLocation = await this.getLastLocation();
      if (lastLocation) {
        const age = Date.now() - lastLocation.timestamp;
        warn(LogCategory.LOCATION, 'Usando última localização conhecida como fallback', {
          coordinates: {
            latitude: lastLocation.latitude,
            longitude: lastLocation.longitude,
          },
          ageHours: Math.round(age / (1000 * 60 * 60)),
          source: 'Cache Antigo',
        });
        return {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
        };
      }

      error(LogCategory.LOCATION, 'Falha total na captura de coordenadas - sem fallback disponível');
      return null;
    }
  }

  /**
   * Salva última localização conhecida
   */
  private async saveLastLocation(location: LocationCoordinates): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
      debug(LogCategory.LOCATION, 'Localização salva no cache local');
    } catch (err) {
      error(LogCategory.LOCATION, 'Erro ao salvar localização no cache', err);
    }
  }

  /**
   * Recupera última localização conhecida
   */
  private async getLastLocation(): Promise<LocationCoordinates | null> {
    try {
      const locationString = await AsyncStorage.getItem(LAST_LOCATION_KEY);
      if (locationString) {
        const location = JSON.parse(locationString);
        debug(LogCategory.LOCATION, 'Última localização recuperada do cache', {
          age: Math.round((Date.now() - location.timestamp) / (1000 * 60)) + ' minutos',
        });
        return location;
      }
      debug(LogCategory.LOCATION, 'Nenhuma localização salva encontrada no cache');
      return null;
    } catch (err) {
      error(LogCategory.LOCATION, 'Erro ao recuperar localização do cache', err);
      return null;
    }
  }

  /**
   * Limpa cache de localização
   */
  clearCache(): void {
    this.cachedLocation = null;
    info(LogCategory.LOCATION, 'Cache de localização limpo');
  }
}

// Exportar instância única (singleton)
const locationService = new LocationService();

// Exportar funções principais
export const requestPermission = () => locationService.requestPermission();
export const hasPermission = () => locationService.hasPermission();
export const getCurrentLocation = () => locationService.getCurrentLocation();
export const clearLocationCache = () => locationService.clearCache();

