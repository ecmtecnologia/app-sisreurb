export interface Property {
  id: string;
  name: string;
  quadra: string;
  project_id: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

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

export interface SyncState {
  isOnline: boolean;
  lastSync?: string;
  pendingSurveys: number;
}

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface CapturedPhoto {
  uri: string;
  timestamp: number;
  order: number;
}

export interface SignatureData {
  vistoriador: string;
  requerente: string;
  timestamp: number;
}
