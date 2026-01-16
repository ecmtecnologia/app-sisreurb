const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * Verifica integridade referencial do banco de dados
 * Valida: Projects → Quadras → Properties → Surveys
 */
async function verifyIntegrity() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, 'sisreurb.db');

    if (!fs.existsSync(dbPath)) {
      console.error('❌ Banco de dados não encontrado:', dbPath);
      reject(new Error('sisreurb.db não existe'));
      return;
    }

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Erro ao abrir banco:', err.message);
        reject(err);
        return;
      }

      console.log('✅ Banco de dados aberto\n');
      
      let stats = {
        projects: 0,
        quadras: 0,
        properties: 0,
        surveys: 0,
        integrity: {
          orphanedQuadras: 0,
          orphanedProperties: 0,
          orphanedSurveys: 0,
          validRelationships: 0
        },
        statusBreakdown: {},
        quadrasBreakdown: {}
      };

      const queries = [
        {
          name: 'Count Projects',
          sql: 'SELECT COUNT(*) as count FROM reurb_projects',
          process: (row) => { stats.projects = row.count; }
        },
        {
          name: 'Count Quadras',
          sql: 'SELECT COUNT(*) as count FROM reurb_quadras',
          process: (row) => { stats.quadras = row.count; }
        },
        {
          name: 'Count Properties',
          sql: 'SELECT COUNT(*) as count FROM reurb_properties',
          process: (row) => { stats.properties = row.count; }
        },
        {
          name: 'Count Surveys',
          sql: 'SELECT COUNT(*) as count FROM reurb_surveys',
          process: (row) => { stats.surveys = row.count; }
        },
        {
          name: 'Orphaned Quadras',
          sql: `SELECT COUNT(*) as count FROM reurb_quadras q 
                WHERE NOT EXISTS (SELECT 1 FROM reurb_projects p WHERE p.id = q.project_id)`,
          process: (row) => { stats.integrity.orphanedQuadras = row.count; }
        },
        {
          name: 'Orphaned Properties',
          sql: `SELECT COUNT(*) as count FROM reurb_properties pr 
                WHERE NOT EXISTS (SELECT 1 FROM reurb_quadras q WHERE q.id = pr.quadra_id)`,
          process: (row) => { stats.integrity.orphanedProperties = row.count; }
        },
        {
          name: 'Orphaned Surveys',
          sql: `SELECT COUNT(*) as count FROM reurb_surveys s 
                WHERE NOT EXISTS (SELECT 1 FROM reurb_properties p WHERE p.id = s.property_id)`,
          process: (row) => { stats.integrity.orphanedSurveys = row.count; }
        },
        {
          name: 'Valid Relationships',
          sql: `SELECT COUNT(*) as count FROM reurb_properties pr 
                WHERE EXISTS (SELECT 1 FROM reurb_quadras q WHERE q.id = pr.quadra_id)`,
          process: (row) => { stats.integrity.validRelationships = row.count; }
        },
        {
          name: 'Properties Status Breakdown',
          sql: `SELECT status, COUNT(*) as count FROM reurb_properties GROUP BY status ORDER BY count DESC`,
          process: (row) => { stats.statusBreakdown[row.status] = row.count; }
        },
        {
          name: 'Properties per Quadra',
          sql: `SELECT q.name, COUNT(pr.id) as count FROM reurb_quadras q 
                LEFT JOIN reurb_properties pr ON pr.quadra_id = q.id 
                GROUP BY q.id ORDER BY count DESC`,
          process: (row) => { stats.quadrasBreakdown[row.name] = row.count; }
        }
      ];

      let queryIndex = 0;

      const executeQuery = () => {
        if (queryIndex >= queries.length) {
          // Fim - gerar relatório
          generateReport(stats);
          db.close((err) => {
            if (err) console.error('Erro ao fechar:', err.message);
            resolve(stats);
          });
          return;
        }

        const query = queries[queryIndex];
        console.log(`🔍 ${query.name}...`);

        if (query.name.includes('Breakdown')) {
          // Query retorna múltiplas linhas
          db.all(query.sql, (err, rows) => {
            if (err) {
              console.error(`❌ Erro:`, err.message);
              queryIndex++;
              executeQuery();
              return;
            }
            rows.forEach(row => query.process(row));
            queryIndex++;
            executeQuery();
          });
        } else {
          // Query retorna uma linha
          db.get(query.sql, (err, row) => {
            if (err) {
              console.error(`❌ Erro:`, err.message);
              queryIndex++;
              executeQuery();
              return;
            }
            if (row) query.process(row);
            queryIndex++;
            executeQuery();
          });
        }
      };

      executeQuery();
    });
  });
}

