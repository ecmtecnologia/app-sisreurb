import fs from 'fs';
import path from 'path';
import { DatabaseService } from './init';

/**
 * Converte arquivo SQL do Supabase para SQLite e insere na tabela de propriedades
 * Lida com:
 * - ARRAY[...] → JSON strings
 * - Booleanos true/false → 0/1
 * - Schemas públicos
 */
async function importPropertiesFromSupabase() {
  try {
    const sqlFilePath = path.join(__dirname, 'reurb_properties_rows.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`❌ Arquivo não encontrado: ${sqlFilePath}`);
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
      // Formata o conteúdo do array como JSON string
      return `'[${arrayContent}]'`;
    });

    // 4. Converter booleanos
    content = content.replace(/'true'/g, "1").replace(/'false'/g, "0");

    // 5. Extrair valores do INSERT
    const valuesMatch = content.match(/VALUES\s*(.*);/is);
    if (!valuesMatch) {
      console.error('❌ Não foi possível extrair os valores do arquivo SQL');
      return;
    }

    const valuesContent = valuesMatch[1];
    
    // Dividir por registros (cada um começa com '(')
    const records = valuesContent.split(/\),\s*\(/);
    
    // Limpar cada registro
    const cleanRecords = records.map((record, index) => {
      let clean = record.trim();
      if (index === 0) clean = clean.replace(/^\(/, '');
      if (index === records.length - 1) clean = clean.replace(/\)$/, '');
      return clean;
    });

    console.log(`✅ Encontrados ${cleanRecords.length} registros`);

    // Inicializar banco de dados
    const db = new DatabaseService();
    await db.init();

    // 6. Limpar tabela antes de inserir
    console.log('🗑️  Limpando tabela de propriedades...');
    await db.run(
      `DELETE FROM reurb_properties WHERE quadra_id IN (
        SELECT id FROM reurb_quadras WHERE project_id = '52b2eaac-a079-4e3a-90c7-cc6be700d8d1'
      )`,
      []
    );

    // 7. Inserir em lotes
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < cleanRecords.length; i += batchSize) {
      const batch = cleanRecords.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      const insertSql = `INSERT OR REPLACE INTO reurb_properties (
        id, quadra_id, name, area, description, latitude, longitude, status, 
        images, created_at, updated_at, address, tipo_posse, situacao_fundiaria, 
        documentos_comprobatorios, historico_ocupacao, restricoes_ambientais, 
        situacao_cadastral, area_terreno, area_construida, matricula_imovel, 
        data_ocupacao, possui_conflito, descricao_conflito
      ) VALUES ${batch.map((r) => `(${r})`).join(', ')}`;

      try {
        await db.run(insertSql, []);
        inserted += batch.length;
        console.log(`✅ Lote ${batchNumber}: ${batch.length} registros inseridos (Total: ${inserted})`);
      } catch (error: any) {
        console.error(`❌ Erro ao inserir lote ${batchNumber}:`, error.message);
      }
    }

    // 8. Verificar resultado final
    const stats = await db.getStats();
    console.log('\n📊 Resultado Final:');
    console.log(`   Projects: ${stats.projects}`);
    console.log(`   Quadras: ${stats.quadras}`);
    console.log(`   Properties: ${stats.properties}`);
    console.log(`   Surveys: ${stats.surveys}`);

    console.log(`\n✅ Importação concluída! ${inserted} registros inseridos.`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro na importação:', error.message);
    process.exit(1);
  }
}

importPropertiesFromSupabase();
