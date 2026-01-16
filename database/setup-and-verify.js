#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script completo para inicializar banco e verificar integridade
 * Passos:
 * 1. Limpar banco anterior (se houver)
 * 2. Executar schema.sql
 * 3. Executar seed.sql
 * 4. Executar seed-properties-completo.sql
 * 5. Verificar integridade
 */

console.log('🚀 Iniciando processo de seed e validação...\n');

const dbDir = __dirname;
const dbPath = path.join(dbDir, 'sisreurb.db');
const seedAllPath = path.join(dbDir, 'seed-all.sql');

// Verificar se arquivo seed-all.sql existe
if (!fs.existsSync(seedAllPath)) {
  console.error('❌ Arquivo seed-all.sql não encontrado!');
  console.log('   Execute primeiro: node convert-supabase.js');
  process.exit(1);
}

console.log('📁 Arquivos encontrados:');
console.log(`   ✅ seed-all.sql (${(fs.statSync(seedAllPath).size / 1024 / 1024).toFixed(2)} MB)`);

// Remover banco anterior
if (fs.existsSync(dbPath)) {
  console.log('\n🗑️  Removendo banco anterior...');
  fs.unlinkSync(dbPath);
  console.log('   ✅ Removido');
}

// Tentar usar sqlite3 CLI (se disponível no sistema)
console.log('\n🔍 Verificando sqlite3 CLI...');
try {
  const version = execSync('sqlite3 --version', { encoding: 'utf-8' });
  console.log(`   ✅ Encontrado: ${version.split('\n')[0]}`);
  
  console.log('\n📂 Executando SQL via sqlite3 CLI...');
  execSync(`sqlite3 "${dbPath}" < "${seedAllPath}"`, { 
    stdio: 'inherit',
    cwd: dbDir 
  });
  
  console.log('\n✅ Seeds executados com sucesso!\n');
  
  // Agora verificar integridade
  console.log('🔍 Verificando integridade dos dados...\n');
  const verifyScript = path.join(dbDir, 'verify-db-integrity.js');
  if (fs.existsSync(verifyScript)) {
    try {
      execSync(`node "${verifyScript}"`, { 
        stdio: 'inherit',
        cwd: dbDir 
      });
    } catch (e) {
      console.error('⚠️  Erro ao verificar integridade:', e.message);
    }
  }
  
  console.log('\n🎉 Processo concluído!');
  console.log(`\n📊 Banco de dados criado: ${dbPath}`);
  
} catch (error) {
  console.log('❌ sqlite3 CLI não encontrado no sistema');
  console.log('\n💡 Alternativas:');
  console.log('   1. Instale sqlite3: https://www.sqlite.org/download.html');
  console.log('   2. Use um GUI: https://sqlitebrowser.org/');
  console.log('   3. Execute manualmente: sqlite3 database/sisreurb.db < database/seed-all.sql');
  process.exit(1);
}
