const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * Inicializa banco SQLite e executa todos os seeds
 */
async function runSeeds() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, 'sisreurb.db');
    
    // Remover DB anterior se existir
    if (fs.existsSync(dbPath)) {
      console.log('🗑️  Removendo banco anterior...');
      fs.unlinkSync(dbPath);
    }

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Erro ao criar banco:', err.message);
        reject(err);
        return;
      }

      console.log('✅ Banco criado em:', dbPath);

      // Habilitar foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('❌ Erro ao habilitar foreign keys:', err.message);
          reject(err);
          return;
        }

        // Executar schema primeiro
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
          console.error('❌ Arquivo schema.sql não encontrado');
          reject(new Error('schema.sql não existe'));
          return;
        }

        console.log('\n📂 Executando schema.sql...');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        
        db.exec(schema, (err) => {
          if (err) {
            console.error('❌ Erro ao executar schema:', err.message);
            reject(err);
            return;
          }

          console.log('✅ Schema criado com sucesso\n');

          // Executar seed files em ordem
          const seedFiles = [
            'seed.sql',
            'seed-properties-completo.sql'
          ];

          let fileIndex = 0;

          const executeSeedFile = () => {
            if (fileIndex >= seedFiles.length) {
              // Fim - mostrar estatísticas
              console.log('\n📊 Estatísticas finais:');
              
              const queries = [
                { name: 'Projects', sql: 'SELECT COUNT(*) as count FROM reurb_projects' },
                { name: 'Quadras', sql: 'SELECT COUNT(*) as count FROM reurb_quadras' },
                { name: 'Properties', sql: 'SELECT COUNT(*) as count FROM reurb_properties' },
                { name: 'Surveys', sql: 'SELECT COUNT(*) as count FROM reurb_surveys' }
              ];

              let queryIndex = 0;
              const executeStatQuery = () => {
                if (queryIndex >= queries.length) {
                  db.close((err) => {
                    if (err) console.error('Erro ao fechar:', err.message);
                    console.log('\n✅ Seeds executados com sucesso!\n');
                    resolve();
                  });
                  return;
                }

                const query = queries[queryIndex];
                db.get(query.sql, (err, row) => {
                  if (err) {
                    console.error(`❌ Erro ao contar ${query.name}:`, err.message);
                  } else {
                    console.log(`   ✅ ${query.name}: ${row.count}`);
                  }
                  queryIndex++;
                  executeStatQuery();
                });
              };

              executeStatQuery();
              return;
            }

            const seedFile = seedFiles[fileIndex];
            const seedPath = path.join(__dirname, seedFile);

            if (!fs.existsSync(seedPath)) {
              console.warn(`⚠️  Arquivo ${seedFile} não encontrado`);
              fileIndex++;
              executeSeedFile();
              return;
            }

            console.log(`📂 Executando ${seedFile}...`);
            const seedSQL = fs.readFileSync(seedPath, 'utf-8');
            
            // Dividir por statements (;)
            const statements = seedSQL
              .split(';')
              .map(stmt => stmt.trim())
              .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            console.log(`   Encontrados ${statements.length} statements\n`);

            let stmtIndex = 0;

            const executeStatement = () => {
              if (stmtIndex >= statements.length) {
                console.log(`✅ ${seedFile} executado com sucesso!\n`);
                fileIndex++;
                executeSeedFile();
                return;
              }

              const statement = statements[stmtIndex];
              const preview = statement.substring(0, 60).replace(/\n/g, ' ');
              
              db.run(statement, function(err) {
                if (err) {
                  console.error(`❌ Erro no statement:`, err.message);
                  console.error(`   SQL: ${preview}...`);
                  reject(err);
                  return;
                }

                if (stmtIndex % 50 === 0) {
                  console.log(`   ✅ ${stmtIndex}/${statements.length} - ${preview}...`);
                }

                stmtIndex++;
                setImmediate(executeStatement);
              });
            };

            executeStatement();
          };

          executeSeedFile();
        });
      });
    });
  });
}

// Executar
runSeeds()
  .then(() => {
    console.log('🎉 Processo concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha:', error.message);
    process.exit(1);
  });
