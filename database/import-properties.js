const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * Converte arquivo SQL do Supabase para SQLite e insere na tabela de propriedades
 */
async function importPropertiesFromSupabase() {
  return new Promise((resolve, reject) => {
    try {
      const sqlFilePath = path.join(__dirname, 'reurb_properties_rows.sql');
      
      if (!fs.existsSync(sqlFilePath)) {
        console.error(`❌ Arquivo não encontrado: ${sqlFilePath}`);
        reject(new Error('Arquivo SQL não encontrado'));
        return;
      }

      console.log('📖 Lendo arquivo SQL...');
      let content = fs.readFileSync(sqlFilePath, 'utf-8');

      // 1. Remover referências de schema público
      content = content.replace(/"public"\./g, '');

      // 2. Converter INSERT INTO para INSERT OR REPLACE INTO
      content = content.replace(/INSERT INTO/g, 'INSERT OR REPLACE INTO');

      // 3. Converter ARRAY[...] para JSON strings
      content = content.replace(/ARRAY\[(.*?)\]/g, (match, arrayContent) => {
        return `'[${arrayContent}]'`;
      });

      // 4. Converter booleanos
      content = content.replace(/'true'/g, "1").replace(/'false'/g, "0");

      // 5. Extrair valores do INSERT
      const valuesMatch = content.match(/VALUES\s*(.*);/is);
      if (!valuesMatch) {
        console.error('❌ Não foi possível extrair os valores do arquivo SQL');
        reject(new Error('Formato de VALUES não encontrado'));
        return;
      }

      const valuesContent = valuesMatch[1];
      
      // Dividir por registros
      const records = valuesContent.split(/\),\s*\(/);
      
      // Limpar cada registro
      const cleanRecords = records.map((record, index) => {
        let clean = record.trim();
        if (index === 0) clean = clean.replace(/^\(/, '');
        if (index === records.length - 1) clean = clean.replace(/\)$/, '');
        return clean;
      });

      console.log(`✅ Encontrados ${cleanRecords.length} registros\n`);

      // Abrir/criar banco de dados
      const dbPath = path.join(__dirname, 'sisreurb.db');
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ Erro ao abrir banco de dados:', err.message);
          reject(err);
          return;
        }

        console.log('✅ Banco de dados aberto');

        // Habilitar foreign keys
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.error('❌ Erro ao habilitar foreign keys:', err.message);
            reject(err);
            return;
          }

          // Limpar tabela
          console.log('🗑️  Limpando tabela de propriedades...');
          db.run(
            `DELETE FROM reurb_properties WHERE quadra_id IN (
              SELECT id FROM reurb_quadras WHERE project_id = '52b2eaac-a079-4e3a-90c7-cc6be700d8d1'
            )`,
            (err) => {
              if (err) {
                console.error('❌ Erro ao limpar tabela:', err.message);
                reject(err);
                return;
              }

              console.log('✅ Tabela limpa\n');

              // Inserir em lotes
              const batchSize = 100;
              let inserted = 0;
              let batchNumber = 0;

              const insertNextBatch = () => {
                const startIdx = batchNumber * batchSize;
                const endIdx = Math.min(startIdx + batchSize, cleanRecords.length);

                if (startIdx >= cleanRecords.length) {
                  // Fim - verificar resultado final
                  db.all('SELECT COUNT(*) as count FROM reurb_properties', (err, rows) => {
                    if (err) {
                      console.error('❌ Erro ao contar:', err.message);
                      db.close();
                      reject(err);
                      return;
                    }

                    const finalCount = rows[0].count;
                    console.log(`\n📊 Resultado Final:`);
                    console.log(`   ✅ ${finalCount} registros na tabela de propriedades`);
                    console.log(`\n✅ Importação concluída!`);
                    
                    db.close((err) => {
                      if (err) console.error('Erro ao fechar:', err.message);
                      resolve(finalCount);
                    });
                  });
                  return;
                }

                const batch = cleanRecords.slice(startIdx, endIdx);
                const insertSql = `INSERT OR REPLACE INTO reurb_properties (
                  id, quadra_id, name, area, description, latitude, longitude, status, 
                  images, created_at, updated_at, address, tipo_posse, situacao_fundiaria, 
                  documentos_comprobatorios, historico_ocupacao, restricoes_ambientais, 
                  situacao_cadastral, area_terreno, area_construida, matricula_imovel, 
                  data_ocupacao, possui_conflito, descricao_conflito
                ) VALUES ${batch.map((r) => `(${r})`).join(', ')}`;

                db.run(insertSql, (err) => {
                  if (err) {
                    console.error(`❌ Erro ao inserir lote ${batchNumber + 1}:`, err.message);
                    console.error('SQL snippet:', insertSql.substring(0, 200) + '...');
                    db.close();
                    reject(err);
                    return;
                  }

                  inserted += batch.length;
                  console.log(`✅ Lote ${batchNumber + 1}: ${batch.length} registros (Total: ${inserted})`);
                  batchNumber++;
                  
                  // Próximo lote
                  setImmediate(insertNextBatch);
                });
              };

              insertNextBatch();
            }
          );
        });
      });
    } catch (error) {
      console.error('❌ Erro geral:', error.message);
      reject(error);
    }
  });
}

importPropertiesFromSupabase()
  .then((count) => {
    console.log(`\n🎉 ${count} registros importados com sucesso!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na importação:', error.message);
    process.exit(1);
  });
