import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { GPSLocationCapture, GPSCoordinates } from '../components/GPS/GPSLocationCapture';
import {
  MultiPhotoCamera,
  type CapturedPhoto,
} from '../components/Camera/MultiPhotoCamera';
import { SignatureCapture } from '../components/Signature/SignatureCapture';
import { db, type Survey } from '../services/database/surveyService';

interface VistoriaStep {
  id: 'gps' | 'camera' | 'signatures' | 'review';
  title: string;
  completed: boolean;
}

const initialSteps: VistoriaStep[] = [
  { id: 'gps', title: '📍 Localização GPS', completed: false },
  { id: 'camera', title: '📷 Fotos do Lote', completed: false },
  { id: 'signatures', title: '✍️ Assinaturas', completed: false },
  { id: 'review', title: '✓ Revisão', completed: false },
];

export default function VistoriaScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();

  const [steps, setSteps] = useState<VistoriaStep[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState<VistoriaStep['id']>('gps');
  const [loading, setLoading] = useState(false);
  const [surveyId, setSurveyId] = useState<string | null>(null);

  const [vistoriaData, setVistoriaData] = useState<Partial<Survey>>({
    property_id: propertyId || '',
    photos: [],
    status: 'draft',
  });

  // Auto-save ao banco de dados
  const autoSave = useCallback(async (data: Partial<Survey>) => {
    try {
      if (!surveyId) {
        // Criar nova vistoria se não existir
        const newSurveyId = await db.saveSurvey({
          property_id: propertyId || '',
          vistoriador_signature: data.vistoriador_signature || '',
          requerente_signature: data.requerente_signature || '',
          photos: data.photos || [],
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          accuracy: data.accuracy || 0,
          status: 'draft',
        });
        setSurveyId(newSurveyId);
        console.log(`✅ Vistoria criada: ${newSurveyId}`);
      } else {
        // Atualizar vistoria existente
        await db.updateSurveyStatus(surveyId, 'draft');
        console.log(`✅ Vistoria salva automaticamente: ${surveyId}`);
      }
    } catch (err) {
      console.error('Erro ao auto-salvar:', err);
    }
  }, [surveyId, propertyId]);

  const handleGPSCaptured = useCallback(
    (coords: GPSCoordinates) => {
      const updatedData = { ...vistoriaData, ...coords };
      setVistoriaData(updatedData);
      autoSave(updatedData);

      // Marcar como completo
      setSteps((prev) =>
        prev.map((step) => (step.id === 'gps' ? { ...step, completed: true } : step))
      );

      // Avançar para próximo passo
      setCurrentStep('camera');
    },
    [vistoriaData, autoSave]
  );

  const handlePhotosCaptured = useCallback(
    (photos: CapturedPhoto[]) => {
      const photoUris = photos.map((p) => p.uri);
      const updatedData = { ...vistoriaData, photos: photoUris };
      setVistoriaData(updatedData);
      autoSave(updatedData);

      // Marcar como completo
      setSteps((prev) =>
        prev.map((step) => (step.id === 'camera' ? { ...step, completed: true } : step))
      );

      // Avançar para próximo passo
      setCurrentStep('signatures');
    },
    [vistoriaData, autoSave]
  );

  const handleSignaturesCaptured = useCallback(
    (signatures: { vistoriador: string; requerente: string; timestamp: number }) => {
      const updatedData = {
        ...vistoriaData,
        vistoriador_signature: signatures.vistoriador,
        requerente_signature: signatures.requerente,
      };
      setVistoriaData(updatedData);
      autoSave(updatedData);

      // Marcar como completo
      setSteps((prev) =>
        prev.map((step) =>
          step.id === 'signatures' ? { ...step, completed: true } : step
        )
      );

      // Avançar para revisão
      setCurrentStep('review');
    },
    [vistoriaData, autoSave]
  );

  const handleAutoSaveSignature = useCallback(
    (data: Partial<{ vistoriador: string; requerente: string; timestamp: number }>) => {
      const updatedData = {
        ...vistoriaData,
        ...(data.vistoriador && { vistoriador_signature: data.vistoriador }),
        ...(data.requerente && { requerente_signature: data.requerente }),
      };
      autoSave(updatedData);
    },
    [vistoriaData, autoSave]
  );

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);

      if (!surveyId) {
        throw new Error('Erro: ID da vistoria não encontrado');
      }

      // Atualizar status para pending_sync
      await db.updateSurveyStatus(surveyId, 'pending_sync');

      Alert.alert(
        'Sucesso!',
        'Vistoria concluída e salva localmente. Será sincronizada quando a conexão estiver disponível.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      console.error('Erro ao submeter:', err);
      Alert.alert(
        'Erro',
        'Falha ao salvar vistoria. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  const handleGoBack = useCallback(() => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep);
    if (stepIndex > 0) {
      const prevStep = steps[stepIndex - 1];
      setCurrentStep(prevStep.id);
    } else {
      Alert.alert(
        'Descartar vistoria',
        'Tem certeza que deseja cancelar a vistoria?',
        [
          { text: 'Continuar', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [currentStep, steps]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Indicador de progresso */}
      <View style={styles.progressHeader}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.propertyTitle}>Lote #{propertyId}</Text>
        <View style={styles.spacer} />
      </View>

      {/* Passos */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepRow}>
            <View
              style={[
                styles.stepCircle,
                step.completed && styles.stepCircleCompleted,
                step.id === currentStep && styles.stepCircleActive,
              ]}
            >
              <Text style={styles.stepNumber}>
                {step.completed ? '✓' : index + 1}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                step.completed && styles.stepLabelCompleted,
                step.id === currentStep && styles.stepLabelActive,
              ]}
            >
              {step.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Conteúdo do passo */}
      <ScrollView style={styles.content}>
        {currentStep === 'gps' && (
          <GPSLocationCapture onLocationCaptured={handleGPSCaptured} />
        )}

        {currentStep === 'camera' && (
          <MultiPhotoCamera onPhotosCaptured={handlePhotosCaptured} />
        )}

        {currentStep === 'signatures' && (
          <SignatureCapture
            onSignaturesCaptured={handleSignaturesCaptured}
            onAutoSave={handleAutoSaveSignature}
          />
        )}

        {currentStep === 'review' && (
          <View style={styles.reviewContainer}>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>📋 Revisão da Vistoria</Text>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>📍 Localização</Text>
                {vistoriaData.latitude ? (
                  <>
                    <Text style={styles.reviewValue}>
                      Lat: {vistoriaData.latitude?.toFixed(6)}
                    </Text>
                    <Text style={styles.reviewValue}>
                      Lon: {vistoriaData.longitude?.toFixed(6)}
                    </Text>
                    <Text style={styles.reviewValue}>
                      Acurácia: {vistoriaData.accuracy?.toFixed(1)}m
                    </Text>
                  </>
                ) : (
                  <Text style={styles.reviewEmpty}>Não capturada</Text>
                )}
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>📷 Fotos</Text>
                <Text style={styles.reviewValue}>
                  {vistoriaData.photos?.length || 0}/3 fotos capturadas
                </Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>✍️ Assinaturas</Text>
                <Text style={styles.reviewValue}>
                  {vistoriaData.vistoriador_signature ? '✓ Vistoriador' : '✗ Vistoriador'}
                </Text>
                <Text style={styles.reviewValue}>
                  {vistoriaData.requerente_signature ? '✓ Requerente' : '✗ Requerente'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    ✓ Finalizar Vistoria
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Status do offline */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {surveyId ? `📱 Rascunho salvo: ${surveyId.slice(-6)}` : '🔄 Criando rascunho...'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  progressHeader: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  propertyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    width: 40,
  },
  stepsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stepRow: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleCompleted: {
    backgroundColor: '#4caf50',
  },
  stepCircleActive: {
    backgroundColor: '#1a73e8',
    borderWidth: 2,
    borderColor: '#1a73e8',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  stepLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#4caf50',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingVertical: 12,
  },
  reviewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  reviewSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reviewSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a73e8',
    marginBottom: 8,
  },
  reviewValue: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  reviewEmpty: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
