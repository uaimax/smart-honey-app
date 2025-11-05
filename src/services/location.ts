import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';

      // Salvar status da permissão
      await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, granted.toString());

      console.log('📍 Permissão de localização:', granted ? 'concedida' : 'negada');
      return granted;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão de localização:', error);
      return false;
    }
  }

  /**
   * Verifica se tem permissão de localização
   */
  async hasPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Obtém localização atual do usuário
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // Verificar se tem permissão
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        console.warn('⚠️ Sem permissão de localização');
        return null;
      }

      // Verificar cache (5 minutos)
      if (this.cachedLocation) {
        const age = Date.now() - this.cachedLocation.timestamp;
        if (age < LOCATION_CACHE_DURATION) {
          console.log('📍 Usando localização em cache');
          return {
            latitude: this.cachedLocation.latitude,
            longitude: this.cachedLocation.longitude,
          };
        }
      }

      console.log('📍 Obtendo localização atual...');

      // Obter localização com timeout de 5 segundos
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 5000,
        maximumAge: 60000, // Aceitar localização de até 1 minuto atrás
      });

      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };

      // Salvar em cache
      this.cachedLocation = coordinates;
      await this.saveLastLocation(coordinates);

      console.log('✅ Localização obtida:', coordinates.latitude, coordinates.longitude);

      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter localização:', error.message);

      // Tentar usar última localização salva
      const lastLocation = await this.getLastLocation();
      if (lastLocation) {
        console.log('📍 Usando última localização conhecida');
        return {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
        };
      }

      return null;
    }
  }

  /**
   * Salva última localização conhecida
   */
  private async saveLastLocation(location: LocationCoordinates): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
    } catch (error) {
      console.error('❌ Erro ao salvar localização:', error);
    }
  }

  /**
   * Recupera última localização conhecida
   */
  private async getLastLocation(): Promise<LocationCoordinates | null> {
    try {
      const locationString = await AsyncStorage.getItem(LAST_LOCATION_KEY);
      if (locationString) {
        return JSON.parse(locationString);
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao recuperar localização:', error);
      return null;
    }
  }

  /**
   * Limpa cache de localização
   */
  clearCache(): void {
    this.cachedLocation = null;
  }
}

// Exportar instância única (singleton)
const locationService = new LocationService();

// Exportar funções principais
export const requestPermission = () => locationService.requestPermission();
export const hasPermission = () => locationService.hasPermission();
export const getCurrentLocation = () => locationService.getCurrentLocation();
export const clearLocationCache = () => locationService.clearCache();

