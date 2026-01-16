import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './database/surveyService';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_BUCKET = 'reurb-vistoria';

interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
  failedCount?: number;
  errors?: string[];
}

class SyncService {
  private isOnline = true;
  private isSyncing = false;

  async initialize(): Promise<void> {
    console.log('✅ Sync service initialized');
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await axios.get('https://www.google.com', {
        timeout: 5000,
      });
      this.isOnline = true;
      return true;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  async uploadFile(
    filePath: string,
    fileName: string,
    type: 'image' | 'signature'
  ): Promise<string | null> {
    try {
      const fileData = await axios.get(`file://${filePath}`, {
        responseType: 'arraybuffer',
      });

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${type}s/${fileName}`;

      const response = await axios.post(uploadUrl, fileData.data, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': type === 'image' ? 'image/jpeg' : 'image/png',
        },
      });

      return response.data.path || fileName;
    } catch (err) {
      console.error(`Erro ao fazer upload de ${fileName}:`, err);
      return null;
    }
  }

  async uploadBase64(
    base64Data: string,
    fileName: string,
    type: 'image' | 'signature'
  ): Promise<string | null> {
    try {
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${type}s/${fileName}`;

      const response = await axios.post(uploadUrl, Buffer.from(base64Data, 'base64'), {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': type === 'image' ? 'image/jpeg' : 'image/png',
        },
      });

      return response.data.path || fileName;
    } catch (err) {
      console.error(`Erro ao fazer upload de ${fileName}:`, err);
      return null;
    }
  }

  async syncPendingSurveys(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        message: 'Sincronização já em andamento',
      };
    }

    try {
      this.isSyncing = true;

      // Verificar conectividade
      const isOnline = await this.checkConnectivity();
      if (!isOnline) {
        return {
          success: false,
          message: 'Dispositivo offline. Tente novamente quando conectado.',
        };
      }

      // Obter vistorias pendentes
      const pendingSurveys = await db.getPendingSurveys();
      if (pendingSurveys.length === 0) {
        return {
          success: true,
          message: 'Nenhuma vistoria para sincronizar',
          syncedCount: 0,
        };
      }

      let syncedCount = 0;
      const errors: string[] = [];

      for (const survey of pendingSurveys) {
        try {
          // Upload de assinaturas (Base64)
          if (survey.vistoriador_signature) {
            const vistoriadorPath = await this.uploadBase64(
              survey.vistoriador_signature,
              `survey_${survey.id}_vistoriador.png`,
              'signature'
            );
            console.log('✅ Assinatura vistoriador enviada:', vistoriadorPath);
          }

          if (survey.requerente_signature) {
            const requerentePath = await this.uploadBase64(
              survey.requerente_signature,
              `survey_${survey.id}_requerente.png`,
              'signature'
            );
            console.log('✅ Assinatura requerente enviada:', requerentePath);
          }

          // Upload de fotos
          for (const photoUri of survey.photos) {
            const uploadPath = await this.uploadFile(
              photoUri,
              `survey_${survey.id}_${Date.now()}.jpg`,
              'image'
            );
            console.log('✅ Foto enviada:', uploadPath);
          }

          // Atualizar status para 'synced'
          await db.updateSurveyStatus(survey.id, 'synced');
          syncedCount++;

          console.log(`✅ Vistoria ${survey.id} sincronizada com sucesso`);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
          errors.push(`Vistoria ${survey.id}: ${errorMsg}`);
          console.error(`❌ Erro ao sincronizar vistoria ${survey.id}:`, err);
        }
      }

      return {
        success: errors.length === 0,
        message: `${syncedCount} de ${pendingSurveys.length} vistorias sincronizadas`,
        syncedCount,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      return {
        success: false,
        message: `Erro ao sincronizar: ${errorMsg}`,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  async saveSyncState(): Promise<void> {
    try {
      const state = {
        isOnline: this.isOnline,
        lastSync: new Date().toISOString(),
      };
      await AsyncStorage.setItem('sync_state', JSON.stringify(state));
    } catch (err) {
      console.error('Erro ao salvar estado de sync:', err);
    }
  }

  async restoreSyncState(): Promise<void> {
    try {
      const state = await AsyncStorage.getItem('sync_state');
      if (state) {
        const parsed = JSON.parse(state);
        this.isOnline = parsed.isOnline;
        console.log('✅ Estado de sync restaurado:', parsed);
      }
    } catch (err) {
      console.error('Erro ao restaurar estado de sync:', err);
    }
  }
}

export const syncService = new SyncService();
