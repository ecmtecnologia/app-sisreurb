import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

interface SignatureData {
  vistoriador: string; // Base64
  requerente: string; // Base64
  timestamp: number;
}

interface SignatureCaptureProps {
  onSignaturesCaptured: (data: SignatureData) => void;
  onAutoSave?: (data: Partial<SignatureData>) => void;
}

export function SignatureCapture({
  onSignaturesCaptured,
  onAutoSave,
}: SignatureCaptureProps) {
  const [currentSigner, setCurrentSigner] = useState<'vistoriador' | 'requerente' | null>(null);
  const [signatures, setSignatures] = useState<Partial<SignatureData>>({
    timestamp: Date.now(),
  });
  const [loading, setLoading] = useState(false);
  const vistoriadorRef = useRef<any>(null);
  const requerenteRef = useRef<any>(null);

  const handleSignatureEnd = useCallback(
    async (signature: string, type: 'vistoriador' | 'requerente') => {
      try {
        setLoading(true);

        const updatedSignatures = {
          ...signatures,
          [type]: signature,
          timestamp: Date.now(),
        };

        setSignatures(updatedSignatures);

        // Auto-save: salvar rascunho imediatamente no banco de dados
        if (onAutoSave) {
          onAutoSave(updatedSignatures);
          console.log(`✅ Auto-saved ${type} signature (${signature.length} bytes)`);
        }

        Alert.alert(
          `Assinatura do ${type === 'vistoriador' ? 'Vistoriador' : 'Requerente'}`,
          'Assinatura capturada com sucesso!',
          [{ text: 'OK' }]
        );

        if (type === 'vistoriador' && !signatures.requerente) {
          // Passar para requerente
          setCurrentSigner('requerente');
          setTimeout(() => {
            requerenteRef.current?.clearSignature();
          }, 500);
        } else if (type === 'requerente') {
          // Ambas as assinaturas foram capturadas
          if (signatures.vistoriador && updatedSignatures.requerente) {
            setCurrentSigner(null);
            onSignaturesCaptured(updatedSignatures as SignatureData);
          }
        }
      } catch (err) {
        console.error('Erro ao processar assinatura:', err);
        Alert.alert('Erro', 'Falha ao processar assinatura. Tente novamente.');
      } finally {
        setLoading(false);
      }
    },
    [signatures, onAutoSave, onSignaturesCaptured]
  );

  const handleClearSignature = useCallback(
    (type: 'vistoriador' | 'requerente') => {
      if (type === 'vistoriador') {
        vistoriadorRef.current?.clearSignature();
        setSignatures((prev) => {
          const updated = { ...prev };
          delete updated.vistoriador;
          return updated;
        });
      } else {
        requerenteRef.current?.clearSignature();
        setSignatures((prev) => {
          const updated = { ...prev };
          delete updated.requerente;
          return updated;
        });
      }
    },
    []
  );

  const handleRetry = useCallback(() => {
    Alert.alert(
      'Descartar assinaturas',
      'Tem certeza que deseja descartar todas as assinaturas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            vistoriadorRef.current?.clearSignature();
            requerenteRef.current?.clearSignature();
            setSignatures({ timestamp: Date.now() });
            setCurrentSigner('vistoriador');
          },
        },
      ]
    );
  }, []);

  const allSignaturesComplete = signatures.vistoriador && signatures.requerente;

  if (!currentSigner && !allSignaturesComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>✍️ Assinaturas Digitais</Text>
          <Text style={styles.description}>
            Duas assinaturas são obrigatórias: Vistoriador e Requerente
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setCurrentSigner('vistoriador')}
          >
            <Text style={styles.buttonText}>
              1️⃣ Assinatura do Vistoriador
            </Text>
          </TouchableOpacity>
          <Text style={styles.note}>ℹ️ Toque no botão para iniciar a captura</Text>
        </View>
      </View>
    );
  }

  if (currentSigner === 'vistoriador') {
    return (
      <View style={styles.signatureContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assinatura do Vistoriador</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setCurrentSigner(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <SignatureScreen
          ref={vistoriadorRef}
          onEnd={(signature) =>
            handleSignatureEnd(signature, 'vistoriador')
          }
          autoClear={false}
          imageType="image/jpeg"
          penColor="#1a73e8"
        />

        <View style={styles.signatureControls}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => handleClearSignature('vistoriador')}
          >
            <Text style={styles.buttonText}>🗑️ Limpar</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="small" color="#1a73e8" />}
        </View>
      </View>
    );
  }

  if (currentSigner === 'requerente') {
    return (
      <View style={styles.signatureContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assinatura do Requerente</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setCurrentSigner(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <SignatureScreen
          ref={requerenteRef}
          onEnd={(signature) =>
            handleSignatureEnd(signature, 'requerente')
          }
          autoClear={false}
          imageType="image/jpeg"
          penColor="#1a73e8"
        />

        <View style={styles.signatureControls}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => handleClearSignature('requerente')}
          >
            <Text style={styles.buttonText}>🗑️ Limpar</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="small" color="#1a73e8" />}
        </View>
      </View>
    );
  }

  // Ambas as assinaturas completas
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.successHeader}>
          <Text style={styles.successTitle}>✅ Assinaturas Capturadas</Text>
        </View>

        <View style={styles.signatureStatus}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Vistoriador:</Text>
            <Text style={styles.statusOk}>✓ Capturada</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Requerente:</Text>
            <Text style={styles.statusOk}>✓ Capturada</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.successButton]}
            onPress={() => onSignaturesCaptured(signatures as SignatureData)}
          >
            <Text style={styles.buttonText}>✓ Confirmar e Prosseguir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleRetry}
          >
            <Text style={styles.buttonText}>🔄 Refazer</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          ℹ️ As assinaturas foram salvas automaticamente
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
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signatureControls: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  clearButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  successHeader: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  successTitle: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 14,
  },
  signatureStatus: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  statusOk: {
    fontSize: 13,
    color: '#4caf50',
    fontWeight: '600',
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
  buttonRow: {
    marginBottom: 12,
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
  },
});
