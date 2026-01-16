/**
 * Seed Database Script
 * Populates app-sisreurb database with initial data
 */

import DatabaseService from './init';
import fs from 'fs';
import path from 'path';

export async function seedDatabase(dbPath: string = './sisreurb.db'): Promise<void> {
  const db = new DatabaseService(dbPath);

  try {
    console.log('🌱 Starting database seeding...');
    await db.init();

    // Seed files to execute in order
    const seedFiles = ['seed.sql', 'seed-properties-completo.sql'];

    for (const seedFile of seedFiles) {
      const seedPath = path.join(__dirname, seedFile);
      
      if (!fs.existsSync(seedPath)) {
        console.warn(`⚠️  Seed file not found: ${seedFile}`);
        continue;
      }

      console.log(`\n📂 Executing ${seedFile}...`);
      const seedSQL = fs.readFileSync(seedPath, 'utf-8');

      // Execute seed statements
      const statements = seedSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        console.log(`  ➜ ${statement.substring(0, 60).replace(/\n/g, ' ')}...`);
        // Using a workaround since db.run is private
        await new Promise<void>((resolve, reject) => {
          (db as any).db.run(statement, function(err: any) {
            if (err) {
              reject(new Error(`Seed Error: ${err.message}`));
            } else {
              console.log(`    ✓ (changes: ${this.changes})`);
              resolve();
            }
          });
        });
      }
    }

    // Show statistics
    const stats = await db.getStats();
    console.log('\n📊 Database Statistics After Seeding:');
    console.log(JSON.stringify(stats, null, 2));

    await db.close();
    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Execute seed if run directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
