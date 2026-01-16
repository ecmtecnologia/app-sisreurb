# AI Copilot Instructions - app-reurb

Sistema de captura de dados de **vistorias REURB** (imóveis urbanos de interesse social) com arquitetura offline-first para mobile (React Native/Expo) e sincronização com Supabase.

## 🏗️ Arquitetura

**Estrutura de Três Camadas:**
1. **Mobile App** (`mobile/`) - React Native + Expo, captura de dados em campo
2. **Database** (`database/`) - SQLite local + schema/repositories para sincronização
3. **Web UI** (`app/`) - Next.js/Expo Router para visualização desktop

**Fluxo de Dados:**
- Vistoria offline: GPS → Fotos (3x) → Assinaturas (2x) → SQLite local → UI review
- Quando online: SyncService detecta conexão → uploads Supabase → marca como synced
- Propriedades organizadas em: Projetos → Quadras → Propriedades → Surveys

**Por que offline-first:** Obra REURB ocorre em áreas rurais sem conectividade confiável. App deve funcionar standalone com auto-save e fila de sincronização.

## 🚀 Workflows Críticos

### Setup Banco de Dados
```bash
cd database
# Automático: node setup-and-verify.js
# Manual: sqlite3 sisreurb.db < seed-all.sql
```
Valida schema e integridade com `verify-db-integrity.js`. Índices em status/cidade/localização para queries frequentes.

### Desenvolvimento Mobile
```bash
cd mobile
npm install
npm start           # Expo Go QR code
npm run android     # Emulador Android
npm run ios         # Simulador iOS
npm run test        # Jest
npm run lint        # ESLint
```

### Padrão de Auto-Save
Componentes de captura (GPS, Camera, Signature) disparam `autoSave()` após cada interação. Uso do `useSurvey` hook com `db.saveSurvey()` ou `db.updateSurveyStatus()` para estado persistido.

## 📐 Padrões & Convenções

**Repository Pattern** (banco)
- `ProjectRepository`, `PropertyRepository`, `SurveyRepository` em [database/repositories.ts](database/repositories.ts)
- Cada repo: `findById()`, `findAll()`, `create()`, `update()`, `delete()` + queries especializadas
- Uso: `const projects = await projectRepo.findByCity('Macapá')`

**React Native + Expo**
- Componentes: [GPSLocationCapture](mobile/src/components/GPS/GPSLocationCapture.tsx), [MultiPhotoCamera](mobile/src/components/Camera/MultiPhotoCamera.tsx), [SignatureCapture](mobile/src/components/Signature/SignatureCapture.tsx)
- Cada componente é self-contained com `onCaptured` callback
- Base64 para assinaturas (salva em JSON na coluna `photos` do surveys)

**Nomenclatura**
- Surveys: `survey_${timestamp}` (não UUID, mantém ordem temporal)
- Propriedades: `prop_${id}`, Quadras: `quad_${id}`, Projetos: `proj_${id}`
- Status: `draft | pending_sync | synced` (surveys), `pending | completed` (properties)

## 🔌 Integrações Críticas

**Supabase Storage** (`syncService.ts`)
- Bucket: `reurb-vistoria` com pastas: `/images/`, `/signatures/`
- Headers: Bearer token ANON_KEY, multipart de Base64
- Retry automático em SyncService — não implementar retry em chamadas individuais

**Expo SQLite** (`expo-sqlite` v14)
- Async methods: `openDatabaseAsync()`, `execAsync()`, `getFirstAsync()`, `getAllAsync()`
- JSON armazenado como TEXT (parsed no app)
- Foreign keys com CASCADE — cuidado com delete em Projects

**Axios** para HTTP (syncService, mock de uploads)
- Timeout 5s para connectivity check
- Não usar para APIs — Supabase via browser/axios direto

## ⚠️ Áreas Críticas & Troubleshooting

**Sincronização**
- `findDirtySurveys()` pega status='pending_sync' e is_dirty=1
- Marcar synced: `surveyRepo.markAsSynced(id)` + status update
- Falha de upload: retry automático, não drop de dados

**Permissões Camera/GPS**
- Expo handles via `expo-camera`, `expo-location`
- Testar em device real — emulador tem GPS mockado
- AccuracyFilter: minAccuracy=15m em GPSLocationCapture

**Dados duplicados**
- Schema: PRIMARY KEY em id, índices em project_id/quadra_id/property_id
- INSERT OR IGNORE em sync retry para idempotência

---

**Última atualização:** 2026-01-15  
**Stack:** React Native 0.73 | Expo 51 | Zustand | TypeScript 5.3
