import { useState, useCallback } from 'react';
import { db } from '../services/database/surveyService';

interface UseSurveyState {
  surveyId: string | null;
  isLoading: boolean;
  error: string | null;
  createSurvey: (propertyId: string) => Promise<string>;
  updateSurveyField: (field: string, value: any) => Promise<void>;
  saveSurvey: () => Promise<void>;
}

export function useSurvey(initialPropertyId?: string): UseSurveyState {
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSurvey = useCallback(async (propertyId: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const id = await db.saveSurvey({
        property_id: propertyId,
        vistoriador_signature: '',
        requerente_signature: '',
        photos: [],
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        status: 'draft',
      });

      setSurveyId(id);
      return id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar vistoria';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSurveyField = useCallback(
    async (field: string, value: any) => {
      if (!surveyId) {
        setError('Survey ID não definido');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Implementar atualização de campo específico
        // Dependendo do tipo de campo
        if (field === 'status') {
          await db.updateSurveyStatus(surveyId, value);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [surveyId]
  );

  const saveSurvey = useCallback(async () => {
    if (!surveyId) {
      setError('Survey ID não definido');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Atualizar para pending_sync
      await db.updateSurveyStatus(surveyId, 'pending_sync');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [surveyId]);

  return {
    surveyId,
    isLoading,
    error,
    createSurvey,
    updateSurveyField,
    saveSurvey,
  };
}
