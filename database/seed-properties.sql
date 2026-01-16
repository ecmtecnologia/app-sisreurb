-- app-sisreurb Seed Data - Properties (Lotes)
-- Last updated: 2026-01-15
-- Total de Lotes: 585

-- ============================================================================
-- Limpeza preventiva para evitar conflito de Primary Key (Properties)
-- ============================================================================
DELETE FROM reurb_properties WHERE quadra_id IN (
    SELECT id FROM reurb_quadras WHERE project_id = '52b2eaac-a079-4e3a-90c7-cc6be700d8d1'
);

-- ============================================================================
-- Inserção de Propriedades (Lotes) - Marabaixo 1
-- ============================================================================
-- AGUARDANDO ARQUIVO SQL COMPLETO COM 585 REGISTROS
-- Favor inserir o arquivo SQL aqui
