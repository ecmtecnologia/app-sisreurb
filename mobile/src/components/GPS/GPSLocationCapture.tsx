import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface GPSLocationCaptureProps {
  onLocationCaptured: (coords: GPSCoordinates) => void;
  minAccuracy?: number;
}

const MIN_REQUIRED_ACCURACY = 15; // metros

export function GPSLocationCapture({
  onLocationCaptured,
  minAccuracy = MIN_REQUIRED_ACCURACY,
}: GPSLocationCaptureProps) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<GPSCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Solicitar permissão
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('❌ Permissão de localização negada');
        Alert.alert(
          'Permissão Necessária',
          'A permissão de localização é obrigatória para realizar vistorias.'
        );
        return;
      }

      // Obter localização com alta precisão
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: GPSCoordinates = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || 0,
        timestamp: currentLocation.timestamp,
      };

      setLocation(coords);

      // Validar acurácia
      if (coords.accuracy > minAccuracy) {
        setError(
          `⚠️ Acurácia insuficiente: ${coords.accuracy.toFixed(1)}m (máximo: ${minAccuracy}m)`
        );
        Alert.alert(
          'Acurácia Insuficiente',
          `Acurácia atual: ${coords.accuracy.toFixed(1)}m\n\nMínnimo requerido: ${minAccuracy}m\n\nTente em um local aberto.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Sucesso
      onLocationCaptured(coords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`❌ Erro ao capturar localização: ${errorMessage}`);
      console.error('GPS Error:', err);
      Alert.alert('Erro de GPS', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onLocationCaptured, minAccuracy]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>📍 Localização GPS</Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text style={styles.loadingText}>Buscando localização...</Text>
          </View>
        )}

        {location && !error && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>✅ Localização capturada</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Latitude:</Text>
              <Text style={styles.value}>{location.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Longitude:</Text>
              <Text style={styles.value}>{location.longitude.toFixed(6)}</Text>
            </View>
            <View
              style={[
                styles.infoRow,
                location.accuracy <= 15
                  ? styles.accuracyGood
                  : styles.accuracyWarning,
              ]}
            >
              <Text style={styles.label}>Acurácia:</Text>
              <Text style={styles.value}>{location.accuracy.toFixed(1)}m</Text>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={captureLocation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Buscando...' : 'Capturar Localização'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          ℹ️ Acurácia mínima requerida: {minAccuracy}m
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  successText: {
    color: '#2e7d32',
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    color: '#555',
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    color: '#2e7d32',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  accuracyGood: {
    backgroundColor: '#c8e6c9',
  },
  accuracyWarning: {
    backgroundColor: '#ffccbc',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
