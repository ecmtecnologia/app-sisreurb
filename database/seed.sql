-- app-sisreurb Seed Data
-- Initial project data for app-sisreurb
-- Last updated: 2026-01-15

-- ============================================================================
-- Limpar possíveis dados residuais de teste antes de inserir os reais
-- ============================================================================
DELETE FROM reurb_projects WHERE id IN ('52b2eaac-a079-4e3a-90c7-cc6be700d8d1', 'b9230dee-5a70-4710-a54b-0ac5154f554c');

-- ============================================================================
-- Inserção do Projeto Marabaixo 1
-- ============================================================================
INSERT INTO reurb_projects (
    id, 
    name, 
    description, 
    status, 
    created_by, 
    latitude, 
    longitude, 
    image_url, 
    auto_update_map, 
    last_map_update, 
    created_at, 
    updated_at, 
    tags, 
    city, 
    state, 
    tipo_reurb, 
    fases_processo, 
    data_limite_conclusao, 
    orgao_responsavel, 
    status_legal, 
    documentos_necessarios, 
    responsavel_id, 
    data_publicacao_edital, 
    numero_processo, 
    area_total_hectares
) VALUES (
    '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', 
    'Marabaixo 1', 
    'Reurb do Loteamento Marabaixo 1', 
    'Em andamento', 
    NULL, 
    0.037243, 
    -51.124407, 
    'https://img.usecurling.com/p/400/250?q=forest%20map&color=green', 
    0,
    NULL, 
    '2026-01-09 00:05:25.378+00', 
    '2026-01-09 04:36:54.474558+00', 
    '[]', 
    'Macapá', 
    'AP', 
    NULL, 
    NULL, 
    NULL, 
    NULL, 
    NULL, 
    '[]', 
    NULL, 
    NULL, 
    NULL, 
    NULL
);

-- ============================================================================
-- Inserção do Projeto Oiapoque
-- ============================================================================
INSERT INTO reurb_projects (
    id, 
    name, 
    description, 
    status, 
    created_by, 
    latitude, 
    longitude, 
    image_url, 
    auto_update_map, 
    last_map_update, 
    created_at, 
    updated_at, 
    tags, 
    city, 
    state, 
    tipo_reurb, 
    fases_processo, 
    data_limite_conclusao, 
    orgao_responsavel, 
    status_legal, 
    documentos_necessarios, 
    responsavel_id, 
    data_publicacao_edital, 
    numero_processo, 
    area_total_hectares
) VALUES (
    'b9230dee-5a70-4710-a54b-0ac5154f554c', 
    'Oiapoque', 
    'Reurb do Oiapoque', 
    'Em andamento', 
    NULL, 
    3.842815, 
    -51.832672, 
    'https://img.usecurling.com/p/400/250?q=forest%20map&color=green', 
    0,
    NULL, 
    '2026-01-09 04:31:09.152+00', 
    '2026-01-09 04:37:11.792694+00', 
    '[]', 
    'Oiapoque', 
    'AP', 
    NULL, 
    NULL, 
    NULL, 
    NULL, 
    NULL, 
    '[]', 
    NULL, 
    NULL, 
    NULL, 
    NULL
);

-- ============================================================================
-- Limpeza preventiva para evitar conflito de Primary Key (Quadras)
-- ============================================================================
DELETE FROM reurb_quadras WHERE project_id = '52b2eaac-a079-4e3a-90c7-cc6be700d8d1';

-- ============================================================================
-- Inserção em massa das quadras do Marabaixo 1
-- ============================================================================
INSERT INTO reurb_quadras (
    id, project_id, name, area, document_url, image_url, status, created_at, updated_at, description
) VALUES 
('1332d243-f05e-4aa3-9b18-246584a68826', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '91', '21054.45', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_91_Completo.docx'),
('2fe7dd16-46d9-43cc-837d-88392ff47286', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '92', '6006.47', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_92_Completo.DOC'),
('e0371852-51b5-43a6-8c7e-fd3ced3df967', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '93', '5823.89', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_93_Completo.DOC'),
('558eb3f0-bee8-4633-888d-0608a6e6b0eb', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '94', '45389.41', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_94_Completo.DOC'),
('d7ca232f-2cda-42d1-b24f-6a99e23c3263', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '112', '10235.80', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_12_Completo.DOC'),
('4b9a609a-c068-4bd2-8bd3-e37c9df98d8e', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '113', '10378.73', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_113_Completo.DOC'),
('e133a4c8-4bb7-4a16-9f91-79234cb87750', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '114', '10108.42', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_114_Completo.DOC'),
('66042ffb-a655-4f81-a9d9-619f8a4fa1d6', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '115', '10135.37', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_115_Completo.DOC'),
('dcb6f05b-daa2-4200-b20f-94e334d5d4a4', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '116', '10104.01', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_116_Completo.DOC'),
('bab4f4b6-1abb-48d7-a0f3-9c77f6518e07', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '117', '10142.43', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_117_Completo.DOC'),
('0e319cb2-3bf1-4e08-95d0-c190aebda615', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '118', '10200.60', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_118_Completo.DOC'),
('4ae2e875-1b41-418a-aaa9-daf337a67060', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '119', '10266.78', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_119_Completo.DOC'),
('4e758e20-0a4c-4d1a-a7da-7aac7263a420', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '120', '10124.91', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_120_Completo.DOC'),
('6f3d3f52-7baa-4207-bbd3-f225a32c1d27', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '121', '10084.97', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_121_Completo.DOC'),
('12bd0ba5-490f-44b5-ad10-dacf7ca881dd', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '122', '10168.35', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_122_Completo.DOC'),
('c9f386cc-caaa-4c3b-9902-2e8d65e2cfd3', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '123', '10327.71', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_123_Completo.DOC'),
('7ac98dd4-fcec-49ee-9c40-dd902379c6fc', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '124', '8792.41', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_124_Completo.DOC'),
('a442e58b-54bd-40ae-9ea4-11cc472afb34', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '125', '1461.72', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_125_Completo.DOC'),
('4a5fc9a2-b6c4-4c4a-988d-c324c96061fe', '52b2eaac-a079-4e3a-90c7-cc6be700d8d1', '125A', '1247.30', NULL, NULL, 'synchronized', '2026-01-09 02:34:56.390334+00', '2026-01-09 02:34:56.390334+00', 'Memorial_Descritivo_Quadra_125A_Completo.DOC');
