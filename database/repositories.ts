/**
 * Repository Pattern Implementation for app-sisreurb
 * Provides CRUD operations for all database entities
 */

import DatabaseService from './init';

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(limit?: number, offset?: number): Promise<T[]>;
  create(data: T): Promise<string>;
  update(id: string, data: Partial<T>): Promise<number>;
  delete(id: string): Promise<number>;
}

// ============================================================================
// Project Repository
// ============================================================================
export interface RurbProject {
  id: string;
  name: string;
  description?: string;
  status?: string;
  created_by?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  auto_update_map?: number;
  last_map_update?: string;
  created_at?: string;
  updated_at?: string;
  tags?: string;
  city?: string;
  state?: string;
  tipo_reurb?: string;
  fases_processo?: string;
  data_limite_conclusao?: string;
  orgao_responsavel?: string;
  status_legal?: string;
  documentos_necessarios?: string;
  responsavel_id?: string;
  data_publicacao_edital?: string;
  numero_processo?: string;
  area_total_hectares?: number;
}

export class ProjectRepository implements IRepository<RurbProject> {
  constructor(private db: DatabaseService) {}

  async findById(id: string): Promise<RurbProject | null> {
    return this.db.get('SELECT * FROM reurb_projects WHERE id = ?', [id]);
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<RurbProject[]> {
    return this.db.all('SELECT * FROM reurb_projects LIMIT ? OFFSET ?', [limit, offset]);
  }

  async findByCity(city: string): Promise<RurbProject[]> {
    return this.db.all('SELECT * FROM reurb_projects WHERE city = ?', [city]);
  }

  async findByStatus(status: string): Promise<RurbProject[]> {
    return this.db.all('SELECT * FROM reurb_projects WHERE status = ?', [status]);
  }

  async create(data: RurbProject): Promise<string> {
    return this.db.insert('reurb_projects', data);
  }

  async update(id: string, data: Partial<RurbProject>): Promise<number> {
    return this.db.update('reurb_projects', data, 'id = ?', [id]);
  }

  async delete(id: string): Promise<number> {
    return this.db.delete('reurb_projects', 'id = ?', [id]);
  }

  async getProjectsWithQuadras(projectId: string): Promise<any> {
    return this.db.get(`
      SELECT p.*, COUNT(q.id) as quadra_count
      FROM reurb_projects p
      LEFT JOIN reurb_quadras q ON p.id = q.project_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [projectId]);
  }
}

// ============================================================================
// Quadra Repository
// ============================================================================
export interface RurbQuadra {
  id: string;
  project_id?: string;
  name: string;
  area?: string;
  document_url?: string;
  image_url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  description?: string;
}

export class QuadraRepository implements IRepository<RurbQuadra> {
  constructor(private db: DatabaseService) {}

  async findById(id: string): Promise<RurbQuadra | null> {
    return this.db.get('SELECT * FROM reurb_quadras WHERE id = ?', [id]);
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<RurbQuadra[]> {
    return this.db.all('SELECT * FROM reurb_quadras LIMIT ? OFFSET ?', [limit, offset]);
  }

  async findByProjectId(projectId: string): Promise<RurbQuadra[]> {
    return this.db.all('SELECT * FROM reurb_quadras WHERE project_id = ?', [projectId]);
  }

  async create(data: RurbQuadra): Promise<string> {
    return this.db.insert('reurb_quadras', data);
  }

  async update(id: string, data: Partial<RurbQuadra>): Promise<number> {
    return this.db.update('reurb_quadras', data, 'id = ?', [id]);
  }

  async delete(id: string): Promise<number> {
    return this.db.delete('reurb_quadras', 'id = ?', [id]);
  }
}

// ============================================================================
// Property Repository
// ============================================================================
export interface RurbProperty {
  id: string;
  quadra_id?: string;
  name: string;
  area?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  images?: string;
  created_at?: string;
  updated_at?: string;
  address?: string;
  tipo_posse?: string;
  situacao_fundiaria?: string;
  documentos_comprobatorios?: string;
  historico_ocupacao?: string;
  restricoes_ambientais?: string;
  situacao_cadastral?: string;
  area_terreno?: number;
  area_construida?: number;
  matricula_imovel?: string;
  data_ocupacao?: string;
  possui_conflito?: number;
  descricao_conflito?: string;
}

export class PropertyRepository implements IRepository<RurbProperty> {
  constructor(private db: DatabaseService) {}

  async findById(id: string): Promise<RurbProperty | null> {
    return this.db.get('SELECT * FROM reurb_properties WHERE id = ?', [id]);
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<RurbProperty[]> {
    return this.db.all('SELECT * FROM reurb_properties LIMIT ? OFFSET ?', [limit, offset]);
  }

  async findByQuadraId(quadraId: string): Promise<RurbProperty[]> {
    return this.db.all('SELECT * FROM reurb_properties WHERE quadra_id = ?', [quadraId]);
  }

  async findByStatus(status: string): Promise<RurbProperty[]> {
    return this.db.all('SELECT * FROM reurb_properties WHERE status = ?', [status]);
  }

  async findByLocation(latitude: number, longitude: number, radius: number = 0.01): Promise<RurbProperty[]> {
    return this.db.all(`
      SELECT * FROM reurb_properties
      WHERE latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
    `, [
      latitude - radius, latitude + radius,
      longitude - radius, longitude + radius
    ]);
  }

  async create(data: RurbProperty): Promise<string> {
    return this.db.insert('reurb_properties', data);
  }

  async update(id: string, data: Partial<RurbProperty>): Promise<number> {
    return this.db.update('reurb_properties', data, 'id = ?', [id]);
  }

  async delete(id: string): Promise<number> {
    return this.db.delete('reurb_properties', 'id = ?', [id]);
  }

  async findConflictProperties(): Promise<RurbProperty[]> {
    return this.db.all('SELECT * FROM reurb_properties WHERE possui_conflito = 1');
  }
}

// ============================================================================
// Survey Repository
// ============================================================================
export interface RurbSurvey {
  id: string;
  property_id: string;
  form_number?: string;
  survey_date?: string;
  city?: string;
  state?: string;
  applicant_name?: string;
  applicant_cpf?: string;
  applicant_rg?: string;
  applicant_civil_status?: string;
  applicant_profession?: string;
  applicant_income?: string;
  applicant_nis?: string;
  spouse_name?: string;
  spouse_cpf?: string;
  residents_count?: number;
  has_children?: number;
  occupation_time?: string;
  acquisition_mode?: string;
  property_use?: string;
  construction_type?: string;
  roof_type?: string;
  floor_type?: string;
  rooms_count?: number;
  conservation_state?: string;
  fencing?: string;
  water_supply?: string;
  energy_supply?: string;
  sanitation?: string;
  street_paving?: string;
  observations?: string;
  surveyor_name?: string;
  created_at?: string;
  updated_at?: string;
  surveyor_signature?: string;
  documents?: string;
  assinatura_requerente?: string;
  analise_ia_classificacao?: string;
  analise_ia_parecer?: string;
  analise_ia_proximo_passo?: string;
  analise_ia_gerada_em?: string;
  is_dirty?: number;
  last_sync?: string;
}

export class SurveyRepository implements IRepository<RurbSurvey> {
  constructor(private db: DatabaseService) {}

  async findById(id: string): Promise<RurbSurvey | null> {
    return this.db.get('SELECT * FROM reurb_surveys WHERE id = ?', [id]);
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<RurbSurvey[]> {
    return this.db.all('SELECT * FROM reurb_surveys LIMIT ? OFFSET ?', [limit, offset]);
  }

  async findByPropertyId(propertyId: string): Promise<RurbSurvey[]> {
    return this.db.all('SELECT * FROM reurb_surveys WHERE property_id = ?', [propertyId]);
  }

  async findDirtySurveys(): Promise<RurbSurvey[]> {
    return this.db.all('SELECT * FROM reurb_surveys WHERE is_dirty = 1');
  }

  async findUnsyncedSurveys(): Promise<RurbSurvey[]> {
    return this.db.all('SELECT * FROM reurb_surveys WHERE last_sync IS NULL');
  }

  async findSurveysByDateRange(startDate: string, endDate: string): Promise<RurbSurvey[]> {
    return this.db.all(`
      SELECT * FROM reurb_surveys
      WHERE survey_date BETWEEN ? AND ?
      ORDER BY survey_date DESC
    `, [startDate, endDate]);
  }

  async create(data: RurbSurvey): Promise<string> {
    return this.db.insert('reurb_surveys', data);
  }

  async update(id: string, data: Partial<RurbSurvey>): Promise<number> {
    return this.db.update('reurb_surveys', data, 'id = ?', [id]);
  }

  async delete(id: string): Promise<number> {
    return this.db.delete('reurb_surveys', 'id = ?', [id]);
  }

  async markAsSynced(id: string): Promise<number> {
    return this.update(id, {
      is_dirty: 0,
      last_sync: new Date().toISOString()
    });
  }

  async markAsDirty(id: string): Promise<number> {
    return this.update(id, { is_dirty: 1 });
  }
}

export default {
  ProjectRepository,
  QuadraRepository,
  PropertyRepository,
  SurveyRepository
};
