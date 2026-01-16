# Database Module

Gerenciamento de banco de dados SQLite para aplicação PWA **app-sisreurb**.

## Arquivos

### `schema.sql`
Define o schema completo do banco de dados SQLite com as seguintes tabelas:

- **reurb_projects** - Projetos REURB
- **reurb_quadras** - Quadras dentro de projetos
- **reurb_properties** - Propriedades/lotes dentro de quadras
- **reurb_surveys** - Vistorias realizadas em propriedades

Inclui índices para otimização de consultas frequentes.

### `init.ts`
Classe `DatabaseService` que gerencia:
- Inicialização do banco de dados
- Execução de schemas SQL
- Operações CRUD básicas (`run`, `all`, `get`, `insert`, `update`, `delete`)
- Gestão de conexões
- Estatísticas do banco

**Uso:**
```typescript
const db = new DatabaseService('./sisreurb.db');
await db.init();
const projects = await db.all('SELECT * FROM reurb_projects');
await db.close();
```

### `repositories.ts`
Implementação do padrão Repository para cada entidade:

- **ProjectRepository** - Operações com projetos
- **QuadraRepository** - Operações com quadras
- **PropertyRepository** - Operações com propriedades
- **SurveyRepository** - Operações com vistorias

Cada repository fornece:
- CRUD padrão (`findById`, `findAll`, `create`, `update`, `delete`)
- Consultas especializadas (`findByProjectId`, `findDirtySurveys`, etc.)
- Controle de sincronização (para PWA offline)

**Uso:**
```typescript
const db = new DatabaseService('./sisreurb.db');
await db.init();

const projectRepo = new ProjectRepository(db);
const projects = await projectRepo.findByCity('Macapá');
const newProjectId = await projectRepo.create({ id: 'proj-1', name: 'Novo Projeto' });
```

## Características

- ✅ Foreign keys com CASCADE delete
- ✅ Índices para otimização de queries
- ✅ Suporte a sincronização offline (is_dirty, last_sync)
- ✅ Campos para análise de IA
- ✅ Dados de geolocalização (latitude, longitude)
- ✅ Armazenamento de JSON como TEXT
- ✅ Timestamps de auditoria

## Sincronização com Supabase

Surveys com `is_dirty = 1` precisam ser sincronizados com Supabase:

```typescript
const surveyRepo = new SurveyRepository(db);
const dirtySurveys = await surveyRepo.findDirtySurveys();

for (const survey of dirtySurveys) {
  // Sincronizar com Supabase
  await supabase.from('reurb_surveys').upsert(survey);
  // Marcar como sincronizado
  await surveyRepo.markAsSynced(survey.id);
}
```

## Seed Data

### `seed.sql`
Dados iniciais de teste/desenvolvimento incluem:
- Projeto Marabaixo 1 (Macapá)
- Projeto Oiapoque

### `seed.ts`
Script para executar o seed automaticamente:

```bash
# Executar seed (Node.js)
npx ts-node database/seed.ts

# Ou integrar na inicialização da app
import seedDatabase from './database/seed';
await seedDatabase('./sisreurb.db');
```

## Desenvolvimento

Para adicionar novas features ao banco:
1. Atualizar `schema.sql` com novas tabelas/campos
2. Criar novo Repository em `repositories.ts`
3. Adicionar dados de teste em `seed.sql`
4. Implementar migrations se aplicável
