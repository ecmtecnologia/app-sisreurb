import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';

interface CapturedPhoto {
  uri: string;
  timestamp: number;
  order: number;
}

interface MultiPhotoCameraProps {
  onPhotosCaptured: (photos: CapturedPhoto[]) => void;
  maxPhotos?: number;
}

export function MultiPhotoCamera({
  onPhotosCaptured,
  maxPhotos = 3,
}: MultiPhotoCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const requestCameraPermission = useCallback(async () => {
    const { status } = await requestPermission();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'A permissão de câmera é obrigatória para capturar fotos.'
      );
      return false;
    }
    return true;
  }, [requestPermission]);

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      setLoading(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo) {
        throw new Error('Falha ao capturar foto');
      }

      // Salvar em diretório temporário
      const filename = `photo_${Date.now()}.jpg`;
      const photoDir = `${FileSystem.DocumentDirectory}vistoria_photos/`;

      await FileSystem.makeDirectoryAsync(photoDir, { intermediates: true });
      const savedUri = `${photoDir}${filename}`;
      await FileSystem.copyAsync({ from: photo.uri, to: savedUri });

      const newPhoto: CapturedPhoto = {
        uri: savedUri,
        timestamp: Date.now(),
        order: capturedPhotos.length + 1,
      };

      const updatedPhotos = [...capturedPhotos, newPhoto];
      setCapturedPhotos(updatedPhotos);

      // Auto-save: atualizar status no banco de dados
      Alert.alert(
        `Foto ${newPhoto.order} capturada`,
        `${updatedPhotos.length}/${maxPhotos} fotos`,
        [{ text: 'OK' }]
      );

      if (updatedPhotos.length === maxPhotos) {
        setCameraVisible(false);
        onPhotosCaptured(updatedPhotos);
      }
    } catch (err) {
      console.error('Erro ao capturar foto:', err);
      Alert.alert('Erro', 'Falha ao capturar foto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [capturedPhotos, maxPhotos, onPhotosCaptured]);

  const removePhoto = useCallback(
    (index: number) => {
      setCapturedPhotos((photos) => photos.filter((_, i) => i !== index));
    },
    []
  );

  const resetPhotos = useCallback(() => {
    Alert.alert('Descartar fotos', 'Tem certeza que deseja descartar todas as fotos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          setCapturedPhotos([]);
          setCameraVisible(false);
        },
      },
    ]);
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>📷 Câmera</Text>
          <Text style={styles.message}>Solicitando permissão de câmera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>📷 Câmera</Text>
          <Text style={styles.message}>Permissão de câmera necessária</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={requestCameraPermission}
          >
            <Text style={styles.buttonText}>Permitir Câmera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cameraVisible && capturedPhotos.length < maxPhotos) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} />

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setCameraVisible(false)}
          >
            <Text style={styles.buttonText}>✕ Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, loading && styles.buttonDisabled]}
            onPress={capturePhoto}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.captureButtonText}>●</Text>
            )}
          </TouchableOpacity>

          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {capturedPhotos.length}/{maxPhotos}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>📷 Fotos ({capturedPhotos.length}/{maxPhotos})</Text>

        {capturedPhotos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photoScroll}
          >
            {capturedPhotos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                <Text style={styles.photoOrder}>#{photo.order}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.buttonRow}>
          {capturedPhotos.length < maxPhotos ? (
            <TouchableOpacity style={styles.button} onPress={() => setCameraVisible(true)}>
              <Text style={styles.buttonText}>
                + Capturar Foto ({capturedPhotos.length}/{maxPhotos})
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.successButton]}
              onPress={() => onPhotosCaptured(capturedPhotos)}
            >
              <Text style={styles.buttonText}>✓ Fotos Completas</Text>
            </TouchableOpacity>
          )}

          {capturedPhotos.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetPhotos}
            >
              <Text style={styles.buttonText}>🔄 Descartar</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.note}>
          ℹ️ Capture {maxPhotos} fotos consecutivas do lote
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
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  captureButtonText: {
    fontSize: 32,
    color: '#fff',
  },
  counterBadge: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  counterText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  photoScroll: {
    marginVertical: 12,
    maxHeight: 120,
  },
  photoItem: {
    marginRight: 12,
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 6,
  },
  photoOrder: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#1a73e8',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonRow: {
    gap: 8,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  successButton: {
    backgroundColor: '#4caf50',
  },
  resetButton: {
    backgroundColor: '#ff9800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});
