import * as Location from 'expo-location';
import { GPSLocation, GPSError } from '@types/index';

const GPS_ACCURACY_THRESHOLD = 15; // meters

export class GPSService {
  private static instance: GPSService;
  private subscription: Location.LocationSubscription | null = null;

  private constructor() {}

  static getInstance(): GPSService {
    if (!GPSService.instance) {
      GPSService.instance = new GPSService();
    }
    return GPSService.instance;
  }

  /**
   * Solicita permissão de acesso ao GPS
   */
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new GPSError('Permissão de localização negada', 'PERMISSION_DENIED');
      }
      return true;
    } catch (error) {
      throw new GPSError('Erro ao solicitar permissão de GPS', 'PERMISSION_ERROR');
    }
  }

  /**
   * Captura localização atual com validação de acurácia
   */