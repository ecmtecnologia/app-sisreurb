-- app-sisreurb Database Schema for SQLite/PWA
-- Last updated: 2026-01-15

-- ============================================================================
-- 1. Tabela de Projetos
-- ============================================================================
CREATE TABLE IF NOT EXISTS reurb_projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Em andamento',
    created_by TEXT,
    latitude REAL,
    longitude REAL,
    image_url TEXT,
    auto_update_map INTEGER DEFAULT 0, -- 0 para false, 1 para true
    last_map_update TEXT,
    created_at TEXT,
    updated_at TEXT,
    tags TEXT, -- Armazenar como string JSON do Array
    city TEXT,
    state TEXT,
    tipo_reurb TEXT,
    fases_processo TEXT, -- Armazenar como string JSON
    data_limite_conclusao TEXT,
    orgao_responsavel TEXT,
    status_legal TEXT,
    documentos_necessarios TEXT, -- Armazenar como string JSON
    responsavel_id TEXT,
    data_publicacao_edital TEXT,
    numero_processo TEXT,
    area_total_hectares NUMERIC
);

CREATE INDEX idx_projects_status ON reurb_projects(status);
CREATE INDEX idx_projects_city ON reurb_projects(city);
CREATE INDEX idx_projects_created_by ON reurb_projects(created_by);

-- ============================================================================
-- 2. Tabela de Quadras (FK para Projetos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reurb_quadras (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    name TEXT NOT NULL,
    area TEXT,
    document_url TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'synchronized',
    created_at TEXT,
    updated_at TEXT,
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES reurb_projects (id) ON DELETE CASCADE
);

CREATE INDEX idx_quadras_project_id ON reurb_quadras(project_id);
CREATE INDEX idx_quadras_status ON reurb_quadras(status);

-- ============================================================================
-- 3. Tabela de Propriedades (FK para Quadras)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reurb_properties (
    id TEXT PRIMARY KEY,
    quadra_id TEXT,
    name TEXT NOT NULL,
    area TEXT,
    description TEXT,
    latitude REAL,
    longitude REAL,
    status TEXT DEFAULT 'pending',
    images TEXT, -- Armazenar como string JSON
    created_at TEXT,
    updated_at TEXT,
    address TEXT,
    tipo_posse TEXT,
    situacao_fundiaria TEXT,
    documentos_comprobatorios TEXT, -- Armazenar como string JSON
    historico_ocupacao TEXT,
    restricoes_ambientais TEXT,
    situacao_cadastral TEXT,
    area_terreno NUMERIC,
    area_construida NUMERIC,
    matricula_imovel TEXT,
    data_ocupacao TEXT,
    possui_conflito INTEGER DEFAULT 0,
    descricao_conflito TEXT,
    FOREIGN KEY (quadra_id) REFERENCES reurb_quadras (id) ON DELETE CASCADE
);

CREATE INDEX idx_properties_quadra_id ON reurb_properties(quadra_id);
CREATE INDEX idx_properties_status ON reurb_properties(status);
CREATE INDEX idx_properties_location ON reurb_properties(latitude, longitude);

-- ============================================================================
-- 4. Tabela de Vistorias (FK para Propriedades)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reurb_surveys (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    form_number TEXT,
    survey_date TEXT,
    city TEXT DEFAULT 'Macapá',
    state TEXT DEFAULT 'AP',
    applicant_name TEXT,
    applicant_cpf TEXT,
    applicant_rg TEXT,
    applicant_civil_status TEXT,
    applicant_profession TEXT,
    applicant_income TEXT,
    applicant_nis TEXT,
    spouse_name TEXT,
    spouse_cpf TEXT,
    residents_count INTEGER DEFAULT 0,
    has_children INTEGER DEFAULT 0,
    occupation_time TEXT,
    acquisition_mode TEXT,
    property_use TEXT,
    construction_type TEXT,
    roof_type TEXT,
    floor_type TEXT,
    rooms_count INTEGER DEFAULT 0,
    conservation_state TEXT,
    fencing TEXT,
    water_supply TEXT,
    energy_supply TEXT,
    sanitation TEXT,
    street_paving TEXT,
    observations TEXT,
    surveyor_name TEXT,
    created_at TEXT,
    updated_at TEXT,
    surveyor_signature TEXT,
    documents TEXT, -- JSONB do Supabase vira TEXT aqui
    assinatura_requerente TEXT,
    analise_ia_classificacao TEXT,
    analise_ia_parecer TEXT,
    analise_ia_proximo_passo TEXT,
    analise_ia_gerada_em TEXT,
    -- Campos de controle de sincronização local
    is_dirty INTEGER DEFAULT 0, -- 1 se foi alterado offline e precisa subir
    last_sync TEXT,
    FOREIGN KEY (property_id) REFERENCES reurb_properties (id) ON DELETE CASCADE
);

CREATE INDEX idx_surveys_property_id ON reurb_surveys(property_id);
CREATE INDEX idx_surveys_survey_date ON reurb_surveys(survey_date);
CREATE INDEX idx_surveys_is_dirty ON reurb_surveys(is_dirty);
CREATE INDEX idx_surveys_last_sync ON reurb_surveys(last_sync);