function generateReport(stats) {
  const isHealthy = stats.integrity.orphanedQuadras === 0 && 
                    stats.integrity.orphanedProperties === 0 && 
                    stats.integrity.orphanedSurveys === 0;

  const report = `# 📊 Relatório de Integridade do Banco de Dados - REURB

**Data:** ${new Date().toLocaleString('pt-BR')}
**Status Geral:** ${isHealthy ? '✅ ÍNTEGRO' : '❌ COM PROBLEMAS'}

## 📈 Contagem de Registros

| Tabela | Quantidade |
|--------|-----------|
| **Projects** | ${stats.projects} |
| **Quadras** | ${stats.quadras} |
| **Properties (Lotes)** | ${stats.properties} |
| **Surveys** | ${stats.surveys} |

## 🔗 Validação de Relacionamentos

| Validação | Resultado |
|-----------|----------|
| Quadras órfãs (sem project) | ${stats.integrity.orphanedQuadras === 0 ? '✅ 0' : '❌ ' + stats.integrity.orphanedQuadras} |
| Properties órfãs (sem quadra) | ${stats.integrity.orphanedProperties === 0 ? '✅ 0' : '❌ ' + stats.integrity.orphanedProperties} |
| Surveys órfãs (sem property) | ${stats.integrity.orphanedSurveys === 0 ? '✅ 0' : '❌ ' + stats.integrity.orphanedSurveys} |
| Properties válidas | ✅ ${stats.integrity.validRelationships} / ${stats.properties} |

## 📋 Distribuição de Propriedades por Status

\`\`\`
${Object.entries(stats.statusBreakdown)
  .map(([status, count]) => `${status.padEnd(20)} : ${String(count).padStart(4)} registros`)
  .join('\n')}
\`\`\`

## 🗺️ Distribuição de Propriedades por Quadra

\`\`\`
${Object.entries(stats.quadrasBreakdown)
  .sort((a, b) => b[1] - a[1])
  .map(([quadra, count]) => `Quadra ${quadra.padEnd(10)} : ${String(count).padStart(4)} lotes`)
  .join('\n')}
\`\`\`

## ✅ Conclusão

${isHealthy ? `
**Status:** 🎉 BANCO DE DADOS ÍNTEGRO

Todos os registros possuem relacionamentos válidos:
- Todas as quadras estão vinculadas a projetos válidos
- Todas as propriedades estão vinculadas a quadras válidas
- Nenhuma survey órfã encontrada

O banco de dados está pronto para uso em produção!
` : `
**Status:** ⚠️ PROBLEMAS DETECTADOS

Existem registros inconsistentes:
- Quadras órfãs: ${stats.integrity.orphanedQuadras}
- Properties órfãs: ${stats.integrity.orphanedProperties}
- Surveys órfãs: ${stats.integrity.orphanedSurveys}

Recomendação: Executar limpeza de dados.
`}

---
*Relatório gerado automaticamente em ${new Date().toISOString()}*
`;

  const reportPath = path.join(__dirname, 'INTEGRITY_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log(report);
  console.log('='.repeat(60));
  console.log(`\n✅ Relatório salvo em: INTEGRITY_REPORT.md`);
}

// Executar
verifyIntegrity()
  .then(() => {
    console.log('\n✅ Verificação de integridade concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha:', error.message);
    process.exit(1);
  });
