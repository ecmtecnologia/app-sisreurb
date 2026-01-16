import * as SQLite from 'expo-sqlite';

export interface Survey {
  id: string;
  property_id: string;
  vistoriador_signature: string; // Base64
  requerente_signature: string; // Base64
  photos: string[]; // URIs das fotos
  latitude: number;
  longitude: number;
  accuracy: number;
  status: 'draft' | 'pending_sync' | 'synced';
  created_at: string;
  synced_at?: string;
  notes?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('reurb.db');
      console.log('✅ Database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  async saveSurvey(survey: Omit<Survey, 'id' | 'created_at'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `survey_${Date.now()}`;
    const created_at = new Date().toISOString();

    await this.db.execAsync(`
      INSERT INTO reurb_surveys (
        id, property_id, vistoriador_signature, requerente_signature,
        photos, latitude, longitude, accuracy, status, created_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      id,
      survey.property_id,
      survey.vistoriador_signature,
      survey.requerente_signature,
      JSON.stringify(survey.photos),
      survey.latitude,
      survey.longitude,
      survey.accuracy,
      survey.status,
      created_at,
      survey.notes || null,
    ]);

    return id;
  }

  async updateSurveyStatus(
    surveyId: string,
    status: 'draft' | 'pending_sync' | 'synced',
    photo?: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (photo) {
      const survey = await this.db.getFirstAsync<Survey>(
        'SELECT * FROM reurb_surveys WHERE id = ?',
        [surveyId]
      );

      if (survey) {
        const photos = JSON.parse(survey.photos as any);
        photos.push(photo);

        await this.db.execAsync(
          'UPDATE reurb_surveys SET photos = ?, status = ? WHERE id = ?',
          [JSON.stringify(photos), status, surveyId]
        );
      }
    } else {
      await this.db.execAsync(
        'UPDATE reurb_surveys SET status = ? WHERE id = ?',
        [status, surveyId]
      );
    }
  }

  async getSurvey(id: string): Promise<Survey | null> {
    if (!this.db) throw new Error('Database not initialized');

    const survey = await this.db.getFirstAsync<any>(
      'SELECT * FROM reurb_surveys WHERE id = ?',
      [id]
    );

    if (!survey) return null;

    return {
      ...survey,
      photos: JSON.parse(survey.photos),
    };
  }

  async getPendingSurveys(): Promise<Survey[]> {
    if (!this.db) throw new Error('Database not initialized');

    const surveys = await this.db.getAllAsync<any>(
      "SELECT * FROM reurb_surveys WHERE status IN ('draft', 'pending_sync')"
    );

    return surveys.map(survey => ({
      ...survey,
      photos: JSON.parse(survey.photos),
    }));
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const db = new DatabaseService();
