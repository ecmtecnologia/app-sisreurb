const fs = require('fs');
const path = require('path');

/**
 * Converte arquivo SQL do Supabase para SQLite e gera arquivo SQL limpo
 * Sem dependências externas!
 */
function convertSupabaseToSQLite() {
  try {
    const sqlFilePath = path.join(__dirname, 'reurb_properties_rows.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`❌ Arquivo não encontrado: ${sqlFilePath}`);
      process.exit(1);
    }

    console.log('📖 Lendo arquivo SQL do Supabase...');
    let content = fs.readFileSync(sqlFilePath, 'utf-8');
    const totalSize = (content.length / 1024 / 1024).toFixed(2);
    console.log(`   Tamanho: ${totalSize} MB`);

    // 1. Remover referências de schema público
    console.log('🔄 Removendo schemas públicos...');
    content = content.replace(/"public"\./g, '');

    // 2. Converter INSERT INTO para INSERT OR REPLACE INTO
    console.log('🔄 Convertendo INSERT para INSERT OR REPLACE...');
    content = content.replace(/INSERT INTO/g, 'INSERT OR REPLACE INTO');

    // 3. Converter ARRAY[...] para JSON strings
    console.log('🔄 Convertendo ARRAY para JSON strings...');
    content = content.replace(/ARRAY\[(.*?)\]/g, (match, arrayContent) => {
      return `'[${arrayContent}]'`;
    });

    // 4. Converter booleanos
    console.log('🔄 Convertendo booleanos...');
    content = content.replace(/'true'/g, "1").replace(/'false'/g, "0");

    // 5. Extrair valores do INSERT
    console.log('📊 Extraindo registros...');
    const valuesMatch = content.match(/VALUES\s*(.*);/is);
    if (!valuesMatch) {
      console.error('❌ Não foi possível extrair os valores do arquivo SQL');
      process.exit(1);
    }

    const valuesContent = valuesMatch[1];
    
    // Dividir por registros - mais robusto
    let records = [];
    let depth = 0;
    let currentRecord = '';

    for (let i = 0; i < valuesContent.length; i++) {
      const char = valuesContent[i];
      
      if (char === '(') depth++;
      if (char === ')') depth--;
      
      currentRecord += char;
      
      // Quando depth volta a 0, temos um registro completo
      if (depth === 0 && char === ')' && currentRecord.trim().length > 2) {
        records.push(currentRecord.trim());
        currentRecord = '';
        
        // Pular a vírgula
        if (valuesContent[i + 1] === ',') {
          i += 1;
          while (valuesContent[i + 1] === ' ' || valuesContent[i + 1] === '\n' || valuesContent[i + 1] === '\t') {
            i++;
          }
        }
      }
    }

    console.log(`✅ Encontrados ${records.length} registros\n`);

    // 6. Dividir em lotes e gerar arquivos SQL
    const batchSize = 100;
    const header = `-- app-sisreurb Propriedades (Lotes) - Convertidas do Supabase
-- Data: ${new Date().toLocaleString('pt-BR')}
-- Total de registros neste arquivo: `;

    let totalRecords = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const filename = path.join(__dirname, `seed-properties-parte-${batchNumber}.sql`);

      const sql = `${header}${batch.length}

INSERT OR REPLACE INTO reurb_properties (
  id, quadra_id, name, area, description, latitude, longitude, status, 
  images, created_at, updated_at, address, tipo_posse, situacao_fundiaria, 
  documentos_comprobatorios, historico_ocupacao, restricoes_ambientais, 
  situacao_cadastral, area_terreno, area_construida, matricula_imovel, 
  data_ocupacao, possui_conflito, descricao_conflito
) VALUES
${batch.map((r) => r).join(',\n')};
`;

      fs.writeFileSync(filename, sql, 'utf-8');
      totalRecords += batch.length;
      console.log(`✅ Arquivo gerado: seed-properties-parte-${batchNumber}.sql (${batch.length} registros)`);
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Total de registros: ${totalRecords}`);
    console.log(`   ✅ Arquivos gerados: ${Math.ceil(records.length / batchSize)}`);
    console.log(`\n💡 Próximo passo: Execute os arquivos SQL gerados no banco de dados`);
    console.log(`   Exemplo: cat seed-properties-parte-*.sql | sqlite3 sisreurb.db`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

convertSupabaseToSQLite();
console.log('\n✅ Conversão concluída!');
